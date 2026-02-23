import { NextRequest, NextResponse } from 'next/server';
import type { NormalizedMarketplaceListing, NormalizedSimilarListing } from '../marketplace-listing/types';
import { getListingCacheEntry } from '../../../lib/server/listingCacheRepository';
import {
  getSimilarListingJobEntry,
  upsertSimilarListingJobEntry,
} from '../../../lib/server/similarListingJobsRepository';
import {
  getSimilarListingsCacheEntry,
  upsertSimilarListingsCacheEntry,
} from '../../../lib/server/similarListingsCacheRepository';
import { buildSimilarSearchQuery } from '../../../lib/server/similarListingsQuery';
import { computeSimilarCacheExpiry, isSimilarCacheFresh } from '../../../lib/server/similarListingsTtl';
import { enqueueSimilarListingsFromInternalScraper } from '../../../lib/server/scraperClient';
import { resolveScraperProvider } from '../../../lib/server/scraperProvider';

type SimilarListingsApiStatus = 'pending' | 'ready' | 'stale' | 'error';

interface SimilarListingsApiResponse {
  success: boolean;
  status: SimilarListingsApiStatus;
  retryAfterMs?: number;
  warning?: string;
  similarListings?: NormalizedSimilarListing[];
  error?: string;
}

const DEFAULT_RETRY_AFTER_MS = 2000;

function jsonResponse(
  payload: SimilarListingsApiResponse,
  init?: ResponseInit,
): NextResponse<SimilarListingsApiResponse> {
  return NextResponse.json(payload, init);
}

/**
 * Adds polling guidance for pending similar-listings responses.
 */
function withRetryAfter(response: NextResponse, retryAfterMs: number): NextResponse {
  response.headers.set('Retry-After', Math.max(1, Math.round(retryAfterMs / 1000)).toString());
  return response;
}

/**
 * Returns fallback similar listings from listing cache payload when available.
 */
function getInlineSimilarListings(
  listing: NormalizedMarketplaceListing | null | undefined,
): NormalizedSimilarListing[] {
  if (!listing?.similarListings || !Array.isArray(listing.similarListings)) {
    return [];
  }

  return listing.similarListings.filter(
    (entry) =>
      typeof entry.title === 'string' &&
      typeof entry.location === 'string' &&
      typeof entry.image === 'string' &&
      typeof entry.link === 'string' &&
      typeof entry.price === 'number',
  );
}

async function ensureInternalSimilarJob(input: {
  listingId: string;
  listingUrl: string;
  queryHash: string;
  queryText: string;
  keywords: string[];
  location: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}): Promise<{ status: 'pending' | 'failed'; error?: string }> {
  const deterministicJobId = `similar:${input.listingId}:${input.queryHash}`;

  try {
    const enqueueResult = await enqueueSimilarListingsFromInternalScraper({
      listingId: input.listingId,
      listingUrl: input.listingUrl,
      query: {
        hash: input.queryHash,
        queryText: input.queryText,
        keywords: input.keywords,
        location: input.location,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
      },
    });

    await upsertSimilarListingJobEntry({
      listingId: input.listingId,
      queryHash: input.queryHash,
      jobId: enqueueResult.jobId,
      status: 'pending',
      errorMessage: null,
    });

    return { status: 'pending' };
  } catch (caughtError) {
    const errorMessage =
      caughtError instanceof Error ? caughtError.message : 'Failed to enqueue similar listings';

    try {
      await upsertSimilarListingJobEntry({
        listingId: input.listingId,
        queryHash: input.queryHash,
        jobId: deterministicJobId,
        status: 'failed',
        errorMessage,
      });
    } catch (jobWriteError) {
      console.error('Failed to persist similar listing enqueue error', {
        listingId: input.listingId,
        queryHash: input.queryHash,
        error: jobWriteError,
      });
    }

    return { status: 'failed', error: errorMessage };
  }
}

export async function GET(request: NextRequest) {
  try {
    const listingId = request.nextUrl.searchParams.get('listingId')?.trim();

    if (!listingId) {
      return jsonResponse(
        {
          success: false,
          status: 'error',
          error: 'listingId is required',
        },
        { status: 400 },
      );
    }

    const listingCache = await getListingCacheEntry<NormalizedMarketplaceListing>(listingId);

    if (!listingCache) {
      return jsonResponse(
        {
          success: false,
          status: 'error',
          error: 'Listing not found in cache. Load /api/marketplace-listing first.',
        },
        { status: 404 },
      );
    }

    const query = buildSimilarSearchQuery(listingCache.listingPayload);
    const cacheEntry = await getSimilarListingsCacheEntry<NormalizedSimilarListing[]>(
      listingId,
      query.hash,
    );

    if (cacheEntry && isSimilarCacheFresh(cacheEntry.expiresAt)) {
      return jsonResponse({
        success: true,
        status: 'ready',
        similarListings: Array.isArray(cacheEntry.similarPayload) ? cacheEntry.similarPayload : [],
      });
    }

    const staleSimilarListings =
      cacheEntry && Array.isArray(cacheEntry.similarPayload) ? cacheEntry.similarPayload : null;

    const inlineSimilarListings = getInlineSimilarListings(listingCache.listingPayload);

    if (!cacheEntry && inlineSimilarListings.length > 0) {
      try {
        await upsertSimilarListingsCacheEntry<NormalizedSimilarListing[]>({
          listingId,
          queryHash: query.hash,
          similarPayload: inlineSimilarListings,
          expiresAt: computeSimilarCacheExpiry(),
        });
      } catch (caughtError) {
        console.error('Failed to backfill async similar cache from inline listing payload', {
          listingId,
          queryHash: query.hash,
          error: caughtError,
        });
      }

      return jsonResponse({
        success: true,
        status: 'ready',
        similarListings: inlineSimilarListings,
      });
    }

    const provider = resolveScraperProvider();

    if (provider !== 'internal') {
      if (staleSimilarListings && staleSimilarListings.length > 0) {
        return jsonResponse({
          success: true,
          status: 'stale',
          warning: 'Using stale cache',
          similarListings: staleSimilarListings,
        });
      }

      return jsonResponse(
        {
          success: false,
          status: 'error',
          error: 'Async similar-listings pipeline is unavailable while SCRAPER_PROVIDER=rapidapi.',
        },
        { status: 502 },
      );
    }

    const existingJob = await getSimilarListingJobEntry(listingId, query.hash);
    const shouldEnqueue =
      !existingJob ||
      existingJob.status === 'failed' ||
      existingJob.status === 'completed';

    if (shouldEnqueue) {
      const enqueueResult = await ensureInternalSimilarJob({
        listingId,
        listingUrl:
          listingCache.normalizedUrl ||
          `https://www.facebook.com/marketplace/item/${listingId}`,
        queryHash: query.hash,
        queryText: query.queryText,
        keywords: query.keywords,
        location: query.location,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
      });

      if (enqueueResult.status === 'failed') {
        if (staleSimilarListings && staleSimilarListings.length > 0) {
          return jsonResponse({
            success: true,
            status: 'stale',
            warning: 'Using stale cache',
            similarListings: staleSimilarListings,
          });
        }

        return jsonResponse(
          {
            success: false,
            status: 'error',
            error: enqueueResult.error ?? 'Failed to enqueue similar-listings job.',
          },
          { status: 502 },
        );
      }
    }

    if (staleSimilarListings && staleSimilarListings.length > 0) {
      return jsonResponse({
        success: true,
        status: 'stale',
        warning: 'Using stale cache',
        similarListings: staleSimilarListings,
      });
    }

    return withRetryAfter(
      jsonResponse(
        {
          success: true,
          status: 'pending',
          retryAfterMs: DEFAULT_RETRY_AFTER_MS,
        },
        { status: 202 },
      ),
      DEFAULT_RETRY_AFTER_MS,
    );
  } catch (caughtError) {
    console.error('Similar listings route failed', { error: caughtError });
    return jsonResponse(
      {
        success: false,
        status: 'error',
        error:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to retrieve similar listings',
      },
      { status: 500 },
    );
  }
}
