import { NextRequest, NextResponse } from 'next/server';
import {
  buildMarketplaceSearchUrl,
  looksLikeFacebookAuthWall,
  parseMarketplaceSearchHtml,
} from '../marketplace-listing/parseHtml';
import type { NormalizedMarketplaceListing } from '../marketplace-listing/types';
import {
  getListingCacheEntry,
  upsertListingCacheEntry,
} from '../../../lib/server/listingCacheRepository';

const SEARCH_FETCH_TIMEOUT_MS = 12000;

class UpstreamSearchHtmlError extends Error {
  status: number;

  details?: string;

  constructor(message: string, status = 502, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function fetchSearchHtml(searchUrl: string): Promise<{
  html: string;
  status: number;
}> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, SEARCH_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'accept-language': 'en-US,en;q=0.9',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
      signal: abortController.signal,
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new UpstreamSearchHtmlError(
        `Marketplace search request failed with status ${response.status}`,
        response.status,
        responseText.slice(0, 1000),
      );
    }

    if (!responseText || responseText.trim().length === 0) {
      throw new UpstreamSearchHtmlError('Marketplace search HTML response was empty.', 502);
    }

    if (looksLikeFacebookAuthWall(responseText)) {
      throw new UpstreamSearchHtmlError(
        'Marketplace search returned Facebook login/interstitial content.',
        502,
      );
    }

    return {
      html: responseText,
      status: response.status,
    };
  } catch (caughtError) {
    if (abortController.signal.aborted) {
      throw new UpstreamSearchHtmlError('Marketplace search request timed out.', 504);
    }

    if (caughtError instanceof UpstreamSearchHtmlError) {
      throw caughtError;
    }

    throw new UpstreamSearchHtmlError(
      caughtError instanceof Error
        ? caughtError.message
        : 'Marketplace search request failed.',
      502,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest) {
  try {
    const listingId = request.nextUrl.searchParams.get('listingId')?.trim();

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'listingId is required' },
        { status: 400 },
      );
    }

    const listingCacheEntry = await getListingCacheEntry<NormalizedMarketplaceListing>(listingId);

    if (!listingCacheEntry) {
      return NextResponse.json(
        {
          success: false,
          error: 'Listing not found in cache. Load /api/marketplace-listing first.',
        },
        { status: 404 },
      );
    }

    const listingPayload = listingCacheEntry.listingPayload;
    const searchUrl = buildMarketplaceSearchUrl({
      title: listingPayload.title,
      location: listingPayload.location,
      condition: listingPayload.condition,
      price: listingPayload.price,
    });

    const upstreamSearch = await fetchSearchHtml(searchUrl);
    const simpleListings = parseMarketplaceSearchHtml(upstreamSearch.html);

    if (simpleListings.length > 0) {
      const mergedPayload: NormalizedMarketplaceListing = {
        ...listingPayload,
        simpleListings,
      };

      await upsertListingCacheEntry<NormalizedMarketplaceListing>({
        listingId,
        normalizedUrl: listingCacheEntry.normalizedUrl,
        listingPayload: mergedPayload,
        computedAt: listingCacheEntry.computedAt,
      });
    }

    return NextResponse.json({
      success: true,
      simpleListings,
      raw: {
        source: 'facebook-search-html',
        searchUrl,
        upstreamStatus: upstreamSearch.status,
        count: simpleListings.length,
      },
    });
  } catch (caughtError) {
    if (caughtError instanceof UpstreamSearchHtmlError) {
      return NextResponse.json(
        {
          success: false,
          error: caughtError.message,
          details: caughtError.details,
        },
        { status: caughtError.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to parse marketplace search results.',
      },
      { status: 500 },
    );
  }
}
