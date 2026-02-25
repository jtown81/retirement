/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_FIREBASE_API_KEY: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID: string;
  readonly PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  readonly PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly PUBLIC_FIREBASE_APP_ID: string;
  readonly PUBLIC_REVENUECAT_API_KEY?: string;
  readonly PUBLIC_ADSENSE_CLIENT_ID?: string;
  readonly PUBLIC_ADSENSE_SLOTS_LEADERBOARD: string;
  readonly PUBLIC_ADSENSE_SLOTS_SIDEBAR: string;
  readonly PUBLIC_ADSENSE_SLOTS_ANCHOR: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
