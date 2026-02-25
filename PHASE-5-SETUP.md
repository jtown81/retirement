# Phase 5: Mobile App Setup Guide

## Phase 5.1: Capacitor Scaffolding

This document provides step-by-step instructions for setting up Capacitor for iOS and Android development.

### Prerequisites

- **Node.js**: 22.0.0+ (currently using 20.19.2, which requires manual setup)
- **Xcode**: 15.0+ (for iOS development) - macOS only
- **Android Studio**: 2023.1+ (for Android development)
- **Capacitor CLI**: Installed via `@capacitor/cli` package
- **iOS Deployment Target**: 13.0+
- **Android Min SDK**: API 26+

### Project Structure

```
app-dev/retire/
├── app/
│   ├── src/                    # React + Astro source code
│   ├── dist/                   # Astro build output (web)
│   ├── package.json            # Contains Capacitor packages
│   └── [new] src/auth/         # Auth hooks (Phase 5.2)
│       ├── firebase.ts         # Web Firebase SDK
│       ├── firebase-mobile.ts  # Mobile Firebase via Capacitor
│       └── platform-detector.ts
│
├── capacitor.config.ts         # Capacitor configuration (NEW)
├── ios/                        # iOS Xcode project (To be generated)
│   ├── App/                    # Xcode workspace
│   ├── Podfile                 # CocoaPods dependencies
│   └── *.xcworkspace           # Xcode workspace file
│
└── android/                    # Android project (To be generated)
    ├── app/                    # Android module
    ├── build.gradle            # Gradle build config
    └── settings.gradle         # Gradle settings
```

### Setup Steps

#### Step 1: Update Node.js (Recommended)

Capacitor CLI requires Node 22.0.0+. You can either:

**Option A: Update Node.js** (recommended)
```bash
# Using nvm (Node Version Manager)
nvm install 22
nvm use 22

# Or install directly from nodejs.org
# https://nodejs.org/ → Download LTS version
```

**Option B: Use older Capacitor** (if Node.js 22 not available)
```bash
# Downgrade to Capacitor 7.x which supports Node 20
pnpm add --save-dev @capacitor/cli@7
pnpm add --save-dev @capacitor/core@7
```

#### Step 2: Build Web App

First, build the Astro app to generate `dist/` directory:

```bash
cd app-dev/retire/app
pnpm build
```

Output: `app/dist/` contains `index.html` and static assets

#### Step 3: Add iOS Platform

From project root (`app-dev/retire/`):

```bash
# Initialize Capacitor (first time only)
pnpm --package=@capacitor/cli dlx capacitor add ios

# Or if using installed CLI:
cd app && pnpm dlx cap add ios && cd ..
```

This generates:
- `ios/App/` — Xcode project
- `ios/App/App.xcworkspace` — Open this in Xcode
- `Podfile` — CocoaPods dependencies
- Platform-specific configuration

#### Step 4: Add Android Platform

```bash
# From project root
pnpm --package=@capacitor/cli dlx capacitor add android

# Or if using installed CLI:
cd app && pnpm dlx cap add android && cd ..
```

This generates:
- `android/app/` — Android module
- `android/build.gradle` — Gradle configuration
- `gradle/` — Gradle wrapper
- Platform-specific configuration

#### Step 5: Sync Web Build to Platforms

After making changes to web code, sync to native platforms:

```bash
# From app/ directory
pnpm mobile:build

# Or manually:
cd app && pnpm build
pnpm dlx cap sync
```

This copies `dist/` contents to:
- `ios/App/public/` (iOS)
- `android/app/src/main/assets/public/` (Android)

### Configuration

#### `capacitor.config.ts` (Root)

Located at `/home/jpl/app-dev/retire/capacitor.config.ts`

Key properties:
- `appId`: `com.fedplan.retire` — Bundle ID for iOS/Android
- `appName`: `Federal Retirement Planner` — Display name
- `webDir`: `app/dist` — Location of web build output
- `ios.scheme`: `FedRetirePlanner` — Xcode scheme name
- `plugins`: Configuration for Capacitor plugins

#### `.env.local` (App Directory)

Create `app/.env.local` with platform-specific variables:

```bash
# Firebase (same as web)
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...

# RevenueCat
PUBLIC_REVENUECAT_API_KEY=...

# AdMob (Phase 5.4)
PUBLIC_ADMOB_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~zzzzzzzzzz
PUBLIC_ADMOB_BANNER_UNIT=ca-app-pub-3940256099942544/6300978111

# iOS-specific (optional)
IOS_TEAM_ID=XXXXXXXXXX

# Android-specific (optional)
ANDROID_KEYSTORE_PASSWORD=...
```

### Build & Run

#### iOS

1. Open Xcode:
   ```bash
   pnpm mobile:ios
   ```

2. Or manually:
   ```bash
   open ios/App/App.xcworkspace
   ```

3. In Xcode:
   - Select `App` scheme (top left)
   - Select simulator or device
   - Click ▶ Play button to build and run

4. On device:
   - Connect iOS device via USB
   - Select device in Xcode
   - Click Play

#### Android

1. Open Android Studio:
   ```bash
   pnpm mobile:android
   ```

2. Or manually:
   ```bash
   open -a Android\ Studio android/
   ```

3. In Android Studio:
   - Wait for Gradle sync
   - Select `app` module
   - Click ▶ Play or `Run 'app'`
   - Select emulator or device

4. Command line:
   ```bash
   cd android
   ./gradlew build
   ./gradlew installDebug
   ```

### Troubleshooting

#### Issue: "Node version too low"
**Solution**: Update Node to 22+ or downgrade Capacitor to 7.x

#### Issue: CocoaPods dependencies fail (iOS)
**Solution**: Update CocoaPods
```bash
sudo gem install cocoapods --pre
cd ios/App
pod update
pod install
```

#### Issue: Gradle sync fails (Android)
**Solution**: Update Gradle wrapper
```bash
cd android
./gradlew wrapper --gradle-version=8.5
```

#### Issue: "App cannot find dist/" files
**Solution**: Run `pnpm mobile:build` to sync web build to native platforms

### Next Steps

- **Phase 5.2**: Firebase Authentication (mobile)
- **Phase 5.3**: RevenueCat Integration (mobile)
- **Phase 5.4**: Google AdMob (mobile)
- **Phase 5.5**: App Features (icons, splash, deeplinks)
- **Phase 5.6**: Platform Testing
- **Phase 5.7**: App Store/Play Store Submission

### References

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Xcode Requirements](https://developer.apple.com/xcode/)
- [Android Studio Requirements](https://developer.android.com/studio)

### Quick Reference: Commands

```bash
# Development
cd app
pnpm build                  # Build web app
pnpm mobile:build           # Build + sync
pnpm mobile:ios             # Open iOS in Xcode
pnpm mobile:android         # Open Android in Android Studio
pnpm mobile:sync            # Sync changes without rebuild

# Testing
pnpm test                   # Run web tests (still works)
pnpm typecheck              # TypeScript check

# Build (native)
# iOS: Build in Xcode (Product → Build)
# Android: Build in Android Studio (Build → Make Project)
```
