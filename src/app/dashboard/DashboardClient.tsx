"use client";

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { AnalysisProgress } from './(components)/AnalysisProgress';
import { SimilarListings } from './(components)/SimilarListings';
import { CompareBar } from './(components)/CompareBar';
import { CurrentListing } from './(components)/CurrentListing';
import { PricingAnalysis } from './(components)/PriceAnalysis';
import { ScamRiskBanner } from './(components)/ScamRiskBanner';
import { Navigation } from '../(components)/Navigation';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import type { CompareSelection } from './(components)/SimilarListings';

import {
  maxW6Full,
  dashboardStyles,
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

const ANALYSIS_STEPS = ['Fetching listing', 'Analyzing condition', 'Finalizing'];

function getProgressStep(
  isListingLoading: boolean,
  isConditionLoading: boolean,
  hasConditionResolved: boolean,
): number {
  if (isListingLoading) return 0;
  if (isConditionLoading) return 1;
  if (!hasConditionResolved) return 1; // Still analyzing until condition resolves
  return 2; // Done / Finalizing
}

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const [compareSelections, setCompareSelections] = useState<CompareSelection[]>([]);
  const [compareLimitMsg, setCompareLimitMsg] = useState(false);
  const [previousListingsOpen, setPreviousListingsOpen] = useState(true);
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
  const displayDescription = activeMarketplaceListing?.description
    || (isListingLoading ? "Loading detailed description..." : "No description provided.");

  const handleSelectPreviousSearch = (entry: SearchHistoryEntry) => {
    const searchQuery = new URLSearchParams({ listingUrl: entry.url, itemId: entry.itemId });
    router.push(`/dashboard?${searchQuery.toString()}`);
  };

  // Issue 1: Trigger sign-in popup when unauthed user tries to search
  const handleUnauthSearchAttempt = () => {
    setShowSignInPopup(true);
  };

  // Compare selection handlers
  const handleToggleCompare = (selection: CompareSelection) => {
    setCompareSelections(prev => {
      const exists = prev.some(s => s.url === selection.url);
      if (exists) {
        setCompareLimitMsg(false);
        return prev.filter(s => s.url !== selection.url);
      }
      if (prev.length >= 2) {
        setCompareLimitMsg(true);
        setTimeout(() => setCompareLimitMsg(false), 2500);
        return prev;
      }
      setCompareLimitMsg(false);
      return [...prev, selection];
    });
  };

  const handleRemoveCompare = (selection: CompareSelection) => {
    setCompareSelections(prev => prev.filter(s => s.url !== selection.url));
  };

  const handleClearCompare = () => {
    setCompareSelections([]);
  };

  const isCurrentListingSelected = compareSelections.some(s => s.url === listingUrlParam);

  const isDashboardLoading = isListingLoading || isConditionLoading || (parsedListing && !hasConditionResolved);
  const shouldShowEmptyState = !parsedListing && !isDashboardLoading;

  // Issue 4: Market value = average of listing price + similar listings prices
  const marketValue = computeMarketValue(
    activeMarketplaceListing?.price,
    activeMarketplaceListing?.similarListings,
  );

  return (
    <main className={dashboardStyles.main}>
      {/* Issue 6: Removed sidebar toggle props, added onUnauthSearchAttempt */}
      <Navigation
        dashboardNav
        onUnauthSearchAttempt={handleUnauthSearchAttempt}
      />

      {/* Issue 1: Sign-in popup overlay */}
      {showSignInPopup && (
        <div className={dashboardStyles.signInOverlay}>
          <div className={dashboardStyles.signInCard}>
            <button
              type="button"
              onClick={() => setShowSignInPopup(false)}
              className={dashboardStyles.signInCloseButton}
              aria-label="Close"
            >
              <X className={dashboardStyles.signInCloseIcon} strokeWidth={2.5} />
            </button>

            <h2 className={dashboardStyles.signInTitle}>
              SIGN IN REQUIRED
            </h2>
            <p className={dashboardStyles.signInBody}>
              Create an account or sign in to search additional listings and unlock full analysis features.
            </p>
            <div className={dashboardStyles.signInButtons}>
              <button
                type="button"
                onClick={() => router.push('/auth')}
                className={dashboardStyles.signInPrimaryButton}
              >
                Log In / Sign Up
              </button>
              <button
                type="button"
                onClick={() => setShowSignInPopup(false)}
                className={dashboardStyles.signInSecondaryButton}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {isDashboardLoading ? (
        <AnalysisProgress
          currentStep={getProgressStep(isListingLoading, isConditionLoading, hasConditionResolved)}
          steps={ANALYSIS_STEPS}
        />
      ) : (
        <>
          {/* Issue 2: Only show Previous Listings for authenticated users */}
          {isAuthenticated && (
            <section className={dashboardStyles.previousListingsSection}>
              <div className={maxW6Full}>
                <div className={`${dashboardStyles.previousListingsCard} ${
                  previousListingsOpen ? dashboardStyles.previousListingsCardOpen : dashboardStyles.previousListingsCardClosed
                }`}
                >
                  <button
                    type="button"
                    onClick={() => setPreviousListingsOpen(prev => !prev)}
                    className={dashboardStyles.previousListingsToggleButton}
                  >
                    <h2 className={dashboardStyles.previousListingsTitle}>
                      Previous Listings
                    </h2>
                    {previousListingsOpen ? (
                      <ChevronUp className={dashboardStyles.previousListingsChevronIcon} strokeWidth={3} />
                    ) : (
                      <ChevronDown className={dashboardStyles.previousListingsChevronIcon} strokeWidth={3} />
                    )}
                  </button>

                  {previousListingsOpen && searchHistory.length === 0 && (
                    <p className={dashboardStyles.previousListingsEmptyText}>
                      No listings analyzed yet.
                    </p>
                  )}
                  {previousListingsOpen && searchHistory.length > 0 && (
                    /* Issue 5: Horizontal scroll for all search history entries */
                    <div className={dashboardStyles.previousListingsScrollerWrap}>
                      <div className={dashboardStyles.previousListingsScroller}>
                        {searchHistory.map((entry) => {
                          const isSelected = compareSelections.some(s => s.url === entry.url);
                          return (
                            <div
                              key={`${entry.url}-${entry.searchedAt}`}
                              className={dashboardStyles.previousListingCard}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectPreviousSearch(entry)}
                                className={dashboardStyles.previousListingButton}
                              >
                                <p className={dashboardStyles.previousListingTitle}>
                                  {entry.listingTitle || "Marketplace Listing"}
                                </p>
                                <p className={dashboardStyles.previousListingUrl}>
                                  {entry.url}
                                </p>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleCompare({
                                  url: entry.url,
                                  title: entry.listingTitle || "Marketplace Listing",
                                  price: "",
                                  image: "",
                                })}
                                aria-label={isSelected ? "Remove from compare" : "Add to compare"}
                                className={`${dashboardStyles.previousListingCompareButton} ${
                                  isSelected ? dashboardStyles.previousListingCompareSelected : dashboardStyles.previousListingCompareUnselected
                                }`}
                              >
                                {isSelected ? <Check className={dashboardStyles.previousListingCompareIcon} strokeWidth={3} /> : <Plus className={dashboardStyles.previousListingCompareIcon} strokeWidth={3} />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {/* Scroll indicator */}
                      {searchHistory.length > 3 && (
                        <div className={dashboardStyles.scrollIndicatorRow}>
                          <div className={dashboardStyles.scrollIndicatorTrack}>
                            <div className={dashboardStyles.scrollIndicatorThumb} />
                          </div>
                          <span className={dashboardStyles.scrollIndicatorText}>
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
            <div className={dashboardStyles.activeAnalysisCol}>
               <CurrentListing
                  title={displayTitle}
                  price={displayPrice}
                  image={displayImage}
                  description={displayDescription}
                  location={activeMarketplaceListing?.location || searchParams.get('location') || "Unknown Location"}
                  listingDate={activeMarketplaceListing?.listingDate || "Recently"}
                  conditionScore={conditionAssessment?.conditionScore}
                  conditionLabel={conditionAssessment?.conditionLabel}
                  backToListingButton={listingUrlParam ? (
                    <button
                      type="button"
                      onClick={() => window.open(listingUrlParam, '_blank', 'noopener,noreferrer')}
                      className={`${dashboardStyles.currentListingActionButtonBase} ${dashboardStyles.currentListingActionBack}`}
                    >
                      BACK TO LISTING
                    </button>
                  ) : undefined}
                  compareButton={listingUrlParam ? (
                    <button
                      type="button"
                      onClick={() => handleToggleCompare({
                        url: listingUrlParam,
                        title: displayTitle,
                        price: displayPrice,
                        image: displayImage,
                      })}
                      className={`${dashboardStyles.currentListingActionButtonBase} ${
                        isCurrentListingSelected
                          ? dashboardStyles.currentListingActionCompareSelected
                          : dashboardStyles.currentListingActionCompareUnselected
                      }`}
                    >
                      {isCurrentListingSelected ? 'REMOVE FROM COMPARE' : 'ADD TO COMPARE'}
                    </button>
                  ) : undefined}
               />
               {/* Issue 4: Market value computed from listing + similar listings average */}
               <PricingAnalysis
                  suggestedOffer={conditionAssessment?.suggestedOffer || "Calculating..."}
                  modelAccuracy={conditionAssessment?.modelAccuracy || "Pending"}
                  marketValue={marketValue}
                  topReasons={conditionAssessment?.topReasons || []}
                  negotiationTip={conditionAssessment?.negotiationTip || "Analyzing negotiation strategy..."}
               />
               {/* Scam Risk Banner — shown when assessment includes scam data */}
               {conditionAssessment?.scamRiskLevel && (
                 <ScamRiskBanner
                   scamRiskScore={conditionAssessment.scamRiskScore ?? 0}
                   scamRiskLevel={conditionAssessment.scamRiskLevel}
                   scamRedFlags={conditionAssessment.scamRedFlags ?? []}
                 />
               )}
               {/* Issue 3: Render similar listings from both similarListings and simpleListings */}
               {activeMarketplaceListing?.similarListings && activeMarketplaceListing.similarListings.length > 0 && (
                 <SimilarListings
                   listings={activeMarketplaceListing.similarListings}
                   currentListingUrl={listingUrlParam}
                   onToggleCompare={handleToggleCompare}
                   compareSelections={compareSelections}
                 />
               )}
               {!activeMarketplaceListing?.similarListings?.length && activeMarketplaceListing?.simpleListings && activeMarketplaceListing.simpleListings.length > 0 && (
                 <SimilarListings
                   listings={activeMarketplaceListing.simpleListings.map(sl => ({
                     title: sl.title,
                     location: sl.location,
                     price: Number(sl.price.replace(/[^\d.]/g, '')) || 0,
                     image: sl.image,
                     link: sl.link,
                   }))}
                   currentListingUrl={listingUrlParam}
                   onToggleCompare={handleToggleCompare}
                   compareSelections={compareSelections}
                 />
               )}
            </div>
          )}

          {/* Section: Account Benefits (Yellow) */}
          {isAuthenticated && (
            <section className={dashboardStyles.accountSection}>
              <div className={maxW6Full}>
                <div className={dashboardStyles.accountCard}>
                  <h2 className={dashboardStyles.accountTitle}>
                    Account Active
                  </h2>
                  <p className={dashboardStyles.accountBody}>
                    You have full access to our advanced negotiation engine.
                  </p>

                  <div className={dashboardStyles.accountGrid}>
                    <div className={`${dashboardStyles.accountStatCardBase} ${dashboardStyles.accountStatBgUnlimited}`}>
                      <h3 className={dashboardStyles.accountStatTitle}>Unlimited</h3>
                      <p className={dashboardStyles.accountStatText}>Analyze any listing instantly.</p>
                    </div>
                    <div className={`${dashboardStyles.accountStatCardBase} ${dashboardStyles.accountStatBgInsights}`}>
                      <h3 className={dashboardStyles.accountStatTitle}>Insights</h3>
                      <p className={dashboardStyles.accountStatText}>Advanced data-driven offer models.</p>
                    </div>
                    <div className={`${dashboardStyles.accountStatCardBase} ${dashboardStyles.accountStatBgHistory}`}>
                      <h3 className={dashboardStyles.accountStatTitle}>History</h3>
                      <p className={dashboardStyles.accountStatText}>Track all your potential deals.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Sticky compare bar - renders when 1+ listings selected, z-40 below sign-in modal z-50 */}
      {compareSelections.length > 0 && (
        <CompareBar
          selections={compareSelections}
          onRemove={handleRemoveCompare}
          onClear={handleClearCompare}
          limitMessage={compareLimitMsg}
        />
      )}
    </main>
  );
}