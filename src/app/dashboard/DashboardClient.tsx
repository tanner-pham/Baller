"use client";

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useSimilarListings } from './hooks/useSimilarListings';
import type { SearchHistoryEntry } from './types';

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const handleSelectPreviousSearch = (entry: SearchHistoryEntry) => {
    const searchQuery = new URLSearchParams({ listingUrl: entry.url, itemId: entry.itemId });
    setIsSidebarOpen(false);
    router.push(`/dashboard?${searchQuery.toString()}`);
  };

  const isDashboardLoading = isListingLoading || isConditionLoading || (parsedListing && !hasConditionResolved);
  const shouldShowEmptyState = !parsedListing && !isDashboardLoading;

  return (
    <main className="size-full overflow-y-auto bg-[#F5F5F0]">
      <Navigation
        dashboardNav
        showHistoryToggle={isAuthenticated}
        isHistoryOpen={isSidebarOpen}
        onToggleHistory={isAuthenticated ? () => setIsSidebarOpen(!isSidebarOpen) : undefined}
      />

      {isDashboardLoading ? (
        <div className={`p-20 text-center ${anton} uppercase text-3xl animate-pulse`}>
          Analyzing Listing...
        </div>
      ) : (
        <>
          {/* Section: History (Green) */}
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
                  <div className="grid gap-6 md:grid-cols-2">
                    {searchHistory.slice(0, 4).map((entry) => (
                      <button
                        key={`${entry.url}-${entry.searchedAt}`}
                        onClick={() => handleSelectPreviousSearch(entry)}
                        className={`rounded-xl ${b5} bg-[#FF69B4] p-6 text-left ${shadow6} transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
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
                )}
              </div>
            </div>
          </section>

          {/* Section: Active Analysis */}
          {!shouldShowEmptyState && (
            <div className="flex flex-col">
               <CurrentListing 
                  title={displayTitle}
                  price={displayPrice}
                  image={displayImage}
                  description={activeMarketplaceListing?.description || "Loading detailed description..."}
                  location={activeMarketplaceListing?.location || searchParams.get('location') || "Unknown Location"}
                  sellerName={activeMarketplaceListing?.sellerName || "Private Seller"}
                  postedTime={activeMarketplaceListing?.postedTime || "Recently"}
                  conditionScore={conditionAssessment?.conditionScore}
                  conditionLabel={conditionAssessment?.conditionLabel}
               />
               <PricingAnalysis 
                  suggestedOffer={conditionAssessment?.suggestedOffer || "Calculating..."}
                  modelAccuracy={conditionAssessment?.modelAccuracy || "Pending"}
                  marketValue={displayPrice}
                  topReasons={conditionAssessment?.topReasons || []}
                  negotiationTip={conditionAssessment?.negotiationTip || "Analyzing negotiation strategy..."}
               />
               {activeMarketplaceListing?.similarListings && (
                 <SimilarListings listings={activeMarketplaceListing.similarListings} />
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