"use client";

import { useAuthSession } from '../../../lib/auth/useAuthSession';

interface UseDashboardSessionResult {
  isSessionReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  signOut: () => Promise<void>;
}

/**
 * Exposes dashboard auth state without enforcing route-level redirects.
 */
export function useDashboardSession(): UseDashboardSessionResult {
  const { user, isLoading, signOut } = useAuthSession();

  return {
    isSessionReady: !isLoading,
    isAuthenticated: Boolean(user),
    userId: user?.id ?? null,
    signOut,
  };
}
