"use client";

import { useEffect, useState } from 'react';
import type { SimilarListing } from '../(components)/SimilarListings';
import type { SimilarListingsApiResponse, SimilarListingsStatus } from '../types';
import { readJsonResponse } from '../utils/http';

const DEFAULT_RETRY_AFTER_MS = 2000;
const MAX_SIMILAR_POLL_MS = 30000;

interface UseSimilarListingsOptions {
  listingId: string | null;
  hasListing: boolean;
  isListingLoading: boolean;
}

interface UseSimilarListingsResult {
  listings: SimilarListing[] | null;
  status: SimilarListingsStatus | 'idle';
  warning: string;
  error: string;
  isLoading: boolean;
}

function parseRetryAfterMs(retryAfterHeader: string | null): number | null {
  if (!retryAfterHeader) {
    return null;
  }

  const parsedSeconds = Number(retryAfterHeader);

  if (!Number.isFinite(parsedSeconds) || parsedSeconds <= 0) {
    return null;
  }

  return Math.round(parsedSeconds * 1000);
}

/**
 * Polls async similar-listings endpoint until ready/stale/error or timeout.
 */
export function useSimilarListings({
  listingId,
  hasListing,
  isListingLoading,
}: UseSimilarListingsOptions): UseSimilarListingsResult {
  const [listings, setListings] = useState<SimilarListing[] | null>(null);
  const [status, setStatus] = useState<SimilarListingsStatus | 'idle'>('idle');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const shouldPoll = hasListing && Boolean(listingId) && !isListingLoading;

  useEffect(() => {
    if (!shouldPoll || !listingId) {
      return;
    }

    const abortController = new AbortController();
    let isMounted = true;
    const pollStartTime = Date.now();

    const sleepWithAbort = async (delayMs: number): Promise<void> =>
      await new Promise((resolve) => {
        const timeoutId = window.setTimeout(() => {
          resolve();
        }, delayMs);

        abortController.signal.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timeoutId);
            resolve();
          },
          { once: true },
        );
      });

    const pollSimilarListings = async () => {
      setListings(null);
      setStatus('pending');
      setWarning('');
      setError('');
      setIsLoading(true);

      while (!abortController.signal.aborted) {
        try {
          const query = new URLSearchParams({ listingId });
          const response = await fetch(`/api/similar-listings?${query.toString()}`, {
            method: 'GET',
            signal: abortController.signal,
            cache: 'no-store',
          });

          const { payload, rawText } = await readJsonResponse<SimilarListingsApiResponse>(response);

          if (!isMounted) {
            return;
          }

          if (
            response.ok &&
            payload?.success &&
            (payload.status === 'ready' || payload.status === 'stale')
          ) {
            setListings(Array.isArray(payload.similarListings) ? payload.similarListings : []);
            setStatus(payload.status);
            setWarning(payload.warning ?? '');
            setError('');
            setIsLoading(false);
            return;
          }

          if (payload?.success && payload.status === 'pending') {
            const elapsedMs = Date.now() - pollStartTime;

            if (elapsedMs >= MAX_SIMILAR_POLL_MS) {
              setListings(null);
              setStatus('error');
              setWarning('');
              setError('Similar-listings search timed out. Please try again.');
              setIsLoading(false);
              return;
            }

            const retryAfterMs =
              payload.retryAfterMs ??
              parseRetryAfterMs(response.headers.get('Retry-After')) ??
              DEFAULT_RETRY_AFTER_MS;

            await sleepWithAbort(retryAfterMs);
            continue;
          }

          console.error('Similar listings API returned error payload', {
            status: response.status,
            payload,
            rawTextPreview: rawText.slice(0, 500),
          });

          setListings(null);
          setStatus('error');
          setWarning('');
          setError(payload?.error ?? 'Failed to load similar listings.');
          setIsLoading(false);
          return;
        } catch (caughtError) {
          if (!isMounted || abortController.signal.aborted) {
            return;
          }

          console.error('Similar listings polling failed', { error: caughtError });

          setListings(null);
          setStatus('error');
          setWarning('');
          setError(
            caughtError instanceof Error && caughtError.message.trim().length > 0
              ? caughtError.message
              : 'Failed to load similar listings.',
          );
          setIsLoading(false);
          return;
        }
      }
    };

    pollSimilarListings().catch(() => {
      if (!isMounted) {
        return;
      }

      setListings(null);
      setStatus('error');
      setWarning('');
      setError('Failed to load similar listings.');
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [listingId, shouldPoll]);

  if (!shouldPoll) {
    return {
      listings: null,
      status: 'idle',
      warning: '',
      error: '',
      isLoading: false,
    };
  }

  return {
    listings,
    status,
    warning,
    error,
    isLoading,
  };
}
