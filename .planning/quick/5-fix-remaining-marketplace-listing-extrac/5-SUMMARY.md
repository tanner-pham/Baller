---
quick_task: 5
slug: fix-remaining-marketplace-listing-extrac
type: quick
completed: 2026-03-13
commit: 8993013
---

# Quick Task 5: Marketplace Extraction Reliability and Latency Summary

## Outcome

- Listing parsing now keeps the richest candidate for a given Marketplace item instead of the first duplicate shell record, which fixes intermittent missing descriptions and polluted location strings.
- Location text is sanitized consistently across structured JSON fields, DOM fallback extraction, and simple-listing fallback parsing, so CTA text like `Send seller a message` no longer leaks into the UI.
- Scrapes no longer pay for comparable search and detail retry strictly in sequence when the first listing parse is incomplete; both jobs now start in parallel and their best data is merged at the end.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Harden listing parser candidate selection and location sanitization | bc747ce | `src/app/api/marketplace-listing/parseHtml.ts`, `tests/backend/marketplaceHtmlParser.test.ts` |
| 2 | Parallelize incomplete-listing retry/search flow and preserve recovered fields | 8993013 | `src/lib/server/scraper/scrapeMarketplace.ts`, `tests/backend/scrapeMarketplace.test.ts` |

## What Changed

### Parser reliability

- Replaced first-seen duplicate handling with quality-aware candidate retention and best-match selection for the requested item id.
- Expanded structured description extraction to accept additional description field shapes beyond `redacted_description.text`.
- Added a shared location sanitizer so `location_text.text`, DOM fallback matches, and simple-listing fallback locations all strip trailing Marketplace UI text before rendering or merge-backfill.

### Scraper latency

- Started comparable search and detail retry concurrently when the initial listing is incomplete instead of waiting for search to finish before retrying the listing.
- After the retry returns, merged any missing fields from the non-winning payload so recovered descriptions or images are not lost just because the other payload scored slightly higher overall.

## Verification

- `npx mocha --require tsx "tests/backend/marketplaceHtmlParser.test.ts" "tests/backend/scrapeMarketplace.test.ts" --exit`
- `npm run test:backend`
- `npx jest --config jest.config.ts src/app/api/marketplace-listing/parseHtml.test.ts --no-coverage`
- `npx tsc --noEmit`
