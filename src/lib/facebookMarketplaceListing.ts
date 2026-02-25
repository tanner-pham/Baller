const FACEBOOK_MARKETPLACE_HOST = 'www.facebook.com';
const FACEBOOK_MARKETPLACE_PROTOCOL = 'https:';
const FACEBOOK_MARKETPLACE_ITEM_PATH_REGEX = /^\/marketplace\/item\/(\d+)\/?$/;

export interface FacebookMarketplaceListing {
  itemId: string;
  normalizedUrl: string;
}

export function parseFacebookMarketplaceListingUrl(
  rawUrl: string,
): FacebookMarketplaceListing | null {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const itemPathMatch = parsedUrl.pathname.match(
      FACEBOOK_MARKETPLACE_ITEM_PATH_REGEX,
    );

    if (
      parsedUrl.protocol !== FACEBOOK_MARKETPLACE_PROTOCOL ||
      parsedUrl.hostname !== FACEBOOK_MARKETPLACE_HOST ||
      !itemPathMatch
    ) {
      return null;
    }

    const itemId = itemPathMatch[1];

    return {
      itemId,
      normalizedUrl: `${FACEBOOK_MARKETPLACE_PROTOCOL}//${FACEBOOK_MARKETPLACE_HOST}/marketplace/item/${itemId}/`,
    };
  } catch {
    return null;
  }
}

export function isFacebookMarketplaceListingUrl(rawUrl: string): boolean {
  return parseFacebookMarketplaceListingUrl(rawUrl) !== null;
}
