/**
 * Annual Leave
 * Formulas: leave/annual-accrual-rate, leave/rollover-cap
 *
 * Accrual tiers (biweekly pay periods):
 *   < 3 years service  → 4 hrs/pp  (4 days/month)
 *   3–15 years service → 6 hrs/pp  (6 days/month)
 *   15+ years service  → 8 hrs/pp  (8 days/month)
 *
 * Rollover cap: 240 hrs for general schedule (overseas: 360 hrs).
 * Unused hours above cap are forfeited at the end of the leave year.
 *
 * Source: 5 U.S.C. § 6303–6304; OPM Leave Administration
 */

/**
 * Returns the biweekly annual leave accrual rate for a given years-of-service.
 *
 * Formula ID: leave/annual-accrual-rate
 *
 * @param yearsOfService - Creditable service years (may include fractional years)
 * @returns Hours accrued per pay period: 4 | 6 | 8
 */
export function annualLeaveAccrualRate(yearsOfService: number): 4 | 6 | 8 {
  if (yearsOfService < 3) return 4;
  if (yearsOfService < 15) return 6;
  return 8;
}

/**
 * Accrues annual leave for a given number of pay periods at the correct rate.
 *
 * Formula ID: leave/annual-accrual-rate (application)
 *
 * @param yearsOfService - Creditable service years at start of accrual period
 * @param payPeriodsWorked - Number of full biweekly pay periods worked
 * @returns Total hours accrued
 */
export function accrueAnnualLeave(
  yearsOfService: number,
  payPeriodsWorked: number,
): number {
  if (payPeriodsWorked < 0) throw new RangeError('payPeriodsWorked must be >= 0');
  const rate = annualLeaveAccrualRate(yearsOfService);
  return rate * payPeriodsWorked;
}

/**
 * Enforces the rollover cap on an annual leave balance.
 * Excess hours above the cap are forfeited at leave year end.
 *
 * Formula ID: leave/rollover-cap
 *
 * @param balance - Current leave balance in hours
 * @param cap - Maximum carryover hours (default: 240 for CONUS GS; 360 overseas)
 * @returns Capped balance
 */
export function applyRolloverCap(balance: number, cap = 240): number {
  if (cap < 0) throw new RangeError('cap must be >= 0');
  return Math.min(balance, cap);
}

/**
 * Applies a leave usage event, preventing the balance from going below zero.
 *
 * @param balance - Current annual leave balance in hours
 * @param hoursUsed - Hours to deduct (supports fractional hours)
 * @returns Updated balance
 */
export function useAnnualLeave(balance: number, hoursUsed: number): number {
  if (hoursUsed < 0) throw new RangeError('hoursUsed must be >= 0');
  const result = balance - hoursUsed;
  if (result < 0) throw new RangeError(`Insufficient annual leave: balance=${balance}, requested=${hoursUsed}`);
  return result;
}
