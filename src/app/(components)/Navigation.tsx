"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, Loader2, LogOut, Menu, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '../../lib/supabaseBrowserClient';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';

interface NavigationProps {
  showHistoryToggle?: boolean;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
  dashboardNav?: boolean;
}

export function Navigation({
  showHistoryToggle = false,
  isHistoryOpen = false,
  onToggleHistory,
  dashboardNav = false,
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(isSupabaseBrowserConfigured());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dashboardSearchUrl, setDashboardSearchUrl] = useState('');
  const parsedDashboardListing = parseFacebookMarketplaceListingUrl(dashboardSearchUrl);
  const isValidDashboardListingUrl = parsedDashboardListing !== null;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setUser(data.user ?? null);
      setIsLoadingAuth(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      router.push('/auth');
      return;
    }

    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggingOut(false);

    if (pathname?.startsWith('/dashboard')) {
      router.replace('/auth');
      return;
    }

    router.refresh();
  };

  const handleDashboardSearch = () => {
    if (!parsedDashboardListing) {
      return;
    }

    const searchQuery = new URLSearchParams({
      listingUrl: parsedDashboardListing.normalizedUrl,
      itemId: parsedDashboardListing.itemId,
    });

    router.push(`/dashboard?${searchQuery.toString()}`);
  };

  return (
    <nav className="border-b-4 border-black bg-[#FFFFFF] px-6 py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="inline-flex items-center gap-3">
          {dashboardNav && onToggleHistory && (
            <button
              type="button"
              onClick={onToggleHistory}
              className="inline-flex items-center justify-center rounded-md border-4 border-transparent bg-white p-2 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:border-black hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              aria-label={isHistoryOpen ? 'Close previous listings menu' : 'Open previous listings menu'}
            >
              {isHistoryOpen ? (
                <X className="size-5" strokeWidth={2.5} />
              ) : (
                <Menu className="size-5" strokeWidth={2.5} />
              )}
            </button>
          )}
          <span className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide">
            BALLER
          </span>
        </div>

        {isLoadingAuth ? (
          <div className="inline-flex items-center gap-2 rounded-md border-4 border-black bg-[#FADF0B] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000]">
            <Loader2 className="size-4 animate-spin" />
            Loading
          </div>
        ) : user ? (
          <div className={`ml-auto items-center gap-3 ${dashboardNav ? 'flex w-full max-w-3xl justify-end' : 'inline-flex'}`}>
            {dashboardNav && (
              <>
                <div className="w-full max-w-2xl overflow-hidden rounded-xl border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000000]">
                  <input
                    type="text"
                    value={dashboardSearchUrl}
                    onChange={(event) => setDashboardSearchUrl(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === 'Enter' && isValidDashboardListingUrl && handleDashboardSearch()
                    }
                    placeholder="Search another Facebook Marketplace listing"
                    className="w-full px-5 py-3 font-['Space_Grotesk',sans-serif] text-sm font-semibold outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="relative inline-block group">
                  <button
                    type="button"
                    onClick={handleDashboardSearch}
                    disabled={!isValidDashboardListingUrl}
                    aria-label="Analyze listing"
                    className={`inline-flex items-center rounded-xl border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000000] transition-all ${
                      isValidDashboardListingUrl
                        ? 'bg-[#FADF0B] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="size-5" strokeWidth={3} />
                  </button>

                  {!isValidDashboardListingUrl && (
                    <div className="pointer-events-none absolute top-full right-0 mt-2 z-50 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-md border-4 border-black bg-white px-3 py-2 shadow-[4px_4px_0px_0px_#000000]">
                        <p className="whitespace-nowrap font-['Space_Grotesk',sans-serif] text-sm font-semibold text-black">
                          Insert valid Facebook Marketplace listing
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {showHistoryToggle && onToggleHistory && !dashboardNav && (
              <button
                type="button"
                onClick={onToggleHistory}
                className="inline-flex items-center gap-2 rounded-md border-4 border-black bg-[#FADF0B] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                {isHistoryOpen ? <X className="size-4" strokeWidth={2.5} /> : <Menu className="size-4" strokeWidth={2.5} />}
                Search History
              </button>
            )}
            {!isDashboardRoute && (
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md border-4 border-black bg-[#90EE90] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                Dashboard
              </Link>
            )}
            {!dashboardNav && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 rounded-md border-4 border-black bg-[#FF69B4] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" strokeWidth={2.5} />
                )}
                Log Out
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/auth"
            className="inline-flex items-center rounded-md border-4 border-black bg-[#FADF0B] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            Log In / Sign Up
          </Link>
        )}
      </div>
    </nav>
  );
}
