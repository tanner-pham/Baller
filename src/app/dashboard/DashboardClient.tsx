"use client";

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { SimilarListings } from './(components)/SimilarListings';
import { CurrentListing } from './(components)/CurrentListing';
import { PricingAnalysis } from './(components)/PriceAnalysis';
import { Navigation } from '../(components)/Navigation';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';

import {
  sectionBorderB4P15,
  maxW6Full,
  b4,
  b5,
  roundedXl,
  shadow4,
  shadow6,
  shadow8,
  anton,
  space,
} from '../consts';

import {
  DEFAULT_CURRENT_LISTING,
} from './constants';
import { useConditionAssessment } from './hooks/useConditionAssessment';
import { useDashboardSession } from './hooks/useDashboardSession';
import { useMarketplaceListing } from './hooks/useMarketplaceListing';
import { useSearchHistory } from './hooks/useSearchHistory';
import type { SearchHistoryEntry } from './types';
import { getFirstNonVideoImage } from './utils/imageUtils';

/**
 * Parses a price string like "$650" or "$1,200" to a number.
 */
function parsePriceToNumber(price: string | undefined): number | null {
  if (!price) return null;
  const num = Number(price.replace(/[^\d.]/g, ''));
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Computes the average market value from the listing price and similar listings.
 */
function computeMarketValue(
  listingPrice: string | undefined,
  similarListings: Array<{ price: number }> | undefined,
): string {
  const prices: number[] = [];
  const listingNum = parsePriceToNumber(listingPrice);
  if (listingNum) prices.push(listingNum);

  if (similarListings) {
    for (const sl of similarListings) {
      if (sl.price > 0) prices.push(sl.price);
    }
  }

  if (prices.length === 0) return listingPrice ?? 'N/A';

  const avg = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
  return `$${avg.toLocaleString()}`;
}

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const listingUrlParam = searchParams.get('listingUrl') ?? '';

  const parsedListing = useMemo(
    () => parseFacebookMarketplaceListingUrl(listingUrlParam),
    [listingUrlParam],
  );

  const { isAuthenticated, userId } = useDashboardSession();
  const { listing: marketplaceListing, isLoading: isListingLoading } = useMarketplaceListing(parsedListing);

  const activeMarketplaceListing =
    marketplaceListing && parsedListing && marketplaceListing.itemId === parsedListing.itemId
      ? marketplaceListing
      : null;

  const {
    assessment: conditionAssessment,
    isLoading: isConditionLoading,
    hasResolved: hasConditionResolved,
  } = useConditionAssessment({
    listingId: parsedListing?.itemId ?? null,
    hasListing: Boolean(parsedListing),
    isListingLoading,
    listing: activeMarketplaceListing,
  });

  const { searchHistory } = useSearchHistory({
    userId,
    parsedListing,
    listingTitle: activeMarketplaceListing?.title,
  });


  const displayTitle = activeMarketplaceListing?.title || searchParams.get('title') || "Marketplace Listing";
  const displayPrice = activeMarketplaceListing?.price || searchParams.get('price') || "Price Hidden";
  // Issue 7: Skip video primary images, use next available photo
  const displayImage = getFirstNonVideoImage(activeMarketplaceListing?.images) || searchParams.get('image') || DEFAULT_CURRENT_LISTING.image;

  const handleSelectPreviousSearch = (entry: SearchHistoryEntry) => {
    const searchQuery = new URLSearchParams({ listingUrl: entry.url, itemId: entry.itemId });
    router.push(`/dashboard?${searchQuery.toString()}`);
  };

  // Issue 1: Trigger sign-in popup when unauthed user tries to search
  const handleUnauthSearchAttempt = () => {
    setShowSignInPopup(true);
  };

  const isDashboardLoading = isListingLoading || isConditionLoading || (parsedListing && !hasConditionResolved);
  const shouldShowEmptyState = !parsedListing && !isDashboardLoading;

  // Issue 4: Market value = average of listing price + similar listings prices
  const marketValue = computeMarketValue(
    activeMarketplaceListing?.price,
    activeMarketplaceListing?.similarListings,
  );

  return (
    <main className="size-full overflow-y-auto bg-[#F5F5F0]">
      {/* Issue 6: Removed sidebar toggle props, added onUnauthSearchAttempt */}
      <Navigation
        dashboardNav
        onUnauthSearchAttempt={handleUnauthSearchAttempt}
      />

      {/* Issue 1: Sign-in popup overlay */}
      {showSignInPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`relative bg-white ${b5} ${roundedXl} p-10 ${shadow8} max-w-md w-full mx-4`}>
            <button
              type="button"
              onClick={() => setShowSignInPopup(false)}
              className="absolute top-4 right-4 rounded-md border-2 border-black p-1 transition-all hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="size-5" strokeWidth={2.5} />
            </button>

            <h2 className={`${anton} text-4xl uppercase text-black mb-4 text-center`}>
              SIGN IN REQUIRED
            </h2>
            <p className={`${space} text-base font-semibold text-gray-600 mb-8 text-center`}>
              Create an account or sign in to search additional listings and unlock full analysis features.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push('/auth')}
                className={`w-full ${roundedXl} ${b5} bg-[#FADF0B] px-6 py-4 ${shadow6} ${anton} text-xl uppercase text-black transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`}
              >
                Log In / Sign Up
              </button>
              <button
                type="button"
                onClick={() => setShowSignInPopup(false)}
                className={`w-full ${roundedXl} border-4 border-black bg-white px-6 py-3 ${space} text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50`}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {isDashboardLoading ? (
        <div className={`p-20 text-center ${anton} uppercase text-3xl animate-pulse`}>
          Analyzing Listing...
        </div>
      ) : (
        <>
          {/* Issue 2: Only show Previous Listings for authenticated users */}
          {isAuthenticated && (
            <section className={`${sectionBorderB4P15} bg-[#90EE90]`}>
              <div className={maxW6Full}>
                <div className={`bg-white ${b5} ${roundedXl} p-10 ${shadow8}`}>
                  <h2 className={`${anton} text-5xl uppercase text-black mb-8`}>
                    Previous Listings
                  </h2>

                  {searchHistory.length === 0 ? (
                    <p className={`${space} text-lg font-semibold text-black/60`}>
                      No listings analyzed yet.
                    </p>
                  ) : (
                    /* Issue 5: Horizontal scroll for all search history entries */
                    <div className="relative">
                      <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto no-scrollbar">
                        {searchHistory.map((entry) => (
                          <button
                            key={`${entry.url}-${entry.searchedAt}`}
                            onClick={() => handleSelectPreviousSearch(entry)}
                            className={`min-w-[280px] max-w-[320px] flex-shrink-0 snap-start rounded-xl ${b5} bg-[#FF69B4] p-6 text-left ${shadow6} transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
                          >
                            <p className={`${anton} text-xl uppercase text-black line-clamp-1`}>
                              {entry.listingTitle || "Marketplace Listing"}
                            </p>
                            <p className={`mt-1 break-all ${space} text-xs font-bold text-black/50`}>
                              {entry.url}
                            </p>
                          </button>
                        ))}
                      </div>
                      {/* Scroll indicator */}
                      {searchHistory.length > 3 && (
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-black/20 overflow-hidden">
                            <div className="h-full w-1/3 rounded-full bg-black/60" />
                          </div>
                          <span className={`${anton} text-sm uppercase text-black/40`}>
                            SCROLL →
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Section: Active Analysis */}
          {!shouldShowEmptyState && (
            <div className="flex flex-col">
               <CurrentListing
                  title={displayTitle}
                  price={displayPrice}
                  image={displayImage}
                  description={activeMarketplaceListing?.description || "Loading detailed description..."}
                  location={activeMarketplaceListing?.location || searchParams.get('location') || "Unknown Location"}
                  listingDate={activeMarketplaceListing?.listingDate || "Recently"}
                  conditionScore={conditionAssessment?.conditionScore}
                  conditionLabel={conditionAssessment?.conditionLabel}
               />
               {/* Issue 4: Market value computed from listing + similar listings average */}
               <PricingAnalysis
                  suggestedOffer={conditionAssessment?.suggestedOffer || "Calculating..."}
                  modelAccuracy={conditionAssessment?.modelAccuracy || "Pending"}
                  marketValue={marketValue}
                  topReasons={conditionAssessment?.topReasons || []}
                  negotiationTip={conditionAssessment?.negotiationTip || "Analyzing negotiation strategy..."}
               />
               {/* Issue 3: Render similar listings from both similarListings and simpleListings */}
               {activeMarketplaceListing?.similarListings && activeMarketplaceListing.similarListings.length > 0 && (
                 <SimilarListings listings={activeMarketplaceListing.similarListings} />
               )}
               {!activeMarketplaceListing?.similarListings?.length && activeMarketplaceListing?.simpleListings && activeMarketplaceListing.simpleListings.length > 0 && (
                 <SimilarListings listings={activeMarketplaceListing.simpleListings.map(sl => ({
                   title: sl.title,
                   location: sl.location,
                   price: Number(sl.price.replace(/[^\d.]/g, '')) || 0,
                   image: sl.image,
                   link: sl.link,
                 }))} />
               )}
            </div>
          )}

          {/* Section: Account Benefits (Yellow) */}
          {isAuthenticated && (
            <section className={`${sectionBorderB4P15} bg-[#FADF0B]`}>
              <div className={maxW6Full}>
                <div className={`bg-white ${b5} ${roundedXl} p-10 ${shadow8}`}>
                  <h2 className={`${anton} text-5xl uppercase text-black mb-4`}>
                    Account Active
                  </h2>
                  <p className={`mb-10 ${space} text-xl font-bold text-black/70`}>
                    You have full access to our advanced negotiation engine.
                  </p>

                  <div className="grid gap-8 md:grid-cols-3">
                    <div className={`rounded-xl ${b4} bg-[#90EE90] p-8 ${shadow4}`}>
                      <h3 className={`${anton} text-2xl uppercase text-black mb-2`}>Unlimited</h3>
                      <p className={`${space} text-sm font-semibold`}>Analyze any listing instantly.</p>
                    </div>
                    <div className={`rounded-xl ${b4} bg-[#FF69B4] p-8 ${shadow4}`}>
                      <h3 className={`${anton} text-2xl uppercase text-black mb-2`}>Insights</h3>
                      <p className={`${space} text-sm font-semibold`}>Advanced data-driven offer models.</p>
                    </div>
                    <div className={`rounded-xl ${b4} bg-[#FF6600] p-8 ${shadow4}`}>
                      <h3 className={`${anton} text-2xl uppercase text-black mb-2`}>History</h3>
                      <p className={`${space} text-sm font-semibold`}>Track all your potential deals.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
