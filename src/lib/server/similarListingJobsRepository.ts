import 'server-only';

import { getSupabaseServiceRoleClient } from '../supabaseServerClient';

type SimilarListingJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface SimilarListingJobRow {
  listing_id: string;
  query_hash: string;
  job_id: string;
  status: SimilarListingJobStatus;
  attempt_count: number;
  error_message: string | null;
  last_enqueued_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimilarListingJobEntry {
  listingId: string;
  queryHash: string;
  jobId: string;
  status: SimilarListingJobStatus;
  attemptCount: number;
  errorMessage: string | null;
  lastEnqueuedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSimilarListingJobInput {
  listingId: string;
  queryHash: string;
  jobId: string;
  status: SimilarListingJobStatus;
  attemptCount?: number;
  errorMessage?: string | null;
  lastEnqueuedAt?: string;
  completedAt?: string | null;
}

/**
 * Reads one similar-listing job row by listing id and query hash.
 */
export async function getSimilarListingJobEntry(
  listingId: string,
  queryHash: string,
): Promise<SimilarListingJobEntry | null> {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('similar_listing_jobs')
    .select(
      'listing_id, query_hash, job_id, status, attempt_count, error_message, last_enqueued_at, completed_at, created_at, updated_at',
    )
    .eq('listing_id', listingId)
    .eq('query_hash', queryHash)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read similar_listing_jobs: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as SimilarListingJobRow;

  return {
    listingId: row.listing_id,
    queryHash: row.query_hash,
    jobId: row.job_id,
    status: row.status,
    attemptCount: row.attempt_count,
    errorMessage: row.error_message,
    lastEnqueuedAt: row.last_enqueued_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Upserts one similar-listing job row.
 */
export async function upsertSimilarListingJobEntry(
  input: UpsertSimilarListingJobInput,
): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();

  const { error } = await supabase.from('similar_listing_jobs').upsert(
    {
      listing_id: input.listingId,
      query_hash: input.queryHash,
      job_id: input.jobId,
      status: input.status,
      attempt_count: input.attemptCount ?? 0,
      error_message: input.errorMessage ?? null,
      last_enqueued_at: input.lastEnqueuedAt ?? new Date().toISOString(),
      completed_at: input.completedAt ?? null,
    },
    { onConflict: 'listing_id,query_hash' },
  );

  if (error) {
    throw new Error(`Failed to upsert similar_listing_jobs: ${error.message}`);
  }
}

export type { SimilarListingJobStatus };
