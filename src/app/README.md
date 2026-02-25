# `src/app` Code Map

This folder contains App Router pages, API route handlers, and UI components.

## Root Route Files

| File | Purpose | Key Exports | Depends On |
| --- | --- | --- | --- |
| `src/app/layout.tsx` | Root HTML layout and metadata for all routes. | `metadata`, `RootLayout` | `src/app/globals.css` |
| `src/app/globals.css` | Global style imports for fonts, Tailwind, theme, and component CSS helpers. | CSS only | `src/styles/*.css` |
| `src/app/page.tsx` | Landing page composition. | default `App` | `src/app/(components)/*` |
| `src/app/auth/page.tsx` | Login/sign-up flow with Supabase auth. | default `AuthPage` | `src/lib/auth/useAuthSession.ts` |
| `src/app/dashboard/page.tsx` | Dashboard route wrapper with `Suspense` fallback. | default `DashboardPage` | `src/app/dashboard/DashboardClient.tsx` |
| `src/app/consts.ts` | Shared style token/constants module for future design-system consolidation. | many exported class/style constants | component styling consumers (planned) |
| `src/app/Landing.md` | Landing-page implementation notes and maintenance guide. | markdown documentation | n/a |

## API Route Handlers

| File | Purpose | Key Exports | Depends On |
| --- | --- | --- | --- |
| `src/app/api/assess-condition/route.ts` | Condition assessment API endpoint with 48h DB cache + stale fallback. | `POST` | `image.ts`, `prompt.ts`, `normalize.ts`, OpenAI, server cache helpers |
| `src/app/api/assess-condition/image.ts` | Fetch image and convert to data URL for model requests. | `fetchImageAsDataUrl` | `fetch`, `Buffer` |
| `src/app/api/assess-condition/prompt.ts` | Builds model prompt text with output contract instructions. | `buildAssessmentPrompt` | n/a |
| `src/app/api/assess-condition/normalize.ts` | Normalizes and validates model JSON payload. | `parseAssessmentResponse`, `isOpenAIErrorWithCode` | `types.ts` |
| `src/app/api/assess-condition/types.ts` | Condition assessment type contracts. | `CONDITION_LABELS`, `ParsedAssessment` | n/a |
| `src/app/api/assess-condition/route.test.ts` | Mocha/Chai behavior tests for response shapes and error handling. | tests only | mocha/chai |
| `src/app/api/marketplace-listing/route.ts` | Marketplace listing API endpoint backed by direct HTML parsing with 48h DB cache + stale fallback. | `GET` | `parseHtml.ts`, server cache helpers |
| `src/app/api/marketplace-listing/parseHtml.ts` | Shared HTML parser and query builder for listing + search extraction workflows. | `parseMarketplaceListingHtml`, `parseMarketplaceSearchHtml`, `buildMarketplaceSearchUrl` | `types.ts` |
| `src/app/api/marketplace-listing/types.ts` | Internal normalized response types. | `NormalizedMarketplaceListing`, `NormalizedSimpleListing`, `NormalizedSimilarListing` | n/a |
| `src/app/api/simple-listings/route.ts` | Backend-only endpoint that fetches search HTML and returns parsed simple listings after listing cache is available. | `GET` | marketplace parser + server cache helpers |

## Shared Landing Components

| File | Purpose | Key Exports | Depends On |
| --- | --- | --- | --- |
| `src/app/(components)/Navigation.tsx` | Top navigation for landing/dashboard contexts and dashboard URL search input. | `Navigation` | `src/lib/auth/useAuthSession.ts`, URL parser |
| `src/app/(components)/Hero.tsx` | Landing hero with listing URL input and dashboard navigation. | `Hero` | URL parser |
| `src/app/(components)/HowItWorks.tsx` | Three-step process cards. | `HowItWorks` | `lucide-react` |
| `src/app/(components)/Features.tsx` | Feature highlights section. | `Features` | `lucide-react` |
| `src/app/(components)/FinalCTA.tsx` | Bottom CTA section. | `FinalCTA` | `lucide-react` |
| `src/app/(components)/Footer.tsx` | Footer links/resources section. | `Footer` | n/a |

## Dashboard Modules

| File | Purpose | Key Exports | Depends On |
| --- | --- | --- | --- |
| `src/app/dashboard/DashboardClient.tsx` | Dashboard UI orchestration and composed state rendering. | default `DashboardClient` | dashboard hooks/constants/types |
| `src/app/dashboard/constants.ts` | Dashboard defaults (timeouts, placeholders, fallback cards). | constants only | dashboard component prop types |
| `src/app/dashboard/types.ts` | Dashboard data contracts for API payloads/history state. | type interfaces | `SimilarListing` |
| `src/app/dashboard/hooks/useDashboardSession.ts` | Dashboard auth/session state provider (no route redirect side effects). | `useDashboardSession` | `src/lib/auth/useAuthSession.ts` |
| `src/app/dashboard/hooks/useMarketplaceListing.ts` | Listing fetch state machine with timeout/error handling. | `useMarketplaceListing` | dashboard HTTP helper |
| `src/app/dashboard/hooks/useConditionAssessment.ts` | Condition assessment fetch state machine with fallback behavior. | `useConditionAssessment` | dashboard HTTP helper |
| `src/app/dashboard/hooks/useSearchHistory.ts` | Authenticated-only DB history sync and per-user upsert logic. | `useSearchHistory` | Supabase browser client + RLS |
| `src/app/dashboard/utils/http.ts` | Shared safe JSON reader for dashboard fetch calls. | `readJsonResponse` | n/a |
| `src/app/dashboard/(components)/CurrentListing.tsx` | Main listing card section with condition badge. | `CurrentListing`, `CurrentListingProps` | `lucide-react` |
| `src/app/dashboard/(components)/PriceAnalysis.tsx` | Pricing rationale and negotiation UI section. | `PricingAnalysis`, `PricingAnalysisProps` | n/a |
| `src/app/dashboard/(components)/SimilarListings.tsx` | Horizontal similar-listing carousel section. | `SimilarListings`, `SimilarListing` | `ListingCard` |
| `src/app/dashboard/(components)/ListingCard.tsx` | Single similar listing card component. | default `ListingCard` | `next/link` |

## Static Assets

| File | Purpose |
| --- | --- |
| `src/app/favicon.ico` | App favicon served by Next.js App Router. |
