import type { MarketplaceListingApiData, ConditionAssessmentData } from '../../dashboard/types';
import { computePriceDiff, computeConditionDiff } from '../utils/diffUtils';
import { diffSummaryStyles } from '../../consts';

interface DiffSummaryBannerProps {
  leftListing: MarketplaceListingApiData;
  rightListing: MarketplaceListingApiData;
  leftAssessment: ConditionAssessmentData | null;
  rightAssessment: ConditionAssessmentData | null;
}

export function DiffSummaryBanner({
  leftListing,
  rightListing,
  leftAssessment,
  rightAssessment,
}: DiffSummaryBannerProps) {
  const priceDiff = computePriceDiff(leftListing.price, rightListing.price);
  const conditionDiff = computeConditionDiff(
    leftAssessment?.conditionScore,
    leftAssessment?.conditionLabel,
    rightAssessment?.conditionScore,
    rightAssessment?.conditionLabel,
  );

  const hasPriceData = priceDiff.leftPrice !== null && priceDiff.rightPrice !== null;
  const hasConditionData = conditionDiff.leftLabel !== null && conditionDiff.rightLabel !== null;

  // Nothing to show
  if (!hasPriceData && !hasConditionData) return null;

  return (
    <div className={diffSummaryStyles.root}>
      <h3 className={diffSummaryStyles.title}>At a Glance</h3>

      <div className={diffSummaryStyles.chipRow}>
        {/* Price chip */}
        {hasPriceData && (
          priceDiff.cheaperSide === 'equal' ? (
            <div className={diffSummaryStyles.priceChip}>
              <span className={diffSummaryStyles.chipText}>Same price</span>
            </div>
          ) : (
            <div className={diffSummaryStyles.priceChip}>
              <span className={diffSummaryStyles.chipText}>
                ${priceDiff.difference!.toLocaleString()} price difference
              </span>
            </div>
          )
        )}

        {/* Condition chip */}
        {hasConditionData && (
          conditionDiff.leftLabel === conditionDiff.rightLabel ? (
            <div className={diffSummaryStyles.conditionChip}>
              <span className={diffSummaryStyles.chipText}>Same condition</span>
            </div>
          ) : (
            <div className={diffSummaryStyles.conditionChip}>
              <span className={diffSummaryStyles.chipText}>
                Condition: {conditionDiff.leftLabel} vs {conditionDiff.rightLabel}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
