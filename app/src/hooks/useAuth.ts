'use client';

import { useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@auth/firebase';

/**
 * Auth context hook - manages Firebase authentication state
 *
 * Responsibilities:
 * - Listen to auth state changes and update local state
 * - Provide sign-in methods (Google, Apple, email/password)
 * - Provide sign-out functionality
 * - Migrate anonymous localStorage data on first sign-in (Phase 4.2)
 *
 * Returns:
 * - user: Current Firebase user or null
 * - firebaseUID: User's UID or null
 * - isSignedIn: Boolean convenience flag
 * - loading: true while checking initial auth state
 * - error: Auth error message if sign-in failed
 * - signInWithGoogle: Async function to trigger Google sign-in
 * - signInWithApple: Async function to trigger Apple sign-in
 * - signUpWithEmail: Async function for email/password sign-up
 * - signInWithEmail: Async function for email/password sign-in
 * - signOut: Async function to sign out
 */

export interface AuthState {
  user: User | null;
  firebaseUID: string | null;
  isSignedIn: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthMethods {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState & AuthMethods {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // On sign-in: migrate anonymous data to authenticated account (Phase 4.2)
      if (firebaseUser) {
        try {
          // TODO: Phase 4.2 - Implement data migration
          // await migrateAnonymousDataToUser(firebaseUser.uid);

          // TODO: Phase 4.2 - Trigger RevenueCat entitlement check
          // await checkRevenueCatEntitlement(firebaseUser.uid);
        } catch (err) {
          console.error('Auth initialization error:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      setError(null);
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Apple';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    user,
    firebaseUID: user?.uid ?? null,
    isSignedIn: !!user,
    loading,
    error,
    signInWithGoogle,
    signInWithApple,
    signUpWithEmail,
    signInWithEmail,
    signOut: handleSignOut,
  };
}
