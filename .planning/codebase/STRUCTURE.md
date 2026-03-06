# Codebase Structure

**Analysis Date:** 2026-03-05

## Directory Layout

```
baller/
├── .browser-data/              # Playwright persistent browser profile (gitignored)
├── .github/
│   ├── ISSUE_TEMPLATE/         # GitHub issue templates
│   └── workflows/              # CI/CD workflows
├── .planning/
│   └── codebase/               # GSD codebase analysis documents
├── backend/                    # Backend test files and utilities (Mocha/Chai)
│   ├── facebookMarketplaceListingUrl.test.ts
│   ├── marketplaceHtmlParser.test.ts
│   ├── README.md
│   └── supabaseClient.js
├── coverage/                   # Test coverage output (generated)
├── docs/
│   └── images/                 # Documentation images
├── public/
│   └── images/                 # Static assets (favicons, logos)
├── src/
│   ├── app/                    # Next.js App Router root
│   │   ├── (components)/       # Landing page components (route-group, not in URL)
│   │   ├── api/                # Server API routes
│   │   │   ├── assess-condition/   # POST: AI condition assessment
│   │   │   ├── marketplace-listing/# GET: Listing scraping + parsing
│   │   │   ├── similar-listings/   # GET: RapidAPI-based search (legacy)
│   │   │   └── simple-listings/    # GET: HTML-based comparable search
│   │   ├── auth/               # Auth page (login/signup)
│   │   ├── dashboard/          # Dashboard page + components + hooks
│   │   │   ├── (components)/   # Dashboard UI components
│   │   │   ├── hooks/          # Data fetching and state hooks
│   │   │   └── utils/          # Dashboard utility functions
│   │   ├── consts.ts           # Shared Tailwind style constants
│   │   ├── globals.css         # Global CSS
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── lib/                    # Shared library code
│   │   ├── auth/               # Auth session hook
│   │   ├── server/             # Server-only modules
│   │   │   ├── scraper/        # Scraping orchestration
│   │   │   ├── cacheTtl.ts     # Cache TTL logic
│   │   │   ├── conditionCacheRepository.ts  # Condition cache CRUD
│   │   │   ├── facebookMarketplaceHtmlFetcher.ts  # Multi-transport fetcher
│   │   │   └── listingCacheRepository.ts    # Listing cache CRUD
│   │   ├── facebookMarketplaceListing.ts    # URL parser/validator
│   │   ├── supabaseBrowserClient.ts         # Client-side Supabase
│   │   └── supabaseServerClient.ts          # Server-side Supabase (service role)
│   ├── styles/
│   │   └── styles.ts           # Additional style exports (currently minimal)
│   └── types/
│       └── css.d.ts            # CSS module type declarations
├── Status Reports/             # Project status report documents
├── supabase/
│   └── migrations/             # SQL migration files
│       └── 202602170001_listing_cache_and_user_history.sql
├── tests/
│   ├── backend/                # Backend unit tests (Mocha/Chai)
│   │   ├── assess-condition.test.ts
│   │   └── supabaseClient.test.ts
│   └── frontend/               # Frontend unit tests (Jest)
│       └── SimilarListings.test.tsx
├── .env.example                # Environment variable template
├── .gitignore
├── eslint.config.mjs           # ESLint configuration
├── jest.config.ts              # Jest configuration
├── jest.setup.ts               # Jest setup file
├── next.config.ts              # Next.js configuration
├── package.json
├── postcss.config.mjs          # PostCSS configuration (Tailwind)
├── tsconfig.json               # TypeScript configuration
└── README.md
```

## Directory Purposes

**`src/app/(components)/`:**
- Purpose: Landing page presentational components
- Contains: `Navigation.tsx`, `Hero.tsx`, `HowItWorks.tsx`, `Features.tsx`, `FinalCTA.tsx`, `Footer.tsx`
- Key files: `Navigation.tsx` is reused across landing and dashboard with `dashboardNav` prop

**`src/app/api/`:**
- Purpose: Next.js API route handlers (server-side only)
- Contains: One directory per endpoint, each with `route.ts` and supporting modules
- Key files:
  - `src/app/api/marketplace-listing/route.ts`: Main listing scraping endpoint
  - `src/app/api/marketplace-listing/parseHtml.ts`: HTML parser (~1100 lines, largest file)
  - `src/app/api/marketplace-listing/types.ts`: Shared type definitions
  - `src/app/api/assess-condition/route.ts`: OpenAI condition assessment endpoint
  - `src/app/api/simple-listings/route.ts`: HTML-based comparable search
  - `src/app/api/similar-listings/route.ts`: RapidAPI-based search (legacy path)

**`src/app/dashboard/`:**
- Purpose: Dashboard page, components, hooks, and utilities
- Contains: Page component, client component, sub-components, custom hooks, helpers
- Key files:
  - `src/app/dashboard/DashboardClient.tsx`: Main dashboard orchestrator (~300 lines)
  - `src/app/dashboard/hooks/useMarketplaceListing.ts`: Listing data fetching hook
  - `src/app/dashboard/hooks/useConditionAssessment.ts`: AI assessment hook
  - `src/app/dashboard/hooks/useSearchHistory.ts`: Supabase-backed search history
  - `src/app/dashboard/types.ts`: Dashboard-specific type definitions
  - `src/app/dashboard/constants.ts`: Default values and timeout constants

**`src/app/dashboard/(components)/`:**
- Purpose: Dashboard UI sub-components
- Contains: `CurrentListing.tsx`, `PriceAnalysis.tsx`, `SimilarListings.tsx`, `ListingCard.tsx`
- Note: Route group `(components)` keeps components organized without affecting URL paths

**`src/lib/`:**
- Purpose: Shared library code used by both client and server
- Contains: Supabase clients, auth hook, URL parser, server-only modules
- Key files:
  - `src/lib/facebookMarketplaceListing.ts`: URL validation and normalization
  - `src/lib/supabaseBrowserClient.ts`: Singleton browser Supabase client (`"use client"`)
  - `src/lib/supabaseServerClient.ts`: Service role client factory (`server-only`)

**`src/lib/server/`:**
- Purpose: Server-only modules (marked with `import 'server-only'` where applicable)
- Contains: Cache repositories, HTML fetcher, scraper orchestration, TTL logic
- Key files:
  - `src/lib/server/facebookMarketplaceHtmlFetcher.ts`: Multi-transport fetcher (~800 lines)
  - `src/lib/server/scraper/scrapeMarketplace.ts`: Scraping orchestration (~170 lines)
  - `src/lib/server/listingCacheRepository.ts`: Listing cache Supabase CRUD
  - `src/lib/server/conditionCacheRepository.ts`: Condition cache Supabase CRUD
  - `src/lib/server/cacheTtl.ts`: 48-hour TTL check function

**`supabase/migrations/`:**
- Purpose: Database schema migrations
- Contains: SQL files defining tables, indexes, RLS policies, triggers
- Key files: `202602170001_listing_cache_and_user_history.sql` defines `listing_cache`, `condition_cache`, `user_listing_history`

**`backend/`:**
- Purpose: Backend test files using Mocha/Chai (separate from Jest frontend tests)
- Contains: Test files for HTML parser and URL parser, a Supabase client utility
- Run with: `npm run test:backend`

**`tests/`:**
- Purpose: Test files organized by frontend/backend
- Contains: Jest frontend tests in `tests/frontend/`, Mocha backend tests in `tests/backend/`
- Note: Backend tests also exist in `backend/` directory (two locations)

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Landing page (marketing + URL input)
- `src/app/layout.tsx`: Root HTML layout with metadata
- `src/app/dashboard/page.tsx`: Dashboard page wrapper with Suspense
- `src/app/dashboard/DashboardClient.tsx`: Dashboard client component (main app logic)
- `src/app/auth/page.tsx`: Authentication page

**Configuration:**
- `next.config.ts`: Next.js config (Turbopack, server external packages, env forwarding)
- `tsconfig.json`: TypeScript config (strict mode, `@/*` path alias maps to `./*`)
- `eslint.config.mjs`: ESLint config
- `jest.config.ts`: Jest config for frontend tests
- `postcss.config.mjs`: PostCSS with Tailwind plugin
- `.env.example`: Environment variable template (16 vars)

**Core Logic:**
- `src/lib/server/scraper/scrapeMarketplace.ts`: Scraping orchestration (5-step pipeline)
- `src/lib/server/facebookMarketplaceHtmlFetcher.ts`: Multi-transport HTML fetcher
- `src/app/api/marketplace-listing/parseHtml.ts`: HTML parser with JSON extraction
- `src/app/api/assess-condition/route.ts`: OpenAI GPT-4o-mini condition assessment
- `src/app/api/assess-condition/normalize.ts`: Assessment response normalization
- `src/app/api/assess-condition/prompt.ts`: GPT prompt builder

**Type Definitions:**
- `src/app/api/marketplace-listing/types.ts`: `NormalizedMarketplaceListing`, `NormalizedSimilarListing`, `NormalizedSimpleListing`
- `src/app/api/assess-condition/types.ts`: `ParsedAssessment`, `CONDITION_LABELS`
- `src/app/dashboard/types.ts`: Dashboard-specific API response types, `SearchHistoryEntry`
- `src/lib/facebookMarketplaceListing.ts`: `FacebookMarketplaceListing` interface

**Styling:**
- `src/app/consts.ts`: Shared Tailwind class string constants (~335 lines, design system)
- `src/app/globals.css`: Global CSS (Tailwind imports)
- `src/styles/styles.ts`: Additional style exports

**Database:**
- `supabase/migrations/202602170001_listing_cache_and_user_history.sql`: Schema for all 3 tables

## Naming Conventions

**Files:**
- React components: PascalCase (`DashboardClient.tsx`, `CurrentListing.tsx`, `ListingCard.tsx`)
- Hooks: camelCase with `use` prefix (`useMarketplaceListing.ts`, `useConditionAssessment.ts`)
- Utilities/modules: camelCase (`parseHtml.ts`, `cacheTtl.ts`, `imageUtils.ts`)
- Route handlers: always `route.ts` (Next.js convention)
- Types: camelCase files (`types.ts`)
- Constants: camelCase files (`constants.ts`, `consts.ts`)
- Tests: `*.test.ts` or `*.test.tsx`

**Directories:**
- Route groups: `(components)` parenthesized (excluded from URL path)
- API routes: kebab-case (`assess-condition`, `marketplace-listing`, `similar-listings`)
- Feature directories: camelCase or kebab-case (`dashboard`, `auth`, `server`)
- Hook directories: `hooks/`
- Utility directories: `utils/`

**Exports:**
- Components: named exports for most (`export function CurrentListing`), default export for pages and `DashboardClient`
- Hooks: named exports (`export function useMarketplaceListing`)
- Types: named exports with `export interface`
- Constants: named exports (`export const CACHE_TTL_HOURS`)

## Where to Add New Code

**New API Endpoint:**
- Create directory: `src/app/api/{endpoint-name}/`
- Add `route.ts` with `GET` or `POST` handler
- Add `types.ts` for request/response types if needed
- Add supporting modules in same directory
- Server-only helpers go in `src/lib/server/`

**New Dashboard Feature:**
- Component: `src/app/dashboard/(components)/NewFeature.tsx`
- Hook: `src/app/dashboard/hooks/useNewFeature.ts`
- Types: Add to `src/app/dashboard/types.ts`
- Wire into `src/app/dashboard/DashboardClient.tsx`

**New Landing Page Section:**
- Component: `src/app/(components)/NewSection.tsx`
- Style constants: Add to `src/app/consts.ts`
- Add to `src/app/page.tsx` import list and render order

**New Shared Utility:**
- Client-safe: `src/lib/{utilityName}.ts`
- Server-only: `src/lib/server/{utilityName}.ts` (add `import 'server-only'` at top)

**New Supabase Table:**
- Migration: `supabase/migrations/{timestamp}_{description}.sql`
- Repository: `src/lib/server/{tableName}Repository.ts`

**New Test:**
- Frontend (Jest): `tests/frontend/{ComponentName}.test.tsx`
- Backend (Mocha): `tests/backend/{feature}.test.ts` or `backend/{feature}.test.ts`

## Special Directories

**`.browser-data/`:**
- Purpose: Playwright persistent browser profile (cookies, local storage, cache)
- Generated: Yes, by Playwright during scraping
- Committed: No (gitignored)

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes, by `next build` / `next dev`
- Committed: No (gitignored)

**`coverage/`:**
- Purpose: Test coverage reports (lcov)
- Generated: Yes, by `npm test`
- Committed: Appears to be committed (no gitignore entry visible)

**`Status Reports/`:**
- Purpose: Project status report documents (academic/team reports)
- Generated: No, manually written
- Committed: Yes

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-03-05*
