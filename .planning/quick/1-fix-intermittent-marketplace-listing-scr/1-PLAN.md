---
quick_task: 1
slug: fix-intermittent-marketplace-listing-scr
type: quick
description: Fix intermittent marketplace listing scrape race where image and description are sometimes missing or wrong; verify the fix
files_expected:
  - src/lib/server/scraper/scrapeMarketplace.ts
  - src/app/api/marketplace-listing/route.ts
  - backend/marketplaceHtmlParser.test.ts
---

<objective>
Reject partially hydrated Marketplace listing payloads that are missing the primary image or detailed description, retry with a longer readiness window when needed, and verify the regression with focused tests.
</objective>

<tasks>

<task>
  <name>Harden listing scrape completeness checks</name>
  <files>src/lib/server/scraper/scrapeMarketplace.ts, src/app/api/marketplace-listing/route.ts</files>
  <action>
  Add listing-specific completeness detection so partially hydrated HTML does not get treated as a successful scrape or a cacheable payload. Retry the listing fetch once with a longer wait budget when the first pass still lacks the description or a usable image for the requested item.
  </action>
  <verify>
  Confirm the scraper returns complete data for hydrated HTML and rejects incomplete listing-page HTML that only has core metadata.
  </verify>
  <done>
  The listing API no longer returns or caches a partial listing payload with missing description/image as a success path.
  </done>
</task>

<task>
  <name>Add regression coverage for partial listing HTML</name>
  <files>backend/marketplaceHtmlParser.test.ts</files>
  <action>
  Add a parser regression test that models a partially loaded listing response so the fallback can still recover the correct image and description when GraphQL data arrives after the initial shell.
  </action>
  <verify>
  Run the parser-focused backend test suite and confirm the new case passes alongside existing parser coverage.
  </verify>
  <done>
  There is automated coverage for the exact incomplete-listing scenario described in the bug.
  </done>
</task>

</tasks>
