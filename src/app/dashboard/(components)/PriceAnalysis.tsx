export interface PricingAnalysisProps {
  suggestedOffer: string;
  modelAccuracy: string;
  marketValue: string;
  topReasons: Array<string>;
  negotiationTip: string;
}

export function PricingAnalysis({
  suggestedOffer,
  modelAccuracy,
  marketValue,
  topReasons,
  negotiationTip,
}: PricingAnalysisProps) {
  const trimmedSuggestedOffer = suggestedOffer.trim();
  const trimmedModelAccuracy = modelAccuracy.trim();
  const suggestedOfferDisplay =
    trimmedSuggestedOffer.length === 0
      ? 'N/A'
      : /^\d+([.,]\d+)?$/.test(trimmedSuggestedOffer)
        ? `$${trimmedSuggestedOffer}`
        : trimmedSuggestedOffer;
  const modelAccuracyDisplay =
    trimmedModelAccuracy.length === 0
      ? 'N/A'
      : /^\d+([.,]\d+)?$/.test(trimmedModelAccuracy)
        ? `${trimmedModelAccuracy}%`
        : trimmedModelAccuracy;

  const cardStyle =
    "rounded-xl border-5 border-black shadow-[6px_6px_0px_0px_#000000] transition-all duration-200 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none";

  return (
    <div className="border-b-4 border-black bg-[#FADF0B] p-15">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 mx-auto w-full max-w-6xl items-center justify-between">
        <div className={`${cardStyle} bg-[#90EE90] p-8 text-center min-h-[180px] flex flex-col justify-center`}>
          <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
            Suggested Offer
          </h3>
          <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-3xl">
            {suggestedOfferDisplay}
          </p>

        </div>

        <div className={`${cardStyle} bg-[#FF69B4] p-8 text-center min-h-[180px] flex flex-col justify-center`}>
          <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
            Model Accuracy
          </h3>
          <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-3xl">
            {modelAccuracyDisplay}
          </p>
        </div>

        <div
          className={`${cardStyle} bg-[#FF6600] p-8 text-center min-h-[180px] flex flex-col justify-center`}
          data-market-value={marketValue}
        >
          <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
            Market Value
          </h3>
          <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-3xl">
            (Upcoming Release)
          </p>
        </div>
      </div>

      {/* Why This Price */}
      <h2 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
        WHY THIS PRICE?
      </h2>

      {/* Reason Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 mx-auto w-full max-w-6xl items-center justify-between">
        {topReasons.map((reason, index) => (
          <div
            key={index}
            className={`${cardStyle} bg-white p-6 flex items-center gap-6`}
          >
            <div className="bg-black text-white text-2xl w-16 h-16 flex items-center justify-center shrink-0 font-black rounded-xl border-4 border-black">
              {index + 1}
            </div>
            <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-base">
              {reason}
            </p>
          </div>
        ))}
      </div>

      {/* Negotiation Section */}
      <div className="mx-auto w-full max-w-6xl">
        <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
          NEGOTIATION TIP
        </h3>

        <div className={`${cardStyle} bg-white p-8`}>
          <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-base">
            {negotiationTip}
          </p>
        </div>
      </div>
    </div>
  );
}
