import { ChevronRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section id="learn-more" className="relative py-20 lg:py-32 bg-[#FADF0B] border-b-5 border-black overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Card Container */}
          <div className="bg-white border-5 border-black p-12 lg:p-16 shadow-[10px_10px_0px_0px_#000000] rounded-3xl text-center">
            <h2 className="font-['Anton',sans-serif] text-5xl lg:text-6xl mb-6 leading-tight text-black">
              START MAKING SMARTER MARKETPLACE DECISIONS
            </h2>
            
            <p className="font-['Space_Grotesk',sans-serif] text-xl lg:text-2xl font-bold mb-10 text-gray-700">
              Join the movement of smart shoppers who never overpay
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-[#3300FF] text-white border-5 border-black px-10 py-5 text-xl lg:text-2xl font-['Anton',sans-serif] uppercase shadow-[6px_6px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all inline-flex items-center gap-3 rounded-xl">
                Get Started
                <ChevronRight className="size-7" strokeWidth={3} />
              </button>
              
              <button className="bg-white text-black border-5 border-black px-10 py-5 text-xl lg:text-2xl font-['Anton',sans-serif] uppercase shadow-[6px_6px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all rounded-xl">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}