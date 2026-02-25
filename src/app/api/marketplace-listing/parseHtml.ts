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

  if (typeof idCandidate === 'number' && Number.isFinite(idCandidate)) {
    return String(Math.trunc(idCandidate));
  }

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

function getMarketplaceListingLink(value: UnknownRecord): string | undefined {
  return normalizeMarketplaceLink(
    typeof value.marketplace_listing_link === 'string'
      ? value.marketplace_listing_link
      : undefined,
  );
}

function extractMarketplaceItemIdFromLink(value: string | null | undefined): string | null {
  const normalizedLink = normalizeMarketplaceLink(value);

  if (!normalizedLink) {
    return null;
  }

  const idMatch = normalizedLink.match(/\/marketplace\/item\/(\d+)\/?/i);
  return idMatch?.[1] ?? null;
}

function getAllListingPhotoUris(value: UnknownRecord): string[] {
  const imageUris: string[] = [];
  const listingPhotos = Array.isArray(value.listing_photos) ? value.listing_photos : [];

  for (const photo of listingPhotos) {
    if (!isRecord(photo)) {
      continue;
    }

    const image = isRecord(photo.image) ? photo.image : null;

    if (image && typeof image.uri === 'string') {
      const normalizedUri = normalizeWhitespace(image.uri);

      if (normalizedUri) {
        imageUris.push(normalizedUri);
      }
    }
  }

  return Array.from(new Set(imageUris));
}

function looksLikeListingCandidate(value: UnknownRecord): boolean {
  const listingId = getListingId(value);
  const listingLink = getMarketplaceListingLink(value);
  const hasNumericListingIdentifier = Boolean(listingId && /^\d+$/.test(listingId));
  const hasMarketplaceListingLink = Boolean(listingLink && /\/marketplace\/item\/\d+/i.test(listingLink));
  const hasListingTitle = Boolean(getListingTitle(value));
  const hasListingPrice = Boolean(getListingPrice(value));
  const hasListingLocation = Boolean(getListingLocation(value));
  const hasListingImage =
    Boolean(getPrimaryListingImage(value)) ||
    getAllListingPhotoUris(value).length > 0;

  return (
    (hasNumericListingIdentifier || hasMarketplaceListingLink) &&
    (hasListingTitle || hasListingPrice || hasListingLocation || hasListingImage)
  );
}

function extractListingCandidates(parsedBlocks: unknown[]): UnknownRecord[] {
  const candidates: UnknownRecord[] = [];
  const seenKeys = new Set<string>();

  const pushCandidate = (candidate: UnknownRecord): void => {
    const id = getListingId(candidate) ?? 'no-id';
    const title = getListingTitle(candidate) ?? 'no-title';
    const key = `${id}:${title}`;

    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    candidates.push(candidate);
  };

  for (const block of parsedBlocks) {
    walkObjects(block, (node) => {
      const feedUnits = isRecord(node.marketplace_search)
        ? node.marketplace_search
        : null;
      const feedUnitWrapper = feedUnits && isRecord(feedUnits.feed_units)
        ? feedUnits.feed_units
        : null;
      const edges = feedUnitWrapper?.edges;

      if (Array.isArray(edges)) {
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

          if (looksLikeListingCandidate(listing)) {
            pushCandidate(listing);
          }
        }
      }

      const directCandidate = isRecord(node.listing)
        ? node.listing
        : isRecord(node.marketplace_listing)
          ? node.marketplace_listing
          : node;

      if (looksLikeListingCandidate(directCandidate)) {
        pushCandidate(directCandidate);
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

function stripScriptsAndStyles(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
}

function stripHtmlTags(value: string): string | undefined {
  return normalizeWhitespace(decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ')));
}

function extractTagAttribute(tag: string, attributeName: string): string | undefined {
  const escapedAttributeName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const attributeRegex = new RegExp(`${escapedAttributeName}\\s*=\\s*["']([^"']+)["']`, 'i');
  const attributeMatch = tag.match(attributeRegex);

  if (!attributeMatch?.[1]) {
    return undefined;
  }

  return normalizeWhitespace(decodeHtmlEntities(attributeMatch[1]));
}

function extractMetaContent(html: string, key: string): string | undefined {
  const normalizedKey = key.toLowerCase();
  const metaTagRegex = /<meta\b[^>]*>/gi;
  let metaTagMatch: RegExpExecArray | null;

  while ((metaTagMatch = metaTagRegex.exec(html)) !== null) {
    const metaTag = metaTagMatch[0];
    const propertyValue = extractTagAttribute(metaTag, 'property')?.toLowerCase();
    const nameValue = extractTagAttribute(metaTag, 'name')?.toLowerCase();

    if (propertyValue !== normalizedKey && nameValue !== normalizedKey) {
      continue;
    }

    const contentValue = extractTagAttribute(metaTag, 'content');

    if (contentValue) {
      return contentValue;
    }
  }

  return undefined;
}

function extractCanonicalMarketplaceLinkFromHtml(html: string): string | undefined {
  const linkTagRegex = /<link\b[^>]*>/gi;
  let linkTagMatch: RegExpExecArray | null;

  while ((linkTagMatch = linkTagRegex.exec(html)) !== null) {
    const linkTag = linkTagMatch[0];
    const rel = extractTagAttribute(linkTag, 'rel')?.toLowerCase();

    if (!rel || !rel.split(/\s+/).includes('canonical')) {
      continue;
    }

    const href = extractTagAttribute(linkTag, 'href');
    const normalizedLink = normalizeMarketplaceLink(href);

    if (normalizedLink && /\/marketplace\/item\/\d+/i.test(normalizedLink)) {
      return normalizedLink;
    }
  }

  const ogUrl = extractMetaContent(html, 'og:url');
  const normalizedOgUrl = normalizeMarketplaceLink(ogUrl);

  return normalizedOgUrl && /\/marketplace\/item\/\d+/i.test(normalizedOgUrl)
    ? normalizedOgUrl
    : undefined;
}

function extractFirstTagText(html: string, tagName: string): string | undefined {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tagRegex = new RegExp(`<${escapedTagName}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTagName}>`, 'i');
  const tagMatch = html.match(tagRegex);

  if (!tagMatch?.[1]) {
    return undefined;
  }

  return stripHtmlTags(tagMatch[1]);
}

function extractPriceFromText(content: string): string | undefined {
  const rawPriceMatch = content.match(/\$\s?\d[\d,]*(?:\.\d{2})?/);

  if (rawPriceMatch?.[0]) {
    return normalizeWhitespace(rawPriceMatch[0].replace(/\s+/g, ''));
  }

  if (/\bfree\b/i.test(content)) {
    return 'Free';
  }

  return undefined;
}

function extractLocationFromText(content: string): string | undefined {
  const locationPatterns = [
    /(?:Listed|Available)\s+in\s+(.+?)(?:\s+(?:Seller|Condition|Description|Message|Save)\b|$)/i,
    /(?:Location|Located)\s*[:\-]\s*(.+?)(?:\s+(?:Seller|Condition|Description|Message|Save)\b|$)/i,
  ];

  for (const locationPattern of locationPatterns) {
    const locationMatch = content.match(locationPattern);
    const location = normalizeWhitespace(locationMatch?.[1]);

    if (location && location.length <= 120) {
      return location;
    }
  }

  return undefined;
}

function extractDescriptionFromText(content: string): string | undefined {
  const descriptionMatch = content.match(
    /Description\s+(.+?)(?:\s+(?:Seller details|Condition|Listed|Location|Message seller|Save)\b|$)/i,
  );
  const description = normalizeWhitespace(descriptionMatch?.[1]);

  if (description && description.length >= 10) {
    return description;
  }

  return undefined;
}

function extractPostedTimeFromText(content: string): string | undefined {
  const postedTimeMatch = content.match(
    /\b(Listed\s+(?:today|yesterday|\d+\s+(?:minute|hour|day|week|month|year)s?\s+ago))\b/i,
  );
  return normalizeWhitespace(postedTimeMatch?.[1]);
}

function extractConditionFromText(content: string): string | undefined {
  const loweredContent = content.toLowerCase();
  const conditionCandidates = ['used - like new', 'used - good', 'used - fair', 'new', 'used'];

  for (const conditionCandidate of conditionCandidates) {
    if (!loweredContent.includes(conditionCandidate)) {
      continue;
    }

    const normalizedCondition = normalizeConditionValue(conditionCandidate);

    if (normalizedCondition) {
      return normalizedCondition;
    }
  }

  return undefined;
}

function extractSellerNameFromHtml(html: string, textContent: string): string | undefined {
  const profileLinkRegex =
    /<a\b[^>]*href=["'][^"']*\/marketplace\/profile\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let profileLinkMatch: RegExpExecArray | null;

  while ((profileLinkMatch = profileLinkRegex.exec(html)) !== null) {
    const sellerName = stripHtmlTags(profileLinkMatch[1] ?? '');

    if (!sellerName) {
      continue;
    }

    const loweredSellerName = sellerName.toLowerCase();

    if (
      loweredSellerName.includes('log in') ||
      loweredSellerName.includes('sign up') ||
      loweredSellerName.includes('marketplace') ||
      loweredSellerName.includes('facebook')
    ) {
      continue;
    }

    return sellerName;
  }

  const sellerTextMatch = textContent.match(
    /Seller(?:\s+details)?\s+([A-Za-z][A-Za-z.'\-\s]{1,59})(?:\s+(?:Message|Save|Listed|Condition)\b|$)/i,
  );
  return normalizeWhitespace(sellerTextMatch?.[1]);
}

function extractImageUrisFromHtml(html: string): string[] {
  const imageUris: string[] = [];
  const seenUris = new Set<string>();
  const ogImage = extractMetaContent(html, 'og:image');

  if (ogImage) {
    seenUris.add(ogImage);
    imageUris.push(ogImage);
  }

  const imageTagRegex = /<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  let imageTagMatch: RegExpExecArray | null;

  while ((imageTagMatch = imageTagRegex.exec(html)) !== null) {
    const source = normalizeWhitespace(decodeHtmlEntities(imageTagMatch[1]));

    if (!source || seenUris.has(source)) {
      continue;
    }

    if (!/^https?:\/\//i.test(source)) {
      continue;
    }

    const loweredSource = source.toLowerCase();

    if (
      loweredSource.includes('emoji') ||
      loweredSource.includes('avatar') ||
      loweredSource.includes('profile') ||
      loweredSource.includes('/p50x50/') ||
      loweredSource.includes('/s50x50/') ||
      loweredSource.includes('/c32.')
    ) {
      continue;
    }

    seenUris.add(source);
    imageUris.push(source);

    if (imageUris.length >= 40) {
      break;
    }
  }

  return imageUris;
}

function extractListingFromDomFallback(html: string): {
  listing: NormalizedMarketplaceListing;
  selectedListingId: string | null;
} | null {
  const contentWithoutScriptBlocks = stripScriptsAndStyles(html);
  const plainTextContent = stripHtmlTags(contentWithoutScriptBlocks) ?? '';
  const canonicalListingLink = extractCanonicalMarketplaceLinkFromHtml(html);
  const selectedListingId = extractMarketplaceItemIdFromLink(canonicalListingLink);

  const title =
    extractMetaContent(html, 'og:title') ??
    extractFirstTagText(contentWithoutScriptBlocks, 'h1');
  const description =
    extractMetaContent(html, 'og:description') ??
    extractMetaContent(html, 'description') ??
    extractDescriptionFromText(plainTextContent);
  const metaPriceAmount = extractMetaContent(html, 'product:price:amount');
  const parsedMetaPrice = metaPriceAmount
    ? Number(metaPriceAmount.replace(/[^\d.]/g, ''))
    : Number.NaN;
  const metaPrice =
    Number.isFinite(parsedMetaPrice) && parsedMetaPrice > 0
      ? formatCurrencyAmount(parsedMetaPrice)
      : undefined;
  const price = metaPrice ?? extractPriceFromText(plainTextContent);
  const location = extractLocationFromText(plainTextContent);
  const images = extractImageUrisFromHtml(html);
  const sellerName = extractSellerNameFromHtml(contentWithoutScriptBlocks, plainTextContent);
  const postedTime = extractPostedTimeFromText(plainTextContent);
  const condition = extractConditionFromText(plainTextContent);

  if (!title && !price && !location && images.length === 0) {
    return null;
  }

  return {
    listing: {
      title,
      description,
      price,
      location,
      images,
      sellerName,
      listingDate: postedTime,
      condition,
    },
    selectedListingId,
  };
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

function extractSimpleListingsFromDomFallback(html: string): NormalizedSimpleListing[] {
  const listings: NormalizedSimpleListing[] = [];
  const seenLinks = new Set<string>();
  const listingLinkRegex =
    /<a\b[^>]*href=["']([^"']*\/marketplace\/item\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let listingLinkMatch: RegExpExecArray | null;

  while ((listingLinkMatch = listingLinkRegex.exec(html)) !== null) {
    const normalizedLink = normalizeMarketplaceLink(decodeHtmlEntities(listingLinkMatch[1]));

    if (!normalizedLink || seenLinks.has(normalizedLink)) {
      continue;
    }

    const listingFragment = listingLinkMatch[2] ?? '';
    const spanTextValues = Array.from(listingFragment.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi))
      .map((spanMatch) => stripHtmlTags(spanMatch[1] ?? ''))
      .filter((value): value is string => Boolean(value));
    const price =
      spanTextValues.find((value) => /^\$[\d,]+(?:\.\d{2})?$/.test(value)) ??
      extractPriceFromText(stripHtmlTags(listingFragment) ?? '');
    const title = spanTextValues.find(
      (value) => value !== price && value.length > 2 && value.length < 160 && !value.startsWith('$'),
    );
    const locationCandidates = spanTextValues.filter(
      (value) =>
        value !== price &&
        value !== title &&
        value.length > 1 &&
        value.length <= 100 &&
        !/^\d+\s+(?:minutes?|hours?|days?)$/i.test(value),
    );
    const location =
      locationCandidates.find((value) => value.includes(',') || /\bmi\b/i.test(value)) ??
      locationCandidates[0];
    const imageMatch = listingFragment.match(/<img\b[^>]*\ssrc=["']([^"']+)["']/i);
    const image = imageMatch?.[1] ? normalizeWhitespace(decodeHtmlEntities(imageMatch[1])) : undefined;

    if (!title || !price || !location || !image) {
      continue;
    }

    seenLinks.add(normalizedLink);
    listings.push({
      title,
      price,
      location,
      image,
      link: normalizedLink,
    });

    if (listings.length >= MAX_SIMPLE_LISTINGS) {
      break;
    }
  }

  return listings;
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
  const domFallback = extractListingFromDomFallback(input.html);

  const requestedItemId = normalizeWhitespace(input.requestedItemId ?? undefined) ?? null;

  const selectedCandidate = (
    requestedItemId
      ? candidates.find((candidate) => {
          const candidateId = getListingId(candidate);
          const candidateLinkId = extractMarketplaceItemIdFromLink(
            typeof candidate.marketplace_listing_link === 'string'
              ? candidate.marketplace_listing_link
              : undefined,
          );

          return candidateId === requestedItemId || candidateLinkId === requestedItemId;
        })
      : undefined
  ) ?? (requestedItemId ? undefined : candidates[0]);

  if (!selectedCandidate) {
    if (!domFallback) {
      throw new Error('Unable to parse listing payload from HTML.');
    }

    if (
      requestedItemId &&
      domFallback.selectedListingId &&
      domFallback.selectedListingId !== requestedItemId
    ) {
      throw new Error('Parsed listing payload did not match requested item id.');
    }

    const hasCoreFields =
      Boolean(domFallback.listing.title) ||
      Boolean(domFallback.listing.price) ||
      Boolean(domFallback.listing.location);

    if (!hasCoreFields) {
      throw new Error('Parsed listing payload is missing core fields.');
    }

    return {
      listing: domFallback.listing,
      metadata: {
        scriptBlocksParsed: parsedBlocks.length,
        listingCandidates: candidates.length,
        selectedListingId: domFallback.selectedListingId,
        usedGalleryImages: galleryImages.length,
      },
    };
  }

  const primaryImage = getPrimaryListingImage(selectedCandidate);
  const listingPhotoUris = getAllListingPhotoUris(selectedCandidate);
  const fallbackImages = domFallback?.listing.images ?? [];
  const images = Array.from(
    new Set(
      [
        normalizeWhitespace(primaryImage),
        ...listingPhotoUris,
        ...galleryImages,
        ...fallbackImages,
      ].filter((image): image is string => Boolean(image)),
    ),
  );

  const listing: NormalizedMarketplaceListing = {
    title: getListingTitle(selectedCandidate) ?? domFallback?.listing.title,
    description: extractDescription(selectedCandidate) ?? domFallback?.listing.description,
    price: getListingPrice(selectedCandidate) ?? domFallback?.listing.price,
    location: getListingLocation(selectedCandidate) ?? domFallback?.listing.location,
    images,
    sellerName: extractSellerName(selectedCandidate) ?? domFallback?.listing.sellerName,
    listingDate: extractPostedTime(selectedCandidate) ?? domFallback?.listing.listingDate,
    condition: extractCondition(selectedCandidate, input.html) ?? domFallback?.listing.condition,
  };

  if (!listing.title && !listing.price && !listing.location) {
    throw new Error('Parsed listing payload is missing core fields.');
  }

  const selectedListingId =
    getListingId(selectedCandidate) ??
    extractMarketplaceItemIdFromLink(getMarketplaceListingLink(selectedCandidate)) ??
    domFallback?.selectedListingId ??
    null;

  if (requestedItemId && selectedListingId && selectedListingId !== requestedItemId) {
    throw new Error('Parsed listing payload did not match requested item id.');
  }

  return {
    listing,
    metadata: {
      scriptBlocksParsed: parsedBlocks.length,
      listingCandidates: candidates.length,
      selectedListingId,
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

  if (simpleListings.length > 0) {
    return simpleListings.slice(0, MAX_SIMPLE_LISTINGS);
  }

  return extractSimpleListingsFromDomFallback(html).slice(0, MAX_SIMPLE_LISTINGS);
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

  if (!hasLoginForm && !hasLoginRedirect && !hasExplicitAuthMessage) {
    return false;
  }

  const hasMarketplaceDataSignals =
    lowerHtml.includes('marketplace_listing_title') ||
    lowerHtml.includes('"marketplace_search"') ||
    lowerHtml.includes('"listing_price"') ||
    lowerHtml.includes('primary_listing_photo') ||
    lowerHtml.includes('marketplace_listing_link') ||
    lowerHtml.includes('product photo of');

  // Facebook can render a login modal on top of real marketplace payloads.
  // Treat it as an auth wall only when marketplace data signals are absent.
  return !hasMarketplaceDataSignals;
}
