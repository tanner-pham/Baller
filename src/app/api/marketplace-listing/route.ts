import { NextRequest, NextResponse } from 'next/server';
import { extractListingPayload } from './extract';
import { normalizeListingResponse } from './normalize';
import type { NormalizedMarketplaceListing } from './types';
import { parseFacebookMarketplaceListingUrl } from '../../../lib/facebookMarketplaceListing';
import { isCacheFresh } from '../../../lib/server/cacheTtl';
import {
  getListingCacheEntry,
  upsertListingCacheEntry,
  type ListingCacheEntry,
} from '../../../lib/server/listingCacheRepository';

/**
 * Adds cache-status metadata for observability without changing response JSON contracts.
 */
function withCacheStatus(response: NextResponse, cacheStatus: string): NextResponse {
  response.headers.set('x-cache-status', cacheStatus);
  return response;
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
      (listingId ? `https://www.facebook.com/marketplace/item/${listingId}` : null);

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
                raw: { cache: 'hit', computedAt: cachedListing.computedAt },
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

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST ?? 'facebook-marketplace1.p.rapidapi.com';

    if (!rapidApiKey) {
      console.error('Marketplace listing request missing RAPIDAPI_KEY');
      return NextResponse.json({ error: 'Missing RAPIDAPI_KEY' }, { status: 500 });
    }

    const rapidApiUrl = new URL(`https://${rapidApiHost}/getProductByURL`);
    rapidApiUrl.searchParams.set('url', listingUrl);

    const response = await fetch(rapidApiUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHost,
      },
      cache: 'no-store',
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Marketplace listing RapidAPI request failed', {
        status: response.status,
        details: responseText,
      });

      if (staleCache) {
        console.info('Marketplace listing cache stale-fallback used due to upstream status failure', {
          listingId,
          status: response.status,
        });
        return withCacheStatus(
          NextResponse.json({
            success: true,
            listing: staleCache.listingPayload,
            raw: {
              cache: 'stale-fallback',
              reason: `upstream-status-${response.status}`,
              computedAt: staleCache.computedAt,
            },
          }),
          'stale-fallback',
        );
      }

      return NextResponse.json(
        {
          error: `RapidAPI request failed with status ${response.status}`,
          details: responseText,
        },
        { status: response.status },
      );
    }

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch (caughtError) {
      console.error('Marketplace listing RapidAPI returned non-JSON response', {
        error: caughtError,
        details: responseText,
      });

      if (staleCache) {
        console.info('Marketplace listing cache stale-fallback used due to non-JSON upstream payload', {
          listingId,
        });
        return withCacheStatus(
          NextResponse.json({
            success: true,
            listing: staleCache.listingPayload,
            raw: {
              cache: 'stale-fallback',
              reason: 'upstream-non-json',
              computedAt: staleCache.computedAt,
            },
          }),
          'stale-fallback',
        );
      }

      return NextResponse.json(
        { error: 'RapidAPI returned non-JSON response', details: responseText },
        { status: 502 },
      );
    }

    const listingPayload = extractListingPayload(parsedResponse);

    if (!listingPayload) {
      console.error('Marketplace listing RapidAPI payload missing listing object', {
        raw: parsedResponse,
      });

      if (staleCache) {
        console.info('Marketplace listing cache stale-fallback used due to missing listing payload', {
          listingId,
        });
        return withCacheStatus(
          NextResponse.json({
            success: true,
            listing: staleCache.listingPayload,
            raw: {
              cache: 'stale-fallback',
              reason: 'upstream-missing-listing',
              computedAt: staleCache.computedAt,
            },
          }),
          'stale-fallback',
        );
      }

      return NextResponse.json(
        { error: 'RapidAPI payload did not include a listing object', raw: parsedResponse },
        { status: 502 },
      );
    }

    const normalizedListing = normalizeListingResponse(listingPayload);

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
        raw: parsedResponse,
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
            : 'Failed to fetch listing from RapidAPI',
      },
      { status: 500 },
    );
  }
}
