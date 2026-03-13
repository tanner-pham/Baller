import { NextRequest, NextResponse } from 'next/server';
import type { NormalizedMarketplaceListing, NormalizedSimilarListing, NormalizedSimpleListing } from './types';
import { parseFacebookMarketplaceListingUrl } from '../../../lib/facebookMarketplaceListing';
import { isCacheFresh } from '../../../lib/server/cacheTtl';
import {
  getListingCacheEntry,
  upsertListingCacheEntry,
  type ListingCacheEntry,
} from '../../../lib/server/listingCacheRepository';
import { isCacheableMarketplaceListingPayload } from '../../../lib/server/marketplaceListingQuality';
import { scrapeMarketplaceListing } from '../../../lib/server/scraper/scrapeMarketplace';
import { MarketplaceHtmlFetchError, fetchMarketplaceHtmlWithFallback } from '../../../lib/server/facebookMarketplaceHtmlFetcher';
import { buildMarketplaceSearchUrl, parseMarketplaceSearchHtml } from './parseHtml';

export const runtime = 'nodejs';
export const maxDuration = 300;

function parseNumericPrice(priceStr: string): number {
  const digits = priceStr.replace(/[^\d.]/g, '');
  const num = Number(digits);
  return Number.isFinite(num) ? num : 0;
}

async function backfillComparables(
  listing: NormalizedMarketplaceListing,
): Promise<{ simpleListings: NormalizedSimpleListing[]; similarListings: NormalizedSimilarListing[] }> {
  const searchUrl = buildMarketplaceSearchUrl({
    title: listing.title,
    location: listing.location,
    locationId: listing.locationId,
    condition: listing.condition,
    price: listing.price,
  });

  const searchFetchResult = await fetchMarketplaceHtmlWithFallback({
    urls: [searchUrl],
    referer: 'https://www.facebook.com/marketplace/',
    bootstrapUrl: 'https://www.facebook.com/marketplace/',
    timeoutMs: 15_000,
  });

  const simpleListings = parseMarketplaceSearchHtml(searchFetchResult.html);
  const similarListings: NormalizedSimilarListing[] = simpleListings.map((sl) => ({
    title: sl.title,
    price: parseNumericPrice(sl.price),
    location: sl.location,
    image: sl.image,
    link: sl.link,
  }));

  return { simpleListings, similarListings };
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
          if (!isCacheableMarketplaceListingPayload(cachedListing.listingPayload)) {
            console.info('Marketplace listing cache hit rejected (insufficient listing payload)', {
              listingId,
              computedAt: cachedListing.computedAt,
            });
          } else if (isCacheFresh(cachedListing.computedAt)) {
            console.info('Marketplace listing cache hit', {
              listingId,
              computedAt: cachedListing.computedAt,
            });

            const cachedPayload = cachedListing.listingPayload;
            const hasSimilarListings =
              Array.isArray(cachedPayload.similarListings) && cachedPayload.similarListings.length > 0;

            if (!hasSimilarListings) {
              try {
                const comparables = await backfillComparables(cachedPayload);
                if (comparables.similarListings.length > 0) {
                  cachedPayload.simpleListings = comparables.simpleListings;
                  cachedPayload.similarListings = comparables.similarListings;
                  console.info('Marketplace listing cache hit backfilled with comparables', {
                    listingId,
                    comparablesCount: comparables.similarListings.length,
                  });
                }
              } catch (backfillError) {
                console.warn(
                  '[route:marketplace-listing] Comparable backfill failed on cache hit, returning without comparables',
                  {
                    listingId,
                    error: backfillError instanceof Error ? backfillError.message : backfillError,
                  },
                );
              }
            }

            return withCacheStatus(
              NextResponse.json({
                success: true,
                listing: cachedPayload,
                raw: {
                  cache: 'hit',
                  source: 'listing-cache',
                  computedAt: cachedListing.computedAt,
                },
              }),
              'hit',
            );
          }

          if (isCacheableMarketplaceListingPayload(cachedListing.listingPayload)) {
            staleCache = cachedListing;
            console.info('Marketplace listing cache stale-hit', {
              listingId,
              computedAt: cachedListing.computedAt,
            });
          }
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

    try {
      normalizedListing = await scrapeMarketplaceListing(listingUrl, listingId);
    } catch (caughtError) {
      if (staleCache) {
        const reason =
          caughtError instanceof MarketplaceHtmlFetchError
            ? `upstream-html-${caughtError.status}`
            : 'upstream-html-parse-failure';

        console.info('Marketplace listing cache stale-fallback used due to upstream scrape failure', {
          listingId,
          reason,
          error: caughtError,
        });

        return getStaleFallbackResponse(staleCache, reason);
      }

      if (caughtError instanceof MarketplaceHtmlFetchError) {
        return NextResponse.json(
          { success: false, error: caughtError.message, details: caughtError.details },
          { status: caughtError.status },
        );
      }

      throw caughtError;
    }

    if (listingId) {
      try {
        if (isCacheableMarketplaceListingPayload(normalizedListing)) {
          await upsertListingCacheEntry<NormalizedMarketplaceListing>({
            listingId,
            normalizedUrl: listingUrl,
            listingPayload: normalizedListing,
          });
          console.info('Marketplace listing cache fresh-write', { listingId });
        } else {
          console.info('Marketplace listing cache write skipped (insufficient listing payload)', {
            listingId,
          });
        }
      } catch (caughtError) {
        console.error('Marketplace listing cache write failed', {
          listingId,
          error: caughtError,
        });
      }
    }

    if (!isCacheableMarketplaceListingPayload(normalizedListing)) {
      if (staleCache) {
        console.info('Marketplace listing cache stale-fallback used due to incomplete fresh scrape', {
          listingId,
        });

        return getStaleFallbackResponse(staleCache, 'fresh-scrape-incomplete');
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Marketplace listing details are still loading. Please try again.',
        },
        { status: 502 },
      );
    }

    const cacheStatus = staleCache ? 'stale-refresh' : 'miss';

    return withCacheStatus(
      NextResponse.json({
        success: true,
        listing: normalizedListing,
        raw: { source: 'playwright-local', cache: cacheStatus },
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
