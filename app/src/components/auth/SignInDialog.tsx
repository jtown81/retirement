'use client';

import { useState } from 'react';
import { LogIn, X } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Multi-provider sign-in modal
 *
 * Features:
 * - Three auth methods: Google, Apple (Apple sign-in via OAuth), Email/password
 * - Tab interface for easy switching
 * - Error handling and loading states
 * - Auto-close on successful sign-in
 *
 * Phase 4.1 implementation: Web provider sign-in
 * Phase 5 will extend with mobile Capacitor equivalents
 */
export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, error, loading } =
    useAuth();
  const [activeTab, setActiveTab] = useState<'google' | 'apple' | 'email'>('google');
  const [emailFormState, setEmailFormState] = useState({
    email: '',
    password: '',
    isSignUp: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await signInWithGoogle();
      onOpenChange(false);
    } catch (err) {
      // Error handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await signInWithApple();
      onOpenChange(false);
    } catch (err) {
      // Error handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (emailFormState.isSignUp) {
        await signUpWithEmail(emailFormState.email, emailFormState.password);
      } else {
        await signInWithEmail(emailFormState.email, emailFormState.password);
      }
      onOpenChange(false);
      setEmailFormState({ email: '', password: '', isSignUp: false });
    } catch (err) {
      // Error handled by useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Sign In
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Choose how you'd like to sign in to your account.
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 mb-4 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Tab buttons */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          {(['google', 'apple', 'email'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {activeTab === 'google' && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sign in with your Google account for quick access.
              </p>
              <button
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {isSubmitting ? 'Signing in...' : 'Continue with Google'}
              </button>
            </>
          )}

          {activeTab === 'apple' && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sign in with your Apple account. Recommended for iPhone and Mac users.
              </p>
              <button
                onClick={handleAppleSignIn}
                disabled={isSubmitting || loading}
                className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-100"
              >
                {isSubmitting ? 'Signing in...' : 'Continue with Apple'}
              </button>
            </>
          )}

          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={emailFormState.email}
                  onChange={(e) => setEmailFormState({ ...emailFormState, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={emailFormState.password}
                  onChange={(e) => setEmailFormState({ ...emailFormState, password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isSignUp"
                  type="checkbox"
                  checked={emailFormState.isSignUp}
                  onChange={(e) =>
                    setEmailFormState({ ...emailFormState, isSignUp: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="isSignUp" className="text-sm text-slate-600 dark:text-slate-400">
                  Create new account
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {isSubmitting ? 'Processing...' : emailFormState.isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
