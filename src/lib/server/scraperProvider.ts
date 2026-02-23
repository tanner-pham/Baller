import 'server-only';

export type ScraperProvider = 'internal' | 'rapidapi';

/**
 * Resolves the active listing provider with a stable fallback for rollout safety.
 */
export function resolveScraperProvider(): ScraperProvider {
  const configuredProvider = process.env.SCRAPER_PROVIDER?.trim().toLowerCase();
  return configuredProvider === 'internal' ? 'internal' : 'rapidapi';
}
