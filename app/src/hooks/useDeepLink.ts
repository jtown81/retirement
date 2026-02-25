/**
 * Deep Link Handler Hook
 *
 * Handles app deeplinks for iOS/Android (e.g., fedretire://scenarios/123).
 * On web, deeplinks are not applicable; navigation uses URL routing.
 *
 * Supported deeplinks:
 * - fedretire://scenarios/123 → Load scenario
 * - fedretire://profile → Show profile
 * - fedretire://settings → Show settings
 */

import { useEffect } from 'react';
import { isNative } from '@auth/platform-detector';

export interface DeepLinkData {
  type: 'scenario' | 'profile' | 'settings' | 'unknown';
  id?: string;
}

type DeepLinkHandler = (data: DeepLinkData) => void;

/**
 * Parse deeplink URL into structured data
 */
function parseDeepLink(url: string): DeepLinkData {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/').filter((p) => p.length > 0);

    if (parts[0] === 'scenarios' && parts[1]) {
      return { type: 'scenario', id: parts[1] };
    }

    if (parts[0] === 'profile') {
      return { type: 'profile' };
    }

    if (parts[0] === 'settings') {
      return { type: 'settings' };
    }
  } catch (error) {
    console.error('[DeepLink] Parse failed:', error);
  }

  return { type: 'unknown' };
}

/**
 * Hook to handle app deeplinks
 * Call this at app startup (e.g., in PlannerApp)
 *
 * @param onDeepLink Callback when deeplink is detected
 *
 * @example
 * useDeepLink((data) => {
 *   if (data.type === 'scenario') {
 *     loadScenario(data.id);
 *   }
 * });
 */
export function useDeepLink(onDeepLink: DeepLinkHandler): void {
  useEffect(() => {
    if (!isNative()) {
      return; // Deeplinks only on mobile
    }

    const setupDeepLinkListener = async () => {
      try {
        // Dynamically import Capacitor App plugin
        const { App } = await import('@capacitor/app');

        // Listen for app open from deeplink
        App.addListener('appUrlOpen', (event) => {
          const url = event.url;
          console.log('[DeepLink] Opened from:', url);

          const data = parseDeepLink(url);
          onDeepLink(data);
        });
      } catch (error) {
        console.error('[DeepLink] Setup failed:', error);
      }
    };

    setupDeepLinkListener();
  }, [onDeepLink]);
}

/**
 * Parse initial launch URL (if app was opened from deeplink)
 * Call this on app mount to handle cold-start deeplinks
 */
export async function getInitialDeepLink(): Promise<DeepLinkData | null> {
  if (!isNative()) {
    return null;
  }

  try {
    const { App } = await import('@capacitor/app');
    const launchData = await App.getLaunchUrl();

    if (!launchData?.url) {
      return null;
    }

    return parseDeepLink(launchData.url);
  } catch (error) {
    console.error('[DeepLink] Get initial failed:', error);
    return null;
  }
}
