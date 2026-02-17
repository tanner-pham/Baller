import 'server-only';

export const CACHE_TTL_HOURS = 48;
const CACHE_TTL_MS = CACHE_TTL_HOURS * 60 * 60 * 1000;

/**
 * Returns true when a cached row is still valid within the shared TTL window.
 */
export function isCacheFresh(computedAt: string | null | undefined): boolean {
  if (!computedAt) {
    return false;
  }

  const timestamp = Date.parse(computedAt);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp < CACHE_TTL_MS;
}
