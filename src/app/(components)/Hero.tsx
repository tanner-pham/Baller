"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import {
  landingPageHeader,
  landingPagesubText,
  landingPageHeroSection,
  landingPageHeroContainer,
  landingPageHeroInner,
  landingPageHeroHeadlineGroup,
  landingPageHeroInputGroup,
  landingPageHeroInputShell,
  landingPageHeroInput,
  landingPageHeroAnalyzeButtonBase,
  landingPageHeroAnalyzeButtonEnabled,
  landingPageHeroAnalyzeButtonDisabled,
  landingPageHeroChevronIcon,
  landingPageHeroButtonWrap,
  landingPageHeroTooltipPos,
  landingPageHeroTooltipBox,
  landingPageHeroTooltipText,
  textShadowStyle,
} from '../consts';

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
    <section id="hero" className={landingPageHeroSection}>
      <div className={landingPageHeroContainer}>
        <div className={landingPageHeroInner}>
          {/* Main Headline */}
          <div className={landingPageHeroHeadlineGroup}>
            <h1
              className={landingPageHeader}
              style={textShadowStyle}
            >
              PRICE SMARTER,
              <br />
              BUY BETTER
            </h1>
            <p className={landingPagesubText}>
              Marketplace insight for smarter pricing, safer deals, and better buying decisions. 
            </p>
          </div>

          {/* URL Input */}
          <div className={landingPageHeroInputGroup}>
            <div className={landingPageHeroInputShell}>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && isValidListingUrl && handleAnalyze()}
                placeholder="Paste Facebook Marketplace listing URL"
                className={landingPageHeroInput}
              />
            </div>

            <div className={landingPageHeroButtonWrap}>
              <button
                onClick={handleAnalyze}
                disabled={!isValidListingUrl}
                className={`${landingPageHeroAnalyzeButtonBase} ${
                  isValidListingUrl
                    ? landingPageHeroAnalyzeButtonEnabled
                    : landingPageHeroAnalyzeButtonDisabled
                }`}
              >
                Analyze Now
                <ChevronRight className={landingPageHeroChevronIcon} strokeWidth={3} />
              </button>

              {!isValidListingUrl && (
                <div className={landingPageHeroTooltipPos}>
                  <div className={landingPageHeroTooltipBox}>
                    <p className={landingPageHeroTooltipText}>
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
