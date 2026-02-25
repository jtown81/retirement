/**
 * RevenueCat Entitlements Client
 *
 * Manages subscription entitlements via RevenueCat REST API.
 * Responsible for:
 * - Initializing with public API key
 * - Fetching customer entitlements (tier: basic or premium)
 * - Handling errors and offline fallback
 *
 * Uses REST API instead of SDK for simpler web implementation.
 * Documentation: https://docs.revenuecat.com/docs/web
 */

interface RevenueCatEntitlement {
  tier: 'basic' | 'premium';
  source: 'revenuecat';
  activatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

interface RevenueCatCustomer {
  entitlements: {
    active: Record<string, { expirationDate: string | null }>;
  };
  firstSeen: string;
}

interface RevenueCatError {
  code?: string;
  message: string;
}

let apiKey: string | null = null;

/**
 * Initialize RevenueCat with API key
 * Must be called once on app startup
 */
export async function initializeRevenueCat(): Promise<void> {
  try {
    apiKey = import.meta.env.PUBLIC_REVENUECAT_API_KEY || null;
    if (!apiKey) {
      console.warn('[RevenueCat] API key not configured');
      return;
    }

    console.log('[RevenueCat] Initialized successfully');
  } catch (err) {
    console.error('[RevenueCat] Initialization failed:', err);
    throw err;
  }
}

/**
 * Check user entitlements via REST API
 *
 * Fetches customer info from RevenueCat and returns tier status.
 * Creates a new customer if one doesn't exist.
 *
 * @param firebaseUID - User's Firebase UID (used as customer ID)
 * @returns Entitlement status or null if check fails
 */
export async function checkRevenueCatEntitlement(
  firebaseUID: string
): Promise<RevenueCatEntitlement | null> {
  try {
    if (!firebaseUID || !apiKey) {
      console.warn('[RevenueCat] Missing user ID or API key');
      return null;
    }

    // Call RevenueCat REST API to get customer info
    // API endpoint: GET /v1/customers/{app_user_id}
    const response = await fetch(
      `https://api.revenuecat.com/v1/customers/${encodeURIComponent(firebaseUID)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // 404 is normal for new users - they'll be created on first purchase
      if (response.status === 404) {
        console.log('[RevenueCat] New customer (not found):', firebaseUID);
        return {
          tier: 'basic',
          source: 'revenuecat',
          activatedAt: new Date().toISOString(),
          expiresAt: null,
          isActive: false,
        };
      }
      throw new Error(`RevenueCat API error: ${response.status}`);
    }

    const data = await response.json();
    const customer: RevenueCatCustomer = data.subscriber || data;

    // Check if user has active premium entitlement
    const premiumEntitlement = customer.entitlements?.active?.premium;
    const isPremium = !!premiumEntitlement;

    const result: RevenueCatEntitlement = {
      tier: isPremium ? 'premium' : 'basic',
      source: 'revenuecat',
      activatedAt: customer.firstSeen || new Date().toISOString(),
      expiresAt: premiumEntitlement?.expirationDate ?? null,
      isActive: isPremium,
    };

    console.log('[RevenueCat] Entitlement check:', {
      userId: firebaseUID,
      tier: result.tier,
      expiresAt: result.expiresAt,
    });

    return result;
  } catch (err) {
    const error = err as RevenueCatError;
    console.error('[RevenueCat] Entitlement check failed:', {
      message: error.message,
    });
    return null;
  }
}

/**
 * Reset API key (called on sign-out)
 * Clears context but API key remains for future checks
 */
export async function resetRevenueCatUser(): Promise<void> {
  try {
    console.log('[RevenueCat] User logged out');
  } catch (err) {
    console.error('[RevenueCat] Failed to log out:', err);
  }
}
