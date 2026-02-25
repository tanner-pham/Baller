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
  dismissedPlaywrightLoginInterstitial: boolean;
  capturedGraphqlPayloadCount: number;
  capturedGraphqlPayloadMatchingItemIdCount: number;
  usedInjectedSessionState: boolean;
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

function shouldRetryPlaywrightWithBootstrap(
  input: {
    html: string;
    capturedGraphqlPayloadCount: number;
    usedPlaywrightBootstrap: boolean;
  },
  bootstrapUrl: string | undefined,
  bootstrapEnabledByDefault: boolean,
): boolean {
  if (!bootstrapUrl || bootstrapEnabledByDefault || input.usedPlaywrightBootstrap) {
    return false;
  }

  const lowerHtml = input.html.toLowerCase();
  const hasAuthSignals =
    lowerHtml.includes('id="login_form"') ||
    lowerHtml.includes('see more on facebook') ||
    lowerHtml.includes('create new account') ||
    lowerHtml.includes('email or phone number');
  const hasMarketplaceSignals =
    lowerHtml.includes('marketplace_listing_title') ||
    lowerHtml.includes('"marketplace_search"') ||
    lowerHtml.includes('/marketplace/item/');

  return input.capturedGraphqlPayloadCount <= 3 && hasAuthSignals && !hasMarketplaceSignals;
}

type PlaywrightPageLike = {
  locator: (selector: string) => {
    first: () => {
      isVisible: (options?: { timeout?: number }) => Promise<boolean>;
      click: (options?: { timeout?: number }) => Promise<void>;
      boundingBox: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
    };
  };
  keyboard: { press: (key: string) => Promise<void> };
  mouse: {
    click: (x: number, y: number, options?: { delay?: number }) => Promise<void>;
    wheel: (deltaX: number, deltaY: number) => Promise<void>;
  };
  evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
  waitForTimeout: (timeout: number) => Promise<void>;
};

async function isFacebookLoginInterstitialVisible(page: PlaywrightPageLike): Promise<boolean> {
  const authSelectors = [
    'form#login_form',
    'input[name="email"]',
    'input[name="pass"]',
    'div[role="dialog"] input[placeholder*="Email"]',
    'div[role="dialog"] button:has-text("Log in")',
  ];

  for (const selector of authSelectors) {
    try {
      const control = page.locator(selector).first();

      if (await control.isVisible({ timeout: 250 })) {
        return true;
      }
    } catch {
      // Continue scanning selectors.
    }
  }

  return false;
}

async function dismissFacebookLoginInterstitial(page: PlaywrightPageLike): Promise<boolean> {
  const hadAuthInterstitial = await isFacebookLoginInterstitialVisible(page);

  if (!hadAuthInterstitial) {
    return false;
  }

  const closeSelectors = [
    '[aria-label="Close"]',
    '[aria-label="close"]',
    'svg[aria-label="Close"]',
    'div[role="button"][aria-label="Close"]',
    'div[role="dialog"] [role="button"][aria-label="Close"]',
    'div[role="dialog"] [aria-label="Close"]',
    'button:has-text("Close")',
    'div[role="button"]:has-text("Close")',
    'div[role="button"]:has-text("Not now")',
    'button:has-text("Not now")',
  ];

  for (const selector of closeSelectors) {
    try {
      const closeControl = page.locator(selector).first();
      const isVisible = await closeControl.isVisible({ timeout: 300 });

      if (!isVisible) {
        continue;
      }

      await closeControl.click({ timeout: 800 });
      await page.waitForTimeout(350);

      if (!(await isFacebookLoginInterstitialVisible(page))) {
        return true;
      }
    } catch {
      // Continue trying other selectors.
    }
  }

  try {
    const dialog = page.locator('div[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible({ timeout: 300 });

    if (dialogVisible) {
      const bounds = await dialog.boundingBox();

      if (bounds) {
        await page.mouse.click(bounds.x + bounds.width - 20, bounds.y + 20, { delay: 30 });
        await page.waitForTimeout(300);

        if (!(await isFacebookLoginInterstitialVisible(page))) {
          return true;
        }
      }
    }
  } catch {
    // Continue to Escape/evaluate fallbacks.
  }

  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);

    if (!(await isFacebookLoginInterstitialVisible(page))) {
      return true;
    }
  } catch {
    // Continue to DOM-force fallback.
  }

  try {
    await page.evaluate(() => {
      const dialogNodes = Array.from(document.querySelectorAll('div[role="dialog"]'));
      const authNodes = Array.from(
        document.querySelectorAll(
          'form#login_form, input[name="email"], input[name="pass"], div[aria-label="See more on Facebook"]',
        ),
      );

      for (const node of [...dialogNodes, ...authNodes]) {
        const removableNode = node.closest('div[role="dialog"]') ?? node;
        removableNode.remove();
      }

      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    });
    await page.waitForTimeout(200);
    await page.mouse.wheel(0, 450);
    await page.waitForTimeout(250);

    return !(await isFacebookLoginInterstitialVisible(page));
  } catch {
    return false;
  }
}

function extractMarketplaceItemIdFromUrl(rawUrl: string): string | null {
  try {
    const parsedUrl = new URL(rawUrl);
    const itemIdMatch = parsedUrl.pathname.match(/\/marketplace\/item\/(\d+)\/?/i);
    return itemIdMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function stripJsonHijackPrefix(value: string): string {
  let normalized = value.trim();

  const prefixes = ['for (;;);', 'while(1);', 'for(;;);'];

  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trim();
    }
  }

  return normalized;
}

function parsePossiblyWrappedJson(value: string): unknown | null {
  const trimmedValue = stripJsonHijackPrefix(value);

  if (!trimmedValue) {
    return null;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch {
    return null;
  }
}

function serializeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value).replace(/<\/script>/gi, '<\\/script>');
}

function parseCookieHeaderPairs(cookieHeader: string): Array<{ name: string; value: string }> {
  return cookieHeader
    .split(';')
    .map((pair) => pair.trim())
    .map((pair) => {
      const separatorIndex = pair.indexOf('=');

      if (separatorIndex <= 0) {
        return null;
      }

      const name = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();

      if (!name || !value) {
        return null;
      }

      return { name, value };
    })
    .filter((pair): pair is { name: string; value: string } => Boolean(pair));
}

function decodeStorageStateFromEnv(): unknown | null {
  const rawStorageStateB64 = process.env.FACEBOOK_PLAYWRIGHT_STORAGE_STATE_B64?.trim();

  if (!rawStorageStateB64) {
    return null;
  }

  try {
    const decodedJson = Buffer.from(rawStorageStateB64, 'base64').toString('utf8');
    return JSON.parse(decodedJson);
  } catch {
    return null;
  }
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
  manualCookieHeader: string | null;
  storageState: unknown | null;
}): Promise<{
  html: string;
  status: number;
  usedPlaywrightBootstrap: boolean;
  dismissedPlaywrightLoginInterstitial: boolean;
  capturedGraphqlPayloadCount: number;
  capturedGraphqlPayloadMatchingItemIdCount: number;
  usedInjectedSessionState: boolean;
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
        ...(input.storageState ? { storageState: input.storageState as never } : {}),
        extraHTTPHeaders: {
          'accept-language': 'en-US,en;q=0.9',
          referer: input.referer,
          ...(input.cookieHeader ? { cookie: input.cookieHeader } : {}),
        },
      });

      try {
        if (input.manualCookieHeader) {
          const cookiePairs = parseCookieHeaderPairs(input.manualCookieHeader);

          if (cookiePairs.length > 0) {
            const facebookUrls = ['https://www.facebook.com', 'https://m.facebook.com'];
            const cookies = facebookUrls.flatMap((facebookUrl) =>
              cookiePairs.map((cookiePair) => ({
                name: cookiePair.name,
                value: cookiePair.value,
                url: facebookUrl,
              })),
            );

            try {
              await context.addCookies(cookies);
            } catch {
              // Fallback to header-based cookies only.
            }
          }
        }

        const page = await context.newPage();
        const itemIdHint = extractMarketplaceItemIdFromUrl(input.url);
        const capturedPayloads: unknown[] = [];
        let capturedGraphqlPayloadMatchingItemIdCount = 0;

        page.on('response', (response) => {
          void (async () => {
            try {
              const responseUrl = response.url().toLowerCase();
              const isMarketplacePayload =
                responseUrl.includes('/api/graphql') ||
                responseUrl.includes('__bbox') ||
                responseUrl.includes('/ajax/') ||
                responseUrl.includes('marketplace');

              if (!isMarketplacePayload) {
                return;
              }

              const bodyText = await response.text();
              const parsedPayload = parsePossiblyWrappedJson(bodyText);
              const payloadMatchesItemIdHint =
                !itemIdHint ||
                bodyText.includes(itemIdHint) ||
                responseUrl.includes(itemIdHint.toLowerCase());

              if (!payloadMatchesItemIdHint) {
                return;
              }

              if (!parsedPayload) {
                return;
              }

              if (itemIdHint) {
                capturedGraphqlPayloadMatchingItemIdCount += 1;
              }

              capturedPayloads.push(parsedPayload);
            } catch {
              // Ignore response payload parse failures.
            }
          })();
        });

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
        let dismissedPlaywrightLoginInterstitial = false;

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

        dismissedPlaywrightLoginInterstitial = await dismissFacebookLoginInterstitial(page);

        if (dismissedPlaywrightLoginInterstitial) {
          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 1500 });
          } catch {
            // Allow scraping even if post-dismiss domcontentloaded does not fire.
          }

          try {
            await page.waitForLoadState('networkidle', { timeout: 1200 });
          } catch {
            // Best-effort wait for payload responses after dismissal.
          }
        }

        const html = await page.content();
        const dedupedCapturedPayloads = Array.from(
          new Set(capturedPayloads.map((payload) => JSON.stringify(payload))),
        )
          .slice(0, 30)
          .map((payloadString) => JSON.parse(payloadString));

        const htmlWithCapturedPayloads =
          dedupedCapturedPayloads.length > 0
            ? `${html}\n${dedupedCapturedPayloads
                .map(
                  (payload) =>
                    `<script type="application/json" data-captured="playwright-graphql">${serializeJsonForInlineScript(payload)}</script>`,
                )
                .join('\n')}`
            : html;
        const status = response?.status() ?? 200;

        if (status >= 400) {
          throw new MarketplaceHtmlFetchError(
            `Marketplace HTML request failed with status ${status}`,
            normalizeUpstreamStatus(status),
            trimErrorDetails(html),
          );
        }

        if (!htmlWithCapturedPayloads || htmlWithCapturedPayloads.trim().length === 0) {
          throw new MarketplaceHtmlFetchError('Marketplace HTML response was empty', 502);
        }

        return {
          html: htmlWithCapturedPayloads,
          status,
          usedPlaywrightBootstrap,
          dismissedPlaywrightLoginInterstitial,
          capturedGraphqlPayloadCount: dedupedCapturedPayloads.length,
          capturedGraphqlPayloadMatchingItemIdCount,
          usedInjectedSessionState: Boolean(input.manualCookieHeader || input.storageState),
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
  const storageState = decodeStorageStateFromEnv();
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
  let dismissedPlaywrightLoginInterstitial = false;
  let capturedGraphqlPayloadCount = 0;
  let capturedGraphqlPayloadMatchingItemIdCount = 0;
  let usedInjectedSessionState = false;
  let playwrightConnectionMode: 'cdp' | 'playwright' | undefined;
  const bootstrapEnabledByDefault = shouldEnablePlaywrightBootstrap();

  for (const candidateUrl of attemptedUrls) {
    try {
      const result =
        transport === 'playwright'
          ? await (async () => {
              const firstResult = await fetchHtmlViaPlaywright({
                url: candidateUrl,
                referer: options.referer,
                bootstrapUrl: bootstrapEnabledByDefault ? options.bootstrapUrl : undefined,
                timeoutMs,
                cookieHeader: mergedCookieHeader,
                manualCookieHeader,
                storageState,
              });

              if (
                shouldRetryPlaywrightWithBootstrap(
                  firstResult,
                  options.bootstrapUrl,
                  bootstrapEnabledByDefault,
                )
              ) {
                return await fetchHtmlViaPlaywright({
                  url: candidateUrl,
                  referer: options.referer,
                  bootstrapUrl: options.bootstrapUrl,
                  timeoutMs,
                  cookieHeader: mergedCookieHeader,
                  manualCookieHeader,
                  storageState,
                });
              }

              return firstResult;
            })()
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

      if ('dismissedPlaywrightLoginInterstitial' in result && result.dismissedPlaywrightLoginInterstitial) {
        dismissedPlaywrightLoginInterstitial = true;
      }

      if ('capturedGraphqlPayloadCount' in result) {
        capturedGraphqlPayloadCount = result.capturedGraphqlPayloadCount;
      }

      if ('capturedGraphqlPayloadMatchingItemIdCount' in result) {
        capturedGraphqlPayloadMatchingItemIdCount =
          result.capturedGraphqlPayloadMatchingItemIdCount;
      }

      if ('usedInjectedSessionState' in result && result.usedInjectedSessionState) {
        usedInjectedSessionState = true;
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
        dismissedPlaywrightLoginInterstitial,
        capturedGraphqlPayloadCount,
        capturedGraphqlPayloadMatchingItemIdCount,
        usedInjectedSessionState,
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
        dismissedPlaywrightLoginInterstitial,
        capturedGraphqlPayloadCount,
        capturedGraphqlPayloadMatchingItemIdCount,
        usedInjectedSessionState,
        playwrightConnectionMode,
        finalDetails: trimErrorDetails(lastError.details),
      },
      null,
      2,
    ),
  );
}
