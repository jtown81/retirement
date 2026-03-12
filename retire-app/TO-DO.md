# TO-DO: Financial Accuracy Review

**Reviewed by**: Financial planner & tax specialist analysis
**Date**: 2026-03-10
**Scope**: All calculation modules in `src/modules/` and `src/data/`

---

## CRITICAL ERRORS (Regulatory / Accuracy) — ALL RESOLVED ✅

### E-1: No Tax Module — ✅ COMPLETE
**Files**: `src/modules/tax/` (federal.ts, irmaa.ts, social-security.ts, brackets.ts)
**Status**: IMPLEMENTED (2024-2025)
**Implementation**:
- Federal income tax calculation with progressive bracket tables (IRC § 1)
- Standard deduction (age 65+ adjustments per IRC § 63(f))
- Social Security benefit taxation (provisional income formula per IRS Pub 915)
- IRMAA surcharges (Medicare Part B/D per IRC § 1839(i))
- Federal + State tax computation
- Fully integrated into `unifiedRetirementSimulation` (computes annual tax at line 192)

**Status in App**: Tax-adjusted results now available in simulation output (federalTax, irmaaSurcharge, stateTax, totalTax fields).

---

### E-2: SECURE 2.0 RMD Age 75 — ✅ COMPLETE
**File**: `src/modules/tsp/rmd.ts:107`
**Status**: IMPLEMENTED (2024-2025)
**Implementation**:
```typescript
const rmdAge = birthYear && birthYear >= 1960 ? 75 : 73;
```
- Correctly applies age 73 for pre-1960 births
- Correctly applies age 75 for 1960+ births (effective 2033)
- Both `isRMDRequired()` and `computeRMD()` accept birthYear parameter
- Integrated into unified engine

---

### E-3: TSP 2026 Contribution Limits — ✅ CORRECTED
**File**: `src/data/tsp-limits.ts:36`
**Status**: UPDATED (2026-03-11)
**Implementation**:
- 2026: $24,500 elective deferral limit (corrected from $24,000)
- Matches IRS Notice 2025-67
- All subsequent years also updated (+$500/year projection)

---

### E-4: SECURE 2.0 Enhanced Catch-Up (Ages 60-63) — ✅ COMPLETE
**Files**: `src/data/tsp-limits.ts`, `TSPLimits` interface
**Status**: IMPLEMENTED (2024-2025)
**Implementation**:
- `TSPLimits` interface includes `enhancedCatchUpLimit` field
- Separate logic for ages 60-63 vs ages 50-59 and 64+
- 2025-2028: $8,000 enhanced catch-up per SECURE 2.0
- Properly used in contribution limit calculations

---

### E-5: FERS COLA Formula — ✅ COMPLETE
**File**: `src/modules/simulation/eligibility.ts:195-201`
**Status**: IMPLEMENTED (2024-2025)
**Implementation**:
```typescript
export function fersCOLARate(cpiRate: number): number {
  if (cpiRate <= 0.02) return cpiRate;           // Full COLA if CPI <= 2%
  if (cpiRate <= 0.03) return 0.02;              // Capped at 2% if 2% < CPI <= 3%
  return cpiRate - 0.01;                         // CPI - 1% if CPI > 3%
}
```
- Correctly implements 5 U.S.C. § 8462 COLA cap
- Fixes 15% overstatement issue from simplified formula
- Used in unified engine line 74

---

### E-6: Social Security Claiming Age (62-70) — ✅ COMPLETE
**Files**: `src/modules/simulation/eligibility.ts`, `src/models/simulation.ts`
**Status**: IMPLEMENTED (2024-2025)
**Implementation**:
- `SimulationConfig` includes `ssClaimingAge` field (62-70)
- `ssAdjustmentFactor()` computes FRA-based actuarial adjustments:
  - Before FRA: 6.67% reduction per year
  - At FRA: 100% of PIA
  - After FRA: 8% delayed retirement credits per year
- Correctly handles all ages 62-70 with proper benefit calculations
- Integrated into unified engine (lines 77-78, 111-112)

**Result**: Users can now optimize Social Security claiming age; difference between claiming at 62 vs 70 properly reflects ~77% benefit increase.

---

## SIGNIFICANT ISSUES (Logic / Modeling)

### E-7: Military Service Years Calculated Inaccurately
**File**: `src/modules/simulation/income-projection.ts:88-92`
**Severity**: MEDIUM
**Issue**: Military service duration uses `endYear - startYear` (full years only). Someone serving Jan 2010 to Nov 2013 gets 3 years credit instead of ~3.9 years. This directly affects annuity calculation.

**Fix**: Use month-level calculation:
```typescript
const monthsDiff = /* months between start and end dates */;
return sum + monthsDiff / 12;
```

---

### E-8: Tautological Military Service Filter
**File**: `src/modules/simulation/income-projection.ts:87-88`
**Severity**: LOW (code quality)
**Issue**: `.filter((m) => m.militaryRetirementWaived || !m.militaryRetirementWaived)` always returns true. This is a no-op filter.

**Fix**: Remove the filter entirely, or replace with meaningful logic if intended to exclude certain records.

---

### E-9: TSP Chart Balance Uses 10% of Actual Balance
**File**: `src/hooks/useSimulation.ts:80`
**Severity**: MEDIUM (visualization)
**Issue**: `openingBalance: tradBalance > 0 ? tradBalance * 0.1 : 0` — the TSP projection chart uses 10% of the actual Traditional balance as the opening value. This produces misleading chart data.

**Fix**: Use the full `tradBalance` value, or document why 10% is used (perhaps approximating contributions-only growth?).

---

### E-10: High-3 Calculation Doesn't Handle Service Gaps
**File**: `src/modules/career/projection.ts:226-244`
**Severity**: MEDIUM
**Issue**: `computeHigh3Salary` slides a window of 3 consecutive array positions, but years during separations are omitted from the array. If a person has years [2018, 2019, 2022, 2023, 2024] (gap 2020-2021), the function could compare non-consecutive years (2019, 2022, 2023) as if they were consecutive.

Per OPM, High-3 is the highest 3 **consecutive** years of service. The current implementation would correctly find the highest 3-year average but might inadvertently mix pre/post separation salaries that aren't truly consecutive.

**Fix**: Track whether salary years are actually consecutive when computing the sliding window.

---

### E-11: Survivor Benefit Reduction Not Calculated
**Files**: `src/modules/simulation/annuity.ts`, `src/models/simulation.ts:101`
**Severity**: MEDIUM (planning impact)
**Issue**: SimulationConfig describes `fersAnnuity` as "after survivor benefit reduction" but `computeFERSAnnuity()` never applies one. The survivor benefit election reduces the annuity by:
- 10% for maximum survivor benefit (50% to surviving spouse)
- 5% for partial survivor benefit (25% to surviving spouse)

Most married federal employees elect the full survivor benefit. A 10% reduction is significant.

**Recommendation**: Add survivor benefit election to the model and apply reduction in `computeFERSAnnuity()`.

---

### E-12: Dual Simulation Engines May Diverge — ✅ COMPLETE (2026-03-11)
**Files**: `src/modules/simulation/income-projection.ts` (updated), `src/modules/simulation/retirement-simulation.ts` (DELETED)
**Resolution**:
- Deleted the deprecated `retirement-simulation.ts` wrapper
- Removed `projectRetirementSimulation` export from barrel
- Updated all call sites (`SimulationForm.tsx`, `ScenarioComparison.tsx`, tests) to use `unifiedRetirementSimulation` directly
- Added JSDoc clarification to `income-projection.ts` explaining profile-assembly vs post-retirement engines

Result: **Single canonical engine** (`unifiedRetirementSimulation`) now clearly the sole projection engine. No more dual-engine confusion.

---

### E-13: FERS Supplement Missing Eligibility Types
**File**: `src/modules/simulation/annuity.ts:140`
**Severity**: LOW-MEDIUM
**Issue**: FERS Supplement eligible types are limited to `['MRA+30', 'Age60+20']`. Per OPM, the supplement is also available for:
- Involuntary separation (age MRA + 10 years, no reduction)
- Discontinued service
- Special provisions (LEO, firefighters, air traffic controllers)

---

### E-14: No FEHB Premium Modeling — ✅ COMPLETE (2026-03-11)
**Severity**: MEDIUM (planning)
**Resolution**:
- Added `fehbPremiumAnnual?: USD` to `SimulationConfig` in `src/models/simulation.ts`
- Added `fehbPremiumAnnual: USDSchema.optional()` to schema in `src/storage/zod-schemas.ts`
- Updated `unified-engine.ts` to include FEHB premiums in healthcare expense calculations (inflated at `healthcareInflationRate`)
- Added dedicated "FEHB Premium ($/yr)" input field in SimulationForm Expenses section with enrollment tier hints:
  - Self Only ≈ $2,400 · Self+1 ≈ $5,500 · Family ≈ $6,500

Result: FEHB premiums (~28% employee share after government subsidy) now explicitly modeled alongside other healthcare costs.

---

## DATA ISSUES

### D-1: Projected TSP Limits Assume Linear +$500/year
**File**: `src/data/tsp-limits.ts:35-57`
**Issue**: Projected limits beyond known years assume $500/year increases. Historical IRS adjustments vary ($0-$2,000/year) based on CPI rounding rules. The projections should be flagged more prominently as estimates.

### D-2: OPM Interest Rates Need Annual Update
**File**: `src/data/opm-interest-rates.ts`
**Issue**: OPM publishes new interest rates annually (BAL letters). The rate affects military buyback deposit interest. Ensure 2026 rate (4.25% per BAL 26-301) is current.

### D-3: Uniform Lifetime Table May Need Updates
**File**: `src/modules/tsp/rmd.ts:36-81`
**Issue**: The IRS Uniform Lifetime Table was updated effective 2022 (longer life expectancies). Verify these values match IRS Pub 590-B (2024 revision). The values appear correct but should be cross-checked annually.

---

## RECOMMENDED ADDITIONAL CHARTS & OUTPUTS

### Chart C-1: Tax-Adjusted Income Waterfall
Show gross income by source (annuity, TSP, SS) stacked, with a separate line showing after-tax income. This is the most important missing visualization — gross income is meaningless for planning purposes without tax context.

### Chart C-2: Social Security Claiming Age Comparison
Side-by-side comparison showing cumulative lifetime SS income at ages 62, 67 (FRA), and 70. Includes break-even age analysis. This is the single most impactful retirement optimization decision.

### Chart C-3: Replacement Ratio Gauge
A gauge/donut chart showing post-retirement income as a percentage of pre-retirement income. Financial planners typically target 70-85% replacement ratio. Show the user where they fall.

### Chart C-4: Purchasing Power Erosion
Line chart showing how $1 of retirement income declines in real purchasing power over 30 years at different inflation rates. Helps users understand why inflation is the silent killer of retirement security.

### Chart C-5: Roth vs Traditional TSP Tax Efficiency
Compare two scenarios: (A) all-Traditional TSP with taxable withdrawals, (B) Roth-heavy with tax-free withdrawals. Show cumulative after-tax income over the retirement horizon.

### Chart C-6: Healthcare Cost Projection
Dedicated chart showing healthcare expenses growing at the healthcare inflation rate (typically 5-6%) vs general expenses growing at CPI (2-3%). Over 30 years, healthcare can grow from 15% to 40%+ of total spending.

### Chart C-7: FERS Supplement Gap Analysis
Timeline showing income sources by age: annuity starts at retirement, supplement bridges to age 62, SS begins at claiming age. Highlights any income gaps.

### Chart C-8: Annuity Sensitivity Analysis
Show how annuity changes with different retirement ages (e.g., retiring at 57 vs 60 vs 62). Include the impact of the 1.1% multiplier at age 62 with 20+ years.

### Chart C-9: TSP Depletion Probability Heatmap
Using Monte Carlo results, show probability of TSP lasting to each age (65, 75, 85, 95) under different return assumptions.

### Chart C-10: Net Cash Flow Timeline
Bar chart showing year-by-year surplus/deficit (income minus expenses). Color-code: green for surplus years, red for deficit years where TSP drawdown is needed.

---

## ASSUMPTIONS TO FLAG TO USERS

The following assumptions are embedded in calculations but should be surfaced prominently in the UI:

1. **Constant growth rates** — TSP returns vary dramatically year-to-year; a 7% average masks significant sequence-of-returns risk
2. **No taxes applied** — All income projections are pre-tax
3. **FERS COLA simplified** — Using flat rate instead of the CPI-cap formula
4. **SS starts at 62** — No delayed claiming optimization
5. **No FEHB premium** — Health insurance cost not explicitly modeled
6. **No Part B/D IRMAA** — Medicare surcharges not calculated
7. **Single inflation rate** — Real expenses have category-specific inflation (housing vs healthcare vs food)
8. **No sequence-of-returns risk** — Withdrawing in a down market is more damaging than average returns suggest
9. **No required survivor benefit** — Most married feds must elect survivor benefit unless spouse signs waiver

---

## PRIORITY ORDER

### Completed Items ✅
| Item | Completion Date | Status |
|------|-----------------|--------|
| E-1: Tax module | 2024-2025 | ✅ COMPLETE — Federal, state, IRMAA taxes; integrated into simulation |
| E-2: RMD age 75 | 2024-2025 | ✅ COMPLETE — SECURE 2.0 compliant (age 73 pre-1960, age 75 post-1960) |
| E-3: TSP 2026 limits | 2026-03-11 | ✅ COMPLETE — Corrected to $24,500; all years updated |
| E-4: Enhanced catch-up | 2024-2025 | ✅ COMPLETE — Distinct $8,000 limit for ages 60-63 per SECURE 2.0 |
| E-5: FERS COLA cap | 2024-2025 | ✅ COMPLETE — Proper CPI capping formula (5 U.S.C. § 8462) |
| E-6: SS claiming age | 2024-2025 | ✅ COMPLETE — Ages 62-70 with FRA-based actuarial adjustments |
| E-12: Consolidate engines | 2026-03-11 | ✅ COMPLETE — Single canonical `unifiedRetirementSimulation` engine |
| E-14: FEHB premium modeling | 2026-03-11 | ✅ COMPLETE — Dedicated input field with enrollment tier hints |

### Recently Completed Items ✅ (2024-2026)
| Item | Status | Details |
|------|--------|---------|
| E-11: Survivor benefit reduction | ✅ COMPLETE | 10% (full), 5% (partial), 0% (none) applied in annuity calc |
| C-1: Tax waterfall chart | ✅ COMPLETE | TaxAdjustedIncomeChart.tsx renders gross → after-tax |
| C-2: SS claiming comparison | ✅ COMPLETE | SSClaimingComparisonChart.tsx compares ages 62/67/70 |
| E-9: TSP chart balance | ✅ FIXED | Now uses full tradBalance (was 10% scaling) |
| E-7: Military years precision | ✅ COMPLETE | Month-level calculation via yearsBetween() |
| C-3: Replacement ratio chart | ✅ COMPLETE | ReplacementRatioChart.tsx implemented |
| C-4: Purchasing power chart | ✅ COMPLETE | PurchasingPowerChart.tsx shows real purchasing power erosion |
| C-5: Roth vs Traditional | ✅ COMPLETE | RothVsTraditionalChart.tsx tax efficiency comparison |
| C-6: Healthcare cost chart | ✅ COMPLETE | HealthcareCostChart.tsx with dual inflation rates |
| C-7: FERS supplement gap | ✅ COMPLETE | FERSSupplementGapChart.tsx shows annuity/supplement/SS timeline |
| C-8: Annuity sensitivity | ✅ COMPLETE | AnnuitySensitivityChart.tsx explores retirement age impact |
| C-9: TSP depletion chart | ✅ COMPLETE | TSPDepletionChart.tsx with Monte Carlo confidence bands |
| C-10: Net cash flow | ✅ COMPLETE | NetCashFlowChart.tsx shows surplus/deficit timeline |
| E-8: Tautological filter | ✅ REMOVED | Filter no longer present in income-projection.ts |

### Remaining Items (True Open Issues)
| Priority | Item | Status | Impact |
|----------|------|--------|--------|
| 1 | E-13: Special supplement provisions | PARTIAL | Add LEO, firefighter, air traffic controller eligibility (low priority) |
| 2 | Dashboard responsive design | PENDING | Mobile layout optimization for small screens |
| 3 | Performance optimization | PENDING | Memoization, code-splitting, bundle size reduction |
| 4 | FEHB 5-year coverage rule | OPTIONAL | Advanced feature (only users changing coverage need) |
| 5 | State income tax config | PENDING | Add state selection UI (calculations implemented) |
