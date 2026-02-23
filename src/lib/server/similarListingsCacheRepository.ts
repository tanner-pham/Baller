import 'server-only';

import { getSupabaseServiceRoleClient } from '../supabaseServerClient';

interface SimilarListingsCacheRow {
  listing_id: string;
  query_hash: string;
  similar_payload: unknown;
  computed_at: string;
  expires_at: string;
}

export interface SimilarListingsCacheEntry<TPayload = unknown> {
  listingId: string;
  queryHash: string;
  similarPayload: TPayload;
  computedAt: string;
  expiresAt: string;
}

export interface UpsertSimilarListingsCacheInput<TPayload = unknown> {
  listingId: string;
  queryHash: string;
  similarPayload: TPayload;
  computedAt?: string;
  expiresAt: string;
}

/**
 * Reads one similar-listings cache row by listing id and query hash.
 */
export async function getSimilarListingsCacheEntry<TPayload = unknown>(
  listingId: string,
  queryHash: string,
): Promise<SimilarListingsCacheEntry<TPayload> | null> {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('similar_listings_cache')
    .select('listing_id, query_hash, similar_payload, computed_at, expires_at')
    .eq('listing_id', listingId)
    .eq('query_hash', queryHash)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read similar_listings_cache: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as SimilarListingsCacheRow;

  return {
    listingId: row.listing_id,
    queryHash: row.query_hash,
    similarPayload: row.similar_payload as TPayload,
    computedAt: row.computed_at,
    expiresAt: row.expires_at,
  };
}

/**
 * Upserts one similar-listings cache row.
 */
export async function upsertSimilarListingsCacheEntry<TPayload = unknown>(
  input: UpsertSimilarListingsCacheInput<TPayload>,
): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();

  const { error } = await supabase.from('similar_listings_cache').upsert(
    {
      listing_id: input.listingId,
      query_hash: input.queryHash,
      similar_payload: input.similarPayload,
      computed_at: input.computedAt ?? new Date().toISOString(),
      expires_at: input.expiresAt,
    },
    { onConflict: 'listing_id,query_hash' },
  );

  if (error) {
    throw new Error(`Failed to upsert similar_listings_cache: ${error.message}`);
  }
}
