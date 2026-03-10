import type { MarketplaceListingApiData, ConditionAssessmentData } from '../../dashboard/types';
import type { ProConChip } from '../utils/prosConsEngine';
import { getFirstNonVideoImage } from '../../dashboard/utils/imageUtils';
import { ProsCons } from './ProsCons';
import {
  b5,
  comparisonColumnStyles,
  conditionBgExcellent,
  conditionBgGood,
  conditionBgFair,
  conditionBgPoor,
} from '../../consts';

export interface ComparisonColumnProps {
  listing: MarketplaceListingApiData;
  assessment: ConditionAssessmentData | null;
  marketValue: string;
  side: 'left' | 'right';
  prosConsChips?: ProConChip[];
  isAiLoading?: boolean;
  isWinner?: boolean;
}

function getConditionColor(score: number): string {
  if (score >= 0.8) return conditionBgExcellent;
  if (score >= 0.6) return conditionBgGood;
  if (score >= 0.4) return conditionBgFair;
  return conditionBgPoor;
}

function formatStatValue(value: string | undefined, suffix: '$' | '%'): string {
  if (!value) return 'N/A';
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'N/A';
  if (!/^\d+([.,]\d+)?$/.test(trimmed)) return trimmed;
  return suffix === '$' ? `$${trimmed}` : `${trimmed}%`;
}

export function ComparisonColumn({ listing, assessment, marketValue, side, prosConsChips, isAiLoading, isWinner }: ComparisonColumnProps) {
  const displayImage = getFirstNonVideoImage(listing.images) || '';
  const conditionScore = assessment?.conditionScore;
  const conditionLabel = assessment?.conditionLabel;
  const topReasons = assessment?.topReasons;
  const negotiationTip = assessment?.negotiationTip;
  const suggestedOffer = assessment?.suggestedOffer;
  const modelAccuracy = assessment?.modelAccuracy;

  const suggestedOfferDisplay = formatStatValue(suggestedOffer, '$');
  const modelAccuracyDisplay = formatStatValue(modelAccuracy, '%');
  const marketValueDisplay = formatStatValue(marketValue, '$');

  return (
    <div
      data-testid={`comparison-column-${side}`}
      className={`${comparisonColumnStyles.rootBase} ${
        isWinner ? comparisonColumnStyles.rootWinner : b5
      }`}
    >
      {/* Listing Image */}
      {/* eslint-disable @next/next/no-img-element -- external Facebook CDN URLs */}
      <div className={comparisonColumnStyles.imageShell}>
        {displayImage ? (
          <img
            src={displayImage}
            alt={listing.title || 'Listing image'}
            referrerPolicy="no-referrer"
            className={comparisonColumnStyles.image}
          />
        ) : (
          <div className={comparisonColumnStyles.imageFallback}>
            <span className={comparisonColumnStyles.imageFallbackText}>No image</span>
          </div>
        )}
      </div>
      {/* eslint-enable @next/next/no-img-element */}

      <div className={comparisonColumnStyles.body}>
        {/* Title */}
        <h2 className={comparisonColumnStyles.title}>
          {listing.title || 'Untitled Listing'}
        </h2>

        {/* Price Badge */}
        <div className={comparisonColumnStyles.priceRow}>
          <div className={comparisonColumnStyles.priceBadge}>
            <span className={comparisonColumnStyles.priceText}>{listing.price || 'N/A'}</span>
          </div>
        </div>

        {/* Condition Badge with Progress Bar */}
        {conditionScore !== undefined && conditionLabel && (
          <div data-testid="condition-badge" className={`${comparisonColumnStyles.conditionBadge} ${getConditionColor(conditionScore)}`}>
            <div className={comparisonColumnStyles.conditionHeaderRow}>
              <span className={comparisonColumnStyles.conditionLabel}>{conditionLabel}</span>
              <span className={comparisonColumnStyles.conditionPct}>{Math.round(conditionScore * 100)}%</span>
            </div>
            <div className={comparisonColumnStyles.conditionBar}>
              <div
                className={comparisonColumnStyles.conditionBarFill}
                style={{ width: `${Math.round(conditionScore * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Pros and Cons Chips */}
        <ProsCons
          ruleBasedChips={(prosConsChips ?? []).filter(c => c.source === 'rule')}
          aiChips={(prosConsChips ?? []).filter(c => c.source === 'ai')}
          isAiLoading={isAiLoading ?? false}
        />

        {/* Stats Row: Suggested Offer | Market Value | Model Accuracy */}
        <div className={comparisonColumnStyles.statsGrid}>
          <div className={`${comparisonColumnStyles.statCardBase} ${comparisonColumnStyles.statBgSuggestedOffer}`}>
            <p className={comparisonColumnStyles.statLabel}>Suggested Offer</p>
            <p className={comparisonColumnStyles.statValue}>{suggestedOfferDisplay}</p>
          </div>
          <div className={`${comparisonColumnStyles.statCardBase} ${comparisonColumnStyles.statBgMarketValue}`}>
            <p className={comparisonColumnStyles.statLabel}>Market Value</p>
            <p className={comparisonColumnStyles.statValue}>{marketValueDisplay}</p>
          </div>
          <div className={`${comparisonColumnStyles.statCardBase} ${comparisonColumnStyles.statBgAccuracy}`}>
            <p className={comparisonColumnStyles.statLabel}>Accuracy</p>
            <p className={comparisonColumnStyles.statValueWhite}>{modelAccuracyDisplay}</p>
          </div>
        </div>

        {/* Why This Price? */}
        {topReasons && topReasons.length > 0 && (
          <div>
            <h3 className={comparisonColumnStyles.sectionTitle}>Why This Price?</h3>
            <div className={comparisonColumnStyles.reasonsCol}>
              {topReasons.map((reason, index) => (
                <div key={`${reason}-${index + 1}`} className={comparisonColumnStyles.reasonCard}>
                  <div className={comparisonColumnStyles.reasonNumber}>
                    {index + 1}
                  </div>
                  <p className={comparisonColumnStyles.reasonText}>{reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negotiation Tip */}
        {negotiationTip && (
          <div>
            <h3 className={comparisonColumnStyles.sectionTitle}>Negotiation Tip</h3>
            <div className={comparisonColumnStyles.tipCard}>
              <p className={comparisonColumnStyles.tipText}>{negotiationTip}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
