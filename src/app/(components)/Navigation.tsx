"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight, Loader2, LogOut } from 'lucide-react';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import { useAuthSession } from '../../lib/auth/useAuthSession';

interface NavigationProps {
  dashboardNav?: boolean;
  onUnauthSearchAttempt?: () => void;
}

export function Navigation({
  dashboardNav = false,
  onUnauthSearchAttempt,
}: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const shouldShowDashboardSearch = Boolean(dashboardNav && isDashboardRoute);
  const { user, isLoading, isConfigured, signOut } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dashboardSearchUrl, setDashboardSearchUrl] = useState('');
  const parsedDashboardListing = parseFacebookMarketplaceListingUrl(dashboardSearchUrl);
  const isValidDashboardListingUrl = parsedDashboardListing !== null;

  useEffect(() => {
    if (!isDashboardRoute) {
      return;
    }

    setDashboardSearchUrl('');
  }, [isDashboardRoute, pathname]);

  const handleLogout = async () => {
    if (!isConfigured) {
      router.push('/auth');
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }

    if (isDashboardRoute) {
      router.replace('/auth');
      return;
    }

    router.refresh();
  };

  const handleDashboardSearch = () => {
    if (!parsedDashboardListing) {
      return;
    }

    if (!user && onUnauthSearchAttempt) {
      onUnauthSearchAttempt();
      return;
    }

    const searchQuery = new URLSearchParams({
      listingUrl: parsedDashboardListing.normalizedUrl,
      itemId: parsedDashboardListing.itemId,
    });

    router.push(`/dashboard?${searchQuery.toString()}`);
  };

  return (
    <nav className="bg-[#F5F5F0] px-6 py-6 shadow-[0px_6px_0px_0px_#000000]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="inline-flex items-center gap-3">
          <Link href="/">
            <span className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide">BALLER</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="inline-flex items-center gap-2 rounded-md border-4 border-black bg-[#FADF0B] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000]">
            <Loader2 className="size-4 animate-spin" />
            Loading
          </div>
        ) : (
          <div
            className={`ml-auto items-center gap-3 ${
              shouldShowDashboardSearch ? 'flex w-full max-w-3xl justify-end' : 'inline-flex'
            }`}
          >
            {shouldShowDashboardSearch && (
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

                <div className="group relative inline-block">
                  <button
                    type="button"
                    onClick={handleDashboardSearch}
                    disabled={!isValidDashboardListingUrl}
                    aria-label="Analyze listing"
                    className={`inline-flex items-center rounded-xl border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000000] transition-all ${
                      isValidDashboardListingUrl
                        ? 'bg-[#FADF0B] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                        : 'cursor-not-allowed bg-gray-300 text-gray-600'
                    }`}
                  >
                    <ChevronRight className="size-5" strokeWidth={3} />
                  </button>

                  {!isValidDashboardListingUrl && (
                    <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 opacity-0 transition-opacity group-hover:opacity-100">
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

            {user ? (
              <>
                {!isDashboardRoute && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-md border-4 border-black bg-[#90EE90] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                  >
                    Dashboard
                  </Link>
                )}

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
              </>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center rounded-md border-4 border-black bg-[#FADF0B] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                Log In / Sign Up
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
