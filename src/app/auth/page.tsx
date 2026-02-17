"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Lock, Mail, User } from 'lucide-react';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from '../../lib/supabaseBrowserClient';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseBrowserConfigured();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(isSupabaseConfigured);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    const checkExistingSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (data.session) {
        router.replace('/dashboard');
        return;
      }

      setIsCheckingSession(false);
    };

    checkExistingSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/dashboard');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleDummySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('Name is required for sign up.');
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setErrorMessage(
        'Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local.',
      );
      return;
    }

    const runAuth = async () => {
      setIsSubmitting(true);

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setIsSubmitting(false);
          return;
        }

        if (data.session) {
          router.replace('/dashboard');
          return;
        }

        setSuccessMessage('Account created. Please log in.');
        setMode('login');
        setPassword('');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      router.replace('/dashboard');
    };

    runAuth().catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setErrorMessage(message);
      setIsSubmitting(false);
    });
  };

  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-[#F5F5F0]">
        <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-4 py-10">
          <div className="inline-flex items-center gap-3 rounded-full border-4 border-black bg-white px-6 py-3 font-['Anton',sans-serif] uppercase shadow-[6px_6px_0px_0px_#000000]">
            <Loader2 className="size-5 animate-spin" />
            Checking Session
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-white px-4 py-2 font-['Anton',sans-serif] text-sm uppercase shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            <ArrowLeft className="size-4" strokeWidth={3} />
            Back Home
          </Link>
        </div>

        <section className="rounded-3xl border-5 border-black bg-white p-8 shadow-[10px_10px_0px_0px_#000000]">
          <h1 className="mb-8 text-center font-['Anton',sans-serif] text-5xl leading-[0.95] text-black">
            BALLER
          </h1>

          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-xl border-4 border-black bg-[#FF69B4] p-4 shadow-[4px_4px_0px_0px_#000000]">
              <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-black">
                Missing SUPABASE_URL or SUPABASE_ANON_KEY in `.env.local`.
              </p>
            </div>
          )}

          <div className="mb-8 inline-flex rounded-full border-4 border-black bg-[#F5F5F0] p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              disabled={isSubmitting}
              className={`rounded-full px-5 py-2 font-['Anton',sans-serif] text-sm uppercase transition-all ${
                mode === 'login' ? 'bg-[#3300FF] text-white shadow-[3px_3px_0px_0px_#000000]' : 'text-black'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              disabled={isSubmitting}
              className={`rounded-full px-5 py-2 font-['Anton',sans-serif] text-sm uppercase transition-all ${
                mode === 'signup' ? 'bg-[#FF69B4] text-black shadow-[3px_3px_0px_0px_#000000]' : 'text-black'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleDummySubmit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-2 block font-['Anton',sans-serif] text-sm uppercase">Name</span>
                <div className="flex items-center gap-3 border-4 border-black bg-white px-4 py-3">
                  <User className="size-5" strokeWidth={2.5} />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full font-['Space_Grotesk',sans-serif] font-semibold outline-none"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block font-['Anton',sans-serif] text-sm uppercase">Email</span>
              <div className="flex items-center gap-3 border-4 border-black bg-white px-4 py-3">
                <Mail className="size-5" strokeWidth={2.5} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  className="w-full font-['Space_Grotesk',sans-serif] font-semibold outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block font-['Anton',sans-serif] text-sm uppercase">Password</span>
              <div className="flex items-center gap-3 border-4 border-black bg-white px-4 py-3">
                <Lock className="size-5" strokeWidth={2.5} />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  className="w-full font-['Space_Grotesk',sans-serif] font-semibold outline-none"
                />
              </div>
            </label>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border-4 border-black bg-[#FF6600] p-3">
                <AlertCircle className="size-5 shrink-0 text-white" strokeWidth={2.5} />
                <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-white">
                  {errorMessage}
                </p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border-4 border-black bg-[#90EE90] p-3">
                <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-black">
                  {successMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isSupabaseConfigured}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full border-5 border-black bg-[#3300FF] px-6 py-4 font-['Anton',sans-serif] text-lg uppercase text-white shadow-[6px_6px_0px_0px_#000000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  Loading
                </span>
              ) : mode === 'login' ? (
                'Continue to Dashboard'
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-center font-['Space_Grotesk',sans-serif] text-sm font-semibold text-gray-600">
              Email/password auth is enabled with Supabase.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
