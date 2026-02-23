"use client";

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { History, Loader2, LogOut, X } from 'lucide-react';
import { SimilarListings } from './(components)/SimilarListings';
import { CurrentListing, type CurrentListingProps } from './(components)/CurrentListing';
import { PricingAnalysis, type PricingAnalysisProps } from './(components)/PriceAnalysis';
import { Navigation } from '../(components)/Navigation';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import {
  DEFAULT_CURRENT_LISTING,
  DEFAULT_PRICING_ANALYSIS,
  DEFAULT_SIMILAR_LISTINGS,
  EMPTY_IMAGE_PLACEHOLDER,
  FALLBACK_LISTING_LINK,
} from './constants';
import { useConditionAssessment } from './hooks/useConditionAssessment';
import { useDashboardSession } from './hooks/useDashboardSession';
import { useMarketplaceListing } from './hooks/useMarketplaceListing';
import { useSearchHistory } from './hooks/useSearchHistory';
import type { SearchHistoryEntry } from './types';

/**
 * Displays a dashboard skeleton while listing and condition details are loading.
 */
function DashboardLoadingSkeleton() {
  return (
    <>
      <section className="animate-pulse border-b-4 border-black bg-[#90EE90] p-15">
        <div className="mx-auto flex h-[500px] w-full max-w-6xl gap-20">
          <div className="flex-[1] rounded-xl border-5 border-black bg-white/90" />
          <div className="flex-[2] p-6">
            <div className="mb-6 h-20 w-4/5 rounded-md border-4 border-black bg-white/90" />
            <div className="mb-4 h-24 w-full rounded-md border-4 border-black bg-white/80" />
            <div className="mb-8 flex gap-3">
              <div className="h-12 w-44 rounded-md border-4 border-black bg-[#FADF0B]/90" />
              <div className="h-12 w-36 rounded-md border-4 border-black bg-[#FF6600]/90" />
            </div>
            <div className="h-12 w-48 rounded-md border-4 border-black bg-[#3300FF]/90" />
          </div>
        </div>
      </section>

      <section className="animate-pulse border-b-4 border-black bg-[#FADF0B] p-15">
        <div className="mx-auto mb-12 grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="h-36 rounded-md border-4 border-black bg-[#90EE90]/90 shadow-[6px_6px_0px_0px_#000000]" />
          <div className="h-36 rounded-md border-4 border-black bg-[#FF69B4]/90 shadow-[6px_6px_0px_0px_#000000]" />
          <div className="h-36 rounded-md border-4 border-black bg-[#FF6600]/90 shadow-[6px_6px_0px_0px_#000000]" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
          <div className="h-28 rounded-md border-4 border-black bg-white/90 shadow-[6px_6px_0px_0px_#000000]" />
          <div className="h-28 rounded-md border-4 border-black bg-white/90 shadow-[6px_6px_0px_0px_#000000]" />
        </div>
      </section>

      <section className="animate-pulse border-b-4 border-black bg-[#3300FF] p-15">
        <div className="mx-auto w-full max-w-6xl rounded-xl border-5 border-black bg-white p-8 pb-20 shadow-[8px_8px_0px_0px_#000000]">
          <div className="mb-6 h-12 w-72 rounded-md border-4 border-black bg-[#FADF0B]/90" />
          <div className="flex gap-8">
            <div className="h-64 w-72 rounded-md border-4 border-black bg-[#90EE90]/90 shadow-[4px_4px_0px_0px_#000000]" />
            <div className="h-64 w-72 rounded-md border-4 border-black bg-[#FF69B4]/90 shadow-[4px_4px_0px_0px_#000000]" />
            <div className="h-64 w-72 rounded-md border-4 border-black bg-[#FF6600]/90 shadow-[4px_4px_0px_0px_#000000]" />
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Renders the dashboard view and composes listing, condition, and history states.
 */
export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const listingUrlParam = searchParams.get('listingUrl') ?? '';

  const parsedListing = useMemo(
    () => parseFacebookMarketplaceListingUrl(listingUrlParam),
    [listingUrlParam],
  );

  const { isAuthenticated, userId, signOut } = useDashboardSession();
  const {
    listing: marketplaceListing,
    isLoading: isListingLoading,
    error: listingLoadError,
  } = useMarketplaceListing(parsedListing);

  const activeMarketplaceListing =
    marketplaceListing && parsedListing && marketplaceListing.itemId === parsedListing.itemId
      ? marketplaceListing
      : null;

  const {
    assessment: conditionAssessment,
    isLoading: isConditionLoading,
    hasResolved: hasConditionResolved,
    error: conditionLoadError,
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

  const currentListingData: CurrentListingProps = {
    image: (activeMarketplaceListing?.images?.[0] ?? searchParams.get('image')) || DEFAULT_CURRENT_LISTING.image,
    price: searchParams.get('price') ?? DEFAULT_CURRENT_LISTING.price,
    title: searchParams.get('title') ?? DEFAULT_CURRENT_LISTING.title,
    description: searchParams.get('description') ?? DEFAULT_CURRENT_LISTING.description,
    postedTime: searchParams.get('postedTime') ?? DEFAULT_CURRENT_LISTING.postedTime,
    location: searchParams.get('location') ?? DEFAULT_CURRENT_LISTING.location,
    sellerName: searchParams.get('sellerName') ?? DEFAULT_CURRENT_LISTING.sellerName,
  };

  const topReasonsFromParam = searchParams
    .get('topReasons')
    ?.split('|')
    .map((reason) => reason.trim())
    .filter(Boolean);

  const pricingAnalysisData: PricingAnalysisProps = {
    suggestedOffer: searchParams.get('suggestedOffer') ?? DEFAULT_PRICING_ANALYSIS.suggestedOffer,
    modelAccuracy: searchParams.get('modelAccuracy') ?? DEFAULT_PRICING_ANALYSIS.modelAccuracy,
    marketValue: searchParams.get('marketValue') ?? DEFAULT_PRICING_ANALYSIS.marketValue,
    topReasons:
      topReasonsFromParam && topReasonsFromParam.length > 0
        ? topReasonsFromParam
        : DEFAULT_PRICING_ANALYSIS.topReasons,
    negotiationTip: searchParams.get('negotiationTip') ?? DEFAULT_PRICING_ANALYSIS.negotiationTip,
  };

  const hasListingError = Boolean(parsedListing && !isListingLoading && listingLoadError);
  const hasConditionError = Boolean(parsedListing && !isConditionLoading && conditionLoadError);
  const fallbackListingErrorText = hasListingError
    ? listingLoadError
    : 'Listing details are currently unavailable.';
  const fallbackConditionErrorText = hasConditionError
    ? conditionLoadError
    : 'Condition analysis is currently unavailable.';

  const resolvedCurrentListingData: CurrentListingProps = {
    ...currentListingData,
    title:
      activeMarketplaceListing?.title ||
      currentListingData.title ||
      (hasListingError ? 'Unable to load listing' : ''),
    description:
      activeMarketplaceListing?.description ||
      currentListingData.description ||
      (hasListingError ? fallbackListingErrorText : ''),
    price:
      activeMarketplaceListing?.price ||
      currentListingData.price ||
      (hasListingError ? 'Unavailable' : ''),
    location:
      activeMarketplaceListing?.location ||
      currentListingData.location ||
      (hasListingError ? 'Unavailable' : ''),
    image: activeMarketplaceListing?.images?.[0] || currentListingData.image || EMPTY_IMAGE_PLACEHOLDER,
    sellerName:
      activeMarketplaceListing?.sellerName ||
      currentListingData.sellerName ||
      (hasListingError ? 'Unavailable' : ''),
    postedTime:
      activeMarketplaceListing?.postedTime ||
      currentListingData.postedTime ||
      (hasListingError ? 'Unavailable' : ''),
    conditionScore: conditionAssessment?.conditionScore,
    conditionLabel: conditionAssessment?.conditionLabel,
  };

  const fallbackTopReasons =
    conditionAssessment?.topReasons && conditionAssessment.topReasons.length > 0
      ? conditionAssessment.topReasons
      : pricingAnalysisData.topReasons.length > 0
        ? pricingAnalysisData.topReasons
        : hasConditionError
          ? [fallbackConditionErrorText]
          : hasListingError
            ? [fallbackListingErrorText]
            : ['No pricing rationale available yet.'];

  const resolvedPricingAnalysisData: PricingAnalysisProps = {
    ...pricingAnalysisData,
    suggestedOffer:
      conditionAssessment?.suggestedOffer ||
      pricingAnalysisData.suggestedOffer ||
      (hasConditionError || hasListingError ? 'N/A' : ''),
    modelAccuracy:
      conditionAssessment?.modelAccuracy ||
      pricingAnalysisData.modelAccuracy ||
      (hasConditionError ? 'N/A' : ''),
    topReasons: fallbackTopReasons,
    negotiationTip:
      conditionAssessment?.negotiationTip ||
      pricingAnalysisData.negotiationTip ||
      (hasConditionError
        ? fallbackConditionErrorText
        : hasListingError
          ? fallbackListingErrorText
          : ''),
    marketValue: activeMarketplaceListing?.price
      ? activeMarketplaceListing.price.replace(/^\$/, '')
      : pricingAnalysisData.marketValue,
  };

  const similarListingsSource =
    activeMarketplaceListing?.similarListings && activeMarketplaceListing.similarListings.length > 0
      ? activeMarketplaceListing.similarListings
      : DEFAULT_SIMILAR_LISTINGS;
  const emptyStateMessage = isAuthenticated
    ? 'No listing loaded yet. Open the menu to load a previous listing, or paste a new Facebook Marketplace link in the top bar.'
    : 'No listing loaded yet. Paste a Facebook Marketplace link in the top bar to start. Log in to unlock search history.';

  /**
   * Opens a prior listing in the dashboard by rewriting query params.
   */
  const handleSelectPreviousSearch = (entry: SearchHistoryEntry) => {
    const searchQuery = new URLSearchParams({
      listingUrl: entry.url,
      itemId: entry.itemId,
    });

    setIsSidebarOpen(false);
    router.push(`/dashboard?${searchQuery.toString()}`);
  };

  /**
   * Signs out from the shared auth hook and returns to `/auth`.
   */
  const handleSidebarLogout = async () => {
    setIsLoggingOut(true);

    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
      setIsSidebarOpen(false);
      router.replace('/auth');
    }
  };

  const listingLink = parsedListing?.normalizedUrl ?? FALLBACK_LISTING_LINK;
  const resolvedSimilarListings =
    Array.isArray(similarListingsSource) ? similarListingsSource : DEFAULT_SIMILAR_LISTINGS;

  const listingsWithValidatedLinks = resolvedSimilarListings.map((listing) => ({
    ...listing,
    link: listing.link || listingLink,
  }));

  const hasStaleListingMismatch = Boolean(
    parsedListing &&
      marketplaceListing &&
      marketplaceListing.itemId &&
      marketplaceListing.itemId !== parsedListing.itemId,
  );
  const shouldWaitForCondition = Boolean(
    parsedListing &&
      activeMarketplaceListing &&
      !hasConditionResolved &&
      !conditionLoadError,
  );
  const isDashboardLoading =
    isListingLoading || hasStaleListingMismatch || isConditionLoading || shouldWaitForCondition;
  const shouldShowEmptyState = !parsedListing && !isDashboardLoading;

  return (
    <main className="size-full overflow-y-auto bg-[#F5F5F0]">
      <Navigation
        dashboardNav
        showHistoryToggle={isAuthenticated}
        isHistoryOpen={isSidebarOpen}
        onToggleHistory={
          isAuthenticated
            ? () => setIsSidebarOpen((previousState) => !previousState)
            : undefined
        }
      />

      {isAuthenticated && isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40"
          aria-label="Close search history"
        />
      )}

      {isAuthenticated && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-80 border-r-5 border-black bg-white shadow-[8px_0px_0px_0px_#000000] transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b-4 border-black bg-[#3300FF] px-4 py-4">
              <div className="inline-flex items-center gap-2">
                <History className="size-5 text-white" strokeWidth={2.5} />
                <h2 className="font-['Anton',sans-serif] text-xl uppercase text-white">
                  Previous Listings
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-md border-2 border-black bg-[#FADF0B] p-1"
                aria-label="Close sidebar"
              >
                <X className="size-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {searchHistory.length === 0 ? (
                <div className="rounded-xl border-4 border-black bg-[#F5F5F0] p-4">
                  <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-gray-700">
                    No listings yet. Analyze a listing to build your history.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchHistory.map((entry) => (
                    <button
                      key={`${entry.url}-${entry.searchedAt}`}
                      type="button"
                      onClick={() => handleSelectPreviousSearch(entry)}
                      className="w-full rounded-xl border-4 border-black bg-[#90EE90] p-3 text-left shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000]"
                    >
                      <p className="font-['Anton',sans-serif] text-base uppercase text-black">
                        {entry.listingTitle}
                      </p>
                      <p className="mt-1 break-all font-['Space_Grotesk',sans-serif] text-xs font-semibold text-gray-700">
                        {entry.url}
                      </p>
                      <p className="mt-2 font-['Space_Grotesk',sans-serif] text-xs font-semibold text-gray-700">
                        {new Date(entry.searchedAt).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t-4 border-black p-4">
              <button
                type="button"
                onClick={handleSidebarLogout}
                disabled={isLoggingOut}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border-4 border-black bg-[#FF69B4] px-4 py-3 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" strokeWidth={2.5} />
                )}
                Log Out
              </button>
            </div>
          </div>
        </aside>
      )}

      {listingLoadError && (
        <div className="mx-auto mt-8 w-full max-w-6xl rounded-md border-4 border-black bg-[#FF6600] px-4 py-3 shadow-[4px_4px_0px_0px_#000000]">
          <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-white">
            {listingLoadError}
          </p>
        </div>
      )}

      {conditionLoadError && !isListingLoading && (
        <div className="mx-auto mt-4 w-full max-w-6xl rounded-md border-4 border-black bg-[#FADF0B] px-4 py-3 shadow-[4px_4px_0px_0px_#000000]">
          <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-black">
            {conditionLoadError}
          </p>
        </div>
      )}

      {isDashboardLoading ? (
        <DashboardLoadingSkeleton />
      ) : shouldShowEmptyState ? (
        <section className="mx-auto mt-10 w-full max-w-6xl px-4">
          <div className="rounded-md border-4 border-black bg-white px-5 py-4 shadow-[4px_4px_0px_0px_#000000]">
            <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-black">
              {emptyStateMessage}
            </p>
          </div>
        </section>
      ) : (
        <>
          <div className="mt-8">
            <CurrentListing {...resolvedCurrentListingData} />
          </div>
          <PricingAnalysis {...resolvedPricingAnalysisData} />
          <div className="size-full overflow-y-auto bg-[#F5F5F0]">
            <SimilarListings listings={listingsWithValidatedLinks} />
          </div>
        </>
      )}
    </main>
  );
}
