# Codebase Validation & Improvement Plan

**Date:** 2026-02-18
**Scope:** Full audit of calculations, financial assumptions, business logic, data entry UX, and code structure across all modules.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Module-by-Module Analysis](#2-module-by-module-analysis)
   - [2.1 Career & Pay Progression](#21-career--pay-progression)
   - [2.2 Leave Planning & Tracking](#22-leave-planning--tracking)
   - [2.3 TSP Modeling](#23-tsp-modeling)
   - [2.4 Expense Modeling](#24-expense-modeling)
   - [2.5 Simulation Engine](#25-simulation-engine)
   - [2.6 Validation Module](#26-validation-module)
   - [2.7 Military Buyback](#27-military-buyback)
3. [Charts & Dashboard](#3-charts--dashboard)
4. [Data Flow & Storage Architecture](#4-data-flow--storage-architecture)
5. [User Experience & Data Entry Redundancy](#5-user-experience--data-entry-redundancy)
6. [Consolidated Issue Register](#6-consolidated-issue-register)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Executive Summary

The codebase is **well-engineered and production-ready**. All 731 tests pass. Regulatory formulas are correctly implemented with proper source citations. The architecture maintains clean separation of concerns across modules, hooks, storage, and UI layers.

**Key Strengths:**
- Correct FERS annuity, TSP, RMD, and eligibility logic with authoritative source references
- Strong type safety (TypeScript strict + Zod runtime validation)
- Comprehensive test coverage (unit + scenario parity)
- Charts contain zero business logic; all transformations happen in `useSimulation`
- Schema-versioned localStorage with migration support

**Key Findings (by severity):**

| Severity | Count | Summary |
|----------|-------|---------|
| Bug | 2 | Military buyback variable overwrite; Monte Carlo depletion-age null check |
| Accuracy | 3 | RMD prior-year balance approximation; PV midpoint simplification; `projectPreRetirementTSP` missing IRS cap enforcement |
| Data Entry UX | 4 | Redundant fields across forms; manual "Pull from" button; no cross-form validation; 15 storage keys |
| Stale Data | 2 | Missing 2025 GS pay/locality tables; OPM interest rate table needs annual update |
| Incomplete | 1 | Validation module (`validateCareerInput`, `warnOnAssumptions`) is Phase 11 placeholder |
| Design Debt | 5 | Dual smile-curve models; dual TSP storage; orphaned forms; naming collision; custom withdrawal split unvalidated |

---

## 2. Module-by-Module Analysis

### 2.1 Career & Pay Progression

**Location:** `app/src/modules/career/`
**Files:** `grade-step.ts`, `locality.ts`, `pay-calculator.ts`, `projection.ts`, `scd.ts`

**Current Approach:**
- GS/LEO/Title 38 pay systems with grade/step lookup, locality application, and LEO availability pay (LEAP)
- WGI timing per 5 CFR § 531.405(b): Steps 1-3 = 1yr, 4-6 = 2yr, 7-9 = 3yr
- High-3 computed as highest 36-month consecutive average (sliding window)
- SCD tracking with separation gap deduction; SCD-Leave vs SCD-Retirement properly distinguished

**Regulatory Compliance:** Correct per 5 U.S.C. § 5332, § 5304, § 5545a, § 8411; OPM FERS Handbook Ch. 20, 50.

**Issues Found:**

| ID | Severity | File | Description |
|----|----------|------|-------------|
| C-1 | Stale Data | `data/gs-pay-tables.ts` | Only 2024 GS table present. 2025 factor (1.0177) exists but no full table. Projections for 2026+ use 2% assumed increase. **Add 2025 tables when available.** |
| C-2 | Stale Data | `data/locality-rates.ts` | Only 2024 locality rates. 45 of ~200+ OPM codes covered; unrecognized codes silently fall back to RUS (16.82%). |
| C-3 | Minor | `pay-calculator.ts:126,128,141` | Pay components rounded individually before summing. May cause ±$1-2 variance vs spreadsheet. Verify rounding order against `Retire-original.xlsx`. |
| C-4 | Minor | `projection.ts:182` | `stateAtDate()` re-sorts events on each loop iteration. Negligible for typical careers but wasteful. Pass pre-sorted array. |

**Recommendations:**
1. Add 2025 GS & locality tables (annual maintenance task)
2. Document locality code coverage; link to OPM official list
3. Verify rounding order against spreadsheet baseline

---

### 2.2 Leave Planning & Tracking

**Location:** `app/src/modules/leave/`
**Files:** `annual-leave.ts`, `sick-leave.ts`, `retirement-credit.ts`, `simulate-year.ts`, `calendar-utils.ts`, `calendar-bridge.ts`

**Current Approach:**
- Annual leave: 3-tier accrual (4/6/8 hrs per PP by service years) with statutory 160-hr special case for 6 hrs/pp tier
- Rollover cap: 240 hrs (360 overseas); forfeit excess at year-end
- Sick leave: 4 hrs/pp, no cap, 104 hr/yr family care sublimit
- Sick leave retirement credit: 100% post-2014 FERS at 2,087 hrs = 1 work year
- Year simulation: lump-sum accrual at start, chronological usage, year-end cap

**Regulatory Compliance:** Correct per 5 U.S.C. §§ 6303, 6303(a), 6304, 6307; OPM FERS Handbook Ch. 50 § 50A2.1-1.

**Issues Found:**

| ID | Severity | File | Description |
|----|----------|------|-------------|
| L-1 | Minor | `sick-leave.ts` | Assumes post-2014 FERS (100% sick leave credit). Pre-2014 was 50%. Add era flag if supporting pre-2014 hires. |
| L-2 | Minor | `models/leave.ts` | `LeaveEvent.type` includes `'family-care'` but code treats it as sub-type of sick. Calendar bridge (line 147) converts to just `'sick'`, losing the distinction. Decide semantic and align model. |

**Recommendations:**
1. If supporting pre-2014 retirees, add conditional sick-leave credit logic
2. Clarify `LeaveEvent.type` semantics: remove `'family-care'` from type union, track via `sickCode` only

---

### 2.3 TSP Modeling

**Location:** `app/src/modules/tsp/`
**Files:** `agency-match.ts`, `traditional.ts`, `roth.ts`, `rmd.ts`, `future-value.ts`, `import.ts`
**Data:** `data/tsp-limits.ts`
**Tests:** 140+ unit tests passing

**Current Approach:**
- Agency match: 1% auto + tiered match (100% first 3%, 50% next 2%) — always to Traditional (5 U.S.C. § 8432)
- Traditional/Roth projected separately with IRS 402(g) combined cap enforcement
- Catch-up: $7,500 (ages 50-59), $11,250 enhanced (ages 60-63, SECURE 2.0 § 109)
- RMD: Age 73 (born <1960) or 75 (born 1960+) per SECURE 2.0 § 107; IRS Pub 590-B Uniform Lifetime Table
- True-up: Biweekly simulation to detect mid-year cap and restore lost match (opt-in, defaults false)
- Post-retirement depletion: Traditional drawn first, RMD floor enforced, year-by-year tracking

**Regulatory Compliance:** All critical requirements correctly implemented — agency always to Traditional, Roth election employee-only, combined 402(g) cap, RMD on Traditional only, SECURE 2.0 enhanced catch-up.

**Issues Found:**

| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| T-1 | Accuracy | `future-value.ts:173` | **RMD prior-year balance approximation.** Code reverses current-year growth (`tradBalance / (1 + growthRate)`) to estimate prior-year-end balance. Introduces ~0.5% error at 7% growth. **Fix:** Track prior-year-end balance as a separate variable in the loop. |
| T-2 | Accuracy | `future-value.ts:~292` | **`projectPreRetirementTSP` does not call `clampToContributionLimit`.** If caller passes uncapped contribution %, projections silently exceed IRS limits. **Fix:** Enforce cap inside the function. |
| T-3 | Minor | `roth.ts:106-112` | When combined Trad+Roth exceeds 402(g) cap, Traditional gets priority and Roth is reduced. This is a documented assumption, consistent with most payroll systems. Consider optional proportional allocation. |
| T-4 | Minor | `tsp-limits.ts` | Projected limits beyond 2045 use last known value with no warning flag. Add `isProjected: boolean` to return type. Annual update required each November when IRS publishes new Notice. |

**Recommendations:**
1. **Fix T-1** — Track prior-year balance directly instead of reverse-engineering it
2. **Fix T-2** — Add `clampToContributionLimit` call inside `projectPreRetirementTSP`
3. Establish annual process: update `tsp-limits.ts` each November, `opm-interest-rates.ts` each January
4. Consider proportional cap allocation as optional strategy (T-3)

---

### 2.4 Expense Modeling

**Location:** `app/src/modules/expenses/`
**Files:** `categories.ts`, `inflation.ts`, `smile-curve.ts`

**Current Approach:**
- 10 expense categories summed to annual total; each validated ≥ 0
- Compound inflation: `base × (1 + rate)^years`, default 2.5% (CPI long-run average)
- Blanchett smile curve: Piecewise linear interpolation with 3 anchors (early=1.0, mid=0.85 at year 15, late=0.95 at year 30+)
- Healthcare inflation rate stored separately in `ExpenseProfile` but **not currently applied differentially** — single-rate inflation used in `categories.ts`

**Issues Found:**

| ID | Severity | File | Description |
|----|----------|------|-------------|
| E-1 | Design | `inflation.ts` / `retirement-simulation.ts` | Healthcare inflation differentiation exists in `retirement-simulation.ts` (full path) but NOT in `income-projection.ts` (simple path). The simple path uses single rate for all categories. This is an intentional dual-path difference but should be documented. |
| E-2 | Design | Module-wide | **Two smile curve models coexist:** Blanchett linear (expenses module, used by simple path) and GoGo/GoSlow/NoGo step-function (simulation module, used by full path). Both are valid but create dual-path complexity. Document when each is used. |

**Recommendations:**
1. Add inline documentation explaining dual-path expense modeling
2. Decide if `healthcareInflationRate` field in `ExpenseProfile` should be removed or actively used in simple path

---

### 2.5 Simulation Engine

**Location:** `app/src/modules/simulation/`
**Files:** `eligibility.ts`, `annuity.ts`, `income-projection.ts`, `retirement-simulation.ts`, `scenario.ts`, `scenario-comparison.ts`, `monte-carlo.ts`

**Current Approach:**
Three complementary engines:
1. **Simple path** (`income-projection.ts`): Eligibility → annuity → supplement → TSP future value → year-by-year to age 95 with Blanchett smile curve
2. **Full path** (`retirement-simulation.ts`): Dual-pot TSP (high-risk/low-risk × Trad/Roth), 5 withdrawal strategies, RMD enforcement, tax calculation (federal + state + IRMAA), GoGo/GoSlow/NoGo expenses, healthcare inflation differential, time-step buffer rebalancing
3. **Monte Carlo** (`monte-carlo.ts`): 1,000-trial stochastic simulation with Box-Muller normal returns (σ=16% stocks, σ=5% bonds), P10-P90 confidence bands

**Regulatory Compliance:**
- FERS eligibility: MRA+30, Age60+20, Age62+5, MRA+10-reduced — all correct per 5 U.S.C. § 8412
- Annuity: `High-3 × serviceYears × multiplier` (1% or 1.1% enhanced) — correct per OPM FERS Handbook Ch. 50
- FERS Supplement: `SSAt62 × min(federalYears, 40) / 40 × 12` — correct per 5 U.S.C. § 8421
- MRA+10 reduction: 5%/year under 62 — correct
- Roth withdrawals excluded from taxable income — correct per IRC § 402A
- Tax-bracket-fill strategy correctly fills current bracket with Traditional before Roth

**Issues Found:**

| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| S-1 | **Bug** | `income-projection.ts:93/101` | **Military buyback variable overwrite.** `totalMilitaryBuybackCompleted` is set on line 93 (`.every()` check) then overwritten on line 101 with a different `.some()` check. The original `.every()` result is lost. Fix: use the correct variable or rename. |
| S-2 | **Bug** | `monte-carlo.ts:268-270` | **Depletion age null check.** `medianDepletionAge === 0` is used to check for "no depletion" but `percentile()` returns 0 for an empty array. If a trial depletes at age 0 (edge case), it's incorrectly converted to `null`. Fix: check array length, not value. |
| S-3 | Accuracy | `scenario-comparison.ts:183-194` | **Lifetime PV uses midpoint-year approximation** instead of year-by-year summation `Σ(value_i / (1+r)^i)`. Can understate early-income or overstate late-expense scenarios. |
| S-4 | Minor | `retirement-simulation.ts` | **Custom withdrawal split unvalidated.** No schema check that `traditionalPct + rothPct = 1.0`. If unequal, withdrawals are underfunded or overfunded. Add Zod refinement. |
| S-5 | Minor | `monte-carlo.ts:120-121` | Standard deviations (16% stocks, 5% bonds) are hardcoded with no documentation or configurability. Cite source (e.g., Ibbotson SBBI) and consider making configurable. |
| S-6 | Minor | `annuity.ts:61` | Unsafe type cast `as unknown as Parameters<...>` for High-3 delegation. Works but fragile. Use explicit interface. |
| S-7 | Minor | `index.ts` | Naming collision: `compareScenarios` exported from both `scenario.ts` and `scenario-comparison.ts`. The PV variant aliased as `compareScenariosPV`. Rename one for clarity. |

**Recommendations:**
1. **Fix S-1** — Correct military buyback logic (likely needs both `.every(buyback > 0)` AND waiver check)
2. **Fix S-2** — Check `depletionAges.length === 0` instead of `medianDepletionAge === 0`
3. **Fix S-3** — Replace midpoint approximation with proper year-by-year PV summation
4. **Fix S-4** — Add Zod `.refine(d => d.traditionalPct + d.rothPct === 1.0)` to custom split schema
5. Document Monte Carlo volatility assumptions with source citation

---

### 2.6 Validation Module

**Location:** `app/src/modules/validation/`
**Status: NOT IMPLEMENTED (Phase 11 placeholder)**

Both exported functions throw `'Not implemented — Phase 11'`:
- `validateCareerInput()` — intended cross-field career validation
- `warnOnAssumptions()` — intended assumption warning flags

**Confirmed safe:** Neither function is called in production code. No runtime risk.

**Recommendation:** Implement in Phase 11 to add:
- Cross-form consistency checks (e.g., Simulation annuity vs FERS Estimate)
- Assumption range warnings (e.g., inflation > 6%, growth > 12%)
- TSP contribution sum vs 402(g) limit validation

---

### 2.7 Military Buyback

**Location:** `app/src/modules/military/`
**Files:** `buyback.ts`; **Data:** `data/opm-interest-rates.ts`
**UI Status:** Module retained but UI tab disconnected.

**Current Approach:**
- Principal: 3% of annual military basic pay per year (5 U.S.C. § 8411(b))
- Interest: OPM compound annual rate from published table (5 CFR § 842.304)
- Service credit: Added to FERS service only if buyback complete AND military retirement waived (if receiving)

**Regulatory Compliance:** Correct per 5 U.S.C. § 8411(b), 5 CFR § 842.304, OPM FERS Handbook Ch. 23.

**Issues Found:**

| ID | Severity | File | Description |
|----|----------|------|-------------|
| M-1 | Stale Data | `opm-interest-rates.ts` | Table current through 2025. 2026+ uses fallback (4.25%). Requires annual Federal Register update. |
| M-2 | Design | Module-wide | UI is disconnected. Military buyback calculations work in tests but users cannot enter data. Decide: complete UI or deprecate module. |

---

## 3. Charts & Dashboard

**Location:** `app/src/components/charts/`, `app/src/components/Dashboard.tsx`, `app/src/components/cards/`
**Components:** 12 total (6 chart, 1 Monte Carlo fan, 1 donut, 1 table, 2 utility wrappers, 1 skeleton)

**Current Approach:**
- All business logic in `useSimulation` hook; charts are pure presenters receiving flat typed data
- 8 chart datasets computed via `useMemo` (salaryHistory, leaveBalances, tspBalances, smileCurve, incomeWaterfall, tspLifecycle, expensePhases, rmdTimeline)
- 9-card summary panel (6 always, +3 when full simulation available)
- Consistent theme via `useChartTheme()` with light/dark mode support
- Responsive design: 250px mobile → 350px+ desktop

**Assessment:** Exemplary separation of concerns. Zero calculation issues found in chart components.

**Minor Issues:**

| ID | Severity | File | Description |
|----|----------|------|-------------|
| CH-1 | Cosmetic | `ExpensePhasesChart.tsx:87-89` | Phase transition ages derived from data (`find()`) instead of config props. Works with dense data but fragile with sparse data. Pass config values directly. |
| CH-2 | Cosmetic | `ExpensePhasesChart.tsx` | Missing `<Legend />` component. Add to distinguish "Adjusted Expenses" from "Blanchett Model". |
| CH-3 | Cosmetic | `LeaveBalancesChart.tsx:19`, `RMDComplianceChart.tsx:34` | Sick leave credit and RMD shortfall recalculated in tooltips on every hover. Store in data point type for consistency. |

---

## 4. Data Flow & Storage Architecture

### Current Architecture

```
Forms → useLocalStorage(key, zodSchema) → localStorage (15 keys + 2 drafts)
  → useAssembleInput (reads all keys) → SimulationInput | null
  → useSimulation (memoized) → SimulationData (result + 8 chart datasets)
  → Dashboard → Charts (pure render)
```

**Strengths:**
- Cross-tab sync via custom `retire:storage-change` event
- Schema versioning (currently v2) with ordered migration pipeline
- SSR-safe (returns null on server)
- Zod validation on every read/write

### Storage Key Inventory (17 total)

| Key | Written By | Read By | Status |
|-----|-----------|---------|--------|
| `retire:personal` | FERSEstimateForm | useAssembleInput | Active |
| `retire:fers-estimate` | FERSEstimateForm | useAssembleInput (fallback) | Active |
| `retire:career` | CareerEventsForm | useAssembleInput | Active |
| `retire:leave` | LeaveBalanceForm | useAssembleInput | **Dual with calendar** |
| `retire:leave-calendar` | LeaveCalendarGrid | (calendar UI only) | Active |
| `retire:tsp` | (deprecated v1) | useAssembleInput (fallback) | **Deprecated** |
| `retire:tsp:contributions` | FERSEstimateForm | useAssembleInput | Active |
| `retire:tsp:snapshots` | TSPMonitorPanel | useAssembleInput (preferred) | Active |
| `retire:expenses` | ExpensesForm | useAssembleInput | Active |
| `retire:tax-profile` | TaxProfileForm | useSimulation | Active |
| `retire:assumptions` | SimulationForm | useAssembleInput | Active |
| `retire:simulation-config` | SimulationForm | useSimulation | Active |
| `retire:scenarios` | ScenarioManager | ScenarioManager | Active |
| `retire:military` | (orphaned UI) | useAssembleInput | **UI disconnected** |
| `retire:fers-form-draft` | FERSEstimateForm | FERSEstimateForm | **Draft key** |
| `retire:simulation-form-draft` | SimulationForm | SimulationForm | **Draft key** |
| `retire:theme` | useTheme | useTheme | Active |

### Architecture Issues

| ID | Severity | Description |
|----|----------|-------------|
| D-1 | Design | **Dual TSP storage.** Legacy `retire:tsp` (flat balance) and new `retire:tsp:snapshots` (array) coexist. `useAssembleInput` prefers snapshots, falls back to legacy. Risk of inconsistency. **Deprecate legacy completely.** |
| D-2 | Design | **Leave dual storage.** `retire:leave` (snapshot) and `retire:leave-calendar` (full history) not synchronized. `useAssembleInput` reads only legacy. **Unify to calendar-only; derive snapshot.** |
| D-3 | Design | **SimulationInput.assumptions vs SimulationConfig overlap.** Both contain COLA, inflation, and withdrawal rates. Creates redundancy and divergence risk. **Merge into single canonical config.** |
| D-4 | Design | **Draft keys separate from main storage.** `retire:fers-form-draft` and `retire:simulation-form-draft` have no reconciliation with validated keys. Potential stale draft confusion. |

---

## 5. User Experience & Data Entry Redundancy

### 5.1 Redundant Fields Across Forms

| Field | FERS Estimate | Career | Expenses | Simulation | Fix |
|-------|:---:|:---:|:---:|:---:|-----|
| birthDate / birthYear | X | | | X | Read from FERS Estimate in Simulation |
| scdLeave | X | X | | | Remove from Career; read from FERS |
| scdRetirement | X | X | | | Remove from Career; read from FERS |
| paySystem | X | X | | | Remove from Career; read from FERS |
| ssaBenefitAt62 | X | | | X | Auto-populate in Simulation |
| inflationRate | | | X | X | Auto-populate in Simulation |
| healthcareInflationRate | | | X | X | Auto-populate in Simulation |
| baseAnnualExpenses | | | X (computed) | X | Auto-populate in Simulation |
| fersAnnuity | X (computed) | | | X (manual) | Auto-populate with override toggle |
| tspGrowthRate | X | | | X | Single source of truth |

**Impact:** Users must enter the same data 2-3 times. If they change a value in one form (e.g., inflation in Expenses), they must manually update it in Simulation. Conflicting data can persist silently.

### 5.2 "Pull from FERS Estimate" Button

The Simulation form has a manual button to auto-fill fields from prior forms. This is a workaround, not a feature.

**Recommendation:** Auto-populate fields by default with read-only display + edit-override toggle:

```
┌─ FERS Annuity ──────────────────────────────┐
│  $34,200/yr  (from FERS Estimate)  [Edit]   │
└─────────────────────────────────────────────-┘
```

### 5.3 Career Events Not Connected to High-3

Career events are collected in CareerEventsForm but **never feed into the FERS Estimate High-3 calculation**. The user must manually enter a High-3 override. This means the Career tab collects data that doesn't flow anywhere automatically.

**Recommendation:** Auto-compute High-3 from career events and display in FERS Estimate with override option.

### 5.4 No Cross-Form Validation

No warnings appear when:
- Simulation's `fersAnnuity` ($40k) differs from FERS Estimate's computed annuity ($30k)
- Simulation's `tspBalance` contradicts FERS Estimate or latest snapshot
- Simulation's inflation rates don't match Expenses form

**Recommendation:** Add comparison validators with sync prompts.

### 5.5 Form Complexity

- **FERSEstimateForm:** 73 fields across 6 collapsible sections, writing to 5 storage keys
- **SimulationForm:** 42 fields across 4 sections (853 lines — largest component)

**Recommendation:** Break FERS into sub-forms (Personal, Salary, Annuity, SS, TSP Balances, TSP Contributions, TSP Withdrawals). Add visual completion tracking.

### 5.6 Orphaned Components

4 form components retained but not rendered: `PersonalInfoForm`, `TSPForm`, `MilitaryServiceForm`, `AssumptionsForm`. These add maintenance burden.

**Recommendation:** Remove orphaned forms or complete their integration.

---

## 6. Consolidated Issue Register

### Bugs (Fix Immediately)

| ID | Module | File:Line | Description | Fix |
|----|--------|-----------|-------------|-----|
| S-1 | Simulation | `income-projection.ts:93/101` | Military buyback `totalMilitaryBuybackCompleted` overwritten by unrelated `.some()` check | Use both checks correctly; name variables distinctly |
| S-2 | Simulation | `monte-carlo.ts:268-270` | Depletion age median `=== 0` check fails for edge case | Check `depletionAges.length === 0` instead |

### Accuracy Improvements (High Priority)

| ID | Module | File:Line | Description | Impact | Fix |
|----|--------|-----------|-------------|--------|-----|
| T-1 | TSP | `future-value.ts:173` | RMD prior-year balance reversed from growth instead of tracked directly | ~0.5% RMD error at 7% growth | Track prior-year balance as separate loop variable |
| T-2 | TSP | `future-value.ts:~292` | `projectPreRetirementTSP` doesn't enforce IRS contribution limits | Silent cap overflow | Add `clampToContributionLimit()` call |
| S-3 | Simulation | `scenario-comparison.ts:183-194` | Lifetime PV uses midpoint year instead of Σ year-by-year | Distorts scenario comparison | Sum `value_i / (1+r)^i` per year |

### Data Maintenance (Medium Priority)

| ID | Module | File | Description | Cadence |
|----|--------|------|-------------|---------|
| C-1 | Career | `data/gs-pay-tables.ts` | Add 2025 GS base pay table | Annual (January) |
| C-2 | Career | `data/locality-rates.ts` | Add 2025 locality rates | Annual (January) |
| T-4 | TSP | `data/tsp-limits.ts` | Update IRS contribution limits 2026+ | Annual (November) |
| M-1 | Military | `data/opm-interest-rates.ts` | Update OPM interest rate for 2026+ | Annual (January) |

### Design Debt (Plan for Refactor)

| ID | Module | Description | Effort |
|----|--------|-------------|--------|
| D-1 | Storage | Deprecate `retire:tsp` legacy key; force migration to snapshots | Low |
| D-2 | Storage | Unify leave storage: calendar-only, derive current balance | Medium |
| D-3 | Storage | Merge `SimulationInput.assumptions` and `SimulationConfig` | Medium |
| S-4 | Simulation | Validate custom withdrawal split sums to 1.0 | Low |
| E-2 | Expenses | Document dual smile-curve models (Blanchett vs GoGo/GoSlow/NoGo) | Low |
| S-7 | Simulation | Rename `compareScenarios` / `compareScenariosPV` to avoid collision | Low |

### UX Improvements (Plan for Refactor)

| ID | Description | Effort |
|----|-------------|--------|
| UX-1 | Auto-populate Simulation form from FERS Estimate & Expenses (remove "Pull" button) | Medium |
| UX-2 | Remove redundant SCD/paySystem fields from CareerEventsForm | Low |
| UX-3 | Connect Career events to High-3 calculation with preview | Medium |
| UX-4 | Add cross-form validation with sync prompts | High |
| UX-5 | Add form completion tracking (checkmarks, progress indicators) | Medium |
| UX-6 | Remove orphaned form components | Low |
| UX-7 | Split FERSEstimateForm into sub-forms | Medium |
| UX-8 | Consolidate storage keys (17 → ~10) | High |

---

## 7. Implementation Roadmap

### Phase A: Bug Fixes & Accuracy (1 week)

1. **Fix S-1** — Military buyback variable overwrite in `income-projection.ts`
2. **Fix S-2** — Monte Carlo depletion age null check in `monte-carlo.ts`
3. **Fix T-1** — RMD prior-year balance tracking in `future-value.ts`
4. **Fix T-2** — IRS cap enforcement in `projectPreRetirementTSP`
5. **Fix S-4** — Custom withdrawal split validation
6. Run full test suite; update any affected tests

### Phase B: Data Updates (1 week, recurring annually)

1. Add 2025 GS pay table and locality rates
2. Update TSP contribution limits for 2026
3. Update OPM military buyback interest rate for 2026
4. Verify spreadsheet parity with updated data

### Phase C: UX Quick Wins (2 weeks)

1. **UX-2** — Remove redundant SCD/paySystem from CareerEventsForm (read from storage)
2. **UX-1** — Auto-populate Simulation form from prior tabs; add override toggles
3. **UX-6** — Remove orphaned form components (`PersonalInfoForm`, `TSPForm`, `AssumptionsForm`)
4. **UX-5** — Add form completion indicators (checkmarks per tab)

### Phase D: Architecture Cleanup (3-4 weeks)

1. **D-1** — Deprecate `retire:tsp`; force migration to snapshot-only
2. **D-2** — Unify leave storage (calendar-only)
3. **D-3** — Merge assumptions + simulation-config into single canonical config
4. **UX-3** — Connect Career events → High-3 auto-computation
5. **UX-4** — Cross-form validation layer with sync warnings
6. **S-3** — Fix PV calculation (year-by-year summation)

### Phase E: Form Refactor (4-6 weeks)

1. **UX-7** — Split FERSEstimateForm into sub-forms
2. **UX-8** — Consolidate storage keys (17 → ~10)
3. **E-2** — Document and potentially unify dual smile-curve models
4. Implement Phase 11 validation module (`validateCareerInput`, `warnOnAssumptions`)
5. Add integration tests for full data flow (form → storage → simulation → dashboard)
6. **M-2** — Decide: complete Military UI or deprecate module

---

*Report generated from comprehensive codebase review. All 731 tests passing at time of audit.*
