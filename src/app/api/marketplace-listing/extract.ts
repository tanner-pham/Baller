import type {
  RapidApiMarketplaceListing,
  RapidApiMarketplaceWrapper,
} from '../../../types/rapidApiMarketplace';

/**
 * Ensures an unknown payload can be treated as an object record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Finds a listing object across known RapidAPI wrapper shapes.
 */
export function extractListingPayload(source: unknown): RapidApiMarketplaceListing | null {
  if (!isRecord(source)) {
    return null;
  }

  const listingSource = source as RapidApiMarketplaceListing;

  if (
    typeof listingSource.marketplace_listing_title === 'string' ||
    typeof listingSource.custom_title === 'string' ||
    typeof listingSource.id === 'string'
  ) {
    return listingSource;
  }

  const wrappedSource = source as RapidApiMarketplaceWrapper;
  const nestedCandidates = [
    wrappedSource.data,
    wrappedSource.result,
    wrappedSource.product,
    wrappedSource.listing,
  ];

  for (const candidate of nestedCandidates) {
    if (
      candidate &&
      (typeof candidate.marketplace_listing_title === 'string' ||
        typeof candidate.custom_title === 'string' ||
        typeof candidate.id === 'string')
    ) {
      return candidate;
    }
  }

  return null;
}
