import { PlaywrightCrawler } from 'crawlee';
import type { NormalizedSimilarListing, SimilarJobPayload } from '../types.js';
import { parseSimilarListingsFromHtml } from '../extract/similarParser.js';

function buildSearchUrls(payload: SimilarJobPayload): string[] {
  const searchBaseUrl = new URL('https://www.facebook.com/marketplace/search');
  searchBaseUrl.searchParams.set('query', payload.queryText);

  if (payload.minPrice !== null) {
    searchBaseUrl.searchParams.set('minPrice', String(payload.minPrice));
  }

  if (payload.maxPrice !== null) {
    searchBaseUrl.searchParams.set('maxPrice', String(payload.maxPrice));
  }

  const firstPage = searchBaseUrl.toString();
  const secondPage = `${searchBaseUrl.toString()}&page=2`;
  const thirdPage = `${searchBaseUrl.toString()}&page=3`;

  return [firstPage, secondPage, thirdPage];
}

function scoreListing(
  listing: NormalizedSimilarListing,
  payload: SimilarJobPayload,
): { score: number; priceDistance: number } {
  const listingTitle = listing.title.toLowerCase();
  let score = 0;

  for (const keyword of payload.keywords) {
    if (keyword && listingTitle.includes(keyword.toLowerCase())) {
      score += 2;
    }
  }

  if (payload.location && listing.location.toLowerCase().includes(payload.location.toLowerCase())) {
    score += 1;
  }

  let priceDistance = Number.MAX_SAFE_INTEGER;

  if (payload.minPrice !== null && payload.maxPrice !== null && listing.price > 0) {
    if (listing.price >= payload.minPrice && listing.price <= payload.maxPrice) {
      score += 2;
      priceDistance = 0;
    } else {
      priceDistance = Math.min(
        Math.abs(listing.price - payload.minPrice),
        Math.abs(listing.price - payload.maxPrice),
      );
    }
  }

  return { score, priceDistance };
}

/**
 * Scrapes up to three search pages and returns ranked similar-listing candidates.
 */
export async function scrapeSimilarMarketplaceListings(
  payload: SimilarJobPayload,
): Promise<NormalizedSimilarListing[]> {
  const searchUrls = buildSearchUrls(payload);
  const collectedListings: NormalizedSimilarListing[] = [];

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: searchUrls.length,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ page }) {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const html = await page.content();
      const parsedListings = parseSimilarListingsFromHtml(html, payload.location);
      collectedListings.push(...parsedListings);
    },
  });

  await crawler.run(searchUrls);

  const dedupedListings = new Map<string, NormalizedSimilarListing>();

  for (const listing of collectedListings) {
    if (!listing.link || dedupedListings.has(listing.link)) {
      continue;
    }

    dedupedListings.set(listing.link, listing);
  }

  const rankedListings = Array.from(dedupedListings.values())
    .map((listing) => {
      const scored = scoreListing(listing, payload);
      return {
        listing,
        score: scored.score,
        priceDistance: scored.priceDistance,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.priceDistance - right.priceDistance;
    })
    .slice(0, 12)
    .map((entry) => entry.listing)
    .filter((listing) => listing.image.trim().length > 0);

  return rankedListings;
}
