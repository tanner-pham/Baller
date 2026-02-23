import type { NormalizedSimilarListing } from '../types.js';

function stripHtmlTags(source: string): string {
  return source
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePrice(text: string): number {
  const match = text.match(/\$\s*([\d,]+(?:\.\d+)?)/);

  if (!match) {
    return 0;
  }

  const parsed = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function normalizeListingLink(rawHref: string): string {
  if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
    return rawHref;
  }

  if (rawHref.startsWith('/')) {
    return `https://www.facebook.com${rawHref}`;
  }

  return `https://www.facebook.com/${rawHref}`;
}

/**
 * Extracts candidate similar listings from search-result HTML.
 */
export function parseSimilarListingsFromHtml(
  html: string,
  fallbackLocation: string | null,
): NormalizedSimilarListing[] {
  const listings: NormalizedSimilarListing[] = [];
  const anchorRegex = /<a[^>]+href=["']([^"']*\/marketplace\/item\/\d+\/?[^"']*)["'][^>]*>([\s\S]{0,600}?)<\/a>/gi;

  for (const match of html.matchAll(anchorRegex)) {
    const rawHref = match[1];
    const innerHtml = match[2] ?? '';
    const textContent = stripHtmlTags(innerHtml);
    const imageMatch = innerHtml.match(/<img[^>]+src=["']([^"']+)["']/i);

    if (!rawHref || !textContent) {
      continue;
    }

    const link = normalizeListingLink(rawHref);
    const title = textContent.slice(0, 120);

    listings.push({
      title: title || 'Related Listing',
      price: parsePrice(textContent),
      location: fallbackLocation ?? 'Unknown',
      image: imageMatch?.[1] ?? '',
      link,
    });
  }

  const deduped = new Map<string, NormalizedSimilarListing>();

  for (const listing of listings) {
    if (!listing.link || deduped.has(listing.link)) {
      continue;
    }

    deduped.set(listing.link, listing);
  }

  return Array.from(deduped.values());
}
