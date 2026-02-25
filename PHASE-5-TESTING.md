# Phase 5.6: Platform Testing Guide

## Overview

Phase 5.6 validates that the mobile app works correctly on iOS and Android. This guide covers building, testing, and profiling the app on simulators and physical devices.

**Target**: All core features functional, no regressions, acceptable performance

---

## Prerequisites

### macOS (for iOS)
- macOS 13.0+ (Ventura or later)
- Xcode 15.0+ with iOS SDK
- CocoaPods 1.13+
- Ruby 2.7+ (for pod)

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
```

### Windows/Mac (for Android)
- Android Studio 2023.1+
- Java 11+ (JDK)
- Android SDK (API 26+)
- Android Emulator or physical device

```bash
# Set environment variables (macOS)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Verify installation
sdkmanager --list
```

---

## Build Instructions

### iOS Build

#### Step 1: Update Node Version (if needed)

Phase 5.1 requires Node 22+ for Capacitor CLI. Check your current version:

```bash
node --version
```

If Node 20: Use installed @capacitor/cli directly without CLI version check.

#### Step 2: Build Web App

```bash
cd app
pnpm build
cd ..
```

Output: `app/dist/` contains static HTML/CSS/JS

#### Step 3: Sync to iOS Platform

```bash
# From project root
pnpm dlx @capacitor/cli@latest sync ios

# Or if CLI already installed in workspace
cd app && pnpm dlx cap sync && cd ..
```

This copies `app/dist/` to `ios/App/public/`.

#### Step 4: Install iOS Dependencies

```bash
cd ios/App
pod install
cd ../..
```

#### Step 5: Open in Xcode

```bash
pnpm dlx @capacitor/cli@latest open ios

# Or manually
open ios/App/App.xcworkspace
```

⚠️ **IMPORTANT**: Open `.xcworkspace` file, NOT `.xcodeproj`

#### Step 6: Build & Run

In Xcode:
1. Select simulator at top (e.g., "iPhone 15 Pro")
2. Click ▶ Play button
3. Wait for app to build (2-5 minutes first build)
4. Simulator launches with app

---

### Android Build

#### Step 1: Build Web App

```bash
cd app
pnpm build
cd ..
```

#### Step 2: Sync to Android Platform

```bash
cd app && pnpm dlx cap sync && cd ..
```

This copies `app/dist/` to `android/app/src/main/assets/public/`.

#### Step 3: Open in Android Studio

```bash
pnpm dlx @capacitor/cli@latest open android

# Or manually
open -a Android\ Studio android/
```

#### Step 4: Build & Run

In Android Studio:
1. Wait for Gradle sync to complete
2. Select emulator in device dropdown (top right)
3. Click ▶ Play or `Run 'app'`
4. Emulator launches with app (2-10 minutes first build)

---

## Testing Checklist

### 1. App Startup & Splash Screen ✓

**iOS**:
- [ ] App launches
- [ ] Splash screen shows for ~2 seconds
- [ ] Splash fades to app UI
- [ ] No crashes

**Android**:
- [ ] App launches
- [ ] Splash screen shows for ~2 seconds
- [ ] Splash fades to app UI
- [ ] No crashes

**Verification**:
```bash
# Check system logs
# iOS: Xcode console
# Android: Android Studio logcat filter "retire" or "PlannerApp"
```

### 2. Firebase Authentication ✓

**Sign In Flow**:
- [ ] "Sign In" button visible in header
- [ ] Click sign-in button → dialog opens
- [ ] Google sign-in tab available
- [ ] Apple sign-in tab available (iOS only)
- [ ] Email sign-in tab available
- [ ] Can switch between tabs

**Google Sign-In**:
- [ ] Click Google tab
- [ ] System browser opens
- [ ] Can enter Google credentials
- [ ] Returns to app after auth
- [ ] User email shows in header avatar
- [ ] Avatar initials correct

**Apple Sign-In** (iOS only):
- [ ] Click Apple tab
- [ ] System Apple auth prompt appears
- [ ] Can complete auth
- [ ] Returns to app
- [ ] User info displays

**Email Sign-In**:
- [ ] Click Email tab
- [ ] "Sign in" or "Create account" toggle visible
- [ ] Can enter email and password
- [ ] Can create account (if new user)
- [ ] Can sign in (if existing user)
- [ ] User info displays on success

**Sign Out**:
- [ ] Click avatar menu
- [ ] "Sign out" option available
- [ ] Click sign-out
- [ ] User data clears
- [ ] Returns to "Sign In" button

### 3. Tier-Gated Features ✓

**Basic Tier** (signed in, not premium):
- [ ] "My Plan" tab: All basic forms visible
  - [ ] FERS Estimate
  - [ ] Career
  - [ ] Expenses
  - [ ] TSP Monitor
- [ ] "My Plan" tab: Premium forms locked
  - [ ] Simulation tab shows lock icon
  - [ ] Tax tab shows lock icon
  - [ ] Click locked tab → upgrade prompt
- [ ] Dashboard: Shows simplified 5-metric view (BasicDashboard)
  - [ ] No Monte Carlo simulation
  - [ ] No RMD compliance chart
- [ ] Ads visible on Basic tier:
  - [ ] Top banner ad visible
  - [ ] Mobile: Bottom sticky ad visible
- [ ] Export panel: "Excel Export" button disabled

**Premium Tier** (signed in, premium):
- [ ] Can purchase premium (RevenueCat workflow)
- [ ] "My Plan" tab: All forms unlocked
  - [ ] Simulation tab accessible
  - [ ] Tax tab accessible
- [ ] Dashboard: Shows full 6-chart premium view
  - [ ] Advanced charts visible
  - [ ] Monte Carlo results display
  - [ ] RMD compliance chart
- [ ] No ads shown (premium users)
- [ ] Export panel: All buttons enabled

### 4. RevenueCat Integration ✓

**Offline Behavior**:
- [ ] Disconnect network (airplane mode)
- [ ] Sign in (should fail gracefully)
- [ ] Cached tier used if available
- [ ] Reconnect network
- [ ] EntitlementCheck retries automatically

**Purchase Flow**:
- [ ] Click upgrade prompt → payment interface
- [ ] RevenueCat paywall shows products
- [ ] Can select subscription
- [ ] Payment processing visible
- [ ] Success returns to app
- [ ] Tier updates to premium
- [ ] Premium features unlock

**Restoration**:
- [ ] Sign in on different device
- [ ] Previous purchase detected
- [ ] Premium tier restored

### 5. Ads Display ✓

**Web/Desktop**:
- [ ] AdSense placeholder visible (dev mode)
- [ ] Production: Real ads served

**Mobile**:
- [ ] AdMob banner visible (dev mode)
- [ ] Production: Real ads served
- [ ] Basic tier: Ads show
- [ ] Premium tier: No ads
- [ ] Ads don't block content
- [ ] Scrolling works smoothly

### 6. Deeplinks ✓

**iOS**:
- [ ] Safari: `fedretire://scenarios/test-id` navigates to scenarios tab
- [ ] Safari: `fedretire://profile` logs navigation (future feature)
- [ ] Mail: Deeplink in email opens app and navigates

**Android**:
- [ ] Chrome: `fedretire://scenarios/test-id` navigates to scenarios tab
- [ ] Mail/SMS: Deeplink opens app and navigates

**Cold Start**:
- [ ] App closed
- [ ] Open deeplink from Safari/Chrome
- [ ] App launches and navigates to target section

### 7. Form Functionality ✓

**FERS Estimate Form**:
- [ ] Can enter personal info
- [ ] Can enter salary history
- [ ] Auto-calculation of High-3 works
- [ ] Save button persists data

**Career Events**:
- [ ] Can add career event
- [ ] Auto-salary computation works
- [ ] Date picker functions
- [ ] Remove event button works

**Expenses**:
- [ ] Can enter expense categories
- [ ] Calculations update dynamically
- [ ] Inflation rates configurable
- [ ] Saved data persists

**TSP Monitor** (Basic tier):
- [ ] Can import TSP snapshot
- [ ] Display updates correctly
- [ ] Data persists

**Simulation** (Premium only):
- [ ] Form renders correctly
- [ ] Sub-tabs accessible
- [ ] Parameters configurable
- [ ] Results display

### 8. Dashboard & Charts ✓

**Basic Tier**:
- [ ] 5 metric cards visible
- [ ] PayGrowth chart renders
- [ ] Charts are interactive
- [ ] Responsive on mobile

**Premium Tier**:
- [ ] 9 metric cards visible
- [ ] All 6 charts render:
  - [ ] Income Waterfall
  - [ ] TSP Lifecycle
  - [ ] Expense Phases
  - [ ] RMD Compliance
  - [ ] Pay Growth
  - [ ] Leave Balances
- [ ] Charts are interactive
- [ ] Tooltips work
- [ ] Responsive on mobile

### 9. Scenario Management ✓

**Save Scenario**:
- [ ] Can click "Save Scenario" button
- [ ] Dialog opens with name/description
- [ ] Can save scenario
- [ ] Success message displays

**Load Scenario**:
- [ ] Scenario list loads
- [ ] Can select scenario
- [ ] Data loads into form
- [ ] Dashboard updates

**Compare**:
- [ ] Can select multiple scenarios
- [ ] Compare view shows side-by-side
- [ ] Differences highlighted
- [ ] Premium feature: Export comparison

### 10. Storage & Persistence ✓

**Data Persistence**:
- [ ] Enter form data
- [ ] Close app (force quit)
- [ ] Reopen app
- [ ] Data still present

**Cross-Tab Sync** (if browser):
- [ ] Open app in two browser tabs
- [ ] Modify data in tab 1
- [ ] Tab 2 updates automatically (localStorage sync)

**Offline**:
- [ ] Disable network
- [ ] Use app normally
- [ ] All features work
- [ ] No error messages
- [ ] Reconnect network
- [ ] Data syncs

### 11. Theme Toggle ✓

**Light/Dark Mode**:
- [ ] Click theme button in header
- [ ] Interface switches theme
- [ ] Colors are readable (contrast OK)
- [ ] Charts update colors
- [ ] Setting persists after close

### 12. Keyboard & Navigation ✓

**Mobile Keyboard**:
- [ ] Click input field → keyboard appears
- [ ] Can type text
- [ ] Can dismiss keyboard (swipe down/tap outside)
- [ ] Form scrolls when keyboard active

**Navigation**:
- [ ] Tab switching responsive
- [ ] Back button works (Android)
- [ ] No UI jank or stuttering
- [ ] Animations smooth

### 13. Error Handling ✓

**Network Errors**:
- [ ] Disable network
- [ ] Try to fetch data
- [ ] Graceful error message
- [ ] Can retry
- [ ] Reconnect works

**Validation Errors**:
- [ ] Enter invalid email
- [ ] Submit form
- [ ] Error message displays
- [ ] Can correct and retry

**Crash Recovery**:
- [ ] Force crash (if possible)
- [ ] Error boundary catches it
- [ ] "Try again" button shows
- [ ] Can recover

---

## Performance Testing

### Startup Time

**Target**: App visible within 3 seconds

```bash
# iOS: Use Xcode profiler
# 1. Product → Profile
# 2. Select "System Trace"
# 3. Record startup
# 4. Check "App Launch" timeline

# Android: Use Android Profiler
# 1. View → Tool Windows → Profiler
# 2. Click record
# 3. Note app startup time
```

### Memory Usage

**Target**: < 150MB peak memory

```bash
# iOS: Xcode Memory Debugger
# Debug → View Memory Graph Hierarchy

# Android: Android Studio Memory Profiler
# View → Tool Windows → Profiler
# Record memory usage during app use
```

### Battery Usage

**Target**: Minimal background drain

```bash
# iOS: Settings → Battery → Developer → Low Power Mode
# Test app with low power mode enabled

# Android: Settings → Battery → Battery Saver
# Test app with battery saver enabled
```

---

## Automated Testing Scripts

### iOS Testing (via Xcode)

```bash
#!/bin/bash
# ios-test.sh - Build and test iOS app

set -e

echo "Building iOS app..."
cd app
pnpm build
cd ..

echo "Syncing to iOS..."
pnpm dlx @capacitor/cli@latest sync ios

echo "Installing pods..."
cd ios/App
pod install
cd ../..

echo "Building for simulator..."
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build

echo "iOS build complete!"
echo "To run in simulator:"
echo "  pnpm dlx @capacitor/cli@latest open ios"
```

### Android Testing (via Gradle)

```bash
#!/bin/bash
# android-test.sh - Build and test Android app

set -e

echo "Building Android app..."
cd app
pnpm build
cd ..

echo "Syncing to Android..."
pnpm dlx @capacitor/cli@latest sync android

echo "Building APK..."
cd android
./gradlew assembleDebug
cd ..

echo "Android APK built: android/app/build/outputs/apk/debug/app-debug.apk"
echo "To install on emulator/device:"
echo "  adb install android/app/build/outputs/apk/debug/app-debug.apk"
```

---

## Test Device Coverage

### Recommended Test Devices

| Device | iOS Version | Android Version | Notes |
|--------|------------|-----------------|-------|
| iPhone 15 Pro | 17+ | - | Latest flagship, notch |
| iPhone SE | 17+ | - | Older, no notch |
| iPad Pro | 17+ | - | Tablet, large screen |
| Pixel 8 | - | 14+ | Latest flagship |
| Samsung S24 | - | 14+ | Large AMOLED screen |
| OnePlus 12 | - | 14+ | Mid-range device |

### Emulator/Simulator Alternatives

| Platform | Emulator | Command |
|----------|----------|---------|
| **iOS** | iPhone 15 Pro Simulator | `xcrun simctl boot "iPhone 15 Pro"` |
| **iOS** | iPhone SE Simulator | `xcrun simctl boot "iPhone SE"` |
| **Android** | Pixel 8 Emulator | Via Android Studio Device Manager |
| **Android** | Samsung Emulator | Via Android Studio Device Manager |

---

## Troubleshooting

### iOS Build Fails

**Problem**: `Pod install` fails
**Solution**:
```bash
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..
```

**Problem**: Xcode complains about team signing
**Solution**:
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select `App` project in left sidebar
3. Select `App` target
4. Go to "Signing & Capabilities"
5. Set Team to your Apple Developer account

### Android Build Fails

**Problem**: Gradle sync fails
**Solution**:
```bash
cd android
./gradlew clean build
cd ..
```

**Problem**: SDK not found
**Solution**:
```bash
# Update SDK in Android Studio
# Tools → SDK Manager → Android 14 → Install
```

### App Crashes on Launch

**Problem**: `Error: Cannot find module '@capacitor/core'`
**Solution**:
```bash
cd app
pnpm install
pnpm build
pnpm dlx cap sync
```

**Problem**: `Firebase initialization error`
**Solution**:
1. Verify `.env.local` has Firebase credentials
2. Check `PUBLIC_FIREBASE_PROJECT_ID` matches Firebase project
3. Ensure Firebase project has iOS/Android apps registered

### App Shows Blank Screen

**Problem**: Web assets not loaded
**Solution**:
```bash
# Full rebuild
cd app && pnpm build && cd ..
pnpm dlx @capacitor/cli@latest sync
# Rebuild native app in Xcode/Android Studio
```

---

## Sign-Off Checklist

- [ ] iOS simulator: All features working
- [ ] Android emulator: All features working
- [ ] Startup time acceptable (< 3 seconds)
- [ ] Memory usage acceptable (< 150MB)
- [ ] No crashes or errors
- [ ] Deeplinks verified
- [ ] Auth flows tested
- [ ] Ads display correctly
- [ ] Theme switching works
- [ ] Offline mode functional
- [ ] Forms save/restore data
- [ ] Charts render correctly
- [ ] Responsiveness on mobile screens
- [ ] Keyboard handling smooth
- [ ] Error handling graceful
- [ ] All tests passing (789/789)

---

## Next Steps

After Phase 5.6 validation:
- **Phase 5.7**: Prepare App Store/Play Store submissions
- Document app store listings and screenshots
- Create privacy policy and terms of service
- Build release APK/IPA
- Submit to app stores for review

---

## References

- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [Android Studio Documentation](https://developer.android.com/studio)
