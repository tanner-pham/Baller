import type {
  NormalizedMarketplaceListing,
  NormalizedSimilarListing,
  NormalizedSimpleListing,
} from '../../../app/api/marketplace-listing/types';
import {
  parseMarketplaceListingHtml,
  parseMarketplaceSearchHtml,
  buildMarketplaceSearchUrl,
} from '../../../app/api/marketplace-listing/parseHtml';
import {
  fetchMarketplaceHtmlWithFallback,
  MarketplaceHtmlFetchError,
} from '../facebookMarketplaceHtmlFetcher';
import {
  getMarketplaceListingCompletenessScore,
  hasMarketplaceListingDescription,
  hasMarketplaceListingImage,
} from '../marketplaceListingQuality';

const DEFAULT_LISTING_FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_SEARCH_FETCH_TIMEOUT_MS = 15_000;
const RETRY_LISTING_FETCH_TIMEOUT_MS = 25_000;

function buildFetchCandidates(url: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const push = (u: string | undefined): void => {
    const trimmed = u?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    candidates.push(trimmed);
  };

  push(url);

  try {
    const parsed = new URL(url);
    parsed.hash = '';
    push(parsed.toString());

    if (parsed.hostname === 'www.facebook.com') {
      const mobile = new URL(parsed.toString());
      mobile.hostname = 'm.facebook.com';
      push(mobile.toString());
    }
  } catch {
    // no-op for malformed URLs
  }

  return candidates;
}

function parseNumericPrice(priceStr: string): number {
  const digits = priceStr.replace(/[^\d.]/g, '');
  const num = Number(digits);
  return Number.isFinite(num) ? num : 0;
}

/**
 * When listing page returns partial data (e.g. unauthenticated og: meta only),
 * try to find the listing in search results and merge missing fields.
 */
function mergeSearchMatchIntoListing(
  listing: NormalizedMarketplaceListing,
  searchListings: NormalizedSimpleListing[],
  listingId: string | null,
): NormalizedMarketplaceListing {
  if (!listingId) return listing;

  // Find our listing in the search results by matching the listing ID in the link
  const match = searchListings.find((sl) => sl.link.includes(`/item/${listingId}`));
  if (!match) return listing;

  return {
    ...listing,
    price: listing.price || match.price || undefined,
    location: listing.location || match.location || undefined,
    images: listing.images && listing.images.length > 0
      ? listing.images
      : match.image ? [match.image] : undefined,
  };
}

function shouldRetryIncompleteListingFetch(input: {
  listing: NormalizedMarketplaceListing;
  metadata: {
    listingCandidates: number;
  };
  transport: 'http' | 'playwright-local' | 'playwright-browserless';
  capturedGraphqlPayloadMatchingItemIdCount: number;
}): boolean {
  const missingImage = !hasMarketplaceListingImage(input.listing);
  const missingDescription = !hasMarketplaceListingDescription(input.listing);

  if (!missingImage && !missingDescription) {
    return false;
  }

  if (input.transport === 'http') {
    return false;
  }

  return (
    input.metadata.listingCandidates === 0 ||
    input.capturedGraphqlPayloadMatchingItemIdCount === 0
  );
}

function pickHigherQualityListing(
  currentListing: NormalizedMarketplaceListing,
  candidateListing: NormalizedMarketplaceListing,
): NormalizedMarketplaceListing {
  const currentScore = getMarketplaceListingCompletenessScore(currentListing);
  const candidateScore = getMarketplaceListingCompletenessScore(candidateListing);

  return candidateScore >= currentScore ? candidateListing : currentListing;
}

/**
 * Scrape a Facebook Marketplace listing and its comparables.
 *
 * Uses the multi-transport fetcher which automatically selects the best
 * approach based on environment:
 *   - HTTP with bootstrap cookies (when FACEBOOK_COOKIE_HEADER is set)
 *   - Local Playwright (when MARKETPLACE_USE_LOCAL_PLAYWRIGHT=true)
 *   - Remote Browserless (when BROWSERLESS_WS_URL is set)
 *
 * Returns data in the NormalizedMarketplaceListing shape expected by the frontend.
 */
export async function scrapeMarketplaceListing(
  listingUrl: string,
  listingId: string | null,
): Promise<NormalizedMarketplaceListing> {
  // Step 1: Fetch listing HTML
  const listingFetchResult = await fetchMarketplaceHtmlWithFallback({
    urls: buildFetchCandidates(listingUrl),
    referer: 'https://www.facebook.com/marketplace/',
    bootstrapUrl: 'https://www.facebook.com/marketplace/',
    timeoutMs: DEFAULT_LISTING_FETCH_TIMEOUT_MS,
  });

  // Step 2: Parse listing from HTML
  let listing: NormalizedMarketplaceListing;
  let listingMetadata: { listingCandidates: number };
  try {
    const parsed = parseMarketplaceListingHtml({
      html: listingFetchResult.html,
      requestedItemId: listingId,
    });
    listing = parsed.listing;
    listingMetadata = parsed.metadata;
  } catch (parseError) {
    throw new MarketplaceHtmlFetchError(
      parseError instanceof Error
        ? parseError.message
        : 'Failed to parse listing from Facebook HTML.',
      502,
    );
  }

  // Step 3: Fetch and parse comparable search results
  let simpleListings = listing.simpleListings ?? [];

  if (simpleListings.length === 0) {
    try {
      const searchUrl = buildMarketplaceSearchUrl({
        title: listing.title,
        location: listing.location,
        locationId: listing.locationId,
        condition: listing.condition,
        price: listing.price,
      });

      const searchFetchResult = await fetchMarketplaceHtmlWithFallback({
        urls: buildFetchCandidates(searchUrl),
        referer: 'https://www.facebook.com/marketplace/',
        bootstrapUrl: 'https://www.facebook.com/marketplace/',
        timeoutMs: DEFAULT_SEARCH_FETCH_TIMEOUT_MS,
      });

      simpleListings = parseMarketplaceSearchHtml(searchFetchResult.html);
    } catch (searchError) {
      console.warn(
        '[scraper] Comparable search failed, continuing without comparables:',
        searchError instanceof Error ? searchError.message : searchError,
      );
    }
  }

  // Step 4: Fill missing listing fields from search results
  // (when unauthenticated, listing page only returns og: meta — price/location
  // come from matching the listing in search results)
  if (!listing.price || !listing.location || !hasMarketplaceListingImage(listing)) {
    listing = mergeSearchMatchIntoListing(listing, simpleListings, listingId);
  }

  if (
    shouldRetryIncompleteListingFetch({
      listing,
      metadata: listingMetadata,
      transport: listingFetchResult.transport,
      capturedGraphqlPayloadMatchingItemIdCount:
        listingFetchResult.capturedGraphqlPayloadMatchingItemIdCount,
    })
  ) {
    try {
      const retryFetchResult = await fetchMarketplaceHtmlWithFallback({
        urls: buildFetchCandidates(listingUrl),
        referer: 'https://www.facebook.com/marketplace/',
        bootstrapUrl: 'https://www.facebook.com/marketplace/',
        timeoutMs: RETRY_LISTING_FETCH_TIMEOUT_MS,
      });

      const retryParsed = parseMarketplaceListingHtml({
        html: retryFetchResult.html,
        requestedItemId: listingId,
      });

      let retriedListing = retryParsed.listing;

      if (
        !retriedListing.price ||
        !retriedListing.location ||
        !hasMarketplaceListingImage(retriedListing)
      ) {
        retriedListing = mergeSearchMatchIntoListing(retriedListing, simpleListings, listingId);
      }

      listing = pickHigherQualityListing(listing, retriedListing);
    } catch (retryError) {
      console.warn(
        '[scraper] Listing detail retry failed, using best initial payload:',
        retryError instanceof Error ? retryError.message : retryError,
      );
    }
  }

  // Step 5: Convert simpleListings to similarListings for frontend compatibility
  const similarListings: NormalizedSimilarListing[] = simpleListings.map((sl) => ({
    title: sl.title,
    price: parseNumericPrice(sl.price),
    location: sl.location,
    image: sl.image,
    link: sl.link,
  }));

  return {
    ...listing,
    simpleListings,
    similarListings,
  };
}
