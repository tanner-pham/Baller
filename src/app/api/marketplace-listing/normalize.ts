import type { RapidApiMarketplaceListing } from '../../../types/rapidApiMarketplace';
import type {
  NormalizedMarketplaceListing,
  NormalizedSimilarListing,
} from './types';

/**
 * Normalizes several RapidAPI price representations into one readable value.
 */
function normalizePrice(listing: RapidApiMarketplaceListing): string | undefined {
  const formattedPrice = listing.formatted_price?.text?.trim();

  if (formattedPrice) {
    return formattedPrice;
  }

  const numericAmount =
    listing.listing_price?.amount ??
    (listing.listing_price?.amount_with_offset
      ? (Number(listing.listing_price.amount_with_offset) / 100).toString()
      : undefined);

  const currency = listing.listing_price?.currency;

  if (!numericAmount) {
    return undefined;
  }

  const parsedAmount = Number(numericAmount);

  if (!Number.isFinite(parsedAmount)) {
    return undefined;
  }

  if (currency === 'USD') {
    return `$${parsedAmount.toLocaleString()}`;
  }

  return `${parsedAmount.toLocaleString()} ${currency ?? ''}`.trim();
}

/**
 * Converts unix-second creation time into locale string output.
 */
function normalizePostedTime(creationTime?: number): string | undefined {
  if (!creationTime || !Number.isFinite(creationTime)) {
    return undefined;
  }

  return new Date(creationTime * 1000).toLocaleString();
}

/**
 * Maps cross-post listing references into dashboard similar-listing cards.
 */
function normalizeSimilarListings(
  listing: RapidApiMarketplaceListing,
): NormalizedSimilarListing[] {
  const crossPostListings = listing.cross_post_info?.all_listings;

  if (!Array.isArray(crossPostListings)) {
    return [];
  }

  return crossPostListings
    .filter((entry) => entry.id && String(entry.id) !== listing.id)
    .map((entry) => ({
      title: 'Related Listing',
      price: 0,
      location: listing.location_text?.text ?? 'Unknown',
      image: listing.images?.[0] ?? '',
      link: `https://www.facebook.com/marketplace/item/${String(entry.id)}/`,
    }))
    .filter((entry) => entry.image !== '');
}

/**
 * Produces the API response structure consumed by dashboard UI.
 */
export function normalizeListingResponse(
  listing: RapidApiMarketplaceListing,
): NormalizedMarketplaceListing {
  return {
    title: listing.marketplace_listing_title ?? listing.custom_title,
    description: listing.redacted_description?.text ?? undefined,
    price: normalizePrice(listing),
    location: listing.location_text?.text ?? undefined,
    images: listing.images,
    sellerName: listing.marketplace_listing_seller?.name ?? 'Seller unavailable',
    postedTime: normalizePostedTime(listing.creation_time),
    similarListings: normalizeSimilarListings(listing),
  };
}
