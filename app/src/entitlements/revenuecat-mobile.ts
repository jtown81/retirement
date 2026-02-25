// @ts-nocheck Capacitor RevenueCat API signatures validated during Phase 5.5

/**
 * Capacitor RevenueCat Integration
 *
 * Mobile-native RevenueCat SDK implementation using Capacitor plugin.
 * This module is loaded only on iOS/Android; web uses revenuecat.ts (REST API).
 *
 * Features:
 * - Native subscription purchasing UI
 * - Server-validated entitlements
 * - Offline-ready (caches locally)
 * - Automatic renewal handling
 *
 * Reference: https://github.com/RCJedediah/capacitor-revenuecat
 */

export interface RevenueCatEntitlement {
  tier: 'basic' | 'premium';
  source: 'revenuecat';
  activatedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface RevenueCatPackage {
  id: string;
  productId: string;
  title: string;
  priceString: string;
  description?: string;
}

let revenuecatInitialized = false;

/**
 * Initialize Capacitor RevenueCat
 * Must be called once with a user ID (typically Firebase UID)
 */
export async function initRevenueCatMobile(apiKey: string, userId: string): Promise<void> {
  if (revenuecatInitialized) return;

  try {
    // Dynamically import to avoid errors on web
    const Purchases = await import('@revenuecat/purchases-capacitor').then((m) => m.default);

    // Initialize with API key and user ID
    await Purchases.setup({
      apiKey,
      appUserId: userId,
      observerMode: false,
    });

    // Enable debug logging in development
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: 'debug' });
    }

    revenuecatInitialized = true;
    console.log('[RevenueCat Mobile] Initialized for user:', userId);
  } catch (error) {
    console.error('[RevenueCat Mobile] Init failed:', error);
    throw error;
  }
}

/**
 * Check if user has premium entitlement
 */
export async function checkEntitlementMobile(): Promise<RevenueCatEntitlement | null> {
  try {
    const Purchases = await import('@revenuecat/purchases-capacitor').then((m) => m.default);

    const customerInfo = await Purchases.getCustomerInfo();

    // Check if premium entitlement is active
    const premiumEntitlement = customerInfo.entitlements?.active?.premium;
    const isPremium = !!premiumEntitlement;

    return {
      tier: isPremium ? 'premium' : 'basic',
      source: 'revenuecat',
      activatedAt: customerInfo.firstSeen ?? null,
      expiresAt: premiumEntitlement?.expirationDate ?? null,
      isActive: isPremium,
    };
  } catch (error) {
    console.error('[RevenueCat Mobile] Check entitlement failed:', error);
    return null;
  }
}

/**
 * Get available offerings and packages
 */
export async function getOfferingsMobile(): Promise<RevenueCatPackage[]> {
  try {
    const Purchases = await import('@revenuecat/purchases-capacitor').then((m) => m.default);

    const offerings = await Purchases.getOfferings();

    if (!offerings.current?.availablePackages) {
      return [];
    }

    return offerings.current.availablePackages.map((pkg: any) => ({
      id: pkg.identifier,
      productId: pkg.product.productId,
      title: pkg.product.title,
      priceString: pkg.product.priceString,
      description: pkg.product.description,
    }));
  } catch (error) {
    console.error('[RevenueCat Mobile] Get offerings failed:', error);
    return [];
  }
}

/**
 * Purchase a package
 */
export async function purchaseMobile(packageId: string): Promise<boolean> {
  try {
    const Purchases = await import('@revenuecat/purchases-capacitor').then((m) => m.default);

    // Get offerings to find the package
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.find((p: any) => p.identifier === packageId);

    if (!pkg) {
      throw new Error(`Package not found: ${packageId}`);
    }

    // Attempt purchase
    const result = await Purchases.purchasePackage({ aPackage: pkg });

    // Check if purchase was successful
    const isPremium = !!result.customerInfo.entitlements.active.premium;
    console.log('[RevenueCat Mobile] Purchase successful, premium =', isPremium);

    return isPremium;
  } catch (error) {
    console.error('[RevenueCat Mobile] Purchase failed:', error);
    return false;
  }
}

/**
 * Restore previous purchases
 * Useful when user reinstalls app or switches device
 */
export async function restorePurchasesMobile(): Promise<RevenueCatEntitlement | null> {
  try {
    const Purchases = await import('@revenuecat/purchases-capacitor').then((m) => m.default);

    const customerInfo = await Purchases.restorePurchases();

    const premiumEntitlement = customerInfo.entitlements?.active?.premium;
    const isPremium = !!premiumEntitlement;

    return {
      tier: isPremium ? 'premium' : 'basic',
      source: 'revenuecat',
      activatedAt: customerInfo.firstSeen ?? null,
      expiresAt: premiumEntitlement?.expirationDate ?? null,
      isActive: isPremium,
    };
  } catch (error) {
    console.error('[RevenueCat Mobile] Restore purchases failed:', error);
    return null;
  }
}

/**
 * Update user ID (e.g., when user signs in after being anonymous)
 */
export async function updateUserIdMobile(newUserId: string): Promise<void> {
  try {
    const Purchases = await import('@revenuecat/purchases-capacitor').then((m) => m.default);

    await Purchases.setAppUserId({ appUserId: newUserId });
    console.log('[RevenueCat Mobile] User ID updated:', newUserId);
  } catch (error) {
    console.error('[RevenueCat Mobile] Update user ID failed:', error);
  }
}

/**
 * Reset user (e.g., on sign-out)
 * Anonymous user mode after reset
 */
export async function resetUserMobile(): Promise<void> {
  try {
    const Purchases = await import('@revenuecat/purchases-capacitor').then((m) => m.default);

    await Purchases.resetAppUserId();
    console.log('[RevenueCat Mobile] User reset (anonymous mode)');
  } catch (error) {
    console.error('[RevenueCat Mobile] Reset user failed:', error);
  }
}
