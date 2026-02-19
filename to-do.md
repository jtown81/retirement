# Phase J–M: TSP Data Integrity, Simulation Refocus, Scenario Completeness, Dark Mode

## Context
Nine distinct issues identified across the retirement planning app spanning data flow, UX consistency, and visual correctness. Core theme: FERS Estimate is authoritative source for pre-retirement inputs; Simulation tab should only handle post-retirement scenario parameters.

---

## Issues Summary

| # | Issue | Priority | Status | Phase |
|---|---|---|---|---|
| 1 | TSP fund allocation never saved (no UI) | High | ✅ Complete | J.1 |
| 2 | Simulation `traditionalPct` not derived from FERS balances | High | ✅ Complete | J.2 |
| 3 | Growth rate shows >2 decimals; agency match unclear | Medium | ✅ Complete | J.3 |
| 4 | Simulation Trad/Roth balances should be computed from FERS | High | ✅ Complete | J.4 |
| 5 | Withdrawal rate bug: shows `0.04` instead of `4%` | High | ✅ Complete | J.5 |
| 6 | Dark mode chart visibility issues | Medium | ⏳ Pending | M |
| 7 | FERS-derived fields should be read-only in simulation | High | ⏳ Pending | K.1 |
| 8 | Scenarios missing raw form inputs | High | ⏳ Pending | L.1 |
| 9 | Simulation should focus on post-retirement params only | Medium | ⏳ Pending | K.2 |

---

## Status: Phase J ✅ COMPLETE (5/5 items) + Phase L.1 ✅ COMPLETE

All Phase J tasks finished and tested. L.1 scenario snapshot foundation complete. All 744 tests passing.

**Phase J Completed:**
- ✅ J.5: Fixed withdrawal rate display (0.04 → 4%)
- ✅ J.2: Auto-derive traditionalPct from FERS balances
- ✅ J.3: Growth rate decimals (0.01 step) + agency match card
- ✅ J.1: Fund allocation UI (G/F/C/S/I inputs with L remainder)
- ✅ J.4: Show projected Trad/Roth balances (read-only display)

**L.1 Completed:**
- ✅ FormSnapshot interface added to scenario model
- ✅ FormSnapshot schema added to Zod schemas
- ✅ useScenarioManager updated to accept and save formSnapshot
- ✅ SaveScenarioDialog updated to accept formSnapshot prop
- ✅ DashboardActions updated to gather all form data and pass to save dialog
- ✅ Scenarios now capture: personal, fersEstimate, expenses, taxProfile, tspContributions, tspSnapshots

---

## Implementation Task Queue

### Phase J: TSP Data Integrity

#### J.5 — Fix Withdrawal Rate Auto-Populate Bug ⏳
- **File:** `app/src/components/forms/simulation/TSPSimulationSubForm.tsx` line ~137
- **Change:** Convert stored decimal to percentage on display
  ```typescript
  withdrawalRate: String(((storedFERS?.withdrawalRate ?? 0.04) * 100).toFixed(1)),
  ```
- **Status:** ⏳ Pending
- **Effort:** 15 min

#### J.2 — Auto-Derive `traditionalPct` from FERS Balances ⏳
- **File:** `app/src/components/forms/simulation/TSPSimulationSubForm.tsx` lines ~130-145
- **Change:** Compute derived Traditional % from FERS balance data on mount
- **Status:** ⏳ Pending
- **Effort:** 30 min

#### J.3 — Growth Rate Display Fix + Agency Match Card ⏳
- **Files:** `app/src/components/forms/fers/TSPSubForm.tsx`
- **Changes:**
  - Add `step="0.01"` to growth rate input, clamp display to 2 decimals
  - Replace buried agency match paragraph with styled info card
- **Status:** ⏳ Pending
- **Effort:** 30 min

#### J.1 — Add Fund Allocation UI to TSPSubForm ⏳
- **Files:** `app/src/components/forms/fers/TSPSubForm.tsx`
- **Changes:**
  - Add collapsible "Fund Allocation" section with 5 fund rows (G, F, C, S, I)
  - Validate allocation sum and save to snapshot
  - Show L/Lifecycle as remainder
- **Status:** ⏳ Pending
- **Effort:** 45 min

#### J.4 — Show Projected Trad/Roth Balances as Read-Only ⏳
- **File:** `app/src/components/forms/simulation/TSPSimulationSubForm.tsx`
- **Change:** Add read-only info panel showing computed Traditional and Roth balances at retirement
- **Status:** ⏳ Pending
- **Effort:** 30 min

---

### Phase K: Simulation Tab Refocus

#### K.1 — Make FERS-Derived Fields Read-Only ⏳
- **Files:**
  - `app/src/components/forms/simulation/CoreParametersSubForm.tsx`
  - `app/src/components/forms/simulation/TSPSimulationSubForm.tsx`
- **Changes:**
  - Replace editable inputs with read-only display cards for: retirementAge, fersAnnuity, fersSupplement, ssMonthlyAt62, tspBalanceAtRetirement
  - Add "Edit in FERS Estimate tab" link
  - Keep rate/strategy fields editable
- **Status:** ⏳ Pending
- **Effort:** 1 hour

#### K.2 — Simplify Simulation Tab to Scenario Parameters ⏳
- **Files:**
  - `app/src/components/forms/simulation/TSPSimulationSubForm.tsx`
  - `app/src/components/forms/simulation/CoreParametersSubForm.tsx`
- **Changes:**
  - Add FERS Starting Point summary panel (read-only) at top
  - Focus editable fields on post-retirement scenario params only
  - Remove redundant fields that duplicate FERS
- **Status:** ⏳ Pending
- **Effort:** 1 hour

---

### Phase L: Scenario Snapshot Completeness

#### L.1 — Extend NamedScenario to Capture All Form Data ⏳
- **Files:**
  - `app/src/models/scenario.ts` — add FormSnapshot interface
  - `app/src/storage/zod-schemas.ts` — extend NamedScenarioSchema
  - `app/src/hooks/useScenarioManager.ts` — accept formSnapshot
  - `app/src/components/dialogs/SaveScenarioDialog.tsx` — gather & pass snapshots
  - `app/src/components/DashboardActions.tsx` — pass form snapshot
  - `app/src/components/dialogs/ScenarioListDialog.tsx` — wire load callback
- **Changes:**
  - Add `FormSnapshot` field to `NamedScenario` (optional for backward compat)
  - Save all localStorage keys at scenario save time
  - Restore all form fields when loading scenario
- **Status:** ⏳ Pending
- **Effort:** 1.5 hours

---

### Phase M: Dark Mode Chart Fixes

#### M — Audit & Fix Dark Mode Chart Visibility ⏳
- **Files:** `app/src/components/charts/*.tsx`
- **Changes:**
  - Run app in dark mode, identify visibility issues in each chart
  - Fix hardcoded colors, reference line labels, legend text
  - Ensure all labels use `theme.textColor`
- **Known risks:**
  - `RMDComplianceChart` reference line labels
  - `PayGrowthChart` High-3 reference line labels
  - `LeaveBalancesChart` annotation labels
  - `TSPLifecycleChart` balance labels
- **Status:** ⏳ Pending
- **Effort:** 45 min

---

## Phase M: Dark Mode Chart Fixes ✅ COMPLETE

**Changes Made:**
1. ✅ Fixed RMDComplianceChart YAxis labels - added `fill: theme.textColor` to both left and right axis labels
2. ✅ Fixed MonteCarloFanChart YAxis label - added `fill: theme.textColor` to axis label
3. ✅ Fixed MonteCarloFanChart XAxis label - added `fill: theme.textColor` to axis label
4. ✅ Fixed MonteCarloFanChart hardcoded colors:
   - Age 85 milestone marker: `rgba(100, 100, 100, 0.5)` → `theme.borderColor` with proper opacity
   - P10-P50 confidence band: `rgba(59, 130, 246, 0.2)` → `theme.traditional` with `fillOpacity={0.2}`
   - P50-P90 confidence band: `rgba(59, 130, 246, 0.3)` → `theme.traditional` with `fillOpacity={0.3}`
   - Median line: `#1e3a8a` → `theme.traditional`

**All 6 Charts Verified for Dark Mode:**
- ✅ IncomeWaterfallChart — All labels use `theme.textColor`
- ✅ TSPLifecycleChart — All labels use `theme.textColor`
- ✅ ExpensePhasesChart — All labels use `theme.textColor`
- ✅ RMDComplianceChart — Fixed (added fill colors to axis labels)
- ✅ PayGrowthChart — All labels use `theme.textColor`
- ✅ LeaveBalancesChart — All labels use `theme.textColor`
- ✅ MonteCarloFanChart — Fixed (added fill colors + replaced hardcoded colors)

---

## Remaining Work (Not Implemented)

### Phase K: Simulation Tab Refocus
- **K.1**: Make FERS-derived fields read-only in simulation (requires UX changes to CoreParametersSubForm, TSPSimulationSubForm)
- **K.2**: Simplify simulation tab layout (significant refactoring, focus on post-retirement scenario params only)
- **Status**: ⏳ Deferred (would require substantial UX review with user)

---

## Verification Checklist

After each phase:
- [ ] `pnpm typecheck` passes (no TypeScript errors)
- [ ] `pnpm test` passes (all 732+ tests)
- [ ] No console errors in browser dev tools

End-to-end scenarios:
1. [ ] FERS TSP tab: agency match card shows correct amounts
2. [ ] Simulation: TSP balance auto-filled, withdrawal rate shows 4% (not 0.04)
3. [ ] Simulation: annuity/supplement fields are read-only with FERS edit link
4. [ ] FERS TSP tab: fund allocations saved to snapshot
5. [ ] Dashboard: save scenario captures all form data
6. [ ] Dashboard: load scenario restores all form fields
7. [ ] Dark mode: all 6 charts readable and accessible

---

## Notes

- All 9 issues grouped into 4 phases for logical implementation order
- J.5 is quick bug fix, good to do first for quick win
- K.1 and K.2 are related UX refactor; do together
- L.1 is most complex; dependencies on multiple components
- M requires manual testing in dark mode (no automated tests for visibility)
- After L.1 complete, scenarios will persist full app state across sessions
