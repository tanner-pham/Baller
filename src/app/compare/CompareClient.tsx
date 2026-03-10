'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import { useMarketplaceListing } from '../dashboard/hooks/useMarketplaceListing';
import { useConditionAssessment } from '../dashboard/hooks/useConditionAssessment';
import { ComparisonColumn } from './components/ComparisonColumn';
import { ColumnSkeleton } from './components/ColumnSkeleton';
import { DiffSummaryBanner } from './components/DiffSummaryBanner';
import { PriceComparison } from './components/PriceComparison';
import { ConditionComparison } from './components/ConditionComparison';
import { VerdictCard } from './components/VerdictCard';
import { computeMarketValue } from './utils/listingUtils';
import { generateRuleBasedProsConsForSide } from './utils/prosConsEngine';
import { computePriceDiff, computeConditionDiff } from './utils/diffUtils';
import { useCompareVerdict } from './hooks/useCompareVerdict';
import {
  compareStyles,
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

  // Verdict hook -- fires when both listings + assessments are ready
  const { verdict, isLoading: verdictLoading, error: verdictError } = useCompareVerdict({
    leftListing: leftListing ?? null,
    rightListing: rightListing ?? null,
    leftAssessment,
    rightAssessment,
    isReady: Boolean(leftIsReady && rightIsReady),
  });

  const [winnerSide, setWinnerSide] = useState<'left' | 'right' | null>(null);

  // Compute diffs for rule-based chips
  const priceDiff = computePriceDiff(leftListing?.price, rightListing?.price);
  const conditionDiff = computeConditionDiff(
    leftAssessment?.conditionScore, leftAssessment?.conditionLabel,
    rightAssessment?.conditionScore, rightAssessment?.conditionLabel,
  );

  // Rule-based chips (instant when both ready)
  const leftRuleChips = leftIsReady && rightIsReady
    ? generateRuleBasedProsConsForSide('left', priceDiff, conditionDiff, leftAssessment!, rightAssessment!, leftListing!, rightListing!)
    : [];
  const rightRuleChips = leftIsReady && rightIsReady
    ? generateRuleBasedProsConsForSide('right', priceDiff, conditionDiff, leftAssessment!, rightAssessment!, leftListing!, rightListing!)
    : [];

  // Combined chip arrays (rule-based + AI)
  const leftAllChips = [
    ...leftRuleChips,
    ...(verdict?.leftFeaturePros?.map(label => ({ label, type: 'pro' as const, source: 'ai' as const })) ?? []),
    ...(verdict?.leftFeatureCons?.map(label => ({ label, type: 'con' as const, source: 'ai' as const })) ?? []),
  ];
  const rightAllChips = [
    ...rightRuleChips,
    ...(verdict?.rightFeaturePros?.map(label => ({ label, type: 'pro' as const, source: 'ai' as const })) ?? []),
    ...(verdict?.rightFeatureCons?.map(label => ({ label, type: 'con' as const, source: 'ai' as const })) ?? []),
  ];

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
    <main className={compareStyles.main}>
      <div className={compareStyles.container}>
        {/* Breadcrumb */}
        <Link
          href={`/dashboard?listingUrl=${encodeURIComponent(leftUrl)}`}
          className={compareStyles.breadcrumb}
        >
          <ArrowLeft className={compareStyles.breadcrumbIcon} strokeWidth={3} />
          Back to Analysis
        </Link>

        {/* Same listing warning */}
        {isSameListing ? (
          <div className={compareStyles.sameListingCard}>
            <h2 className={compareStyles.sameListingTitle}>Same Listing</h2>
            <p className={compareStyles.sameListingBody}>
              You&apos;re comparing the same listing. Select a different listing to compare.
            </p>
          </div>
        ) : (
          <div className={compareStyles.contentCol}>
            {/* Diff Summary Banner — shown when both listings are loaded */}
            {leftIsReady && rightIsReady && (
              <DiffSummaryBanner
                leftListing={leftListing}
                rightListing={rightListing}
                leftAssessment={leftAssessment}
                rightAssessment={rightAssessment}
              />
            )}

            {/* Price Comparison row — shown when both listings are loaded */}
            {leftIsReady && rightIsReady && (
              <PriceComparison
                leftPrice={leftListing.price}
                rightPrice={rightListing.price}
              />
            )}

            {/* Condition Comparison row — shown when both listings are loaded */}
            {leftIsReady && rightIsReady && (
              <ConditionComparison
                leftScore={leftAssessment?.conditionScore}
                leftLabel={leftAssessment?.conditionLabel}
                rightScore={rightAssessment?.conditionScore}
                rightLabel={rightAssessment?.conditionLabel}
              />
            )}

            {/* Two-column grid */}
            <div className={compareStyles.grid}>
              {/* Left Column */}
              {leftHasError && !leftListing ? (
                <ErrorCard onRetry={() => window.location.reload()} />
              ) : leftIsReady ? (
                <ComparisonColumn
                  listing={leftListing}
                  assessment={leftAssessment}
                  marketValue={leftMarketValue}
                  side="left"
                  prosConsChips={leftAllChips}
                  isAiLoading={verdictLoading}
                  isWinner={winnerSide === 'left'}
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
                  prosConsChips={rightAllChips}
                  isAiLoading={verdictLoading}
                  isWinner={winnerSide === 'right'}
                />
              ) : (
                <ColumnSkeleton />
              )}
            </div>

            {/* Verdict Card -- shown when both listings loaded */}
            {leftIsReady && rightIsReady && (
              <VerdictCard
                verdict={verdict}
                isLoading={verdictLoading}
                error={verdictError}
                onReveal={setWinnerSide}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={compareStyles.errorCard}>
      <h3 className={compareStyles.errorTitle}>Unable to Load This Listing</h3>
      <p className={compareStyles.errorBody}>
        The listing could not be loaded. It may have been removed or is temporarily unavailable.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={compareStyles.errorRetryButton}
      >
        <RefreshCw className={compareStyles.errorRetryIcon} />
        Retry
      </button>
    </div>
  );
}
