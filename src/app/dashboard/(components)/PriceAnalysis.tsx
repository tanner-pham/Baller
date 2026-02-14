interface PricingAnalysisProps {
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
  const cardStyle =
    "border-4 border-black shadow-[6px_6px_0px_0px_#000000] transition-all duration-200 rounded-md";

  return (
    <div className="border-b-4 border-black bg-[#FADF0B] p-15">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 mx-auto w-full max-w-6xl items-center justify-between">
        <div className={`${cardStyle} bg-[#90EE90] p-8 text-center`}>
          <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
            Suggested Offer
          </h3>
          <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-3xl">
            ${suggestedOffer}
          </p>

        </div>

        <div className={`${cardStyle} bg-[#FF69B4] p-8 text-center`}>
          <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
            Model Accuracy
          </h3>
          <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-3xl">
            {modelAccuracy}%
          </p>
        </div>

        <div className={`${cardStyle} bg-[#FF6600] p-8 text-center`}>
          <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
            Market Value
          </h3>
          <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-3xl">
            ~{marketValue}
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
            <div className="bg-black text-white text-2xl w-16 h-16 flex items-center justify-center shrink-0 font-black rounded-md">
              {index + 1}
            </div>
            <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-base">
              {reason}
            </p>
          </div>
        ))}
      </div>

      {/* Negotiation Section */}
      <div className="flex flex-col md:flex-row items-stretch gap-6 mx-auto w-full max-w-6xl items-center justify-between">

        <button
          className={`${cardStyle} bg-[#3300FF] text-white px-10 text-lg font-['Anton',sans-serif] flex items-center justify-center hover:shadow-[8px_8px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all`}
        >
          Learn More
        </button>

        <div className="flex-1">
          <h3 className="font-['Anton',sans-serif] text-3xl mb-3 text-center text-black">
            NEGOTIATION TIP
          </h3>

          <div className={`${cardStyle} bg-white p-8 rounded-md`}>
            <p className="font-['Space_Grotesk',sans-serif] font-semibold text-gray-700 text-center text-base">
              {negotiationTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
