# External Integrations

**Analysis Date:** 2026-03-05

## APIs & External Services

**OpenAI:**
- Purpose: AI-powered condition assessment of marketplace listings (image + text analysis)
- SDK/Client: `openai` ^6.22.0
- Auth: `OPENAI_API_KEY` env var
- Model: `gpt-4o-mini` (multimodal, vision + text)
- Implementation: `src/app/api/assess-condition/route.ts`
- Request format: JSON response mode with structured prompt (`src/app/api/assess-condition/prompt.ts`)
- Image handling: Downloads listing images as base64 data URLs before sending to OpenAI (`src/app/api/assess-condition/image.ts`)
- Fallback: If image URL is invalid or inaccessible, retries with text-only assessment
- Max tokens: 500 per request

**Facebook Marketplace (Web Scraping):**
- Purpose: Scrape listing details and search for comparable listings
- Transport modes (configurable via `MARKETPLACE_HTML_FETCH_MODE`):
  - `http` - Direct HTTP fetch with Facebook cookies (`FACEBOOK_COOKIE_HEADER`)
  - `playwright-local` - Local Playwright browser automation (primary mode)
  - `playwright-browserless` - Remote Browserless.io service (`BROWSERLESS_WS_URL`)
- Implementation: `src/lib/server/facebookMarketplaceHtmlFetcher.ts` (multi-transport fetcher with fallback chain)
- Scraper orchestration: `src/lib/server/scraper/scrapeMarketplace.ts`
- HTML parsing: `src/app/api/marketplace-listing/parseHtml.ts`
- URL validation: `src/lib/facebookMarketplaceListing.ts`
- Targets: `www.facebook.com` and `m.facebook.com` (mobile fallback)
- Data extracted: title, price, description, location, locationId, images, seller, condition, listing date
- Search: Uses `marketplace/{locationId}/search` URL pattern for geo-scoped comparable search
- Auth: Optional Facebook session cookies or Playwright storage state (`FACEBOOK_PLAYWRIGHT_STORAGE_STATE_B64`)

**RapidAPI Facebook Marketplace (Optional):**
- Purpose: Alternative similar listings search via third-party API
- Auth: `RAPIDAPI_KEY` env var, `RAPIDAPI_HOST` env var (defaults to `facebook-marketplace1.p.rapidapi.com`)
- Implementation: `src/app/api/similar-listings/route.ts`
- Similarity: Jaccard word-overlap algorithm with price-band filtering (+-40%)

## Data Storage

**Databases:**
- Supabase PostgreSQL (hosted)
  - Connection: `SUPABASE_URL` + `SUPABASE_ANON_KEY` (browser client) or `SUPABASE_SERVICE_ROLE_KEY` (server client)
  - Client library: `@supabase/supabase-js` ^2.95.3
  - Browser client (singleton): `src/lib/supabaseBrowserClient.ts`
  - Server client (service role): `src/lib/supabaseServerClient.ts`
  - Legacy backend client: `backend/supabaseClient.js`

**Database Tables:**
- `listing_cache` - Cached scraped listing payloads (JSONB)
  - Primary key: `listing_id` (text)
  - Columns: `normalized_url`, `listing_payload` (JSONB), `computed_at`, `created_at`, `updated_at`
  - Repository: `src/lib/server/listingCacheRepository.ts`
  - RLS enabled, accessed via service role key (no row-level policies defined for public access)
- `condition_cache` - Cached AI condition assessments (JSONB)
  - Primary key: `listing_id` (text)
  - Columns: `assessment_payload` (JSONB), `computed_at`, `created_at`, `updated_at`
  - Repository: `src/lib/server/conditionCacheRepository.ts`
  - RLS enabled, accessed via service role key
- `user_listing_history` - Per-user search history (cross-device)
  - Primary key: `id` (bigint, auto-increment)
  - Columns: `user_id` (UUID, FK to `auth.users`), `listing_id`, `listing_url`, `listing_title`, `last_searched_at`, `created_at`, `updated_at`
  - Unique constraint: `(user_id, listing_id)`
  - Index: `(user_id, last_searched_at DESC)` for efficient history queries
  - RLS: Users can only CRUD their own rows (`auth.uid() = user_id`)
  - Auto-prune trigger: Keeps max 25 entries per user

**Cache TTL:**
- Shared TTL: 48 hours (`src/lib/server/cacheTtl.ts`)
- Stale-while-revalidate pattern: stale cache served on upstream failure, refreshed on next success
- Cache status headers: `x-cache-status` with values `hit`, `miss`, `stale-refresh`, `stale-fallback`, `compute-no-key`

**Migrations:**
- Location: `supabase/migrations/`
- Schema: `supabase/migrations/202602170001_listing_cache_and_user_history.sql`
- Managed via Supabase CLI (`supabase/config.toml`)
- Includes auto-`updated_at` triggers and history pruning trigger

**File Storage:**
- None (images are fetched on-demand from Facebook CDN and converted to base64 data URLs)

**Caching:**
- Application-level cache via Supabase PostgreSQL tables (listing_cache, condition_cache)
- No Redis or in-memory cache layer

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email/password)
  - Implementation: `src/lib/auth/useAuthSession.ts` (React hook)
  - Auth page: `src/app/auth/page.tsx` (login/signup form)
  - Features: Sign up, sign in with password, auto-refresh tokens, session persistence
  - Browser client handles auth state changes via `onAuthStateChange` subscription
  - Server client uses service role key (bypasses RLS)
  - Optional: Supabase auth can be disabled (app works in "unauthenticated mode" when env vars are missing)

**Auth Flow:**
1. User signs up/in at `/auth` page
2. Supabase Auth issues JWT
3. Browser client persists session, auto-refreshes tokens
4. Dashboard checks auth via `useDashboardSession` hook (`src/app/dashboard/hooks/useDashboardSession.ts`)
5. Authenticated users get: search history, unlimited searches
6. Unauthenticated users see sign-in popup when attempting searches

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, etc.)

**Logs:**
- `console.info`, `console.error`, `console.warn` throughout server-side code
- Structured log objects with context: `{ listingId, error, computedAt, ... }`
- Cache observability: `x-cache-status` response header on API routes

## CI/CD & Deployment

**Hosting:**
- Likely Vercel (`.vercel` in `.gitignore`, Next.js framework)
- No deployment config file detected

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Triggers: Push to any branch, PR to `main`
- Jobs:
  1. `frontend-tests` - ESLint + Jest (Node.js 20)
  2. `backend-tests` - Mocha (Node.js 20, requires Supabase secrets)
- No deployment step in CI

**Issue Templates:**
- GitHub issue templates in `.github/ISSUE_TEMPLATE/`

## Environment Configuration

**Required env vars:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side cache operations)
- `OPENAI_API_KEY` - OpenAI API key (condition assessment)

**Scraper env vars (at least one transport required):**
- `MARKETPLACE_HTML_FETCH_MODE` - Transport mode: `http`, `playwright`, `playwright-local`, `playwright-browserless`, `auto`
- `MARKETPLACE_USE_LOCAL_PLAYWRIGHT` - Enable local Playwright (`true`/`false`)
- `MARKETPLACE_PLAYWRIGHT_USER_DATA_DIR` - Browser profile directory (default: `.browser-data`)
- `MARKETPLACE_PLAYWRIGHT_HEADLESS` - Headless mode (`true`/`false`)
- `MARKETPLACE_PLAYWRIGHT_CHANNEL` - Browser channel (default: `null` for bundled Chromium)
- `MARKETPLACE_PLAYWRIGHT_EXECUTABLE_PATH` - Custom browser path
- `MARKETPLACE_HTML_TIMEOUT_MS` - Fetch timeout in ms (default: 15000)
- `MARKETPLACE_PLAYWRIGHT_BOOTSTRAP` - Enable bootstrap navigation (`true`/`false`)
- `BROWSERLESS_WS_URL` - Browserless.io WebSocket URL (for remote browser)
- `FACEBOOK_COOKIE_HEADER` - Facebook session cookies (for HTTP transport)
- `FACEBOOK_PLAYWRIGHT_STORAGE_STATE_B64` - Base64-encoded Playwright storage state

**Optional env vars:**
- `RAPIDAPI_KEY` - RapidAPI key for similar-listings fallback
- `RAPIDAPI_HOST` - RapidAPI host (default: `facebook-marketplace1.p.rapidapi.com`)

**Secrets location:**
- `.env` file locally (gitignored)
- `.env.example` documents all variables
- GitHub Actions secrets for CI (SUPABASE_URL, SUPABASE_ANON_KEY)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## API Routes

**`GET /api/marketplace-listing`:**
- Params: `itemId` or `listingUrl`
- Scrapes Facebook Marketplace listing via HTML fetcher
- Returns `NormalizedMarketplaceListing` with comparable listings
- Caches results in Supabase `listing_cache`
- Runtime: Node.js, maxDuration: 300s

**`GET /api/simple-listings`:**
- Params: `listingId`
- Fetches comparable search results from Facebook Marketplace HTML
- Requires listing to exist in cache first
- Merges results back into cached listing payload

**`GET /api/similar-listings`:**
- Params: `query`, `targetPrice`, `maxResults`
- Uses RapidAPI Facebook Marketplace search
- Calculates Jaccard similarity scores

**`POST /api/assess-condition`:**
- Body: `{ imageUrl, description, listingId, listedPrice, images, postedTime }`
- Uses OpenAI GPT-4o-mini for condition assessment
- Returns condition score, label, pricing suggestions, negotiation tips
- Caches results in Supabase `condition_cache`
- Clamps suggested offer to not exceed listed price

---

*Integration audit: 2026-03-05*
