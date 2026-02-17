"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';

export function Hero() {
  const [url, setUrl] = useState('');
  const router = useRouter();
  const parsedListing = parseFacebookMarketplaceListingUrl(url);
  const isValidListingUrl = parsedListing !== null;

  const handleAnalyze = () => {
    if (!parsedListing) return;

    const searchParams = new URLSearchParams({
      listingUrl: parsedListing.normalizedUrl,
      itemId: parsedListing.itemId,
    });

    router.push(`/dashboard?${searchParams.toString()}`);
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
                onKeyDown={(e) => e.key === 'Enter' && isValidListingUrl && handleAnalyze()}
                placeholder="Paste Facebook Marketplace listing URL"
                className="w-full px-8 py-6 text-lg font-['Space_Grotesk',sans-serif] font-semibold outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="relative inline-block group">
              <button
                onClick={handleAnalyze}
                disabled={!isValidListingUrl}
                className={`border-5 border-black px-12 py-6 text-2xl lg:text-3xl font-['Anton',sans-serif] uppercase shadow-[6px_6px_0px_0px_#000000] inline-flex items-center gap-4 rounded-xl transition-all ${
                  isValidListingUrl
                    ? 'bg-[#FADF0B] hover:shadow-[8px_8px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] cursor-pointer'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                Analyze Now
                <ChevronRight className="size-8" strokeWidth={3} />
              </button>

              {!isValidListingUrl && (
                <div className="pointer-events-none absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white border-4 border-black px-4 py-2 rounded-md shadow-[4px_4px_0px_0px_#000000]">
                    <p className="font-['Space_Grotesk',sans-serif] font-semibold text-sm text-black whitespace-nowrap">
                      Insert valid Facebook Marketplace listing
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
