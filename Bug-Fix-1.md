# Bug Fix Plan — Phase 9 Dashboard Issues

## Bug Summary

| # | Issue | Root Cause | Severity | Status |
|---|-------|-----------|----------|--------|
| 1 | No sick leave usage field for modeling | `useSimulation` hardcodes `usageEvents: []`; no average-annual-usage input exists | Medium | TODO |
| 2 | Dashboard charts start in 2026 not retirement year | `retirement-simulation.ts` line 71 uses `new Date().getFullYear()` | Critical | ✅ DONE |
| 3 | Annuity & High-3 cards don't update from My Plan data | Synthetic career has `annualSalary: 0` and wrong `effectiveDate` | Critical | ✅ DONE |
| 4 | Income Waterfall starts in 2026 | Same root cause as Bug 2 (wrong startYear in full simulation) | Critical | ✅ DONE |
| 5 | TSP Lifecycle has discontinuity at retirement | Pre-retirement uses `balance × 0.1` and hardcoded $5k/$2k contributions | High | TODO |
| 6 | RMD Compliance doesn't honor plan data or TSP drawdown | Filter hardcodes `age >= 73`; should use `getRMDStartAge(birthYear)` | High | TODO |

## Completed Fixes

### Bug 2/4: Fixed (Commit ce3095a)
Charts now use retirement year instead of current year. Income Waterfall, TSP Lifecycle, Expense Phases, and RMD Compliance charts display correct calendar years.

### Bug 3: Fixed (Commit 882ec71)
- Synthetic career now computes annualSalary from GS pay tables (not $0)
- Uses scdLeave (hire date) not scdRetirement as effectiveDate
- Dashboard annuity prefers fullSimulation override when available

---

## Bug 1: Add Average Sick Leave Usage Field

### Problem
The leave simulation in `useSimulation.ts:80-85` calls `simulateLeaveYear()` with `usageEvents: []` every year, meaning sick leave grows unbounded (no usage modeled). The user has no way to enter an average annual sick leave usage for projection purposes.

### Root Cause
- `app/src/models/leave.ts` — `LeaveBalance` has no field for average annual sick leave usage
- `app/src/hooks/useSimulation.ts:85` — `usageEvents` hardcoded to empty array
- No form field exists to capture this assumption

### Fix

**Step 1: Add field to `LeaveBalance` model**

File: `app/src/models/leave.ts`
```typescript
export interface LeaveBalance {
  asOf: ISODate;
  annualLeaveHours: number;
  sickLeaveHours: number;
  familyCareUsedCurrentYear: number;
  averageAnnualSickLeaveUsage?: number;  // ADD: hours/year, e.g. 40
}
```

**Step 2: Update Zod schema in storage**

File: `app/src/storage/schema.ts` — Add `averageAnnualSickLeaveUsage` as optional number to `LeaveBalanceSchema`.

**Step 3: Add input field to FERS Estimate form**

File: `app/src/components/forms/FERSEstimateForm.tsx` — Add a numeric input field in the leave section:
- Label: "Average Annual Sick Leave Used (hrs)"
- Placeholder: "e.g., 40"
- Default: 0
- Persists to `retire:leave` storage key as part of `LeaveBalance`

**Step 4: Use the value in `useSimulation`**

File: `app/src/hooks/useSimulation.ts` — In the leave balance loop (lines 69-85), convert the average annual usage into a `LeaveEvent`:

```typescript
const avgSickUsage = input.profile.leaveBalance.averageAnnualSickLeaveUsage ?? 0;
const usageEvents: LeaveEvent[] = avgSickUsage > 0
  ? [{ id: 'avg-sick', date: `${year}-06-15`, type: 'sick', hoursUsed: avgSickUsage }]
  : [];

const lr = simulateLeaveYear({
  yearsOfService,
  annualLeaveCarryIn: annualCarry,
  sickLeaveCarryIn: sickCarry,
  payPeriodsWorked: 26,
  usageEvents,  // Was hardcoded to []
});
```

### Files Changed
| File | Action |
|------|--------|
| `src/models/leave.ts` | Add optional `averageAnnualSickLeaveUsage` field |
| `src/storage/schema.ts` | Update `LeaveBalanceSchema` with new optional field |
| `src/components/forms/FERSEstimateForm.tsx` | Add numeric input for average sick leave usage |
| `src/hooks/useSimulation.ts` | Pass usage events to `simulateLeaveYear()` |

### Tests
- Update leave model tests if any check the shape
- Add test in `useSimulation.test.ts`: verify sick leave balance decreases when average usage > 0

---

## Bug 2 & 4: Full Simulation Uses Current Year Instead of Retirement Year

### Problem
`projectRetirementSimulation()` anchors all year labels to `new Date().getFullYear()` (2026 today). This causes:
- Income Waterfall chart shows years 2026, 2027, 2028... regardless of actual retirement date
- Expense Phases chart starts GoGo phase in 2026
- TSP Lifecycle post-retirement segment has wrong year labels
- All data computed from fullSimulation carries wrong calendar years

### Root Cause

File: `app/src/modules/simulation/retirement-simulation.ts` line 71:
```typescript
const startYear = new Date().getFullYear(); // WRONG: always 2026
```

The simple path (`income-projection.ts` line 156) does this correctly:
```typescript
const calendarYear = new Date(retirementDate).getFullYear() + yr; // CORRECT
```

### Fix

**Step 1: Add `retirementYear` to `SimulationConfig`**

File: `app/src/models/simulation.ts` — Add to `SimulationConfig`:
```typescript
/** Calendar year of retirement (required for year labels) */
retirementYear: number;
```

**Step 2: Use `retirementYear` in simulation engine**

File: `app/src/modules/simulation/retirement-simulation.ts` line 71 — Replace:
```typescript
const startYear = new Date().getFullYear();
```
With:
```typescript
const startYear = config.retirementYear
  ?? (config.birthYear ? config.birthYear + config.retirementAge : new Date().getFullYear());
```

**Step 3: Populate `retirementYear` in SimulationForm**

File: `app/src/components/forms/SimulationForm.tsx` — When building the `SimulationConfig` to save, compute `retirementYear` from the proposed retirement date (already available from the FERS estimate or personal data):
```typescript
retirementYear: new Date(proposedRetirementDate).getFullYear(),
```

**Step 4: Update demo fixture**

File: `app/src/data/demo-fixture.ts` — If the demo creates a `SimulationConfig`, include `retirementYear`.

### Files Changed
| File | Action |
|------|--------|
| `src/models/simulation.ts` | Add `retirementYear` to `SimulationConfig` |
| `src/modules/simulation/retirement-simulation.ts` | Use `config.retirementYear` instead of `new Date().getFullYear()` |
| `src/components/forms/SimulationForm.tsx` | Populate `retirementYear` from retirement date |
| `src/storage/schema.ts` | Add `retirementYear` to `SimulationConfigSchema` |
| `src/data/demo-fixture.ts` | Update demo config if needed |

### Tests
- Update `retirement-simulation.test.ts`: verify output years start at retirement year, not current year
- Verify scenario tests still pass (they test the simple path which is already correct)

---

## Bug 3: Summary Cards (Annuity & High-3) Not Updating from My Plan

### Problem
When the user fills in FERS Estimate but hasn't filled the Career tab, the app synthesizes a career with `annualSalary: 0` and uses `scdRetirement` as the hire date. This causes:
- `computeHigh3()` returns $0 (all salary history entries are $0)
- Annuity computes to $0 (annuity = high3 × multiplier × years)
- Summary cards show $0 for both

### Root Cause

File: `app/src/components/forms/useAssembleInput.ts` lines 73-83:
```typescript
events: [{
  id: 'auto-hire',
  type: 'hire',
  effectiveDate: personal.scdRetirement, // WRONG: should be scdLeave (hire date)
  grade,
  step,
  localityCode,
  paySystem: personal.paySystem,
  annualSalary: 0, // WRONG: should compute from GS pay tables
}],
```

### Fix

**Step 1: Compute salary from pay tables in synthetic career**

File: `app/src/components/forms/useAssembleInput.ts` — Import `calculateAnnualPay` from `@modules/career` and compute the salary:

```typescript
import { calculateAnnualPay } from '@modules/career';

// In the else branch (no career saved):
const grade = (fersEstimate?.gsGrade ?? 12) as GSGrade;
const step = (fersEstimate?.gsStep ?? 5) as GSStep;
const localityCode = fersEstimate?.localityCode ?? 'RUS';
const currentYear = new Date().getFullYear();
const computedSalary = calculateAnnualPay(grade, step, localityCode, currentYear);

mergedCareer = {
  id: 'auto',
  scdLeave: personal.scdLeave,
  scdRetirement: personal.scdRetirement,
  paySystem: personal.paySystem,
  events: [{
    id: 'auto-hire',
    type: 'hire',
    effectiveDate: personal.scdLeave,      // FIX: use hire date, not retirement date
    grade,
    step,
    localityCode,
    paySystem: personal.paySystem,
    annualSalary: computedSalary,           // FIX: compute from pay tables
  }],
};
```

**Step 2: Also pass `fullSimulation` annuity to Dashboard if available**

Currently `Dashboard.tsx` only reads `result.annualAnnuity` from the simple path. If the user has completed the Simulation form, `fullSimulation.config.fersAnnuity` may have a more accurate value (user can override). Consider:

File: `app/src/components/Dashboard.tsx` — Prefer `fullSimulation.config.fersAnnuity` when available:
```typescript
const annuityDisplay = fullSimulation
  ? fullSimulation.config.fersAnnuity
  : result.annualAnnuity;
```

This ensures the summary cards reflect either the computed value or the user's explicit override from the Simulation form.

### Files Changed
| File | Action |
|------|--------|
| `src/components/forms/useAssembleInput.ts` | Compute salary from pay tables; fix effectiveDate to use `scdLeave` |
| `src/components/Dashboard.tsx` | Prefer fullSimulation annuity when available |

### Tests
- Add test: verify synthetic career produces non-zero salary
- Add test: verify High-3 and annuity are non-zero when FERS form is filled but Career tab is empty

---

## Bug 5: TSP Lifecycle Discontinuity at Retirement

### Problem
The pre-retirement TSP segment uses arbitrary hardcoded values that don't match the user's actual TSP data, creating a massive visual jump at retirement:
- Opening balance: `actualBalance × 0.1` (only 10% of real balance)
- Annual contribution: hardcoded `$5,000` (Traditional) and `$2,000` (Roth)
- Post-retirement segment starts at `config.tspBalanceAtRetirement` (the full actual balance)

### Root Cause

File: `app/src/hooks/useSimulation.ts` lines 107-127:
```typescript
const tradYears = projectTraditionalDetailed({
  openingBalance: tradBalance > 0 ? tradBalance * 0.1 : 0,  // 10% of actual!
  employeeAnnualContribution: 5_000,                          // Hardcoded
  employeeContributionPct: 0.10,                              // Hardcoded
  ...
});
```

### Fix

**Step 1: Use actual TSP balances and reasonable contribution estimates**

File: `app/src/hooks/useSimulation.ts` — Replace the hardcoded values with user data:

```typescript
const tradBalance = input.profile.tspBalances.traditionalBalance;
const rothBalance = input.profile.tspBalances.rothBalance;

// Estimate contribution from salary (default: 5% employee Traditional, 2% Roth)
const lastSalary = salaryHistory.length > 0
  ? salaryHistory[salaryHistory.length - 1].salary
  : 50_000;
const estimatedTradContrib = lastSalary * 0.05;
const estimatedRothContrib = lastSalary * 0.02;

const tradYears = projectTraditionalDetailed({
  openingBalance: tradBalance,               // FIX: actual balance, not 10%
  annualSalary: lastSalary,
  employeeAnnualContribution: estimatedTradContrib,
  employeeContributionPct: 0.05,
  growthRate: input.assumptions.tspGrowthRate,
  years: careerYears,
  startYear,
  isCatchUpEligible: false,
});

const rothYears = projectRothDetailed({
  openingBalance: rothBalance,               // FIX: actual balance, not 10%
  employeeAnnualContribution: estimatedRothContrib,
  growthRate: input.assumptions.tspGrowthRate,
  years: careerYears,
  startYear,
  isCatchUpEligible: false,
  traditionalEmployeeContribution: estimatedTradContrib,
});
```

**IMPORTANT CONSIDERATION:** The pre-retirement projection represents GROWTH FROM TODAY to retirement, not growth from career start. So:
- `careerYears` should be years-to-retirement (from today), NOT total career years
- `startYear` should be the current year, NOT the hire year
- `openingBalance` should be the current actual balance

This means modifying the `careerYears` and `startYear` calculations:

```typescript
const currentYear = new Date().getFullYear();
const yearsToRetirement = Math.max(0, retireYear - currentYear);
const tspStartYear = currentYear;

// Only project if retirement is in the future
if (yearsToRetirement > 0) {
  const tradYears = projectTraditionalDetailed({
    openingBalance: tradBalance,
    ...
    years: yearsToRetirement,
    startYear: tspStartYear,
    ...
  });
  // ... combine into TSP balances
} else {
  // Already retired or retiring this year — use current balances as-is
}
```

**Step 2: Ensure post-retirement segment starts where pre-retirement ends**

In the `tspLifecycle` concatenation, verify continuity:
- If `fullSimulation` is available and pre-retirement projection ended at a certain total, the first post-retirement entry should start at a matching or reconciled value.
- If there's still a mismatch (because Simulation form allows user to override `tspBalanceAtRetirement`), add a note in the tooltip indicating the user's override.

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useSimulation.ts` | Fix pre-retirement TSP projection: use actual balances, years-to-retirement, salary-based contributions |

### Tests
- Update `useSimulation.test.ts`: verify no discontinuity between last pre-retirement and first post-retirement TSP balance
- Verify TSP balance at retirement year matches input data

---

## Bug 6: RMD Compliance Not Honoring Plan Data

### Problem
Three sub-issues:
1. The RMD timeline filter hardcodes `age >= 73` instead of using the user's birth year to determine RMD start age (73 for born <1960, 75 for born >=1960 per SECURE 2.0)
2. RMD starts in 2037 because of Bug 2 (wrong year labels from `new Date().getFullYear()`)
3. The RMD data comes from `fullSimulation.years[]` which correctly accounts for TSP drawdown, but the wrong years make it look disconnected

### Root Cause

File: `app/src/hooks/useSimulation.ts` lines 241-253:
```typescript
const rmdTimeline: RMDDataPoint[] = fullSimulation
  ? fullSimulation.years
      .filter((yr) => yr.age >= 73)  // WRONG: hardcoded 73
      .map(...)
  : [];
```

The `retirement-simulation.ts` engine correctly calls `computeRMD(traditionalBalance, age, config.birthYear)` which uses `getRMDStartAge()` internally. But the chart filter in `useSimulation.ts` independently hardcodes 73.

### Fix

**Step 1: Use `getRMDStartAge` in the timeline filter**

File: `app/src/hooks/useSimulation.ts` — Import and use `getRMDStartAge`:

```typescript
import { getRMDStartAge } from '@modules/tsp';

// In rmdTimeline computation:
const rmdStartAge = fullSimulation?.config.birthYear
  ? getRMDStartAge(fullSimulation.config.birthYear)
  : 73;

const rmdTimeline: RMDDataPoint[] = fullSimulation
  ? fullSimulation.years
      .filter((yr) => yr.age >= rmdStartAge)  // FIX: dynamic start age
      .map(...)
  : [];
```

**Step 2: Ensure `birthYear` is populated in `SimulationConfig`**

File: `app/src/components/forms/SimulationForm.tsx` — The form already has a `birthYear` field (line 72, default `'1962'`). Verify it auto-populates from the FERS Estimate personal birthDate. If the user entered birthDate = `1967-07-01`, the SimulationForm should default `birthYear` to `1967`, not `1962`.

Check the auto-populate logic around line 216:
```typescript
// Ensure birthYear is seeded from personal.birthDate
if (personal?.birthDate) {
  patch.birthYear = String(new Date(personal.birthDate).getFullYear());
  sourceFields.add('birthYear');
}
```

**Step 3: Fix year labels (automatically fixed by Bug 2 fix)**

Once Bug 2 is fixed (retirement year instead of current year), the RMD timeline years will automatically be correct.

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/useSimulation.ts` | Import `getRMDStartAge`, use dynamic filter |
| `src/components/forms/SimulationForm.tsx` | Verify birthYear auto-populates from personal data |
| `src/modules/tsp/index.ts` | Ensure `getRMDStartAge` is exported (check barrel) |

### Tests
- Add test: verify RMD timeline uses birth year from config (not hardcoded 73)
- Add test: born-1967 user has RMD start at age 75 (SECURE 2.0)
- Add test: born-1955 user has RMD start at age 73

---

## Implementation Order

Dependencies between bugs require this sequence:

```
Bug 2/4 (fix startYear in simulation engine)
    ↓
Bug 3 (fix synthetic career salary + effectiveDate)
    ↓
Bug 5 (fix TSP lifecycle pre-retirement projection)
    ↓
Bug 6 (fix RMD filter + birthYear auto-populate)
    ↓
Bug 1 (add sick leave usage field — independent, least critical)
```

**Rationale:**
- Bug 2 must be fixed first because Bugs 4 and 6 both depend on correct year labels
- Bug 3 fixes the data foundation that Bugs 5 and 6 rely on (accurate annuity/High-3)
- Bug 5 must be fixed before Bug 6 so TSP balances feeding RMD calculations are correct
- Bug 1 is independent and can be done last (additive feature, no downstream dependencies)

---

## Estimated Scope

| Bug | Files Modified | New Files | Lines Changed (est.) | Risk |
|-----|---------------|-----------|---------------------|------|
| 1 | 4 | 0 | ~30 | Low — additive field |
| 2/4 | 4-5 | 0 | ~15 | Medium — touches simulation engine |
| 3 | 2 | 0 | ~20 | Medium — touches data assembly |
| 5 | 1 | 0 | ~25 | Medium — changes TSP projection logic |
| 6 | 2-3 | 0 | ~15 | Low — filter change + barrel export |

**Total: ~105 lines changed across ~10 files. No new files. No new dependencies.**

---

## Verification Checklist

After all fixes:
- [ ] `pnpm typecheck` — no errors
- [ ] `pnpm test` — all tests pass
- [ ] `pnpm test:scenarios` — all 18 spreadsheet parity tests pass
- [ ] `pnpm build` — production build succeeds
- [ ] Dashboard charts start at correct retirement year (not 2026)
- [ ] Summary cards show non-zero annuity and High-3 when FERS Estimate is filled
- [ ] TSP Lifecycle chart is continuous (no jump at retirement)
- [ ] RMD Compliance starts at correct age (73 or 75 based on birth year)
- [ ] Sick leave projection decreases when average usage > 0
- [ ] Demo mode still works (no regressions)
