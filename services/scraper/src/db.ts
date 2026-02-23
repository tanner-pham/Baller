import { createClient } from '@supabase/supabase-js';
import { scraperConfig } from './config.js';
import type { NormalizedSimilarListing } from './types.js';

const supabase = createClient(scraperConfig.SUPABASE_URL, scraperConfig.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface SimilarJobStatusInput {
  listingId: string;
  queryHash: string;
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attemptCount: number;
  errorMessage?: string | null;
  completedAt?: string | null;
}

/**
 * Upserts one async similar-listing job row.
 */
export async function upsertSimilarJobStatus(input: SimilarJobStatusInput): Promise<void> {
  const { error } = await supabase.from('similar_listing_jobs').upsert(
    {
      listing_id: input.listingId,
      query_hash: input.queryHash,
      job_id: input.jobId,
      status: input.status,
      attempt_count: input.attemptCount,
      error_message: input.errorMessage ?? null,
      last_enqueued_at: new Date().toISOString(),
      completed_at: input.completedAt ?? null,
    },
    { onConflict: 'listing_id,query_hash' },
  );

  if (error) {
    throw new Error(`Failed to upsert similar job status: ${error.message}`);
  }
}

/**
 * Upserts one similar-listings cache row with TTL-based expiry.
 */
export async function upsertSimilarListingsCache(input: {
  listingId: string;
  queryHash: string;
  similarListings: NormalizedSimilarListing[];
  computedAt?: Date;
}): Promise<void> {
  const computedAt = input.computedAt ?? new Date();
  const expiresAt = new Date(
    computedAt.getTime() + scraperConfig.SIMILAR_CACHE_TTL_HOURS * 60 * 60 * 1000,
  );

  const { error } = await supabase.from('similar_listings_cache').upsert(
    {
      listing_id: input.listingId,
      query_hash: input.queryHash,
      similar_payload: input.similarListings,
      computed_at: computedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'listing_id,query_hash' },
  );

  if (error) {
    throw new Error(`Failed to upsert similar listings cache: ${error.message}`);
  }
}
