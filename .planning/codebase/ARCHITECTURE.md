# Architecture

**Analysis Date:** 2026-03-05

## Pattern Overview

**Overall:** Next.js App Router monolith with server-side scraping pipeline and AI-powered condition assessment

**Key Characteristics:**
- Next.js 16 App Router with file-based routing (`src/app/`)
- Server-side API routes handle all external service communication (scraping, OpenAI, Supabase)
- Client components use custom React hooks for data fetching and state management
- Supabase provides both authentication (client-side) and caching (server-side, service role)
- Multi-transport HTML fetcher abstracts scraping strategy (HTTP, Playwright-local, Browserless)
- Two-layer caching: listing cache and condition assessment cache, both with 48-hour TTL

## Layers

**Presentation Layer (Client Components):**
- Purpose: Render UI and manage client-side state
- Location: `src/app/(components)/`, `src/app/dashboard/(components)/`, `src/app/auth/page.tsx`
- Contains: React components marked `"use client"`, all rendering logic
- Depends on: Dashboard hooks, shared style constants, `lucide-react` icons
- Used by: Next.js page components

**Dashboard Hooks Layer:**
- Purpose: Encapsulate data fetching, lifecycle management, and client-side business logic
- Location: `src/app/dashboard/hooks/`
- Contains: `useMarketplaceListing`, `useConditionAssessment`, `useSimilarListings`, `useDashboardSession`, `useSearchHistory`
- Depends on: API routes (via `fetch`), Supabase browser client, auth session hook
- Used by: `DashboardClient.tsx`

**API Route Layer:**
- Purpose: Server-side request handling, caching, and orchestration of external calls
- Location: `src/app/api/`
- Contains: Next.js route handlers (`route.ts` files) for each endpoint
- Depends on: Scraper, cache repositories, OpenAI SDK, HTML parser
- Used by: Client hooks via HTTP fetch

**Scraper Layer:**
- Purpose: Fetch and parse Facebook Marketplace HTML into normalized data
- Location: `src/lib/server/scraper/`, `src/lib/server/facebookMarketplaceHtmlFetcher.ts`, `src/app/api/marketplace-listing/parseHtml.ts`
- Contains: Multi-transport fetcher, HTML parser with JSON script block extraction, search URL builder
- Depends on: `playwright-core`, Facebook HTML structure
- Used by: API routes (`marketplace-listing`, `simple-listings`)

**Cache Layer:**
- Purpose: Persist scraped listing data and condition assessments to reduce redundant external calls
- Location: `src/lib/server/listingCacheRepository.ts`, `src/lib/server/conditionCacheRepository.ts`, `src/lib/server/cacheTtl.ts`
- Contains: Supabase-backed CRUD for `listing_cache` and `condition_cache` tables
- Depends on: Supabase service role client
- Used by: API routes

**Auth Layer:**
- Purpose: Client-side authentication state and Supabase session management
- Location: `src/lib/auth/useAuthSession.ts`, `src/lib/supabaseBrowserClient.ts`, `src/lib/supabaseServerClient.ts`
- Contains: Browser client singleton, server service role client factory, auth session hook
- Depends on: `@supabase/supabase-js`
- Used by: Dashboard hooks, Navigation, Auth page

**Shared Utilities:**
- Purpose: URL parsing, image filtering, HTTP helpers, type definitions
- Location: `src/lib/facebookMarketplaceListing.ts`, `src/app/dashboard/utils/`, `src/app/api/marketplace-listing/types.ts`
- Contains: URL validation/normalization, video URL detection, JSON response reader
- Used by: All layers

## Data Flow

**Primary Flow -- Listing Analysis:**

1. User pastes Facebook Marketplace URL into `Hero` (landing) or `Navigation` (dashboard) input
2. `parseFacebookMarketplaceListingUrl()` in `src/lib/facebookMarketplaceListing.ts` validates and extracts `itemId`
3. Router navigates to `/dashboard?listingUrl=...&itemId=...`
4. `DashboardClient` reads query params, creates `parsedListing` via `useMemo`
5. `useMarketplaceListing` hook fires `GET /api/marketplace-listing?itemId=...&listingUrl=...`
6. API route checks `listing_cache` (Supabase) for fresh entry (48h TTL via `isCacheFresh()`)
7. On cache miss: `scrapeMarketplaceListing()` orchestrates:
   a. `fetchMarketplaceHtmlWithFallback()` fetches listing page HTML (tries HTTP, then Playwright)
   b. `parseMarketplaceListingHtml()` extracts listing data from JSON script blocks, with DOM fallback
   c. `buildMarketplaceSearchUrl()` constructs search URL using listing title, location, condition, price
   d. `fetchMarketplaceHtmlWithFallback()` fetches search page HTML
   e. `parseMarketplaceSearchHtml()` extracts comparable listings
   f. Merges missing fields from search results into listing
   g. Converts `simpleListings` to `similarListings` for frontend compatibility
8. API route caches result in `listing_cache` and returns JSON
9. `useMarketplaceListing` updates state, triggering `useConditionAssessment`

**Secondary Flow -- Condition Assessment:**

1. `useConditionAssessment` fires when listing has images and `isListingLoading` is false
2. `POST /api/assess-condition` with `imageUrl`, `description`, `listedPrice`, `listingId`, `images`, `postedTime`
3. API route checks `condition_cache` for fresh entry
4. On cache miss: `fetchImageAsDataUrl()` downloads primary image as base64 data URL
5. `buildAssessmentPrompt()` creates GPT-4o-mini prompt with scoring guide
6. OpenAI API call with vision (image + text), falls back to text-only on `invalid_image_url` error
7. `parseAssessmentResponse()` normalizes model output into stable shape
8. `calculateModelAccuracy()` computes confidence score from image count, description length, recency
9. `clampAssessmentToListedPrice()` ensures suggested offer does not exceed ask price
10. Result cached in `condition_cache` and returned

**Tertiary Flow -- Search History (Authenticated):**

1. `useDashboardSession` exposes auth state from `useAuthSession`
2. `useSearchHistory` loads history from `user_listing_history` table on mount (via Supabase browser client)
3. When a listing is analyzed, upserts current search into `user_listing_history`
4. History displayed as horizontal scroll cards in "Previous Listings" section

**State Management:**
- No global state store (no Redux, Zustand, etc.)
- All state is local React `useState` within custom hooks
- `useSearchParams()` drives dashboard state via URL query parameters
- `useMemo` used sparingly to avoid redundant URL parsing
- Auth state flows through `useAuthSession` -> `useDashboardSession` -> component tree

## Key Abstractions

**NormalizedMarketplaceListing:**
- Purpose: Canonical shape for all listing data regardless of scraping source
- Defined in: `src/app/api/marketplace-listing/types.ts`
- Pattern: Optional fields throughout -- scraping may produce partial data
- Contains: `title`, `description`, `price`, `location`, `locationId`, `images`, `sellerName`, `listingDate`, `condition`, `simpleListings`, `similarListings`

**Multi-Transport HTML Fetcher:**
- Purpose: Abstract away scraping strategy selection
- Defined in: `src/lib/server/facebookMarketplaceHtmlFetcher.ts`
- Pattern: Cascading fallback -- tries transports in order, returns first success
- Transports: `http` (raw fetch with cookies), `playwright-local` (headless Chromium with persistent context), `playwright-browserless` (remote WebSocket)
- Configuration: `MARKETPLACE_HTML_FETCH_MODE` env var or auto-detection

**HTML Parser (parseHtml.ts):**
- Purpose: Extract structured data from Facebook's rendered HTML
- Defined in: `src/app/api/marketplace-listing/parseHtml.ts`
- Pattern: Three-tier extraction: JSON script blocks > DOM content > og:meta fallback
- Exports: `parseMarketplaceListingHtml()`, `parseMarketplaceSearchHtml()`, `buildMarketplaceSearchUrl()`, `looksLikeFacebookAuthWall()`

**Cache Repositories:**
- Purpose: Abstract Supabase cache table operations
- Defined in: `src/lib/server/listingCacheRepository.ts`, `src/lib/server/conditionCacheRepository.ts`
- Pattern: Generic `<TPayload>` typing, upsert on conflict, shared 48h TTL

**MarketplaceHtmlFetchError:**
- Purpose: Typed error for upstream scraping failures with HTTP status propagation
- Defined in: `src/lib/server/facebookMarketplaceHtmlFetcher.ts`
- Pattern: Custom Error subclass with `status` and `details` fields

## Entry Points

**Landing Page (`/`):**
- Location: `src/app/page.tsx`
- Triggers: Direct navigation
- Responsibilities: Marketing content, URL input that navigates to dashboard

**Dashboard (`/dashboard`):**
- Location: `src/app/dashboard/page.tsx` -> `src/app/dashboard/DashboardClient.tsx`
- Triggers: URL navigation with optional `?listingUrl=...&itemId=...` params
- Responsibilities: Listing analysis orchestration, condition assessment, similar listings, search history

**Auth Page (`/auth`):**
- Location: `src/app/auth/page.tsx`
- Triggers: Navigation from unauthenticated state
- Responsibilities: Login/signup form, Supabase auth integration

**API: Marketplace Listing (`GET /api/marketplace-listing`):**
- Location: `src/app/api/marketplace-listing/route.ts`
- Triggers: `useMarketplaceListing` hook
- Responsibilities: Cache check, scraping orchestration, cache write, stale fallback on failure

**API: Assess Condition (`POST /api/assess-condition`):**
- Location: `src/app/api/assess-condition/route.ts`
- Triggers: `useConditionAssessment` hook
- Responsibilities: Cache check, image fetching, OpenAI vision call, response normalization, cache write

**API: Simple Listings (`GET /api/simple-listings`):**
- Location: `src/app/api/simple-listings/route.ts`
- Triggers: Standalone search for comparable listings by `listingId`
- Responsibilities: Reads listing from cache, builds search URL, fetches and parses search results, merges into cache

**API: Similar Listings (`GET /api/similar-listings`):**
- Location: `src/app/api/similar-listings/route.ts`
- Triggers: `useSimilarListings` hook (not actively used in main dashboard flow)
- Responsibilities: RapidAPI-based marketplace search with Jaccard similarity scoring

## Error Handling

**Strategy:** Defensive fallback chains with stale cache as safety net

**Patterns:**
- **Stale cache fallback:** Both `marketplace-listing` and `assess-condition` API routes attempt fresh computation, fall back to stale cached data on failure (e.g., `getStaleFallbackResponse()` in listing route)
- **Transport fallback:** HTML fetcher cascades through transports (HTTP -> Playwright-local -> Browserless), retries with mobile URL variants
- **OpenAI retry:** Condition assessment retries with text-only when image URL is rejected by the model (`invalid_image_url`)
- **Parser fallback:** HTML parser tries JSON script blocks first, falls back to DOM parsing, then og:meta extraction
- **Client-side resilience:** Hooks use `AbortController` with configurable timeouts (20s default), catch promise rejections, and set error state for UI fallback messaging
- **Cache write failures are non-fatal:** All cache write operations are wrapped in try/catch and logged but do not propagate to the caller

## Cross-Cutting Concerns

**Logging:** `console.info`/`console.error`/`console.warn` with structured context objects. No external logging framework.

**Validation:** Input validation at API route boundaries (query params, request body). URL validation via `parseFacebookMarketplaceListingUrl()`. HTML content validators passed to fetcher.

**Authentication:** Supabase Auth with email/password. Client-side session management via `useAuthSession`. Server routes use service role key for cache access (bypass RLS). User history table has RLS policies enforcing `auth.uid() = user_id`.

**Caching:** 48-hour TTL (`CACHE_TTL_HOURS = 48` in `src/lib/server/cacheTtl.ts`). Observability via `x-cache-status` response header (`hit`, `miss`, `stale-refresh`, `stale-fallback`, `compute-no-key`).

---

*Architecture analysis: 2026-03-05*
