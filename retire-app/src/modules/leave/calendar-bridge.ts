/**
 * Calendar Bridge
 *
 * Converts leave calendar data into shapes compatible with the simulation engine.
 * Reuses existing accrual/rollover functions — does not reimplement them.
 *
 * Source formulas: leave/annual-accrual-rate, leave/sick-accrual, leave/rollover-cap
 */

import type { CalendarLeaveEntry, LeaveCalendarYear } from '../../models/leave-calendar';
import type { LeaveBalance, LeaveEvent } from '../../models/leave';
import { accrueAnnualLeave, fullYearAnnualLeave } from './annual-leave';
import { accrueSickLeave } from './sick-leave';
import { applyRolloverCap } from './annual-leave';
import { formatDate } from './calendar-utils';

/** Pay periods per federal leave year. */
const PAY_PERIODS_PER_YEAR = 26;

export interface CalendarYearSummary {
  /** Hours carried over from prior year */
  annualCarryOver: number;
  sickCarryOver: number;
  /** Hours accrued during the year (based on accrual rate) */
  annualAccrued: number;
  sickAccrued: number;
  /** Hours used — planned */
  plannedAnnualUsed: number;
  plannedSickUsed: number;
  /** Hours used — actual */
  actualAnnualUsed: number;
  actualSickUsed: number;
  /** Sick leave broken down by code */
  plannedSickLS: number;
  plannedSickDE: number;
  actualSickLS: number;
  actualSickDE: number;
  /** Total used (planned + actual) */
  totalAnnualUsed: number;
  totalSickUsed: number;
  /** Projected end-of-year balance (before rollover cap) */
  projectedAnnualEOY: number;
  projectedSickEOY: number;
  /** Projected annual leave after rollover cap */
  projectedAnnualAfterCap: number;
  /** Use-or-lose hours (annual leave above 240 hr cap) */
  useOrLoseHours: number;
}

/**
 * Computes a full year summary from calendar data.
 * Uses the existing accrual functions to determine how many hours
 * will be earned across 26 pay periods.
 */
export function computeCalendarYearSummary(
  yearData: LeaveCalendarYear,
  rolloverCap = 240,
): CalendarYearSummary {
  // Accruals for full year — uses fullYearAnnualLeave to account for the
  // 6 hrs/pp tier's final pay period adjustment (160 hrs, not 156).
  const annualAccrued = fullYearAnnualLeave(yearData.accrualRatePerPP);
  const sickAccrued = accrueSickLeave(PAY_PERIODS_PER_YEAR);

  // Tally usage by type and sick leave code
  let plannedAnnualUsed = 0;
  let plannedSickUsed = 0;
  let actualAnnualUsed = 0;
  let actualSickUsed = 0;
  let plannedSickLS = 0;
  let plannedSickDE = 0;
  let actualSickLS = 0;
  let actualSickDE = 0;

  for (const entry of yearData.entries) {
    switch (entry.leaveType) {
      case 'planned-annual':
        plannedAnnualUsed += entry.hours;
        break;
      case 'planned-sick':
        plannedSickUsed += entry.hours;
        if (entry.sickCode === 'DE') {
          plannedSickDE += entry.hours;
        } else {
          plannedSickLS += entry.hours; // default to LS
        }
        break;
      case 'actual-annual':
        actualAnnualUsed += entry.hours;
        break;
      case 'actual-sick':
        actualSickUsed += entry.hours;
        if (entry.sickCode === 'DE') {
          actualSickDE += entry.hours;
        } else {
          actualSickLS += entry.hours; // default to LS
        }
        break;
    }
  }

  const totalAnnualUsed = plannedAnnualUsed + actualAnnualUsed;
  const totalSickUsed = plannedSickUsed + actualSickUsed;

  const projectedAnnualEOY =
    yearData.carryOver.annualLeaveHours + annualAccrued - totalAnnualUsed;
  const projectedSickEOY =
    yearData.carryOver.sickLeaveHours + sickAccrued - totalSickUsed;

  const projectedAnnualAfterCap = applyRolloverCap(
    Math.max(0, projectedAnnualEOY),
    rolloverCap,
  );
  const useOrLoseHours = Math.max(0, projectedAnnualEOY - rolloverCap);

  return {
    annualCarryOver: yearData.carryOver.annualLeaveHours,
    sickCarryOver: yearData.carryOver.sickLeaveHours,
    annualAccrued,
    sickAccrued,
    plannedAnnualUsed,
    plannedSickUsed,
    actualAnnualUsed,
    actualSickUsed,
    plannedSickLS,
    plannedSickDE,
    actualSickLS,
    actualSickDE,
    totalAnnualUsed,
    totalSickUsed,
    projectedAnnualEOY,
    projectedSickEOY,
    projectedAnnualAfterCap,
    useOrLoseHours,
  };
}

/**
 * Converts calendar entries into LeaveEvent[] compatible with simulateLeaveYear().
 * Maps planned + actual annual → 'annual', planned + actual sick → 'sick'.
 * Sorted by date ascending.
 */
export function calendarEntriesToLeaveEvents(entries: CalendarLeaveEntry[]): LeaveEvent[] {
  return entries
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      type: entry.leaveType.includes('annual') ? ('annual' as const) : ('sick' as const),
      hoursUsed: entry.hours,
      notes: entry.notes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Derives a LeaveBalance snapshot from calendar year data at a given point.
 * Used to keep the LEAVE_BALANCE storage key populated for simulation compatibility.
 */
export function calendarToLeaveBalance(
  yearData: LeaveCalendarYear,
  asOfDate?: string,
): LeaveBalance {
  const summary = computeCalendarYearSummary(yearData);
  const asOf = asOfDate ?? formatDate(new Date());

  return {
    asOf,
    annualLeaveHours: Math.max(0, summary.projectedAnnualEOY),
    sickLeaveHours: Math.max(0, summary.projectedSickEOY),
    familyCareUsedCurrentYear: 0,
  };
}
