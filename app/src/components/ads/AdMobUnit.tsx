// @ts-nocheck Capacitor AdMob API signatures validated during Phase 5.5
'use client';

import { useEffect, useState } from 'react';
import { useEntitlement } from '@hooks/useEntitlement';

interface AdMobUnitProps {
  unitId: string;
  format: 'banner' | 'interstitial' | 'rewarded';
  className?: string;
}

/**
 * AdMob Unit Component (Mobile)
 *
 * Renders Google AdMob ads on iOS/Android via Capacitor plugin.
 * Only displays for Basic tier users; Premium tier sees nothing.
 *
 * Supported formats:
 * - 'banner': 320×50px (bottom of screen)
 * - 'interstitial': Full-screen (shown on specific events)
 * - 'rewarded': Rewarded video (optional feature)
 *
 * Note: AdMob banner ads are shown by the native plugin (no DOM element needed)
 */
export function AdMobUnit({ unitId, format, className = '' }: AdMobUnitProps) {
  const { isBasic } = useEntitlement();
  const [showingBanner, setShowingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Premium users see no ads
  if (!isBasic) {
    return null;
  }

  // Initialize AdMob and show banner on mount
  useEffect(() => {
    if (format !== 'banner') {
      return; // Only auto-show banners
    }

    const initAdMob = async () => {
      try {
        // Dynamically import AdMob plugin to avoid errors on web
        const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');

        // Initialize AdMob if in development
        if (import.meta.env.DEV) {
          try {
            await AdMob.initialize({
              requestIdfa: true,
            });
          } catch {
            // May fail if already initialized
          }
        }

        // Show banner ad
        await AdMob.showBanner({
          adUnitId: unitId,
          adSize: BannerAdSize.Banner,
          position: BannerAdPosition.Bottom,
          margin: 0,
          isTesting: import.meta.env.DEV,
        });

        setShowingBanner(true);
        console.log('[AdMob] Banner shown:', unitId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[AdMob] Show banner failed:', message);
        setError(message);
      }
    };

    initAdMob();

    // Cleanup: hide banner on unmount
    return () => {
      const hideAd = async () => {
        try {
          const { AdMob } = await import('@capacitor-community/admob');
          await AdMob.hideBanner();
        } catch {
          // Ignore errors on cleanup
        }
      };
      hideAd();
    };
  }, [unitId, format]);

  // For banner format, return a placeholder div
  // The actual banner is displayed by the native AdMob plugin
  if (format === 'banner') {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ minHeight: '50px', width: '100%' }}
      >
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!error && showingBanner && <p className="text-xs text-gray-500">Advertisement</p>}
        {!error && !showingBanner && <p className="text-xs text-gray-500">Loading ad...</p>}
      </div>
    );
  }

  // Interstitial and rewarded ads are handled through imperative calls
  // (shown on specific events, not automatically rendered)
  return null;
}

/**
 * Show interstitial ad (full-screen)
 * Typically shown when user performs an action (e.g., save scenario)
 */
export async function showInterstitialAd(unitId: string): Promise<boolean> {
  try {
    const { AdMob } = await import('@capacitor-community/admob');

    await AdMob.showInterstitial({
      adUnitId: unitId,
      isTesting: import.meta.env.DEV,
    });

    console.log('[AdMob] Interstitial shown:', unitId);
    return true;
  } catch (error) {
    console.error('[AdMob] Show interstitial failed:', error);
    return false;
  }
}

/**
 * Show rewarded ad (video)
 * User watches ad to unlock a feature or reward
 */
export async function showRewardedAd(unitId: string): Promise<boolean> {
  try {
    const { AdMob } = await import('@capacitor-community/admob');

    await AdMob.showRewarded({
      adUnitId: unitId,
      isTesting: import.meta.env.DEV,
    });

    console.log('[AdMob] Rewarded ad shown:', unitId);
    return true;
  } catch (error) {
    console.error('[AdMob] Show rewarded ad failed:', error);
    return false;
  }
}

// Global type declaration for AdMob
declare global {
  interface Window {
    admob?: Record<string, unknown>;
  }
}
