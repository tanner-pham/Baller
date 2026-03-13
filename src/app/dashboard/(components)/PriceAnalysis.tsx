import { pricingAnalysisStyles } from '../../consts';

export interface PricingAnalysisProps {
  suggestedOffer: string;
  modelAccuracy: string;
  marketValue: string;
  topReasons: string[];
  negotiationTip: string;
}

/**
 * Formats plain numeric strings into user-friendly currency/percent values.
 */
function formatStatValue(value: string, suffix: '$' | '%'): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return 'N/A';
  }

  if (!/^\d+([.,]\d+)?$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return suffix === '$' ? `$${trimmedValue}` : `${trimmedValue}%`;
}

export function PricingAnalysis({
  suggestedOffer,
  modelAccuracy,
  marketValue,
  topReasons,
  negotiationTip,
}: PricingAnalysisProps) {
  const suggestedOfferDisplay = formatStatValue(suggestedOffer, '$');
  const modelAccuracyDisplay = formatStatValue(modelAccuracy, '%');
  const marketValueDisplay = formatStatValue(marketValue, '$');

  return (
    <div className={pricingAnalysisStyles.section}>
      <div className={pricingAnalysisStyles.topGrid}>
          <div
            className={`${pricingAnalysisStyles.statCardBase} ${pricingAnalysisStyles.statValueRow} ${pricingAnalysisStyles.statBgSuggestedOffer}`}
          >
            <h3 className={pricingAnalysisStyles.statTitle}>
              Suggested Offer
            </h3>
            <p className={pricingAnalysisStyles.statValue}>
              {suggestedOfferDisplay}
            </p>
          </div>

          <div
            className={`${pricingAnalysisStyles.statCardBase} ${pricingAnalysisStyles.statValueRow} ${pricingAnalysisStyles.statBgModelAccuracy}`}
          >
            <h3 className={pricingAnalysisStyles.statTitle}>
              Model Accuracy
            </h3>
            <p className={pricingAnalysisStyles.statValue}>
              {modelAccuracyDisplay}
            </p>
          </div>

          <div
            className={`${pricingAnalysisStyles.statCardBase} ${pricingAnalysisStyles.statValueRow} ${pricingAnalysisStyles.statBgMarketValue}`}
            data-market-value={marketValue}
          >
            <h3 className={pricingAnalysisStyles.statTitle}>
              Market Value
            </h3>
            <p className={pricingAnalysisStyles.statValue}>
              {marketValueDisplay}
            </p>
          </div>
      </div>

      <h2 className={pricingAnalysisStyles.whyTitle}>WHY THIS PRICE?</h2>

      <div className={pricingAnalysisStyles.reasonsGrid}>
        {topReasons.map((reason, index) => (
          <div key={`${reason}-${index + 1}`} className={pricingAnalysisStyles.reasonCard}>
            <div className={pricingAnalysisStyles.reasonNumber}>
              {index + 1}
            </div>
            <p className={pricingAnalysisStyles.reasonText}>
              {reason}
            </p>
          </div>
        ))}
      </div>

      <div className={pricingAnalysisStyles.tipWrap}>
        <h3 className={pricingAnalysisStyles.tipTitle}>
          NEGOTIATION TIP
        </h3>

        <div className={pricingAnalysisStyles.tipCard}>
          <p className={pricingAnalysisStyles.tipText}>
            {negotiationTip}
          </p>
        </div>
      </div>
    </div>
  );
}
