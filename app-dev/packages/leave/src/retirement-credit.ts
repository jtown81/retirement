/**
 * Leave Retirement Credit
 * Formula: leave/retirement-credit
 *
 * Adds sick leave service credit to the employee's total creditable service.
 * The result feeds into the FERS basic annuity computation.
 *
 * Source: OPM FERS Handbook, Ch. 50; 5 U.S.C. § 8415
 */

import { sickLeaveToServiceCredit } from './sick-leave';

/**
 * Computes total creditable service years including sick leave credit.
 *
 * Formula ID: leave/retirement-credit
 *
 * @param sickLeaveHours - Unused sick leave hours at retirement
 * @param currentServiceYears - Already-computed creditable service years (career + military buyback)
 * @returns Total creditable service years (fractional)
 */
export function computeLeaveRetirementCredit(
  sickLeaveHours: number,
  currentServiceYears: number,
): number {
  if (currentServiceYears < 0) throw new RangeError('currentServiceYears must be >= 0');
  const sickLeaveCredit = sickLeaveToServiceCredit(sickLeaveHours);
  return currentServiceYears + sickLeaveCredit;
}
