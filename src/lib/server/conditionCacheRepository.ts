import 'server-only';

import { getSupabaseServiceRoleClient } from '../supabaseServerClient';

interface ConditionCacheRow {
  listing_id: string;
  assessment_payload: unknown;
  computed_at: string;
}

export interface ConditionCacheEntry<TPayload = unknown> {
  listingId: string;
  assessmentPayload: TPayload;
  computedAt: string;
}

interface UpsertConditionCacheInput<TPayload = unknown> {
  listingId: string;
  assessmentPayload: TPayload;
  computedAt?: string;
}

/**
 * Reads one cached condition payload by listing identifier.
 */
export async function getConditionCacheEntry<TPayload = unknown>(
  listingId: string,
): Promise<ConditionCacheEntry<TPayload> | null> {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('condition_cache')
    .select('listing_id, assessment_payload, computed_at')
    .eq('listing_id', listingId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read condition_cache: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const row = data as ConditionCacheRow;

  return {
    listingId: row.listing_id,
    assessmentPayload: row.assessment_payload as TPayload,
    computedAt: row.computed_at,
  };
}

/**
 * Upserts the latest condition payload into shared cache.
 */
export async function upsertConditionCacheEntry<TPayload = unknown>(
  input: UpsertConditionCacheInput<TPayload>,
): Promise<void> {
  const supabase = getSupabaseServiceRoleClient();

  const { error } = await supabase.from('condition_cache').upsert(
    {
      listing_id: input.listingId,
      assessment_payload: input.assessmentPayload,
      computed_at: input.computedAt ?? new Date().toISOString(),
    },
    { onConflict: 'listing_id' },
  );

  if (error) {
    throw new Error(`Failed to upsert condition_cache: ${error.message}`);
  }
}
