---
quick_task: 2
slug: inspect-whether-marketplace-scraping-cap
type: quick
completed: 2026-03-09
inspected_commit: 42b39d1
---

# Quick Task 2: Image Scrape and GPT Input Inspection

## Answer

- The normal Marketplace parser is not limited to the primary image. It builds `listing.images` from the primary listing photo, all `listing_photos`, gallery images found in HTML, and DOM fallback images, with deduping.
- If the listing page is incomplete and the scraper has to recover from Marketplace search results, that fallback can only restore a single thumbnail image from the matching search result.
- The condition-assessment GPT path does **not** send all images. The dashboard hook sends `listing.images?.[0]` as `imageUrl` to `/api/assess-condition`, and the route sends only that single image to `gpt-4o-mini`. The full `images` array is present in the request body, but it is used for `modelAccuracy`, not for the model input.
- The compare-verdict GPT path also does **not** send all images. It sends only `leftListing.images?.[0]` and `rightListing.images?.[0]`, so the model sees at most one image per listing.
- A further nuance: both GPT request hooks use raw index `0`, not `getFirstNonVideoImage(...)`, so if the first asset is a video URL, the request can degrade to text-only instead of automatically choosing the next still photo.

## Evidence

- `src/app/api/marketplace-listing/parseHtml.ts`
- `src/lib/server/scraper/scrapeMarketplace.ts`
- `src/app/dashboard/hooks/useConditionAssessment.ts`
- `src/app/api/assess-condition/route.ts`
- `src/app/compare/hooks/useCompareVerdict.ts`
- `src/app/api/compare-verdict/route.ts`

## Result

This was an inspection-only quick task. No application code changed.
