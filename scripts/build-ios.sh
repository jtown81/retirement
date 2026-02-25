#!/bin/bash
# iOS Build Script
# Builds web app and prepares iOS project for Xcode

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Federal Retirement Planner - iOS Build ==="
echo ""

# Step 1: Build web app
echo "1️⃣  Building web app..."
cd "$PROJECT_ROOT/app"
pnpm build
echo "✓ Web build complete"
echo ""

# Step 2: Sync to iOS
echo "2️⃣  Syncing to iOS platform..."
cd "$PROJECT_ROOT"
if command -v cap &> /dev/null; then
    cap sync ios
else
    pnpm dlx @capacitor/cli@latest sync ios
fi
echo "✓ iOS sync complete"
echo ""

# Step 3: Install CocoaPods dependencies
echo "3️⃣  Installing CocoaPods dependencies..."
if ! command -v pod &> /dev/null; then
    echo "❌ CocoaPods not installed. Install with:"
    echo "   sudo gem install cocoapods"
    exit 1
fi

cd "$PROJECT_ROOT/ios/App"
pod install
echo "✓ CocoaPods installed"
echo ""

# Step 4: Summary
echo "=== Build Summary ==="
echo "✓ Web app built successfully"
echo "✓ iOS platform synced"
echo "✓ CocoaPods dependencies installed"
echo ""
echo "Next steps:"
echo "  1. Open Xcode:"
echo "     pnpm dlx @capacitor/cli@latest open ios"
echo "  2. Or manually:"
echo "     open $PROJECT_ROOT/ios/App/App.xcworkspace"
echo "  3. Select simulator at top of Xcode"
echo "  4. Click ▶ Play button to build and run"
echo ""
echo "✅ iOS build preparation complete!"
