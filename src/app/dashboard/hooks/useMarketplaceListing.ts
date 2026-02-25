"use client";

import { useEffect, useState } from 'react';
import type { FacebookMarketplaceListing } from '../../../lib/facebookMarketplaceListing';
import { LISTING_REQUEST_TIMEOUT_MS } from '../constants';
import type {
  MarketplaceListingApiData,
  MarketplaceListingApiResponse,
} from '../types';
import { readJsonResponse } from '../utils/http';

interface UseMarketplaceListingResult {
  listing: MarketplaceListingApiData | null;
  isLoading: boolean;
  error: string;
}

/**
 * Loads normalized listing data from the server API for a parsed marketplace URL.
 */
export function useMarketplaceListing(
  parsedListing: FacebookMarketplaceListing | null,
): UseMarketplaceListingResult {
  const [listing, setListing] = useState<MarketplaceListingApiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Derive stable primitive values so the effect fires only when the actual
  // listing identity changes, not when the parent happens to create a new
  // object reference with the same contents.
  const itemId = parsedListing?.itemId ?? null;
  const normalizedUrl = parsedListing?.normalizedUrl ?? null;

  useEffect(() => {
    if (!itemId || !normalizedUrl) {
      setListing(null);
      setError('');
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    let didTimeout = false;
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, LISTING_REQUEST_TIMEOUT_MS);

    /**
     * Fetches listing payload and records any transport/parsing failures for UI fallback.
     */
    const loadMarketplaceListing = async () => {
      setIsLoading(true);
      setError('');
      // Clear previous listing data immediately so UI cannot display stale cards while refetching.
      setListing(null);

      try {
        const queryParams = new URLSearchParams({
          itemId,
          listingUrl: normalizedUrl,
        });

        const response = await fetch(`/api/marketplace-listing?${queryParams.toString()}`, {
          method: 'GET',
          signal: abortController.signal,
          cache: 'no-store',
        });

        const { payload, rawText } = await readJsonResponse<MarketplaceListingApiResponse>(response);

        if (!isMounted) {
          return;
        }

        if (!response.ok || !payload?.success) {
          console.error('Marketplace listing API failed on dashboard', {
            responseOk: response.ok,
            status: response.status,
            payload,
            rawTextPreview: rawText.slice(0, 500),
          });
          setError(payload?.error ?? 'Failed to load listing information.');
          setListing(null);
          return;
        }

        if (!payload.listing) {
          setListing(null);
          return;
        }

        // Tag listing payload with the request item id so downstream hooks can reject mismatches.
        setListing({
          ...payload.listing,
          itemId,
        });
      } catch (caughtError) {
        if (!isMounted || (abortController.signal.aborted && !didTimeout)) {
          return;
        }

        console.error('Marketplace listing load failed:', caughtError);
        const message = didTimeout
          ? 'Listing request timed out. Please try again.'
          : caughtError instanceof Error
            ? caughtError.message
            : 'Failed to load listing information.';

        setError(message);
        setListing(null);
      } finally {
        window.clearTimeout(timeoutId);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMarketplaceListing().catch(() => {
      if (!isMounted) {
        return;
      }

      console.error('Marketplace listing load promise rejected unexpectedly');
      setIsLoading(false);
      setListing(null);
      setError('Failed to load listing information.');
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [itemId, normalizedUrl]);

  return {
    listing,
    isLoading,
    error,
  };
}
