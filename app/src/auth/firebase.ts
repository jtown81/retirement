import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Firebase app initialization (client-side only)
 *
 * Configuration values come from environment variables:
 * - PUBLIC_FIREBASE_API_KEY
 * - PUBLIC_FIREBASE_AUTH_DOMAIN
 * - PUBLIC_FIREBASE_PROJECT_ID
 * - PUBLIC_FIREBASE_STORAGE_BUCKET
 * - PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - PUBLIC_FIREBASE_APP_ID
 *
 * These are loaded from .env.local and exposed via import.meta.env
 * (types defined in src/vite-env.d.ts)
 */

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
