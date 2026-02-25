'use client';

import { useEffect } from 'react';
import { useEntitlement } from '@hooks/useEntitlement';
import { isNative } from '@auth/platform-detector';
import { AdMobUnit } from './AdMobUnit';

interface AdUnitProps {
  slotId: string;
  format: 'leaderboard' | 'sidebar' | 'anchor';
  className?: string;
}

/**
 * Ad Unit Component (Platform-Aware)
 *
 * Renders platform-appropriate ads for Basic tier users:
 * - Web: Google AdSense
 * - Mobile: Google AdMob
 *
 * Features:
 * - Only renders for basic tier (premium users see nothing)
 * - Auto-sizes ads for different formats
 * - Defers ad request via platform-specific queue
 * - Development mode: renders placeholder
 *
 * Formats:
 * - 'leaderboard': 728x90px (horizontal, top of page)
 * - 'sidebar': 300x250px (vertical, right side on desktop)
 * - 'anchor': 320x50px (horizontal, bottom mobile sticky)
 *
 * Platform routing:
 * - Web: AdSense via <ins> element
 * - Mobile: AdMob via Capacitor plugin
 *
 * Usage:
 * <AdUnit slotId={ADSENSE_SLOTS.leaderboard} format="leaderboard" />
 */
export function AdUnit({ slotId, format, className = '' }: AdUnitProps) {
  const { isBasic } = useEntitlement();
  const isDev = import.meta.env.DEV;
  const isMobile = isNative();

  // Don't render ads for premium users
  if (!isBasic) {
    return null;
  }

  // Route to mobile ads on iOS/Android
  // AdMob uses 'banner' for all banner ads (positioning differs on native)
  if (isMobile) {
    return <AdMobUnit unitId={slotId} format="banner" className={className} />;
  }

  // Web: Dimensions for each format
  const dimensions = {
    leaderboard: { width: 728, height: 90 },
    sidebar: { width: 300, height: 250 },
    anchor: { width: 320, height: 50 },
  };

  const { width, height } = dimensions[format];

  // Push ad to AdSense queue
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.error('[AdUnit] Failed to push ad:', err);
    }
  }, []);

  // Development mode: show placeholder
  if (isDev) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            AdSense (Web)
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {width}×{height}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Slot: {slotId}
          </p>
        </div>
      </div>
    );
  }

  // Production mode: render ad slot
  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'inline-block',
          width: `${width}px`,
          height: `${height}px`,
        }}
        data-ad-client={import.meta.env.PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
      />
    </div>
  );
}

// Global type declaration for adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}
