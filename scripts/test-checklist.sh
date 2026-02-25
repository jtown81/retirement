#!/bin/bash
# Phase 5.6 Testing Checklist
# Interactive checklist for manual testing on iOS/Android

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
SKIPPED=0

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

# Function to ask yes/no question
ask_test() {
    local test_name=$1
    local test_description=$2

    echo -e "${YELLOW}TEST:${NC} $test_name"
    echo "      $test_description"
    echo -n "Did this pass? (y/n/s for skip): "
    read -r response

    case $response in
        [yY])
            echo -e "${GREEN}✓ PASSED${NC}"
            ((PASSED++))
            ;;
        [nN])
            echo -e "${RED}✗ FAILED${NC}"
            ((FAILED++))
            ;;
        [sS])
            echo -e "${YELLOW}⊘ SKIPPED${NC}"
            ((SKIPPED++))
            ;;
        *)
            echo "Invalid input. Skipping..."
            ((SKIPPED++))
            ;;
    esac
    echo ""
}

# Main testing
clear
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Phase 5.6: Platform Testing Checklist                 ║"
echo "║  Federal Retirement Planner - Mobile App                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

print_section "STARTUP & SPLASH SCREEN"
ask_test "App Launch" "App launches without crashes"
ask_test "Splash Screen" "Splash screen displays for ~2 seconds then fades"
ask_test "Initial Render" "App UI loads and displays correctly"

print_section "FIREBASE AUTHENTICATION"
ask_test "Sign In Button" "Sign In button visible in header"
ask_test "Sign In Dialog" "Clicking sign-in opens dialog with tabs"
ask_test "Google Sign In" "Can sign in with Google account"
ask_test "Email Sign In" "Can sign in with email/password"
ask_test "User Avatar" "User email displays in header avatar with initials"
ask_test "Sign Out" "User can sign out and returns to signed-in state"

print_section "TIER-GATED FEATURES"
ask_test "Basic Tier Forms" "All 4 basic forms visible (FERS, Career, Expenses, TSP Monitor)"
ask_test "Locked Premium Forms" "Simulation and Tax forms show lock icon"
ask_test "Upgrade Prompt" "Clicking locked tab shows upgrade prompt"
ask_test "Basic Dashboard" "Basic tier shows 5-metric simplified dashboard"
ask_test "Premium Dashboard" "Premium tier shows full 6-chart advanced dashboard"
ask_test "No Ads Premium" "Premium tier users see no ads"

print_section "REVENUECAT INTEGRATION"
ask_test "Premium Purchase" "Can complete premium purchase workflow"
ask_test "Tier Update" "Tier updates to premium after purchase"
ask_test "Premium Features" "Premium forms become accessible after purchase"
ask_test "Offline Support" "App works offline with cached entitlements"

print_section "ADVERTISEMENTS"
ask_test "Basic Tier Ads" "Basic tier users see ads"
ask_test "Ad Display" "Ads display without blocking content"
ask_test "Mobile Banner" "Mobile: Bottom banner ad visible (if applicable)"
ask_test "No Premium Ads" "Premium users see no ads"

print_section "DEEPLINKS"
ask_test "Scenario Deeplink" "fedretire://scenarios/test navigates to scenarios tab"
ask_test "Cold Start Deeplink" "Opening deeplink while app closed opens to correct section"
ask_test "Foreground Deeplink" "Deeplink while app running navigates correctly"

print_section "FORMS & DATA ENTRY"
ask_test "FERS Form Entry" "Can enter data in FERS Estimate form"
ask_test "Career Events" "Can add and manage career events"
ask_test "Expense Categories" "Can enter expense categories"
ask_test "Data Persistence" "Form data persists after closing/reopening app"

print_section "DASHBOARD & CHARTS"
ask_test "Chart Rendering" "All charts render without errors"
ask_test "Chart Interaction" "Charts are interactive (hover, tooltips)"
ask_test "Responsive Design" "Charts responsive on mobile screens"
ask_test "Metric Cards" "Summary metric cards display correctly"

print_section "SCENARIO MANAGEMENT"
ask_test "Save Scenario" "Can save named scenarios"
ask_test "Load Scenario" "Can load and restore scenarios"
ask_test "Scenario List" "Scenario list displays correctly"
ask_test "Scenario Limit" "Basic tier limited to 1 scenario (with warning)"

print_section "USER INTERFACE"
ask_test "Theme Toggle" "Can toggle between light/dark themes"
ask_test "Theme Persistence" "Theme selection persists after close"
ask_test "Tab Navigation" "Tab navigation responsive and smooth"
ask_test "Mobile Layout" "Layout responsive on mobile screen sizes"
ask_test "Keyboard" "On-screen keyboard appears/disappears correctly"

print_section "ERROR HANDLING"
ask_test "Network Error" "Graceful error handling when network unavailable"
ask_test "Validation Error" "Form validation errors display correctly"
ask_test "Error Recovery" "Can recover from errors and retry"

print_section "PERFORMANCE"
ask_test "Startup Time" "App visible within 3 seconds"
ask_test "Smooth Scrolling" "Scrolling and animations smooth (no jank)"
ask_test "Memory Usage" "App doesn't consume excessive memory"

print_section "ACCESSIBILITY"
ask_test "Color Contrast" "Text readable with good contrast"
ask_test "Button Sizes" "Buttons large enough for touch (44pt+)"
ask_test "Form Labels" "All form inputs have clear labels"

# Final summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TESTING SUMMARY                                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Passed:${NC}  $PASSED"
echo -e "${RED}Failed:${NC}  $FAILED"
echo -e "${YELLOW}Skipped:${NC} $SKIPPED"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "Pass rate: ${GREEN}${PASS_RATE}%${NC}"
fi

echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Tests failed. Review failures above and fix issues.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed! Ready for app store submission.${NC}"
    exit 0
fi
