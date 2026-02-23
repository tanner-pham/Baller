import { NextRequest, NextResponse } from 'next/server';
import { extractListingPayload } from './extract';
import { normalizeListingResponse } from './normalize';
import type {
  NormalizedMarketplaceListing,
  NormalizedSimilarListing,
} from './types';
import { parseFacebookMarketplaceListingUrl } from '../../../lib/facebookMarketplaceListing';
import { isCacheFresh } from '../../../lib/server/cacheTtl';
import {
  getListingCacheEntry,
  upsertListingCacheEntry,
  type ListingCacheEntry,
} from '../../../lib/server/listingCacheRepository';
import {
  upsertSimilarListingJobEntry,
  type SimilarListingJobStatus,
} from '../../../lib/server/similarListingJobsRepository';
import { upsertSimilarListingsCacheEntry } from '../../../lib/server/similarListingsCacheRepository';
import { buildSimilarSearchQuery, type SimilarSearchQuery } from '../../../lib/server/similarListingsQuery';
import { computeSimilarCacheExpiry } from '../../../lib/server/similarListingsTtl';
import {
  enqueueSimilarListingsFromInternalScraper,
  fetchListingFromInternalScraper,
} from '../../../lib/server/scraperClient';
import { resolveScraperProvider } from '../../../lib/server/scraperProvider';

type RawSource = 'internal-scraper' | 'rapidapi';

class UpstreamRequestError extends Error {
  status: number;

  details?: string;

  constructor(message: string, status = 502, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ProviderListingResult {
  listing: NormalizedMarketplaceListing;
  raw: unknown;
  source: RawSource;
  queryHash: string | null;
}

/**
 * Adds cache-status metadata for observability without changing response JSON contracts.
 */
function withCacheStatus(response: NextResponse, cacheStatus: string): NextResponse {
  response.headers.set('x-cache-status', cacheStatus);
  return response;
}

/**
 * Calls the RapidAPI upstream and converts payloads into normalized listing output.
 */
async function fetchListingFromRapidApi(listingUrl: string): Promise<ProviderListingResult> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  const rapidApiHost = process.env.RAPIDAPI_HOST ?? 'facebook-marketplace1.p.rapidapi.com';

  if (!rapidApiKey) {
    throw new UpstreamRequestError('Missing RAPIDAPI_KEY', 500);
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
    throw new UpstreamRequestError(
      `RapidAPI request failed with status ${response.status}`,
      response.status,
      responseText,
    );
  }

  let parsedResponse: unknown;

  try {
    parsedResponse = JSON.parse(responseText);
  } catch {
    throw new UpstreamRequestError('RapidAPI returned non-JSON response', 502, responseText);
  }

  const listingPayload = extractListingPayload(parsedResponse);

  if (!listingPayload) {
    throw new UpstreamRequestError(
      'RapidAPI payload did not include a listing object',
      502,
      JSON.stringify(parsedResponse),
    );
  }

  return {
    listing: normalizeListingResponse(listingPayload),
    raw: parsedResponse,
    source: 'rapidapi',
    queryHash: null,
  };
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
        source: staleCache.sourceProvider,
        computedAt: staleCache.computedAt,
      },
    }),
    'stale-fallback',
  );
}

async function upsertSimilarCacheFromInlinePayload({
  listingId,
  queryHash,
  similarListings,
}: {
  listingId: string;
  queryHash: string;
  similarListings: NormalizedSimilarListing[];
}): Promise<void> {
  if (!similarListings.length) {
    return;
  }

  await upsertSimilarListingsCacheEntry<NormalizedSimilarListing[]>({
    listingId,
    queryHash,
    similarPayload: similarListings,
    expiresAt: computeSimilarCacheExpiry(),
  });
}

async function upsertSimilarJobStatus({
  listingId,
  queryHash,
  jobId,
  status,
  errorMessage,
}: {
  listingId: string;
  queryHash: string;
  jobId: string;
  status: SimilarListingJobStatus;
  errorMessage?: string;
}): Promise<void> {
  await upsertSimilarListingJobEntry({
    listingId,
    queryHash,
    jobId,
    status,
    errorMessage: errorMessage ?? null,
    completedAt: status === 'completed' ? new Date().toISOString() : null,
  });
}

async function enqueueInternalSimilarJob({
  listingId,
  listingUrl,
  query,
}: {
  listingId: string;
  listingUrl: string;
  query: SimilarSearchQuery;
}): Promise<void> {
  const deterministicJobId = `similar:${listingId}:${query.hash}`;

  try {
    const enqueueResult = await enqueueSimilarListingsFromInternalScraper({
      listingId,
      listingUrl,
      query,
    });

    await upsertSimilarJobStatus({
      listingId,
      queryHash: query.hash,
      jobId: enqueueResult.jobId,
      status: 'pending',
    });
  } catch (caughtError) {
    console.error('Failed to enqueue internal similar listings job', {
      listingId,
      queryHash: query.hash,
      error: caughtError,
    });

    try {
      await upsertSimilarJobStatus({
        listingId,
        queryHash: query.hash,
        jobId: deterministicJobId,
        status: 'failed',
        errorMessage:
          caughtError instanceof Error ? caughtError.message : 'Failed to enqueue similar job',
      });
    } catch (jobWriteError) {
      console.error('Failed to record similar job enqueue failure', {
        listingId,
        queryHash: query.hash,
        error: jobWriteError,
      });
    }
  }
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
                raw: {
                  cache: 'hit',
                  source: cachedListing.sourceProvider,
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

    const provider = resolveScraperProvider();
    let listingResult: ProviderListingResult | null = null;
    let internalFallbackError: string | null = null;

    if (provider === 'internal') {
      try {
        const internalResponse = await fetchListingFromInternalScraper({
          listingId,
          listingUrl,
        });

        listingResult = {
          listing: internalResponse.listing,
          queryHash: internalResponse.queryHash,
          raw: internalResponse.raw,
          source: 'internal-scraper',
        };
      } catch (caughtError) {
        internalFallbackError =
          caughtError instanceof Error ? caughtError.message : 'Internal scraper failed';
        console.error('Internal scraper listing fetch failed, falling back to RapidAPI', {
          listingId,
          listingUrl,
          error: caughtError,
        });
      }
    }

    if (!listingResult) {
      try {
        listingResult = await fetchListingFromRapidApi(listingUrl);
      } catch (caughtError) {
        if (staleCache) {
          const reason =
            caughtError instanceof UpstreamRequestError
              ? `upstream-error-${caughtError.status}`
              : 'upstream-error';
          console.info('Marketplace listing stale cache fallback used', {
            listingId,
            reason,
          });
          return getStaleFallbackResponse(staleCache, reason);
        }

        if (caughtError instanceof UpstreamRequestError) {
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
    }

    const normalizedListing = listingResult.listing;
    const query = buildSimilarSearchQuery(normalizedListing);
    const resolvedQueryHash = listingResult.queryHash ?? query.hash;
    const resolvedQuery: SimilarSearchQuery =
      resolvedQueryHash === query.hash ? query : { ...query, hash: resolvedQueryHash };

    if (listingId) {
      try {
        await upsertListingCacheEntry<NormalizedMarketplaceListing>({
          listingId,
          normalizedUrl: listingUrl,
          listingPayload: normalizedListing,
          sourceProvider: listingResult.source,
        });
        console.info('Marketplace listing cache fresh-write', {
          listingId,
          source: listingResult.source,
        });
      } catch (caughtError) {
        console.error('Marketplace listing cache write failed', {
          listingId,
          error: caughtError,
        });
      }

      try {
        await upsertSimilarCacheFromInlinePayload({
          listingId,
          queryHash: resolvedQuery.hash,
          similarListings: normalizedListing.similarListings ?? [],
        });
      } catch (caughtError) {
        console.error('Failed to upsert inline similar listings cache payload', {
          listingId,
          queryHash: resolvedQuery.hash,
          error: caughtError,
        });
      }

      if (provider === 'internal') {
        await enqueueInternalSimilarJob({
          listingId,
          listingUrl,
          query: resolvedQuery,
        });
      }
    }

    const cacheStatus = staleCache ? 'stale-refresh' : 'miss';

    return withCacheStatus(
      NextResponse.json({
        success: true,
        listing: normalizedListing,
        raw: {
          source: listingResult.source,
          payload: listingResult.raw,
          internalFallbackError: internalFallbackError ?? undefined,
        },
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
            : 'Failed to fetch marketplace listing',
      },
      { status: 500 },
    );
  }
}
