# Coding Conventions

**Analysis Date:** 2026-03-05

## Naming Patterns

**Files:**
- Use camelCase for all TypeScript files: `parseHtml.ts`, `imageUtils.ts`, `cacheTtl.ts`
- Use camelCase for React component files when they are default exports: `ListingCard.tsx`
- Use PascalCase for React component files when they are named exports: `SimilarListings.tsx`, `CurrentListing.tsx`, `Navigation.tsx`
- Route handlers are always `route.ts` (Next.js App Router convention)
- Type definition files are `types.ts` (not `.d.ts` unless for ambient module declarations like `src/types/css.d.ts`)
- Test files use `*.test.ts` or `*.test.tsx` suffix
- Shared constants in `constants.ts` or `consts.ts`

**Functions:**
- Use camelCase for all functions: `parseFacebookMarketplaceListingUrl()`, `getListingCacheEntry()`
- Prefix boolean-returning functions with `is`, `has`, or `looksLike`: `isCacheFresh()`, `looksLikeFacebookAuthWall()`, `isRecord()`
- Prefix data-fetching functions with `get`, `fetch`, or `load`: `getListingCacheEntry()`, `fetchImageAsDataUrl()`, `loadMarketplaceListing()`
- Prefix mutation functions with `upsert`, `build`, `persist`: `upsertListingCacheEntry()`, `buildMarketplaceSearchUrl()`
- Custom React hooks use `use` prefix: `useMarketplaceListing()`, `useConditionAssessment()`, `useDashboardSession()`

**Variables:**
- Use camelCase for all variables: `listingUrl`, `parsedBlocks`, `simpleListings`
- Use UPPER_SNAKE_CASE for module-level constants: `CACHE_TTL_HOURS`, `MAX_SIMPLE_LISTINGS`, `PRICE_BAND_LOW_MULTIPLIER`
- Prefix caught errors with `caughtError` (not `err` or `e`): `catch (caughtError)`
- Use descriptive names over abbreviations: `abortController` not `ac`, `normalizedUrl` not `nUrl`

**Types/Interfaces:**
- Use PascalCase for all types and interfaces: `NormalizedMarketplaceListing`, `ParsedAssessment`
- Prefix interfaces for hook results with `Use...Result`: `UseMarketplaceListingResult`, `UseConditionAssessmentResult`
- Prefix interfaces for hook options with `Use...Options`: `UseConditionAssessmentOptions`
- Prefer `interface` for object shapes, `type` for unions and aliases: `type FetchTransport = 'http' | 'playwright-local'`
- API response interfaces use `...ApiResponse` suffix: `MarketplaceListingApiResponse`, `ConditionAssessmentApiResponse`
- Distinguish internal row types from external API shapes: `ListingCacheRow` (DB) vs `ListingCacheEntry` (app)

## Code Style

**Formatting:**
- No dedicated formatter configured (no Prettier). ESLint handles style.
- Use single quotes for strings (consistent across all source files)
- Use semicolons at end of statements
- Use 2-space indentation
- Trailing commas in multi-line parameter lists and object literals

**Linting:**
- ESLint 9 flat config at `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No custom rules beyond Next.js defaults
- Coverage directory is globally ignored

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- Target ES2017 with ESNext modules
- Path alias `@/*` maps to project root (configured in both `tsconfig.json` and `jest.config.ts`)
- Use explicit return types on exported functions; inferred types on internal helpers
- Prefer `type` imports: `import type { NormalizedMarketplaceListing } from './types'`

## Import Organization

**Order:**
1. Node.js built-in modules: `import path from 'node:path'`
2. Third-party packages: `import { NextRequest, NextResponse } from 'next/server'`
3. Internal absolute imports using `@/` alias (used in tests): `import { SimilarListings } from '@/src/app/dashboard/(components)/SimilarListings'`
4. Relative imports for same-feature files: `import { parseMarketplaceListingHtml } from './parseHtml'`
5. Type-only imports use `import type` syntax

**Path Aliases:**
- `@/*` maps to project root `./` -- use for test imports
- Source code uses relative paths for all internal imports (not the alias)
- Server-only modules import `'server-only'` as first line to prevent client bundling: see `src/lib/server/listingCacheRepository.ts`, `src/lib/server/cacheTtl.ts`

## Error Handling

**API Route Handlers (server):**
- Wrap entire handler body in try/catch
- Return `{ success: false, error: string }` with appropriate HTTP status on failure
- Return `{ success: true, ...data }` on success
- Use `console.error()` with structured context objects for all errors:
  ```typescript
  console.error('Marketplace listing cache read failed, continuing to upstream fetch', {
    listingId,
    error: caughtError,
  });
  ```
- Check `caughtError instanceof Error` before accessing `.message`
- Custom error class `MarketplaceHtmlFetchError` carries `status` and `details` for transport-level failures
- Stale cache fallback pattern: when upstream fetch fails but a stale cache entry exists, return stale data with `x-cache-status: stale-fallback` header

**React Hooks (client):**
- Use `AbortController` for all fetch requests inside `useEffect`
- Track `isMounted` flag to prevent state updates after cleanup
- Implement request timeouts with `window.setTimeout` + abort
- Catch-all `.catch()` on the async IIFE to handle unexpected rejections
- Pattern:
  ```typescript
  const abortController = new AbortController();
  let didTimeout = false;
  let isMounted = true;

  const timeoutId = window.setTimeout(() => {
    didTimeout = true;
    abortController.abort();
  }, TIMEOUT_MS);

  // ... fetch with signal: abortController.signal

  return () => {
    isMounted = false;
    window.clearTimeout(timeoutId);
    abortController.abort();
  };
  ```

**Null/undefined handling:**
- Functions that may fail to find data return `null` (not `undefined`): `parseFacebookMarketplaceListingUrl()`, `getListingCacheEntry()`
- Optional fields on normalized types use `undefined` (TypeScript optional properties)
- Use `??` for null coalescing, `||` only for falsy-fallback on strings
- Validate inputs with early returns before processing

## Logging

**Framework:** Native `console` methods (`console.info`, `console.error`, `console.warn`)

**Patterns:**
- Use `console.info()` for cache hits, misses, and operational state changes:
  ```typescript
  console.info('Marketplace listing cache hit', { listingId, computedAt });
  ```
- Use `console.error()` for failures and unexpected states, always with structured context:
  ```typescript
  console.error('Condition assessment image fetch failed:', { imageUrl, status, statusText });
  ```
- Use `console.warn()` for recoverable warnings in non-critical paths:
  ```typescript
  console.warn('[scraper] Comparable search failed, continuing without comparables:', errorMessage);
  ```
- Always pass structured objects as the second argument (not string interpolation)
- Cache operations use a consistent vocabulary: `cache hit`, `cache miss`, `cache stale-hit`, `cache stale-fallback`, `cache fresh-write`

## Comments

**When to Comment:**
- Add JSDoc comments on all exported functions explaining purpose in one sentence
- Add inline comments for non-obvious logic or business rules (e.g., "Facebook SPA needs ~2s to hydrate")
- Use `// Issue N:` comments to reference tracked issues in the codebase
- Add `// TODO:` for known future work items

**JSDoc/TSDoc:**
- Single-line `/** ... */` on exported functions:
  ```typescript
  /** Reads one cached listing payload by listing identifier. */
  export async function getListingCacheEntry<TPayload = unknown>(...)
  ```
- Multi-line JSDoc for complex functions with parameter context:
  ```typescript
  /**
   * Parses a numeric amount from pricing text such as "$1,250".
   */
  function parseUsdAmount(value: unknown): number | null {
  ```
- Mark deprecated functions with `@deprecated` and explanation

## Function Design

**Size:** Functions are generally focused and under 50 lines. Large parsing logic is decomposed into many small extractors (see `parseHtml.ts` with ~30 helper functions).

**Parameters:**
- Prefer named options objects for functions with 3+ parameters:
  ```typescript
  export function useConditionAssessment({
    listingId,
    hasListing,
    isListingLoading,
    listing,
  }: UseConditionAssessmentOptions)
  ```
- Use primitive parameters for simple utility functions:
  ```typescript
  function normalizeWhitespace(value: string | null | undefined): string | undefined
  ```

**Return Values:**
- Hooks return result interfaces with named fields: `{ listing, isLoading, error }`
- Parsing functions return structured result objects: `{ listing, metadata }`
- Utility functions return `string | undefined` or `T | null` patterns
- Functions that cannot find a match return `null`, not `undefined`

## Module Design

**Exports:**
- Use named exports for all public functions and types
- Use default exports only for Next.js page components (`export default function DashboardClient()`) and one-per-file UI components (`export default function ListingCard()`)
- Keep exports at bottom of file or inline with declaration

**Barrel Files:**
- No barrel files (`index.ts` re-exports) are used
- Each module imports directly from the source file

## UI Style Constants

**Pattern:** Shared Tailwind class strings are centralized in `src/app/consts.ts` as exported `const` values:
```typescript
export const anton = "font-['Anton',sans-serif]";
export const shadow6 = "shadow-[6px_6px_0px_0px_#000000]";
export const b5 = "border-5 border-black";
```
- Use these constants in JSX: `className={`${anton} text-3xl`}`
- Not all components use these constants consistently -- some (e.g., `ListingCard.tsx`, `SimilarListings.tsx`) inline full Tailwind strings directly

## API Response Contracts

**Standard success response:**
```typescript
{ success: true, listing: NormalizedMarketplaceListing, raw: { cache: string, source: string } }
```

**Standard error response:**
```typescript
{ success: false, error: string, details?: string }
```

**Cache observability:**
- All API responses include `x-cache-status` header: `hit`, `miss`, `stale-fallback`, `stale-refresh`, `compute-no-key`
- Raw metadata object included in success responses for debugging transport details

## Server-Only Boundary

- Files in `src/lib/server/` import `'server-only'` as their first import
- This prevents accidental client-side bundling of server credentials and Supabase service role keys
- Browser client (`src/lib/supabaseBrowserClient.ts`) is marked `"use client"` and uses anon key only

## Client Components

- All client components and hooks begin with `"use client"` directive
- Next.js route groups `(components)` are used for co-located UI components that are not routes
- Page components at `page.tsx` are server components by default; client logic is delegated to `DashboardClient.tsx`

---

*Convention analysis: 2026-03-05*
