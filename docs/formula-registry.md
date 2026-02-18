# Formula Registry

Every formula in this application must have a complete entry here before it is used in code.

---

## Registry Entry Template

```
### FORMULA_ID: <module>/<formula-name>

| Field         | Value                                              |
|---------------|----------------------------------------------------|
| Name          | Human-readable formula name                        |
| Module        | Which module owns this formula                     |
| Purpose       | One-sentence description of what it computes       |
| Inputs        | List of typed inputs with units                    |
| Outputs       | List of typed outputs with units                   |
| Dependencies  | Other formula IDs this formula calls               |
| Source        | OPM chapter / IRC section / spreadsheet cell ref   |
| Classification| Hard regulatory / Assumption / User-configurable   |
| Version       | Semver (e.g., 1.0.0)                              |
| Changelog     | Date → Author → Description                        |
```

---

## Active Formulas

### FORMULA_ID: career/grade-step-to-salary

| Field          | Value                                                                        |
|----------------|------------------------------------------------------------------------------|
| Name           | GS Grade/Step Base Salary Lookup                                             |
| Module         | career                                                                       |
| Purpose        | Returns annual GS base pay for a given grade, step, and pay year (before locality) |
| Inputs         | `grade: 1–15`, `step: 1–10`, `payYear: number`, `assumedIncrease?: Rate`   |
| Outputs        | `baseSalary: USD`                                                            |
| Dependencies   | `src/data/gs-pay-tables.ts`                                                  |
| Source         | OPM GS Pay Schedule; 5 U.S.C. § 5332                                        |
| Classification | Hard regulatory requirement                                                  |
| Version        | 1.0.0                                                                        |
| Changelog      | 2026-02-10 — Phase 3 implementation; 2024 table embedded                    |

**Formula:**
```
baseSalary = GS_BASE_TABLE[payYear][grade][step]
// For years without a hardcoded table: baseSalary = GS_BASE_2024[grade][step] × payScaleFactor
// payScaleFactor = PAY_SCALE_FACTORS[closestPriorYear] × (1 + assumedIncrease)^yearsProjected
```

---

### FORMULA_ID: career/wgi-timing

| Field          | Value                                                                        |
|----------------|------------------------------------------------------------------------------|
| Name           | Within-Grade Increase (WGI) Timing                                           |
| Module         | career                                                                       |
| Purpose        | Returns the date on which the next WGI step increase is due                  |
| Inputs         | `currentStep: 1–10`, `stepStartDate: Date`                                  |
| Outputs        | `nextWGIDate: Date \| null` (null at step 10)                               |
| Dependencies   | none                                                                         |
| Source         | 5 CFR § 531.405(b)                                                           |
| Classification | Hard regulatory requirement                                                  |
| Version        | 1.0.0                                                                        |
| Changelog      | 2026-02-10 — Phase 3 implementation                                         |

**Formula:**
```
WGI_WEEKS = [52, 52, 52, 104, 104, 104, 156, 156, 156]  // indexed by step−1
nextWGIDate = stepStartDate + WGI_WEEKS[currentStep−1] × 7 days
// Returns null if currentStep = 10
```

---

### FORMULA_ID: career/locality-rate

| Field          | Value                                                                        |
|----------------|------------------------------------------------------------------------------|
| Name           | Locality Pay Rate Lookup                                                     |
| Module         | career                                                                       |
| Purpose        | Returns the OPM locality pay percentage for a given duty station and pay year |
| Inputs         | `localityCode: string`, `payYear: number`                                   |
| Outputs        | `localityRate: Rate` (e.g., 0.3326 = 33.26%)                               |
| Dependencies   | `src/data/locality-rates.ts`                                                 |
| Source         | OPM Locality Pay Schedule; 5 U.S.C. § 5304                                 |
| Classification | Hard regulatory requirement                                                  |
| Version        | 1.0.0                                                                        |
| Changelog      | 2026-02-10 — Phase 3 implementation; 2024 rates embedded                    |

---

### FORMULA_ID: career/pay-calculator

| Field          | Value                                                                        |
|----------------|------------------------------------------------------------------------------|
| Name           | Annual Pay Calculator (GS/LEO/Title 38)                                      |
| Module         | career                                                                       |
| Purpose        | Computes total annual compensation including base, locality, and supplements  |
| Inputs         | `grade`, `step`, `localityCode`, `payYear`, `paySystem`, `title38Salary?`  |
| Outputs        | `AnnualPayResult` (breakdown of all components + totalAnnualPay)            |
| Dependencies   | `career/grade-step-to-salary`, `career/locality-rate`, `career/leo-availability-pay` |
| Source         | 5 U.S.C. § 5332, § 5304, § 5545a; 38 U.S.C. §§ 7431–7432                  |
| Classification | Hard regulatory requirement                                                  |
| Version        | 1.0.0                                                                        |
| Changelog      | 2026-02-10 — Phase 3 implementation                                         |

**Formula:**
```
GS:      totalPay = baseSalary + round(baseSalary × localityRate)
LEO:     leapSupplement = round(baseSalary × 0.25)
         adjustedBase   = baseSalary + leapSupplement
         totalPay       = adjustedBase + round(adjustedBase × localityRate)
Title38: totalPay = round(title38Salary × (1 + localityRate))
```

---

### FORMULA_ID: career/leo-availability-pay

| Field          | Value                                                                        |
|----------------|------------------------------------------------------------------------------|
| Name           | LEO Law Enforcement Availability Pay (LEAP)                                  |
| Module         | career                                                                       |
| Purpose        | Adds 25% of basic pay as LEAP before locality is applied                     |
| Inputs         | `baseSalary: USD`                                                            |
| Outputs        | `leapSupplement: USD`                                                        |
| Dependencies   | `career/grade-step-to-salary`                                                |
| Source         | 5 U.S.C. § 5545a(b); 5 CFR § 531.603(d)                                    |
| Classification | Hard regulatory requirement                                                  |
| Version        | 1.0.0                                                                        |
| Changelog      | 2026-02-10 — Phase 3 implementation                                         |

**Formula:**
```
leapSupplement = round(baseSalary × 0.25)
```

---

### FORMULA_ID: career/creditable-service

| Field          | Value                                                                        |
|----------------|------------------------------------------------------------------------------|
| Name           | Creditable Service Duration                                                  |
| Module         | career                                                                       |
| Purpose        | Computes total years/months/days of creditable service from SCD to a date    |
| Inputs         | `scdRetirement: ISODate`, `asOfDate: ISODate`                               |
| Outputs        | `ServiceDuration` (years, months, days, fractionalYears)                    |
| Dependencies   | none                                                                         |
| Source         | OPM FERS Handbook Ch. 20; 5 U.S.C. § 8411                                   |
| Classification | Hard regulatory requirement                                                  |
| Version        | 1.0.0                                                                        |
| Changelog      | 2026-02-10 — Phase 3 implementation                                         |

**Formula:**
```
years = floor(date difference in whole calendar years)
// Annuity uses whole years only (rounded down); excess months/days excluded
fractionalYears = (end − start) / (365.25 × 24 × 3600 × 1000)
```

---

### FORMULA_ID: career/salary-history

| Field          | Value                                                                        |
|----------------|------------------------------------------------------------------------------|
| Name           | Career Salary History Builder                                                |
| Module         | career                                                                       |
| Purpose        | Generates year-by-year salary record from career events including WGI projections |
| Inputs         | `profile: CareerProfile`, `throughYear: number`, `assumedPayIncrease?: Rate` |
| Outputs        | `SalaryYear[]` (year, annualSalary, grade, step, locality, paySystem)       |
| Dependencies   | `career/pay-calculator`, `career/wgi-timing`                                |
| Source         | OPM FERS Handbook Ch. 50; 5 CFR § 531.405; 5 U.S.C. § 5332                |
| Classification | Hard regulatory requirement                                                  |
| Version        | 1.0.0                                                                        |
| Changelog      | 2026-02-10 — Phase 3 implementation                                         |

---

### FORMULA_ID: simulation/fers-basic-annuity

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | FERS Basic Annuity                                                    |
| Module        | simulation                                                            |
| Purpose       | Computes the annual FERS basic annuity before any reductions          |
| Inputs        | `high3Salary: USD`, `yearsOfService: number`, `age: number`          |
| Outputs       | `annualAnnuity: USD`                                                  |
| Dependencies  | `simulation/high-3-salary`, `career/scd`                              |
| Source        | OPM FERS Handbook, Ch. 50, § 50A1.1-1; spreadsheet cell TBD         |
| Classification| Hard regulatory requirement                                           |
| Version       | 0.1.0                                                                 |
| Changelog     | 2026-02-10 — scaffold entry                                          |

**Formula:**
```
multiplier = (age >= 62 && yearsOfService >= 20) ? 0.011 : 0.010
annualAnnuity = high3Salary × multiplier × yearsOfService
```

---

### FORMULA_ID: simulation/high-3-salary

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | High-3 Average Salary                                                 |
| Module        | simulation                                                            |
| Purpose       | Computes average salary over the 3 consecutive highest-earning years  |
| Inputs        | `salaryHistory: Array<{ year: number; annualSalary: USD }>`          |
| Outputs       | `high3Salary: USD`                                                    |
| Dependencies  | `career/pay-calculator`                                               |
| Source        | OPM FERS Handbook, Ch. 50, § 50A1.1-2                                |
| Classification| Hard regulatory requirement                                           |
| Version       | 0.1.0                                                                 |
| Changelog     | 2026-02-10 — scaffold entry                                          |

---

### FORMULA_ID: leave/annual-accrual-rate

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Annual Leave Accrual Rate                                             |
| Module        | leave                                                                 |
| Purpose       | Returns the biweekly annual leave accrual rate by years of service    |
| Inputs        | `yearsOfService: number`                                              |
| Outputs       | `hoursPerPayPeriod: 4 \| 6 \| 8`                                     |
| Dependencies  | none                                                                  |
| Source        | 5 U.S.C. § 6303; OPM Leave Administration                            |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — scaffold entry; 2026-02-10 — Phase 4 implementation    |

**Formula:**
```
yearsOfService < 3  → 4 hrs/pp  (4 × 26 = 104 hrs/year)
yearsOfService < 15 → 6 hrs/pp  (25 PP × 6 + 1 PP × 10 = 160 hrs/year)
yearsOfService >= 15 → 8 hrs/pp  (8 × 26 = 208 hrs/year)

Note: The 6 hrs/pp tier earns 160 hrs/year (not 156) per 5 U.S.C. § 6303(a).
OPM awards 10 hours in the final pay period of the leave year to reach the
statutory 20-day (160-hour) entitlement. See fullYearAnnualLeave() in annual-leave.ts.
```

---

### FORMULA_ID: leave/rollover-cap

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Annual Leave Rollover Cap                                             |
| Module        | leave                                                                 |
| Purpose       | Forfeits annual leave above carry-over cap at leave year end          |
| Inputs        | `balance: number`, `cap: number` (default 240)                       |
| Outputs       | `cappedBalance: number`                                               |
| Dependencies  | none                                                                  |
| Source        | 5 U.S.C. § 6304; OPM Leave Administration                            |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 4 implementation                                  |

**Formula:**
```
cappedBalance = min(balance, cap)
  cap = 240 (CONUS GS) | 360 (overseas)
```

---

### FORMULA_ID: leave/sick-accrual

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Sick Leave Accrual                                                    |
| Module        | leave                                                                 |
| Purpose       | Accrues sick leave at 4 hrs/biweekly pay period; no rollover cap     |
| Inputs        | `payPeriodsWorked: number`                                            |
| Outputs       | `hoursAccrued: number`                                                |
| Dependencies  | none                                                                  |
| Source        | 5 U.S.C. § 6307; OPM FERS Handbook, Ch. 50                          |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 4 implementation                                  |

**Formula:**
```
hoursAccrued = 4 × payPeriodsWorked
familyCare annual sub-limit = 104 hrs (13 days)
```

---

### FORMULA_ID: leave/sick-leave-service-credit

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Sick Leave Service Credit                                             |
| Module        | leave                                                                 |
| Purpose       | Converts unused sick leave hours to additional creditable service     |
| Inputs        | `sickLeaveHours: number`                                              |
| Outputs       | `serviceYears: number` (fractional)                                  |
| Dependencies  | none                                                                  |
| Source        | OPM FERS Handbook, Ch. 50, § 50A2.1-1; 5 U.S.C. § 8415             |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 4 implementation                                  |

**Formula:**
```
serviceYears = sickLeaveHours / 2087
  2087 = federal standard hours in one work year
  Post-2014 FERS: 100% credit (pre-2014 CSRS: 100% also, no discount)
```

---

### FORMULA_ID: leave/retirement-credit

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Leave Retirement Credit                                               |
| Module        | leave                                                                 |
| Purpose       | Adds sick leave service credit to total creditable service years      |
| Inputs        | `sickLeaveHours: number`, `currentServiceYears: number`              |
| Outputs       | `totalServiceYears: number` (fractional)                             |
| Dependencies  | leave/sick-leave-service-credit                                       |
| Source        | OPM FERS Handbook, Ch. 50; 5 U.S.C. § 8415                         |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 4 implementation                                  |

**Formula:**
```
totalServiceYears = currentServiceYears + (sickLeaveHours / 2087)
```

---

### FORMULA_ID: leave/simulate-year

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Leave Year Simulation                                                 |
| Module        | leave                                                                 |
| Purpose       | Simulates annual + sick leave accruals, usage events, and rollover   |
| Inputs        | `LeaveYearInput` (yearsOfService, carryIn balances, payPeriods, events) |
| Outputs       | `LeaveYearResult` (end balances, totals, forfeit)                    |
| Dependencies  | leave/annual-accrual-rate, leave/rollover-cap, leave/sick-accrual   |
| Source        | 5 U.S.C. § 6303–6307; OPM FERS Handbook, Ch. 50                    |
| Classification| Assumption (lump-sum accrual model for projections)                  |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 4 implementation                                  |

**Formula:**
```
annualAccrued = accrualRate(yearsOfService) × payPeriodsWorked
sickAccrued   = 4 × payPeriodsWorked
[apply usage events in order]
endOfYearAnnual = min(annualBalance, rolloverCap)
forfeit = max(0, annualBalance − rolloverCap)
```

---

### FORMULA_ID: tsp/agency-match

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | TSP Agency Match                                                      |
| Module        | tsp                                                                   |
| Purpose       | Computes total agency contribution (automatic 1% + match up to 4%)   |
| Inputs        | `employeeContributionPct: number`, `salary: USD`                     |
| Outputs       | `agencyContribution: USD` (always to Traditional TSP)                |
| Dependencies  | none                                                                  |
| Source        | 5 U.S.C. § 8432(c); TSP regulations                                  |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — scaffold entry; 2026-02-10 — Phase 5 implementation    |

**Formula:**
```
automatic = salary × 0.01
tier1     = min(employeeContributionPct, 0.03) × salary × 1.00
tier2     = max(0, min(employeeContributionPct − 0.03, 0.02)) × salary × 0.50
matching  = tier1 + tier2
totalAgencyContribution = automatic + matching   (always to Traditional TSP)
```

---

### FORMULA_ID: tsp/traditional-growth

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Traditional TSP Growth Projection                                     |
| Module        | tsp                                                                   |
| Purpose       | Projects pre-tax Traditional TSP balance with employee + agency contribs |
| Inputs        | `openingBalance`, `employeeContrib`, `agencyContrib`, `growthRate`, `years` |
| Outputs       | `closingBalance: USD`                                                 |
| Dependencies  | tsp/agency-match, tsp/contribution-limit                              |
| Source        | 5 U.S.C. § 8432; TSP regulations 5 CFR Part 1600                    |
| Classification| Assumption (growth rate; mid-year contribution approximation)         |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 5 implementation                                  |

**Formula (mid-year approximation):**
```
closingBalance = openingBalance × (1 + r) + totalContributions × (1 + r/2)
  r = annual growth rate
  totalContributions = employeeContrib + agencyContrib
```

---

### FORMULA_ID: tsp/roth-growth

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Roth TSP Growth Projection                                            |
| Module        | tsp                                                                   |
| Purpose       | Projects after-tax Roth TSP balance; employee contributions only      |
| Inputs        | `openingBalance`, `annualContributions`, `growthRate`, `years`       |
| Outputs       | `closingBalance: USD`                                                 |
| Dependencies  | tsp/contribution-limit                                                |
| Source        | IRC § 402A; TSP regulations 5 CFR Part 1601                         |
| Classification| Assumption (growth rate; mid-year contribution approximation)         |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 5 implementation                                  |

**Formula:**
```
closingBalance = openingBalance × (1 + r) + employeeContributions × (1 + r/2)
  Agency contributions NEVER included here — always Traditional only.
```

---

### FORMULA_ID: tsp/contribution-limit

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | IRS TSP Contribution Limit Enforcement                                |
| Module        | tsp (data: tsp-limits.ts)                                            |
| Purpose       | Clamps employee elective deferral to IRS annual limit                 |
| Inputs        | `intendedContribution`, `year`, `isCatchUpEligible`                  |
| Outputs       | `cappedContribution: USD`                                             |
| Dependencies  | IRS annual limit table (TSP_LIMITS_BY_YEAR)                          |
| Source        | IRC § 402(g); IRC § 414(v); IRS Notice (annual)                      |
| Classification| Hard regulatory requirement (historical); Assumption (projected years) |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 5 implementation                                  |

**Formula:**
```
maxAllowed = electiveDeferralLimit + (isCatchUpEligible ? catchUpLimit : 0)
cappedContribution = min(intendedContribution, maxAllowed)
```

---

### FORMULA_ID: tsp/rmd

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Required Minimum Distribution (RMD)                                   |
| Module        | tsp                                                                   |
| Purpose       | Computes IRS-required minimum annual distribution from Traditional TSP |
| Inputs        | `traditionalBalance: USD`, `age: number`                              |
| Outputs       | `rmdAmount: USD`                                                      |
| Dependencies  | none                                                                  |
| Source        | IRC § 401(a)(9); IRS Publication 590-B; SECURE 2.0 Act § 107        |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-11 — Implementation (rmd.ts)                                 |

**Formula:**
```
isRMDRequired = age >= 73  (SECURE 2.0 Act threshold)
rmdAmount = traditionalBalance / distributionPeriod(age)
  distributionPeriod = IRS Uniform Lifetime Table III lookup (ages 72–115+)
  e.g., age 73 → 26.5, age 80 → 20.2, age 90 → 12.2

Only applies to Traditional TSP; Roth TSP is exempt from RMDs during owner's lifetime.
If planned withdrawal < RMD, the Traditional withdrawal is increased to satisfy the RMD.
```

---

### FORMULA_ID: tsp/annual-trueup

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Agency Match Annual True-Up                                           |
| Module        | tsp                                                                   |
| Purpose       | Restores agency match to annual maximum if employee hits 402(g) cap mid-year |
| Inputs        | `ytdEmployeeContrib: USD`, `payPeriodsRemaining: number`, `salary: USD`, `electiveDeferralCap: USD` |
| Outputs       | `trueUpAmount: USD` (additional agency match retroactively)           |
| Dependencies  | none                                                                  |
| Source        | TSP Bulletin 2012-2; 5 CFR § 1600.23(b)                             |
| Classification| Assumption (provider-dependent; default false)                       |
| Version       | 0.1.0 (HOOK — not yet implemented)                                  |
| Changelog     | 2026-02-18 — Added agencyMatchTrueUp flag to TSPContributionEvent; marked as future hook |

**Design (not yet implemented):**

Background: When an employee front-loads contributions and hits the IRC § 402(g) elective deferral cap mid-year, they stop contributing for remaining pay periods. Without true-up, the agency stops matching those periods (forfeiting match). With true-up, the payroll provider retroactively restores the match to reach the annual 5% maximum.

Configuration flag: `TSPContributionEvent.agencyMatchTrueUp` (default: undefined/false)
- false: Conservative model; employee loses match if cap hit mid-year (matches NFC processing)
- true: Enable if payroll provider (some DFAS, agency TSP offices) performs annual true-up

When implemented:
1. Track YTD employee contributions by pay period
2. Upon cap hit, calculate remaining pay periods
3. For remaining periods: set employee contribution to 0, but agency match to the "catch-up" amount
4. This restores the total agency contribution to 5% × annual salary

Example (2025 cap = $23,500):
- Salary: $100k/year = $3,846.15/pp
- Employee: 5% = $192.31/pp × 26 = $5,000 intended
- At pp 23: YTD = $23,100; remaining cap = $400
- Without true-up: pp 24 contributes $400 only; pp 25–26 = $0 (no match for those)
- With true-up: pp 24–26 receive "catch-up" match to bring annual total to 5% × $100k = $5,000

See: `tests/unit/tsp/agency-match-trueup.test.ts` for test scenarios.

---

### FORMULA_ID: military/buyback-deposit

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Military Service Buyback Deposit                                      |
| Module        | military                                                              |
| Purpose       | Computes the deposit amount (3% of basic pay + OPM interest)         |
| Inputs        | `militaryBasicPayByYear`, `depositYear`, `interestStartYear?`        |
| Outputs       | `{ principalDeposit, interestAccrued, totalDeposit }`                |
| Dependencies  | OPM interest rate table (opm-interest-rates.ts)                      |
| Source        | OPM FERS Handbook, Ch. 23; 5 U.S.C. § 8411(b); 5 CFR § 842.304     |
| Classification| Hard regulatory requirement (3% rate); Assumption (interest projection) |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 5 implementation                                  |

**Formula:**
```
principal = Σ (basicPay[year] × 0.03) for each year of service
balance   = principal × Π (1 + OPMRate[year]) for each year in [interestStart, depositYear)
interest  = balance − principal
```

---

### FORMULA_ID: military/service-credit

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Military Service Credit                                               |
| Module        | military                                                              |
| Purpose       | Adds military service years to FERS creditable service if eligible   |
| Inputs        | `civilianServiceYears`, `militaryServiceYears`, `buybackCompleted`, `militaryRetirementPayReceived`, `militaryRetirementWaived` |
| Outputs       | `totalCreditableServiceYears: number`                                |
| Dependencies  | none                                                                  |
| Source        | OPM FERS Handbook, Ch. 23; 5 U.S.C. § 8411(b)                      |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 5 implementation                                  |

**Formula:**
```
IF buybackCompleted AND (NOT militaryRetirementPayReceived OR militaryRetirementWaived):
  totalService = civilianYears + militaryYears
ELSE:
  totalService = civilianYears   (military years not credited)
```

---

### FORMULA_ID: expenses/annual-total

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Annual Expense Total                                                  |
| Module        | expenses                                                              |
| Purpose       | Sums all expense categories in an ExpenseProfile                     |
| Inputs        | `profile: ExpenseProfile` (categories with annualAmount)             |
| Outputs       | `{ totalAnnual: USD, breakdown: CategoryBreakdown[] }`               |
| Dependencies  | none                                                                  |
| Source        | User-defined; category list based on BLS Consumer Expenditure Survey  |
| Classification| User-configurable                                                     |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 6 implementation                                  |

**Formula:**
```
totalAnnual = Σ category.annualAmount  for all categories in profile
```

---

### FORMULA_ID: expenses/smile-curve

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Expense Smile Curve                                                   |
| Module        | expenses                                                              |
| Purpose       | Applies a U-shaped multiplier to base expenses by year into retirement |
| Inputs        | `baseExpenses: USD`, `yearsIntoRetirement: number`, `SmileCurveParams` |
| Outputs       | `adjustedExpenses: USD`                                               |
| Dependencies  | none                                                                  |
| Source        | Blanchett (2014) "Exploring the Retirement Consumption Puzzle"       |
| Classification| Assumption — user must acknowledge before use                         |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 6 implementation                                  |

**Formula (piecewise linear):**
```
Segment 1 [0, midDipYear]:        multiplier = earlyMult + t × (midMult − earlyMult)
Segment 2 [midDipYear, 2×midDip]: multiplier = midMult + t × (lateMult − midMult)
Beyond 2×midDipYear:              multiplier = lateMult (constant)
  where t = fractional position within segment
Default anchors: early=1.00, mid=0.85 at year 15, late=0.95 at year 30
adjustedExpenses = baseExpenses × multiplier
```

---

### FORMULA_ID: expenses/inflation-adjustment

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Inflation Adjustment                                                  |
| Module        | expenses                                                              |
| Purpose       | Adjusts a dollar amount for compound inflation over time              |
| Inputs        | `baseAmount: USD`, `years: number`, `annualRate: Rate` (default 2.5%) |
| Outputs       | `adjustedAmount: USD`                                                 |
| Dependencies  | none                                                                  |
| Source        | BLS CPI historical data; SSA COLA history                            |
| Classification| Assumption (constant rate); warn if outside 1%–6%                   |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 6 implementation                                  |

**Formula:**
```
adjustedAmount = baseAmount × (1 + annualRate)^years
  Default rate: 2.5%  |  Warning range: outside [1%, 6%]
```

---

### FORMULA_ID: simulation/fers-eligibility

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | FERS Retirement Eligibility                                           |
| Module        | simulation                                                            |
| Purpose       | Determines whether an employee meets a FERS retirement eligibility type |
| Inputs        | `ageAtRetirement: number`, `yearsOfService: number`, `birthYear: number` |
| Outputs       | `EligibilityResult { eligible: boolean, type: string \| null }`       |
| Dependencies  | simulation/fers-eligibility (MRA sub-lookup)                          |
| Source        | OPM FERS Handbook, Ch. 40; 5 U.S.C. § 8412                          |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 7 implementation                                  |

**Formula:**
```
MRA = lookup(birthYear)  [55 to 57, per OPM table]

Eligibility types (checked in priority order):
  Age62+5      : age >= 62 AND service >= 5
  Age60+20     : age >= 60 AND service >= 20
  MRA+30       : age >= MRA AND service >= 30
  MRA+10-reduced: age >= MRA AND service >= 10 (reduced 5%/yr under 62)
  else: NOT eligible

MRA+10 reduction factor = 1.0 − 0.05 × floor(62 − ageAtRetirement)
```

---

### FORMULA_ID: simulation/high-3-salary

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | High-3 Average Salary                                                 |
| Module        | simulation                                                            |
| Purpose       | Computes the highest 36-month average basic pay from salary history   |
| Inputs        | `salaryHistory: SalaryRecord[]` (year + annualSalary)                |
| Outputs       | `high3Salary: USD`                                                    |
| Dependencies  | career/projection (computeHigh3Salary)                                |
| Source        | OPM FERS Handbook, Ch. 50, § 50B1.1-1; 5 U.S.C. § 8401(21)        |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 7 implementation                                  |

**Formula:**
```
For each 3-year window in sorted salary history:
  avg = (salary[i] + salary[i+1] + salary[i+2]) / 3
high3 = max(avg across all windows)
```

---

### FORMULA_ID: simulation/fers-basic-annuity

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | FERS Basic Annuity                                                    |
| Module        | simulation                                                            |
| Purpose       | Computes gross and net annual FERS annuity before COLA               |
| Inputs        | `high3Salary: USD`, `creditableServiceYears: number`, `ageAtRetirement: number`, `eligibilityType: string` |
| Outputs       | `FERSAnnuityResult { grossAnnualAnnuity, netAnnualAnnuity, multiplier, reductionFactor }` |
| Dependencies  | simulation/high-3-salary, simulation/fers-eligibility                 |
| Source        | OPM FERS Handbook, Ch. 50, § 50B2; 5 U.S.C. § 8415                 |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 7 implementation                                  |

**Formula:**
```
multiplier = 1.1% if (age >= 62 AND service >= 20), else 1.0%
grossAnnuity = high3Salary × creditableServiceYears × multiplier
reductionFactor = mra10ReductionFactor(age) if eligibilityType == 'MRA+10-reduced', else 1.0
netAnnuity = grossAnnuity × reductionFactor
```

---

### FORMULA_ID: simulation/fers-supplement

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | FERS Special Retirement Supplement (SRS)                              |
| Module        | simulation                                                            |
| Purpose       | Approximates Social Security benefit earned during federal service, paid until age 62 |
| Inputs        | `ageAtRetirement: number`, `eligibilityType: string`, `federalServiceYears: number`, `estimatedSSAt62: USD/month` |
| Outputs       | `FERSSupplementResult { eligible: boolean, annualAmount: USD }`       |
| Dependencies  | simulation/fers-eligibility                                           |
| Source        | OPM FERS Handbook, Ch. 51; 5 U.S.C. § 8421                         |
| Classification| Hard regulatory requirement                                           |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 7 implementation                                  |

**Formula:**
```
eligible = ageAtRetirement < 62 AND eligibilityType IN {MRA+30, Age60+20}
annualAmount = estimatedSSAt62 × (min(federalYears, 40) / 40) × 12
  (0 if not eligible)
Note: Subject to SS earnings test if employee has earned income post-retirement.
```

---

### FORMULA_ID: simulation/income-projection

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Retirement Income Projection                                          |
| Module        | simulation                                                            |
| Purpose       | Projects annual income, expenses, and net surplus over the retirement horizon |
| Inputs        | `SimulationInput` (profile + assumptions)                             |
| Outputs       | `SimulationResult` (per-year `AnnualProjection[]`)                    |
| Dependencies  | simulation/fers-basic-annuity, simulation/fers-supplement, simulation/high-3-salary, leave/retirement-credit, military/service-credit, expenses/annual-total, expenses/smile-curve, expenses/inflation-adjustment |
| Source        | OPM FERS Handbook; TSP regulations (5 U.S.C. § 8432); docs/architecture.md |
| Classification| Derived composite                                                     |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 7 implementation                                  |

**Formula (per year `yr`):**
```
annuity[yr]     = baseAnnuity × (1 + colaRate)^yr
supplement[yr]  = annualSupplement × (1 + colaRate)^yr  if age < 62, else 0
tspBalance      grows at tspGrowthRate each year
tspWithdrawal[yr] = initialWithdrawal × (1 + colaRate)^yr  (capped at balance)
totalIncome[yr] = annuity[yr] + supplement[yr] + tspWithdrawal[yr]
expenses[yr]    = adjustForInflation(smileAdjusted(baseExpenses, yr), yr, inflationRate)
surplus[yr]     = totalIncome[yr] − expenses[yr]
```

---

### FORMULA_ID: simulation/scenario-comparison

| Field         | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| Name          | Scenario Comparison                                                   |
| Module        | simulation                                                            |
| Purpose       | Runs and compares two retirement scenarios to identify differences in income, expenses, and surplus |
| Inputs        | `ScenarioInput { label, input: SimulationInput }[]` (2 scenarios)     |
| Outputs       | `ScenarioComparisonResult { scenarios[], deltaAnnuity, deltaLifetimeSurplus }` |
| Dependencies  | simulation/income-projection                                          |
| Source        | docs/architecture.md                                                  |
| Classification| Derived composite                                                     |
| Version       | 1.0.0                                                                 |
| Changelog     | 2026-02-10 — Phase 7 implementation                                  |

**Formula:**
```
For each scenario: run projectRetirementIncome(input)
deltaAnnuity = scenario[1].annualAnnuity − scenario[0].annualAnnuity
deltaLifetimeSurplus = Σ scenario[1].surplus[yr] − Σ scenario[0].surplus[yr]
```

---

## Spreadsheet Cell Cross-Reference

| Spreadsheet Cell | Formula ID                        | Notes                |
|------------------|-----------------------------------|----------------------|
| TBD              | simulation/fers-basic-annuity     | To be mapped Phase 3 |
| TBD              | simulation/high-3-salary          | To be mapped Phase 3 |
| TBD              | leave/annual-accrual-rate         | Cell mapping TBD — Phase 4 complete |
| TBD              | leave/rollover-cap                | Cell mapping TBD — Phase 4 complete |
| TBD              | leave/sick-accrual                | Cell mapping TBD — Phase 4 complete |
| TBD              | leave/sick-leave-service-credit   | Cell mapping TBD — Phase 4 complete |
| TBD              | leave/retirement-credit           | Cell mapping TBD — Phase 4 complete |
| TBD              | tsp/agency-match                  | Cell mapping TBD — Phase 5 complete |
| TBD              | tsp/traditional-growth            | Cell mapping TBD — Phase 5 complete |
| TBD              | tsp/roth-growth                   | Cell mapping TBD — Phase 5 complete |
| TBD              | tsp/contribution-limit            | Cell mapping TBD — Phase 5 complete |
| TBD              | military/buyback-deposit          | Cell mapping TBD — Phase 5 complete |
| TBD              | military/service-credit           | Cell mapping TBD — Phase 5 complete |
| TBD              | tsp/rmd                           | RMD per IRS Uniform Lifetime Table  |
| TBD              | expenses/annual-total             | Cell mapping TBD — Phase 6 complete |
| TBD              | expenses/smile-curve              | Cell mapping TBD — Phase 6 complete |
| TBD              | expenses/inflation-adjustment     | Cell mapping TBD — Phase 6 complete |
| TBD              | simulation/fers-eligibility       | Cell mapping TBD — Phase 7 complete |
| TBD              | simulation/high-3-salary          | Cell mapping TBD — Phase 7 complete |
| TBD              | simulation/fers-basic-annuity     | Cell mapping TBD — Phase 7 complete |
| TBD              | simulation/fers-supplement        | Cell mapping TBD — Phase 7 complete |
| TBD              | simulation/income-projection      | Cell mapping TBD — Phase 7 complete |
| TBD              | simulation/scenario-comparison    | Cell mapping TBD — Phase 7 complete |

---

## Change History

| Version | Date       | Author | Description                         |
|---------|------------|--------|-------------------------------------|
| 0.1.0   | 2026-02-10 |        | Initial formula registry scaffold   |
| 0.2.0   | 2026-02-10 |        | Phase 3 — career/pay formulas added (7 formulas) |
| 0.3.0   | 2026-02-10 |        | Phase 4 — leave formulas implemented (5 formulas: rollover-cap, sick-accrual, sick-leave-service-credit, retirement-credit, simulate-year) |
| 0.4.0   | 2026-02-10 |        | Phase 5 — TSP + military buyback formulas implemented (6 formulas: agency-match, traditional-growth, roth-growth, contribution-limit, buyback-deposit, service-credit) |
| 0.5.0   | 2026-02-10 |        | Phase 6 — expense modeling formulas implemented (3 formulas: annual-total, smile-curve, inflation-adjustment) |
| 0.6.0   | 2026-02-10 |        | Phase 7 — simulation engine formulas implemented (6 formulas: fers-eligibility, high-3-salary, fers-basic-annuity, fers-supplement, income-projection, scenario-comparison) |
| 0.7.0   | 2026-02-10 |        | Phase 8 — Visualization & UX layer (no new formulas; 5 chart components, summary cards, demo fixture, Dashboard orchestrator, Astro layout, 32 component tests) |
| 0.8.0   | 2026-02-11 |        | Added tsp/rmd formula entry; updated leave/annual-accrual-rate with 6 hrs/PP → 160 hrs/year note per 5 U.S.C. § 6303(a) |
