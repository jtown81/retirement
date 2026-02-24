# Revenue Strategy & Paywall Architecture Analysis

**Date**: 2026-02-24
**Author**: Architecture Team
**Status**: Decision Record — Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Web Advertising Monetization](#2-web-advertising-monetization)
3. [Premium Paywall Architecture](#3-premium-paywall-architecture)
4. [Mobile Ad Revenue Strategy](#4-mobile-ad-revenue-strategy)
5. [Unified User Management & Entitlements](#5-unified-user-management--entitlements)
6. [Risk Analysis](#6-risk-analysis)
7. [Scalability Outlook](#7-scalability-outlook)

---

## 1. Executive Summary

This document evaluates monetization strategies for a freemium federal retirement planning platform spanning web, Android, and iOS. The platform splits into:

- **Basic Tier (Free)**: FERS pension estimate, GS pay projection, simple TSP growth, basic visualization. Monetized via advertising on web; in-app ads on mobile.
- **Premium Tier (Paid)**: Monte Carlo simulations, expense modeling, RMD calculations, advanced projections, scenario modeling, tax optimization, advanced visualization. Revenue via subscription paywall.

**Recommended Stack**:
| Component | Recommendation |
|---|---|
| Web Ads | Google AdSense (with upgrade path to Ad Manager) |
| Premium Paywall | RevenueCat (cross-platform entitlement layer) |
| Mobile Ads | Google AdMob with mediation |
| Identity | Firebase Authentication (federated) |
| Receipt Validation | RevenueCat server-side (delegates to Apple/Google) |

---

## 2. Web Advertising Monetization

### 2.1 Evaluation Criteria

| Criterion | Weight | Rationale |
|---|---|---|
| Revenue Potential | 30% | Must justify development investment |
| Implementation Complexity | 20% | Single developer team; minimize integration overhead |
| Privacy Impact | 15% | Federal employees are privacy-conscious; government device policies |
| Compliance Risk | 15% | No federal data can be transmitted; COPPA/CCPA/GDPR considerations |
| Performance Impact | 10% | App is calculation-heavy; ads must not degrade simulation responsiveness |
| Long-term Scalability | 10% | Path to higher CPMs, direct advertiser relationships, programmatic |

### 2.2 Option A: Google AdSense (RECOMMENDED)

**Overview**: Google's self-serve ad platform. Contextual and interest-based ads. Automatic ad optimization.

| Factor | Assessment |
|---|---|
| **Revenue Potential** | Moderate. Finance niche CPMs: $3-8 for display, $8-15 for retirement/financial planning keywords. Federal employee niche is small but high-intent. Estimated $4-12 RPM for this content vertical. |
| **Implementation** | Minimal. Single `<script>` tag + ad unit `<div>` placement. Auto ads option requires zero layout work. Manual placement: 2-4 ad units (sidebar, between-sections, footer). Estimated effort: 4-8 hours. |
| **Privacy** | Moderate concern. Google collects browsing data for targeting. Mitigated: AdSense respects browser privacy signals (GPC, DNT). No app data is transmitted — ads are contextual to page content, not user financial data. Cookie consent banner required (GDPR/CCPA). |
| **Compliance** | Low risk. AdSense has built-in COPPA/GDPR compliance controls. Financial content is permitted but subject to Google's financial products policy. No PII from the app is shared with Google. All calculation data stays in localStorage. |
| **Performance** | Moderate impact. Ad scripts add 200-400ms to initial page load. Mitigated: async loading, lazy ad initialization after app hydration. Recharts rendering is client-side and unaffected after initial load. |
| **Scalability** | Strong. AdSense auto-optimizes. Upgrade path to Google Ad Manager for direct deals at >100K monthly pageviews. Header bidding integration possible via Ad Manager. |

**Why Recommended**: Lowest integration barrier, reasonable CPMs for finance niche, clear upgrade path, no server-side component needed for a client-only app. AdSense auto ads can even determine optimal placement. The privacy model aligns well — zero app data crosses the ad boundary because all retirement calculations happen in localStorage.

### 2.3 Option B: Mediavine

**Overview**: Premium ad management network. Higher CPMs. Requires minimum 50K monthly sessions.

| Factor | Assessment |
|---|---|
| **Revenue Potential** | High. RPMs of $15-30+ for finance content. Mediavine optimizes layout, formats, and demand partners automatically. Would generate 2-3x AdSense revenue at scale. |
| **Implementation** | Low-medium. Mediavine provides a script wrapper. However, they control ad placement and density — less control over UX. Dashboard integration could conflict with chart rendering. |
| **Privacy** | Higher concern. Mediavine runs multiple demand-side platforms (DSPs) and uses extensive cookie-based targeting. More third-party trackers than AdSense alone. |
| **Compliance** | Medium risk. Mediavine is IAB TCF 2.0 compliant but the number of data partners increases exposure surface. |
| **Performance** | Higher impact. Mediavine scripts are heavier (multiple demand partners loading). Reported 500-800ms added load time. For a calculation-heavy SPA, this is noticeable. |
| **Scalability** | Excellent at scale but **requires 50K monthly sessions minimum to qualify**. Not viable at launch. |

**Verdict**: Superior revenue at scale, but the 50K session threshold makes this a Phase 2 option. Recommend starting with AdSense and migrating to Mediavine when traffic qualifies.

### 2.4 Option C: Carbon Ads / EthicalAds

**Overview**: Developer-focused, privacy-respecting ad networks. Single static ad placement. No tracking cookies.

| Factor | Assessment |
|---|---|
| **Revenue Potential** | Low. CPMs of $1-4. Single ad unit per page. Revenue ceiling is substantially lower than AdSense. Estimated $50-200/month even at moderate traffic. |
| **Implementation** | Trivial. Single `<div>` embed. No tracking scripts. 1-2 hours. |
| **Privacy** | Excellent. No cookies, no tracking, contextual only. Aligns perfectly with federal employee privacy expectations. |
| **Compliance** | Minimal risk. No PII collection, no cookie consent needed, no GDPR/CCPA exposure. |
| **Performance** | Negligible. Single lightweight request. <50ms impact. |
| **Scalability** | Limited. Fixed CPM, no optimization path, no programmatic. Revenue grows linearly with traffic only. |

**Verdict**: Best privacy story but insufficient revenue for a serious monetization strategy. Could serve as a supplementary placement (single sidebar ad) alongside AdSense for developer-audience visitors. Not viable as primary strategy.

### 2.5 Comparative Matrix

| Criterion (Weight) | AdSense | Mediavine | Carbon/Ethical |
|---|---|---|---|
| Revenue Potential (30%) | 7/10 | 9/10 | 3/10 |
| Implementation (20%) | 9/10 | 7/10 | 10/10 |
| Privacy Impact (15%) | 6/10 | 4/10 | 10/10 |
| Compliance Risk (15%) | 8/10 | 6/10 | 10/10 |
| Performance (10%) | 7/10 | 5/10 | 10/10 |
| Scalability (10%) | 8/10 | 9/10 | 4/10 |
| **Weighted Score** | **7.45** | **6.85** | **6.90** |

**Decision: Google AdSense** as primary monetization. Migrate to Mediavine or Google Ad Manager when traffic exceeds 50K monthly sessions.

### 2.6 Implementation Specification

```
Ad Placement Strategy (Basic Tier Web):

┌──────────────────────────────────────────┐
│  Header / Nav Bar (NO ADS)               │
├──────────────────────────────────────────┤
│                                          │
│  [Form Content / Dashboard]              │
│                                          │
│  ─── Ad Unit 1: Leaderboard (728x90) ─── │  ← Between form sections
│                                          │
│  [Continued Content]                     │
│                                          │
├──────────────────────────────────────────┤
│  [Sidebar: Ad Unit 2 (300x250)]         │  ← Desktop only, beside charts
├──────────────────────────────────────────┤
│  Footer: Ad Unit 3 (Anchor/Sticky)       │  ← Mobile-friendly bottom bar
└──────────────────────────────────────────┘

Rules:
- Maximum 3 ad units per page view
- No ads inside active form inputs (UX protection)
- No ads on Premium tier (removed immediately on upgrade)
- Lazy-load ads after React hydration (defer to requestIdleCallback)
- Respect prefers-reduced-motion for animated ad formats
```

---

## 3. Premium Paywall Architecture

### 3.1 Evaluation Criteria

| Criterion | Weight | Rationale |
|---|---|---|
| Cross-Platform Support | 25% | Must work on Web + iOS + Android simultaneously |
| Implementation Complexity | 20% | No backend server exists today; minimize new infrastructure |
| Security | 20% | Entitlement verification must resist client-side tampering |
| Subscription Lifecycle | 15% | Renewals, cancellations, grace periods, refunds, upgrades |
| Cost Structure | 10% | Revenue share, per-API-call costs, monthly minimums |
| Vendor Lock-in | 10% | Ability to migrate if needed |

### 3.2 Option A: RevenueCat (RECOMMENDED)

**Overview**: Cross-platform subscription infrastructure. Wraps Apple/Google/Stripe billing APIs. Server-side receipt validation. Entitlement management.

| Factor | Assessment |
|---|---|
| **Cross-Platform** | Excellent. Native SDKs for iOS, Android, web (via REST API + JS SDK). Single source of truth for entitlements across all platforms. If a user subscribes on iOS, their web session reflects Premium within seconds via webhook. |
| **Implementation** | Low-medium. No custom backend required — RevenueCat IS the backend. SDKs handle store communication, receipt validation, and entitlement checks. Web paywall: Stripe Checkout integration (RevenueCat manages the Stripe subscription lifecycle). Mobile: Native StoreKit/Google Billing wrappers. Estimated effort: 40-60 hours total (web + iOS + Android). |
| **Security** | Strong. Server-side receipt validation. Entitlements are verified against RevenueCat's backend, not client-side tokens alone. API keys are publishable (safe for client apps) — write operations require secret keys. Webhook verification with HMAC signatures. |
| **Subscription Lifecycle** | Comprehensive. Auto-renewal tracking, grace period handling (Apple: 16 days, Google: configurable), billing retry, cancellation detection, refund webhooks, promotional offers, introductory pricing, upgrade/downgrade proration. All handled by RevenueCat — zero custom logic needed. |
| **Cost** | Free up to $2.5K MTR (monthly tracked revenue). Then 1% of tracked revenue (capped at enterprise tier). No per-API-call fees. No minimum commitments. |
| **Vendor Lock-in** | Moderate. RevenueCat stores entitlement state. Migration requires rebuilding receipt validation. However, raw receipts are accessible for export. The alternative (building custom) is 10x the effort. |

**Why Recommended**: RevenueCat eliminates the most complex part of subscription billing — cross-platform entitlement synchronization. Building this from scratch requires a custom server, receipt validation logic for both Apple and Google (both are underdocumented and frequently change), webhook handling, and race condition management during grace periods. RevenueCat encapsulates all of this. The free tier covers initial launch easily.

### 3.3 Option B: Custom Server + Stripe + Store Receipts

**Overview**: Build a Node.js/Express backend. Use Stripe for web billing. Validate Apple/Google receipts server-side. Manage entitlements in PostgreSQL.

| Factor | Assessment |
|---|---|
| **Cross-Platform** | Full control. But requires building three separate integrations: Stripe (web), StoreKit 2 (iOS), Google Play Billing Library v6 (Android). Each has distinct validation flows. |
| **Implementation** | High. Requires: Express server, PostgreSQL database, Stripe integration, Apple Server-to-Server notifications, Google Real-Time Developer Notifications, JWT token generation, entitlement cache, webhook queue. Estimated: 200-300 hours. Ongoing maintenance: Apple changes receipt format yearly. Google migrated from AIDL to Billing Library v5→v6. |
| **Security** | Highest (if implemented correctly). Full control over validation logic. But: single point of failure. Bugs in receipt validation = revenue leakage or false lockouts. |
| **Subscription Lifecycle** | Must be built manually. Grace periods, billing retries, cancellation-pending states, family sharing, promotional pricing — each requires custom logic. Estimated 60+ edge cases. |
| **Cost** | Server hosting ($20-50/month), Stripe fees (2.9% + $0.30 per transaction), developer time for maintenance. |
| **Vendor Lock-in** | None (you own everything). But: you also maintain everything. |

**Verdict**: Maximum flexibility and control, but the implementation cost is 5-8x higher than RevenueCat. Only justified at >$50K MRR where the 1% RevenueCat fee exceeds custom server costs. Not viable for launch.

### 3.4 Option C: Stripe Billing Only (Web-First, Defer Mobile)

**Overview**: Use Stripe Checkout for web subscriptions. Defer mobile paywall to a later phase. Mobile users directed to web for subscription.

| Factor | Assessment |
|---|---|
| **Cross-Platform** | Partial. Web-only at launch. Mobile users must subscribe via web browser. Apple/Google store billing not integrated — subscribers manage via Stripe customer portal. |
| **Implementation** | Low. Stripe Checkout is well-documented. 20-30 hours for web paywall. But: iOS App Store requires in-app purchases for digital goods accessed within the app (App Review Guideline 3.1.1). Directing to web violates this policy. **This approach makes iOS approval impossible.** |
| **Security** | Good for web. Stripe handles PCI compliance. But no store receipt validation means mobile entitlements would rely on a web-issued JWT — susceptible to sharing/piracy. |
| **Subscription Lifecycle** | Stripe handles renewals, cancellations, invoicing. But no integration with Apple/Google subscription lifecycle (family sharing, promotional offers, ask-to-buy). |
| **Cost** | Stripe: 2.9% + $0.30. No additional infrastructure. Lowest total cost. |
| **Vendor Lock-in** | Low for web. But adding mobile later requires rearchitecting to add store billing. |

**Verdict**: Fastest path for web-only launch, but creates a dead end for mobile. Apple App Store policy makes this untenable for a cross-platform product. Not recommended.

### 3.5 Comparative Matrix

| Criterion (Weight) | RevenueCat | Custom Server | Stripe Only |
|---|---|---|---|
| Cross-Platform (25%) | 9/10 | 8/10 | 4/10 |
| Implementation (20%) | 8/10 | 3/10 | 9/10 |
| Security (20%) | 8/10 | 9/10 | 6/10 |
| Subscription Lifecycle (15%) | 10/10 | 6/10 | 7/10 |
| Cost (10%) | 8/10 | 5/10 | 9/10 |
| Vendor Lock-in (10%) | 6/10 | 10/10 | 7/10 |
| **Weighted Score** | **8.45** | **6.35** | **6.40** |

**Decision: RevenueCat** as cross-platform subscription infrastructure. Use Stripe as the web payment processor (RevenueCat integrates with Stripe natively).

### 3.6 Entitlement Architecture

```
Entitlement Verification Flow:

┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│  Web Client  │───▶│  RevenueCat  │◀───│  Stripe         │
│  (React)     │    │  REST API    │    │  (Web billing)  │
└─────────────┘    └──────┬───────┘    └─────────────────┘
                          │
┌─────────────┐           │            ┌─────────────────┐
│  iOS App     │───▶──────┤◀───────────│  App Store       │
│  (StoreKit)  │          │            │  (S2S Notifs)    │
└─────────────┘           │            └─────────────────┘
                          │
┌─────────────┐           │            ┌─────────────────┐
│  Android App │───▶──────┘◀───────────│  Google Play     │
│  (Billing)   │                       │  (RTDN)          │
└─────────────┘                        └─────────────────┘

Entitlement Check (Client-Side):
1. App calls RevenueCat SDK: getCustomerInfo()
2. SDK returns entitlements: { "premium": { isActive: true, expiresDate: "..." } }
3. App gates features based on entitlement presence
4. SDK caches entitlements locally for offline access
5. Webhook updates entitlements in real-time (renewal, cancellation, refund)

Feature Gating (Frontend):
- isPremium = customerInfo.entitlements.active["premium"] !== undefined
- Premium components: { isPremium ? <AdvancedChart /> : <UpgradePrompt /> }
- Calculation modules: No gating (pure functions run regardless; only UI is gated)
- Storage: Premium data keys still saved locally (allows grace period access)
```

---

## 4. Mobile Ad Revenue Strategy

### 4.1 Recommended Solution: Google AdMob with Mediation

**Why AdMob**: Native SDK for iOS and Android. Built-in mediation layer bids across 30+ ad networks (Meta Audience Network, Unity Ads, IronSource, etc.) to maximize fill rate and CPM. Free to use. Integrates with AdSense account for unified reporting.

### 4.2 Ad Format Strategy

| Placement | Format | When Shown | Premium Behavior |
|---|---|---|---|
| Dashboard bottom | Banner (320x50) | Always visible on Basic tier | Removed |
| Between form sections | Native ad (in-feed) | After saving a form section | Removed |
| Chart unlock | Interstitial | Before showing Dashboard (max 1/session) | Removed |
| Leave calendar export | Rewarded (optional) | "Watch ad to export CSV" | Removed (export always available) |

### 4.3 SDK Structure

```
Mobile App Ad Architecture:

┌─────────────────────────────────────────────┐
│  App Layer (React Native / Capacitor)        │
│  ├─ AdManager singleton                      │
│  │   ├─ initialize(isPremium: boolean)       │
│  │   ├─ showBanner(placement: string)        │
│  │   ├─ showInterstitial(placement: string)  │
│  │   ├─ destroyAll()                         │  ← Called on premium upgrade
│  │   └─ isAdFree(): boolean                  │
│  │                                           │
│  └─ EntitlementListener                      │
│      ├─ onPremiumActivated → AdManager.destroyAll()
│      └─ onPremiumExpired → AdManager.initialize(false)
├─────────────────────────────────────────────┤
│  AdMob SDK                                   │
│  ├─ Mediation adapters (Meta, Unity, etc.)   │
│  ├─ Consent SDK (UMP for GDPR/ATT)          │
│  └─ Test ads in debug mode                   │
├─────────────────────────────────────────────┤
│  RevenueCat SDK                              │
│  ├─ Entitlement check (cached offline)       │
│  └─ Listener for entitlement changes         │
└─────────────────────────────────────────────┘
```

### 4.4 Entitlement Sync for Ad Removal

```
Ad Removal Flow:

1. User subscribes (App Store / Google Play / Stripe)
2. Store sends receipt → RevenueCat validates
3. RevenueCat updates entitlement: premium = active
4. Client SDK receives listener callback
5. AdManager.destroyAll() — removes all ad views
6. App persists isPremium = true in local cache
7. On next launch: check cache first (instant), then verify with RevenueCat

Offline Behavior:
- If cached isPremium = true: no ads shown (trust cache for 7 days)
- If cache expired and no network: show ads (fail-safe to ad-supported)
- RevenueCat SDK handles grace period detection automatically
- Apple 16-day billing grace period: keep premium during retry
```

### 4.5 Privacy & Compliance

| Requirement | Implementation |
|---|---|
| **Apple ATT (App Tracking Transparency)** | Display ATT prompt before initializing AdMob. If user declines: AdMob serves contextual ads only (lower CPM but compliant). SKAdNetwork attribution preserved. |
| **Google Play User Data Policy** | Declare ad SDKs in Data Safety section. No financial data shared with ad networks — all retirement data stays on-device. |
| **GDPR (EU users)** | Google UMP (User Messaging Platform) SDK for consent. TCF 2.0 compliant consent string passed to all mediation partners. |
| **CCPA (California)** | Respect "Do Not Sell" signal. AdMob's restricted data processing mode. |
| **Federal Employee Sensitivity** | Zero retirement data transmitted to ad networks. Ads are contextual to app category (finance), not to user's financial inputs. localStorage data never leaves the device. |

### 4.6 Store Compliance

| Store | Requirement | Implementation |
|---|---|---|
| **Apple App Store** | In-app purchases required for premium features | Use StoreKit 2 via RevenueCat SDK |
| **Apple App Store** | No directing to web for purchases | Paywall UI is native, uses StoreKit |
| **Apple App Store** | 30% commission (15% for Small Business Program <$1M) | Enroll in Small Business Program at launch |
| **Google Play** | Google Play Billing Library required | Use Billing Library v6 via RevenueCat |
| **Google Play** | 15% commission on first $1M | Automatic via Play Console |
| **Both** | Subscription auto-renewal disclosure | Required text on paywall screen |
| **Both** | Restore purchases button required | RevenueCat SDK: restorePurchases() |

---

## 5. Unified User Management & Entitlements

### 5.1 Identity Provider: Firebase Authentication

**Why Firebase Auth**:
- Native SDKs for web, iOS, Android
- Supports: email/password, Google Sign-In, Apple Sign-In (required by Apple for apps with any sign-in)
- Free tier: unlimited authentications
- Integrates with RevenueCat via Firebase User ID as the app_user_id
- No custom auth server needed

**Token Strategy**: Firebase ID Tokens (JWT)

```
Token Architecture:

Firebase Auth
  │
  ├─ Issues: Firebase ID Token (JWT, 1-hour expiry)
  │   ├─ Claims: { sub: "firebase-uid", email, email_verified, ... }
  │   └─ Verified by: Firebase Admin SDK (server) or client SDK (client)
  │
  ├─ Issues: Refresh Token (long-lived, rotated)
  │   └─ Used by SDK to auto-refresh ID Token silently
  │
  └─ Custom Claims (optional, set server-side):
      └─ { premium: true, tier: "premium", expiresAt: "2027-02-24" }
      └─ Used for server-side feature gating if custom API added later

RevenueCat Integration:
  1. On sign-in: RevenueCat.logIn(firebaseUID)
  2. RevenueCat associates all subscriptions with this UID
  3. Cross-device: sign in on new device → RevenueCat returns entitlements
  4. Cross-platform: iOS subscription visible on web via same UID
```

### 5.2 Server-Side Receipt Validation Flow

```
Receipt Validation (Handled by RevenueCat):

iOS Purchase:
  App → StoreKit 2 → Receipt → RevenueCat SDK → RevenueCat Server
    → Apple verifyReceipt API (App Store Server API v2)
    → Entitlement granted → Webhook fired → Client updated

Google Purchase:
  App → Billing Library → Purchase Token → RevenueCat SDK → RevenueCat Server
    → Google Play Developer API (purchases.subscriptions.get)
    → Entitlement granted → Webhook fired → Client updated

Web Purchase (Stripe):
  Browser → Stripe Checkout → Payment success → Stripe webhook → RevenueCat
    → Entitlement granted → Client polls or webhook → Client updated

Fraud Prevention:
  - RevenueCat validates every receipt server-side (not client-side)
  - Duplicate receipt detection (same receipt used on multiple accounts)
  - Subscription sharing detection (one account on >5 devices)
  - Refund detection via Apple/Google webhooks → entitlement revoked
```

### 5.3 Database Schema

Even though the app is currently local-only, a user management layer requires a minimal server-side schema. This can be a managed service (Firebase Firestore) rather than a custom database.

```
Firestore Collections:

users/{firebaseUID}
  ├─ email: string
  ├─ createdAt: timestamp
  ├─ lastLoginAt: timestamp
  ├─ platform: "web" | "ios" | "android"
  ├─ revenueCatId: string (same as firebaseUID)
  └─ preferences: {
       theme: "light" | "dark",
       notifications: boolean
     }

subscriptions/{firebaseUID}        (Read-only mirror of RevenueCat state)
  ├─ tier: "free" | "premium"
  ├─ isActive: boolean
  ├─ store: "app_store" | "play_store" | "stripe"
  ├─ productId: string
  ├─ purchaseDate: timestamp
  ├─ expiresDate: timestamp
  ├─ willRenew: boolean
  ├─ billingIssue: boolean         (grace period flag)
  └─ originalPurchaseDate: timestamp

audit_log/{autoId}                  (Append-only)
  ├─ userId: string
  ├─ event: "subscription_started" | "renewed" | "cancelled" |
  │         "refunded" | "billing_issue" | "grace_period_expired" |
  │         "upgraded" | "downgraded" | "restored"
  ├─ timestamp: timestamp
  ├─ store: string
  ├─ productId: string
  ├─ metadata: map (receipt snippet, error codes)
  └─ source: "webhook" | "client" | "admin"
```

### 5.4 Webhook Handling

```
RevenueCat Webhook → Cloud Function / API Endpoint:

Events handled:
  ├─ INITIAL_PURCHASE → Create subscription doc, log audit event
  ├─ RENEWAL → Update expiresDate, log
  ├─ CANCELLATION → Set willRenew: false, log (still active until expiry)
  ├─ BILLING_ISSUE_DETECTED → Set billingIssue: true, log
  ├─ SUBSCRIBER_ALIAS → Merge accounts (cross-platform sync)
  ├─ PRODUCT_CHANGE → Update productId (upgrade/downgrade), log
  ├─ REFUND → Revoke entitlement immediately, log
  └─ EXPIRATION → Set isActive: false, tier: "free", log

Verification:
  - Webhook authenticated via RevenueCat shared secret in Authorization header
  - Idempotency: webhook events include event_id; deduplicate on receipt
  - Retry: RevenueCat retries failed webhooks with exponential backoff

Grace Period Handling:
  - Apple: 16-day grace period for billing retry
  - Google: Configurable (default 7 days)
  - During grace: billingIssue = true, isActive = true (user retains access)
  - On resolution: billingIssue = false, expiresDate updated
  - On expiration: isActive = false, tier = "free", ads re-enabled
```

### 5.5 Fraud Prevention Strategy

| Threat | Mitigation |
|---|---|
| Receipt replay (reuse on multiple accounts) | RevenueCat rejects duplicate receipts across app_user_ids |
| Account sharing | Rate limit: max 5 devices per account; alert at 3+ concurrent |
| Client-side entitlement tampering | Entitlements verified server-side on each app launch; local cache is convenience only |
| Refund abuse | Track refund rate per user; flag accounts with >2 refunds in 90 days |
| Jailbreak/root bypass | Verify receipt server-side (not locally); never trust client-only premium flags |
| Stolen credentials | Firebase Auth supports MFA; rate-limit login attempts |

### 5.6 Upgrade/Downgrade Handling

```
Upgrade (Basic → Premium):
  1. User taps "Upgrade" on paywall screen
  2. Store payment sheet presented (native)
  3. On success: RevenueCat grants "premium" entitlement immediately
  4. Client receives callback → UI updates (ads removed, features unlocked)
  5. Webhook logs INITIAL_PURCHASE event

Downgrade (Premium → Basic, on cancellation expiry):
  1. User cancels subscription
  2. RevenueCat fires CANCELLATION webhook → willRenew = false
  3. User retains premium until expiresDate
  4. On expiresDate: EXPIRATION webhook → isActive = false
  5. Client detects on next getCustomerInfo() → UI reverts (ads shown, features locked)
  6. Premium data remains in localStorage (not deleted — available on re-subscribe)

Cross-Platform Upgrade:
  1. User subscribes on iOS
  2. Signs into web with same Firebase UID
  3. Web calls RevenueCat: getCustomerInfo(firebaseUID)
  4. Returns premium entitlement (originally from iOS)
  5. Web unlocks premium features
  6. No separate web subscription needed
```

---

## 6. Risk Analysis

### 6.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| RevenueCat downtime blocks purchases | Low | High | Local entitlement cache (7-day grace). Webhook retry. Status page monitoring. |
| Apple App Store rejection | Medium | High | Follow App Review Guidelines precisely. Use StoreKit 2. Include restore purchases. Test on TestFlight before submission. |
| Ad SDK crashes on older devices | Medium | Medium | Crash reporting (Sentry). Conditional ad loading based on device capability. |
| Firebase Auth migration needed later | Low | Medium | Firebase UIDs are stable. Export path exists. Auth is a thin layer. |
| GDPR enforcement action | Low | High | Implement consent before any tracking. Use CMP (Consent Management Platform). Document data flows. |

### 6.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Low conversion rate (free→premium) | High | High | Ensure Basic tier provides genuine value (builds trust). Premium upgrade prompts at natural decision points (e.g., "See your tax-optimized projection →"). Target 2-5% conversion rate. |
| Apple/Google commission erodes margins | Certain | Medium | Enroll in Small Business Programs (15% rate). Web subscriptions via Stripe (2.9% only) for users who start on web. |
| Ad revenue insufficient for Basic tier | Medium | Medium | Supplement with newsletter/affiliate (financial planning services, TSP advisory). Add non-intrusive affiliate links to TSP-related resources. |
| Federal employee backlash on ads | Medium | Medium | Minimal, tasteful ad placement. No ads inside form inputs. Clear "why ads?" explanation. Prominent upgrade CTA. |

---

## 7. Scalability Outlook

### 7.1 Revenue Growth Path

```
Phase 1 (Launch, 0-6 months):
  Revenue: $0-500/month
  ├─ AdSense on web Basic tier (low traffic)
  ├─ RevenueCat free tier (<$2.5K MTR)
  └─ Focus: Product quality, user acquisition

Phase 2 (Growth, 6-18 months):
  Revenue: $500-5K/month
  ├─ Mobile app launch (iOS + Android)
  ├─ AdMob with mediation (mobile ads)
  ├─ Premium subscriptions gaining traction
  └─ Consider: Mediavine migration if web traffic >50K sessions

Phase 3 (Scale, 18-36 months):
  Revenue: $5K-25K/month
  ├─ Upgrade to Google Ad Manager (header bidding)
  ├─ RevenueCat 1% fee kicks in (still <custom server cost)
  ├─ Consider: Annual subscription discount (20% off)
  ├─ Consider: Lifetime license option
  └─ Consider: Employer/agency bulk licensing

Phase 4 (SaaS Conversion, 36+ months):
  Revenue: $25K+/month
  ├─ Custom backend replaces localStorage (cloud sync)
  ├─ Agency dashboard (HR/benefits administrators)
  ├─ API access for financial advisors
  ├─ Evaluate: Replace RevenueCat with custom billing (savings at scale)
  └─ Evaluate: Enterprise tier with SSO/SAML
```

### 7.2 Future SaaS Considerations

The current localStorage architecture is the primary scaling constraint. Migration path:

1. **Cloud Sync Layer**: Add optional Firebase Firestore sync alongside localStorage. User data mirrors to cloud when signed in. Local-first, cloud-optional.
2. **Shared Scenarios**: Allow users to share scenarios via URL (read-only export to Firestore doc).
3. **Financial Advisor Portal**: Separate web app reading from shared Firestore. Premium-only feature.
4. **Agency Licensing**: Multi-seat subscriptions with admin console. Managed via RevenueCat's customer groups or custom Stripe portal.

---

## Appendix: Pricing Recommendation

| Plan | Price | Billing | Notes |
|---|---|---|---|
| Basic | Free | N/A | Ad-supported (web + mobile) |
| Premium Monthly | $9.99/month | Auto-renewing | Full feature access, no ads |
| Premium Annual | $79.99/year ($6.67/month) | Auto-renewing | 33% savings vs monthly |
| Premium Lifetime | $199.99 | One-time | No recurring billing; consider for early adopters |

**Justification**: Federal employee retirement planning tools range from $0 (spreadsheets) to $400+ (financial advisor consultation). $9.99/month positions below professional advice but above free tools, in a market where users make high-stakes financial decisions (retirement timing affects lifetime income by $100K+).

---

*End of Revenue Analysis*
