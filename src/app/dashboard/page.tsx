"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { History, Loader2, LogOut, X } from 'lucide-react';
import { SimilarListings, type SimilarListing } from './(components)/SimilarListings';
import { CurrentListing, type CurrentListingProps } from './(components)/CurrentListing';
import { PricingAnalysis, type PricingAnalysisProps } from './(components)/PriceAnalysis';
import { Navigation } from '../(components)/Navigation';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import { getSupabaseBrowserClient } from '../../lib/supabaseBrowserClient';

interface SearchHistoryEntry {
  itemId: string;
  url: string;
  searchedAt: string;
  listingTitle: string;
}

interface MarketplaceListingApiData {
  title?: string;
  description?: string;
  price?: string;
  location?: string;
  image?: string;
  sellerName?: string;
  postedTime?: string;
  similarListings?: SimilarListing[];
}

interface MarketplaceListingApiResponse {
  success: boolean;
  listing?: MarketplaceListingApiData;
  error?: string;
}

interface ConditionAssessmentData {
  conditionScore?: number;
  conditionLabel?: string;
  modelAccuracy?: string;
  topReasons?: string[];
  suggestedPrice?: string;
  suggestedOffer?: string;
  negotiationTip?: string;
}

interface ConditionAssessmentApiResponse {
  success: boolean;
  assessment?: ConditionAssessmentData;
  error?: string;
}

const LISTING_REQUEST_TIMEOUT_MS = 12000;
const CONDITION_REQUEST_TIMEOUT_MS = 12000;

async function readJsonResponse<T>(
  response: Response,
): Promise<{ payload: T | null; rawText: string }> {
  const rawText = await response.text();

  try {
    return { payload: JSON.parse(rawText) as T, rawText };
  } catch {
    return { payload: null, rawText };
  }
}

const defaultSimilarListings: SimilarListing[] = [
  {
    title: "MacBook Pro M3 14-inch",
    location: "Seattle",
    price: 1200,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "Dell XPS 15 OLED",
    location: "Bellevue",
    price: 500,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "ASUS ROG Zephyrus G14",
    location: "Bellevue",
    price: 900,
    image: "https://images.unsplash.com/photo-1593642532400-2682810df593",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "Lenovo ThinkPad X1 Carbon",
    location: "Renton",
    price: 1200,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "MacBook Pro M3 14-inch",
    location: "Renton",
    price: 1200,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    link: "https://www.facebook.com/marketplace/",
  },
  {
    title: "HP Spectre x360",
    location: "Olympia",
    price: 1000,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef",
    link: "https://www.facebook.com/marketplace/",
  },
];

const defaultCurrentListing: CurrentListingProps = {
  image: '/images/macbook.jpg',
  price: '$200',
  title: '2018 Apple MacBook Pro 15"',
  description:
    '2018 Apple MacBook Pro 15" with 6-core 2.2 GHz Intel i7, 16 GB RAM, 256 GB SSD, and 15.4" display, in near-pristine condition with no visible damage and will be factory reset before sale.',
  postedTime: '2 hours ago',
  location: 'Sammamish, WA',
  sellerName: 'John Doe',
};

const defaultPricingAnalysis: PricingAnalysisProps = {
  suggestedOffer: '180',
  modelAccuracy: '90',
  marketValue: '230',
  topReasons: [
    "Battery health/cycle count isn't listed, and battery replacement can be a real cost",
    "A 2018 laptop is 6-7 years old, and even in great condition it's closer to end-of-support years than newer models",
    '256 GB is usable but relatively small by today standards',
    'Similar Intel 2018 15" listings vary a lot; you’re offering a fair midpoint that reflects that range',
  ],
  negotiationTip:
    `Make it easy to say yes. Pair a reasonable offer with a clear, low-friction close: "Would you take $180? I can meet today, I'm ready to pay immediately, and I can come to a spot that's convenient for you"`,
};

function DashboardLoadingSkeleton() {
  return (
    <>
      <section className="border-b-4 border-black bg-[#90EE90] p-15 animate-pulse">
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

      <section className="border-b-4 border-black bg-[#FADF0B] p-15 animate-pulse">
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

      <section className="border-b-4 border-black bg-[#3300FF] p-15 animate-pulse">
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

function getSearchHistoryKey(userId: string): string {
  return `baller.previousSearches.${userId}`;
}

function readSearchHistoryFromStorage(userId: string): SearchHistoryEntry[] {
  try {
    const rawValue = window.localStorage.getItem(getSearchHistoryKey(userId));

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as SearchHistoryEntry[];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(
        (entry) =>
          typeof entry?.itemId === 'string' &&
          typeof entry?.url === 'string' &&
          typeof entry?.searchedAt === 'string',
      )
      .map((entry) => ({
        itemId: entry.itemId,
        url: entry.url,
        searchedAt: entry.searchedAt,
        listingTitle:
          typeof entry?.listingTitle === 'string' && entry.listingTitle.trim().length > 0
            ? entry.listingTitle
            : `Item ${entry.itemId}`,
      }));
  } catch {
    return [];
  }
}

function writeSearchHistoryToStorage(userId: string, history: SearchHistoryEntry[]) {
  window.localStorage.setItem(getSearchHistoryKey(userId), JSON.stringify(history));
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isListingLoading, setIsListingLoading] = useState(false);
  const [isConditionLoading, setIsConditionLoading] = useState(false);
  const [listingLoadError, setListingLoadError] = useState('');
  const [conditionLoadError, setConditionLoadError] = useState('');
  const [marketplaceListing, setMarketplaceListing] = useState<MarketplaceListingApiData | null>(
    null,
  );
  const [conditionAssessment, setConditionAssessment] = useState<ConditionAssessmentData | null>(
    null,
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const listingUrlParam = searchParams.get('listingUrl') ?? '';
  const parsedListing = useMemo(
    () => parseFacebookMarketplaceListingUrl(listingUrlParam),
    [listingUrlParam],
  );
  const currentListingData: CurrentListingProps = {
    image: searchParams.get('image') ?? defaultCurrentListing.image,
    price: searchParams.get('price') ?? defaultCurrentListing.price,
    title: searchParams.get('title') ?? defaultCurrentListing.title,
    description: searchParams.get('description') ?? defaultCurrentListing.description,
    postedTime: searchParams.get('postedTime') ?? defaultCurrentListing.postedTime,
    location: searchParams.get('location') ?? defaultCurrentListing.location,
    sellerName: searchParams.get('sellerName') ?? defaultCurrentListing.sellerName,
  };

  const topReasonsFromParam = searchParams
    .get('topReasons')
    ?.split('|')
    .map((reason) => reason.trim())
    .filter(Boolean);
  const pricingAnalysisData: PricingAnalysisProps = {
    suggestedOffer: searchParams.get('suggestedOffer') ?? defaultPricingAnalysis.suggestedOffer,
    modelAccuracy: searchParams.get('modelAccuracy') ?? defaultPricingAnalysis.modelAccuracy,
    marketValue: searchParams.get('marketValue') ?? defaultPricingAnalysis.marketValue,
    topReasons:
      topReasonsFromParam && topReasonsFromParam.length > 0
        ? topReasonsFromParam
        : defaultPricingAnalysis.topReasons,
    negotiationTip:
      searchParams.get('negotiationTip') ?? defaultPricingAnalysis.negotiationTip,
  };
  const resolvedCurrentListingData: CurrentListingProps = {
    ...currentListingData,
    title: marketplaceListing?.title ?? currentListingData.title,
    description: marketplaceListing?.description ?? currentListingData.description,
    price: marketplaceListing?.price ?? currentListingData.price,
    location: marketplaceListing?.location ?? currentListingData.location,
    image: marketplaceListing?.image ?? currentListingData.image,
    sellerName: marketplaceListing?.sellerName ?? currentListingData.sellerName,
    postedTime: marketplaceListing?.postedTime ?? currentListingData.postedTime,
    conditionScore: conditionAssessment?.conditionScore,
    conditionLabel: conditionAssessment?.conditionLabel,
  };
  const resolvedPricingAnalysisData: PricingAnalysisProps = {
    ...pricingAnalysisData,
    suggestedOffer: conditionAssessment?.suggestedOffer ?? pricingAnalysisData.suggestedOffer,
    modelAccuracy: conditionAssessment?.modelAccuracy ?? pricingAnalysisData.modelAccuracy,
    topReasons:
      conditionAssessment?.topReasons && conditionAssessment.topReasons.length > 0
        ? conditionAssessment.topReasons
        : pricingAnalysisData.topReasons,
    negotiationTip: conditionAssessment?.negotiationTip ?? pricingAnalysisData.negotiationTip,
    marketValue: marketplaceListing?.price
      ? marketplaceListing.price.replace(/^\$/, '')
      : pricingAnalysisData.marketValue,
  };

  useEffect(() => {
    if (!parsedListing) {
      setConditionAssessment(null);
      setConditionLoadError('');
      setIsConditionLoading(false);
    }
  }, [parsedListing]);

  useEffect(() => {
    if (!isAuthenticated || !marketplaceListing?.image) {
      setConditionAssessment(null);
      setConditionLoadError('');
      setIsConditionLoading(false);
      return;
    }

    const abortController = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, CONDITION_REQUEST_TIMEOUT_MS);
    let isMounted = true;

    const analyzeCondition = async () => {
      setIsConditionLoading(true);
      setConditionLoadError('');

      try {
        const response = await fetch('/api/assess-condition', {
          method: 'POST',
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: marketplaceListing.image,
            description: [marketplaceListing.title, marketplaceListing.description]
              .filter(Boolean)
              .join(' | '),
          }),
        });
        const { payload, rawText } = await readJsonResponse<ConditionAssessmentApiResponse>(
          response,
        );

        if (!isMounted || !response.ok || !payload?.success) {
          console.error('Condition assessment API failed on dashboard', {
            responseOk: response.ok,
            status: response.status,
            payload,
            rawTextPreview: rawText.slice(0, 500),
          });
          setConditionAssessment(null);
          setConditionLoadError(
            payload?.error ?? 'Condition analysis is unavailable right now. Please try again.',
          );
          return;
        }

        setConditionAssessment(payload.assessment ?? null);
      } catch (error) {
        if (!isMounted || (abortController.signal.aborted && !didTimeout)) {
          return;
        }

        console.error('Condition assessment load failed:', error);
        setConditionAssessment(null);
        if (didTimeout) {
          setConditionLoadError(
            'Condition analysis timed out. Listing details loaded, but condition insights are temporarily unavailable.',
          );
          return;
        }
        setConditionLoadError(
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : 'Condition analysis is unavailable right now. Please try again.',
        );
      } finally {
        window.clearTimeout(timeoutId);
        if (isMounted) {
          setIsConditionLoading(false);
        }
      }
    };

    analyzeCondition().catch(() => {
      if (isMounted) {
        setConditionAssessment(null);
        setIsConditionLoading(false);
      }
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [isAuthenticated, marketplaceListing?.image, marketplaceListing?.description, marketplaceListing?.title]);

  const similarListingsSource =
    marketplaceListing?.similarListings && marketplaceListing.similarListings.length > 0
      ? marketplaceListing.similarListings
      : defaultSimilarListings;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      router.replace('/auth');
      return;
    }

    let isMounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session) {
        setIsAuthenticated(false);
        router.replace('/auth');
        return;
      }

      setUserId(session.user.id);
      setSearchHistory(readSearchHistoryFromStorage(session.user.id));
      setIsAuthenticated(true);
      setIsSessionReady(true);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setUserId(null);
        setSearchHistory([]);
        router.replace('/auth');
        return;
      }

      setUserId(session.user.id);
      setSearchHistory(readSearchHistoryFromStorage(session.user.id));
      setIsAuthenticated(true);
      setIsSessionReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!parsedListing) {
      setMarketplaceListing(null);
      setListingLoadError('');
      setConditionLoadError('');
      setIsListingLoading(false);
      setIsConditionLoading(false);
      return;
    }

    const abortController = new AbortController();
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, LISTING_REQUEST_TIMEOUT_MS);
    let isMounted = true;

    const loadMarketplaceListing = async () => {
      setIsListingLoading(true);
      setListingLoadError('');

      try {
        const queryParams = new URLSearchParams({
          itemId: parsedListing.itemId,
          listingUrl: parsedListing.normalizedUrl,
        });
        const response = await fetch(`/api/marketplace-listing?${queryParams.toString()}`, {
          method: 'GET',
          signal: abortController.signal,
          cache: 'no-store',
        });
        const { payload, rawText } = await readJsonResponse<MarketplaceListingApiResponse>(
          response,
        );

        if (!isMounted) {
          return;
        }

        if (!response.ok || !payload?.success) {
          console.error('Marketplace listing API failed on dashboard', {
            responseOk: response.ok,
            status: response.status,
            payload,
            rawTextPreview: rawText.slice(0, 500),
          });
          setListingLoadError(payload?.error ?? 'Failed to load listing information.');
          setMarketplaceListing(null);
          setIsConditionLoading(false);
          return;
        }

        setMarketplaceListing(payload.listing ?? null);
        setIsConditionLoading(Boolean(payload.listing?.image));
      } catch (error) {
        if (!isMounted || (abortController.signal.aborted && !didTimeout)) {
          return;
        }

        console.error('Marketplace listing load failed:', error);
        const message = didTimeout
          ? 'Listing request timed out. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Failed to load listing information.';
        setListingLoadError(message);
        setMarketplaceListing(null);
        setIsConditionLoading(false);
      } finally {
        window.clearTimeout(timeoutId);
        if (isMounted) {
          setIsListingLoading(false);
        }
      }
    };

    loadMarketplaceListing().catch(() => {
      if (isMounted) {
        console.error('Marketplace listing load promise rejected unexpectedly');
        setIsListingLoading(false);
        setIsConditionLoading(false);
        setListingLoadError('Failed to load listing information.');
      }
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [parsedListing]);

  useEffect(() => {
    if (!userId || !parsedListing) {
      return;
    }

    const addCurrentSearchToHistory = async () => {
      setSearchHistory((previousHistory) => {
        const existingEntry = previousHistory.find(
          (historyEntry) => historyEntry.url === parsedListing.normalizedUrl,
        );
        const resolvedListingTitle =
          marketplaceListing?.title?.trim() ||
          existingEntry?.listingTitle ||
          `Item ${parsedListing.itemId}`;

        const deduplicatedHistory = previousHistory.filter(
          (historyEntry) => historyEntry.url !== parsedListing.normalizedUrl,
        );

        const nextHistory: SearchHistoryEntry[] = [
          {
            itemId: parsedListing.itemId,
            url: parsedListing.normalizedUrl,
            searchedAt: new Date().toISOString(),
            listingTitle: resolvedListingTitle,
          },
          ...deduplicatedHistory,
        ].slice(0, 25);

        writeSearchHistoryToStorage(userId, nextHistory);
        return nextHistory;
      });
    };

    addCurrentSearchToHistory().catch(() => {
      // no-op: local storage write failure should not block dashboard use
    });
  }, [marketplaceListing?.title, parsedListing, userId]);

  const handleSelectPreviousSearch = (entry: SearchHistoryEntry) => {
    const searchQuery = new URLSearchParams({
      listingUrl: entry.url,
      itemId: entry.itemId,
    });

    setIsSidebarOpen(false);
    router.push(`/dashboard?${searchQuery.toString()}`);
  };

  const handleSidebarLogout = async () => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      router.replace('/auth');
      return;
    }

    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    setIsSidebarOpen(false);
    router.replace('/auth');
  };

  if (!isSessionReady || !isAuthenticated) {
    return (
      <main className="size-full overflow-y-auto bg-[#F5F5F0]">
        <Navigation
          dashboardNav
          showHistoryToggle
          isHistoryOpen={isSidebarOpen}
          onToggleHistory={() => setIsSidebarOpen((previousState) => !previousState)}
        />
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="inline-flex items-center rounded-xl border-5 border-black bg-white px-6 py-4 font-['Anton',sans-serif] text-2xl uppercase shadow-[6px_6px_0px_0px_#000000]">
            Checking Session
          </div>
        </div>
      </main>
    );
  }

  // Keep listing URL parsing shared with Hero and ready for dashboard-side link input.
  const fallbackListingLink = 'https://www.facebook.com/marketplace/item/123456789012345/';
  const listingLink = parsedListing?.normalizedUrl ?? fallbackListingLink;
  const resolvedSimilarListings =
    Array.isArray(similarListingsSource) ? similarListingsSource : defaultSimilarListings;
  const listingsWithValidatedLinks = resolvedSimilarListings.map((listing) => ({
    ...listing,
    link: listing.link || listingLink,
  }));
  const isDashboardLoading = isListingLoading || (Boolean(parsedListing) && isConditionLoading);

  return (
    <main className="size-full overflow-y-auto bg-[#F5F5F0]">
      <Navigation
        dashboardNav
        showHistoryToggle
        isHistoryOpen={isSidebarOpen}
        onToggleHistory={() => setIsSidebarOpen((previousState) => !previousState)}
      />

      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40"
          aria-label="Close search history"
        />
      )}

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
      ) : (
        <>
          <div className="mt-8">
            <CurrentListing {...resolvedCurrentListingData} />
          </div>
          <PricingAnalysis {...resolvedPricingAnalysisData}></PricingAnalysis>
          <div className="size-full overflow-y-auto bg-[#F5F5F0]">
            <SimilarListings listings={listingsWithValidatedLinks} />
          </div>
        </>
      )}
    </main>
  );
}
