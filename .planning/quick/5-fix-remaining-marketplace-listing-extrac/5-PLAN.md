---
phase: quick
plan: 5
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/api/marketplace-listing/parseHtml.ts
  - src/app/api/marketplace-listing/parseHtml.test.ts
  - src/lib/server/scraper/scrapeMarketplace.ts
  - tests/backend/marketplaceHtmlParser.test.ts
  - tests/backend/marketplaceListingQuality.test.ts
  - tests/backend/scrapeMarketplace.test.ts
autonomous: true
requirements: [QUICK-005]
must_haves:
  truths:
    - "Listing description falls back to meaningful DOM/meta text when the selected GraphQL candidate does not provide a usable description"
    - "Listing location is sanitized to just the marketplace place name and no longer includes adjacent UI labels or pickup/meetup text"
    - "Listing-detail retry happens before comparable-search fetch when the initial listing payload is clearly incomplete, reducing avoidable scrape latency"
    - "Cache/quality guards still reject shell listing payloads and accept hydrated payloads after the scraper refactor"
  artifacts:
    - path: "src/app/api/marketplace-listing/parseHtml.ts"
      provides: "Description fallback and shared location sanitization for listing parsing"
    - path: "src/lib/server/scraper/scrapeMarketplace.ts"
      provides: "Reordered fetch flow that retries listing detail before comparables when quality signals say the first HTML is incomplete"
    - path: "tests/backend/marketplaceHtmlParser.test.ts"
      provides: "Regression fixtures for missing description and polluted location text"
    - path: "tests/backend/scrapeMarketplace.test.ts"
      provides: "Unit coverage for retry-before-search sequencing"
  key_links:
    - from: "parseMarketplaceListingHtml"
      to: "extractDescription"
      via: "selected-candidate description precedence"
      pattern: "description: extractDescription\\(selectedCandidate\\) \\?\\? domFallback\\?\\.listing\\.description"
    - from: "parseMarketplaceListingHtml"
      to: "getListingLocation"
      via: "selected-candidate location sanitization"
      pattern: "location: getListingLocation\\(selectedCandidate\\) \\?\\? domFallback\\?\\.listing\\.location"
    - from: "scrapeMarketplaceListing"
      to: "shouldRetryIncompleteListingFetch"
      via: "retry gate that currently runs after comparable-search fetch"
      pattern: "shouldRetryIncompleteListingFetch|buildMarketplaceSearchUrl|parseMarketplaceSearchHtml"
---

<objective>
Fix the remaining marketplace listing extraction issues where description is still missing on some partial payloads, location text can include adjacent Marketplace UI labels, and the scraper currently pays comparable-search latency before retrying an obviously incomplete listing fetch.

Purpose: improve listing completeness and reduce avoidable scrape time without weakening cacheability or data-quality guards.
Output: parser and scraper updates with targeted regression coverage.
</objective>

<execution_context>
@/Users/tannerpham/.codex/get-shit-done/workflows/execute-plan.md
@/Users/tannerpham/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/app/api/marketplace-listing/parseHtml.ts
@src/app/api/marketplace-listing/parseHtml.test.ts
@src/lib/server/scraper/scrapeMarketplace.ts
@src/lib/server/marketplaceListingQuality.ts
@tests/backend/marketplaceHtmlParser.test.ts
@tests/backend/marketplaceListingQuality.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add regression coverage for the remaining extraction failures</name>
  <files>src/app/api/marketplace-listing/parseHtml.test.ts, tests/backend/marketplaceHtmlParser.test.ts, tests/backend/scrapeMarketplace.test.ts</files>
  <behavior>
    - parseMarketplaceListingHtml falls back to DOM/meta description when the selected GraphQL candidate has no usable description text
    - location parsing returns only the place name when Marketplace appends adjacent UI labels or pickup/meetup text
    - scraper sequencing retries listing detail before fetching comparables when the initial listing HTML is missing description/images and the retry gate is open
  </behavior>
  <action>
    Add small focused tests that reproduce the reported failures before implementation work:

    1. In `tests/backend/marketplaceHtmlParser.test.ts`, add a fixture where the selected listing candidate resolves correctly but has no usable description while the DOM fallback has real description text. Assert the parsed listing keeps the DOM/meta description instead of returning `undefined`.
    2. In `src/app/api/marketplace-listing/parseHtml.test.ts`, extend the helper coverage so location cleanup strips trailing UI labels beyond the existing meetup case, including strings like `Seller's location`, `Door pickup`, `Door dropoff`, and similar adjacent text that should not survive in the final location.
    3. Add `tests/backend/scrapeMarketplace.test.ts` with narrow stubs for the fetcher/parser path. The test should assert the order of operations for an incomplete initial listing: first fetch/parse listing HTML, then retry listing detail, then perform comparable search once with the best listing payload.

    Keep the new tests minimal and fixture-driven. They should fail against the current implementation and describe the target behavior precisely.
  </action>
  <verify>
    <automated>cd /Users/tannerpham/CS\ Projects/baller && npx jest --config jest.config.ts --selectProjects node src/app/api/marketplace-listing/parseHtml.test.ts --runInBand</automated>
    <automated>cd /Users/tannerpham/CS\ Projects/baller && npx mocha --require tsx tests/backend/marketplaceHtmlParser.test.ts tests/backend/scrapeMarketplace.test.ts --exit</automated>
  </verify>
  <done>Targeted failing tests exist for missing-description fallback, polluted-location cleanup, and retry-before-search sequencing.</done>
</task>

<task type="auto">
  <name>Task 2: Fix parser description fallback and shared location sanitization</name>
  <files>src/app/api/marketplace-listing/parseHtml.ts, src/app/api/marketplace-listing/parseHtml.test.ts, tests/backend/marketplaceHtmlParser.test.ts</files>
  <action>
    Update `parseHtml.ts` so the selected listing candidate only wins when its description is actually usable, and location text is cleaned consistently no matter which parser path produced it.

    Implementation targets:
    1. Refine `extractDescription(value)` so it returns `undefined` for empty or shell-like candidate description text, and allow `parseMarketplaceListingHtml()` to fall back to `domFallback?.listing.description` when the selected candidate has no real description.
    2. Expand the current location cleanup into a shared sanitizer that is applied by both `getListingLocation()` and the DOM fallback path. It should trim trailing Marketplace UI fragments such as pickup/meetup labels or other adjacent suffix text while preserving legitimate city/state names.
    3. Tighten any DOM text regexes that currently capture past the end of the location token, but keep the existing successful cases from quick task 3 intact.

    Do not broaden normalization so far that it damages valid multi-word city names or state spellings.
  </action>
  <verify>
    <automated>cd /Users/tannerpham/CS\ Projects/baller && npx jest --config jest.config.ts --selectProjects node src/app/api/marketplace-listing/parseHtml.test.ts --runInBand</automated>
    <automated>cd /Users/tannerpham/CS\ Projects/baller && npx mocha --require tsx tests/backend/marketplaceHtmlParser.test.ts --exit</automated>
  </verify>
  <done>Listings recover usable description text when the selected GraphQL payload is blank, and final location values no longer include adjacent Marketplace UI text.</done>
</task>

<task type="auto">
  <name>Task 3: Reorder scraper fetch flow to cut latency without weakening quality gates</name>
  <files>src/lib/server/scraper/scrapeMarketplace.ts, tests/backend/scrapeMarketplace.test.ts, tests/backend/marketplaceListingQuality.test.ts</files>
  <action>
    Refactor `scrapeMarketplaceListing()` so it decides whether to retry the listing-detail fetch before paying for comparable search, then performs comparable search once using the best listing payload.

    Concretely:
    1. After the initial listing parse, evaluate `shouldRetryIncompleteListingFetch(...)` immediately.
    2. If the retry gate is open, fetch and parse listing detail again first, then use `pickHigherQualityListing()` to select the better listing payload.
    3. Run comparable search after the retry decision, and keep the existing search-merge behavior for price/location/image enrichment plus similar listings generation.
    4. Preserve current failure handling: comparable-search errors stay non-fatal, retry errors still fall back to the best known listing, and cache quality rules in `marketplaceListingQuality.ts` remain unchanged.

    If a helper extraction makes the flow easier to test, prefer that over duplicating fetch/parse branches inline.
  </action>
  <verify>
    <automated>cd /Users/tannerpham/CS\ Projects/baller && npx mocha --require tsx tests/backend/scrapeMarketplace.test.ts tests/backend/marketplaceListingQuality.test.ts --exit</automated>
    <automated>cd /Users/tannerpham/CS\ Projects/baller && npx tsc --noEmit</automated>
  </verify>
  <done>Incomplete listings no longer wait behind comparable-search fetches before retrying detail HTML, and the existing cacheability/completeness rules still hold.</done>
</task>

</tasks>

<verification>
1. `npx jest --config jest.config.ts --selectProjects node src/app/api/marketplace-listing/parseHtml.test.ts --runInBand`
2. `npx mocha --require tsx tests/backend/marketplaceHtmlParser.test.ts tests/backend/scrapeMarketplace.test.ts tests/backend/marketplaceListingQuality.test.ts --exit`
3. `npx tsc --noEmit`
4. Manual spot check on a previously problematic listing: description is populated, location contains only the place name, and end-to-end scrape time improves when the first listing HTML is incomplete.
</verification>

<success_criteria>
- Missing-description cases fall back to meaningful DOM/meta text instead of returning blank
- Location extraction strips adjacent Marketplace UI text while keeping valid place names intact
- Comparable-search fetch no longer blocks listing-detail retry on incomplete first-pass HTML
- Existing quality guards still reject shell payloads and allow hydrated ones
- Targeted Jest, Mocha, and TypeScript verification passes
</success_criteria>

<output>
After completion, create `.planning/quick/5-fix-remaining-marketplace-listing-extrac/5-SUMMARY.md`
</output>
