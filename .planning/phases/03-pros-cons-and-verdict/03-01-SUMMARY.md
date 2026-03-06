---
phase: 03-pros-cons-and-verdict
plan: 01
subsystem: api
tags: [openai, gpt-4o-mini, rule-engine, pros-cons, verdict, comparison]

# Dependency graph
requires:
  - phase: 02-comparison-view
    provides: "diffUtils (PriceDiff, ConditionDiff), CompareClient orchestration, listingUtils (parsePriceToNumber, computeMarketValue)"
provides:
  - "prosConsEngine: deterministic rule-based pro/con chip generation from structured data"
  - "/api/compare-verdict: AI endpoint for feature-level pros/cons and verdict"
  - "CompareVerdictRequest/VerdictResult type contracts"
  - "ProConChip interface for UI consumption"
affects: [03-pros-cons-and-verdict]

# Tech tracking
tech-stack:
  added: []
  patterns: [hybrid-rule-plus-ai, safe-defaults-normalization, vision-with-fallback]

key-files:
  created:
    - src/app/compare/utils/prosConsEngine.ts
    - src/app/api/compare-verdict/types.ts
    - src/app/api/compare-verdict/prompt.ts
    - src/app/api/compare-verdict/normalize.ts
    - src/app/api/compare-verdict/route.ts
    - tests/frontend/prosConsEngine.test.ts
    - tests/frontend/compareVerdictNormalize.test.ts
    - tests/frontend/compareVerdictPrompt.test.ts
  modified: []

key-decisions:
  - "ProConChip has source field ('rule' | 'ai') to distinguish origin even though UI treats them identically"
  - "Rule engine uses parsePriceToNumber from listingUtils for market value; parseOfferToNumber internal for suggested offers"
  - "Listing age comparison requires >1 day difference to avoid same-day noise"
  - "Verdict normalize caps feature arrays at 3 items per side, defaults to TOO_CLOSE_TO_CALL"
  - "Route uses detail:'low' for both images to minimize token cost"

patterns-established:
  - "4-file API pattern: types.ts, prompt.ts, normalize.ts, route.ts (matches assess-condition)"
  - "Safe defaults normalization: malformed JSON returns valid default structure, never throws"
  - "Hybrid computation: rule-based instant chips + AI progressive feature extraction"

requirements-completed: [PROS-01, PROS-02]

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 3 Plan 01: Pros/Cons Engine and Verdict API Summary

**Deterministic rule-based pros/cons engine (5 dimensions) and /api/compare-verdict AI endpoint with vision support, safe normalization, and 22 passing tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T08:09:18Z
- **Completed:** 2026-03-06T08:14:02Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments
- Rule-based pros/cons engine generates deterministic chips from price, condition, suggested offer, market value, and listing age
- AI verdict endpoint follows exact assess-condition 4-file pattern with vision support and text-only fallback
- Robust normalization handles malformed JSON, missing fields, invalid values -- always returns valid defaults
- 22 tests covering all pure logic (11 prosConsEngine + 4 prompt + 7 normalize)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rule-based pros/cons engine (RED)** - `c026224` (test)
2. **Task 1: Rule-based pros/cons engine (GREEN)** - `05cf6f1` (feat)
3. **Task 2: Compare verdict API endpoint (RED)** - `d60e327` (test)
4. **Task 2: Compare verdict API endpoint (GREEN)** - `b2b4cbe` (feat)

_TDD tasks each have RED (test) and GREEN (feat) commits_

## Files Created/Modified
- `src/app/compare/utils/prosConsEngine.ts` - Rule-based chip generation from PriceDiff, ConditionDiff, assessments, listings
- `src/app/api/compare-verdict/types.ts` - CompareVerdictRequest, VerdictResult, VERDICT_OUTCOMES type contracts
- `src/app/api/compare-verdict/prompt.ts` - Structured GPT-4o-mini prompt builder with descriptions, condition data, JSON schema
- `src/app/api/compare-verdict/normalize.ts` - Safe JSON parser with array capping, verdict validation, default fallbacks
- `src/app/api/compare-verdict/route.ts` - POST handler with dual image vision, invalid_image_url retry, error handling
- `tests/frontend/prosConsEngine.test.ts` - 11 tests for rule engine dimensions and edge cases
- `tests/frontend/compareVerdictPrompt.test.ts` - 4 tests for prompt content and schema fields
- `tests/frontend/compareVerdictNormalize.test.ts` - 7 tests for parsing, defaults, and malformed input

## Decisions Made
- ProConChip includes `source: 'rule' | 'ai'` field for future flexibility even though Plan 02 renders them identically
- Listing age requires >1 day difference to trigger chip (avoids same-day noise)
- Feature arrays capped at 3 items per side to keep UI concise
- Images sent with `detail: 'low'` to minimize OpenAI token cost
- Market value "above market" threshold set at >10% to avoid flagging marginal differences

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. OPENAI_API_KEY already configured from Phase 1 assess-condition endpoint.

## Next Phase Readiness
- prosConsEngine ready for import by ComparisonColumn (Plan 02)
- /api/compare-verdict ready for useCompareVerdict hook (Plan 02)
- ProConChip and VerdictResult types ready for UI consumption
- All exports match the must_haves artifact contracts from the plan

## Self-Check: PASSED

All 8 created files verified present. All 4 commit hashes (c026224, 05cf6f1, d60e327, b2b4cbe) verified in git log.

---
*Phase: 03-pros-cons-and-verdict*
*Completed: 2026-03-06*
