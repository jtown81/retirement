'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { checkRevenueCatEntitlement, resetRevenueCatUser } from '@entitlements/revenuecat';
import * as mobileRevenueCat from '@entitlements/revenuecat-mobile';
import { isNative } from '@auth/platform-detector';
import { STORAGE_KEYS, SubscriptionSchema } from '@storage/index';

/**
 * RevenueCat Sync Hook
 *
 * Platform-aware entitlement syncing from RevenueCat to localStorage.
 *
 * Web: Uses RevenueCat REST API (revenuecat.ts)
 * Mobile: Uses Capacitor RevenueCat SDK (revenuecat-mobile.ts)
 *
 * Automatically syncs entitlements when:
 * - User signs in (immediate check)
 * - User signs out (clear cached tier)
 * - Periodic refresh (24-hour interval)
 *
 * This hook bridges Firebase auth with RevenueCat entitlements.
 *
 * Usage: Call once in root component (e.g., PlannerApp)
 */
export function useRevenueCatSync(): void {
  const { firebaseUID, isSignedIn } = useAuth();
  const isMobile = isNative();
  const [subscription, setSubscription] = useLocalStorage(
    STORAGE_KEYS.SUBSCRIPTION,
    SubscriptionSchema
  );

  /**
   * Fetch entitlements from RevenueCat and cache in localStorage
   * Platform-aware: routes to web or mobile SDK based on platform
   */
  const syncEntitlements = useCallback(async () => {
    if (!firebaseUID) return;

    try {
      let entitlement;

      if (isMobile) {
        // Mobile: Check entitlements via Capacitor RevenueCat SDK
        entitlement = await mobileRevenueCat.checkEntitlementMobile();
      } else {
        // Web: Check entitlements via RevenueCat REST API
        entitlement = await checkRevenueCatEntitlement(firebaseUID);
      }

      if (entitlement) {
        // Write to localStorage (triggers useEntitlement reactivity)
        const cached = subscription ?? {};
        const merged = {
          ...cached,
          tier: entitlement.tier,
          activatedAt: entitlement.activatedAt,
          expiresAt: entitlement.expiresAt,
          source: 'revenuecat' as const,
          userId: firebaseUID,
        };

        const result = SubscriptionSchema.safeParse(merged);
        if (result.success) {
          setSubscription(result.data);
          const platform = isMobile ? 'mobile' : 'web';
          console.log(`[useRevenueCatSync:${platform}] Entitlements synced:`, entitlement.tier);
        }
      }
    } catch (err) {
      const platform = isMobile ? 'mobile' : 'web';
      console.error(`[useRevenueCatSync:${platform}] Sync failed:`, err);
      // Use cached subscription as fallback (offline)
    }
  }, [firebaseUID, subscription, setSubscription, isMobile]);

  /**
   * Sync on sign-in
   */
  useEffect(() => {
    if (isSignedIn && firebaseUID) {
      syncEntitlements();
    }
  }, [firebaseUID, isSignedIn, syncEntitlements]);

  /**
   * Clear entitlements on sign-out
   * Platform-aware: resets both web and mobile RevenueCat state
   */
  useEffect(() => {
    if (!isSignedIn) {
      if (isMobile) {
        // Mobile: Reset to anonymous user
        mobileRevenueCat.resetUserMobile().catch((err) => {
          console.error('[useRevenueCatSync:mobile] Reset user failed:', err);
        });
      } else {
        // Web: Reset RevenueCat user
        resetRevenueCatUser();
      }

      // Reset to basic tier (default)
      setSubscription({ tier: 'basic' });
      const platform = isMobile ? 'mobile' : 'web';
      console.log(`[useRevenueCatSync:${platform}] User signed out, tier reset to basic`);
    }
  }, [isSignedIn, setSubscription, isMobile]);

  /**
   * Periodic sync (every 24 hours)
   * Keeps cached entitlements fresh without requiring page reload
   */
  useEffect(() => {
    if (!firebaseUID) return;

    const interval = setInterval(() => {
      syncEntitlements();
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval);
  }, [firebaseUID, syncEntitlements]);
}
