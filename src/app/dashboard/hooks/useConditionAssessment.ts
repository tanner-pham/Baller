"use client";

import { useEffect, useState } from 'react';
import { CONDITION_REQUEST_TIMEOUT_MS } from '../constants';
import type {
  ConditionAssessmentApiResponse,
  ConditionAssessmentData,
  MarketplaceListingApiData,
} from '../types';
import { readJsonResponse } from '../utils/http';

interface UseConditionAssessmentOptions {
  listingId: string | null;
  hasListing: boolean;
  isListingLoading: boolean;
  listing: MarketplaceListingApiData | null;
}

interface UseConditionAssessmentResult {
  assessment: ConditionAssessmentData | null;
  isLoading: boolean;
  hasResolved: boolean;
  error: string;
}

/**
 * Requests condition insights once listing media is available.
 */
export function useConditionAssessment({
  listingId,
  hasListing,
  isListingLoading,
  listing,
}: UseConditionAssessmentOptions): UseConditionAssessmentResult {
  const [assessment, setAssessment] = useState<ConditionAssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasResolved, setHasResolved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for listing fetch completion and ensure the payload matches the current listing id.
    if (
      !hasListing ||
      isListingLoading ||
      !listing?.images?.length ||
      (listingId && listing.itemId && listing.itemId !== listingId)
    ) {
      setAssessment(null);
      setError('');
      setIsLoading(false);
      setHasResolved(false);
      return;
    }

    const abortController = new AbortController();
    let didTimeout = false;
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, CONDITION_REQUEST_TIMEOUT_MS);

    /**
     * Calls the condition API and gracefully falls back when the model or network fails.
     */
    const analyzeCondition = async () => {
      setIsLoading(true);
      setError('');
      setAssessment(null);
      setHasResolved(false);

      try {
        const descriptionContext = [
          listing.title,
          listing.price ? `Listed price: ${listing.price}` : null,
          listing.description,
        ]
          .filter(Boolean)
          .join(' | ');

        const response = await fetch('/api/assess-condition', {
          method: 'POST',
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: listing.images?.[0], // TODO: consider multiple images in future iterations
            description: descriptionContext,
            listedPrice: listing.price,
            listingId,
            images: listing.images,
            postedTime: listing.postedTime,
          }),
        });

        const { payload, rawText } = await readJsonResponse<ConditionAssessmentApiResponse>(response);

        if (!isMounted || !response.ok || !payload?.success) {
          console.error('Condition assessment API failed on dashboard', {
            responseOk: response.ok,
            status: response.status,
            payload,
            rawTextPreview: rawText.slice(0, 500),
          });
          setAssessment(null);
          setHasResolved(true);
          setError(payload?.error ?? 'Condition analysis is unavailable right now. Please try again.');
          return;
        }

        setAssessment(payload.assessment ?? null);
        setHasResolved(true);
      } catch (caughtError) {
        if (!isMounted || (abortController.signal.aborted && !didTimeout)) {
          return;
        }

        console.error('Condition assessment load failed:', caughtError);
        setAssessment(null);
        setHasResolved(true);

        if (didTimeout) {
          setError(
            'Condition analysis timed out. Listing details loaded, but condition insights are temporarily unavailable.',
          );
          return;
        }

        setError(
          caughtError instanceof Error && caughtError.message.trim().length > 0
            ? caughtError.message
            : 'Condition analysis is unavailable right now. Please try again.',
        );
      } finally {
        window.clearTimeout(timeoutId);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    analyzeCondition().catch(() => {
      if (!isMounted) {
        return;
      }

      setAssessment(null);
      setIsLoading(false);
      setHasResolved(true);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [
    hasListing,
    isListingLoading,
    listing?.description,
    listing?.images,
    listing?.itemId,
    listing?.price,
    listing?.title,
    listingId,
  ]);

  return {
    assessment,
    isLoading,
    hasResolved,
    error,
  };
}
