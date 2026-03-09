---
quick_task: 2
slug: inspect-whether-marketplace-scraping-cap
type: quick
description: Inspect whether marketplace scraping captures all listing images and whether GPT-4o receives all images or only the primary one
files_expected:
  - src/app/api/marketplace-listing/parseHtml.ts
  - src/lib/server/scraper/scrapeMarketplace.ts
  - src/app/dashboard/hooks/useConditionAssessment.ts
  - src/app/api/assess-condition/route.ts
  - src/app/compare/hooks/useCompareVerdict.ts
  - src/app/api/compare-verdict/route.ts
---

<objective>
Trace the listing image pipeline from Marketplace HTML parsing through the GPT-4o request builders and document whether the app stores all listing images or only the primary image, and whether GPT-4o receives all images or only one.
</objective>

<tasks>

<task>
  <name>Inspect scrape and model input paths</name>
  <files>src/app/api/marketplace-listing/parseHtml.ts, src/lib/server/scraper/scrapeMarketplace.ts, src/app/dashboard/hooks/useConditionAssessment.ts, src/app/api/assess-condition/route.ts, src/app/compare/hooks/useCompareVerdict.ts, src/app/api/compare-verdict/route.ts</files>
  <action>
  Read the parser, scrape fallback, condition-assessment hook/route, and compare-verdict hook/route to determine how many images are captured and how many are passed to GPT-4o.
  </action>
  <verify>
  Confirm the conclusion against the current main branch code and record the exact constraints and fallbacks.
  </verify>
  <done>
  The quick-task summary clearly states whether the scraper collects all listing images and whether GPT-4o receives the whole image set or only the first image.
  </done>
</task>

</tasks>
