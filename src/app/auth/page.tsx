"use client";

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Lock, Mail, User } from 'lucide-react';
import { useAuthSession } from '../../lib/auth/useAuthSession';
import { authStyles } from '../consts';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const { user, isLoading, isConfigured, supabase } = useAuthSession();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Logged-in users should never stay on the auth page.
    if (user) {
      router.replace('/dashboard');
    }
  }, [router, user]);

  /**
   * Handles login/signup submission and keeps user-facing messaging consistent.
   */
  const handleAuthSubmit = (event: FormEvent<HTMLFormElement>) => {
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

    if (!supabase) {
      setErrorMessage(
        'Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local.',
      );
      return;
    }

    const runAuthRequest = async () => {
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

        setSuccessMessage('Account created! Please check your inbox and verify your email before logging in.');
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

    runAuthRequest().catch((caughtError: unknown) => {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Authentication failed. Please try again.';
      setErrorMessage(message);
      setIsSubmitting(false);
    });
  };

  if (isLoading) {
    return (
      <main className={authStyles.page}>
        <div className={authStyles.centerLoading}>
          <div className={authStyles.checkingPill}>
            <Loader2 className={authStyles.checkingIcon} />
            Checking Session
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={authStyles.page}>
      <div className={authStyles.center}>
        <div className={authStyles.backRow}>
          <Link
            href="/"
            className={authStyles.backLink}
          >
            <ArrowLeft className={authStyles.backIcon} strokeWidth={3} />
            Back Home
          </Link>
        </div>

        <section className={authStyles.card}>
          <h1 className={authStyles.title}>
            BALLER
          </h1>

          {!isConfigured && (
            <div className={authStyles.supabaseMissingBox}>
              <p className={authStyles.supabaseMissingText}>
                Missing SUPABASE_URL or SUPABASE_ANON_KEY in `.env.local`.
              </p>
            </div>
          )}

          <div className={authStyles.modeToggleWrap}>
            <button
              type="button"
              onClick={() => setMode('login')}
              disabled={isSubmitting}
              className={`${authStyles.modeButtonBase} ${
                mode === 'login'
                  ? authStyles.modeButtonActiveLogin
                  : authStyles.modeButtonInactive
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              disabled={isSubmitting}
              className={`${authStyles.modeButtonBase} ${
                mode === 'signup'
                  ? authStyles.modeButtonActiveSignup
                  : authStyles.modeButtonInactive
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className={authStyles.form}>
            {mode === 'signup' && (
              <label className={authStyles.label}>
                <span className={authStyles.labelText}>Name</span>
                <div className={authStyles.inputRow}>
                  <User className={authStyles.inputIcon} strokeWidth={2.5} />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isSubmitting}
                    className={authStyles.input}
                  />
                </div>
              </label>
            )}

            <label className={authStyles.label}>
              <span className={authStyles.labelText}>Email</span>
              <div className={authStyles.inputRow}>
                <Mail className={authStyles.inputIcon} strokeWidth={2.5} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  className={authStyles.input}
                />
              </div>
            </label>

            <label className={authStyles.label}>
              <span className={authStyles.labelText}>Password</span>
              <div className={authStyles.inputRow}>
                <Lock className={authStyles.inputIcon} strokeWidth={2.5} />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  className={authStyles.input}
                />
              </div>
            </label>

            {errorMessage && (
              <div className={authStyles.errorBox}>
                <AlertCircle className={authStyles.errorIcon} strokeWidth={2.5} />
                <p className={authStyles.errorText}>
                  {errorMessage}
                </p>
              </div>
            )}

            {successMessage && (
              <div className={authStyles.successBox}>
                <p className={authStyles.successText}>
                  {successMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isConfigured}
              className={authStyles.submitButton}
            >
              {isSubmitting ? (
                <span className={authStyles.submitLoadingRow}>
                  <Loader2 className={authStyles.checkingIcon} />
                  Loading
                </span>
              ) : mode === 'login' ? (
                'Continue to Dashboard'
              ) : (
                'Create Account'
              )}
            </button>

            <p className={authStyles.helperText}>
              Email/password auth is enabled with Supabase.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
