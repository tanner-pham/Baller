import { NextRequest, NextResponse } from 'next/server';
import type { NormalizedMarketplaceListing } from './types';
import {
  looksLikeFacebookAuthWall,
  parseMarketplaceListingHtml,
} from './parseHtml';
import { parseFacebookMarketplaceListingUrl } from '../../../lib/facebookMarketplaceListing';
import { isCacheFresh } from '../../../lib/server/cacheTtl';
import {
  getListingCacheEntry,
  upsertListingCacheEntry,
  type ListingCacheEntry,
} from '../../../lib/server/listingCacheRepository';

const UPSTREAM_FETCH_TIMEOUT_MS = 12000;

class UpstreamHtmlError extends Error {
  status: number;

  details?: string;

  constructor(message: string, status = 502, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Adds cache-status metadata for observability without changing response JSON contracts.
 */
function withCacheStatus(response: NextResponse, cacheStatus: string): NextResponse {
  response.headers.set('x-cache-status', cacheStatus);
  return response;
}

function getStaleFallbackResponse(
  staleCache: ListingCacheEntry<NormalizedMarketplaceListing>,
  reason: string,
): NextResponse {
  return withCacheStatus(
    NextResponse.json({
      success: true,
      listing: staleCache.listingPayload,
      raw: {
        cache: 'stale-fallback',
        reason,
        computedAt: staleCache.computedAt,
      },
    }),
    'stale-fallback',
  );
}

function looksLikeFacebookGenericErrorPage(html: string): boolean {
  const normalizedHtml = html.toLowerCase();

  return (
    normalizedHtml.includes('<title>error</title>') &&
    normalizedHtml.includes('sorry, something went wrong')
  );
}

function buildListingFetchCandidates(listingUrl: string, listingId: string | null): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const pushCandidate = (value: string | null | undefined): void => {
    const trimmed = value?.trim();

    if (!trimmed || seen.has(trimmed)) {
      return;
    }

    seen.add(trimmed);
    candidates.push(trimmed);
  };

  pushCandidate(listingUrl);

  try {
    const parsedUrl = new URL(listingUrl);
    parsedUrl.hash = '';
    pushCandidate(parsedUrl.toString());

    const withoutQuery = new URL(parsedUrl.toString());
    withoutQuery.search = '';
    pushCandidate(withoutQuery.toString());

    if (!withoutQuery.pathname.endsWith('/')) {
      withoutQuery.pathname = `${withoutQuery.pathname}/`;
      pushCandidate(withoutQuery.toString());
    }
  } catch {
    // No-op: malformed URL candidate already handled by caller validations.
  }

  if (listingId) {
    pushCandidate(`https://www.facebook.com/marketplace/item/${listingId}/`);
    pushCandidate(`https://m.facebook.com/marketplace/item/${listingId}/`);
  }

  return candidates;
}

async function fetchMarketplaceHtmlCandidate(listingUrl: string): Promise<{
  html: string;
  status: number;
}> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, UPSTREAM_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(listingUrl, {
      method: 'GET',
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        referer: 'https://www.facebook.com/marketplace/',
      },
      cache: 'no-store',
      signal: abortController.signal,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new UpstreamHtmlError(
        `Marketplace HTML request failed with status ${response.status}`,
        response.status,
        responseText.slice(0, 1000),
      );
    }

    if (!responseText || responseText.trim().length === 0) {
      throw new UpstreamHtmlError('Marketplace HTML response was empty', 502);
    }

    if (looksLikeFacebookGenericErrorPage(responseText)) {
      throw new UpstreamHtmlError(
        'Marketplace HTML fetch returned a Facebook generic error page.',
        502,
        responseText.slice(0, 1000),
      );
    }

    if (looksLikeFacebookAuthWall(responseText)) {
      throw new UpstreamHtmlError(
        'Marketplace HTML fetch returned Facebook login/interstitial content.',
        502,
      );
    }

    return {
      html: responseText,
      status: response.status,
    };
  } catch (caughtError) {
    if (abortController.signal.aborted) {
      throw new UpstreamHtmlError('Marketplace HTML request timed out.', 504);
    }

    if (caughtError instanceof UpstreamHtmlError) {
      throw caughtError;
    }

    throw new UpstreamHtmlError(
      caughtError instanceof Error ? caughtError.message : 'Marketplace HTML request failed.',
      502,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchMarketplaceHtml(listingUrl: string): Promise<{
  html: string;
  status: number;
  sourceUrl: string;
  attemptedUrls: string[];
}> {
  return fetchMarketplaceHtmlWithFallback(listingUrl, null);
}

async function fetchMarketplaceHtmlWithFallback(
  listingUrl: string,
  listingId: string | null,
): Promise<{
  html: string;
  status: number;
  sourceUrl: string;
  attemptedUrls: string[];
}> {
  const attemptedUrls = buildListingFetchCandidates(listingUrl, listingId);
  let lastError: UpstreamHtmlError | null = null;

  for (const candidateUrl of attemptedUrls) {
    try {
      const result = await fetchMarketplaceHtmlCandidate(candidateUrl);
      return {
        ...result,
        sourceUrl: candidateUrl,
        attemptedUrls,
      };
    } catch (caughtError) {
      if (caughtError instanceof UpstreamHtmlError) {
        lastError = caughtError;
        continue;
      }

      lastError = new UpstreamHtmlError(
        caughtError instanceof Error ? caughtError.message : 'Marketplace HTML request failed.',
      );
    }
  }

  throw lastError ?? new UpstreamHtmlError('Marketplace HTML request failed.');
}

export async function GET(request: NextRequest) {
  try {
    const requestedItemId = request.nextUrl.searchParams.get('itemId');
    const requestedListingUrl = request.nextUrl.searchParams.get('listingUrl');

    if (!requestedItemId && !requestedListingUrl) {
      console.error('Marketplace listing request missing required listing identifier');
      return NextResponse.json({ error: 'itemId or listingUrl is required' }, { status: 400 });
    }

    const parsedListingFromUrl = requestedListingUrl
      ? parseFacebookMarketplaceListingUrl(requestedListingUrl)
      : null;

    const listingId = requestedItemId ?? parsedListingFromUrl?.itemId ?? null;
    const listingUrl =
      requestedListingUrl ??
      parsedListingFromUrl?.normalizedUrl ??
      (listingId ? `https://www.facebook.com/marketplace/item/${listingId}/` : null);

    if (!listingUrl) {
      console.error('Marketplace listing request could not resolve listing URL', {
        requestedItemId,
        requestedListingUrl,
      });
      return NextResponse.json({ error: 'Unable to resolve listing URL' }, { status: 400 });
    }

    let staleCache: ListingCacheEntry<NormalizedMarketplaceListing> | null = null;

    if (listingId) {
      try {
        const cachedListing = await getListingCacheEntry<NormalizedMarketplaceListing>(listingId);

        if (cachedListing) {
          if (isCacheFresh(cachedListing.computedAt)) {
            console.info('Marketplace listing cache hit', {
              listingId,
              computedAt: cachedListing.computedAt,
            });
            return withCacheStatus(
              NextResponse.json({
                success: true,
                listing: cachedListing.listingPayload,
                raw: {
                  cache: 'hit',
                  source: 'listing-cache',
                  computedAt: cachedListing.computedAt,
                },
              }),
              'hit',
            );
          }

          staleCache = cachedListing;
          console.info('Marketplace listing cache stale-hit', {
            listingId,
            computedAt: cachedListing.computedAt,
          });
        } else {
          console.info('Marketplace listing cache miss', { listingId });
        }
      } catch (caughtError) {
        console.error('Marketplace listing cache read failed, continuing to upstream fetch', {
          listingId,
          error: caughtError,
        });
      }
    }

    let normalizedListing: NormalizedMarketplaceListing;
    let parserMetadata: unknown;

    try {
      const upstreamHtml = await fetchMarketplaceHtmlWithFallback(listingUrl, listingId);
      const parsedListing = parseMarketplaceListingHtml({
        html: upstreamHtml.html,
        requestedItemId: listingId,
      });

      normalizedListing = parsedListing.listing;
      parserMetadata = {
        source: 'facebook-html',
        upstreamStatus: upstreamHtml.status,
        sourceUrl: upstreamHtml.sourceUrl,
        attemptedUrls: upstreamHtml.attemptedUrls,
        parse: parsedListing.metadata,
      };
    } catch (caughtError) {
      if (staleCache) {
        const reason =
          caughtError instanceof UpstreamHtmlError
            ? `upstream-html-${caughtError.status}`
            : 'upstream-html-parse-failure';

        console.info('Marketplace listing cache stale-fallback used due to upstream parse/fetch failure', {
          listingId,
          reason,
          error: caughtError,
        });

        return getStaleFallbackResponse(staleCache, reason);
      }

      if (caughtError instanceof UpstreamHtmlError) {
        return NextResponse.json(
          {
            error: caughtError.message,
            details: caughtError.details,
          },
          { status: caughtError.status },
        );
      }

      throw caughtError;
    }

    if (listingId) {
      try {
        await upsertListingCacheEntry<NormalizedMarketplaceListing>({
          listingId,
          normalizedUrl: listingUrl,
          listingPayload: normalizedListing,
        });
        console.info('Marketplace listing cache fresh-write', { listingId });
      } catch (caughtError) {
        console.error('Marketplace listing cache write failed', {
          listingId,
          error: caughtError,
        });
      }
    }

    const cacheStatus = staleCache ? 'stale-refresh' : 'miss';

    return withCacheStatus(
      NextResponse.json({
        success: true,
        listing: normalizedListing,
        raw: parserMetadata,
      }),
      cacheStatus,
    );
  } catch (caughtError) {
    console.error('Marketplace listing fetch failed:', caughtError);
    return NextResponse.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to fetch listing from Facebook HTML',
      },
      { status: 500 },
    );
  }
}
