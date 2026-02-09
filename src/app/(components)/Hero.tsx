"use client";

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export function Hero() {
  const [url, setUrl] = useState('');

  const handleAnalyze = () => {
    if (url) {
      alert(`Analyzing listing: ${url}`);
    }
  };

  return (
    <section id="hero" className="relative py-12 lg:py-16 bg-[#3300FF] border-b-5 border-black overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="font-['Bebas_Neue',sans-serif] text-7xl sm:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tight"
                style={{ 
                  textShadow: '6px 6px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000',
                  WebkitTextStroke: '3px black'
                }}>
              PRICE SMARTER,
              <br />
              BUY BETTER
            </h1>
            <p className="font-['Space_Grotesk',sans-serif] text-xl lg:text-2xl font-bold text-white max-w-3xl mx-auto">
              Marketplace insight for smarter pricing, safer deals, and better buying decisions. 
            </p>
          </div>

          {/* URL Input */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-white border-5 border-black shadow-[8px_8px_0px_0px_#000000] rounded-full overflow-hidden">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="Paste Facebook Marketplace listing URL"
                className="w-full px-8 py-6 text-lg font-['Space_Grotesk',sans-serif] font-semibold outline-none placeholder:text-gray-400"
              />
            </div>
            
            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              <button className="bg-white border-4 border-black px-6 py-3 rounded-full font-['Space_Grotesk',sans-serif] font-bold text-sm hover:bg-[#FADF0B] transition-colors shadow-[4px_4px_0px_0px_#000000]">
                Electronics
              </button>
              <button className="bg-white border-4 border-black px-6 py-3 rounded-full font-['Space_Grotesk',sans-serif] font-bold text-sm hover:bg-[#FF69B4] transition-colors shadow-[4px_4px_0px_0px_#000000]">
                Furniture
              </button>
              <button className="bg-white border-4 border-black px-6 py-3 rounded-full font-['Space_Grotesk',sans-serif] font-bold text-sm hover:bg-[#90EE90] transition-colors shadow-[4px_4px_0px_0px_#000000]">
                Vehicles
              </button>
              <button className="bg-white border-4 border-black px-6 py-3 rounded-full font-['Space_Grotesk',sans-serif] font-bold text-sm hover:bg-[#FF6600] transition-colors shadow-[4px_4px_0px_0px_#000000]">
                Clothing
              </button>
            </div>

            <button
              onClick={handleAnalyze}
              className="bg-[#FADF0B] border-5 border-black px-12 py-6 text-2xl lg:text-3xl font-['Anton',sans-serif] uppercase shadow-[6px_6px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all inline-flex items-center gap-4 rounded-xl"
            >
              Analyze Now
              <ChevronRight className="size-8" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
