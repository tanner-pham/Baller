"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight, Loader2, LogOut } from 'lucide-react';
import { parseFacebookMarketplaceListingUrl } from '../../lib/facebookMarketplaceListing';
import { useAuthSession } from '../../lib/auth/useAuthSession';
import { navigationStyles } from '../consts';

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
    setDashboardSearchUrl('');
  };

  return (
    <nav className={navigationStyles.root}>
      <div className={navigationStyles.inner}>
        <div className={navigationStyles.brandRow}>
          <Link href="/">
            <span className={navigationStyles.brandText}>BALLER</span>
          </Link>
        </div>

        {isLoading ? (
          <div className={navigationStyles.loadingPill}>
            <Loader2 className={navigationStyles.loadingIcon} />
            Loading
          </div>
        ) : (
          <div
            className={`${navigationStyles.rightRailBase} ${
              shouldShowDashboardSearch ? navigationStyles.rightRailDashboard : navigationStyles.rightRailInline
            }`}
          >
            {shouldShowDashboardSearch && (
              <>
                <div className={navigationStyles.dashboardSearchShell}>
                  <input
                    type="text"
                    value={dashboardSearchUrl}
                    onChange={(event) => setDashboardSearchUrl(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === 'Enter' && isValidDashboardListingUrl && handleDashboardSearch()
                    }
                    placeholder="Search another Facebook Marketplace listing"
                    className={navigationStyles.dashboardSearchInput}
                  />
                </div>

                <div className={navigationStyles.dashboardSearchButtonWrap}>
                  <button
                    type="button"
                    onClick={handleDashboardSearch}
                    disabled={!isValidDashboardListingUrl}
                    aria-label="Analyze listing"
                    className={`${navigationStyles.dashboardSearchButtonBase} ${
                      isValidDashboardListingUrl
                        ? navigationStyles.dashboardSearchButtonEnabled
                        : navigationStyles.dashboardSearchButtonDisabled
                    }`}
                  >
                    <ChevronRight className={navigationStyles.dashboardSearchChevronIcon} strokeWidth={3} />
                  </button>

                  {!isValidDashboardListingUrl && (
                    <div className={navigationStyles.dashboardSearchTooltipPos}>
                      <div className={navigationStyles.dashboardSearchTooltipBox}>
                        <p className={navigationStyles.dashboardSearchTooltipText}>
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
                    className={navigationStyles.dashboardLink}
                  >
                    Dashboard
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={navigationStyles.logoutButton}
                >
                  {isLoggingOut ? (
                    <Loader2 className={navigationStyles.loadingIcon} />
                  ) : (
                    <LogOut className={navigationStyles.logoutIcon} strokeWidth={2.5} />
                  )}
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className={navigationStyles.authLink}
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
