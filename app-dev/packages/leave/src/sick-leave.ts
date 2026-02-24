/**
 * Sick Leave
 * Formulas: leave/sick-accrual, leave/sick-leave-service-credit
 *
 * Accrues at 4 hrs/pay period for all employees.
 * No rollover cap — unused sick leave carries over indefinitely.
 * Family care usage sub-limit: 104 hrs/year (13 days) from sick leave balance.
 *
 * Post-2014 FERS: 100% of unused sick leave credited toward service at retirement.
 * Conversion: 2,087 hrs = 1 work year (federal standard).
 *
 * Source: OPM FERS Handbook, Ch. 50, § 50A2.1-1; 5 U.S.C. § 6307
 */

/** Federal standard: hours in one work year (used for leave-to-service conversion). */
export const HOURS_PER_WORK_YEAR = 2087;

/** Maximum sick leave hours usable for family care per leave year. */
export const FAMILY_CARE_ANNUAL_LIMIT_HOURS = 104;

/**
 * Accrues sick leave for a given number of biweekly pay periods.
 * Rate is fixed at 4 hrs/pp for all employees regardless of service length.
 *
 * Formula ID: leave/sick-accrual
 *
 * @param payPeriodsWorked - Number of full biweekly pay periods worked
 * @returns Total sick leave hours accrued
 */
export function accrueSickLeave(payPeriodsWorked: number): number {
  if (payPeriodsWorked < 0) throw new RangeError('payPeriodsWorked must be >= 0');
  return 4 * payPeriodsWorked;
}

/**
 * Applies a sick leave usage event (general sick or family care).
 *
 * @param balance - Current sick leave balance in hours
 * @param hoursUsed - Hours to deduct (supports fractional hours)
 * @param familyCareUsedYTD - Hours of sick leave already used for family care this year
 * @param type - 'sick' or 'family-care'
 * @returns Object with updated balance and updated familyCareUsedYTD
 */
export function useSickLeave(
  balance: number,
  hoursUsed: number,
  familyCareUsedYTD: number,
  type: 'sick' | 'family-care',
): { balance: number; familyCareUsedYTD: number } {
  if (hoursUsed < 0) throw new RangeError('hoursUsed must be >= 0');

  if (type === 'family-care') {
    const newFamilyCareYTD = familyCareUsedYTD + hoursUsed;
    if (newFamilyCareYTD > FAMILY_CARE_ANNUAL_LIMIT_HOURS) {
      throw new RangeError(
        `Family care usage would exceed annual limit of ${FAMILY_CARE_ANNUAL_LIMIT_HOURS} hrs. ` +
        `Already used: ${familyCareUsedYTD}, requested: ${hoursUsed}`,
      );
    }
    const newBalance = balance - hoursUsed;
    if (newBalance < 0) {
      throw new RangeError(`Insufficient sick leave: balance=${balance}, requested=${hoursUsed}`);
    }
    return { balance: newBalance, familyCareUsedYTD: newFamilyCareYTD };
  }

  const newBalance = balance - hoursUsed;
  if (newBalance < 0) {
    throw new RangeError(`Insufficient sick leave: balance=${balance}, requested=${hoursUsed}`);
  }
  return { balance: newBalance, familyCareUsedYTD };
}

/**
 * Converts unused sick leave hours to additional creditable service years.
 *
 * Post-2014 FERS rule: 100% of unused sick leave is credited.
 * Conversion: 2,087 hrs = 1 year of creditable service.
 * Result is fractional (e.g., 1043.5 hrs → ~0.5 years).
 *
 * Formula ID: leave/sick-leave-service-credit
 *
 * @param sickLeaveHours - Unused sick leave hours at retirement
 * @returns Additional creditable service years (fractional)
 */
export function sickLeaveToServiceCredit(sickLeaveHours: number): number {
  if (sickLeaveHours < 0) throw new RangeError('sickLeaveHours must be >= 0');
  return sickLeaveHours / HOURS_PER_WORK_YEAR;
}
