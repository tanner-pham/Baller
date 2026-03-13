---
phase: quick
plan: 4
subsystem: ui, api
tags: [next.js, react, tailwind, typescript, supabase-cache, playwright]

requires: []
provides:
  - Consistent stat card rendering for all three pricing cards in PriceAnalysis
  - Comparable backfill on cache hit when similarListings are missing
affects: [dashboard, marketplace-listing-api]

tech-stack:
  added: []
  patterns:
    - "Cache hit path with ephemeral backfill: fetch comparables on demand without mutating Supabase"
    - "Try/catch isolation on non-critical enrichment paths: backfill failure never breaks primary response"

key-files:
  created: []
  modified:
    - src/app/dashboard/(components)/PriceAnalysis.tsx
    - src/app/api/marketplace-listing/route.ts

key-decisions:
  - "Backfill is ephemeral — in-memory mutation only, no Supabase upsert; stale cache entries refresh naturally"
  - "suggestedOfferEmphasis and suggestedOfferValueEmphasis left as dead code in consts.ts per plan spec"

patterns-established:
  - "backfillComparables helper pattern: reusable search fetch + parse without coupling to scrapeMarketplace"

requirements-completed: [QUICK-004]

duration: 6min
completed: 2026-03-10
---

# Quick Task 4: Fix Suggested Offer Card Font Size + Comparable Backfill on Cache Hit Summary

**Removed emphasis overrides from Suggested Offer stat card (visual parity) and added ephemeral comparable backfill when cache hits lack similarListings**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-10T00:00:00Z
- **Completed:** 2026-03-10T00:06:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- All three pricing stat cards (Suggested Offer, Model Accuracy, Market Value) now render with identical className patterns — no emphasis overrides remain
- Cache hits for listings missing `similarListings` now trigger a lightweight comparable search before responding
- Backfill failures are caught and logged without affecting the cache hit response or user experience

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove emphasis overrides from Suggested Offer card** - `d3da501` (fix)
2. **Task 2: Backfill comparables on cache hit when similarListings missing** - `dd0fd2e` (feat)

**Plan metadata:** (included in task commits above)

## Files Created/Modified
- `src/app/dashboard/(components)/PriceAnalysis.tsx` - Removed `suggestedOfferEmphasis` from card div and `suggestedOfferValueEmphasis` from value `<p>` tag
- `src/app/api/marketplace-listing/route.ts` - Added `backfillComparables` helper, `parseNumericPrice` helper, and backfill logic inside `isCacheFresh` block

## Decisions Made
- Backfill is ephemeral (in-memory mutation only, no Supabase upsert) — stale cache entries will get naturally refreshed on next non-fresh check
- `suggestedOfferEmphasis` and `suggestedOfferValueEmphasis` definitions left in `consts.ts` as dead code per plan spec; cleanup is a separate concern
- Used `cachedListing.listingPayload` directly (not a copy) since it's returned immediately and not reused

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Pricing cards now visually consistent — ready for any UI revamp work
- Cache hit path now enriches comparables — users loading a cached listing will see similar listings without triggering a full scrape

---
*Phase: quick*
*Completed: 2026-03-10*
