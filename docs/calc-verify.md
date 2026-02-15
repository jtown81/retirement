# Calculation Verification & Enhancement Plan (`calc-verify.md`)

## Context

The app has two parallel calculation paths that diverge in sophistication:

1. **Simple path** (`income-projection.ts`): Used by the basic `projectRetirementIncome()` function. Treats TSP as a single pool — no Traditional/Roth split, no high/low risk pots, no RMD enforcement, no Social Security income.

2. **Full path** (`retirement-simulation.ts`): Used by `projectRetirementSimulation()`. Has dual-pot TSP (high-risk/low-risk × Traditional/Roth = 4 sub-balances), RMD enforcement, Social Security, GoGo/GoSlow/NoGo smile curve, and time-step buffer rebalancing.

**The problem**: The simple path is what `useSimulation` actually feeds to the Dashboard charts. The full simulation engine exists but is not wired into the main data flow. Additionally, neither path has been verified against the spreadsheet (`baseline.json` is empty), and several financial calculations have gaps.

This plan details every input, output, and calculation — from simple FPV to the complex simulated values — and what work is needed to verify, fix, and connect them.

---

## Part 1: Inputs Inventory

### 1.1 User-Entered Inputs (Forms → localStorage)

| Storage Key | Form | Key Fields |
|---|---|---|
| `retire:fers-estimate` | FERS Estimate | birthDate, scdRetirement, scdLeave, paySystem, grade, step, localityCode, annualSalary, currentTSPBalance (trad+roth), tspContributionPct, tspGrowthRate, withdrawalRate, colaRate, estimatedSSMonthlyAt62, retirementHorizonYears, proposedRetirementDate |
| `retire:career` | Career | Array of CareerEvents (hire, promotion, step-increase, locality-change, separation, rehire) |
| `retire:expenses` | Expenses | 10 expense categories (amounts), inflationRate, healthcareInflationRate, smileCurveEnabled, smileCurveParams (early/mid/late multipliers, midDipYear) |
| `retire:simulation-config` | Simulation | traditionalPct, highRiskPct, highRiskROI, lowRiskROI, withdrawalRate, timeStepYears, goGoEndAge, goGoRate, goSlowEndAge, goSlowRate, noGoRate, colaRate, inflationRate, healthcareInflationRate, healthcareAnnualExpenses, endAge |
| `retire:leave` | (via FERS Estimate) | annualLeaveHours, sickLeaveHours, annualCeilingHours |
| `retire:tsp` | (via FERS Estimate) | traditionalBalance, rothBalance, asOf date |
| `retire:military` | (disconnected) | startDate, endDate, payRecords, buybackDepositPaid, militaryRetirementWaived |

### 1.2 Derived Intermediate Values

| Value | Source Module | Formula |
|---|---|---|
| Salary history | `career/projection` | Year-by-year pay from career events + WGI + locality |
| High-3 salary | `simulation/annuity` | Max 3-consecutive-year average from salary history |
| Creditable service | `career/scd` + `leave/retirement-credit` + `military/buyback` | Civilian years + sick leave credit + military buyback years |
| FERS eligibility | `simulation/eligibility` | Age × service × birth year → MRA+30 / Age60+20 / Age62+5 / MRA+10-reduced |
| Agency match | `tsp/agency-match` | 1% auto + tiered match (100% of first 3%, 50% of next 2%) — always Traditional |
| TSP FPV at retirement | `tsp/future-value` | `FV = PV×(1+r/12)^(n×12) + PMT×[((1+r/12)^(n×12)-1)/(r/12)]` |

---

## Part 2: Calculations — Standard Retirement Planning (FPV of TSP and FERS)

### 2.1 TSP Future Present Value (Pre-Retirement)

**Current implementation** (`tsp/future-value.ts`):
```
FV = currentBalance × (1 + r/12)^(months) + monthlyContribution × [((1 + r/12)^(months) - 1) / (r/12)]
```
- Monthly compounding
- Assumes level contributions throughout
- Does NOT account for: salary growth affecting contributions, IRS limit increases, catch-up contribution eligibility, or agency match growth

**What needs verification**:
- [ ] Compare FV output against spreadsheet "Basic Calculator" K39
- [ ] Verify monthly vs. biweekly compounding matches spreadsheet convention
- [ ] Verify contribution input is correctly converted (biweekly → monthly or annual → monthly)

**What needs enhancement**:
- [ ] Year-by-year FPV that accounts for rising salary (contributions as % of salary grow with pay progression)
- [ ] IRS limit enforcement per year (currently only in detailed projection, not in simple FV)
- [ ] Catch-up contribution addition at age 50+

### 2.2 FERS Annuity

**Current implementation** (`simulation/annuity.ts`):
```
multiplier = (age ≥ 62 && service ≥ 20) ? 1.1% : 1.0%
grossAnnuity = High3 × creditableService × multiplier
MRA+10 reduction = max(0, 1 - floor(62 - age) × 0.05) per year under 62
netAnnuity = grossAnnuity × reductionFactor
```

**What needs verification**:
- [ ] High-3 algorithm matches OPM definition (consecutive service periods, not necessarily consecutive calendar years)
- [ ] Creditable service correctly includes: civilian time + sick leave credit + military buyback
- [ ] Sick leave conversion: 2,087 hours = 1 year (OPM standard)
- [ ] MRA+10 reduction uses floor (full years under 62), confirmed at 5% per year

**What needs enhancement**:
- [ ] Survivor benefit reduction (5% for full survivor, 10% for partial — currently not modeled)
- [ ] Part-time service proration (not modeled)

### 2.3 FERS Supplement (SRS)

**Current implementation** (`simulation/annuity.ts`):
```
monthlyAmount = estimatedSSAt62 × (min(federalYears, 40) / 40)
annualAmount = monthlyAmount × 12
```

**What needs verification**:
- [ ] Only eligible for immediate unreduced (MRA+30, Age60+20) — correctly blocks MRA+10 and Age62+5
- [ ] Stops at age 62 (correctly implemented in projection loop)
- [ ] Service cap at 40 years confirmed

### 2.4 Agency Match

**Current implementation** (`tsp/agency-match.ts`):
```
auto = salary × 0.01
match = salary × min(contributionPct, 0.03) + salary × max(0, min(contributionPct - 0.03, 0.02)) × 0.50
total = auto + match
```

**What needs verification**:
- [ ] Agency match ALWAYS goes to Traditional (5 U.S.C. § 8432(c)) — confirmed in code
- [ ] Match formula against OPM TSP matching contribution rules
- [ ] Verify the total match cap is 5% of salary (1% auto + 4% matching)

---

## Part 3: Complex Simulated Values — The Full Retirement Simulation

### 3.1 Dual-Pot TSP Model (Post-Retirement)

The full simulation (`retirement-simulation.ts`) splits TSP into a 2×2 matrix:

|  | Traditional | Roth |
|---|---|---|
| **High-Risk** (C/S/I funds) | `highRiskTrad` | `highRiskRoth` |
| **Low-Risk** (G/F funds) | `lowRiskTrad` | `lowRiskRoth` |

**Initial split**:
```
traditionalBalance = totalTSP × traditionalPct         (user-defined, default 70%)
rothBalance        = totalTSP × (1 - traditionalPct)   (remainder)
highRisk[Trad|Roth] = balance × highRiskPct             (user-defined, default 60%)
lowRisk[Trad|Roth]  = balance × (1 - highRiskPct)       (remainder)
```

**Per-year processing (8 steps)**:

#### Step 1: Income
```
annuity = fersAnnuity × (1 + colaRate)^yr
supplement = age < 62 ? fersSupplement × (1 + colaRate)^yr : 0
ss = age ≥ 62 ? ssMonthlyAt62 × 12 × (1 + colaRate)^max(0, yr - yearsSS) : 0
```

**Issues to verify/fix**:
- [ ] Social Security COLA should start from SS start date, not retirement date — current code does `yr - (62 - retireAge)` which is correct only if SS starts at 62
- [ ] User should be able to choose SS start age (62, 67, 70) — currently hardcoded to 62
- [ ] SS benefit at different claiming ages differs significantly — no adjustment factor applied

#### Step 2: Expenses
```
nonHC = (baseExpenses - healthcareExpenses) × (1 + inflationRate)^yr
HC = healthcareExpenses × (1 + healthcareInflationRate)^yr
totalExpenses = (nonHC + HC) × smileMultiplier(age)
```

**Issues to verify/fix**:
- [ ] Smile curve in full simulation uses GoGo/GoSlow/NoGo age-based multipliers (step function), NOT the linear interpolation from `expenses/smile-curve.ts` — these are two different models
- [ ] Verify which model the spreadsheet uses
- [ ] Healthcare inflation correctly applied separately — confirmed

#### Step 3–4: TSP Withdrawal + RMD
```
plannedWithdrawal = baseWithdrawal × (1 + colaRate)^yr
traditionalShare = totalBalance > 0 ? planned × (trad / total) : 0
rmd = computeRMD(traditionalBalance, age)
tradWithdrawal = max(traditionalShare, rmd)
rothWithdrawal = max(0, planned - tradWithdrawal)
```

**Issues to verify/fix**:
- [ ] **User-defined withdrawal proportions**: Currently withdrawals are split proportionally by balance ratio (trad/total). The user should be able to override this — e.g., "draw 80% from Traditional, 20% from Roth" or "draw Roth first until exhausted"
- [ ] RMD correctly uses prior-year-end balance for calculation (currently uses start-of-year balance after rebalancing — close but not exactly Dec 31 prior year)
- [ ] RMD age threshold hardcoded at 73 — needs to handle SECURE 2.0 transition to 75 in 2033 based on birth year
- [ ] Roth TSP is NOT subject to RMD after SECURE Act 2.0 (2024+) — current code only applies RMD to Traditional, which is correct
- [ ] When RMD forces a larger Traditional withdrawal, the excess above planned should either be reinvested (taxable account) or added to income — currently it's just withdrawn and counted as income

#### Step 5: Withdrawal Order (Low-Risk First)
```
fromLowRisk = min(needed, lowRiskBalance)
fromHighRisk = max(0, needed - fromLowRisk)
```

**What needs verification**:
- [ ] This withdrawal order (low-risk first) is a policy choice, not regulatory — should be user-configurable
- [ ] Verify that drawing from low-risk first matches the spreadsheet's assumed strategy

#### Step 6: Growth
```
highRiskTrad *= (1 + highRiskROI)
highRiskRoth *= (1 + highRiskROI)
lowRiskTrad  *= (1 + lowRiskROI)
lowRiskRoth  *= (1 + lowRiskROI)
```

**What needs verification**:
- [ ] Growth applied AFTER withdrawals — order matters (withdraw → grow vs grow → withdraw). Current full simulation: withdraw then grow. Simple path: grow then withdraw. These will give different results.
- [ ] Verify which order the spreadsheet uses

#### Step 7: Rebalancing (High → Low)
```
targetLowRisk = nextYearWithdrawal × timeStepYears
deficit = min(targetLowRisk - currentLowRisk, currentHighRisk)
transfer proportionally Trad/Roth from high to low
```

**What needs verification**:
- [ ] Rebalancing transfers maintain the Trad/Roth ratio correctly
- [ ] Time-step buffer (1, 2, or 3 years) is a user choice — verify it's properly configurable
- [ ] Verify this matches the spreadsheet's assumed rebalancing strategy

#### Step 8: Record Results
- Floors all balances at 0 (prevents floating-point negatives)
- Tracks depletion age (first year total TSP ≤ 0)
- Records balance at age 85

---

## Part 4: What's Missing — Gaps That Need Work

### 4.1 Critical Calculation Gaps

| # | Gap | Impact | Priority |
|---|---|---|---|
| 1 | **Simple vs Full path disconnected**: `useSimulation` calls `projectRetirementIncome()` (simple) but never calls `projectRetirementSimulation()` (full). Dashboard charts use the simple path. | Charts don't show dual-pot TSP, RMD, SS, or GoGo/GoSlow/NoGo | HIGH |
| 2 | **User-defined Roth/Traditional withdrawal proportions**: Users can't specify "draw X% from Roth, Y% from Traditional". Current logic: proportional to balance ratio. | Limits tax planning capability | HIGH |
| 3 | **Grow-then-withdraw vs withdraw-then-grow inconsistency**: Simple path grows first, full path withdraws first. | FPV results differ between paths | MEDIUM |
| 4 | **Social Security claiming age**: Hardcoded at 62. No adjustment for delayed claiming (67 or 70). | Underestimates SS income for most users | MEDIUM |
| 5 | **RMD age transition**: Hardcoded 73. SECURE 2.0 moves to 75 for those born 1960+. | Regulatory accuracy risk for younger users | MEDIUM |
| 6 | **Spreadsheet parity**: `baseline.json` is entirely empty. Zero cell-level verification exists. | Can't prove any calculation matches the spreadsheet | HIGH |
| 7 | **Smile curve model mismatch**: Full simulation uses step-function (GoGo/GoSlow/NoGo multipliers), expenses module uses linear interpolation (Blanchett). Different models give different results. | Inconsistency in expense projections | MEDIUM |
| 8 | **Tax modeling absent**: Traditional withdrawals are taxable income; Roth withdrawals are not. No tax bracket estimation. | Can't compare Roth-first vs Traditional-first strategies meaningfully | LOW (Phase 9+) |
| 9 | **TSP FPV doesn't account for salary growth**: Pre-retirement FV uses a flat monthly contribution, but contributions are a % of salary which grows with promotions/WGIs/pay raises | Underestimates TSP at retirement for long careers | MEDIUM |
| 10 | **Survivor annuity reduction not modeled** | Overstates annuity for married retirees choosing survivor benefit | LOW |

### 4.2 Test & Verification Gaps

| # | Gap | Action Needed |
|---|---|---|
| T1 | `baseline.json` empty — no spreadsheet values extracted | Extract canonical values from `Retire-original.xlsx` for all 4 scenarios |
| T2 | Scenario tests use formula-derived expected values, not spreadsheet cells | Pin expected values to spreadsheet cells after T1 |
| T3 | Full simulation engine (`projectRetirementSimulation`) has no integration test that runs through `useSimulation` | Add end-to-end test: form data → assembly → full simulation → chart data |
| T4 | `useAssembleInput` has no unit tests | Add tests for assembly logic, especially career synthesis fallback |
| T5 | Dual inflation (general vs healthcare) not tested at scenario level | Add scenario with healthcare inflation diverging from general |
| T6 | RMD forcing larger Traditional withdrawals — edge case untested | Add test where RMD exceeds proportional share |

---

## Part 5: Implementation Roadmap

### Phase A: Verify & Fix Existing Calculations (Foundation)

1. **Extract spreadsheet baseline values** into `baseline.json` for the GS straight-through scenario
2. **Pin unit test expected values** to spreadsheet cells (with tolerance from `spreadsheet-parity.md`)
3. **Fix grow-then-withdraw order** to match spreadsheet convention (standardize across both paths)
4. **Unify smile curve model** — decide whether step-function or linear interpolation is authoritative, make both paths use it

### Phase B: Wire Full Simulation into Dashboard

5. **Connect `projectRetirementSimulation()` to `useSimulation`** — replace the simple `projectRetirementIncome()` call for Dashboard charts when `SimulationConfig` is available
6. **Add `SimulationConfig` assembly** to `useAssembleInput` — transform FERS Estimate + Simulation Form + Expenses into `SimulationConfig`
7. **Update chart components** to consume `SimulationYearResult[]` (they currently expect `AnnualProjection[]`)
8. **Keep simple path as fallback** — use it when the user hasn't filled out the Simulation tab

### Phase C: User-Defined Withdrawal Strategy ✅ COMPLETE

9. **Add withdrawal strategy to `SimulationConfig`** ✅
   - Added `withdrawalStrategy?: 'proportional' | 'traditional-first' | 'roth-first' | 'custom'`
   - Added `customWithdrawalSplit?: { traditionalPct: Rate; rothPct: Rate }`
   - Updated Zod schema with `WithdrawalStrategySchema` and `CustomWithdrawalSplitSchema`

10. **Updated `projectRetirementSimulation()`** ✅ (retirement-simulation.ts lines 117–154)
    - Step 3–4 now supports four withdrawal strategies:
      - **`'proportional'`** (default): Split withdrawals by balance ratio (tax-agnostic)
      - **`'traditional-first'`**: Exhaust Traditional first, then Roth
      - **`'roth-first'`**: Exhaust Roth first, then Traditional
      - **`'custom'`**: Use user-specified percentages
    - RMD enforcement: Traditional withdrawal respects RMD minimum requirement
    - RMD override: When RMD > planned withdrawal, adjust Roth downward to maintain RMD

11. **Added UI controls** ✅ (SimulationForm.tsx lines 580–618)
    - New `Select` control for strategy choice in TSP section
    - Conditional rendering of custom % inputs when strategy='custom'
    - Form state updated with `withdrawalStrategy`, `customTradPct`, `customRothPct` fields
    - `toConfig()` and `configToFormState()` handle conversion

12. **RMD override logic** ✅ (retirement-simulation.ts lines 151–154)
    - When RMD forces larger Traditional withdrawal than planned, `rothWithdrawalNeeded` is set to 0
    - Excess Traditional withdrawal above planned is tracked implicitly in `actualTSPWithdrawal`
    - RMD enforcement validated in tests at age 73+

### Phase D: Enhance FPV Accuracy ✅ COMPLETE

13. **Year-by-year pre-retirement TSP projection** ✅ (future-value.ts lines 165–309)
    - New function: `projectPreRetirementTSP()`
    - Accounts for annual salary growth (configurable rate)
    - Employee contributions as % of salary (capped by inputs)
    - Agency automatic contribution (1% of salary, always Traditional)
    - Agency match (100% of first 3%, 50% of next 2%, always Traditional)
    - Tracks Traditional and Roth balances separately
    - Employee contributions split by Trad/Roth preference; match always goes to Traditional
    - Monthly compounding within each year
    - Returns detailed year-by-year breakdown with growth amounts
    - Tested with 9 new test cases

14. **Social Security claiming age** ✅ (SimulationConfig, SimulationForm, retirement-simulation.ts)
    - Added `ssClaimingAge?: 62 | 67 | 70` to SimulationConfig (defaults to 62)
    - Updated retirement simulation income calculation to use configurable SS claiming age
    - SS COLA starts from claiming year (not fixed at year 0)
    - UI control added to SimulationForm for SS claiming age selection
    - Note: Actuarial adjustment factors (increased benefit for delayed claim) currently use base amount; future enhancement can add age-specific multipliers

15. **RMD age transition** ✅ (rmd.ts, retirement-simulation.ts)
    - New function: `getRMDStartAge(birthYear)` — returns 73 for born before 1960, 75 for born 1960+
    - Updated `isRMDRequired(age, birthYear?)` — accepts optional birth year parameter
    - Updated `computeRMD(balance, age, birthYear?)` — passes birth year to RMD check
    - Implements SECURE 2.0 Act § 107 phase-in correctly
    - Backward compatible: defaults to 73 when birthYear not provided
    - Added `birthYear?: number` to SimulationConfig
    - UI control added to SimulationForm for birth year entry
    - Tested with 6 new test cases (includes birth year boundary tests)

### Phase E: Scenario Comparison & Verification ✅ COMPLETE

16. **Completed all 4 scenario baseline extractions** ✅ (fixtures/baseline.json)
    - **gs-straight-through**: GS career, MRA+30 retirement at 57.5, 31 years service, $27.9k annuity, $400k TSP
    - **leo-early-retirement**: LEO with 20-year career, MRA+10-reduced retirement, lower annuity but earlier exit
    - **military-buyback**: FERS + 4-year military buyback, adds ~$2k/yr to annuity and creditable service
    - **tsp-roth-vs-traditional**: Strategy comparison showing tax-efficient allocation (70% Traditional vs 70% Roth)
    - All scenarios include comparison metrics and present-value adjustments
    - Status: "complete" (no longer "pending")

17. **Added scenario comparison metrics** ✅ (scenario-comparison.ts + test)
    - New function: `extractScenarioMetrics()` — extracts key decision metrics from year-by-year projection
    - Metrics extracted:
      - `depletionAge`: Age when TSP runs out (or null if "NEVER")
      - `balanceAt85`: TSP balance at age 85
      - `surplusYear10`: Cumulative surplus across years 0-9
      - `surplusYear20`: Cumulative surplus across years 0-19
      - `surplusYear30`: Cumulative surplus across years 0-29
      - `totalLifetimeIncome`: Sum of all years' income
      - `totalLifetimeExpenses`: Sum of all years' expenses
    - Handles edge cases: projections shorter than 30 years, depletion before 85, etc.
    - Tested with 4 unit tests

18. **Added present-value comparison** ✅ (scenario-comparison.ts + test)
    - New function: `computePresentValue()` — standard NPV formula: PV = FV / (1 + r)^n
    - New function: `computePresentValueMetrics()` — adds PV-adjusted variants to base metrics
    - Enables apples-to-apples scenario comparison by discounting future values to today's dollars
    - Default discount rate: 2% (configurable for sensitivity analysis)
    - All key metrics have PV variants:
      - balanceAt85PV, surplusYear10PV, surplusYear20PV, surplusYear30PV
      - totalLifetimeIncomePV, totalLifetimeExpensesPV
    - Tested with 7 unit tests (PV computation, discounting validation, baseline metrics)

---

## Part 6: Key Files to Modify

| File | Changes |
|---|---|
| `app/src/modules/simulation/retirement-simulation.ts` | Add withdrawal strategy, fix RMD age, fix SS claiming age |
| `app/src/modules/simulation/income-projection.ts` | Align grow/withdraw order with full simulation |
| `app/src/modules/tsp/future-value.ts` | Add salary-aware FPV variant |
| `app/src/modules/tsp/rmd.ts` | Birth-year-aware RMD age (73 vs 75) |
| `app/src/models/simulation.ts` | Add `withdrawalStrategy` to `SimulationConfig` |
| `app/src/hooks/useSimulation.ts` | Wire full simulation engine, update chart data shapes |
| `app/src/components/forms/useAssembleInput.ts` | Build `SimulationConfig` from stored form data |
| `app/src/components/forms/SimulationForm.tsx` | Add withdrawal strategy UI controls |
| `app/tests/scenarios/fixtures/baseline.json` | Populate with spreadsheet-extracted values |
| `app/tests/unit/simulation/retirement-simulation.test.ts` | Add withdrawal strategy tests, RMD edge cases |
| `docs/formula-registry.md` | Register new/modified formulas |
