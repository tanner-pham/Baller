'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import { useMarketplaceListing } from '../dashboard/hooks/useMarketplaceListing';
import { useConditionAssessment } from '../dashboard/hooks/useConditionAssessment';
import { ComparisonColumn } from './components/ComparisonColumn';
import { ColumnSkeleton } from './components/ColumnSkeleton';
import { computeMarketValue } from './utils/listingUtils';
import {
  anton,
  space,
  b5,
  shadow6,
  roundedXl,
} from '../consts';

export default function CompareClient() {
  const searchParams = useSearchParams();
  const leftUrl = searchParams.get('left') ?? '';
  const rightUrl = searchParams.get('right') ?? '';

  const leftParsed = useMemo(() => parseFacebookMarketplaceListingUrl(leftUrl), [leftUrl]);
  const rightParsed = useMemo(() => parseFacebookMarketplaceListingUrl(rightUrl), [rightUrl]);

  // Left pipeline
  const { listing: leftListing, isLoading: leftLoading, error: leftError } = useMarketplaceListing(leftParsed);
  const {
    assessment: leftAssessment,
    hasResolved: leftResolved,
    error: leftCondError,
  } = useConditionAssessment({
    listingId: leftParsed?.itemId ?? null,
    hasListing: Boolean(leftParsed),
    isListingLoading: leftLoading,
    listing: leftListing ? { ...leftListing, itemId: leftParsed?.itemId } : null,
  });

  // Right pipeline (independent, parallel)
  const { listing: rightListing, isLoading: rightLoading, error: rightError } = useMarketplaceListing(rightParsed);
  const {
    assessment: rightAssessment,
    hasResolved: rightResolved,
    error: rightCondError,
  } = useConditionAssessment({
    listingId: rightParsed?.itemId ?? null,
    hasListing: Boolean(rightParsed),
    isListingLoading: rightLoading,
    listing: rightListing ? { ...rightListing, itemId: rightParsed?.itemId } : null,
  });

  const leftIsReady = !leftLoading && leftResolved && leftListing;
  const rightIsReady = !rightLoading && rightResolved && rightListing;

  const leftHasError = leftError || (leftCondError && !leftLoading && leftResolved);
  const rightHasError = rightError || (rightCondError && !rightLoading && rightResolved);

  const leftMarketValue = computeMarketValue(
    leftListing?.price,
    leftListing?.similarListings,
  );
  const rightMarketValue = computeMarketValue(
    rightListing?.price,
    rightListing?.similarListings,
  );

  // Same listing check
  const isSameListing = leftUrl && rightUrl && leftUrl === rightUrl;

  return (
    <main className="min-h-screen bg-[#F5F5F0] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <Link
          href={`/dashboard?listingUrl=${encodeURIComponent(leftUrl)}`}
          className={`inline-flex items-center gap-2 mb-8 ${space} text-sm font-bold text-black hover:underline`}
        >
          <ArrowLeft className="size-4" strokeWidth={3} />
          Back to Analysis
        </Link>

        {/* Same listing warning */}
        {isSameListing ? (
          <div className={`bg-[#FADF0B] ${b5} ${roundedXl} ${shadow6} p-8 text-center`}>
            <h2 className={`${anton} text-2xl uppercase mb-2`}>Same Listing</h2>
            <p className={`${space} text-base font-semibold text-gray-700`}>
              You&apos;re comparing the same listing. Select a different listing to compare.
            </p>
          </div>
        ) : (
          /* Two-column grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            {leftHasError && !leftListing ? (
              <ErrorCard onRetry={() => window.location.reload()} />
            ) : leftIsReady ? (
              <ComparisonColumn
                listing={leftListing}
                assessment={leftAssessment}
                marketValue={leftMarketValue}
                side="left"
              />
            ) : (
              <ColumnSkeleton />
            )}

            {/* Right Column */}
            {rightHasError && !rightListing ? (
              <ErrorCard onRetry={() => window.location.reload()} />
            ) : rightIsReady ? (
              <ComparisonColumn
                listing={rightListing}
                assessment={rightAssessment}
                marketValue={rightMarketValue}
                side="right"
              />
            ) : (
              <ColumnSkeleton />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={`bg-white ${b5} ${roundedXl} ${shadow6} p-8 flex flex-col items-center justify-center gap-4 min-h-[300px]`}>
      <h3 className={`${anton} text-xl uppercase text-black`}>Unable to Load This Listing</h3>
      <p className={`${space} text-sm font-semibold text-gray-600 text-center`}>
        The listing could not be loaded. It may have been removed or is temporarily unavailable.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={`bg-[#FF6600] ${b5} ${roundedXl} px-6 py-3 ${shadow6} ${anton} text-base uppercase text-white inline-flex items-center gap-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all`}
      >
        <RefreshCw className="size-4" />
        Retry
      </button>
    </div>
  );
}
