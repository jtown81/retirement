# TO-DO: Financial Accuracy Review

**Reviewed by**: Financial planner & tax specialist analysis
**Date**: 2026-03-10
**Scope**: All calculation modules in `src/modules/` and `src/data/`

---

## CRITICAL ERRORS (Regulatory / Accuracy)

### E-1: No Tax Module — After-Tax Income Not Calculated
**Files**: Entire codebase (missing `modules/tax/`)
**Severity**: CRITICAL
**Impact**: The simulation projects gross income only. Retirement planning requires after-tax income projections. Without taxes, users will significantly overestimate their purchasing power.

Missing calculations:
- Federal income tax on FERS annuity (fully taxable as ordinary income)
- Federal income tax on Traditional TSP withdrawals (fully taxable)
- Tax-free treatment of qualified Roth TSP withdrawals
- Social Security benefit taxation (0%, 50%, or 85% taxable depending on combined income per IRS Pub 915)
- IRMAA surcharges (Medicare Part B/D premium increases at higher income levels per IRC § 1839(i))
- State income tax (varies; some states exempt federal pension/SS)

**Recommendation**: Implement a tax module with at minimum:
1. Federal marginal tax bracket engine (IRC § 1)
2. Standard deduction (age 65+ gets additional $1,550/$1,950 per IRC § 63(f))
3. SS taxation formula (provisional income test)
4. IRMAA tier lookup
5. Effective tax rate applied to each income source

---

### E-2: SECURE 2.0 RMD Age 75 Not Implemented
**File**: `src/modules/tsp/rmd.ts:104-106`
**Severity**: HIGH (regulatory)
**Issue**: `isRMDRequired()` hardcodes age 73 for all individuals. Per SECURE 2.0 Act § 107:
- Born before 1960: RMD begins at age 73
- Born 1960 or later: RMD begins at age 75 (effective 2033)

The code has a comment acknowledging this but never implements it. For someone born in 1965, the app would incorrectly trigger RMDs 2 years early.

**Fix**: Accept `birthYear` parameter and use conditional:
```typescript
export function isRMDRequired(age: number, birthYear: number): boolean {
  const rmdAge = birthYear >= 1960 ? 75 : 73;
  return age >= rmdAge;
}
```

---

### E-3: TSP 2026 Contribution Limits Inconsistent
**File**: `src/data/tsp-limits.ts:37`
**Severity**: HIGH (data)
**Issue**: Code shows 2026 limits as `$24,000 / $7,500` but project MEMORY.md documents a correction to `$24,500 / $8,000` citing IRS Notice 2025-67. The code was not updated to match.

**Fix**: Update line 37:
```typescript
{ year: 2026, electiveDeferralLimit: 24500, catchUpLimit: 8000 },
```
Also update all subsequent projected years (+$500 recalibration).

---

### E-4: SECURE 2.0 Enhanced Catch-Up (Ages 60-63) Not in Limit Engine
**Files**: `src/data/tsp-limits.ts`, `src/modules/tsp/traditional.ts`, `src/modules/tsp/roth.ts`
**Severity**: HIGH (regulatory)
**Issue**: MEMORY.md documents enhanced catch-up amounts ($11,250 for 2025, $12,000 for 2026+ per SECURE 2.0), but:
- `TSPLimits` interface has a single `catchUpLimit` field
- `clampToContributionLimit()` uses a boolean `isCatchUpEligible` — no distinction between standard (age 50-59) vs enhanced (age 60-63)
- Someone aged 61 contributing catch-up would be capped at $7,500 instead of $11,250/$12,000

**Fix**: Add `enhancedCatchUpLimit` to `TSPLimits` and accept age in `clampToContributionLimit()`:
```typescript
interface TSPLimits {
  electiveDeferralLimit: number;
  catchUpLimit: number;           // ages 50-59, 64+
  enhancedCatchUpLimit: number;   // ages 60-63 (SECURE 2.0)
}
```

---

### E-5: FERS COLA Formula Oversimplified
**Files**: `src/modules/simulation/retirement-simulation.ts:78`, `src/modules/simulation/income-projection.ts:160`
**Severity**: MEDIUM-HIGH (regulatory)
**Issue**: Code applies COLA as a flat rate: `annuity * (1 + colaRate)^yr`. Real FERS COLA rules (5 U.S.C. § 8462):
- CPI increase <= 2.0%: full COLA applied
- CPI increase 2.0% - 3.0%: COLA capped at 2.0%
- CPI increase > 3.0%: COLA = CPI - 1.0%

Over a 30-year projection at 2.5% assumed CPI, the model gives 2.5% COLA/year but actual FERS COLA would be 2.0%. Over 30 years this compounds to a **15% overstatement** of annuity income.

**Fix**: Implement the FERS COLA cap:
```typescript
function fersColaRate(cpiRate: number): number {
  if (cpiRate <= 0.02) return cpiRate;
  if (cpiRate <= 0.03) return 0.02;
  return cpiRate - 0.01;
}
```

---

### E-6: Social Security Claiming Age Fixed at 62
**Files**: `src/modules/simulation/retirement-simulation.ts:82-84`, `src/models/simulation.ts:106`
**Severity**: MEDIUM-HIGH (planning impact)
**Issue**: The model hardcodes SS income starting at age 62 with no option for delayed claiming. This ignores:
- Actuarial reduction for early claiming (benefit reduced ~6.67%/yr before FRA)
- Delayed retirement credits (8%/yr increase from FRA to 70)
- For someone with FRA of 67: claiming at 62 = 70% of PIA, claiming at 70 = 124% of PIA

The difference between claiming at 62 vs 70 is a 77% increase in monthly benefit. This is one of the most impactful retirement decisions and the tool doesn't support it.

**Recommendation**: Add `ssClaimingAge` (62-70) to SimulationConfig and apply the SSA actuarial adjustment factors.

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

### E-12: Dual Simulation Engines May Diverge
**Files**: `src/modules/simulation/income-projection.ts`, `src/modules/simulation/retirement-simulation.ts`
**Severity**: MEDIUM (user confusion)
**Issue**: Two separate simulation engines exist:
1. `projectRetirementIncome()` — simpler, used by main `useSimulation` hook
2. `projectRetirementSimulation()` — detailed dual-pot TSP, used by full simulation

These use different withdrawal models, different expense calculations, and different data structures. They could produce materially different results for the same scenario.

**Recommendation**: Consolidate into a single engine or clearly document which is canonical.

---

### E-13: FERS Supplement Missing Eligibility Types
**File**: `src/modules/simulation/annuity.ts:140`
**Severity**: LOW-MEDIUM
**Issue**: FERS Supplement eligible types are limited to `['MRA+30', 'Age60+20']`. Per OPM, the supplement is also available for:
- Involuntary separation (age MRA + 10 years, no reduction)
- Discontinued service
- Special provisions (LEO, firefighters, air traffic controllers)

---

### E-14: No FEHB Premium Modeling
**Severity**: MEDIUM (planning)
**Issue**: Federal Employees Health Benefits program premiums continue in retirement (government pays ~72%, retiree pays ~28%). FEHB is often the largest single expense for federal retirees but isn't explicitly modeled. Users must manually include it in expense categories.

**Recommendation**: Add FEHB as a dedicated expense input with government subsidy calculation.

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

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | E-1: Tax module | Large | Critical — changes all financial projections |
| 2 | E-5: FERS COLA cap | Small | High — 15% overstatement over 30 years |
| 3 | E-6: SS claiming age | Medium | High — 77% benefit difference at 62 vs 70 |
| 4 | E-2: RMD age 75 | Small | High — regulatory compliance |
| 5 | E-4: Enhanced catch-up | Medium | High — $3,750-$4,500/yr difference for ages 60-63 |
| 6 | E-11: Survivor benefit | Small | Medium — 5-10% annuity reduction |
| 7 | E-3: TSP 2026 limits | Trivial | Medium — data correction |
| 8 | C-1: Tax waterfall chart | Medium | High — most requested visualization |
| 9 | C-2: SS claiming chart | Medium | High — key planning decision |
| 10 | E-9: TSP chart balance | Trivial | Medium — misleading visualization |
| 11 | E-7: Military years calc | Small | Medium — affects annuity |
| 12 | E-12: Consolidate engines | Medium | Medium — reduce confusion |
| 13 | C-3-C-10: Additional charts | Medium each | Medium — better planning insights |
| 14 | E-8: Tautological filter | Trivial | Low — code hygiene |
