import type {
  NormalizedMarketplaceListing,
  NormalizedSimpleListing,
} from './types';

type UnknownRecord = Record<string, unknown>;

interface ParsedListingHtmlResult {
  listing: NormalizedMarketplaceListing;
  metadata: {
    scriptBlocksParsed: number;
    listingCandidates: number;
    selectedListingId: string | null;
    usedGalleryImages: number;
  };
}

const PRICE_BAND_LOW_MULTIPLIER = 0.7;
const PRICE_BAND_HIGH_MULTIPLIER = 1.3;
const MAX_SIMPLE_LISTINGS = 40;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function normalizeWhitespace(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function normalizeMarketplaceLink(rawLink: string | null | undefined): string | undefined {
  const trimmed = normalizeWhitespace(rawLink);

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `https://www.facebook.com${trimmed}`;
  }

  return `https://www.facebook.com/${trimmed}`;
}

function parseScriptJsonBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const rawBlock = match[1]?.trim();

    if (!rawBlock || (rawBlock[0] !== '{' && rawBlock[0] !== '[')) {
      continue;
    }

    try {
      blocks.push(JSON.parse(rawBlock));
    } catch {
      // Ignore script blocks that are not strict JSON.
    }
  }

  return blocks;
}

function walkObjects(root: unknown, visit: (value: UnknownRecord) => void): void {
  const stack: unknown[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!isRecord(current)) {
      continue;
    }

    visit(current);

    if (Array.isArray(current)) {
      for (const child of current) {
        stack.push(child);
      }
      continue;
    }

    for (const child of Object.values(current)) {
      stack.push(child);
    }
  }
}

function getListingId(value: UnknownRecord): string | null {
  const idCandidate = value.id ?? value.listing_id;
  return typeof idCandidate === 'string' && idCandidate.trim().length > 0
    ? idCandidate.trim()
    : null;
}

function getListingTitle(value: UnknownRecord): string | undefined {
  return normalizeWhitespace(
    typeof value.marketplace_listing_title === 'string'
      ? value.marketplace_listing_title
      : typeof value.custom_title === 'string'
        ? value.custom_title
        : typeof value.name === 'string'
          ? value.name
          : undefined,
  );
}

function formatCurrencyAmount(value: number): string | undefined {
  if (!Number.isFinite(value)) {
    return undefined;
  }

  return `$${Math.round(value).toLocaleString()}`;
}

function getListingPrice(value: UnknownRecord): string | undefined {
  const listingPrice = isRecord(value.listing_price) ? value.listing_price : null;
  const formattedPrice = isRecord(value.formatted_price) ? value.formatted_price : null;

  if (listingPrice && typeof listingPrice.formatted_amount === 'string') {
    return normalizeWhitespace(listingPrice.formatted_amount);
  }

  if (formattedPrice && typeof formattedPrice.text === 'string') {
    return normalizeWhitespace(formattedPrice.text);
  }

  if (listingPrice && typeof listingPrice.amount === 'string') {
    const parsedAmount = Number(listingPrice.amount);
    const formattedAmount = formatCurrencyAmount(parsedAmount);

    if (formattedAmount) {
      return formattedAmount;
    }
  }

  if (listingPrice && typeof listingPrice.amount_with_offset_in_currency === 'string') {
    const cents = Number(listingPrice.amount_with_offset_in_currency);
    const formattedAmount = formatCurrencyAmount(cents / 100);

    if (formattedAmount) {
      return formattedAmount;
    }
  }

  return undefined;
}

function getListingLocation(value: UnknownRecord): string | undefined {
  const location = isRecord(value.location) ? value.location : null;
  const reverseGeocode = location && isRecord(location.reverse_geocode) ? location.reverse_geocode : null;
  const cityPage = reverseGeocode && isRecord(reverseGeocode.city_page) ? reverseGeocode.city_page : null;
  const locationText = isRecord(value.location_text) ? value.location_text : null;

  if (cityPage && typeof cityPage.display_name === 'string') {
    return normalizeWhitespace(cityPage.display_name);
  }

  if (reverseGeocode && typeof reverseGeocode.display_name === 'string') {
    return normalizeWhitespace(reverseGeocode.display_name);
  }

  if (locationText && typeof locationText.text === 'string') {
    return normalizeWhitespace(locationText.text);
  }

  if (reverseGeocode && typeof reverseGeocode.city === 'string') {
    const city = normalizeWhitespace(reverseGeocode.city);
    const state = normalizeWhitespace(
      typeof reverseGeocode.state === 'string' ? reverseGeocode.state : undefined,
    );

    if (city && state) {
      return `${city}, ${state}`;
    }

    return city;
  }

  return undefined;
}

function getPrimaryListingImage(value: UnknownRecord): string | undefined {
  const primaryListingPhoto = isRecord(value.primary_listing_photo) ? value.primary_listing_photo : null;
  const primaryImage = primaryListingPhoto && isRecord(primaryListingPhoto.image)
    ? primaryListingPhoto.image
    : null;

  if (primaryImage && typeof primaryImage.uri === 'string') {
    return normalizeWhitespace(primaryImage.uri);
  }

  return undefined;
}

function extractListingCandidates(parsedBlocks: unknown[]): UnknownRecord[] {
  const candidates: UnknownRecord[] = [];
  const seenKeys = new Set<string>();

  for (const block of parsedBlocks) {
    walkObjects(block, (node) => {
      const feedUnits = isRecord(node.marketplace_search)
        ? node.marketplace_search
        : null;
      const feedUnitWrapper = feedUnits && isRecord(feedUnits.feed_units)
        ? feedUnits.feed_units
        : null;
      const edges = feedUnitWrapper?.edges;

      if (!Array.isArray(edges)) {
        return;
      }

      for (const edge of edges) {
        if (!isRecord(edge) || !isRecord(edge.node)) {
          continue;
        }

        const edgeNode = edge.node;
        const listing = isRecord(edgeNode.listing)
          ? edgeNode.listing
          : isRecord(edgeNode.marketplace_listing)
            ? edgeNode.marketplace_listing
            : edgeNode;

        const id = getListingId(listing) ?? 'no-id';
        const title = getListingTitle(listing) ?? 'no-title';
        const key = `${id}:${title}`;

        if (seenKeys.has(key)) {
          continue;
        }

        seenKeys.add(key);
        candidates.push(listing);
      }
    });
  }

  return candidates;
}

function extractGalleryImages(html: string): string[] {
  const imageSources: string[] = [];
  const imageRegex = /<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(html)) !== null) {
    const imageTag = match[0];

    if (!/alt\s*=\s*["'][^"']*product photo of/i.test(imageTag)) {
      continue;
    }

    const srcMatch = imageTag.match(/\ssrc\s*=\s*["']([^"']+)["']/i);

    if (!srcMatch?.[1]) {
      continue;
    }

    const normalizedSource = normalizeWhitespace(decodeHtmlEntities(srcMatch[1]));

    if (!normalizedSource) {
      continue;
    }

    imageSources.push(normalizedSource);
  }

  return Array.from(new Set(imageSources));
}

function normalizeConditionValue(rawCondition: string | null | undefined): string | undefined {
  const normalized = normalizeWhitespace(rawCondition)?.toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (normalized === 'new') {
    return 'new';
  }

  if (normalized === 'used_like_new' || normalized.includes('like new')) {
    return 'used_like_new';
  }

  if (normalized === 'used_good' || normalized.endsWith('good') || normalized.includes('used good')) {
    return 'used_good';
  }

  if (normalized === 'used_fair' || normalized.endsWith('fair') || normalized.includes('used fair')) {
    return 'used_fair';
  }

  return undefined;
}

function extractCondition(value: UnknownRecord, html: string): string | undefined {
  const conditionCandidates = [
    typeof value.commerce_search_and_rp_condition === 'string'
      ? value.commerce_search_and_rp_condition
      : null,
    typeof value.item_condition === 'string' ? value.item_condition : null,
    typeof value.condition === 'string' ? value.condition : null,
  ];

  for (const conditionCandidate of conditionCandidates) {
    const normalizedCondition = normalizeConditionValue(conditionCandidate);

    if (normalizedCondition) {
      return normalizedCondition;
    }
  }

  const directConditionMatch = html.match(/"commerce_search_and_rp_condition":"([^"]+)"/i);

  if (directConditionMatch?.[1]) {
    const normalizedCondition = normalizeConditionValue(directConditionMatch[1]);

    if (normalizedCondition) {
      return normalizedCondition;
    }
  }

  const itemConditionMatch = html.match(/[?&]itemCondition=([^&"']+)/i);

  if (itemConditionMatch?.[1]) {
    const normalizedCondition = normalizeConditionValue(itemConditionMatch[1]);

    if (normalizedCondition) {
      return normalizedCondition;
    }
  }

  return undefined;
}

function extractDescription(value: UnknownRecord): string | undefined {
  const redactedDescription = isRecord(value.redacted_description)
    ? value.redacted_description
    : null;

  if (redactedDescription && typeof redactedDescription.text === 'string') {
    return normalizeWhitespace(redactedDescription.text);
  }

  return undefined;
}

function extractSellerName(value: UnknownRecord): string | undefined {
  const seller = isRecord(value.marketplace_listing_seller)
    ? value.marketplace_listing_seller
    : null;

  if (seller && typeof seller.name === 'string') {
    return normalizeWhitespace(seller.name);
  }

  return undefined;
}

function extractPostedTime(value: UnknownRecord): string | undefined {
  const creationTime = value.creation_time;

  if (typeof creationTime !== 'number' || !Number.isFinite(creationTime)) {
    return undefined;
  }

  return new Date(creationTime * 1000).toLocaleString();
}

function parseListingPriceNumber(price: string | undefined): number | null {
  if (!price) {
    return null;
  }

  const parsed = Number(price.replace(/[^\d.]/g, ''));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function buildSimpleListingFromCandidate(candidate: UnknownRecord): NormalizedSimpleListing | null {
  const id = getListingId(candidate);
  const title = getListingTitle(candidate);
  const price = getListingPrice(candidate);
  const location = getListingLocation(candidate);
  const image = getPrimaryListingImage(candidate);
  const link = normalizeMarketplaceLink(
    typeof candidate.marketplace_listing_link === 'string'
      ? candidate.marketplace_listing_link
      : id
        ? `/marketplace/item/${id}/`
        : undefined,
  );

  if (!title || !price || !location || !image || !link) {
    return null;
  }

  return {
    title,
    price,
    location,
    image,
    link,
  };
}

/**
 * Extracts one normalized listing payload from listing-page HTML.
 */
export function parseMarketplaceListingHtml(input: {
  html: string;
  requestedItemId?: string | null;
}): ParsedListingHtmlResult {
  const parsedBlocks = parseScriptJsonBlocks(input.html);
  const candidates = extractListingCandidates(parsedBlocks);
  const galleryImages = extractGalleryImages(input.html);

  const selectedCandidate = (
    input.requestedItemId
      ? candidates.find((candidate) => getListingId(candidate) === input.requestedItemId)
      : undefined
  ) ?? candidates[0];

  if (!selectedCandidate) {
    throw new Error('Unable to parse listing payload from HTML.');
  }

  const primaryImage = getPrimaryListingImage(selectedCandidate);
  const images = Array.from(
    new Set(
      [
        normalizeWhitespace(primaryImage),
        ...galleryImages,
      ].filter((image): image is string => Boolean(image)),
    ),
  );

  const listing: NormalizedMarketplaceListing = {
    title: getListingTitle(selectedCandidate),
    description: extractDescription(selectedCandidate),
    price: getListingPrice(selectedCandidate),
    location: getListingLocation(selectedCandidate),
    images,
    sellerName: extractSellerName(selectedCandidate),
    postedTime: extractPostedTime(selectedCandidate),
    condition: extractCondition(selectedCandidate, input.html),
  };

  if (!listing.title && !listing.price && !listing.location) {
    throw new Error('Parsed listing payload is missing core fields.');
  }

  return {
    listing,
    metadata: {
      scriptBlocksParsed: parsedBlocks.length,
      listingCandidates: candidates.length,
      selectedListingId: getListingId(selectedCandidate),
      usedGalleryImages: galleryImages.length,
    },
  };
}

/**
 * Extracts simple listings from marketplace search-page HTML.
 */
export function parseMarketplaceSearchHtml(html: string): NormalizedSimpleListing[] {
  const parsedBlocks = parseScriptJsonBlocks(html);
  const candidates = extractListingCandidates(parsedBlocks);
  const simpleListings: NormalizedSimpleListing[] = [];
  const seenLinks = new Set<string>();

  for (const candidate of candidates) {
    const listing = buildSimpleListingFromCandidate(candidate);

    if (!listing || seenLinks.has(listing.link)) {
      continue;
    }

    seenLinks.add(listing.link);
    simpleListings.push(listing);
  }

  return simpleListings.slice(0, MAX_SIMPLE_LISTINGS);
}

/**
 * Builds a deterministic marketplace search URL from one normalized listing payload.
 */
export function buildMarketplaceSearchUrl(input: {
  title?: string;
  location?: string;
  condition?: string;
  price?: string;
}): string {
  const url = new URL('https://www.facebook.com/marketplace/search');
  const queryText = normalizeWhitespace([input.title, input.location].filter(Boolean).join(' '));

  url.searchParams.set('query', queryText ?? 'marketplace item');
  url.searchParams.set('exact', 'false');

  const normalizedCondition = normalizeConditionValue(input.condition);

  if (normalizedCondition) {
    url.searchParams.set('itemCondition', normalizedCondition);
  }

  const price = parseListingPriceNumber(input.price);

  if (price !== null) {
    const minPrice = Math.max(0, Math.floor(price * PRICE_BAND_LOW_MULTIPLIER));
    const maxPrice = Math.ceil(price * PRICE_BAND_HIGH_MULTIPLIER);

    url.searchParams.set('minPrice', String(minPrice));
    url.searchParams.set('maxPrice', String(maxPrice));
  }

  return url.toString();
}

/**
 * Detects whether HTML likely represents an auth/interstitial wall instead of marketplace content.
 */
export function looksLikeFacebookAuthWall(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  const hasLoginForm =
    lowerHtml.includes('id="login_form"') ||
    lowerHtml.includes('name="login"') ||
    lowerHtml.includes('name="email"') && lowerHtml.includes('name="pass"');

  const hasLoginRedirect =
    lowerHtml.includes('/login/?next=') ||
    lowerHtml.includes('/login/device-based/');

  const hasExplicitAuthMessage =
    lowerHtml.includes('you must log in to continue') ||
    lowerHtml.includes('please log in to continue');

  return hasLoginForm || hasLoginRedirect || hasExplicitAuthMessage;
}
