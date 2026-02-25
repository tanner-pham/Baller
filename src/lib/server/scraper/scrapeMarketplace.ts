import type { NormalizedMarketplaceListing, NormalizedSimilarListing } from '../../../app/api/marketplace-listing/types';
import {
  acquireBrowserContext,
  createConfiguredPage,
  looksLikeFacebookAuthWall,
  MarketplaceHtmlError,
} from './browserManager';
import { extractTitleFast, extractListingFull, extractSearchResults, extractFromEmbeddedJson } from './domExtractor';
import { generateSearchTermLocal } from './searchTermGenerator';
import type { ScrapedComparable } from './types';

function parseNumericPrice(priceStr: string): number {
  const digits = priceStr.replace(/[^\d.]/g, '');
  const num = Number(digits);
  return Number.isFinite(num) ? num : 0;
}

function mapComparablesToSimilarListings(
  comparables: ScrapedComparable[],
  fallbackLocation: string,
): NormalizedSimilarListing[] {
  return comparables.map((c) => ({
    title: c.title,
    price: parseNumericPrice(c.price),
    location: c.location || fallbackLocation,
    image: c.imageUrl,
    link: c.url,
  }));
}

/**
 * Scrape a Facebook Marketplace listing and its comparables using Playwright.
 *
 * Uses 2 parallel browser tabs:
 *   Tab 1 — navigates to listing URL, extracts full details
 *   Tab 2 — searches marketplace for comparables using the listing title
 *
 * Returns data in the NormalizedMarketplaceListing shape expected by the frontend.
 */
export async function scrapeMarketplaceListing(
  listingUrl: string,
  listingId: string | null,
): Promise<NormalizedMarketplaceListing> {
  const context = await acquireBrowserContext();
  const listingPage = await createConfiguredPage(context);
  const searchPage = await createConfiguredPage(context);

  try {
    // Phase 1: Fire-and-forget navigation to listing
    listingPage.goto(listingUrl, { waitUntil: 'commit', timeout: 10000 }).catch(() => undefined);

    // Phase 2: Get title ASAP (from og:title meta, before React hydrates)
    const title = await extractTitleFast(listingPage);

    if (!title) {
      // Check if we hit an auth wall
      const html = await listingPage.content();
      if (looksLikeFacebookAuthWall(html)) {
        throw new MarketplaceHtmlError(
          'Facebook returned a login page instead of the listing.',
          502,
        );
      }
    }

    // Phase 3: Extract location ID from embedded JSON (scripts are present by this point),
    // then fire the location-scoped comparable search on tab 2 in parallel with full extraction.
    const embeddedJson = listingId
      ? await extractFromEmbeddedJson(listingPage, listingId)
      : null;

    const searchTerm = title ? generateSearchTermLocal(title) : '';

    if (searchTerm) {
      // Scope the search to the listing's city using its location_vanity_or_id.
      // e.g. /marketplace/111888908827254/search/?query=Sourdough+Bread
      const locationSegment = embeddedJson?.locationId ? `${embeddedJson.locationId}/` : '';
      const searchUrl = `https://www.facebook.com/marketplace/${locationSegment}search/?query=${encodeURIComponent(searchTerm)}`;
      await searchPage.goto(searchUrl, { waitUntil: 'commit', timeout: 10000 }).catch(() => undefined);
    }

    // Phase 4: Extract listing details + search results in parallel.
    // Pass embeddedJson so extractListingFull skips rescanning the scripts.
    const [listing, comparables] = await Promise.all([
      extractListingFull(listingPage, listingUrl, listingId, embeddedJson ?? undefined),
      searchTerm ? extractSearchResults(searchPage) : Promise.resolve([]),
    ]);

    // If listing page was an auth wall, check after extraction attempt
    if (!listing.title && !listing.price) {
      const html = await listingPage.content();
      if (looksLikeFacebookAuthWall(html)) {
        throw new MarketplaceHtmlError(
          'Facebook returned a login page instead of the listing.',
          502,
        );
      }
    }

    // Map to the NormalizedMarketplaceListing shape
    const normalizedListing: NormalizedMarketplaceListing = {
      title: listing.title || undefined,
      description: listing.description || undefined,
      price: listing.price || undefined,
      location: listing.location || undefined,
      images: listing.imageUrls.length > 0 ? listing.imageUrls : undefined,
      sellerName: listing.sellerName || undefined,
      listingDate: listing.listingDate || undefined,
      condition: listing.condition || undefined,
      similarListings: mapComparablesToSimilarListings(comparables, listing.location || ''),
    };

    return normalizedListing;
  } finally {
    await listingPage.close().catch(() => undefined);
    await searchPage.close().catch(() => undefined);
  }
}
