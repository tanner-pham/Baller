# `src/lib` Code Map

Shared utilities used by both route handlers and client components.

| File | Purpose | Key Exports | Depends On |
| --- | --- | --- | --- |
| `src/lib/facebookMarketplaceListing.ts` | Validates/parses Facebook Marketplace URLs and returns normalized route-safe values. | `parseFacebookMarketplaceListingUrl`, `isFacebookMarketplaceListingUrl` | URL API |
| `src/lib/supabaseBrowserClient.ts` | Browser singleton Supabase client factory with env guards. | `getSupabaseBrowserClient`, `isSupabaseBrowserConfigured` | `@supabase/supabase-js` |
| `src/lib/supabaseServerClient.ts` | Server-only Supabase service role client factory. | `getSupabaseServiceRoleClient` | `@supabase/supabase-js`, `server-only` |
| `src/lib/auth/useAuthSession.ts` | Shared client auth/session hook used across auth, navigation, and dashboard. | `useAuthSession` | browser Supabase client |
| `src/lib/server/cacheTtl.ts` | Shared 48h cache freshness helper utilities. | `CACHE_TTL_HOURS`, `isCacheFresh` | server runtime |
| `src/lib/server/listingCacheRepository.ts` | Service-role repository for listing cache reads/writes. | `getListingCacheEntry`, `upsertListingCacheEntry` | `src/lib/supabaseServerClient.ts` |
| `src/lib/server/conditionCacheRepository.ts` | Service-role repository for condition cache reads/writes. | `getConditionCacheEntry`, `upsertConditionCacheEntry` | `src/lib/supabaseServerClient.ts` |

## Notes

- `useAuthSession` is the canonical source for client-side session hydration and auth subscriptions.
- Server code should continue using `src/lib/supabaseServerClient.ts` and never import browser modules.
- Cache repository modules under `src/lib/server/` are server-only and should only be used in route handlers.
