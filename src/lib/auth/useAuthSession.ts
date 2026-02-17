"use client";

import { useCallback, useEffect, useState } from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '../supabaseBrowserClient';

interface UseAuthSessionResult {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  supabase: SupabaseClient | null;
  signOut: () => Promise<void>;
}

/**
 * Provides a single client-side auth/session source of truth for UI components.
 */
export function useAuthSession(): UseAuthSessionResult {
  const supabase = getSupabaseBrowserClient();
  const isConfigured = isSupabaseBrowserConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isConfigured);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    /**
     * Reads the active session once on mount before subscribing to auth changes.
     */
    const loadInitialSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(currentSession ?? null);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    };

    loadInitialSession().catch(() => {
      if (isMounted) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      // Keep state in sync with all auth transitions (sign-in, refresh, sign-out).
      setSession(updatedSession ?? null);
      setUser(updatedSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Uses shared session client to sign the user out when available.
   */
  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }, [supabase]);

  return {
    user: supabase ? user : null,
    session: supabase ? session : null,
    isLoading: supabase ? isLoading : false,
    isConfigured,
    supabase,
    signOut,
  };
}
