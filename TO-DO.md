# Implementation Roadmap: Platform Architecture Overhaul

**Last Updated**: 2026-02-24
**Status**: Phase 2 In Progress — Leave App Separation & Scaffolding
**Current Phase**: 2 (Leave App Separation) started 2026-02-24
**Scope**: Leave app separation, tiered retirement planning, monetization, mobile deployment

**Phase 1 Completion**: ✅ All validation gates passed (typecheck, tests 770/770, build successful)
**Reference**: [Revenue-Analysis.md](./Revenue-Analysis.md) for monetization strategy detail

---

## Architecture Overview

```
BEFORE (Monolith):
┌───────────────────────────────────────────┐
│  retire/app (Astro + React, localStorage) │
│  ├─ My Plan (FERS, Career, Expenses, Sim) │
│  ├─ Leave (Calendar, Accrual, Summary)    │
│  └─ Dashboard (6 charts, 9 cards, table)  │
└───────────────────────────────────────────┘

AFTER (Modular Platform):
┌────────────────────────────────────────────────────────────────────┐
│  Shared Packages (@fedplan/core)                                   │
│  ├─ @fedplan/career   (GS pay, grade/step, High-3)               │
│  ├─ @fedplan/leave    (accrual, sick, annual, retirement credit)  │
│  ├─ @fedplan/tsp      (projection, RMD, agency match)            │
│  ├─ @fedplan/expenses (categories, smile curve, inflation)        │
│  ├─ @fedplan/tax      (federal, state, IRMAA, SS taxation)       │
│  ├─ @fedplan/simulation (annuity, projection, Monte Carlo)       │
│  ├─ @fedplan/models   (TypeScript interfaces, Zod schemas)       │
│  └─ @fedplan/ui       (FormSection, FieldGroup, shared primitives)│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐   │
│  │  app-dev/leave/     │  │  app-dev/retire/                 │   │
│  │  (Standalone App)   │  │  (Retirement Planning App)       │   │
│  │                     │  │                                  │   │
│  │  Web: Free + Ads    │  │  Web: Basic (Free+Ads)           │   │
│  │  Mobile: Free + Ads │  │       Premium (Paid, no ads)     │   │
│  │  Premium: No Ads    │  │  Mobile: Basic + Ads / Premium   │   │
│  │                     │  │                                  │   │
│  │  Features:          │  │  Basic: FERS, Career, TSP simple │   │
│  │  - Leave calendar   │  │  Premium: Simulation, Tax, RMD,  │   │
│  │  - Accrual calc     │  │    Monte Carlo, Scenarios, Export │   │
│  │  - Sick/annual      │  │                                  │   │
│  │  - Federal holidays │  │                                  │   │
│  │  - Export           │  │                                  │   │
│  └─────────────────────┘  └──────────────────────────────────┘   │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  Infrastructure                                                    │
│  ├─ Firebase Auth (identity, cross-platform)                      │
│  ├─ RevenueCat (subscriptions, entitlements)                      │
│  ├─ Google AdSense / AdMob (ad monetization)                     │
│  └─ Firestore (user profiles, subscription mirror, audit log)    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Shared Package Extraction

**Goal**: Extract pure calculation modules into a pnpm workspace monorepo so both leave and retire apps consume shared logic without duplication.

**Duration**: 2-3 weeks
**Risk**: Medium (refactoring import paths across entire codebase)
**Prerequisite**: None

### 1.1 Convert to pnpm Workspace Monorepo

- [ ] Create `pnpm-workspace.yaml` at `app-dev/` root:
  ```yaml
  packages:
    - 'packages/*'
    - 'retire/app'
    - 'leave/app'
  ```
- [ ] Create `packages/` directory structure:
  ```
  app-dev/
    packages/
      core/          → @fedplan/core (barrel re-export)
      models/        → @fedplan/models
      career/        → @fedplan/career
      leave/         → @fedplan/leave
      tsp/           → @fedplan/tsp
      expenses/      → @fedplan/expenses
      tax/           → @fedplan/tax
      simulation/    → @fedplan/simulation
      ui/            → @fedplan/ui
    retire/app/      → existing app (consumes packages)
    leave/app/       → new standalone app (Phase 2)
  ```
- [ ] Each package gets: `package.json`, `tsconfig.json`, `src/index.ts` (barrel export)
- [ ] Packages are TypeScript-only (no bundling); consumed as workspace protocol (`workspace:*`)

### 1.2 Extract Calculation Modules

Move pure business logic from `retire/app/src/modules/` to workspace packages.

- [ ] **@fedplan/models** — Move `src/models/*.ts` (common, career, leave, tsp, expenses, simulation, tax, military, scenario). Add `src/storage/zod-schemas.ts` (Zod schemas mirror models). ~800 LOC.
- [ ] **@fedplan/career** — Move `src/modules/career/` (grade-step, locality, pay-calculator, scd, projection). Depends on: @fedplan/models. ~500 LOC.
- [ ] **@fedplan/leave** — Move `src/modules/leave/` (annual-leave, sick-leave, retirement-credit, simulate-year, calendar-utils, calendar-bridge). Depends on: @fedplan/models. ~617 LOC.
- [ ] **@fedplan/tsp** — Move `src/modules/tsp/` (traditional, roth, agency-match, rmd, future-value, import). Depends on: @fedplan/models. ~900 LOC.
- [ ] **@fedplan/expenses** — Move `src/modules/expenses/` (categories, smile-curve, inflation, projection). Depends on: @fedplan/models. ~350 LOC.
- [ ] **@fedplan/tax** — Move `src/modules/tax/` (federal, state, social-security, irmaa, brackets). Depends on: @fedplan/models. ~600 LOC.
- [ ] **@fedplan/simulation** — Move `src/modules/simulation/` (eligibility, annuity, income-projection, retirement-simulation, monte-carlo, scenario, scenario-comparison). Depends on: all above. ~1,665 LOC.
- [ ] **@fedplan/ui** — Move shared form components: FormSection, FieldGroup, FormErrorSummary, FormStateIndicator, TabCompletionBadge, Tabs/TabsList/TabsTrigger/TabsContent. ~300 LOC.

### 1.3 Move Static Data to Packages

- [ ] Move `src/data/gs-pay-tables.ts` → `@fedplan/career`
- [ ] Move `src/data/locality-rates.ts` → `@fedplan/career`
- [ ] Move `src/data/tsp-limits.ts` → `@fedplan/tsp`
- [ ] Move `src/data/federal-holidays.ts` → `@fedplan/leave`
- [ ] Keep `src/data/demo-fixture.ts` in retire app (app-specific)

### 1.4 Update Retire App Imports

- [ ] Replace all `@modules/career` → `@fedplan/career`
- [ ] Replace all `@modules/leave` → `@fedplan/leave`
- [ ] Replace all `@modules/tsp` → `@fedplan/tsp`
- [ ] Replace all `@modules/expenses` → `@fedplan/expenses`
- [ ] Replace all `@modules/tax` → `@fedplan/tax`
- [ ] Replace all `@modules/simulation` → `@fedplan/simulation`
- [ ] Replace all `@models/*` → `@fedplan/models`
- [ ] Update `tsconfig.json` paths to resolve workspace packages
- [ ] Update `vitest.config.ts` aliases

### 1.5 Migrate Tests

- [ ] Move unit tests alongside their packages (e.g., `packages/career/tests/`)
- [ ] Keep integration and scenario tests in `retire/app/tests/`
- [ ] Configure workspace-level `vitest.workspace.ts` for parallel test execution
- [ ] Verify: All 770 tests pass after migration

### 1.6 Validation Gate

- [ ] `pnpm -r test` — All package tests pass
- [ ] `pnpm -r typecheck` — Zero type errors across workspace
- [ ] `pnpm --filter retire build` — Retire app builds successfully
- [ ] Bundle size delta: < 5% increase (workspace overhead)

---

## Phase 2: Leave App Separation

**Goal**: Create standalone leave planning app at `app-dev/leave/` consuming `@fedplan/leave` and `@fedplan/ui` packages.

**Duration**: 2-3 weeks
**Risk**: Low (leave module is already architecturally independent)
**Prerequisite**: Phase 1 complete

### 2.1 Scaffold Leave App

- [ ] Create `app-dev/leave/app/` with Astro 5 + React 19 (same stack as retire)
- [ ] Copy Astro config, Tailwind config, Vitest config from retire app
- [ ] Add workspace dependencies: `@fedplan/leave`, `@fedplan/career`, `@fedplan/models`, `@fedplan/ui`
- [ ] Create `package.json` with `name: "@fedplan/leave-app"`

### 2.2 Move Leave Components

- [ ] Copy (not move — retire keeps its copy until Phase 2.4):
  - `LeaveBalanceForm.tsx` → leave app
  - `leave-calendar/` directory (all sub-components) → leave app
  - `LeaveBalanceSummaryViewer.tsx` → leave app
  - `useLeaveCalendar.ts` → leave app
- [ ] Adapt imports to use `@fedplan/leave` and `@fedplan/ui`
- [ ] Create `LeaveApp.tsx` — standalone shell (no My Plan / Dashboard tabs)
- [ ] Create `pages/index.astro` mounting `LeaveApp` via `client:load`

### 2.3 Leave App Features

- [ ] Full leave calendar (12-month grid, day cells, entry modal)
- [ ] Accrual rate configuration (4/6/8 hrs per pay period)
- [ ] Federal holiday integration (auto-populated)
- [ ] Sick/annual leave balance tracking
- [ ] Year-end carry-over projection
- [ ] Retirement credit calculation (sick leave → service years)
- [ ] Summary panel with table/chart toggle (from Phase Q)
- [ ] CSV export of leave balances
- [ ] Standalone localStorage keys (no `retire:` prefix — use `leave:` prefix)

### 2.4 Remove Leave from Retire App

- [ ] Remove Leave tab from AppShell navigation
- [ ] Remove `LeaveBalanceForm` and `leave-calendar/` components from retire app
- [ ] Remove `useLeaveCalendar` hook from retire app
- [ ] Keep `@fedplan/leave` package dependency (retire still uses leave module for service credit calculation in simulation)
- [ ] Update `useAssembleInput` to no longer require leave calendar data
- [ ] Update `useFormSections` to remove leave completion check
- [ ] Update Dashboard unlock logic (no longer requires leave section)

### 2.5 Dependency Isolation

```
Leave App Dependencies:
  @fedplan/leave       → accrual, calendar-bridge, simulate-year
  @fedplan/career      → SCD tracking (years of service for accrual rate)
  @fedplan/models      → LeaveBalance, CalendarLeaveEntry, common types
  @fedplan/ui          → FormSection, FieldGroup, Tabs
  recharts             → LeaveBalancesChart (pie charts in summary viewer)

NOT Needed by Leave App:
  @fedplan/tsp         → No TSP features
  @fedplan/expenses    → No expense modeling
  @fedplan/tax         → No tax modeling
  @fedplan/simulation  → No retirement simulation
```

### 2.6 Storage Separation

- [ ] Leave app uses `leave:` prefix for all localStorage keys
- [ ] Define `leave:calendar`, `leave:balance`, `leave:preferences` schemas
- [ ] No shared storage between retire and leave apps
- [ ] Each app manages its own schema versioning and migrations

### 2.7 Validation Gate

- [ ] Leave app builds and runs independently (`pnpm --filter leave dev`)
- [ ] All leave-specific tests pass
- [ ] Retire app builds without leave components
- [ ] Retire simulation still calculates service credit correctly (via @fedplan/leave package)

---

## Phase 3: Retirement Tier Segmentation (Basic/Premium Feature Gating)

**Goal**: Split retirement app UI into Basic (free) and Premium (paid) tiers. Calculation modules remain ungated.

**Duration**: 2-3 weeks
**Risk**: Medium (feature boundaries must be clean; no business logic leakage)
**Prerequisite**: Phase 1 complete (Phase 2 is parallel-safe)

### 3.1 Define Feature Registry

- [ ] Create `src/config/features.ts`:
  ```typescript
  export const FEATURE_TIERS = {
    basic: {
      fersEstimate: true,       // Personal, Salary, Annuity & SS, TSP basics
      careerTimeline: true,     // Career events, auto-salary
      expenseCategories: true,  // 10 categories, base inflation
      basicDashboard: true,     // PayGrowth, LeaveBalances, simple TSP, income table
      scenarioSave: true,       // Save 1 scenario (limit)
      csvExport: true,          // Basic CSV export
    },
    premium: {
      simulationConfig: true,   // Dual-pot TSP, advanced allocation, withdrawal strategy
      taxModeling: true,        // Federal, state, IRMAA
      smileCurve: true,         // GoGo/GoSlow/NoGo expense phases
      advancedDashboard: true,  // All 6 charts + 60-year projection table
      monteCarlo: true,         // Probabilistic simulation
      scenarioUnlimited: true,  // Unlimited scenarios + comparison
      excelExport: true,        // Excel multi-sheet + PDF export
      scenarioDiff: true,       // Side-by-side scenario comparison CSV
      tspMonitor: true,         // TSP snapshot import + tracking
    },
  } as const;
  ```

### 3.2 Create Entitlement Hook

- [ ] Create `src/hooks/useEntitlement.ts`:
  ```typescript
  export function useEntitlement(): {
    tier: 'basic' | 'premium';
    isPremium: boolean;
    isFeatureEnabled: (feature: keyof typeof FEATURE_TIERS.premium) => boolean;
    showUpgradePrompt: (feature: string) => void;
  }
  ```
- [ ] Initial implementation: read from `localStorage` key `retire:subscription`
- [ ] Later (Phase 5): integrate with RevenueCat SDK for server-validated entitlements

### 3.3 Create Upgrade Prompt Component

- [ ] Create `src/components/paywall/UpgradePrompt.tsx`:
  - Feature name and description
  - "Unlock Premium" CTA button
  - Preview of what the feature looks like (blurred screenshot or summary)
  - Clean, non-intrusive design (no dark patterns)
- [ ] Create `src/components/paywall/PremiumBadge.tsx`:
  - Small badge indicating premium-only features in navigation

### 3.4 Gate Premium UI Components

Apply feature gating at the **component level**, not the module level. Calculation modules never check tier.

- [ ] **FormShell.tsx**: Hide Simulation and Tax Profile tabs for Basic tier. Show `<UpgradePrompt>` in their place.
- [ ] **SimulationForm.tsx**: Wrap in premium gate. Basic users see upgrade prompt.
- [ ] **TaxProfileForm.tsx**: Wrap in premium gate.
- [ ] **Dashboard.tsx**: Basic tier sees 3 charts (PayGrowth, LeaveBalances, simple income table). Premium tier sees all 6 charts + ProjectionTable + 9 summary cards.
- [ ] **DashboardActions.tsx**: Excel export and Scenario Diff buttons gated to premium. CSV export available to all.
- [ ] **ScenarioManager**: Basic tier limited to 1 saved scenario. Premium unlimited.
- [ ] **MonteCarloFanChart**: Premium only.
- [ ] **TSPMonitorPanel**: Premium only.

### 3.5 Service Layer Separation

```
Architecture Guarantee: No Business Logic Gating

CORRECT (UI gating):
  FormShell.tsx:
    isPremium ? <SimulationForm /> : <UpgradePrompt feature="simulation" />

INCORRECT (logic gating — NEVER do this):
  retirement-simulation.ts:
    if (!isPremium) throw new Error("Premium required");

Why:
  - Modules are pure functions. They must not depend on entitlement state.
  - A Basic user's localStorage may contain SimulationConfig from a previous
    Premium trial. The module computes correctly; the UI simply doesn't show results.
  - This prevents data corruption and simplifies testing.
  - If the user upgrades, their data is immediately available — no re-entry needed.
```

### 3.6 Prevent Business Logic Leakage

- [ ] Add ESLint rule: `@fedplan/*` packages must not import from `src/hooks/useEntitlement`
- [ ] Add ESLint rule: `@fedplan/*` packages must not import `revenueCat` or `firebase`
- [ ] Code review checklist item: "Does this change add tier-checking inside a calculation module?"
- [ ] Test: Premium features work correctly when `retire:subscription` is manually set in localStorage (proves UI gating, not logic gating)

### 3.7 Basic Tier Dashboard

- [ ] Create `BasicDashboard.tsx` — simplified layout:
  - PayGrowthChart (salary progression with High-3)
  - Simple income vs expenses summary (annuity + TSP withdrawal vs base expenses)
  - 5 metric cards (retirement date, annual annuity, TSP at retirement, year-1 income, lifetime surplus)
  - "Unlock Advanced Projections" CTA leading to upgrade
- [ ] Reuse existing chart components (no duplication)
- [ ] Conditionally render based on `useEntitlement().isPremium`

### 3.8 Validation Gate

- [ ] Basic tier: all basic forms save correctly, basic dashboard renders
- [ ] Premium tier: all features accessible, no ads shown (placeholder for Phase 5)
- [ ] Tier switch: changing `retire:subscription` in localStorage immediately toggles UI
- [ ] No module tests reference entitlement state
- [ ] All 770+ tests pass (add ~20 new tier-gating tests)

---

## Phase 4: Infrastructure Setup (Auth, Entitlements, Ad SDK)

**Goal**: Set up Firebase Auth, RevenueCat, and Google AdSense/AdMob integration.

**Duration**: 3-4 weeks
**Risk**: High (external service integration, store compliance)
**Prerequisite**: Phase 3 complete

### 4.1 Firebase Authentication

- [ ] Create Firebase project (`fedplan-prod`, `fedplan-staging`)
- [ ] Enable auth providers: Email/Password, Google Sign-In, Apple Sign-In
- [ ] Install `firebase` SDK in retire app and leave app
- [ ] Create `src/auth/FirebaseProvider.tsx` — React context for auth state
- [ ] Create `src/auth/SignInDialog.tsx` — modal with provider buttons
- [ ] Create `src/auth/useAuth.ts` hook:
  ```typescript
  export function useAuth(): {
    user: User | null;
    isSignedIn: boolean;
    signIn: (provider: 'google' | 'apple' | 'email') => Promise<void>;
    signOut: () => Promise<void>;
    firebaseUID: string | null;
  }
  ```
- [ ] Auth is **optional** for Basic tier (app works without sign-in, as today)
- [ ] Auth is **required** for Premium tier (subscription tied to identity)
- [ ] On sign-in: migrate anonymous localStorage data to user-scoped keys

### 4.2 RevenueCat Integration

- [ ] Create RevenueCat project, configure:
  - App Store Connect API key (iOS)
  - Google Play service credentials (Android)
  - Stripe connection (web billing)
- [ ] Define products in RevenueCat dashboard:
  - `premium_monthly` ($9.99/month)
  - `premium_annual` ($79.99/year)
  - `premium_lifetime` ($199.99 one-time)
- [ ] Define entitlement: `premium` (granted by any of the 3 products)
- [ ] Install RevenueCat web SDK (`@revenuecat/purchases-js`)
- [ ] Update `useEntitlement.ts` to query RevenueCat:
  ```typescript
  // Phase 4: Replace localStorage check with RevenueCat
  const { customerInfo } = await Purchases.getCustomerInfo();
  const isPremium = customerInfo.entitlements.active["premium"] !== undefined;
  ```
- [ ] Configure RevenueCat app_user_id = Firebase UID on sign-in
- [ ] Set up Stripe Checkout for web paywall (RevenueCat-managed)

### 4.3 Paywall UI (Web)

- [ ] Create `src/components/paywall/PaywallDialog.tsx`:
  - Plan comparison table (Basic vs Premium)
  - Pricing cards (monthly / annual / lifetime)
  - "Subscribe" button → Stripe Checkout (via RevenueCat)
  - "Restore Purchases" link (for returning users)
- [ ] Integrate paywall trigger points:
  - Upgrade prompt components (from Phase 3.3)
  - Settings menu → "Manage Subscription"
  - Dashboard → "Unlock Advanced" CTA

### 4.4 Google AdSense (Web)

- [ ] Create AdSense account, submit site for review
- [ ] Create `src/components/ads/AdUnit.tsx`:
  - Renders ad slot `<div>` with data attributes
  - Checks `useEntitlement().isPremium` — renders nothing if premium
  - Lazy-loads ad script after React hydration
- [ ] Place ad units (see Revenue-Analysis.md Section 2.6):
  - Leaderboard (728x90) between form sections
  - Medium rectangle (300x250) sidebar on dashboard (desktop only)
  - Anchor (320x50) bottom bar (mobile)
- [ ] Add cookie consent banner (GDPR/CCPA compliance)
- [ ] Test: ads load on Basic tier, absent on Premium tier

### 4.5 Firestore Schema

- [ ] Create Firestore security rules:
  - Users can only read/write their own documents
  - Subscription collection is read-only for clients (written by webhooks)
  - Audit log is append-only
- [ ] Create collections (see Revenue-Analysis.md Section 5.3):
  - `users/{uid}` — profile, preferences
  - `subscriptions/{uid}` — tier, active status, expiry
  - `audit_log/{autoId}` — subscription events

### 4.6 Webhook Handler

- [ ] Create Cloud Function: `onRevenueCatWebhook`:
  - Verify webhook signature (shared secret)
  - Handle events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, BILLING_ISSUE, REFUND, EXPIRATION
  - Update Firestore `subscriptions/{uid}` document
  - Append to `audit_log` collection
- [ ] Deploy to Firebase Functions
- [ ] Configure RevenueCat webhook URL → Cloud Function endpoint

### 4.7 Validation Gate

- [ ] Sign-in flow works (Google, Apple, email)
- [ ] RevenueCat returns correct entitlements for test users
- [ ] Stripe Checkout completes and grants premium entitlement
- [ ] Ads appear for Basic, disappear for Premium
- [ ] Webhook correctly updates Firestore on subscription events
- [ ] Offline: cached entitlement persists for 7 days without network

---

## Phase 5: Mobile App Development

**Goal**: Build native mobile apps (iOS + Android) for both retire and leave apps.

**Duration**: 6-8 weeks
**Risk**: High (store submission, native SDK integration, platform-specific behavior)
**Prerequisite**: Phase 4 complete

### 5.1 Technology Decision

- [ ] Evaluate: Capacitor (wrap existing Astro/React app) vs React Native (rewrite UI)
- [ ] **Recommended**: Capacitor — wraps existing web app with native shell
  - Pros: Reuse 100% of existing React components; same codebase for web and mobile
  - Cons: Slightly less native feel; limited native API access
  - Mitigated: Capacitor plugins for StoreKit, Google Billing, AdMob, Firebase Auth
- [ ] Create `retire/mobile/` and `leave/mobile/` Capacitor projects

### 5.2 Capacitor Setup

- [ ] Install Capacitor in both apps: `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`
- [ ] Configure `capacitor.config.ts`:
  - `appId`: `com.fedplan.retire`, `com.fedplan.leave`
  - `webDir`: `dist` (Astro build output)
  - Plugins: `@capacitor-community/admob`, `@revenuecat/purchases-capacitor`
- [ ] Generate native projects: `npx cap add ios && npx cap add android`
- [ ] Configure app icons, splash screens, app name

### 5.3 Mobile Ad Integration (AdMob)

- [ ] Install `@capacitor-community/admob` plugin
- [ ] Create `src/mobile/AdManager.ts`:
  - `initialize(isPremium: boolean)` — skip if premium
  - `showBanner(position: 'top' | 'bottom')` — 320x50 banner
  - `showInterstitial()` — between-section ad (max 1 per session)
  - `destroyAll()` — called on premium upgrade
- [ ] Configure AdMob mediation (Meta Audience Network, Unity Ads)
- [ ] Implement ATT prompt for iOS (App Tracking Transparency)
- [ ] Test: ads show on Basic, removed on Premium

### 5.4 Mobile Subscription (RevenueCat + StoreKit/Play Billing)

- [ ] Install `@revenuecat/purchases-capacitor`
- [ ] Configure products in App Store Connect and Google Play Console
- [ ] Create native paywall UI (or use RevenueCat's paywall templates)
- [ ] Implement restore purchases flow
- [ ] Test subscription lifecycle: purchase → renewal → cancellation → expiry

### 5.5 Firebase Auth (Mobile)

- [ ] Install `@capacitor-firebase/authentication`
- [ ] Configure Google Sign-In (OAuth client IDs per platform)
- [ ] Configure Apple Sign-In (required for iOS if any sign-in exists)
- [ ] Ensure Firebase UID consistency across web and mobile
- [ ] Test: sign in on mobile, verify entitlements match web session

### 5.6 App Store Submission

- [ ] **iOS**:
  - Apple Developer Program enrollment ($99/year)
  - App Store Connect: app listing, screenshots, description
  - Privacy nutrition labels (declare: localStorage for financial data, AdMob for advertising)
  - TestFlight beta testing (minimum 2 weeks)
  - App Review submission
  - In-app purchase configuration (monthly, annual, lifetime)
- [ ] **Android**:
  - Google Play Developer registration ($25 one-time)
  - Play Console: app listing, screenshots, description
  - Data Safety form (declare: local storage, Firebase Auth, AdMob)
  - Internal/Closed testing track
  - Production release
  - In-app product configuration

### 5.7 Store Compliance Checklist

- [ ] Restore purchases button visible on paywall
- [ ] Subscription terms disclosed before purchase
- [ ] Auto-renewal disclosure text (required by both stores)
- [ ] Privacy policy URL configured in both stores
- [ ] Terms of service URL configured
- [ ] No external purchase links (App Store Guideline 3.1.1)
- [ ] ATT prompt before ad tracking (iOS 14.5+)
- [ ] Data Safety form accurate (Google Play)

### 5.8 Validation Gate

- [ ] Both apps install and run on physical iOS device
- [ ] Both apps install and run on physical Android device
- [ ] Subscriptions work end-to-end (purchase → entitlement → ad removal)
- [ ] Cross-platform: subscribe on iOS, verify premium on web
- [ ] Offline: app functions with cached data (calculation, saved scenarios)
- [ ] Deep link: `fedplan://retire/dashboard` opens correct screen

---

## Phase 6: Ad Integration & Revenue Activation

**Goal**: Activate ad monetization on all platforms for Basic tier users.

**Duration**: 1-2 weeks
**Risk**: Low (infrastructure from Phase 4/5; this is configuration and testing)
**Prerequisite**: Phase 4 (web) and Phase 5 (mobile) complete

### 6.1 Web Ad Activation

- [ ] Submit AdSense site review (requires live site with content)
- [ ] Configure auto ads as fallback (AdSense optimizes placement)
- [ ] Place manual ad units per strategy (Revenue-Analysis.md Section 2.6)
- [ ] Implement `requestIdleCallback` delayed ad loading
- [ ] Performance test: Lighthouse score impact < 10 points
- [ ] A/B test: 2 vs 3 ad units per page (optimize RPM vs UX)

### 6.2 Mobile Ad Activation

- [ ] Register AdMob apps (iOS + Android, retire + leave = 4 app IDs)
- [ ] Configure ad units per app:
  - Banner: dashboard bottom
  - Native: between form sections
  - Interstitial: before dashboard (1x per session, frequency cap)
- [ ] Enable mediation partners (apply to Meta Audience Network, Unity)
- [ ] Set frequency caps: max 1 interstitial per 5 minutes
- [ ] Test on physical devices: ad rendering, tap targets, close buttons

### 6.3 Cookie Consent & Privacy

- [ ] Implement CMP (Consent Management Platform) for web:
  - Google's CMP solution or Cookiebot/OneTrust
  - TCF 2.0 string passed to AdSense
  - CCPA "Do Not Sell" signal respected
- [ ] Mobile: Google UMP (User Messaging Platform) SDK
- [ ] Privacy policy page: enumerate all data collection (ads, analytics, auth)
- [ ] Both apps: "No financial data is shared with advertisers" disclosure

### 6.4 Validation Gate

- [ ] Ads render correctly on all platforms (web, iOS, Android)
- [ ] Premium users: zero ads across all platforms
- [ ] Ad performance: < 200ms render time for ad units
- [ ] Revenue dashboard: AdSense + AdMob reporting linked
- [ ] Privacy: consent flow works correctly (accept, reject, modify)

---

## Phase 7: Polish, Testing & Launch Preparation

**Goal**: End-to-end testing, performance optimization, compliance verification.

**Duration**: 2-3 weeks
**Risk**: Medium (edge cases in subscription lifecycle, store review delays)
**Prerequisite**: Phases 1-6 complete

### 7.1 End-to-End Testing

- [ ] **Subscription lifecycle**:
  - New user → Basic → sign up → purchase premium → verify entitlements
  - Premium → cancel → verify access until expiry → revert to Basic
  - Billing issue → grace period → retry → resolve
  - Refund → immediate revocation → audit log entry
  - Upgrade (monthly → annual) → proration correct
  - Restore purchases on new device → entitlements restored
- [ ] **Cross-platform sync**:
  - Subscribe on iOS → web reflects premium
  - Subscribe on web (Stripe) → iOS reflects premium
  - Cancel on Google Play → web reflects cancellation after expiry
- [ ] **Offline behavior**:
  - Launch app offline → cached tier persists (7-day window)
  - Perform calculations offline → all modules work (localStorage)
  - Reconnect → entitlements refresh
- [ ] **Ad behavior**:
  - Basic: ads appear
  - Premium: no ads
  - Premium expires: ads reappear
  - Ad blocker detected: graceful degradation (no crash)

### 7.2 Performance Optimization

- [ ] Bundle analysis: Vite visualizer for retire and leave apps
- [ ] Code splitting: lazy-load premium components (`React.lazy`)
- [ ] Ad lazy loading: defer all ad scripts until after initial paint
- [ ] Firebase SDK tree-shaking: import only `auth`, not full Firebase suite
- [ ] RevenueCat SDK: initialize after first paint (non-blocking)
- [ ] Target: Lighthouse Performance > 85 on mobile (with ads loading)

### 7.3 Security Audit

- [ ] Firebase security rules: test unauthorized access attempts
- [ ] RevenueCat: verify receipt validation rejects tampered receipts
- [ ] localStorage: entitlement cache is convenience only, not trust boundary
- [ ] No PII in ad requests (verify network traffic)
- [ ] JWT tokens: verify expiry and refresh flow
- [ ] CSP headers: restrict script sources to self + Google + Firebase

### 7.4 Compliance Verification

- [ ] GDPR: consent collected before ad tracking; data deletion endpoint
- [ ] CCPA: "Do Not Sell" signal honored
- [ ] Apple ATT: prompt shown before IDFA access
- [ ] App Store Review Guidelines: full checklist pass
- [ ] Google Play Policy: data safety form accurate
- [ ] Accessibility: WCAG 2.1 AA maintained across all new components

### 7.5 Documentation

- [ ] Update `retire/CLAUDE.md` with new architecture (monorepo, packages, tiers)
- [ ] Update `retire/docs/architecture.md` with infrastructure diagram
- [ ] Create `leave/CLAUDE.md` for standalone leave app
- [ ] Create `CONTRIBUTING.md` at monorepo root (package development guide)
- [ ] Update README files for both apps

### 7.6 Launch Checklist

- [ ] Web retire app deployed (Vercel/Netlify/Cloudflare Pages)
- [ ] Web leave app deployed (separate domain/subdomain)
- [ ] iOS retire app approved and live on App Store
- [ ] iOS leave app approved and live on App Store
- [ ] Android retire app approved and live on Google Play
- [ ] Android leave app approved and live on Google Play
- [ ] RevenueCat webhooks verified in production
- [ ] AdSense/AdMob reporting confirmed
- [ ] Firebase Auth working across all platforms
- [ ] Monitoring: error tracking (Sentry), uptime monitoring

---

## Risk Mitigation Summary

| Phase | Key Risk | Mitigation | Fallback |
|---|---|---|---|
| 1 | Import path refactoring breaks builds | Automated codemod script; comprehensive test suite | Revert to single-app structure |
| 2 | Leave app users expect full retire features | Clear feature scoping; separate branding | Add link to retire app from leave app |
| 3 | Premium feature boundary unclear to users | Prominent upgrade prompts at decision points; preview of locked features | Adjust tier boundaries based on user feedback |
| 4 | Firebase/RevenueCat integration complexity | Start with sandbox/test environments; phased rollout | Fall back to localStorage-only entitlements |
| 5 | App Store rejection | Follow guidelines precisely; TestFlight beta; prepare appeals | Web-only launch while resolving store issues |
| 6 | Ad revenue lower than projected | Multiple ad formats; mediation for CPM optimization | Supplement with affiliate partnerships |
| 7 | Cross-platform subscription sync delays | RevenueCat handles edge cases; webhook retry; cache tolerance | Manual entitlement override in admin console |

---

## Milestone Summary

| Milestone | Target | Deliverable |
|---|---|---|
| M1: Monorepo | Phase 1 complete | Shared packages extracted; retire app unchanged functionally |
| M2: Leave Standalone | Phase 2 complete | Leave app runs independently at `app-dev/leave/` |
| M3: Tiered Retire | Phase 3 complete | Basic/Premium gating in retire app; local entitlement checking |
| M4: Infrastructure | Phase 4 complete | Firebase Auth, RevenueCat, AdSense operational |
| M5: Mobile Apps | Phase 5 complete | iOS + Android apps submitted to stores |
| M6: Revenue Live | Phase 6 complete | Ads and subscriptions generating revenue |
| M7: Launch | Phase 7 complete | All platforms live, monitored, documented |

---

## Completed Phases (Historical Reference)

- Phase 1-9: Original design and implementation
- Phase A: Bug fixes
- Phase B: 2025-2026 data updates
- Phase C: UX quick wins
- Phase D: Data consolidation
- Phase E.1-E.5: Form refactoring (container + sub-form pattern)
- Phase F: Form UX enhancements (animations, keyboard shortcuts)
- Phase G: Scenario management & export UI
- Phase I: Dashboard integration
- Phase N: Unified smile curve (Blanchett model)
- Phase O: Mobile UX polish (responsive, tap targets)
- Phase P: Export enhancements (PDF, Excel, scenario diff)
- Phase Q: Accessibility & WCAG 2.1 compliance
- Phase R: Performance optimization

---

*End of Implementation Roadmap*
