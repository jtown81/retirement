'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { checkRevenueCatEntitlement, resetRevenueCatUser } from '@entitlements/revenuecat';
import { STORAGE_KEYS, SubscriptionSchema } from '@storage/index';

/**
 * RevenueCat Sync Hook
 *
 * Automatically syncs entitlements from RevenueCat to localStorage when:
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
  const [subscription, setSubscription] = useLocalStorage(
    STORAGE_KEYS.SUBSCRIPTION,
    SubscriptionSchema
  );

  /**
   * Fetch entitlements from RevenueCat and cache in localStorage
   */
  const syncEntitlements = useCallback(async () => {
    if (!firebaseUID) return;

    try {
      const entitlement = await checkRevenueCatEntitlement(firebaseUID);

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
          console.log('[useRevenueCatSync] Entitlements synced:', entitlement.tier);
        }
      }
    } catch (err) {
      console.error('[useRevenueCatSync] Sync failed:', err);
      // Use cached subscription as fallback (offline)
    }
  }, [firebaseUID, subscription, setSubscription]);

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
   */
  useEffect(() => {
    if (!isSignedIn) {
      resetRevenueCatUser();
      // Reset to basic tier (default)
      setSubscription({ tier: 'basic' });
      console.log('[useRevenueCatSync] User signed out, tier reset to basic');
    }
  }, [isSignedIn, setSubscription]);

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
