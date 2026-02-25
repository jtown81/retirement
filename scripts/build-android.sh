#!/bin/bash
# Android Build Script
# Builds web app and prepares Android project for Android Studio

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Federal Retirement Planner - Android Build ==="
echo ""

# Step 1: Build web app
echo "1️⃣  Building web app..."
cd "$PROJECT_ROOT/app"
pnpm build
echo "✓ Web build complete"
echo ""

# Step 2: Sync to Android
echo "2️⃣  Syncing to Android platform..."
cd "$PROJECT_ROOT"
if command -v cap &> /dev/null; then
    cap sync android
else
    pnpm dlx @capacitor/cli@latest sync android
fi
echo "✓ Android sync complete"
echo ""

# Step 3: Check Java/Gradle
echo "3️⃣  Checking Android environment..."
if ! command -v java &> /dev/null; then
    echo "❌ Java not installed. Install Java 11+ first"
    exit 1
fi
java_version=$(java -version 2>&1 | grep -oP 'version "\K[^"]+')
echo "✓ Java version: $java_version"

if [ ! -f "$PROJECT_ROOT/android/gradlew" ]; then
    echo "❌ Gradle wrapper not found"
    exit 1
fi
echo "✓ Gradle wrapper found"
echo ""

# Step 4: Build APK (optional - just prepare, don't build yet)
echo "4️⃣  Preparing Gradle build..."
cd "$PROJECT_ROOT/android"
./gradlew --version
echo "✓ Gradle ready"
echo ""

# Step 5: Summary
echo "=== Build Summary ==="
echo "✓ Web app built successfully"
echo "✓ Android platform synced"
echo "✓ Gradle and Java verified"
echo ""
echo "Next steps:"
echo "  1. Open Android Studio:"
echo "     pnpm dlx @capacitor/cli@latest open android"
echo "  2. Or manually:"
echo "     open -a Android\\ Studio $PROJECT_ROOT/android"
echo "  3. Wait for Gradle sync to complete"
echo "  4. Select emulator in device dropdown (top right)"
echo "  5. Click ▶ Play or 'Run app'"
echo ""
echo "Alternative: Build APK from command line:"
echo "  cd android && ./gradlew assembleDebug"
echo "  APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "✅ Android build preparation complete!"
