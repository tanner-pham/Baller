import type { NormalizedMarketplaceListing } from '../../app/api/marketplace-listing/types';

function hasNonEmptyText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function hasMarketplaceListingDescription(
  listing: NormalizedMarketplaceListing | null | undefined,
): boolean {
  return hasNonEmptyText(listing?.description);
}

export function hasMarketplaceListingImage(
  listing: NormalizedMarketplaceListing | null | undefined,
): boolean {
  return Boolean(listing?.images?.some((image) => hasNonEmptyText(image)));
}

export function isCacheableMarketplaceListingPayload(
  listing: NormalizedMarketplaceListing | null | undefined,
): boolean {
  if (!listing) {
    return false;
  }

  const hasTitle = hasNonEmptyText(listing.title);
  const hasContext =
    hasNonEmptyText(listing.price) ||
    hasNonEmptyText(listing.location) ||
    hasNonEmptyText(listing.condition);

  return hasTitle && hasContext && (
    hasMarketplaceListingDescription(listing) ||
    hasMarketplaceListingImage(listing)
  );
}

export function getMarketplaceListingCompletenessScore(
  listing: NormalizedMarketplaceListing | null | undefined,
): number {
  if (!listing) {
    return 0;
  }

  let score = 0;

  if (hasNonEmptyText(listing.title)) {
    score += 3;
  }

  if (hasNonEmptyText(listing.price)) {
    score += 2;
  }

  if (hasNonEmptyText(listing.location)) {
    score += 2;
  }

  if (hasMarketplaceListingImage(listing)) {
    score += 4;
  }

  if (hasMarketplaceListingDescription(listing)) {
    score += 4;
  }

  if (hasNonEmptyText(listing.sellerName)) {
    score += 1;
  }

  if (hasNonEmptyText(listing.listingDate)) {
    score += 1;
  }

  if (hasNonEmptyText(listing.condition)) {
    score += 1;
  }

  return score;
}
