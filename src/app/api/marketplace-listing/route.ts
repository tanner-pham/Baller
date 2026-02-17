import { NextRequest, NextResponse } from 'next/server';
import type {
  RapidApiMarketplaceListing,
  RapidApiMarketplaceWrapper,
} from '../../../types/rapidApiMarketplace';

interface NormalizedSimilarListing {
  title: string;
  price: number;
  location: string;
  image: string;
  link: string;
}

interface NormalizedMarketplaceListing {
  title?: string;
  description?: string;
  price?: string;
  location?: string;
  image?: string;
  sellerName?: string;
  postedTime?: string;
  similarListings?: NormalizedSimilarListing[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractListingPayload(source: unknown): RapidApiMarketplaceListing | null {
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

function normalizePostedTime(creationTime?: number): string | undefined {
  if (!creationTime || !Number.isFinite(creationTime)) {
    return undefined;
  }

  // RapidAPI field appears to be unix seconds.
  return new Date(creationTime * 1000).toLocaleString();
}

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

function normalizeListingResponse(
  listing: RapidApiMarketplaceListing,
): NormalizedMarketplaceListing {
  return {
    title: listing.marketplace_listing_title ?? listing.custom_title,
    description: listing.redacted_description?.text ?? undefined,
    price: normalizePrice(listing),
    location: listing.location_text?.text ?? undefined,
    image: listing.images?.[0],
    sellerName: listing.marketplace_listing_seller?.name ?? 'Seller unavailable',
    postedTime: normalizePostedTime(listing.creation_time),
    similarListings: normalizeSimilarListings(listing),
  };
}

export async function GET(request: NextRequest) {
  try {
    const listingIdentifier =
      request.nextUrl.searchParams.get('listingUrl') ??
      request.nextUrl.searchParams.get('itemId');

    if (!listingIdentifier) {
      return NextResponse.json({ error: 'itemId or listingUrl is required' }, { status: 400 });
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST ?? 'facebook-marketplace1.p.rapidapi.com';

    if (!rapidApiKey) {
      return NextResponse.json({ error: 'Missing RAPIDAPI_KEY' }, { status: 500 });
    }

    const rapidApiUrl = new URL(`https://${rapidApiHost}/getProductByURL`);
    rapidApiUrl.searchParams.set('url', listingIdentifier);

    const response = await fetch(rapidApiUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHost,
      },
      cache: 'no-store',
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `RapidAPI request failed with status ${response.status}`,
          details: responseText,
        },
        { status: response.status },
      );
    }

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'RapidAPI returned non-JSON response', details: responseText },
        { status: 502 },
      );
    }

    const listingPayload = extractListingPayload(parsedResponse);

    if (!listingPayload) {
      return NextResponse.json(
        { error: 'RapidAPI payload did not include a listing object', raw: parsedResponse },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      listing: normalizeListingResponse(listingPayload),
      raw: parsedResponse,
    });
  } catch (error) {
    console.error('Marketplace listing fetch failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch listing from RapidAPI',
      },
      { status: 500 },
    );
  }
}
