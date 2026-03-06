"use client";

import { useEffect, useState } from 'react';
import { CONDITION_REQUEST_TIMEOUT_MS } from '../../dashboard/constants';
import type {
  ConditionAssessmentData,
  MarketplaceListingApiData,
} from '../../dashboard/types';
import type { CompareVerdictResponse, VerdictResult } from '../../api/compare-verdict/types';
import { readJsonResponse } from '../../dashboard/utils/http';

interface UseCompareVerdictOptions {
  leftListing: MarketplaceListingApiData | null;
  rightListing: MarketplaceListingApiData | null;
  leftAssessment: ConditionAssessmentData | null;
  rightAssessment: ConditionAssessmentData | null;
  isReady: boolean;
}

interface UseCompareVerdictResult {
  verdict: VerdictResult | null;
  isLoading: boolean;
  error: string;
}

function buildDescription(listing: MarketplaceListingApiData): string {
  return [listing.title, listing.price, listing.description]
    .filter(Boolean)
    .join(' | ');
}

function buildConditionData(assessment: ConditionAssessmentData | null) {
  if (!assessment) return undefined;
  return {
    conditionScore: assessment.conditionScore,
    conditionLabel: assessment.conditionLabel,
    topReasons: assessment.topReasons,
    suggestedOffer: assessment.suggestedOffer,
    negotiationTip: assessment.negotiationTip,
  };
}

export function useCompareVerdict({
  leftListing,
  rightListing,
  leftAssessment,
  rightAssessment,
  isReady,
}: UseCompareVerdictOptions): UseCompareVerdictResult {
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isReady || !leftListing || !rightListing) {
      setVerdict(null);
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
    }, CONDITION_REQUEST_TIMEOUT_MS);

    const fetchVerdict = async () => {
      setIsLoading(true);
      setError('');
      setVerdict(null);

      try {
        const response = await fetch('/api/compare-verdict', {
          method: 'POST',
          signal: abortController.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leftDescription: buildDescription(leftListing),
            rightDescription: buildDescription(rightListing),
            leftImageUrl: leftListing.images?.[0],
            rightImageUrl: rightListing.images?.[0],
            leftConditionData: buildConditionData(leftAssessment),
            rightConditionData: buildConditionData(rightAssessment),
            leftPrice: leftListing.price,
            rightPrice: rightListing.price,
            leftTitle: leftListing.title,
            rightTitle: rightListing.title,
          }),
        });

        const { payload, rawText } = await readJsonResponse<CompareVerdictResponse>(response);

        if (!isMounted) return;

        if (!response.ok || !payload?.success || !payload.verdict) {
          console.error('Compare verdict API failed', {
            responseOk: response.ok,
            status: response.status,
            payload,
            rawTextPreview: rawText.slice(0, 500),
          });
          setVerdict(null);
          setError(
            payload?.error ?? 'Verdict analysis is unavailable right now. Pros and cons based on listing data are still available above.',
          );
          return;
        }

        setVerdict(payload.verdict);
      } catch (caughtError) {
        if (!isMounted || (abortController.signal.aborted && !didTimeout)) {
          return;
        }

        console.error('Compare verdict load failed:', caughtError);
        setVerdict(null);

        if (didTimeout) {
          setError(
            'Verdict analysis timed out. Pros and cons based on listing data are still available above.',
          );
          return;
        }

        setError(
          caughtError instanceof Error && caughtError.message.trim().length > 0
            ? caughtError.message
            : 'Verdict analysis is unavailable right now. Pros and cons based on listing data are still available above.',
        );
      } finally {
        window.clearTimeout(timeoutId);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVerdict().catch(() => {
      if (!isMounted) return;
      setVerdict(null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [
    isReady,
    leftListing?.title,
    leftListing?.price,
    leftListing?.description,
    leftListing?.images,
    rightListing?.title,
    rightListing?.price,
    rightListing?.description,
    rightListing?.images,
    leftAssessment?.conditionScore,
    leftAssessment?.conditionLabel,
    rightAssessment?.conditionScore,
    rightAssessment?.conditionLabel,
  ]);

  return { verdict, isLoading, error };
}
