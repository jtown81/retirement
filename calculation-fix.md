# TSP Allocation & Contribution Calculation Engine — Technical Implementation Plan

**Document ID:** `calculation-fix.md`
**Project:** `app-dev/retire` — Federal Retirement Planning Simulation
**Scope:** TSP contribution engine — matching rules, tax treatment, fund allocation, balance projection
**Regulatory Basis:** OPM FERS Handbook; 5 U.S.C. § 8432; 5 CFR Part 1600; IRC §§ 402(g), 414(v), 401(a)(9); FRTIB TSP Bulletins
**Date:** 2026-02-18

---

## Table of Contents

1. [Regulatory Reference Mapping](#1-regulatory-reference-mapping)
2. [Matching Formula Specification](#2-matching-formula-specification)
3. [Contribution Flow](#3-contribution-flow)
4. [Data Model Definition](#4-data-model-definition)
5. [System Calculated Fields](#5-system-calculated-fields)
6. [Edge Case Handling](#6-edge-case-handling)
7. [Validation & Testing Plan](#7-validation--testing-plan)
8. [Future Extension Hooks](#8-future-extension-hooks)
9. [Current Implementation Audit](#9-current-implementation-audit)

---

## 1. Regulatory Reference Mapping

### 1.1 Authoritative Sources

| Rule | Regulatory Citation | Summary |
|------|---------------------|---------|
| Agency Automatic Contribution (1%) | 5 U.S.C. § 8432(c)(1); 5 CFR § 1600.23 | FERS employees receive 1% of basic pay each pay period regardless of employee contribution |
| Agency Matching Contribution | 5 U.S.C. § 8432(c)(2); 5 CFR § 1600.23(b) | 100% match on first 3%, 50% match on next 2% of basic pay contributed |
| Agency Contributions → Traditional Only | 5 U.S.C. § 8432(b)(1)(B); TSP Bulletin 2012-2 | All agency contributions (auto + match) are deposited to Traditional TSP regardless of employee election |
| Employee Roth Election | 5 U.S.C. § 8432d; 5 CFR § 1600.34 | Employees may designate contributions as Roth after-tax; election applies to employee contributions only |
| Elective Deferral Cap | IRC § 402(g)(1) | Annual limit on combined Traditional + Roth employee elective deferrals (2025: $23,500) |
| Catch-Up Contribution | IRC § 414(v); SECURE 2.0 Act § 109 | Age 50+ employees may contribute additional catch-up amount (2025: $7,500) |
| RMD — Age 73 | IRC § 401(a)(9); SECURE 2.0 Act § 107 | RMD begins at age 73 for those born before 1960 |
| RMD — Age 75 | SECURE 2.0 Act § 107 | RMD begins at age 75 for those born 1960 or later |
| Fund Allocation Applies to All Contributions | TSP.gov Contribution Allocation rules | A single allocation election applies to all incoming contributions (employee + agency); separate interfund transfers govern existing balances |
| Combined Annual Addition Limit | IRC § 415(c) | Total additions (employee + employer) may not exceed lesser of 100% of compensation or $70,000 (2025); rarely reached in federal pay context |

### 1.2 Matching Formula Validation

The matching structure defined in 5 CFR § 1600.23(b) yields:

| Employee Contribution % | Agency Auto % | Agency Match % | Total Agency % | Total % of Salary |
|------------------------|---------------|----------------|----------------|-------------------|
| 0% | 1% | 0% | 1% | 1% |
| 1% | 1% | 1% | 2% | 3% |
| 2% | 1% | 2% | 3% | 5% |
| 3% | 1% | 3% | 4% | 7% |
| 4% | 1% | 3.5% | 4.5% | 8.5% |
| 5% | 1% | 4% | 5% | 10% |
| >5% | 1% | 4% | 5% | 5% + employee% |

**Maximum agency contribution:** 5% of basic pay (1% auto + 4% match).

### 1.3 Tax Classification Validation

| Contribution Source | Tax Treatment | Regulatory Basis |
|--------------------|---------------|------------------|
| Agency Automatic (1%) | Traditional (pre-tax) | Always, no exception — 5 U.S.C. § 8432(b)(1)(B) |
| Agency Match (up to 4%) | Traditional (pre-tax) | Always, no exception — same citation |
| Employee Elective (Trad %) | Traditional (pre-tax) | Employee election — 5 CFR § 1600.12 |
| Employee Elective (Roth %) | Roth (after-tax) | Employee election — 5 CFR § 1600.34 |

---

## 2. Matching Formula Specification

### 2.1 Formal Notation

Let:
- `S` = gross basic pay per pay period
- `e` = employee contribution rate (decimal, e.g., 0.05 for 5%)
- `E_pp` = employee contribution per pay period
- `A_auto` = agency automatic contribution per pay period
- `A_match` = agency matching contribution per pay period
- `A_total` = total agency contribution per pay period

```
E_pp    = S × e

A_auto  = S × 0.01

A_match = S × min(e, 0.03) × 1.00
        + S × max(min(e, 0.05) - 0.03, 0) × 0.50

        = S × [min(e, 0.03) + 0.5 × max(min(e, 0.05) - 0.03, 0)]

A_total = A_auto + A_match
```

**Maximum values (employee ≥ 5%):**

```
A_match_max = S × 0.03 + S × 0.02 × 0.5
            = S × 0.03 + S × 0.01
            = S × 0.04

A_total_max = S × 0.01 + S × 0.04
            = S × 0.05
```

### 2.2 Pseudocode

```
function computeAgencyContributions(salary, employeeRate):
    // salary: gross basic pay for pay period
    // employeeRate: employee contribution as decimal [0.0, 1.0]

    agencyAuto = salary * 0.01

    tier1Rate = min(employeeRate, 0.03)
    tier2Rate = max(min(employeeRate, 0.05) - 0.03, 0.0)

    agencyMatch = salary * (tier1Rate * 1.00 + tier2Rate * 0.50)

    agencyTotal = agencyAuto + agencyMatch

    return {
        agencyAuto,    // always Traditional
        agencyMatch,   // always Traditional
        agencyTotal
    }
```

### 2.3 Employee Roth / Traditional Split

```
function splitEmployeeContribution(employeeAmount, rothPct):
    // rothPct: user-defined Roth election [0, 100]
    // NOTE: agency contributions are NEVER affected by this split

    rothFraction   = rothPct / 100.0
    tradFraction   = 1.0 - rothFraction

    employeeRoth   = employeeAmount * rothFraction
    employeeTrad   = employeeAmount * tradFraction

    return { employeeRoth, employeeTrad }
```

### 2.4 IRS Elective Deferral Cap Enforcement

```
function enforceElectiveDeferralCap(intendedEmployee, ytdEmployee, calendarYear, age):
    annualCap    = getElectiveDeferralLimit(calendarYear)
    catchUpAdder = (age >= 50) ? getCatchUpLimit(calendarYear) : 0
    effectiveCap = annualCap + catchUpAdder

    remaining    = max(effectiveCap - ytdEmployee, 0)
    allowed      = min(intendedEmployee, remaining)

    // IMPORTANT: cap applies to combined Trad + Roth employee contributions
    // Agency contributions do NOT count against this cap (they are employer contributions)
    return allowed
```

---

## 3. Contribution Flow

### 3.1 Step-by-Step Per-Pay-Period Flow

```
STEP 1 — SALARY CALCULATION
───────────────────────────
IF mode == GS_DERIVED:
    salary = lookupGSSalary(grade, step, locality, effectiveDate)
    salary = applyAnnualRaise(salary, raiseRate, yearsElapsed)
ELSE:
    salary = userSuppliedSalary

basicPayPerPP = salary / payPeriodsPerYear   // 26 for biweekly


STEP 2 — EMPLOYEE CONTRIBUTION CALCULATION
────────────────────────────────────────────
intendedEmpContrib = basicPayPerPP * employeeRate

ytdEmployeeContrib += (running YTD from prior pay periods this year)

allowedEmpContrib  = enforceElectiveDeferralCap(
                         intendedEmpContrib,
                         ytdEmployeeContrib,
                         calendarYear,
                         employeeAge
                     )


STEP 3 — AGENCY AUTOMATIC CONTRIBUTION
────────────────────────────────────────
agencyAuto = basicPayPerPP * 0.01
// Always paid; not subject to IRS § 402(g) elective deferral cap
// Subject to IRC § 415(c) annual additions limit (rarely binding)


STEP 4 — AGENCY MATCH CALCULATION
───────────────────────────────────
// NOTE: match is based on intended employee rate, NOT capped rate
// If employee hits 402(g) cap mid-year, match stops when contributions stop
actualEmployeeRate = allowedEmpContrib / basicPayPerPP

tier1 = min(actualEmployeeRate, 0.03)
tier2 = max(min(actualEmployeeRate, 0.05) - 0.03, 0.0)
agencyMatch = basicPayPerPP * (tier1 + tier2 * 0.50)


STEP 5 — TAX CLASSIFICATION
─────────────────────────────
{ employeeRoth, employeeTrad } = splitEmployeeContribution(
                                     allowedEmpContrib,
                                     userRothPct
                                 )

agencyAutoTrad  = agencyAuto    // always Traditional
agencyMatchTrad = agencyMatch   // always Traditional

totalTraditional = employeeTrad + agencyAutoTrad + agencyMatchTrad
totalRoth        = employeeRoth
totalContrib     = totalTraditional + totalRoth


STEP 6 — FUND ALLOCATION
──────────────────────────
// Allocation percentages apply to totalContrib as a lump sum
// Tax classification is tracked internally, not per-fund

FOR EACH fund IN allocation:
    fundContrib[fund] = totalContrib * (fund.pct / 100.0)
    fundContribTrad[fund] = totalTraditional * (fund.pct / 100.0)
    fundContribRoth[fund] = totalRoth        * (fund.pct / 100.0)

ASSERT sum(allocation.pct) == 100


STEP 7 — BALANCE UPDATE
─────────────────────────
// Apply growth (daily or period) then add contributions
// Monthly approximation for annual models:

FOR EACH fund IN allocation:
    tradBalance[fund] = tradBalance[fund] * (1 + monthlyRate) + fundContribTrad[fund]
    rothBalance[fund] = rothBalance[fund] * (1 + monthlyRate) + fundContribRoth[fund]

totalTradBalance = sum(tradBalance)
totalRothBalance = sum(rothBalance)
totalBalance     = totalTradBalance + totalRothBalance
```

### 3.2 Annual Projection Wrapper (Mid-Year Approximation)

For annual models where pay-period granularity is unnecessary:

```
annualEmployeeContrib = min(salary * employeeRate, electiveDeferralCap)
annualAgencyAuto      = salary * 0.01
annualAgencyMatch     = computeAgencyContributions(salary, effectiveRate).agencyMatch

annualTotalContrib    = annualEmployeeContrib + annualAgencyAuto + annualAgencyMatch

closingBalance = (openingBalance * (1 + r)) + annualTotalContrib * (1 + r / 2)
```

The `× (1 + r/2)` factor is the standard mid-year approximation (contributions earn half of the annual return).

---

## 4. Data Model Definition

### 4.1 User Inputs

```typescript
interface TSPUserInputs {
  // Mode selection
  inputMode: 'direct' | 'gs-derived';

  // MODE A — Direct Input
  annualSalary?: number;                // gross basic pay (used if mode=direct)

  // MODE B — GS Salary Derived
  gsGrade?: number;                     // 1–15
  gsStep?: number;                      // 1–10
  localityCode?: string;                // OPM locality pay area code
  annualRaisePct?: number;              // assumed annual pay increase (decimal, e.g. 0.02)

  // Contribution configuration
  employeeContribPct: number;           // employee contribution rate [0, 1]
  employeeRothPct: number;              // % of employee contribution that is Roth [0, 100]

  // Current balances
  currentTraditionalBalance: number;    // opening Traditional TSP balance
  currentRothBalance: number;           // opening Roth TSP balance

  // Fund allocation (must sum to 100)
  fundAllocation: FundAllocationEntry[];

  // Overrides (Mode A testing / override only)
  agencyMatchOverridePct?: number;      // OPTIONAL: override for testing; normally calculated
}

interface FundAllocationEntry {
  fund: TSPFundCode;                    // G | F | C | S | I | L-series
  allocationPct: number;                // share of total contribution [0, 100]
}

type TSPFundCode =
  | 'G' | 'F' | 'C' | 'S' | 'I'
  | 'L-Income' | 'L2025' | 'L2030' | 'L2035' | 'L2040'
  | 'L2045' | 'L2050' | 'L2055' | 'L2060' | 'L2065';
```

### 4.2 Projection Configuration

```typescript
interface TSPProjectionConfig {
  // Timing
  projectionStartDate: string;          // ISO date (YYYY-MM-DD)
  yearsToRetirement: number;
  employeeAge: number;                  // age at projection start (drives catch-up)
  birthYear: number;                    // for RMD age determination

  // Growth assumption
  annualGrowthRate: number;             // decimal, e.g. 0.07

  // Pay period structure
  payPeriodsPerYear: 26 | 24 | 12;     // 26 (biweekly) is standard federal

  // Post-retirement
  annualWithdrawal?: number;            // post-retirement withdrawal amount
  oneTimeWithdrawalAge?: number;        // age for lump-sum withdrawal
  oneTimeWithdrawalAmount?: number;
}
```

---

## 5. System Calculated Fields

### 5.1 Per-Pay-Period Outputs

```typescript
interface TSPPayPeriodResult {
  payPeriodNumber: number;
  calendarYear: number;
  employeeAge: number;

  // Salary
  basicPayPerPP: number;

  // Employee contributions (after cap enforcement)
  employeeContribAllowed: number;
  employeeContribRoth: number;
  employeeContribTrad: number;

  // Agency contributions
  agencyAutoContrib: number;            // always Traditional
  agencyMatchContrib: number;           // always Traditional
  agencyTotalContrib: number;

  // Combined totals
  totalContrib: number;
  totalTradContrib: number;
  totalRothContrib: number;

  // Fund allocations
  fundAllocations: {
    fund: TSPFundCode;
    totalContrib: number;
    tradContrib: number;
    rothContrib: number;
  }[];

  // YTD tracking
  ytdEmployeeContrib: number;
  ytdAgencyContrib: number;
  ytdTotalContrib: number;

  // Balance after contributions and growth
  closingTradBalance: number;
  closingRothBalance: number;
  closingTotalBalance: number;

  // Cap status
  electiveDeferralCapReached: boolean;
  catchUpEligible: boolean;
}
```

### 5.2 Annual Summary

```typescript
interface TSPAnnualYear {
  year: number;
  age: number;
  salary: number;

  // Contributions
  employeeContrib: number;
  employeeContribRoth: number;
  employeeContribTrad: number;
  agencyAutoContrib: number;
  agencyMatchContrib: number;
  agencyTotalContrib: number;
  totalContrib: number;

  // Growth
  growthAmount: number;

  // Balances
  openingTradBalance: number;
  openingRothBalance: number;
  openingTotalBalance: number;
  closingTradBalance: number;
  closingRothBalance: number;
  closingTotalBalance: number;

  // Ratios (for modeling use)
  tradRatio: number;                    // closingTrad / closingTotal
  rothRatio: number;                    // closingRoth / closingTotal
}
```

### 5.3 Initial Traditional / Roth Ratio

```typescript
function computeInitialRatios(
  currentTrad: number,
  currentRoth: number
): { tradRatio: number; rothRatio: number } {
  const total = currentTrad + currentRoth;

  if (total <= 0) {
    // Edge case: no existing balance — ratio is undefined
    // Default to 100% Traditional for projection seeding
    return { tradRatio: 1.0, rothRatio: 0.0 };
  }

  return {
    tradRatio: currentTrad / total,
    rothRatio: currentRoth / total,
  };
}
```

**Usage note:** The initial ratio is used **only** for projection modeling to attribute growth on existing balances proportionally between Traditional and Roth accounts. It is **not** used as a validation constraint on future contributions. Future contributions follow the user's active Roth election, not the historical ratio.

---

## 6. Edge Case Handling

### 6.1 Employee Contribution < 5%

```
employeeRate = 0.02  (example: 2%)

agencyAuto  = salary * 0.01
tier1       = min(0.02, 0.03) = 0.02
tier2       = max(min(0.02, 0.05) - 0.03, 0) = max(-0.01, 0) = 0.0
agencyMatch = salary * (0.02 + 0.0) = salary * 0.02

// Employee leaves 2% match on the table (vs maximum 4% match at 5% contribution)
```

No error condition. Calculate normally.

### 6.2 Employee Contribution = 0%

```
employeeRate = 0.0

agencyAuto  = salary * 0.01    // STILL PAID — automatic, unconditional
agencyMatch = 0.0               // no match without employee contribution

// Employee receives only the 1% automatic contribution
```

No error condition. Automatic contribution must be applied even at 0% employee rate.

### 6.3 Allocation Does Not Sum to 100%

```
VALIDATION (pre-calculation):
    total = sum(fundAllocation[i].pct for all i)
    IF abs(total - 100.0) > 0.01:
        THROW ValidationError("Fund allocation must total 100%. Current total: {total}%")

// Do NOT silently normalize. Require explicit correction from user.
```

### 6.4 Roth Election = 100%

```
employeeRothPct = 100

employeeRoth = allowedEmpContrib * 1.0
employeeTrad = allowedEmpContrib * 0.0  // = 0

// Agency auto and match are STILL Traditional — not affected by Roth election
totalTrad = 0 + agencyAuto + agencyMatch   // non-zero from agency contributions
totalRoth = employeeRoth
```

No error condition. Agency contributions remain Traditional regardless.

### 6.5 Traditional Election = 100%

```
employeeRothPct = 0

employeeRoth = 0
employeeTrad = allowedEmpContrib

totalTrad = employeeTrad + agencyAuto + agencyMatch
totalRoth = 0

closingRothBalance unchanged (no growth in this model — Roth starts at currentRothBalance)
```

No error condition. Track separately; existing Roth balance still grows.

### 6.6 Zero Initial Balances

```
currentTrad = 0
currentRoth = 0

tradRatio = 1.0   // default to Traditional (see §5.3)
rothRatio = 0.0

// Projection seeds from zero; contributions build the balance from first period
// No division-by-zero; guarded by total > 0 check in computeInitialRatios()
```

### 6.7 IRS Cap Reached Mid-Year

```
// Employee hits 402(g) cap at pay period 20 of 26
ytdEmployee = electiveDeferralCap at PP 20

FOR pp = 21 TO 26:
    allowedEmpContrib = 0            // no more employee deferrals
    agencyAuto  = salary * 0.01      // STILL PAID — not affected by cap
    agencyMatch = 0                   // match stops because employee stopped contributing
    // This is the "true-up" problem; some agencies do annual true-up — model as config flag
```

**Assumption:** No automatic annual true-up is modeled unless `annualTrueUp: true` is set. Label this assumption explicitly. Some payroll providers (e.g., NFC) do not true-up; this affects employees who front-load contributions.

---

## 7. Validation & Testing Plan

### 7.1 Unit Test Scenarios — Agency Match

| Scenario | Input (employee %) | Expected Agency Auto | Expected Agency Match | Expected Total Agency |
|----------|-------------------|---------------------|----------------------|----------------------|
| No contribution | 0% | 1% | 0% | 1% |
| Partial tier 1 | 1% | 1% | 1% | 2% |
| Partial tier 1 | 2% | 1% | 2% | 3% |
| Full tier 1 | 3% | 1% | 3% | 4% |
| Into tier 2 | 4% | 1% | 3.5% | 4.5% |
| Max match | 5% | 1% | 4% | 5% |
| Above max | 8% | 1% | 4% | 5% |
| Above max | 100% | 1% | 4% | 5% |

All percentages expressed as % of basic pay per pay period. Test with `salary = $3,000` for concrete dollar values.

### 7.2 Unit Test Scenarios — Roth / Traditional Split

| Scenario | Emp % | Roth % | Expected Emp Roth | Expected Emp Trad | Agency Trad |
|----------|-------|--------|-------------------|-------------------|-------------|
| All Traditional | 5% | 0% | $0 | $150 | $150 |
| All Roth | 5% | 100% | $150 | $0 | $150 |
| 50/50 split | 5% | 50% | $75 | $75 | $150 |
| 80/20 split | 5% | 80% | $120 | $30 | $150 |

Salary = $60,000/year → $2,307.69/pp (26 pp). 5% = $115.38/pp. Agency auto + match at 5% = $230.77/pp. Rounded values used for test assertions.

### 7.3 Boundary Tests

```typescript
// Boundary: elective deferral cap (2025: $23,500)
test('employee cannot exceed §402(g) cap', () => {
  // 26 pp × $1,000/pp = $26,000 intended → capped to $23,500
  // pp 1-23: contribute normally; pp 24: partial; pp 25-26: $0
});

// Boundary: catch-up eligibility threshold
test('catch-up enabled at exactly age 50', () => {
  // age 49: no catch-up; age 50: catch-up available
  // 2025: $23,500 + $7,500 = $31,000 effective cap
});

// Boundary: fund allocation sums to exactly 100 (floating point)
test('allocation validation accepts 99.999 to 100.001 range', () => {
  // Allow ±0.01% tolerance for floating-point rounding
});
```

### 7.4 Example Pay Period Calculation

**Inputs:**
- Salary: $75,000/year (GS-12 Step 5 approximation)
- Pay periods: 26 biweekly
- Basic pay per PP: $75,000 / 26 = $2,884.62
- Employee rate: 5%
- Roth election: 50%
- Fund allocation: 80% C, 10% S, 10% I

**Calculation:**

```
Basic pay PP          = $2,884.62

Employee contrib      = $2,884.62 × 0.05     = $144.23
  Employee Roth       = $144.23 × 0.50       = $72.12
  Employee Trad       = $144.23 × 0.50       = $72.12

Agency auto           = $2,884.62 × 0.01     = $28.85  (Traditional)
Agency match
  Tier 1              = $2,884.62 × 0.03     = $86.54
  Tier 2              = $2,884.62 × 0.02×0.5 = $28.85
  Total match         = $86.54 + $28.85      = $115.38 (Traditional)

Agency total          = $28.85 + $115.38     = $144.23

Total contribution    = $144.23 + $144.23    = $288.46
  Total Traditional   = $72.12 + $144.23     = $216.35
  Total Roth          = $72.12

Fund allocation:
  C Fund total        = $288.46 × 0.80       = $230.77
    C Fund Trad       = $216.35 × 0.80       = $173.08
    C Fund Roth       = $72.12 × 0.80        = $57.69
  S Fund total        = $288.46 × 0.10       = $28.85
    S Fund Trad       = $216.35 × 0.10       = $21.64
    S Fund Roth       = $72.12 × 0.10        = $7.21
  I Fund total        = $288.46 × 0.10       = $28.85
    I Fund Trad       = $216.35 × 0.10       = $21.64
    I Fund Roth       = $72.12 × 0.10        = $7.21

Check: $230.77 + $28.85 + $28.85 = $288.46 ✓
```

### 7.5 Multi-Year Simulation Test

**Scenario:** 30-year pre-retirement projection

- Starting salary: $75,000
- Annual raise: 2%
- Employee contribution: 5%
- Roth election: 50%
- Growth rate: 7%
- Starting Traditional balance: $100,000
- Starting Roth balance: $25,000
- Age at start: 35

**Expected behavior assertions:**

1. Agency contributions are always Traditional in every year
2. Traditional balance grows faster than Roth (agency contributions add to Traditional only)
3. At year 15 (age 50), catch-up contributions activate — annual cap increases by $7,500
4. IRS limit cap is reached in later years as salary grows (salary × 5% eventually exceeds the elective deferral cap); match stops when employee hits cap mid-year
5. Final balances at year 30 are deterministic given fixed inputs
6. `tradRatio + rothRatio == 1.0` in every year

### 7.6 Regression: Agency Contributions Never Roth

```typescript
test('agency contributions never allocated to Roth', () => {
  for (const year of projection) {
    expect(year.agencyAutoContrib).toBeGreaterThanOrEqual(0);
    // All agency goes to Traditional — no Roth agency path exists
    expect(year.employeeContribTrad + year.agencyAutoContrib + year.agencyMatchContrib)
      .toBeCloseTo(year.totalTradContrib);
  }
});
```

---

## 8. Future Extension Hooks

The following hooks are placeholders for future implementation. Each is marked **[NOT IMPLEMENTED]** and must not be silently assumed.

### 8.1 IRS Annual Contribution Cap Updates

```typescript
// HOOK: tsp/contribution-limits
// Extend tsp-limits.ts with official IRS COLA table updates each year
// Current stub: projects $500/year increase from 2025 baseline
// FUTURE: replace stub with OPM-sourced table or COLA formula tied to CPI-W
interface AnnualContributionLimits {
  year: number;
  electiveDeferralLimit: number;   // IRC § 402(g)
  catchUpLimit: number;            // IRC § 414(v)
  annualAdditionsLimit: number;    // IRC § 415(c) — currently unused
}
```

### 8.2 Catch-Up Contribution Enhancement (SECURE 2.0 § 109)

```typescript
// HOOK: tsp/catch-up-enhanced
// SECURE 2.0 Act § 109: Ages 60–63 receive higher catch-up limit starting 2025
// 2025 enhanced catch-up for ages 60–63: $11,250 (vs standard $7,500)
// [NOT FULLY IMPLEMENTED — current code uses flat catch-up for age 50+]
function getEnhancedCatchUpLimit(age: number, calendarYear: number): number {
  if (calendarYear < 2025) return 0;
  if (age >= 60 && age <= 63) return 11250;  // SECURE 2.0 § 109 enhanced
  if (age >= 50) return 7500;
  return 0;
}
```

### 8.3 Required Minimum Distribution (RMD) Modeling

```typescript
// HOOK: tsp/rmd-projection
// RMD forces withdrawals from Traditional balance starting at age 73 (or 75)
// RMD = prior year-end Traditional balance / IRS Uniform Lifetime Table factor
// [PARTIALLY IMPLEMENTED in rmd.ts — not yet integrated into depletion projection]
interface RMDProjectionYear {
  age: number;
  year: number;
  priorYearEndTradBalance: number;
  distributionPeriod: number;        // from IRS Table III
  rmdAmount: number;
  rmdRequired: boolean;
  actualWithdrawal: number;          // max(rmdAmount, plannedWithdrawal)
  penaltyAmount: number;             // 25% excise tax if actual < rmd (SECURE 2.0 reduced from 50%)
}
```

### 8.4 Tax Bracket Modeling

```typescript
// HOOK: tax/bracket-modeling
// Traditional withdrawals are taxable ordinary income
// Roth qualified withdrawals are tax-free (account 5+ years old, age 59½+)
// [NOT IMPLEMENTED — add as separate tax module]
interface TaxProjectionYear {
  ordinaryIncome: number;            // annuity + supplement + Traditional TSP withdrawal
  taxableSSBenefit: number;          // 0–85% of SS benefit depending on combined income
  rothWithdrawal: number;            // excluded from taxable income if qualified
  estimatedTax: number;              // using IRS tax brackets for year
  effectiveTaxRate: number;
}
```

### 8.5 Lifecycle Fund Automation

```typescript
// HOOK: tsp/lifecycle-automation
// L Funds automatically rebalance to become more conservative over time
// User may elect an L Fund target date; system should resolve to equivalent C/S/I/G/F mix
// [NOT IMPLEMENTED — currently treated as single opaque fund code]
interface LFundGlidePath {
  fund: 'L2030' | 'L2035' | /* ... */;
  targetDate: number;               // year
  glidePath: {
    yearsToTarget: number;
    gAllocation: number;
    fAllocation: number;
    cAllocation: number;
    sAllocation: number;
    iAllocation: number;
  }[];
}
```

### 8.6 Annual True-Up for Mid-Year Cap Hits

```typescript
// HOOK: tsp/annual-trueup
// Some federal payroll providers perform annual agency match true-up
// If employee front-loads contributions and hits 402(g) cap before year-end,
// they may lose agency match for remaining pay periods
// True-up restores match to the annual maximum
// [NOT IMPLEMENTED — model as config flag: agencyTrueUp: boolean]
```

---

## 9. Current Implementation Audit

This section maps the design above to the existing `app/src/modules/tsp/` codebase and identifies any gaps.

### 9.1 Status Summary

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Agency automatic (1%) | `agency-match.ts` | ✅ Correct | Matches 5 U.S.C. § 8432(c) |
| Agency match (tiered) | `agency-match.ts` | ✅ Correct | Correct tier 1 + tier 2 formula |
| Agency → Traditional only | `agency-match.ts`, `future-value.ts` | ✅ Correct | Enforced at formula level |
| Employee Roth split | `future-value.ts` | ✅ Correct | `isRothContribution` flag in `projectPreRetirementTSP` |
| IRS elective deferral cap | `tsp-limits.ts`, `traditional.ts` | ✅ Correct | `clampToContributionLimit()` enforces annual cap |
| Catch-up contributions | `tsp-limits.ts` | ⚠️ Partial | Age 50+ flat $7,500; SECURE 2.0 § 109 enhanced catch-up (ages 60–63) not yet implemented |
| GS salary derived mode | `future-value.ts` | ✅ Implemented | `projectPreRetirementTSP` takes salary + growth rate |
| Fund allocation logic | `models/tsp.ts` | ⚠️ Model only | `TSPFundAllocation` model exists; per-fund balance tracking not wired into projection engine |
| Initial Trad/Roth ratio | `future-value.ts` | ✅ Correct | `tradRatio` computed from opening balances |
| RMD calculation | `rmd.ts` | ✅ Correct | IRS Uniform Lifetime Table III; SECURE 2.0 age 75 |
| RMD integration in depletion | `future-value.ts` | ⚠️ Partial | `projectTSPDepletion` uses fixed withdrawal; RMD floor not enforced |
| Annual true-up | — | ❌ Not implemented | Add config flag; see §8.6 |
| Enhanced catch-up (ages 60–63) | — | ❌ Not implemented | SECURE 2.0 § 109; see §8.2 |
| IRC § 415(c) annual additions cap | — | ❌ Not implemented | Rarely binding at GS salary levels; document as known gap |

### 9.2 Priority Fixes

1. **SECURE 2.0 § 109 Enhanced Catch-Up** — Employees aged 60–63 are entitled to $11,250 catch-up (2025) rather than $7,500. Update `tsp-limits.ts` and `clampToContributionLimit()` to accept age parameter and branch on 60–63 range.

2. **RMD Floor in Depletion Projection** — `projectTSPDepletion()` should enforce `actualWithdrawal = max(plannedWithdrawal, rmdAmount)` once RMD age is reached. Add `birthYear` parameter to depletion function.

3. **Fund Allocation Per-Balance Tracking** — `TSPFundAllocation` model captures percentage splits but the projection engine aggregates to total Traditional / total Roth. No gap in accuracy for total balance projection; fund-level tracking is a display enhancement only.

4. **True-Up Flag** — Document the absent true-up behavior as an explicit assumption in user-facing output. Default behavior (no true-up) is conservative and matches NFC payroll processing.

---

*End of document. All sections are implementation-ready. Assumptions are labeled. Regulatory citations are provided for all classification rules.*
