# Codebase Concerns

**Analysis Date:** 2026-03-05

## Tech Debt

**Duplicate Price-Parsing Functions:**
- Issue: `parsePriceToNumber()` in `src/app/dashboard/DashboardClient.tsx` (line 38), `parseNumericPrice()` in `src/lib/server/scraper/scrapeMarketplace.ts` (line 49), `parseListingPriceNumber()` in `src/app/api/marketplace-listing/parseHtml.ts` (line 508), and `parseUsdAmount()` in `src/app/api/assess-condition/route.ts` (line 32) all perform the same "$1,200" -> number conversion with minor variations.
- Files: `src/app/dashboard/DashboardClient.tsx`, `src/lib/server/scraper/scrapeMarketplace.ts`, `src/app/api/marketplace-listing/parseHtml.ts`, `src/app/api/assess-condition/route.ts`
- Impact: Logic divergence risk. One implementation may handle edge cases (e.g., "Free", "$0", currency symbols) differently than others.
- Fix approach: Extract a single `parseUsdPrice(value: string): number | null` utility into `src/lib/` and import everywhere.

**Deprecated `normalizeAccuracyString` Still Present:**
- Issue: The function at line 92 in `src/app/api/assess-condition/normalize.ts` is marked `@deprecated` but has not been removed. Model accuracy is now computed client-side via `calculateModelAccuracy()`.
- Files: `src/app/api/assess-condition/normalize.ts`
- Impact: Dead code. No callers exist, but it remains importable and misleading.
- Fix approach: Delete `normalizeAccuracyString` function entirely.

**Dead/Orphaned `useSimilarListings` Hook:**
- Issue: `src/app/dashboard/hooks/useSimilarListings.ts` fetches from `/api/similar-listings` (RapidAPI route), but no component imports or invokes it. The dashboard uses `similarListings` and `simpleListings` from the marketplace listing API response instead.
- Files: `src/app/dashboard/hooks/useSimilarListings.ts`, `src/app/api/similar-listings/route.ts`
- Impact: Dead code path. The RapidAPI route itself (`src/app/api/similar-listings/route.ts`) may also be unused in production and requires a paid `RAPIDAPI_KEY`.
- Fix approach: Confirm no external callers of `/api/similar-listings`, then remove both the hook and the route. If the RapidAPI integration is planned for future use, add a comment explaining its status.

**Hardcoded Default Similar Listings:**
- Issue: `DEFAULT_SIMILAR_LISTINGS` in `src/app/dashboard/constants.ts` contains hardcoded mock data (MacBook Pro M3, Dell XPS, etc.) with Unsplash images. These are never rendered in the current flow but remain importable.
- Files: `src/app/dashboard/constants.ts`
- Impact: Misleading artifact. If rendered accidentally, it would display fake data.
- Fix approach: Remove `DEFAULT_SIMILAR_LISTINGS` if not used, or clearly mark as test-only fixture.

**Inconsistent Price Representation Across Types:**
- Issue: `NormalizedMarketplaceListing.price` is `string | undefined` (e.g., "$650"), while `NormalizedSimilarListing.price` is `number`, and `NormalizedSimpleListing.price` is `string`. This forces repeated parse-then-format conversions at each boundary (scraper -> API -> dashboard).
- Files: `src/app/api/marketplace-listing/types.ts`, `src/app/dashboard/types.ts`
- Impact: Every consumer must re-parse prices. The `simpleListings` -> `similarListings` conversion in `DashboardClient.tsx` (line 257-263) performs inline `Number(sl.price.replace(...))` that could silently produce `0` on unexpected formats.
- Fix approach: Standardize on `number | null` for price in all types, format to display string only at render time.

**Supabase Client Created Per-Call (Server):**
- Issue: `getSupabaseServiceRoleClient()` in `src/lib/supabaseServerClient.ts` creates a new `createClient()` instance on every invocation. Each API request that reads/writes cache creates multiple Supabase client instances.
- Files: `src/lib/supabaseServerClient.ts`
- Impact: Unnecessary object allocation and potential connection overhead per request. Not a correctness issue because Supabase JS client is lightweight, but it deviates from the singleton pattern used for the browser client.
- Fix approach: Cache a module-level singleton (like `src/lib/supabaseBrowserClient.ts` does) with a lazy initialization guard.

## Security Considerations

**No API Route Authentication:**
- Risk: All API routes (`/api/marketplace-listing`, `/api/assess-condition`, `/api/simple-listings`, `/api/similar-listings`) are publicly accessible. Any client can trigger scrapes and OpenAI API calls without authentication.
- Files: `src/app/api/marketplace-listing/route.ts`, `src/app/api/assess-condition/route.ts`, `src/app/api/simple-listings/route.ts`, `src/app/api/similar-listings/route.ts`
- Current mitigation: None. The dashboard shows a sign-in popup for unauthed users on the UI side, but API endpoints have no auth checks.
- Recommendations: Add auth middleware or check `Authorization` header / Supabase session in each API route. At minimum, rate-limit unauthenticated requests.

**No Rate Limiting:**
- Risk: No rate limiting on any API route. A single client can repeatedly trigger Playwright scrapes (resource-intensive) and OpenAI API calls (cost-incurring) without throttle.
- Files: All files in `src/app/api/`
- Current mitigation: None detected. No middleware file exists (`src/middleware.ts` is absent).
- Recommendations: Add Next.js middleware for rate limiting (per-IP or per-session). Especially critical for `/api/assess-condition` (OpenAI costs) and `/api/marketplace-listing` (Playwright resource usage).

**Supabase Service Role Key Used Server-Side (Correct, but Sensitive):**
- Risk: `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. If API routes are exploited, an attacker could read/write any row in `listing_cache` and `condition_cache`.
- Files: `src/lib/supabaseServerClient.ts`, `src/lib/server/listingCacheRepository.ts`, `src/lib/server/conditionCacheRepository.ts`
- Current mitigation: Service role client is gated by `server-only` import. RLS policies exist on `user_listing_history` for user-scoped data.
- Recommendations: Evaluate whether cache tables need service role access, or if anon-key access with RLS policies would suffice.

**Supabase Anon Key and URL Exposed to Client Bundle:**
- Risk: `next.config.ts` explicitly passes `SUPABASE_URL` and `SUPABASE_ANON_KEY` via `env:` config, making them available in client-side JavaScript. This is by design for Supabase anon keys, but worth noting.
- Files: `next.config.ts`, `src/lib/supabaseBrowserClient.ts`
- Current mitigation: Supabase anon key is designed to be public. RLS policies enforce row-level access. The client only accesses `user_listing_history` with authenticated user context.
- Recommendations: Ensure no additional tables are accessible via anon key without appropriate RLS policies.

**`maxDuration: 300` on Marketplace Listing Route:**
- Risk: The marketplace listing route sets `maxDuration = 300` (5 minutes), allowing extremely long-running requests. Combined with no rate limiting, this could be used for resource exhaustion.
- Files: `src/app/api/marketplace-listing/route.ts` (line 14)
- Current mitigation: Actual timeouts are controlled by `DEFAULT_LISTING_FETCH_TIMEOUT_MS` (15s) and Playwright timeouts, but the Vercel function timeout is set very high.
- Recommendations: Reduce `maxDuration` to a more appropriate value (e.g., 30-60 seconds) that covers the actual scrape + parse flow.

**Playwright `--disable-web-security` Flag:**
- Risk: Local Playwright launches Chromium with `--disable-web-security` and `--disable-features=IsolateOrigins,site-per-process`, which disables same-origin policy. If the browser instance is compromised, cross-origin attacks are possible.
- Files: `src/lib/server/facebookMarketplaceHtmlFetcher.ts` (line 702)
- Current mitigation: Playwright contexts are short-lived (closed after each scrape) and run headless server-side.
- Recommendations: Remove `--disable-web-security` if not strictly needed for Facebook scraping. The flag may not be necessary given that `bypassCSP: true` is already set.

## Performance Bottlenecks

**Playwright Browser Launch Per Scrape Request:**
- Problem: Every marketplace listing request that uses local Playwright launches a full persistent browser context via `chromium.launchPersistentContext()`, navigates, captures payloads, and then closes the context. There is no browser pool or keep-alive.
- Files: `src/lib/server/facebookMarketplaceHtmlFetcher.ts` (line 684-910)
- Cause: The `localPlaywrightProfileLock` serializes requests (only one at a time), but each still incurs full browser launch overhead (~1-3 seconds). Concurrent requests queue behind the lock.
- Improvement path: Implement a browser context pool that keeps 1-2 persistent contexts alive between requests, reusing them with page-level isolation. Alternatively, consider keeping a single long-lived browser instance and creating new pages within it.

**Sequential Listing + Search Scrape:**
- Problem: `scrapeMarketplaceListing()` in `src/lib/server/scraper/scrapeMarketplace.ts` first fetches listing HTML, parses it, then fetches search HTML as a second sequential request. Total wall time is 2x the single-fetch latency.
- Files: `src/lib/server/scraper/scrapeMarketplace.ts` (lines 96-147)
- Cause: The search URL depends on listing data (title, location, price), so they cannot be parallelized.
- Improvement path: Return listing data to the client immediately after Step 2, then fetch comparables asynchronously (or via a separate client-initiated request). The `/api/simple-listings` route already supports this pattern.

**`parseScriptJsonBlocks` Parses All Script Tags:**
- Problem: Every `<script>` tag in the HTML is tested for JSON parsing. Facebook pages contain 20-50+ script tags, most of which are not JSON.
- Files: `src/app/api/marketplace-listing/parseHtml.ts` (line 62-82)
- Cause: Broad regex scan without pre-filtering for relevant script types (e.g., `type="application/json"`).
- Improvement path: Pre-filter script tags by attributes (e.g., `data-captured`, `type="application/json"`) before attempting `JSON.parse()`. Skip obviously non-JSON scripts (those starting with `var`, `function`, `window`, etc.).

**`walkObjects` Recursion Over Entire JSON Payloads:**
- Problem: The `walkObjects()` function iterates over every key/value in every parsed JSON block to find listing candidates. Facebook GraphQL payloads can be deeply nested with thousands of nodes.
- Files: `src/app/api/marketplace-listing/parseHtml.ts` (line 84-107)
- Cause: Stack-based DFS traversal with no depth limit or early exit after finding the target listing.
- Improvement path: Add a maximum depth limit. Exit early once the requested listing ID is found and a sufficient number of candidates are collected.

## Fragile Areas

**Facebook HTML Structure Dependency:**
- Files: `src/app/api/marketplace-listing/parseHtml.ts` (entire file, 1108 lines)
- Why fragile: The parser relies on specific Facebook HTML patterns: JSON script block structures, GraphQL field names (`marketplace_listing_title`, `listing_price.formatted_amount`, `reverse_geocode.city_page`), and DOM patterns (`alt="Product photo of"`, specific `<a>` href patterns). Any Facebook frontend change can silently break parsing.
- Safe modification: Always add new extraction paths as fallbacks after existing ones, never replace. Test with real captured HTML snapshots.
- Test coverage: `backend/marketplaceHtmlParser.test.ts` covers the major paths with synthetic HTML, but there are no tests with real Facebook HTML samples. Edge cases like missing fields, unexpected nesting, or new Facebook layouts are not tested.

**Login Interstitial Dismissal:**
- Files: `src/lib/server/facebookMarketplaceHtmlFetcher.ts` (lines 283-403)
- Why fragile: Facebook's login modal uses many selector patterns that change frequently. The dismissal logic tries 10+ CSS selectors, falls back to bounding-box clicks, keyboard Escape, and finally DOM removal. Any Facebook change to dialog structure breaks this chain.
- Safe modification: Add new selectors at the beginning of the arrays; never remove existing selectors that might still work in some regions/locales.
- Test coverage: No tests for interstitial dismissal logic.

**`useConditionAssessment` Effect Dependencies:**
- Files: `src/app/dashboard/hooks/useConditionAssessment.ts` (lines 159-168)
- Why fragile: The effect depends on `listing?.description`, `listing?.images`, `listing?.itemId`, `listing?.price`, `listing?.title`. If listing data arrives incrementally (e.g., price filled in via `mergeSearchMatchIntoListing`), the effect re-fires and makes a duplicate OpenAI API call, wasting cost. The `listing?.images` dependency compares by reference, so any re-render that creates a new array reference triggers a re-fetch.
- Safe modification: Derive a stable key (e.g., `listingId + imageCount + priceValue`) and use it as the sole effect dependency.
- Test coverage: No unit tests for this hook.

## Scaling Limits

**Single Playwright Profile Lock:**
- Current capacity: 1 concurrent Playwright scrape at a time (module-level `localPlaywrightProfileLock` in `src/lib/server/facebookMarketplaceHtmlFetcher.ts` line 619).
- Limit: Any concurrent requests queue behind the lock. Under moderate load (5+ simultaneous users), queue depth grows and requests time out.
- Scaling path: Use a browser pool with N concurrent contexts, or offload scraping to a dedicated worker service.

**Cache Tables Without TTL Cleanup:**
- Current capacity: `listing_cache` and `condition_cache` tables grow unbounded. Every unique listing ID creates a row that persists forever.
- Limit: Over time, table size grows, slowing queries and increasing storage costs. The `isCacheFresh()` check (48-hour TTL) only controls whether stale data is returned, not whether old rows are deleted.
- Scaling path: Add a scheduled job (e.g., Supabase pg_cron) to purge rows older than a configurable retention period (e.g., 30 days). Or add a `DELETE` call after returning stale-fallback responses.

**No CDN or Edge Caching for API Responses:**
- Current capacity: Every dashboard load triggers at least one API call to `/api/marketplace-listing`, even for the same listing viewed minutes ago.
- Limit: All caching is server-side in Supabase. The 48-hour TTL helps, but there is no HTTP-level caching (`Cache-Control` headers are not set on API responses).
- Scaling path: Set `Cache-Control` headers on cache-hit responses. Consider `stale-while-revalidate` patterns for fresh-enough listings.

## Dependencies at Risk

**Facebook Scraping Fragility (Not a Package, but Core Dependency):**
- Risk: The entire product depends on scraping Facebook Marketplace HTML. Facebook actively fights scraping with login walls, bot detection, dynamic HTML structures, and rate limiting. Any change to Facebook's anti-scraping measures can break the product entirely.
- Impact: Core functionality (listing data, comparables, pricing) is unavailable.
- Migration plan: No alternative data source is implemented. The RapidAPI route (`/api/similar-listings`) exists as a partial fallback for search results only, but requires a paid key and only covers search (not individual listing details).

**`playwright-core` Without Bundled Browser:**
- Risk: `playwright-core` (v1.58.2) does not bundle Chromium. The local Playwright transport depends on either a system Chromium installation or a configured `MARKETPLACE_PLAYWRIGHT_EXECUTABLE_PATH`. If the executable is missing or incompatible, scraping fails silently with unhelpful errors.
- Impact: Scraping breaks on any environment where Chromium is not pre-installed (e.g., fresh deployment without browser setup).
- Migration plan: Consider `@playwright/browser-chromium` or `@sparticuz/chromium-min` (already referenced in `next.config.ts` `serverExternalPackages`) to ensure a compatible browser is always available.

## Test Coverage Gaps

**No Tests for API Route Handlers:**
- What's not tested: The actual Next.js route handlers in `src/app/api/marketplace-listing/route.ts`, `src/app/api/assess-condition/route.ts`, `src/app/api/simple-listings/route.ts`. The existing `tests/backend/assess-condition.test.ts` uses a mock simulation function that re-implements route logic rather than testing the actual handler.
- Files: `src/app/api/marketplace-listing/route.ts`, `src/app/api/assess-condition/route.ts`, `src/app/api/simple-listings/route.ts`
- Risk: Cache logic, error handling, stale-fallback behavior, and response formatting are untested. Bugs in the routing layer (query param parsing, status codes, header setting) would not be caught.
- Priority: High

**No Tests for `facebookMarketplaceHtmlFetcher.ts`:**
- What's not tested: The entire multi-transport HTML fetcher (1200+ lines), including HTTP fallback chains, Playwright context management, cookie bootstrapping, login interstitial dismissal, GraphQL payload capture, and retry logic.
- Files: `src/lib/server/facebookMarketplaceHtmlFetcher.ts`
- Risk: The most complex file in the codebase has zero test coverage. Changes to fallback logic, timeout handling, or transport selection could introduce regressions undetected.
- Priority: High

**No Tests for Dashboard Hooks:**
- What's not tested: `useMarketplaceListing`, `useConditionAssessment`, `useSearchHistory`, `useDashboardSession` -- the core client-side data-fetching and state management hooks.
- Files: `src/app/dashboard/hooks/useMarketplaceListing.ts`, `src/app/dashboard/hooks/useConditionAssessment.ts`, `src/app/dashboard/hooks/useSearchHistory.ts`, `src/app/dashboard/hooks/useDashboardSession.ts`
- Risk: Timeout handling, abort controller cleanup, stale-state prevention, and error recovery are all untested. The effect dependency arrays in these hooks are complex and prone to subtle re-render bugs.
- Priority: Medium

**No Tests for `DashboardClient.tsx`:**
- What's not tested: The main dashboard page component that orchestrates listing display, condition assessment, search history, market value computation, and sign-in popup.
- Files: `src/app/dashboard/DashboardClient.tsx`
- Risk: UI logic bugs (e.g., showing stale data for a different listing, incorrect market value calculation, broken empty state) are not caught.
- Priority: Medium

**Three Test Frameworks in One Project:**
- What's not tested: The test infrastructure itself is fragmented. `package.json` contains Jest (v30), Mocha (v11), and Vitest (v4) as test runners, plus Chai as an assertion library. The `test` script runs Jest, `test:backend` runs Mocha, and Vitest config is present but unused.
- Files: `package.json`, `jest.config.ts`, `tests/`, `backend/`
- Risk: Confusion about which framework to use for new tests. Test files are split across `tests/backend/`, `tests/frontend/`, and `backend/` with inconsistent patterns. Some tests use `expect` from Chai, others from Jest.
- Priority: Low (organizational, not functional)

**No Integration Tests with Real Supabase:**
- What's not tested: Database read/write operations in `src/lib/server/listingCacheRepository.ts` and `src/lib/server/conditionCacheRepository.ts`. The `tests/backend/supabaseClient.test.ts` only checks that `createClient` can be imported.
- Files: `src/lib/server/listingCacheRepository.ts`, `src/lib/server/conditionCacheRepository.ts`
- Risk: Schema mismatches, RLS policy failures, or Supabase SDK behavior changes would not be caught.
- Priority: Medium

## Missing Critical Features

**No Error/Empty State UI for Failed Scrapes:**
- Problem: When `useMarketplaceListing` sets an error, `DashboardClient.tsx` does not render the error message. The `error` value from the hook is destructured but never displayed in JSX. Users see "Analyzing Listing..." indefinitely or a blank state.
- Blocks: Users have no feedback when a listing fails to load (auth wall, timeout, parse failure).

**No Cache Invalidation Mechanism:**
- Problem: Cached listings persist for 48 hours with no way to force a refresh. If a listing's price changes on Facebook, the cached (stale) data is served until TTL expires.
- Blocks: Users cannot get up-to-date pricing for recently-modified listings.

**Condition Assessment Uses Only First Image:**
- Problem: `useConditionAssessment` sends `listing.images?.[0]` to OpenAI (line 89 in `src/app/dashboard/hooks/useConditionAssessment.ts`). The TODO comment acknowledges this limitation. Multi-angle photos would significantly improve condition scoring accuracy.
- Blocks: Condition assessment quality is limited for listings with multiple photos showing different angles/defects.

---

*Concerns audit: 2026-03-05*
