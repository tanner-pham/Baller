import { NextRequest, NextResponse } from 'next/server';
import type { NormalizedMarketplaceListing } from './types';
import { parseFacebookMarketplaceListingUrl } from '../../../lib/facebookMarketplaceListing';
import { isCacheFresh } from '../../../lib/server/cacheTtl';
import {
  getListingCacheEntry,
  upsertListingCacheEntry,
  type ListingCacheEntry,
} from '../../../lib/server/listingCacheRepository';
import { scrapeMarketplaceListing } from '../../../lib/server/scraper/scrapeMarketplace';
import { MarketplaceHtmlError } from '../../../lib/server/scraper/browserManager';

export const runtime = 'nodejs';
export const maxDuration = 300;

function isCacheableListingPayload(
  listing: NormalizedMarketplaceListing | null | undefined,
): boolean {
  if (!listing) {
    return false;
  }

  const hasPrice = Boolean(listing.price?.trim());
  const hasLocation = Boolean(listing.location?.trim());
  const hasImages = Array.isArray(listing.images) && listing.images.length > 0;

  return hasPrice || hasLocation || hasImages;
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
          if (!isCacheableListingPayload(cachedListing.listingPayload)) {
            console.info('Marketplace listing cache hit rejected (insufficient listing payload)', {
              listingId,
              computedAt: cachedListing.computedAt,
            });
          } else if (isCacheFresh(cachedListing.computedAt)) {
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

          if (isCacheableListingPayload(cachedListing.listingPayload)) {
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
          caughtError instanceof MarketplaceHtmlError
            ? `upstream-html-${caughtError.status}`
            : 'upstream-html-parse-failure';

        console.info('Marketplace listing cache stale-fallback used due to upstream scrape failure', {
          listingId,
          reason,
          error: caughtError,
        });

        return getStaleFallbackResponse(staleCache, reason);
      }

      if (caughtError instanceof MarketplaceHtmlError) {
        return NextResponse.json(
          { success: false, error: caughtError.message, details: caughtError.details },
          { status: caughtError.status },
        );
      }

      throw caughtError;
    }

    if (listingId) {
      try {
        if (isCacheableListingPayload(normalizedListing)) {
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
