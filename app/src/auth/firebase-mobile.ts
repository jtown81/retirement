/**
 * Capacitor Firebase Authentication
 *
 * Mobile-native Firebase Auth implementation using Capacitor plugin.
 * This module is loaded only on iOS/Android; web uses firebase.ts instead.
 *
 * Supported providers:
 * - Google
 * - Apple
 * - Email/Password
 *
 * Reference: https://github.com/capacitor-firebase/authentication
 *
 * Note: This is Phase 5 scaffolding. Exact API signatures will be validated
 * during Phase 5.5 (Platform Testing) with actual iOS/Android builds.
 */

// @ts-nocheck Capacitor plugin API signatures validated during Phase 5.5

// Note: FirebaseAuthentication plugin will be imported dynamically
// to avoid breaking web builds. It's installed but only used on mobile.

export interface MobileAuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
}

let authInitialized = false;
let listeners: Array<(user: MobileAuthUser | null) => void> = [];

/**
 * Initialize Capacitor Firebase Authentication
 * Must be called once before any auth operations
 */
export async function initCapacitorAuth(): Promise<void> {
  if (authInitialized) return;

  try {
    // Dynamically import to avoid errors on web
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    // Initialize Firebase Authentication
    await FirebaseAuthentication.initialize();

    // Set up auth state listener
    FirebaseAuthentication.addListener('authStateChanged', (event: any) => {
      const user = event.user
        ? {
            uid: event.user.uid,
            email: event.user.email ?? undefined,
            displayName: event.user.displayName ?? undefined,
            photoUrl: event.user.photoUrl ?? undefined,
          }
        : null;

      // Notify all listeners
      listeners.forEach((listener) => listener(user));
    });

    authInitialized = true;
    console.log('[FirebaseAuth Mobile] Initialized');
  } catch (error) {
    console.error('[FirebaseAuth Mobile] Init failed:', error);
    throw error;
  }
}

/**
 * Add auth state change listener
 */
export function onAuthStateChanged(callback: (user: MobileAuthUser | null) => void): () => void {
  listeners.push(callback);

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<MobileAuthUser> {
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    const result = await FirebaseAuthentication.signInWithGoogle();

    if (!result.user) {
      throw new Error('No user returned from Google sign-in');
    }

    return {
      uid: result.user.uid,
      email: result.user.email ?? undefined,
      displayName: result.user.displayName ?? undefined,
      photoUrl: result.user.photoUrl ?? undefined,
    };
  } catch (error) {
    console.error('[FirebaseAuth Mobile] Google sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign in with Apple
 */
export async function signInWithApple(): Promise<MobileAuthUser> {
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    const result = await FirebaseAuthentication.signInWithApple();

    if (!result.user) {
      throw new Error('No user returned from Apple sign-in');
    }

    return {
      uid: result.user.uid,
      email: result.user.email ?? undefined,
      displayName: result.user.displayName ?? undefined,
      photoUrl: result.user.photoUrl ?? undefined,
    };
  } catch (error) {
    console.error('[FirebaseAuth Mobile] Apple sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<MobileAuthUser> {
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    const result = await FirebaseAuthentication.createUserWithEmailAndPassword({
      email,
      password,
    });

    if (!result.user) {
      throw new Error('No user returned from sign-up');
    }

    return {
      uid: result.user.uid,
      email: result.user.email ?? undefined,
      displayName: result.user.displayName ?? undefined,
      photoUrl: result.user.photoUrl ?? undefined,
    };
  } catch (error) {
    console.error('[FirebaseAuth Mobile] Email sign-up failed:', error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<MobileAuthUser> {
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    const result = await FirebaseAuthentication.signInWithEmailAndPassword({
      email,
      password,
    });

    if (!result.user) {
      throw new Error('No user returned from sign-in');
    }

    return {
      uid: result.user.uid,
      email: result.user.email ?? undefined,
      displayName: result.user.displayName ?? undefined,
      photoUrl: result.user.photoUrl ?? undefined,
    };
  } catch (error) {
    console.error('[FirebaseAuth Mobile] Email sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    await FirebaseAuthentication.signOut();
    console.log('[FirebaseAuth Mobile] Signed out');
  } catch (error) {
    console.error('[FirebaseAuth Mobile] Sign-out failed:', error);
    throw error;
  }
}

/**
 * Get current user (if any)
 */
export async function getCurrentUser(): Promise<MobileAuthUser | null> {
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

    const result = await FirebaseAuthentication.getCurrentUser();

    if (!result.user) {
      return null;
    }

    return {
      uid: result.user.uid,
      email: result.user.email ?? undefined,
      displayName: result.user.displayName ?? undefined,
      photoUrl: result.user.photoUrl ?? undefined,
    };
  } catch (error) {
    console.error('[FirebaseAuth Mobile] Get current user failed:', error);
    return null;
  }
}
