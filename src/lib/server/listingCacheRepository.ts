import 'server-only';

import { getSupabaseServiceRoleClient } from '../supabaseServerClient';

interface ListingCacheRow {
  listing_id: string;
  normalized_url: string;
  listing_payload: unknown;
  computed_at: string;
}

export interface ListingCacheEntry<TPayload = unknown> {
  listingId: string;
  normalizedUrl: string;
  listingPayload: TPayload;
  computedAt: string;
}

interface UpsertListingCacheInput<TPayload = unknown> {
  listingId: string;
  normalizedUrl: string;
  listingPayload: TPayload;
  computedAt?: string;
}

/**
 * Reads one cached listing payload by listing identifier.
 */
export async function getListingCacheEntry<TPayload = unknown>(
  listingId: string,
): Promise<ListingCacheEntry<TPayload> | null> {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('listing_cache')
    .select('listing_id, normalized_url, listing_payload, computed_at')
    .eq('listing_id', listingId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read listing_cache: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as ListingCacheRow;

  return {
    listingId: row.listing_id,
    normalizedUrl: row.normalized_url,
    listingPayload: row.listing_payload as TPayload,
    computedAt: row.computed_at,
  };
}

/**
 * Upserts the latest normalized listing payload into shared cache.
 */
export async function upsertListingCacheEntry<TPayload = unknown>(
  input: UpsertListingCacheInput<TPayload>,
): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();

  const { error } = await supabase.from('listing_cache').upsert(
    {
      listing_id: input.listingId,
      normalized_url: input.normalizedUrl,
      listing_payload: input.listingPayload,
      computed_at: input.computedAt ?? new Date().toISOString(),
    },
    { onConflict: 'listing_id' },
  );

  if (error) {
    throw new Error(`Failed to upsert listing_cache: ${error.message}`);
  }
}
