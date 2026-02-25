import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS, SubscriptionSchema } from '@storage/index';

/**
 * Hook for checking user subscription tier and feature entitlements.
 *
 * Reads `retire:subscription` from localStorage with safe default to 'basic' tier.
 * UI-only hook — never import from @fedplan/* packages.
 *
 * Phase 3B: localStorage-only implementation. RevenueCat/Firebase integration deferred to Phase 4.
 *
 * Returns:
 *  - tier: 'basic' | 'premium' (defaults to 'basic' if subscription key not set)
 *  - isPremium: boolean flag
 *  - isBasic: boolean flag
 *  - isFeatureEnabled: (feature: string) => boolean (checks if feature available for tier)
 */
export function useEntitlement() {
  const [subscription] = useLocalStorage(STORAGE_KEYS.SUBSCRIPTION, SubscriptionSchema);

  const tier = subscription?.tier ?? 'basic';
  const isPremium = tier === 'premium';
  const isBasic = tier === 'basic';

  /**
   * Check if a specific premium feature is enabled for the current tier.
   * @param feature - Feature name (e.g., 'simulationConfig', 'taxModeling')
   * @returns true if feature is available in current tier
   */
  const isFeatureEnabled = (feature: string): boolean => {
    if (isPremium) return true; // Premium tier has all features
    // Basic tier features only; anything else is locked
    return ['fersEstimate', 'careerTimeline', 'expenseCategories', 'basicDashboard', 'scenarioSave', 'csvExport'].includes(
      feature,
    );
  };

  return {
    tier,
    isPremium,
    isBasic,
    isFeatureEnabled,
  };
}
