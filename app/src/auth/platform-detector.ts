/**
 * Platform Detection Utility
 *
 * Detects whether the app is running in a native mobile environment
 * (iOS/Android via Capacitor) or in a web browser.
 *
 * Used to conditionally load platform-specific implementations:
 * - Web: Firebase Auth SDK (REST API), RevenueCat REST API, AdSense
 * - Mobile: Capacitor Firebase Auth, RevenueCat SDK, AdMob
 */

import { Capacitor } from '@capacitor/core';

/**
 * Returns true if running in a native mobile environment
 */
export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Returns the current platform: 'ios' | 'android' | 'web'
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (!isNative()) {
    return 'web';
  }

  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios' || platform === 'android') {
      return platform;
    }
  } catch {
    // Fallback to web if platform detection fails
  }

  return 'web';
}

/**
 * Platform-specific logger
 * Useful for debugging which code path is being executed
 */
export function logPlatform(message: string): void {
  const platform = getPlatform();
  console.log(`[${platform.toUpperCase()}] ${message}`);
}

/**
 * Returns true if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Returns true if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Returns true if running in web browser
 */
export function isWeb(): boolean {
  return getPlatform() === 'web';
}
