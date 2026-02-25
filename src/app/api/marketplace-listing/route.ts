import { NextRequest, NextResponse } from 'next/server';
import type { NormalizedMarketplaceListing } from './types';
import {
  looksLikeFacebookAuthWall,
  parseMarketplaceListingHtml,
} from './parseHtml';
import { parseFacebookMarketplaceListingUrl } from '../../../lib/facebookMarketplaceListing';
import { isCacheFresh } from '../../../lib/server/cacheTtl';
import {
  fetchMarketplaceHtmlWithFallback,
  MarketplaceHtmlFetchError,
} from '../../../lib/server/facebookMarketplaceHtmlFetcher';
import {
  getListingCacheEntry,
  upsertListingCacheEntry,
  type ListingCacheEntry,
} from '../../../lib/server/listingCacheRepository';

const DEFAULT_UPSTREAM_FETCH_TIMEOUT_MS = 15000;

function getPositiveIntEnv(name: string): number | null {
  const rawValue = process.env[name];

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export const runtime = 'nodejs';

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

    if (withoutQuery.hostname === 'www.facebook.com') {
      const mobileVariant = new URL(withoutQuery.toString());
      mobileVariant.hostname = 'm.facebook.com';
      pushCandidate(mobileVariant.toString());
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

export async function GET(request: NextRequest) {
  try {
    const requestedItemId = request.nextUrl.searchParams.get('itemId');
    const requestedListingUrl = request.nextUrl.searchParams.get('listingUrl');

    if (!requestedItemId && !requestedListingUrl) {
      console.error('Marketplace listing request missing required listing identifier');
      return NextResponse.json(
        { success: false, error: 'itemId or listingUrl is required' },
        { status: 400 },
      );
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
      return NextResponse.json(
        { success: false, error: 'Unable to resolve listing URL' },
        { status: 400 },
      );
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
      const upstreamHtml = await fetchMarketplaceHtmlWithFallback({
        urls: buildListingFetchCandidates(listingUrl, listingId),
        referer: 'https://www.facebook.com/marketplace/',
        bootstrapUrl: 'https://www.facebook.com/marketplace/',
        timeoutMs:
          getPositiveIntEnv('MARKETPLACE_HTML_TIMEOUT_MS') ??
          DEFAULT_UPSTREAM_FETCH_TIMEOUT_MS,
        validators: [
          (html) =>
            looksLikeFacebookGenericErrorPage(html)
              ? {
                  reason: 'Marketplace HTML fetch returned a Facebook generic error page.',
                  status: 502,
                  details: html,
                }
              : null,
          (html) =>
            looksLikeFacebookAuthWall(html)
              ? {
                  reason: 'Marketplace HTML fetch returned Facebook login/interstitial content.',
                  status: 502,
                }
              : null,
        ],
      });

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
        attempts: upstreamHtml.attempts,
        transport: upstreamHtml.transport,
        usedBootstrapCookies: upstreamHtml.usedBootstrapCookies,
        usedPlaywrightBootstrap: upstreamHtml.usedPlaywrightBootstrap,
        playwrightConnectionMode: upstreamHtml.playwrightConnectionMode,
        parse: parsedListing.metadata,
      };
    } catch (caughtError) {
      if (staleCache) {
        const reason =
          caughtError instanceof MarketplaceHtmlFetchError
            ? `upstream-html-${caughtError.status}`
            : 'upstream-html-parse-failure';

        console.info('Marketplace listing cache stale-fallback used due to upstream parse/fetch failure', {
          listingId,
          reason,
          error: caughtError,
        });

        return getStaleFallbackResponse(staleCache, reason);
      }

      if (caughtError instanceof MarketplaceHtmlFetchError) {
        return NextResponse.json(
          {
            success: false,
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
        success: false,
        error:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to fetch listing from Facebook HTML',
      },
      { status: 500 },
    );
  }
}
