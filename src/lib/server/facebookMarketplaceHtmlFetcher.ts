type FetchTransport = 'http' | 'playwright';

export interface HtmlValidationFailure {
  reason: string;
  status?: number;
  details?: string;
}

export type HtmlContentValidator = (html: string) => HtmlValidationFailure | null;

export interface MarketplaceHtmlFetchAttempt {
  url: string;
  status: number;
  reason: string;
  transport: FetchTransport;
}

export interface MarketplaceHtmlFetchResult {
  html: string;
  status: number;
  sourceUrl: string;
  attemptedUrls: string[];
  attempts: MarketplaceHtmlFetchAttempt[];
  transport: FetchTransport;
  usedBootstrapCookies: boolean;
  usedPlaywrightBootstrap: boolean;
  playwrightConnectionMode?: 'cdp' | 'playwright';
}

export interface FetchMarketplaceHtmlWithFallbackOptions {
  urls: string[];
  referer: string;
  bootstrapUrl?: string;
  timeoutMs?: number;
  bootstrapTimeoutMs?: number;
  mode?: 'auto' | 'http' | 'playwright';
  validators?: HtmlContentValidator[];
}

const DEFAULT_FETCH_TIMEOUT_MS = 12000;
const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 6000;
const MAX_ERROR_DETAILS_CHARS = 500;
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export class MarketplaceHtmlFetchError extends Error {
  status: number;

  details?: string;

  constructor(message: string, status = 502, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function trimErrorDetails(details: string | undefined): string | undefined {
  if (!details) {
    return undefined;
  }

  const compact = details.replace(/\s+/g, ' ').trim();
  return compact.slice(0, MAX_ERROR_DETAILS_CHARS);
}

function normalizeUpstreamStatus(status: number): number {
  return status >= 400 && status < 500 ? 502 : status;
}

function mergeCookieHeaders(cookieHeaders: Array<string | null | undefined>): string | null {
  const cookiePairs = Array.from(
    new Set(
      cookieHeaders
        .filter((cookieHeader): cookieHeader is string => Boolean(cookieHeader?.trim()))
        .flatMap((cookieHeader) =>
          cookieHeader
            .split(';')
            .map((pair) => pair.trim())
            .filter((pair) => pair.includes('=')),
        ),
    ),
  );

  return cookiePairs.length > 0 ? cookiePairs.join('; ') : null;
}

function splitSetCookieHeader(rawHeader: string): string[] {
  return rawHeader
    .split(/,(?=[^;,=\s]+=[^;,]+)/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function extractCookieHeaderFromResponse(response: Response): string | null {
  const responseHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookieHeaders =
    typeof responseHeaders.getSetCookie === 'function'
      ? responseHeaders.getSetCookie()
      : (() => {
          const singleSetCookie = response.headers.get('set-cookie');
          return singleSetCookie ? splitSetCookieHeader(singleSetCookie) : [];
        })();

  return mergeCookieHeaders(setCookieHeaders.map((headerValue) => headerValue.split(';')[0]));
}

function dedupeUrls(urls: string[]): string[] {
  const uniqueUrls: string[] = [];
  const seen = new Set<string>();

  for (const rawUrl of urls) {
    const normalizedUrl = rawUrl.trim();

    if (!normalizedUrl || seen.has(normalizedUrl)) {
      continue;
    }

    seen.add(normalizedUrl);
    uniqueUrls.push(normalizedUrl);
  }

  return uniqueUrls;
}

function normalizeBrowserlessWebSocketUrl(rawUrl: string): string {
  if (rawUrl.startsWith('ws://') || rawUrl.startsWith('wss://')) {
    return rawUrl;
  }

  if (rawUrl.startsWith('https://')) {
    return `wss://${rawUrl.slice('https://'.length)}`;
  }

  if (rawUrl.startsWith('http://')) {
    return `ws://${rawUrl.slice('http://'.length)}`;
  }

  return rawUrl;
}

function shouldEnablePlaywrightBootstrap(): boolean {
  return process.env.MARKETPLACE_PLAYWRIGHT_BOOTSTRAP?.trim().toLowerCase() === 'true';
}

function looksLikeTimeoutErrorMessage(message: string): boolean {
  return /timeout|timed out/i.test(message);
}

function resolveFetchTransport(mode: FetchMarketplaceHtmlWithFallbackOptions['mode']): FetchTransport {
  const modeFromEnv = process.env.MARKETPLACE_HTML_FETCH_MODE?.trim().toLowerCase();
  const resolvedMode = (mode ?? modeFromEnv ?? 'auto').toLowerCase();
  const hasBrowserlessWsUrl = Boolean(process.env.BROWSERLESS_WS_URL?.trim());

  if (resolvedMode === 'http') {
    return 'http';
  }

  if (resolvedMode === 'playwright') {
    if (!hasBrowserlessWsUrl) {
      throw new MarketplaceHtmlFetchError(
        'MARKETPLACE_HTML_FETCH_MODE=playwright requires BROWSERLESS_WS_URL.',
        500,
      );
    }

    return 'playwright';
  }

  if (resolvedMode === 'auto') {
    return hasBrowserlessWsUrl ? 'playwright' : 'http';
  }

  throw new MarketplaceHtmlFetchError(
    `Unsupported MARKETPLACE_HTML_FETCH_MODE value: ${resolvedMode}`,
    500,
  );
}

async function getBootstrapCookieHeader(input: {
  bootstrapUrl: string;
  referer: string;
  timeoutMs: number;
}): Promise<string | null> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, input.timeoutMs);

  try {
    const response = await fetch(input.bootstrapUrl, {
      method: 'GET',
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'user-agent': DEFAULT_USER_AGENT,
        referer: input.referer,
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: abortController.signal,
    });

    return extractCookieHeaderFromResponse(response);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchHtmlViaHttp(input: {
  url: string;
  referer: string;
  timeoutMs: number;
  cookieHeader: string | null;
}): Promise<{ html: string; status: number }> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, input.timeoutMs);

  try {
    const response = await fetch(input.url, {
      method: 'GET',
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'user-agent': DEFAULT_USER_AGENT,
        referer: input.referer,
        ...(input.cookieHeader ? { cookie: input.cookieHeader } : {}),
      },
      cache: 'no-store',
      signal: abortController.signal,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new MarketplaceHtmlFetchError(
        `Marketplace HTML request failed with status ${response.status}`,
        normalizeUpstreamStatus(response.status),
        trimErrorDetails(responseText),
      );
    }

    if (!responseText || responseText.trim().length === 0) {
      throw new MarketplaceHtmlFetchError('Marketplace HTML response was empty', 502);
    }

    return {
      html: responseText,
      status: response.status,
    };
  } catch (caughtError) {
    if (abortController.signal.aborted) {
      throw new MarketplaceHtmlFetchError('Marketplace HTML request timed out.', 504);
    }

    if (caughtError instanceof MarketplaceHtmlFetchError) {
      throw caughtError;
    }

    throw new MarketplaceHtmlFetchError(
      caughtError instanceof Error ? caughtError.message : 'Marketplace HTML request failed.',
      502,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchHtmlViaPlaywright(input: {
  url: string;
  referer: string;
  bootstrapUrl?: string;
  timeoutMs: number;
  cookieHeader: string | null;
}): Promise<{
  html: string;
  status: number;
  usedPlaywrightBootstrap: boolean;
  playwrightConnectionMode: 'cdp' | 'playwright';
}> {
  const browserlessWsUrl = process.env.BROWSERLESS_WS_URL?.trim();

  if (!browserlessWsUrl) {
    throw new MarketplaceHtmlFetchError(
      'BROWSERLESS_WS_URL is required for Playwright transport.',
      500,
    );
  }

  const resolvedBrowserlessWsUrl = normalizeBrowserlessWebSocketUrl(browserlessWsUrl);

  try {
    const { chromium } = await import('playwright-core');
    let browser: Awaited<ReturnType<typeof chromium.connect>> | null = null;
    let playwrightConnectionMode: 'cdp' | 'playwright' = 'playwright';

    const cdpErrorOrNull = await (async () => {
      try {
        browser = await chromium.connectOverCDP(resolvedBrowserlessWsUrl, {
          timeout: input.timeoutMs,
        });
        playwrightConnectionMode = 'cdp';
        return null;
      } catch (cdpError) {
        return cdpError;
      }
    })();

    if (!browser) {
      try {
        browser = await chromium.connect(resolvedBrowserlessWsUrl, {
          timeout: input.timeoutMs,
        });
        playwrightConnectionMode = 'playwright';
      } catch (playwrightError) {
        const cdpMessage =
          cdpErrorOrNull instanceof Error ? cdpErrorOrNull.message : 'unknown CDP error';
        const playwrightMessage =
          playwrightError instanceof Error ? playwrightError.message : 'unknown Playwright error';
        const mergedMessage = `Browserless connection failed (cdp: ${cdpMessage}; playwright: ${playwrightMessage})`;

        throw new MarketplaceHtmlFetchError(
          looksLikeTimeoutErrorMessage(mergedMessage)
            ? 'Marketplace Browserless connection timed out.'
            : mergedMessage,
          looksLikeTimeoutErrorMessage(mergedMessage) ? 504 : 502,
        );
      }
    }

    try {
      const context = await browser.newContext({
        userAgent: DEFAULT_USER_AGENT,
        locale: 'en-US',
        extraHTTPHeaders: {
          'accept-language': 'en-US,en;q=0.9',
          referer: input.referer,
          ...(input.cookieHeader ? { cookie: input.cookieHeader } : {}),
        },
      });

      try {
        const page = await context.newPage();
        await page.route('**/*', (route) => {
          const resourceType = route.request().resourceType();

          if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
            void route.abort();
            return;
          }

          void route.continue();
        });
        page.setDefaultNavigationTimeout(input.timeoutMs);
        page.setDefaultTimeout(input.timeoutMs);

        let usedPlaywrightBootstrap = false;

        if (input.bootstrapUrl) {
          try {
            await page.goto(input.bootstrapUrl, {
              waitUntil: 'commit',
              timeout: Math.min(input.timeoutMs, 5000),
            });
            usedPlaywrightBootstrap = true;
          } catch {
            // Best-effort bootstrap; continue to target page regardless.
          }
        }

        let response: Awaited<ReturnType<typeof page.goto>> | null = null;

        try {
          response = await page.goto(input.url, {
            waitUntil: 'commit',
            timeout: input.timeoutMs,
          });
        } catch (navigationError) {
          const navigationMessage =
            navigationError instanceof Error ? navigationError.message : 'unknown navigation error';
          throw new MarketplaceHtmlFetchError(
            looksLikeTimeoutErrorMessage(navigationMessage)
              ? 'Marketplace page navigation timed out.'
              : `Marketplace Playwright navigation failed: ${navigationMessage}`,
            looksLikeTimeoutErrorMessage(navigationMessage) ? 504 : 502,
          );
        }

        try {
          await page.waitForLoadState('domcontentloaded', { timeout: 2000 });
        } catch {
          // domcontentloaded is best-effort only for this workflow.
        }

        const html = await page.content();
        const status = response?.status() ?? 200;

        if (status >= 400) {
          throw new MarketplaceHtmlFetchError(
            `Marketplace HTML request failed with status ${status}`,
            normalizeUpstreamStatus(status),
            trimErrorDetails(html),
          );
        }

        if (!html || html.trim().length === 0) {
          throw new MarketplaceHtmlFetchError('Marketplace HTML response was empty', 502);
        }

        return {
          html,
          status,
          usedPlaywrightBootstrap,
          playwrightConnectionMode,
        };
      } finally {
        await context.close();
      }
    } finally {
      await browser.close();
    }
  } catch (caughtError) {
    if (caughtError instanceof MarketplaceHtmlFetchError) {
      throw caughtError;
    }

    const message =
      caughtError instanceof Error ? caughtError.message : 'Marketplace Playwright request failed.';
    const isTimeoutError = looksLikeTimeoutErrorMessage(message);

    throw new MarketplaceHtmlFetchError(
      isTimeoutError ? 'Marketplace HTML request timed out.' : message,
      isTimeoutError ? 504 : 502,
    );
  }
}

function runContentValidators(
  validators: HtmlContentValidator[] | undefined,
  html: string,
): HtmlValidationFailure | null {
  if (!validators || validators.length === 0) {
    return null;
  }

  for (const validator of validators) {
    const result = validator(html);

    if (result) {
      return result;
    }
  }

  return null;
}

export async function fetchMarketplaceHtmlWithFallback(
  options: FetchMarketplaceHtmlWithFallbackOptions,
): Promise<MarketplaceHtmlFetchResult> {
  const attemptedUrls = dedupeUrls(options.urls);

  if (attemptedUrls.length === 0) {
    throw new MarketplaceHtmlFetchError('Marketplace HTML request missing URL candidates.', 400);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const bootstrapTimeoutMs = options.bootstrapTimeoutMs ?? DEFAULT_BOOTSTRAP_TIMEOUT_MS;
  const transport = resolveFetchTransport(options.mode);
  const manualCookieHeader = process.env.FACEBOOK_COOKIE_HEADER?.trim() ?? null;
  const bootstrapCookieHeader =
    transport === 'http'
      ? await getBootstrapCookieHeader({
          bootstrapUrl: options.bootstrapUrl ?? 'https://www.facebook.com/marketplace/',
          referer: 'https://www.facebook.com/',
          timeoutMs: bootstrapTimeoutMs,
        })
      : null;
  const mergedCookieHeader = mergeCookieHeaders([manualCookieHeader, bootstrapCookieHeader]);
  const attempts: MarketplaceHtmlFetchAttempt[] = [];
  let lastError: MarketplaceHtmlFetchError | null = null;
  let usedPlaywrightBootstrap = false;
  let playwrightConnectionMode: 'cdp' | 'playwright' | undefined;

  for (const candidateUrl of attemptedUrls) {
    try {
      const result =
        transport === 'playwright'
          ? await fetchHtmlViaPlaywright({
              url: candidateUrl,
              referer: options.referer,
              bootstrapUrl: shouldEnablePlaywrightBootstrap() ? options.bootstrapUrl : undefined,
              timeoutMs,
              cookieHeader: mergedCookieHeader,
            })
          : {
              ...(await fetchHtmlViaHttp({
                url: candidateUrl,
                referer: options.referer,
                timeoutMs,
                cookieHeader: mergedCookieHeader,
              })),
              usedPlaywrightBootstrap: false,
            };

      if (result.usedPlaywrightBootstrap) {
        usedPlaywrightBootstrap = true;
      }

      if ('playwrightConnectionMode' in result) {
        playwrightConnectionMode = result.playwrightConnectionMode;
      }

      const validationFailure = runContentValidators(options.validators, result.html);

      if (validationFailure) {
        throw new MarketplaceHtmlFetchError(
          validationFailure.reason,
          validationFailure.status ?? 502,
          trimErrorDetails(validationFailure.details),
        );
      }

      return {
        html: result.html,
        status: result.status,
        sourceUrl: candidateUrl,
        attemptedUrls,
        attempts,
        transport,
        usedBootstrapCookies: Boolean(bootstrapCookieHeader),
        usedPlaywrightBootstrap,
        playwrightConnectionMode,
      };
    } catch (caughtError) {
      lastError =
        caughtError instanceof MarketplaceHtmlFetchError
          ? caughtError
          : new MarketplaceHtmlFetchError(
              caughtError instanceof Error
                ? caughtError.message
                : 'Marketplace HTML request failed.',
              502,
            );

      attempts.push({
        url: candidateUrl,
        status: lastError.status,
        reason: lastError.message,
        transport,
      });
    }
  }

  if (!lastError) {
    throw new MarketplaceHtmlFetchError('Marketplace HTML request failed.');
  }

  throw new MarketplaceHtmlFetchError(
    lastError.message,
    lastError.status,
    JSON.stringify(
      {
        attempts,
        transport,
        usedBootstrapCookies: Boolean(bootstrapCookieHeader),
        usedPlaywrightBootstrap,
        playwrightConnectionMode,
        finalDetails: trimErrorDetails(lastError.details),
      },
      null,
      2,
    ),
  );
}
