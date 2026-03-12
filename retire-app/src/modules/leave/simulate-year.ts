/**
 * Leave Year Simulation
 * Formula: leave/simulate-year
 *
 * Simulates a single leave year for one employee:
 * - Accrues annual and sick leave each pay period
 * - Applies partial leave usage events in chronological order
 * - Enforces the annual rollover cap at year-end
 * - Resets family-care YTD counter at year-end
 *
 * Supports fractional hours (e.g., 0.25-hour increments).
 * Source: 5 U.S.C. § 6303–6307; OPM FERS Handbook, Ch. 50
 */

import { accrueAnnualLeave, applyRolloverCap, useAnnualLeave } from './annual-leave';
import { accrueSickLeave, useSickLeave } from './sick-leave';
import type { LeaveEvent } from '../../models/leave';

export interface LeaveYearInput {
  /** Creditable service years at the start of the year (for accrual tier) */
  yearsOfService: number;
  /** Annual leave balance carried in from prior year (post-cap) */
  annualLeaveCarryIn: number;
  /** Sick leave balance carried in from prior year (no cap) */
  sickLeaveCarryIn: number;
  /** Number of full biweekly pay periods worked this year (max 26) */
  payPeriodsWorked: number;
  /** Ordered list of leave usage events during the year */
  usageEvents: LeaveEvent[];
  /** Rollover cap; defaults to 240 (CONUS GS). Pass 360 for overseas. */
  rolloverCap?: number;
}

export interface LeaveYearResult {
  /** Annual leave balance after year-end rollover cap is applied */
  annualLeaveEndOfYear: number;
  /** Sick leave balance at year end (no cap) */
  sickLeaveEndOfYear: number;
  /** Total annual leave accrued this year */
  annualLeaveAccrued: number;
  /** Total sick leave accrued this year */
  sickLeaveAccrued: number;
  /** Total annual leave used this year */
  annualLeaveUsed: number;
  /** Total sick leave used this year (includes family care) */
  sickLeaveUsed: number;
  /** Annual leave hours forfeited at rollover (above cap) */
  annualLeaveForfeit: number;
}

/**
 * Simulates a full leave year: accruals, usage events, rollover.
 *
 * Formula ID: leave/simulate-year
 *
 * Processing order:
 * 1. Accrue annual + sick leave for all pay periods worked.
 * 2. Apply usage events in chronological order (they are pre-sorted by caller).
 * 3. Enforce annual rollover cap on annual leave.
 *
 * NOTE: Pay period accruals are applied as a lump sum at the start before events
 * are processed. This is a simplification for projection purposes; for exact
 * in-year tracking, use per-pay-period accrual with interleaved events.
 *
 * @param input - Leave year parameters
 * @returns Summary of balances and activity for the year
 */
export function simulateLeaveYear(input: LeaveYearInput): LeaveYearResult {
  const {
    yearsOfService,
    annualLeaveCarryIn,
    sickLeaveCarryIn,
    payPeriodsWorked,
    usageEvents,
    rolloverCap = 240,
  } = input;

  if (payPeriodsWorked < 0 || payPeriodsWorked > 26) {
    throw new RangeError(`payPeriodsWorked must be 0–26, got ${payPeriodsWorked}`);
  }

  // Step 1: Accrue
  const annualLeaveAccrued = accrueAnnualLeave(yearsOfService, payPeriodsWorked);
  const sickLeaveAccrued = accrueSickLeave(payPeriodsWorked);

  let annualBalance = annualLeaveCarryIn + annualLeaveAccrued;
  let sickBalance = sickLeaveCarryIn + sickLeaveAccrued;
  let familyCareUsedYTD = 0;
  let annualLeaveUsed = 0;
  let sickLeaveUsed = 0;

  // Step 2: Apply usage events
  for (const event of usageEvents) {
    if (event.type === 'annual') {
      annualBalance = useAnnualLeave(annualBalance, event.hoursUsed);
      annualLeaveUsed += event.hoursUsed;
    } else {
      const result = useSickLeave(sickBalance, event.hoursUsed, familyCareUsedYTD, event.type);
      sickBalance = result.balance;
      familyCareUsedYTD = result.familyCareUsedYTD;
      sickLeaveUsed += event.hoursUsed;
    }
  }

  // Step 3: Apply rollover cap to annual leave
  const annualLeaveEndOfYear = applyRolloverCap(annualBalance, rolloverCap);
  const annualLeaveForfeit = Math.max(0, annualBalance - annualLeaveEndOfYear);

  return {
    annualLeaveEndOfYear,
    sickLeaveEndOfYear: sickBalance,
    annualLeaveAccrued,
    sickLeaveAccrued,
    annualLeaveUsed,
    sickLeaveUsed,
    annualLeaveForfeit,
  };
}
