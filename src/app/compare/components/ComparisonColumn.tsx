import type { MarketplaceListingApiData, ConditionAssessmentData } from '../../dashboard/types';
import { getFirstNonVideoImage } from '../../dashboard/utils/imageUtils';
import {
  anton,
  space,
  b5,
  shadow4,
  shadow6,
  roundedXl,
} from '../../consts';

export interface ComparisonColumnProps {
  listing: MarketplaceListingApiData;
  assessment: ConditionAssessmentData | null;
  marketValue: string;
  side: 'left' | 'right';
}

function getConditionColor(score: number): string {
  if (score >= 0.8) return 'bg-[#00FF00]';
  if (score >= 0.6) return 'bg-[#FADF0B]';
  if (score >= 0.4) return 'bg-[#FF6600]';
  return 'bg-[#FF0000]';
}

function formatStatValue(value: string | undefined, suffix: '$' | '%'): string {
  if (!value) return 'N/A';
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'N/A';
  if (!/^\d+([.,]\d+)?$/.test(trimmed)) return trimmed;
  return suffix === '$' ? `$${trimmed}` : `${trimmed}%`;
}

export function ComparisonColumn({ listing, assessment, marketValue, side }: ComparisonColumnProps) {
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
      className={`bg-white ${b5} ${roundedXl} ${shadow6} overflow-hidden flex flex-col`}
    >
      {/* Listing Image */}
      <div className={`w-full h-[200px] ${b5} ${roundedXl} overflow-hidden m-[-1px]`}>
        {displayImage ? (
          <img
            src={displayImage}
            alt={listing.title || 'Listing image'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className={`${space} text-sm font-semibold text-gray-400`}>No image</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Title */}
        <h2 className={`${anton} text-2xl uppercase text-black`}>
          {listing.title || 'Untitled Listing'}
        </h2>

        {/* Price Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`bg-[#FF69B4] ${b5} ${shadow4} px-4 py-2 ${roundedXl}`}>
            <span className={`${anton} text-xl text-black`}>{listing.price || 'N/A'}</span>
          </div>
        </div>

        {/* Condition Badge with Progress Bar */}
        {conditionScore !== undefined && conditionLabel && (
          <div data-testid="condition-badge" className={`${getConditionColor(conditionScore)} ${b5} ${shadow4} ${roundedXl} px-4 py-3`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`${space} text-sm font-bold uppercase`}>{conditionLabel}</span>
              <span className={`${space} text-sm font-semibold`}>{Math.round(conditionScore * 100)}%</span>
            </div>
            <div className={`h-3 w-full rounded-full bg-white/50 overflow-hidden border-2 border-black`}>
              <div
                className="h-full bg-black/30 transition-all duration-500"
                style={{ width: `${Math.round(conditionScore * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Row: Suggested Offer | Market Value | Model Accuracy */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`bg-[#90EE90] ${b5} ${roundedXl} p-3 text-center`}>
            <p className={`${anton} text-xs uppercase mb-1`}>Suggested Offer</p>
            <p className={`${space} text-sm font-bold`}>{suggestedOfferDisplay}</p>
          </div>
          <div className={`bg-[#FF69B4] ${b5} ${roundedXl} p-3 text-center`}>
            <p className={`${anton} text-xs uppercase mb-1`}>Market Value</p>
            <p className={`${space} text-sm font-bold`}>{marketValueDisplay}</p>
          </div>
          <div className={`bg-[#FF6600] ${b5} ${roundedXl} p-3 text-center`}>
            <p className={`${anton} text-xs uppercase mb-1`}>Accuracy</p>
            <p className={`${space} text-sm font-bold text-white`}>{modelAccuracyDisplay}</p>
          </div>
        </div>

        {/* Why This Price? */}
        {topReasons && topReasons.length > 0 && (
          <div>
            <h3 className={`${anton} text-lg uppercase text-black mb-2`}>Why This Price?</h3>
            <div className="flex flex-col gap-2">
              {topReasons.map((reason, index) => (
                <div key={`${reason}-${index + 1}`} className={`bg-white ${b5} ${roundedXl} p-3 flex items-center gap-3`}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg border-3 border-black bg-black text-white flex items-center justify-center text-sm font-black">
                    {index + 1}
                  </div>
                  <p className={`${space} text-sm font-semibold text-gray-700`}>{reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negotiation Tip */}
        {negotiationTip && (
          <div>
            <h3 className={`${anton} text-lg uppercase text-black mb-2`}>Negotiation Tip</h3>
            <div className={`bg-white ${b5} ${roundedXl} p-3`}>
              <p className={`${space} text-sm font-semibold text-gray-700`}>{negotiationTip}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
