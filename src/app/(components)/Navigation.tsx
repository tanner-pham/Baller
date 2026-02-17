"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '../../lib/supabaseBrowserClient';

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(isSupabaseBrowserConfigured());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  return (
    <nav className="border-b-4 border-black bg-[#FFFFFF] px-6 py-4">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <span className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wide">
          BALLER
        </span>

        {isLoadingAuth ? (
          <div className="inline-flex items-center gap-2 rounded-md border-4 border-black bg-[#FADF0B] px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000]">
            <Loader2 className="size-4 animate-spin" />
            Loading
          </div>
        ) : user ? (
          <div className="inline-flex items-center gap-3">
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
