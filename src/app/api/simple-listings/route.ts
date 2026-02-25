import { NextRequest, NextResponse } from 'next/server';
import {
  buildMarketplaceSearchUrl,
  looksLikeFacebookAuthWall,
  parseMarketplaceSearchHtml,
} from '../marketplace-listing/parseHtml';
import type { NormalizedMarketplaceListing } from '../marketplace-listing/types';
import {
  fetchMarketplaceHtmlWithFallback,
  MarketplaceHtmlFetchError,
} from '../../../lib/server/facebookMarketplaceHtmlFetcher';
import {
  getListingCacheEntry,
  upsertListingCacheEntry,
} from '../../../lib/server/listingCacheRepository';

const DEFAULT_SEARCH_FETCH_TIMEOUT_MS = 15000;

function getPositiveIntEnv(name: string): number | null {
  const rawValue = process.env[name];

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export const runtime = 'nodejs';

function looksLikeFacebookGenericErrorPage(html: string): boolean {
  const normalizedHtml = html.toLowerCase();

  return (
    normalizedHtml.includes('<title>error</title>') &&
    normalizedHtml.includes('sorry, something went wrong')
  );
}

function buildSearchFetchCandidates(searchUrl: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const pushCandidate = (value: string | null | undefined): void => {
    const trimmed = value?.trim();

    if (!trimmed || seen.has(trimmed)) {
      return;
    }

    seen.add(trimmed);
    candidates.push(trimmed);
  };

  pushCandidate(searchUrl);

  try {
    const parsedUrl = new URL(searchUrl);
    parsedUrl.hash = '';
    pushCandidate(parsedUrl.toString());

    if (parsedUrl.hostname === 'www.facebook.com') {
      const mobileVariant = new URL(parsedUrl.toString());
      mobileVariant.hostname = 'm.facebook.com';
      pushCandidate(mobileVariant.toString());
    }
  } catch {
    // No-op: malformed URL candidate already handled by caller validations.
  }

  return candidates;
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

    const upstreamSearch = await fetchMarketplaceHtmlWithFallback({
      urls: buildSearchFetchCandidates(searchUrl),
      referer: 'https://www.facebook.com/marketplace/',
      bootstrapUrl: 'https://www.facebook.com/marketplace/',
      timeoutMs:
        getPositiveIntEnv('MARKETPLACE_HTML_TIMEOUT_MS') ??
        DEFAULT_SEARCH_FETCH_TIMEOUT_MS,
      validators: [
        (html) =>
          looksLikeFacebookGenericErrorPage(html)
            ? {
                reason: 'Marketplace search fetch returned a Facebook generic error page.',
                status: 502,
                details: html,
              }
            : null,
        (html) =>
          looksLikeFacebookAuthWall(html)
            ? {
                reason: 'Marketplace search returned Facebook login/interstitial content.',
                status: 502,
              }
            : null,
      ],
    });

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
        sourceUrl: upstreamSearch.sourceUrl,
        attemptedUrls: upstreamSearch.attemptedUrls,
        attempts: upstreamSearch.attempts,
        transport: upstreamSearch.transport,
        usedBootstrapCookies: upstreamSearch.usedBootstrapCookies,
        usedPlaywrightBootstrap: upstreamSearch.usedPlaywrightBootstrap,
        playwrightConnectionMode: upstreamSearch.playwrightConnectionMode,
        count: simpleListings.length,
      },
    });
  } catch (caughtError) {
    if (caughtError instanceof MarketplaceHtmlFetchError) {
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
