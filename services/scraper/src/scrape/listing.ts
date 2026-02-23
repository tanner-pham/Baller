import { PlaywrightCrawler } from 'crawlee';
import type { NormalizedMarketplaceListing } from '../types.js';
import { parseListingFromHtml } from '../extract/listingParser.js';

interface ListingScrapeResult {
  listing: NormalizedMarketplaceListing;
  raw: Record<string, unknown>;
}

/**
 * Scrapes one Facebook Marketplace listing page and extracts normalized details.
 */
export async function scrapeMarketplaceListing(listingUrl: string): Promise<ListingScrapeResult> {
  let listingResult: ListingScrapeResult | null = null;

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ page, request }) {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const html = await page.content();
      const parsed = parseListingFromHtml(html);

      listingResult = {
        listing: parsed.listing,
        raw: {
          sourceUrl: request.loadedUrl ?? request.url,
          strategy: parsed.strategy,
          extraction: parsed.raw,
        },
      };
    },
  });

  await crawler.run([listingUrl]);

  if (!listingResult) {
    throw new Error('Listing scrape completed without extractable payload.');
  }

  return listingResult;
}
