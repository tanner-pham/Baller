import 'server-only';

import type { NormalizedMarketplaceListing } from '../../app/api/marketplace-listing/types';
import type { SimilarSearchQuery } from './similarListingsQuery';

interface InternalScraperBaseResponse {
  success: boolean;
  error?: string;
}

interface InternalListingFetchResponse extends InternalScraperBaseResponse {
  listing?: NormalizedMarketplaceListing;
  queryHash?: string;
  raw?: unknown;
}

interface InternalSimilarEnqueueResponse extends InternalScraperBaseResponse {
  jobId?: string;
}

interface InternalScraperConfig {
  baseUrl: string;
  token: string;
}

export interface InternalListingFetchResult {
  listing: NormalizedMarketplaceListing;
  queryHash: string | null;
  raw: unknown;
}

interface EnqueueSimilarListingsInput {
  listingId: string;
  listingUrl: string;
  query: SimilarSearchQuery;
}

function getInternalScraperConfig(): InternalScraperConfig {
  const baseUrl = process.env.SCRAPER_BASE_URL?.trim();
  const token = process.env.SCRAPER_INTERNAL_TOKEN?.trim();

  if (!baseUrl || !token) {
    throw new Error(
      'Missing SCRAPER_BASE_URL or SCRAPER_INTERNAL_TOKEN for internal scraper requests.',
    );
  }

  return {
    baseUrl,
    token,
  };
}

async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse | null> {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as TResponse;
  } catch {
    return null;
  }
}

/**
 * Fetches one listing payload from the internal scraper service.
 */
export async function fetchListingFromInternalScraper(input: {
  listingId: string | null;
  listingUrl: string;
}): Promise<InternalListingFetchResult> {
  const { baseUrl, token } = getInternalScraperConfig();

  const response = await fetch(`${baseUrl}/v1/listing/fetch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      listingId: input.listingId,
      listingUrl: input.listingUrl,
    }),
  });

  const parsed = await parseJsonResponse<InternalListingFetchResponse>(response);

  if (!response.ok || !parsed?.success || !parsed.listing) {
    throw new Error(
      parsed?.error ??
        `Internal scraper listing request failed with status ${response.status}.`,
    );
  }

  return {
    listing: parsed.listing,
    queryHash: parsed.queryHash ?? null,
    raw: parsed.raw ?? null,
  };
}

/**
 * Enqueues one async similar-listings scrape job in the internal scraper service.
 */
export async function enqueueSimilarListingsFromInternalScraper(
  input: EnqueueSimilarListingsInput,
): Promise<{ jobId: string }> {
  const { baseUrl, token } = getInternalScraperConfig();

  const response = await fetch(`${baseUrl}/v1/similar/enqueue`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      listingId: input.listingId,
      listingUrl: input.listingUrl,
      queryHash: input.query.hash,
      queryText: input.query.queryText,
      keywords: input.query.keywords,
      location: input.query.location,
      minPrice: input.query.minPrice,
      maxPrice: input.query.maxPrice,
    }),
  });

  const parsed = await parseJsonResponse<InternalSimilarEnqueueResponse>(response);

  if (!response.ok || !parsed?.success || !parsed.jobId) {
    throw new Error(
      parsed?.error ??
        `Internal scraper similar enqueue request failed with status ${response.status}.`,
    );
  }

  return { jobId: parsed.jobId };
}
