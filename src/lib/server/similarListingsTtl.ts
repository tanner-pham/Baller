import 'server-only';

export const DEFAULT_SIMILAR_CACHE_TTL_HOURS = 12;

/**
 * Reads a configurable TTL for async similar listings cache entries.
 */
export function getSimilarCacheTtlHours(): number {
  const fromEnv = Number(process.env.SIMILAR_CACHE_TTL_HOURS);

  if (!Number.isFinite(fromEnv) || fromEnv <= 0) {
    return DEFAULT_SIMILAR_CACHE_TTL_HOURS;
  }

  return Math.floor(fromEnv);
}

/**
 * Computes the expiration timestamp for a new similar listings cache row.
 */
export function computeSimilarCacheExpiry(fromDate = new Date()): string {
  const ttlMs = getSimilarCacheTtlHours() * 60 * 60 * 1000;
  return new Date(fromDate.getTime() + ttlMs).toISOString();
}

/**
 * Returns true while a similar listings cache row remains valid.
 */
export function isSimilarCacheFresh(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false;
  }

  const expiresAtMs = Date.parse(expiresAt);

  if (Number.isNaN(expiresAtMs)) {
    return false;
  }

  return expiresAtMs > Date.now();
}
