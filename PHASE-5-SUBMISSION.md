# Phase 5.7: App Store & Play Store Submission

## Overview

Phase 5.7 prepares the app for official distribution on Apple App Store (iOS) and Google Play Store (Android). This includes creating app listings, legal documents, release builds, and navigating the review process.

**Timeline**: 3-4 weeks (review queues vary)
**Key Milestone**: App available to all U.S. federal employees

---

## Pre-Submission Checklist

### Code Quality
- [ ] All 789 tests passing (`pnpm test`)
- [ ] TypeScript typecheck clean (`pnpm typecheck`)
- [ ] Production build succeeds (`pnpm build`)
- [ ] No console errors or warnings
- [ ] No hardcoded credentials or API keys
- [ ] Proper error handling and fallbacks
- [ ] Offline functionality verified

### App Metadata
- [ ] App name finalized: "Federal Retirement Planner"
- [ ] Short description ready (max 30 characters)
- [ ] Full description ready (up to 4000 characters)
- [ ] Keywords/tags finalized (up to 100 characters)
- [ ] Support email address available
- [ ] Privacy policy written and hosted
- [ ] Terms of service written and hosted
- [ ] Screenshots prepared (iOS: 5-10, Android: 5-8)

### Assets
- [ ] App icons (1024×1024 PNG)
- [ ] Screenshots (various device sizes)
- [ ] Feature graphic (for Google Play)
- [ ] App preview video (optional, 15-30 seconds)

### Accounts & Credentials
- [ ] Apple Developer account created ($99/year)
- [ ] Google Play Developer account created ($25 one-time)
- [ ] Apple ID with 2-factor authentication
- [ ] Google account with strong password
- [ ] App store passwords/credentials securely stored

---

## Part 1: iOS App Store Submission

### 1.1 Create Apple Developer Account

**Website**: https://developer.apple.com/

1. Click "Account" → "Create Apple ID"
2. Enter email and create password
3. Verify email
4. Accept Developer Agreement and Restrictions
5. Enroll in Apple Developer Program ($99/year)
6. Complete payment

**Note**: Takes 24-48 hours for account activation.

### 1.2 Create App in App Store Connect

**Website**: https://appstoreconnect.apple.com/

1. Sign in with Apple ID
2. Click "Apps" → "Create New App"
3. Select platform: "iOS"
4. Fill in:
   - **App Name**: "Federal Retirement Planner"
   - **Bundle ID**: `com.fedplan.retire` (must match Capacitor config)
   - **SKU**: `fedplan-retire-001`
   - **Primary Language**: "English"
   - **Category**: "Finance"
   - **User Type**: Select appropriate category

### 1.3 Create Release Build

```bash
# Step 1: Update version in Capacitor config
# capacitor.config.ts
const config: CapacitorConfig = {
  appName: 'Federal Retirement Planner',
  appId: 'com.fedplan.retire',
  // ... other config
};

# Step 2: Build web app
cd app
pnpm build
cd ..

# Step 3: Update iOS build number
# Edit ios/App/App/Info.plist or use Xcode

# Step 4: Open in Xcode
pnpm dlx @capacitor/cli@latest open ios

# In Xcode:
# 1. Select Generic iOS Device (top left)
# 2. Product → Archive
# 3. Wait for archive to complete (2-5 minutes)
# 4. Xcode Organizer opens automatically
# 5. Click "Distribute App"
```

### 1.4 Create App Store Certificates

In Xcode:
1. Preferences → Accounts
2. Select Apple ID
3. Manage Certificates
4. Create App Store distribution certificate (if not exists)
5. Create provisioning profile for App Store

**Or via Apple Developer Console**:
1. Go to Certificates, Identifiers & Profiles
2. Create App ID: `com.fedplan.retire`
3. Create distribution certificate
4. Create provisioning profile (type: "App Store")
5. Download and install

### 1.5 Sign & Submit Build

In Xcode Organizer after Archive:
1. Click "Distribute App"
2. Select "App Store Connect"
3. Select "Upload"
4. Select Team (your Apple Developer account)
5. Select signing certificate
6. Upload completes

### 1.6 Complete App Store Listing

In App Store Connect:

**Pricing & Availability**:
- [ ] Price Tier: Free
- [ ] Availability: United States (or worldwide)
- [ ] Release Date: Immediate or future date

**App Information**:
- [ ] App Icon: 1024×1024 PNG
- [ ] Category: Finance
- [ ] Content Rating: Complete questionnaire

**Screenshots** (for each device type):
- [ ] iPhone 6.7" (e.g., iPhone 15 Pro Max): 1290×2796
- [ ] iPhone 5.5" (e.g., iPhone SE): 1125×2436
- [ ] iPad (optional): 2048×2732

**Description**:
```
Official retirement planning calculator for U.S. Federal Employees.

Features:
• Personalized FERS/TSP projections
• Career events and leave tracking
• Advanced Monte Carlo simulations
• Tax modeling and IRMAA calculations
• Offline capability
• Light and dark themes

Privacy-focused: All calculations run locally. No data collected.

Developed for federal employees by federal employees.
```

**Keyword Tags**:
```
retirement, federal employee, FERS, TSP, pension, planning, finance, calculator
```

**Support URL**:
```
https://github.com/jtown81/retirement (or custom support site)
```

**Privacy Policy URL**:
```
https://your-domain.com/privacy (must be HTTPS)
```

### 1.7 Submit for Review

1. In App Store Connect, click "Submit for Review"
2. Answer App Review information questions:
   - Does your app use encryption? (if HTTPS: Yes)
   - Does it access user data? (No - local only)
   - Sign the export compliance form
3. Click "Submit"
4. Check email for submission confirmation

**Expected Review Time**: 24-48 hours

### 1.8 Monitor Review Status

In App Store Connect:
- View status: "Waiting for Review" → "In Review" → "Ready for Sale"
- Check for rejection reasons (if any)
- Respond to reviewer comments
- Resubmit if rejected (fix issues and reupload)

**Common Rejection Reasons**:
- Missing or invalid privacy policy
- Crash on launch
- Misleading app description
- Doesn't match preview screenshots
- Missing required info

---

## Part 2: Google Play Store Submission

### 2.1 Create Google Play Developer Account

**Website**: https://play.google.com/console/

1. Sign in with Google account
2. Accept Developer Agreement
3. Pay one-time $25 fee
4. Add developer profile information:
   - Developer name: "Federal Plan"
   - Email: your email
   - Website: your website (optional)
5. Complete setup

### 2.2 Create App in Play Console

1. Click "Create app"
2. App name: "Federal Retirement Planner"
3. Default language: English
4. App or game: "App"
5. Free or paid: "Free"
6. Declarations:
   - No children's features
   - Not restricted content
7. Click "Create app"

### 2.3 Create Release Build (APK)

```bash
# Step 1: Build web app
cd app
pnpm build
cd ..

# Step 2: Sync to Android
pnpm dlx @capacitor/cli@latest sync android

# Step 3: Create keystore for signing
keytool -genkey -v -keystore fedretire.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias fedplan \
  -dname "CN=Federal Plan,O=Federal Plan,L=USA,C=US"

# Answer prompts:
# - Password: (strong password - save in secure location!)
# - Re-enter password: (confirm)

# Step 4: Build release APK
cd android
./gradlew assembleRelease \
  -Dorg.gradle.jvmargs="-Xmx4096m" \
  -Pandroid.injected.signing.store.file=../fedretire.keystore \
  -Pandroid.injected.signing.store.password=YOUR_PASSWORD \
  -Pandroid.injected.signing.key.alias=fedplan \
  -Pandroid.injected.signing.key.password=YOUR_PASSWORD

cd ..

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### 2.4 Create Signing Key

If you don't have a keystore:

```bash
# Create new keystore
keytool -genkey -v \
  -keystore release-key.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias fedplan

# Answer:
# Enter keystore password: (create strong password)
# What is your first and last name? Federal Plan
# What is your organizational unit? Development
# What is your organization? Federal Plan
# What is the name of your City or Locality? USA
# What is the name of your State or Province? USA
# What is the two-letter country code for this unit? US
# Is this correct? yes
# Enter key password: (same or different - usually same)
```

**⚠️ IMPORTANT**: Save keystore file and password in secure location. You'll need it for all future app updates.

### 2.5 Upload APK to Play Store

In Play Console:

1. Left sidebar → "Release" → "Production"
2. Click "Create new release"
3. Upload APK file (android/app/build/outputs/apk/release/app-release.apk)
4. Fill in "Release notes":
   ```
   Version 1.0 - Initial Release

   Federal Retirement Planner helps U.S. federal employees plan their retirement with accurate FERS/TSP projections, career tracking, and advanced simulations.

   Features:
   • Personalized retirement projections
   • Career events and leave tracking
   • Monte Carlo simulations
   • Tax modeling
   • Offline capability
   ```
5. Click "Next"

### 2.6 Complete Play Store Listing

**App details**:
- [ ] App title: "Federal Retirement Planner"
- [ ] Short description (max 80 chars): "FERS/TSP retirement calculator for federal employees"
- [ ] Full description (max 4000 chars): [See template below]

**Category & Content Rating**:
- [ ] Category: "Finance"
- [ ] Content rating: Complete questionnaire
  - Violence: No
  - Sexual content: No
  - Adult content: No
  - Gambling: No
  - High risk financial interest: Yes (disclosure)
- [ ] Rating: Usually "Moderate" for finance apps

**Screenshots** (for each device):
- [ ] Phone (9:16 aspect ratio): 1080×1920
- [ ] Tablet (4:3 aspect ratio): 1536×2048 (optional)
- [ ] Upload 2-8 screenshots showing key features

**Feature Graphic**:
- [ ] Size: 1024×500 PNG
- [ ] Shows app key features and branding

**Video Teaser** (optional):
- [ ] 15-30 second MP4
- [ ] Showcases app functionality

**Privacy Policy**:
- [ ] Must link to full privacy policy
- [ ] Must be HTTPS
- [ ] Must be publicly accessible

**Target Audience**:
- [ ] Intended audience: Adults (professional use)
- [ ] Not intended for children

### 2.7 Submit for Review

1. In Play Store listing, check all sections are complete
2. Review section shows checklist of requirements
3. Click "Review" button
4. Accept "Managed Google Play Accounts for Work" (if applicable)
5. Click "Submit"

**Expected Review Time**: 2-4 hours (Google Play is faster than Apple)

### 2.8 Monitor Review Status

In Play Console:
- View status: "Submitted" → "In review" → "Published"
- App immediately available once approved
- No need for scheduled release

**Common Rejection Reasons**:
- Crashes on startup
- Missing or broken privacy policy link
- Misleading screenshots/description
- Finance app without proper disclosures
- Malware detected

---

## Part 3: Legal Documents

### Privacy Policy Template

```markdown
# Privacy Policy

**Effective Date**: [DATE]

## Overview
Federal Retirement Planner ("App") is committed to protecting your privacy.

## Data Collection
- All calculations run locally on your device
- No personal data is sent to our servers
- No tracking or analytics
- No third-party data sharing

## Data Storage
- All data stored locally on device (localStorage)
- Data never leaves your device
- You can clear all data anytime

## Permissions (Mobile)
- Camera: Not used
- Location: Not used
- Contacts: Not used
- Calendar: Not used
- Health: Not used

## Third-Party Services
- Firebase: User authentication only (optional sign-in)
- RevenueCat: Premium subscription management
- Google AdSense/AdMob: Advertising (basic tier only)

## Your Rights
- You own your data
- Delete data anytime by clearing app storage
- No forced data collection

## Contact
Email: [SUPPORT_EMAIL]

## Changes
We may update this policy. Check this page for updates.
```

### Terms of Service Template

```markdown
# Terms of Service

**Effective Date**: [DATE]

## 1. Acceptance of Terms
By using Federal Retirement Planner, you accept these terms.

## 2. Use License
The App is provided for personal financial planning only.

## 3. Disclaimer
- Calculations are estimates only
- Not professional financial advice
- Consult a financial advisor
- Results may not match actual retirement
- Dependent on accurate input data

## 4. Limitation of Liability
WE PROVIDE THE APP "AS IS" WITHOUT WARRANTY.
WE ARE NOT LIABLE FOR LOSSES OR DAMAGES.

## 5. Modifications
We reserve the right to modify the App or Terms.

## 6. Termination
We may terminate access for violations of these terms.

## 7. Federal Disclaimers
This App is not affiliated with:
- Office of Personnel Management (OPM)
- Federal Employees Retirement System (FERS)
- Thrift Savings Plan (TSP)
- U.S. Federal Government

## 8. Contact
Email: [SUPPORT_EMAIL]
```

---

## Part 4: App Description Templates

### Apple App Store Description

```
Official retirement planning calculator for U.S. Federal Employees.

FEATURES:
• Personalized FERS/TSP Projections: Simulate your federal retirement with accurate calculations based on your career timeline
• Career Events Tracking: Track GS grades, steps, locality pay changes, and military buybacks
• Advanced Simulations: Monte Carlo analysis, tax modeling, and IRMAA calculations (Premium)
• Leave Balance Management: Track annual, sick, and carryover leave with retirement credit calculations
• Tax Planning: Model Social Security benefits, federal deductions, and state taxes
• TSP Investment Analysis: Compare Traditional vs Roth TSP strategies with projections
• Offline Capability: All calculations run locally—no internet required
• Dark Mode Support: Easy on the eyes in any lighting
• Scenario Planning: Save and compare multiple retirement scenarios
• Export Results: Download projections as CSV or Excel

HIGHLIGHTS:
✓ No Data Collection: All calculations run locally. Your data never leaves your device.
✓ Accurate Formulas: Based on OPM FERS Handbook and official federal regulations
✓ Easy to Use: Intuitive interface designed for federal employees
✓ Free Tier: Core features available for all users
✓ Optional Premium: Advanced simulations and tax modeling for deeper analysis

PERFECT FOR:
• Federal employees planning retirement
• Those evaluating retirement timing options
• Employees modeling career changes
• Anyone planning their federal retirement

DISCLAIMER:
This calculator provides estimates based on the input you provide. For official information, consult OPM resources and a qualified financial advisor. Results may not match actual retirement benefits.

Privacy First: We don't collect or share your data. Everything stays on your device.

Developed by federal employees, for federal employees.
```

### Google Play Store Description

```
Federal Retirement Planner - FERS/TSP Retirement Calculator

Plan your federal retirement with confidence.

Federal Retirement Planner is the official calculator for U.S. federal employees planning their FERS (Federal Employees Retirement System) and TSP (Thrift Savings Plan) retirement.

CORE FEATURES:
☐ FERS Retirement Projections: Calculate your annuity based on years of service and salary
☐ High-3 Calculation: Automatic computation of your highest 3-year average
☐ Career Event Timeline: Track GS grades, steps, locality pay, promotions, and military buybacks
☐ Leave Balance Tracking: Monitor annual leave, sick leave, and carryover balances with retirement credit
☐ TSP Projections: Model Traditional and Roth TSP balances with agency match
☐ Scenario Management: Save multiple retirement scenarios and compare outcomes
☐ Export & Share: Download your projections as CSV for spreadsheet analysis

PREMIUM FEATURES (Optional Subscription):
→ Advanced Simulations: Monte Carlo analysis for conservative, moderate, and optimistic scenarios
→ Tax Modeling: Federal and state tax calculations, Social Security coordination, IRMAA analysis
→ Detailed Projections: Monthly breakdowns from retirement through age 95
→ Multi-Scenario Comparison: Side-by-side analysis of different retirement strategies

KEY BENEFITS:
✓ All-Local Calculation: No data uploaded—calculations run 100% on your device
✓ OPM Compliant: Based on official FERS Handbook formulas and regulations
✓ Easy Data Entry: Intuitive forms guide you through career and financial info
✓ Beautiful Charts: Visual representations of retirement income and expenses
✓ Dark Mode: Comfortable viewing in any lighting condition
✓ Offline Mode: Works without internet connection

WHO SHOULD USE THIS:
• Federal employees evaluating retirement timing
• Those planning early retirement or medical separation
• Employees modeling career changes or promotions
• Anyone who wants to understand their federal pension

IMPORTANT DISCLAIMER:
This calculator provides estimates based on information you provide. It is not official OPM guidance. For definitive answers, consult:
• Office of Personnel Management (OPM.gov)
• Your agency HR department
• A qualified financial advisor

Your Privacy Matters:
• Zero data collection or sharing
• All calculations local to your device
• No ads on premium features
• Optional sign-in for premium

Developed by federal employees who understand your retirement needs.
```

---

## Part 5: Release Build & Optimization

### iOS Release Build Checklist

```bash
# Update version
# Edit ios/App/App/Info.plist or use Xcode Build Settings
# CFBundleShortVersionString: "1.0" (app version)
# CFBundleVersion: "1" (build number)

# Optimize for App Store
# In Xcode: Product → Scheme → Edit Scheme
# Release scheme:
# - Build Configuration: Release
# - Enable code stripping
# - Enable dead code stripping
# - Optimization Level: Optimize for Size [-Os]

# Create archive
xcodebuild archive \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/Release.xcarchive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath build/Release.xcarchive \
  -exportOptionsPlist exportOptions.plist \
  -exportPath build/
```

### Android Release Build Optimization

```bash
# Update version in build.gradle
# android {
#   versionCode 1        # increment for each release
#   versionName "1.0"    # semantic versioning
# }

# Build optimized release APK
./gradlew assembleRelease \
  -Dorg.gradle.jvmargs="-Xmx4096m" \
  --enable-all-experiments

# Optimize APK size
# In build.gradle, add:
# android {
#   packagingOptions {
#     exclude 'META-INF/proguard/androidx-*.pro'
#   }
# }
# buildTypes {
#   release {
#     minifyEnabled true
#     shrinkResources true
#     proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
#   }
# }

# APK built at: android/app/build/outputs/apk/release/app-release.apk
```

---

## Part 6: Post-Submission Monitoring

### Update Status Regularly

**iOS (Apple App Store)**:
- Check App Store Connect daily during review
- Average: 24-48 hours
- Monitor for rejection reasons
- Respond to developer questions promptly

**Android (Google Play)**:
- Check Play Console daily
- Average: 2-4 hours
- May be auto-approved if no policy violations
- Can push updates immediately after approval

### Monitor User Reviews

**First Week**:
- [ ] Check daily reviews
- [ ] Respond to negative reviews professionally
- [ ] Address common crashes or issues
- [ ] Monitor crash reporting

**Ongoing**:
- [ ] Maintain 4.0+ star rating
- [ ] Respond to all feedback
- [ ] Plan updates for common feature requests
- [ ] Keep app current with OS updates

---

## Part 7: Update & Maintenance Strategy

### Version Numbering

**Semantic Versioning**: MAJOR.MINOR.PATCH

```
1.0.0  - Initial Release
1.1.0  - New features
1.1.1  - Bug fixes
2.0.0  - Major redesign
```

### Update Frequency

- **Critical bugs**: 1-2 weeks
- **Features**: Monthly
- **Polish/minor fixes**: Quarterly
- **OS compatibility**: As needed

### Testing Before Release

```bash
# Full test before each release
pnpm typecheck   # TypeScript
pnpm test        # Unit tests
pnpm build       # Production build
pnpm test:scenarios  # Spreadsheet parity

# Manual testing on 3+ devices
# Review changelog
# Update version numbers
# Build release APKs/IPAs
```

---

## Part 8: Common Issues & Solutions

### App Rejection

**Issue**: App rejected for crashes
- **Solution**: Enable crash reporting in Xcode/Android Studio, fix bugs, resubmit

**Issue**: Missing privacy policy
- **Solution**: Host privacy policy on HTTPS domain, add URL to app store listing

**Issue**: Misleading description
- **Solution**: Ensure description matches actual functionality, update screenshots

**Issue**: Finance app without proper disclosure
- **Solution**: Add disclaimer in description: "Estimates only. Not professional advice."

### App Store Distribution

**Issue**: App not showing in search
- **Solution**: Give it 24-48 hours, check keywords/category are correct

**Issue**: User can't find app
- **Solution**: Share app store link via QR code, direct link, or search by full name

---

## Checklist: Ready to Submit

### Code & Testing
- [ ] All 789 tests passing
- [ ] TypeScript clean
- [ ] Build succeeds
- [ ] Tested on iOS simulator/device
- [ ] Tested on Android emulator/device
- [ ] No crashes observed
- [ ] Offline mode works
- [ ] All features functional

### App Store Metadata
- [ ] App name: "Federal Retirement Planner"
- [ ] Short description (max 30 chars)
- [ ] Full description (4000 chars)
- [ ] Keywords/tags finalized
- [ ] Category: Finance
- [ ] Privacy policy link (HTTPS)
- [ ] Screenshots (5-10 for each store)
- [ ] Support email specified

### Legal Documents
- [ ] Privacy policy written
- [ ] Terms of service written
- [ ] Hosted on HTTPS domains
- [ ] URLs verified working

### Release Build
- [ ] iOS: Archive created, signed, validated
- [ ] Android: APK built, signed with keystore
- [ ] Version numbers updated
- [ ] Build numbers incremented

### Developer Accounts
- [ ] Apple Developer account active ($99 paid)
- [ ] Google Play account active ($25 paid)
- [ ] Certificates and provisioning profiles created
- [ ] Keystore backed up in secure location
- [ ] Passwords securely stored

### Final Check
- [ ] README updated with app store links
- [ ] Support email staffed
- [ ] Monitoring plan established
- [ ] Update strategy defined

---

## Timeline Estimate

| Task | Duration | Cumulative |
|------|----------|-----------|
| Create developer accounts | 1-2 days | 1-2 days |
| Build release binaries | 1 day | 2-3 days |
| Create app listings | 1-2 days | 3-5 days |
| Submit iOS | 1 day | 4-6 days |
| iOS review (wait) | 1-3 days | 5-9 days |
| Submit Android | 1 day | 5-10 days |
| Android review (wait) | 0-1 days | 5-11 days |
| **Total** | **~2 weeks** | |

---

## Success Criteria

- [ ] App successfully published on iOS App Store
- [ ] App successfully published on Google Play Store
- [ ] App searchable and discoverable
- [ ] First 100 downloads within 1 week
- [ ] 4.0+ star average rating
- [ ] No critical bugs reported
- [ ] Support email responding to users
- [ ] Monitoring system in place

---

## References

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [iOS App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Capacitor iOS Deployment](https://capacitorjs.com/docs/ios)
- [Capacitor Android Deployment](https://capacitorjs.com/docs/android)
