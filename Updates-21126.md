# Updates Plan — 2026-02-11

Three sections of changes: Leave Tracking fixes, Expense Tab implementation, and TSP Simulation overhaul.

---

## Section 1: Leave Tracking Fixes

### 1.1 Remove "After Cap" column from Annual Leave summary

**Problem:** The "After Cap" column in the annual leave summary panel is redundant and confusing. "Proj. EOY" already shows the raw projected balance, and "Use/Lose" shows hours above the 240-hour cap. "After Cap" (which is just `min(EOY, 240)`) adds no new information.

**Changes:**
- **`app/src/components/forms/leave-calendar/LeaveBalanceSummaryPanel.tsx`** — Remove the `<StatItem label="After Cap" .../>` element (line 49).
- **`app/src/modules/leave/calendar-bridge.ts`** — Keep `projectedAnnualAfterCap` in `CalendarYearSummary` interface for now (other consumers may use it), but it will no longer be displayed.

---

### 1.2 Show LS and DE sick leave totals

**Problem:** The summary panel shows aggregate sick leave totals but does not break them down by sick leave code: LS (Leave Self) and DE (Dependent Care). Users need to see how much of each type they've used.

**Changes:**
- **`app/src/modules/leave/calendar-bridge.ts`**:
  - Add four new fields to `CalendarYearSummary`:
    ```
    plannedSickLS: number;
    plannedSickDE: number;
    actualSickLS: number;
    actualSickDE: number;
    ```
  - In `computeCalendarYearSummary()`, tally entries by `sickCode` (default to `'LS'` if `sickCode` is undefined for backward compat).

- **`app/src/components/forms/leave-calendar/LeaveBalanceSummaryPanel.tsx`**:
  - Add `StatItem`s for LS and DE in the Sick Leave row. Display:
    - `Planned LS` / `Actual LS` / `Planned DE` / `Actual DE`
  - Keep the existing aggregate "Planned" and "Actual" sick totals, or replace them with the LS/DE breakdown if screen space is tight. Recommend replacing with:
    - `LS Planned` | `LS Actual` | `DE Planned` | `DE Actual`

- **`app/tests/unit/leave/calendar-bridge.test.ts`** — Add test cases that verify LS/DE breakdown tallying.

---

### 1.3 Calendar date text should not use legend colors

**Problem:** The day-number text on calendar cells could be confused with the leave type color dots from the legend. The text color should be clearly distinct from the legend palette (blue-400, green-500, orange-400, red-500).

**Changes:**
- **`app/src/components/forms/leave-calendar/DayCell.tsx`**:
  - Add explicit `text-gray-800` to the day number `<span>` for weekdays (currently inherits, which may vary by context).
  - Ensure weekend text remains `text-gray-400` (already correct).
  - The partial-hours badge (`text-gray-500`) is fine — neutral enough.
  - Verify no text element uses blue, green, orange, or red that overlaps with the legend colors.

- **`app/src/components/forms/leave-calendar/MonthCalendar.tsx`**:
  - Verify month name header text (`text-gray-800`) and day headers (`text-gray-500`) don't conflict with legend colors. These are fine as-is.

---

### 1.4 Show federal holidays on calendars

**Problem:** The calendar does not display federal holidays. Federal employees need to see holidays since they affect leave planning (no leave needed on holidays).

**Changes:**
- **New file: `app/src/data/federal-holidays.ts`** — Utility to compute federal holidays for any given year. The 11 federal holidays:
  1. New Year's Day — January 1
  2. Martin Luther King Jr. Day — 3rd Monday in January
  3. Presidents' Day — 3rd Monday in February
  4. Memorial Day — Last Monday in May
  5. Juneteenth — June 19
  6. Independence Day — July 4
  7. Labor Day — 1st Monday in September
  8. Columbus Day — 2nd Monday in October
  9. Veterans Day — November 11
  10. Thanksgiving Day — 4th Thursday in November
  11. Christmas Day — December 25

  Include logic for observed dates (when a holiday falls on Saturday → observed Friday; Sunday → observed Monday). Export a function: `getFederalHolidays(year: number): Map<string, string>` returning `ISODate → holiday name`.

- **`app/src/components/forms/leave-calendar/DayCell.tsx`**:
  - Accept new optional prop: `holidayName?: string`.
  - When set, render a small indicator (e.g., a small star or diamond icon, or a distinct background color like `bg-amber-50` with `text-amber-700`).
  - Show the holiday name as a tooltip on hover.
  - Disable click (no leave needed on holidays), similar to weekends.

- **`app/src/components/forms/leave-calendar/MonthCalendar.tsx`**:
  - Accept a `holidays: Map<string, string>` prop.
  - Pass `holidayName` to `DayCell` for matching dates.

- **`app/src/components/forms/leave-calendar/LeaveCalendarGrid.tsx`**:
  - Compute holidays for the active year via `getFederalHolidays(year)` and pass down to each `MonthCalendar`.

- **`app/src/components/forms/LeaveBalanceForm.tsx`**:
  - Add a legend entry for holidays (e.g., amber star/diamond with label "Federal Holiday").

- **`app/tests/unit/leave/federal-holidays.test.ts`** — Test holiday date computation for several years, including edge cases (observed dates, leap years).

---

### 1.5 Labels should wrap in totals table

**Problem:** Labels in the annual and sick leave summary panel use the `truncate` CSS class, which clips long labels on narrow screens instead of wrapping.

**Changes:**
- **`app/src/components/forms/leave-calendar/LeaveBalanceSummaryPanel.tsx`**:
  - In the `StatItem` component, remove `truncate` from the label's className.
  - Replace with `whitespace-normal break-words` to allow wrapping.
  - Adjust parent flex container: ensure `flex-wrap` is allowed and items have appropriate `min-w-[3rem]` or similar to prevent collapse.
  - Consider changing from `text-[10px]` to `text-[11px]` for better readability.

---

### 1.6 Fix annual leave accrual total for 6 hrs/PP

**Problem:** Per OPM (5 U.S.C. 6303), employees in the 6 hrs/PP tier (3–15 years of service) earn **160 hours per year**, not 156. The breakdown is:
- 25 pay periods × 6 hours = 150 hours
- 1 final pay period × 10 hours = 10 hours
- **Total = 160 hours/year** (20 days)

The current code computes `6 × 26 = 156` which is 4 hours short.

For reference, the other tiers:
- 4 hrs/PP: 4 × 26 = 104 hours (13 days) — correct as-is
- 8 hrs/PP: 8 × 26 = 208 hours (26 days) — correct as-is

Only the 6 hrs/PP tier has this "last pay period bonus" per OPM.

**OPM Reference:** 5 U.S.C. 6303(a) — "An employee in the category is entitled to 20 days of annual leave" for the 3-to-15-year tier. Since 20 workdays = 160 hours, and 6 hrs × 26 PP = 156, OPM awards the extra 4 hours in the final pay period of the leave year (sometimes described as 10 hours in the last PP).

**Changes:**
- **`app/src/modules/leave/calendar-bridge.ts`**:
  - Change accrual calculation from simple multiplication to account for the 6 hrs/PP adjustment:
    ```typescript
    function annualAccrualTotal(ratePerPP: AccrualRate): number {
      if (ratePerPP === 6) return 160; // 25 PP × 6 + 1 PP × 10
      return ratePerPP * PAY_PERIODS_PER_YEAR;
    }
    const annualAccrued = annualAccrualTotal(yearData.accrualRatePerPP);
    ```

- **`app/src/modules/leave/annual-leave.ts`**:
  - Update `accrueAnnualLeave()` to account for this when computing a full year (26 PP):
    ```typescript
    export function accrueAnnualLeave(yearsOfService: number, payPeriodsWorked: number): number {
      const rate = annualLeaveAccrualRate(yearsOfService);
      if (rate === 6 && payPeriodsWorked === 26) return 160;
      return rate * payPeriodsWorked;
    }
    ```
  - Add doc comment referencing 5 U.S.C. 6303(a).

- **`app/tests/unit/leave/calendar-bridge.test.ts`** — Update the 6 hrs/PP accrual test:
  ```
  expect(summary.annualAccrued).toBe(160); // was 156
  ```

- **`docs/formula-registry.md`** — Update `leave/annual-accrual-rate` formula entry to note the 6 hrs/PP final PP adjustment.

---

## Section 2: Expense Tab Implementation

### 2.1 Debug and fix expense tab rendering

**Problem:** The Expenses tab shows nothing when clicked. The `ExpensesForm` component exists and is wired into `PlannerApp.tsx` (case `'expenses'`). Possible causes:
- Component render error caught by a boundary
- CSS/layout issue (content renders but is invisible)
- FormSection wrapper issue

**Investigation steps:**
1. Open browser dev tools, check console for errors when clicking the Expenses tab.
2. Inspect the DOM to see if `ExpensesForm` renders but is hidden.
3. Verify `FormShell` correctly passes `'expenses'` as `activeTabId`.

**Changes (depending on root cause):**
- Fix any rendering errors in `ExpensesForm`.
- Ensure `FormSection` wrapper renders children correctly for this tab.
- If issue is in `useFormSections.ts` — the tab `id` is `'expenses'` which matches the switch case in `FormContent`, so this should be fine.

### 2.2 Enhance expense form with simulation-ready features

**Problem:** Even once rendering is fixed, the expense form needs additional features to be useful for the simulation tab (Section 3).

**Changes:**
- **`app/src/components/forms/ExpensesForm.tsx`**:
  - Add a **total display** showing the sum of all category amounts, updated live.
  - Add a **pre-retirement vs post-retirement** toggle or section, since some expenses change at retirement.
  - Ensure the smile curve toggle is clearly explained with a brief description.
  - Add visual feedback: category rows should highlight when non-zero.

- **`app/src/models/expenses.ts`**:
  - Add optional `preRetirementAmount` field to `ExpenseCategory` for expenses that differ before/after retirement (e.g., commuting costs drop to zero).

- **`app/src/storage/zod-schemas.ts`** — Update `ExpenseProfileSchema` if model changes.

---

## Section 3: TSP Retirement Assumptions → Simulation Tab

### 3.0 Rename tab from "TSP" or "Assumptions" to "Simulation"

**Changes:**
- **`app/src/components/forms/useFormSections.ts`**:
  - Rename the appropriate tab label to `'Simulation'`.
  - May merge the current "TSP" and "Assumptions" tabs into a single "Simulation" tab, or repurpose one.

- **`app/src/components/PlannerApp.tsx`**:
  - Update `FormContent` switch to route `'simulation'` to the new `SimulationForm` component.
  - Remove or redirect old TSP/Assumptions routes.

### 3.1 Split TSP balance into high-risk and low-risk pots

**Problem:** Currently the simulation treats the entire TSP balance as a single pool with one growth rate. Real retirees often split their balance into a high-risk pot (e.g., C/S/I funds) and a low-risk pot (e.g., G/F funds) with different ROIs.

**Changes:**
- **`app/src/models/simulation.ts`** — Add to `RetirementAssumptions`:
  ```typescript
  tspHighRiskPct: Rate;           // % of total TSP in high-risk pot (default: 0.60)
  tspHighRiskGrowthRate: Rate;    // ROI for high-risk pot (e.g., 0.08 = 8%)
  tspLowRiskGrowthRate: Rate;     // ROI for low-risk pot (e.g., 0.03 = 3%)
  ```
  The existing `tspGrowthRate` can be kept as a fallback or removed.

- **`app/src/modules/tsp/future-value.ts`**:
  - Add `computeDualPotTSPProjection()` function that tracks two separate balances (high-risk and low-risk), each growing at their own rate.
  - The low-risk pot is the source for annual withdrawals (the "spending pot").
  - The high-risk pot grows and periodically rebalances into the low-risk pot.

- **New file: `app/src/components/forms/SimulationForm.tsx`** — The main simulation configuration form (see 3.3 below).

- **`app/src/storage/zod-schemas.ts`** — Add schema validation for the new fields.

### 3.2 RMD (Required Minimum Distribution) compliance

**Problem:** When the retiree reaches RMD age (currently 73 under SECURE 2.0 Act), the IRS requires minimum annual distributions from Traditional TSP. The simulation must ensure withdrawals from Traditional TSP are large enough to satisfy RMDs.

**Changes:**
- **New file: `app/src/modules/tsp/rmd.ts`** — RMD calculation module:
  - Implement IRS Uniform Lifetime Table (Table III) for ages 72–115+.
  - Function: `computeRMD(traditionalBalance: number, age: number): number` — returns the minimum required distribution for the year.
  - Function: `isRMDRequired(age: number): boolean` — returns true if age >= 73.
  - Source: IRC § 401(a)(9), IRS Publication 590-B, SECURE 2.0 Act § 107.
  - Classification: Hard regulatory requirement.

- **`app/src/modules/tsp/future-value.ts`** or new projection module:
  - In the year-by-year projection loop, when age >= 73:
    1. Compute RMD based on Traditional TSP balance and age.
    2. If the planned withdrawal is less than the RMD, increase the Traditional withdrawal to meet the RMD.
    3. The RMD comes exclusively from the Traditional pot; any additional spending can come from Roth.
  - Track Traditional and Roth balances separately through the projection.

- **`docs/formula-registry.md`** — Add `tsp/rmd` formula entry with IRS source references.
- **`docs/regulatory-mapping.md`** — Add RMD rules to the regulatory mapping table.
- **`app/tests/unit/tsp/rmd.test.ts`** — Test RMD calculations against IRS table values.

### 3.3 Full Simulation form and engine

**Problem:** The simulation tab needs to be a comprehensive year-by-year retirement projection, referencing `Retire-original.xlsx` "Retirement Assumptions" tab (columns A, B, C for a single user, ignoring "Jeni" columns).

#### 3.3.1 Simulation Form — User Inputs

**New file: `app/src/components/forms/SimulationForm.tsx`**

The form should have these sections, pulling defaults from FERS Estimate where available:

**A. Core Inputs (drawn from FERS Estimate tab):**
- Retirement age / date (from FERS Estimate `retirementDate`)
- FERS annuity (computed result from `useFERSEstimate`)
- FERS Supplement (computed result)
- Social Security benefit at 62

**B. TSP Configuration:**
- Total TSP balance at retirement (from FERS Estimate `tspFutureValue` result)
- Traditional / Roth split percentage (computed from FERS Estimate: if `currentTspBalance` and contribution events indicate the Traditional/Roth ratio, use that; otherwise user can enter manually)
- Roth and Traditional contribution rates (from FERS Estimate `biweeklyTspContribution` and Roth flag from TSP form)
- High-risk / Low-risk allocation percentage (user input, default 60/40)
- High-risk ROI (user input, default 8%)
- Low-risk ROI (user input, default 3%)
- Annual withdrawal rate (from FERS Estimate, default 4%)

**C. Expense Smile Curve Configuration:**
- GoGo age range and spending rate (early active retirement, e.g., retirement age to 72, multiplier 1.0)
- GoSlow age range and spending rate (slowing down, e.g., 72 to 82, multiplier 0.85)
- NoGo age range and spending rate (limited activity, e.g., 82+, multiplier 0.75)
- Base annual expenses (from Expenses tab total or user override)

**D. Low-Risk Buffer ("Time Step"):**
- Number of years of withdrawals to keep in the low-risk pot as a buffer.
- Options: 1, 2, or 3 years (radio/select, default 2).
- This means the low-risk balance target = `annualWithdrawal × timeStepYears`.
- At the end of each year, the low-risk balance represents the next N years of spending money. Excess from the high-risk pot rebalances into low-risk to maintain the buffer.

**E. Simulation Horizon:**
- End age (default: 95, max: 104)
- COLA rate (from Assumptions, default 2%)
- Inflation rate (from Expenses, default 2.5%)

#### 3.3.2 Simulation Engine Updates

**`app/src/modules/simulation/income-projection.ts`** — Major refactor or new function `projectRetirementSimulation()`:

Year-by-year projection logic:

```
For each year from retirement age to end age:
  1. Income:
     a. FERS annuity × COLA^year
     b. FERS Supplement (if age < 62)
     c. Social Security (if age >= 62, optional)

  2. TSP Withdrawals:
     a. Compute required spend = base expenses × smile curve multiplier × inflation
     b. Compute income gap = required spend - (annuity + supplement + SS)
     c. If age >= 73: compute RMD from Traditional balance
     d. Withdrawal from Traditional = max(income gap allocation, RMD)
     e. Remaining gap (if any) from Roth

  3. TSP Balance Updates:
     a. High-risk pot: grow by high-risk ROI
     b. Low-risk pot: grow by low-risk ROI, then subtract annual withdrawal
     c. Rebalance: transfer from high-risk to low-risk to maintain buffer (timeStep × annual withdrawal)
     d. Track Traditional and Roth balances separately through both pots

  4. End-of-year low-risk balance = the "spending fund"
     - This represents what's available for the next 1-3 years of draws
     - Display prominently in results

  5. Record: year, age, income breakdown, expense, TSP balances (high/low/trad/roth), surplus/deficit
```

#### 3.3.3 Data Model Updates

**`app/src/models/simulation.ts`** — Extend or create new interfaces:

```typescript
interface SimulationConfig {
  // Core
  retirementAge: number;
  endAge: number;           // default 95
  fersAnnuity: USD;
  fersSupplement: USD;
  ssMonthlyAt62: USD;

  // TSP
  tspBalanceAtRetirement: USD;
  traditionalPct: Rate;     // e.g., 0.70 = 70% Traditional
  highRiskPct: Rate;        // e.g., 0.60 = 60% high-risk
  highRiskROI: Rate;
  lowRiskROI: Rate;
  withdrawalRate: Rate;
  timeStepYears: 1 | 2 | 3; // buffer years in low-risk pot

  // Expenses
  baseAnnualExpenses: USD;
  goGoEndAge: number;       // e.g., 72
  goGoRate: Rate;           // spending multiplier, e.g., 1.0
  goSlowEndAge: number;     // e.g., 82
  goSlowRate: Rate;         // e.g., 0.85
  noGoRate: Rate;           // e.g., 0.75

  // Inflation / COLA
  colaRate: Rate;
  inflationRate: Rate;
}

interface SimulationYearResult {
  year: number;
  age: number;
  // Income
  annuity: USD;
  fersSupplement: USD;
  socialSecurity: USD;
  tspWithdrawal: USD;
  totalIncome: USD;
  // Expenses
  smileMultiplier: number;
  totalExpenses: USD;
  // TSP Balances
  highRiskBalance: USD;
  lowRiskBalance: USD;
  traditionalBalance: USD;
  rothBalance: USD;
  totalTSPBalance: USD;
  // RMD
  rmdRequired: USD;
  rmdSatisfied: boolean;
  // Net
  surplus: USD;
}
```

#### 3.3.4 Storage Updates

- **`app/src/storage/schema.ts`** — Add `SIMULATION_CONFIG` storage key.
- **`app/src/storage/zod-schemas.ts`** — Add Zod schema for `SimulationConfig`.
- **`app/src/storage/index.ts`** — Export new schema.

#### 3.3.5 Visualization

- **`app/src/components/forms/SimulationForm.tsx`** — Below the input fields, render a results table/chart:
  - Year-by-year table with columns for age, income sources, expenses, TSP balances, surplus.
  - Summary cards: depletion age, balance at 85, total lifetime income, etc.
  - Optional: chart showing TSP balance trajectory (high-risk vs low-risk).

#### 3.3.6 Tab Routing

- **`app/src/components/forms/useFormSections.ts`**:
  - Change: `{ id: 'simulation', label: 'Simulation', ... }` — replaces the old "Assumptions" tab or merges TSP + Assumptions.
  - Keep TSP tab for entering current balances/contributions (pre-retirement data).
  - The new Simulation tab is for post-retirement projections.

- **`app/src/components/PlannerApp.tsx`**:
  - Add `case 'simulation': return <SimulationForm />;`
  - Import `SimulationForm`.

---

## Implementation Order

1. **Section 1** (Leave Tracking) — All changes are independent, can be done in parallel:
   - 1.6 first (accrual fix is a calculation bug)
   - 1.1, 1.2, 1.3, 1.5 (UI tweaks)
   - 1.4 last (federal holidays is the largest single item)

2. **Section 2** (Expense Tab) — Debug rendering first, then enhance.

3. **Section 3** (Simulation) — Dependencies:
   - 3.0 (rename) + 3.1 (dual pot model) + 3.2 (RMD module) can be built in parallel
   - 3.3 (full simulation form + engine) depends on 3.1 and 3.2
   - 3.3.4 (storage) should be done before 3.3.1 (form)
   - 3.3.5 (visualization) is last

---

## Files Created or Modified

### New Files
| File | Purpose |
|------|---------|
| `app/src/data/federal-holidays.ts` | Federal holiday computation |
| `app/src/modules/tsp/rmd.ts` | RMD calculation per IRS tables |
| `app/src/components/forms/SimulationForm.tsx` | Simulation configuration + results UI |
| `app/tests/unit/leave/federal-holidays.test.ts` | Holiday tests |
| `app/tests/unit/tsp/rmd.test.ts` | RMD tests |

### Modified Files
| File | Changes |
|------|---------|
| `app/src/components/forms/leave-calendar/LeaveBalanceSummaryPanel.tsx` | Remove After Cap, add LS/DE, fix label wrapping |
| `app/src/components/forms/leave-calendar/DayCell.tsx` | Explicit text color, holiday prop |
| `app/src/components/forms/leave-calendar/MonthCalendar.tsx` | Holiday prop pass-through |
| `app/src/components/forms/leave-calendar/LeaveCalendarGrid.tsx` | Compute and pass holidays |
| `app/src/components/forms/LeaveBalanceForm.tsx` | Holiday legend entry |
| `app/src/modules/leave/calendar-bridge.ts` | LS/DE breakdown, fix 6hr/PP accrual |
| `app/src/modules/leave/annual-leave.ts` | Fix 6hr/PP full-year accrual |
| `app/src/components/forms/ExpensesForm.tsx` | Fix rendering, add total display |
| `app/src/models/expenses.ts` | Pre/post retirement expense toggle |
| `app/src/models/simulation.ts` | Add SimulationConfig, SimulationYearResult |
| `app/src/modules/simulation/income-projection.ts` | Dual-pot TSP, RMD, smile curve overhaul |
| `app/src/modules/tsp/future-value.ts` | Dual-pot projection function |
| `app/src/components/forms/useFormSections.ts` | Rename tab to Simulation |
| `app/src/components/PlannerApp.tsx` | Route Simulation tab |
| `app/src/storage/schema.ts` | SIMULATION_CONFIG key |
| `app/src/storage/zod-schemas.ts` | SimulationConfig schema |
| `app/src/storage/index.ts` | Export new schema |
| `app/tests/unit/leave/calendar-bridge.test.ts` | Update accrual test, add LS/DE tests |
| `docs/formula-registry.md` | Add RMD formula, update accrual formula |
| `docs/regulatory-mapping.md` | Add RMD regulatory reference |
