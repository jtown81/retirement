# Phase 3: Leave Tab Removal + Retirement Tier Segmentation — COMPLETE ✅

**Completed**: 2026-02-24
**Status**: All validation gates passed
**Test Coverage**: 789 tests passing (+19 entitlement tests)
**Code Quality**: Zero typecheck errors, clean build, no regressions

---

## Summary

Phase 3 successfully removed the Leave tab from the retire app (deferred to Phase 2.4 completion) and implemented a complete Basic/Premium tier segmentation system with feature gating at the UI layer. The system defaults to Basic tier when entitlement data is absent, supporting a freemium model with localStorage-only validation for MVP.

### Phase 3A: Leave Tab Removal

**Completed**: Removed all Leave functionality from retire app now that standalone leave app (`app-dev/leave/`) exists.

#### Files Deleted
- `app/src/components/forms/leave-calendar/` (6 files)
  - DayCell.tsx
  - LeaveCalendarGrid.tsx
  - LeaveCalendarToolbar.tsx
  - LeaveEntryModal.tsx
  - MonthCalendar.tsx
  - LeaveBalanceSummaryViewer.tsx
- `app/src/components/forms/LeaveBalanceForm.tsx`

#### Files Modified
- `app/src/components/layout/AppShell.tsx`
  - Removed `Calendar` icon import
  - Changed View type: `'input' | 'leave' | 'dashboard' | 'scenarios'` → `'input' | 'dashboard' | 'scenarios'`
  - Removed 'leave' from NAV_ITEMS (4 items → 3 items)
  - Changed grid: `grid-cols-4` → `grid-cols-3`

- `app/src/components/PlannerApp.tsx`
  - Removed `LeaveBalanceForm` import
  - Removed `view === 'leave' ? <LeaveBalanceForm /> :` branch
  - Updated alert text: removed "and the Leave tab" reference

- `app/src/components/forms/useFormSections.ts`
  - Removed `LeaveBalanceSchema` import
  - Removed `useLeaveComplete()` export

#### Impact
- Leave calendar data no longer required for form completion
- Leave calendar imports no longer in retire app bundle
- @fedplan/leave package still consumed (needed for leave credit calculation in simulation)
- All 770 existing tests passing after removal

### Phase 3B: Basic/Premium Tier Segmentation

**Completed**: Implemented localStorage-based tier detection with UI-layer feature gating (no business logic gating).

#### Architecture Guarantee
```typescript
// ✅ CORRECT: UI-layer gating
FormShell.tsx:
  isPremium ? <SimulationForm /> : <UpgradePrompt feature="simulation" />

// ❌ NEVER: Logic-layer gating
retirement-simulation.ts:
  if (!isPremium) throw new Error("Premium required");
```

Modules remain pure functions; entitlement is UI-only concern.

#### Files Created

1. **`app/src/config/features.ts`** — Feature tier definitions
   - FEATURE_TIERS: basic (6) + premium (9) features
   - BASIC_SCENARIO_LIMIT = 1

2. **`app/src/hooks/useEntitlement.ts`** — Entitlement detection
   - Reads `retire:subscription` from localStorage
   - Returns: tier, isPremium, isBasic, isFeatureEnabled()
   - Defaults to 'basic' when key absent (safe default)

3. **`app/src/components/paywall/UpgradePrompt.tsx`** — Feature lock UI
   - Lock icon + feature name + description
   - "Unlock Premium" CTA button
   - Non-intrusive design (no dark patterns)

4. **`app/src/components/paywall/PremiumBadge.tsx`** — Inline tier indicator
   - Lock icon + "Premium" label
   - Subtle amber styling

5. **`app/src/components/charts/BasicDashboard.tsx`** — Basic tier dashboard
   - 5 metric cards (retirement date, annuity, TSP at retirement, year-1 income, lifetime surplus)
   - PayGrowthChart (salary progression with High-3)
   - "Unlock Advanced Projections" upgrade CTA
   - Conditionally rendered for basic tier users

6. **Tests**
   - `tests/unit/entitlement/useEntitlement.test.ts` (8 tests)
   - `tests/unit/entitlement/features.test.ts` (11 tests)

#### Files Modified

1. **`app/src/storage/schema.ts`**
   - Added SUBSCRIPTION key: `'retire:subscription'`
   - Bumped CURRENT_SCHEMA_VERSION: 4 → 5

2. **`app/src/storage/zod-schemas.ts`**
   - Added SubscriptionTierSchema = z.enum(['basic', 'premium'])
   - Added SubscriptionSchema = z.object({ tier, activatedAt? })

3. **`app/src/storage/index.ts`**
   - Exported SubscriptionTierSchema, SubscriptionSchema

4. **`app/src/components/forms/FormShell.tsx`**
   - Added `locked?: boolean` to TabDef interface
   - Added Lock icon import from lucide-react
   - Locked tabs: show Lock icon (amber), opacity-60 styling, aria-disabled
   - Locked tabs remain clickable (clicking shows upgrade prompt)

5. **`app/src/components/forms/useFormSections.ts`**
   - Added `tier: 'basic' | 'premium'` to SectionStatus interface
   - Marked 'simulation' and 'tax' as tier: 'premium'
   - All others marked as tier: 'basic'

6. **`app/src/components/PlannerApp.tsx`**
   - Imported useEntitlement hook
   - Added isPremium check
   - Pass isPremium to FormContent
   - Suppress simConfig for basic tier: `effectiveSimConfig = isPremium ? simConfig : null`
   - Filter requiredComplete for basic tier: exclude premium sections
   - Build tabs with locked field: `locked: !isPremium && s.tier === 'premium'`
   - Gate SimulationForm/TaxProfileForm in FormContent with UpgradePrompt

7. **`app/src/components/Dashboard.tsx`**
   - Imported useEntitlement, BasicDashboard
   - Check isPremium at top
   - Early return BasicDashboard for basic tier
   - Full dashboard for premium tier

8. **`app/src/components/charts/ExportPanel.tsx`**
   - Imported useEntitlement, PremiumBadge
   - Disabled Excel export for basic tier + PremiumBadge
   - Disabled Compare button for basic tier + PremiumBadge
   - CSV export available to all tiers

9. **`app/src/components/dialogs/SaveScenarioDialog.tsx`**
   - Imported useEntitlement, BASIC_SCENARIO_LIMIT, Lock icon
   - Added scenario limit check: `isScenarioLimitReached = isBasic && scenarios.length >= BASIC_SCENARIO_LIMIT`
   - Show alert when limit reached
   - Disable form fields and save button when at limit

10. **`tsconfig.json`**
    - Added @config/* path alias → src/config/*

11. **`vitest.config.ts`**
    - Added @config path alias for test resolution

#### Feature Tiers

**Basic Tier** (Free, localStorage validation):
- ✅ FERS Estimate (Personal, Salary, Annuity & SS, TSP basics)
- ✅ Career Timeline (Career events, auto-salary)
- ✅ Expenses (10 categories, base inflation)
- ✅ TSP Monitor (snapshot import, balance tracking)
- ✅ Basic Dashboard (PayGrowth, 5 summary cards)
- ✅ Scenario Save (limited to 1)
- ✅ CSV Export

**Premium Tier** (Paid, RevenueCat-validated Phase 4):
- ✅ Simulation Config (dual-pot TSP, advanced allocation, withdrawal strategy)
- ✅ Tax Modeling (Federal, state, IRMAA)
- ✅ Advanced Dashboard (6 charts, Monte Carlo, detailed table)
- ✅ Scenario Unlimited (save/compare/export)
- ✅ Excel Export
- ✅ Scenario Diff CSV
- ✅ Full TSP Monitor

#### UI Gating Strategy

| Component | Gating | UX |
|---|---|---|
| FormShell tabs | Lock icon on premium tabs | Clicking locked tab shows UpgradePrompt |
| SimulationForm | Wrapped in UpgradePrompt if !isPremium | Tab content area shows upgrade UI |
| TaxProfileForm | Wrapped in UpgradePrompt if !isPremium | Tab content area shows upgrade UI |
| Dashboard | Conditional render BasicDashboard vs Dashboard | Different dashboard entirely |
| ExportPanel buttons | isFeatureEnabled checks + disabled states | Buttons disabled with PremiumBadge |
| SaveScenarioDialog | Scenario limit enforcement | Alert + disabled form when at limit |

#### Storage Changes

**New Schema Entry** (v5, non-breaking):
```json
{
  "retire:subscription": {
    "schemaVersion": 5,
    "updatedAt": "2026-02-24T...",
    "data": {
      "tier": "basic" | "premium",
      "activatedAt": "2026-02-24T..." // optional
    }
  }
}
```

Default (absent key): basic tier → safe for anonymous users

#### Testing

**New Test Files** (19 tests):
- `tests/unit/entitlement/useEntitlement.test.ts` (8 tests)
  - Default to basic tier when key absent
  - Detect premium tier from storage
  - Feature evaluation (basic/premium features)
  - Premium features blocked for basic tier
  - All features available for premium tier
  - Unknown features blocked gracefully
  - Consistent tier on re-renders

- `tests/unit/entitlement/features.test.ts` (11 tests)
  - Feature tier definitions correct
  - No overlapping features between tiers
  - All feature values are true
  - Basic tier includes core input features
  - Premium tier includes simulation/tax/advanced features
  - BASIC_SCENARIO_LIMIT is 1

**Existing Tests**:
- 770 existing tests still passing (no regressions)
- +19 new entitlement tests
- **Total: 789 tests passing**

---

## Validation Gates ✅

| Gate | Status | Details |
|---|---|---|
| **Typecheck** | ✅ PASS | Zero TypeScript errors |
| **Tests** | ✅ PASS | 789 tests passing (51 files, +19 new) |
| **Build** | ✅ PASS | Astro static output succeeds |
| **Leave Removal** | ✅ PASS | No orphaned imports; components fully deleted |
| **Tier Defaults** | ✅ PASS | localStorage-only; defaults to basic |
| **UI Gating** | ✅ PASS | All component gates functional; no logic leakage |
| **Bundle Size** | ✅ PASS | Leave components not in bundle |

---

## Architecture Notes

### Service Layer Separation (Guaranteed)
- **UI Layer** (src/components, src/hooks/useEntitlement): Feature gating, tier detection, UI branching
- **Calculation Modules** (@fedplan/*): Pure functions, zero entitlement awareness, zero RevenueCat/Firebase imports
- **Storage**: LocalStorage defaults to basic; upgrade UI only; no calculation module reads tier

### No Business Logic Gating
✅ Verified: Modules compute correctly regardless of tier
- Basic user with SimulationConfig in localStorage: results compute correctly, UI just doesn't show them
- User upgrade: instant access to locked features without re-entry

### Entitlement Data Flow
```
localStorage('retire:subscription')
  → useEntitlement() hook [UI-only]
    → isPremium flag
      → Component conditional rendering
        → UpgradePrompt / PremiumBadge
```

### Future Integration (Phase 4)
```typescript
// Phase 4: Replace localStorage check with RevenueCat
const { customerInfo } = await Purchases.getCustomerInfo();
const isPremium = customerInfo.entitlements.active["premium"] !== undefined;
// Rest of useEntitlement() logic unchanged
```

---

## Known Limitations (By Design)

1. **localStorage-only validation** — Suitable for MVP/freemium model; not audit-proof for revenue
2. **No offline entitlement refresh** — User can set `retire:subscription` manually in dev tools
3. **No expiry enforcement** — Phase 4 webhook will add expiry checks
4. **Single entitlement per user** — Phase 4 will support multi-device entitlement via RevenueCat
5. **No ad placeholders** — Ad integration deferred to Phase 4/6

---

## Next Steps (Phase 4)

### 4.1 Firebase Authentication
- [ ] Create Firebase project (fedplan-prod, fedplan-staging)
- [ ] Email/password, Google, Apple sign-in
- [ ] useAuth() hook for sign-in flow
- [ ] Auth optional for Basic, required for Premium

### 4.2 RevenueCat Integration
- [ ] Set up RevenueCat project, define products
- [ ] Update useEntitlement() to query RevenueCat
- [ ] Wire Stripe Checkout for web paywall
- [ ] Configure App Store / Google Play products

### 4.3 Webhook Handler
- [ ] Create Cloud Function for RevenueCat webhooks
- [ ] Update Firestore subscriptions on purchase/renewal/expiry
- [ ] Entitlement cache refresh on server validation

### 4.4 Ad SDK Integration
- [ ] Google AdSense (web)
- [ ] AdMob (mobile)
- [ ] Cookie consent / privacy framework

### 4.5 Firestore Schema
- [ ] Users, subscriptions, audit_log collections
- [ ] Security rules (users can only read/write own data)

---

## Files Summary

### Deleted (Phase 3A)
- `app/src/components/forms/leave-calendar/` (6 files)
- `app/src/components/forms/LeaveBalanceForm.tsx`

### Created (Phase 3B)
- `app/src/config/features.ts`
- `app/src/hooks/useEntitlement.ts`
- `app/src/components/paywall/UpgradePrompt.tsx`
- `app/src/components/paywall/PremiumBadge.tsx`
- `app/src/components/charts/BasicDashboard.tsx`
- `tests/unit/entitlement/useEntitlement.test.ts`
- `tests/unit/entitlement/features.test.ts`

### Modified (Phase 3B)
- `app/src/storage/schema.ts` (added SUBSCRIPTION key)
- `app/src/storage/zod-schemas.ts` (added Subscription schema)
- `app/src/storage/index.ts` (exported Subscription schemas)
- `app/src/components/forms/FormShell.tsx` (locked tabs)
- `app/src/components/forms/useFormSections.ts` (tier field)
- `app/src/components/PlannerApp.tsx` (useEntitlement, tier gating)
- `app/src/components/Dashboard.tsx` (conditional BasicDashboard)
- `app/src/components/charts/ExportPanel.tsx` (gated exports)
- `app/src/components/dialogs/SaveScenarioDialog.tsx` (scenario limit)
- `tsconfig.json` (added @config alias)
- `vitest.config.ts` (added @config alias)

---

**Phase 3 Complete. Ready for Phase 4: Infrastructure Setup.**
