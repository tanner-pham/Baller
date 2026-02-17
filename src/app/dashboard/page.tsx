"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { History, Loader2, LogOut, X } from 'lucide-react';
import { SimilarListings } from './(components)/SimilarListings';
import { CurrentListing } from './(components)/CurrentListing';
import { PricingAnalysis } from './(components)/PriceAnalysis';
import { Navigation } from '../(components)/Navigation';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import { getSupabaseBrowserClient } from '../../lib/supabaseBrowserClient';

interface SearchHistoryEntry {
  itemId: string;
  url: string;
  searchedAt: string;
}

const dummyListings = [
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

    return parsedValue.filter(
      (entry) =>
        typeof entry?.itemId === 'string' &&
        typeof entry?.url === 'string' &&
        typeof entry?.searchedAt === 'string',
    );
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
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const listingUrlParam = searchParams.get('listingUrl') ?? '';
  const parsedListing = useMemo(
    () => parseFacebookMarketplaceListingUrl(listingUrlParam),
    [listingUrlParam],
  );

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
    if (!userId || !parsedListing) {
      return;
    }

    const addCurrentSearchToHistory = async () => {
      setSearchHistory((previousHistory) => {
        const deduplicatedHistory = previousHistory.filter(
          (historyEntry) => historyEntry.url !== parsedListing.normalizedUrl,
        );

        const nextHistory: SearchHistoryEntry[] = [
          {
            itemId: parsedListing.itemId,
            url: parsedListing.normalizedUrl,
            searchedAt: new Date().toISOString(),
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
  }, [parsedListing, userId]);

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
  const listingsWithValidatedLinks = dummyListings.map((listing) => ({
    ...listing,
    link: listingLink,
  }));

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
                      Item {entry.itemId}
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

      <div className="mt-8">
        <CurrentListing
          image="/images/macbook.jpg"
          price="$200"
          title='2018 Apple MacBook Pro 15"'
          description='2018 Apple MacBook Pro 15" with 6-core 2.2 GHz Intel i7, 16 GB RAM, 256 GB SSD, and 15.4" display, in near-pristine condition with no visible damage and will be factory reset before sale.'
          postedTime="2 hours ago"
          location="Sammamish, WA"
          sellerName="John Doe"
        />
      </div>
      <PricingAnalysis
        suggestedOffer='180'
        modelAccuracy='90'
        marketValue='230'
        topReasons= {['Battery health/cycle count isn\'t listed, and battery replacement can be a real cost',
          'A 2018 laptop is 6-7 years old, and even in great condition it\'s closer to end-of-support years than newer models',
          '256 GB is usable but relatively small by today\s standards',
          'Similar Intel 2018 15" listings vary a lot; you’re offering a fair midpoint that reflects that range'
        ]}
        negotiationTip={'Make it easy to say yes. Pair a reasonable offer with a clear, low-friction close: "Would you take $180? I can meet today, I\'m ready to pay immediately, and I can come to a spot that\'s convenient for you"'}></PricingAnalysis>
    <div className="size-full overflow-y-auto bg-[#F5F5F0]">
      <SimilarListings listings={listingsWithValidatedLinks} />
    </div>
    </main>
  );
}
