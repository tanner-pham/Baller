import type { NormalizedMarketplaceListing } from '../types.js';

interface ParsedListingResult {
  listing: NormalizedMarketplaceListing;
  strategy: 'json-ld' | 'inline-json' | 'meta';
  raw: Record<string, unknown>;
}

function parseUsdPrice(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\$\s*([\d,]+(?:\.\d+)?)/);

  if (!match) {
    return undefined;
  }

  const numericValue = Number(match[1].replace(/,/g, ''));

  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return `$${Math.round(numericValue).toLocaleString()}`;
}

function extractMetaContent(html: string, key: string): string | undefined {
  const propertyRegex = new RegExp(
    `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  );
  const nameRegex = new RegExp(
    `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  );

  return propertyRegex.exec(html)?.[1] ?? nameRegex.exec(html)?.[1];
}

function parseJsonLdListing(html: string): ParsedListingResult | null {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(jsonLdRegex)) {
    const scriptContent = match[1]?.trim();

    if (!scriptContent) {
      continue;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(scriptContent);
    } catch {
      continue;
    }

    const nodes = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null
        ? [parsed]
        : [];

    for (const node of nodes) {
      if (!node || typeof node !== 'object') {
        continue;
      }

      const nodeRecord = node as Record<string, unknown>;
      const nodeType = typeof nodeRecord['@type'] === 'string' ? nodeRecord['@type'].toLowerCase() : '';

      if (!nodeType.includes('product') && !nodeType.includes('offer')) {
        continue;
      }

      const offers =
        typeof nodeRecord.offers === 'object' && nodeRecord.offers !== null
          ? (nodeRecord.offers as Record<string, unknown>)
          : null;
      const seller =
        typeof nodeRecord.seller === 'object' && nodeRecord.seller !== null
          ? (nodeRecord.seller as Record<string, unknown>)
          : null;

      const title = typeof nodeRecord.name === 'string' ? nodeRecord.name : undefined;
      const description =
        typeof nodeRecord.description === 'string' ? nodeRecord.description : undefined;
      const image =
        typeof nodeRecord.image === 'string'
          ? nodeRecord.image
          : Array.isArray(nodeRecord.image) && typeof nodeRecord.image[0] === 'string'
            ? nodeRecord.image[0]
            : undefined;
      const sellerName = typeof seller?.name === 'string' ? seller.name : undefined;
      const postedTime =
        typeof nodeRecord.datePublished === 'string' ? nodeRecord.datePublished : undefined;

      const priceCandidate =
        typeof offers?.price === 'string' || typeof offers?.price === 'number'
          ? String(offers.price)
          : typeof nodeRecord.price === 'string' || typeof nodeRecord.price === 'number'
            ? String(nodeRecord.price)
            : undefined;

      const currency = typeof offers?.priceCurrency === 'string' ? offers.priceCurrency : 'USD';
      const price =
        priceCandidate && currency === 'USD'
          ? `$${Number(priceCandidate).toLocaleString()}`
          : parseUsdPrice(priceCandidate);

      const location =
        typeof nodeRecord.areaServed === 'string'
          ? nodeRecord.areaServed
          : typeof nodeRecord.location === 'string'
            ? nodeRecord.location
            : undefined;

      if (!title && !description && !image) {
        continue;
      }

      return {
        strategy: 'json-ld',
        listing: {
          title,
          description,
          image,
          sellerName,
          postedTime,
          location,
          price,
        },
        raw: {
          nodeType,
        },
      };
    }
  }

  return null;
}

function parseInlineJsonListing(html: string): ParsedListingResult | null {
  const titleMatch = html.match(/"marketplace_listing_title"\s*:\s*"([^\"]+)"/i);
  const descriptionMatch = html.match(/"redacted_description"\s*:\s*\{\s*"text"\s*:\s*"([^\"]*)"/i);
  const locationMatch = html.match(/"location_text"\s*:\s*\{\s*"text"\s*:\s*"([^\"]+)"/i);
  const formattedPriceMatch = html.match(/"formatted_price"\s*:\s*\{\s*"text"\s*:\s*"([^\"]+)"/i);
  const imageMatch = html.match(/"images"\s*:\s*\[("https:[^\"]+")/i);
  const sellerMatch = html.match(/"marketplace_listing_seller"\s*:\s*\{[^\}]*"name"\s*:\s*"([^\"]+)"/i);

  const title = titleMatch?.[1];
  const description = descriptionMatch?.[1];
  const location = locationMatch?.[1];
  const price = parseUsdPrice(formattedPriceMatch?.[1]);
  const image = imageMatch?.[1]?.replace(/^"|"$/g, '');
  const sellerName = sellerMatch?.[1];

  if (!title && !description && !image) {
    return null;
  }

  return {
    strategy: 'inline-json',
    listing: {
      title,
      description,
      location,
      price,
      image,
      sellerName,
    },
    raw: {
      inlineKeys: ['marketplace_listing_title', 'redacted_description', 'location_text'],
    },
  };
}

function parseMetaListing(html: string): ParsedListingResult | null {
  const title = extractMetaContent(html, 'og:title');
  const description = extractMetaContent(html, 'og:description');
  const image = extractMetaContent(html, 'og:image');

  if (!title && !description && !image) {
    return null;
  }

  return {
    strategy: 'meta',
    listing: {
      title,
      description,
      image,
      price: parseUsdPrice(description),
    },
    raw: {
      hasOgTitle: Boolean(title),
      hasOgDescription: Boolean(description),
      hasOgImage: Boolean(image),
    },
  };
}

/**
 * Extracts listing details via JSON-LD, inline JSON, then generic meta tags.
 */
export function parseListingFromHtml(html: string): ParsedListingResult {
  const jsonLdResult = parseJsonLdListing(html);

  if (jsonLdResult) {
    return jsonLdResult;
  }

  const inlineJsonResult = parseInlineJsonListing(html);

  if (inlineJsonResult) {
    return inlineJsonResult;
  }

  const metaResult = parseMetaListing(html);

  if (metaResult) {
    return metaResult;
  }

  throw new Error('Unable to parse listing details from page content.');
}
