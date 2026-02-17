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

  const cardStyle =
    'rounded-xl border-5 border-black shadow-[6px_6px_0px_0px_#000000] transition-all duration-200 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';

  return (
    <div className="border-b-4 border-black bg-[#FADF0B] p-15">
      <div className="mx-auto mb-12 grid w-full max-w-6xl grid-cols-1 items-center justify-between gap-8 md:grid-cols-3">
        <div
          className={`${cardStyle} flex min-h-[180px] flex-col justify-center bg-[#90EE90] p-8 text-center`}
        >
          <h3 className="mb-3 text-center text-3xl text-black font-['Anton',sans-serif]">
            Suggested Offer
          </h3>
          <p className="text-center text-3xl font-semibold text-gray-700 font-['Space_Grotesk',sans-serif]">
            {suggestedOfferDisplay}
          </p>
        </div>

        <div
          className={`${cardStyle} flex min-h-[180px] flex-col justify-center bg-[#FF69B4] p-8 text-center`}
        >
          <h3 className="mb-3 text-center text-3xl text-black font-['Anton',sans-serif]">
            Model Accuracy
          </h3>
          <p className="text-center text-3xl font-semibold text-gray-700 font-['Space_Grotesk',sans-serif]">
            {modelAccuracyDisplay}
          </p>
        </div>

        <div
          className={`${cardStyle} flex min-h-[180px] flex-col justify-center bg-[#FF6600] p-8 text-center`}
          data-market-value={marketValue}
        >
          <h3 className="mb-3 text-center text-3xl text-black font-['Anton',sans-serif]">
            Market Value
          </h3>
          <p className="text-center text-3xl font-semibold text-gray-700 font-['Space_Grotesk',sans-serif]">
            {marketValueDisplay}
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-center text-3xl text-black font-['Anton',sans-serif]">WHY THIS PRICE?</h2>

      <div className="mx-auto mb-12 grid w-full max-w-6xl grid-cols-1 items-center justify-between gap-8 md:grid-cols-2">
        {topReasons.map((reason, index) => (
          <div key={`${reason}-${index + 1}`} className={`${cardStyle} flex items-center gap-6 bg-white p-6`}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-4 border-black bg-black text-2xl font-black text-white">
              {index + 1}
            </div>
            <p className="text-center text-base font-semibold text-gray-700 font-['Space_Grotesk',sans-serif]">
              {reason}
            </p>
          </div>
        ))}
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <h3 className="mb-3 text-center text-3xl text-black font-['Anton',sans-serif]">
          NEGOTIATION TIP
        </h3>

        <div className={`${cardStyle} bg-white p-8`}>
          <p className="text-center text-base font-semibold text-gray-700 font-['Space_Grotesk',sans-serif]">
            {negotiationTip}
          </p>
        </div>
      </div>
    </div>
  );
}
