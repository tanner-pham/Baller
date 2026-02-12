
interface PricingAnalysisProps {
  suggestedOffer: string;
  modelAccuracy: string;
  marketValue: string;
  topReasons: Array<String>;
  negotiationTip: string;
}

export function PricingAnalysis({
  suggestedOffer,
  modelAccuracy,
  marketValue,
  topReasons,
  negotiationTip,
}: PricingAnalysisProps) {
  return (
    <div className="bg-white p-8 border-8 border-black shadow-[4px_6px_0px_0px_#000000] max-w-6xl mx-auto">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Suggested Offer */}
        <div className="bg-[#90EE90] border-4 border-black shadow-[4px_6px_0px_0px_#000000] p-6 text-center transition-all duration-200 hover:brightness-90">
          <div className="text-xl mb-2 font-semibold">Suggested Offer</div>
          <div className="text-6xl font-black">${suggestedOffer}</div>
        </div>

        {/* Model Accuracy */}
        <div className="bg-[#FF69B4] border-4 border-black shadow-[4px_6px_0px_0px_#000000] p-6 text-center transition-all duration-200 hover:brightness-90">
          <div className="text-xl mb-2 font-semibold">Model Accuracy</div>
          <div className="text-6xl font-black">{modelAccuracy}%</div>
        </div>

        {/* Market Value */}
        <div className="bg-[#FF6600] border-4 border-black shadow-[4px_6px_0px_0px_#000000] p-6 text-center transition-all duration-200 hover:brightness-90">
          <div className="text-xl mb-2 font-semibold">Market Value</div>
          <div className="text-6xl font-black">~{marketValue}</div>
        </div>
      </div>

      {/* Why This Price Section */}
      <h2 className="text-3xl mb-6 font-black tracking-wide">WHY THIS PRICE?</h2>

      {/* Reason Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Reason 1 */}
        <div className="border-4 border-black bg-white shadow-[4px_6px_0px_0px_#000000] p-6 flex items-center gap-4 transition-all duration-200 hover:brightness-90">
          <div className="bg-black text-white text-2xl w-16 h-16 flex items-center justify-center shrink-0 font-black">
            1
          </div>
          <div className="text-base">
            <span className="font-semibold">{topReasons[0]}</span>         </div>
        </div>

        {/* Reason 2 */}
        <div className="border-4 border-black bg-white shadow-[4px_6px_0px_0px_#000000] p-6 flex items-center gap-4 transition-all duration-200 hover:brightness-90">
          <div className="bg-black text-white text-2xl w-16 h-16 flex items-center justify-center shrink-0 font-black">
            2
          </div>
          <div className="text-base">
            <span className="font-semibold">{topReasons[1]}</span> 
          </div>
        </div>

        {/* Reason 3 */}
        <div className="border-4 border-black bg-white shadow-[4px_6px_0px_0px_#000000] p-6 flex items-center gap-4 transition-all duration-200 hover:brightness-90">
          <div className="bg-black text-white text-2xl w-16 h-16 flex items-center justify-center shrink-0 font-black">
            3
          </div>
          <div className="text-base">
            <span className="font-semibold">{topReasons[2]}</span>
          </div>
        </div>

        {/* Reason 4 */}
        <div className="border-4 border-black bg-white shadow-[4px_6px_0px_0px_#000000] p-6 flex items-center gap-4 transition-all duration-200 hover:brightness-90">
          <div className="bg-black text-white text-2xl w-16 h-16 flex items-center justify-center shrink-0 font-black">
            4
          </div>
          <div className="text-base">
            <span className="font-semibold">{topReasons[3]}</span>
          </div>
        </div>
      </div>

      {/* Negotiation Tip */}
      <div className="flex items-stretch gap-4">
        {/* Learn More Button */}
        <button className="bg-[#3300FF] text-white border-4 border-black shadow-[4px_6px_0px_0px_#000000] px-8 font-black text-lg hover:brightness-90 transition-all duration-200 active:translate-y-1 flex items-center justify-center shrink-0">
          Learn More
        </button>
        
        {/* Tip Content */}
        <div className="flex-1">
          <h3 className="text-3xl mb-2 font-black tracking-wide">NEGOTIATION TIP</h3>
          <div className="bg-[#FADF0B] border-4 border-black shadow-[4px_6px_0px_0px_#000000] p-6 transition-all duration-200 hover:brightness-90">
            <p className="text-base">
              <span className="font-semibold">{negotiationTip}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
