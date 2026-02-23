import { createHash } from 'crypto';
import type { NormalizedMarketplaceListing } from '../../app/api/marketplace-listing/types';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'in',
  'is',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

export interface SimilarSearchQuery {
  queryText: string;
  keywords: string[];
  location: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  hash: string;
}

function tokenizeTitle(rawTitle: string | undefined): string[] {
  if (!rawTitle) {
    return [];
  }

  const normalizedTokens = rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

  return normalizedTokens.slice(0, 3);
}

function normalizeLocation(rawLocation: string | undefined): string | null {
  if (!rawLocation) {
    return null;
  }

  const location = rawLocation.split(',')[0]?.trim();
  return location && location.length > 0 ? location : null;
}

function parseListingUsdPrice(price: string | undefined): number | null {
  if (!price) {
    return null;
  }

  const normalized = price.replace(/[^0-9.]/g, '');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildHashPayload({
  queryText,
  location,
  minPrice,
  maxPrice,
}: Omit<SimilarSearchQuery, 'hash' | 'keywords'>): string {
  return JSON.stringify({
    queryText,
    location,
    minPrice,
    maxPrice,
  });
}

/**
 * Builds a stable similar-search query and deterministic hash from a listing payload.
 */
export function buildSimilarSearchQuery(
  listing: NormalizedMarketplaceListing | null | undefined,
): SimilarSearchQuery {
  const keywords = tokenizeTitle(listing?.title);
  const location = normalizeLocation(listing?.location);
  const queryText = [keywords.join(' '), location].filter(Boolean).join(' ').trim() || 'marketplace item';

  const parsedPrice = parseListingUsdPrice(listing?.price);
  const minPrice = parsedPrice !== null ? Math.max(0, Math.floor(parsedPrice * 0.8)) : null;
  const maxPrice = parsedPrice !== null ? Math.ceil(parsedPrice * 1.2) : null;

  const payloadToHash = buildHashPayload({
    queryText,
    location,
    minPrice,
    maxPrice,
  });

  const hash = createHash('sha256').update(payloadToHash).digest('hex');

  return {
    queryText,
    keywords,
    location,
    minPrice,
    maxPrice,
    hash,
  };
}
