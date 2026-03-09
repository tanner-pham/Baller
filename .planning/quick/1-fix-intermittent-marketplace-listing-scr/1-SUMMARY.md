---
quick_task: 1
slug: fix-intermittent-marketplace-listing-scr
type: quick
completed: 2026-03-09
commit: caa726c
---

# Quick Task 1: Marketplace Listing Hydration Fix Summary

## Outcome

- Playwright listing fetches now wait for stronger Marketplace detail signals before HTML is captured, reducing shell-page snapshots that only contain title/price.
- The listing scraper retries once when Playwright returns an under-hydrated listing and keeps the higher-quality result.
- Listing cache writes now require detail-ready payloads, so partial shells without description or image no longer poison the cache. When a fresh scrape is incomplete, the route falls back to the last good cached payload if one exists.
- The dashboard description copy now switches from loading text to `No description provided.` once the request completes without a description.
- Comparable search queries now include the listing location, which improves the search-result fallback used to recover missing listing images.

## Files Changed

- `src/lib/server/facebookMarketplaceHtmlFetcher.ts`
- `src/lib/server/scraper/scrapeMarketplace.ts`
- `src/lib/server/marketplaceListingQuality.ts`
- `src/app/api/marketplace-listing/route.ts`
- `src/app/api/marketplace-listing/parseHtml.ts`
- `src/app/dashboard/DashboardClient.tsx`
- `backend/marketplaceHtmlParser.test.ts`
- `tests/backend/marketplaceListingQuality.test.ts`

## Verification

- `npx mocha --require tsx 'backend/marketplaceHtmlParser.test.ts'`
- `npm run test:backend`
- `npm test -- --runInBand`
- `npm run build`

## Result

Implementation commit: `caa726c`
