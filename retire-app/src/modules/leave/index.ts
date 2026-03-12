/**
 * Leave Planning & Tracking Module
 *
 * Standalone tool — can be used independently of the simulation engine.
 *
 * Responsible for:
 * - Annual leave accrual and rollover (cap: 240 hrs general schedule)
 * - Sick leave tracking (sick + family care)
 * - Partial leave usage (e.g., 0.25 hrs)
 * - Year-to-year rollover logic
 * - Retirement service credit integration (post-2014: 100% sick leave credit)
 *
 * All formulas referenced in: docs/formula-registry.md
 */

export type { LeaveBalance, LeaveEvent } from '../../models/leave';
export type { LeaveYearInput, LeaveYearResult } from './simulate-year';

export { annualLeaveAccrualRate, accrueAnnualLeave, fullYearAnnualLeave, applyRolloverCap, useAnnualLeave } from './annual-leave';
export {
  HOURS_PER_WORK_YEAR,
  FAMILY_CARE_ANNUAL_LIMIT_HOURS,
  accrueSickLeave,
  useSickLeave,
  sickLeaveToServiceCredit,
} from './sick-leave';
export { computeLeaveRetirementCredit } from './retirement-credit';
export { simulateLeaveYear } from './simulate-year';

// Calendar utilities & bridge
export {
  isWeekend,
  weekdaysInRange,
  weekdaysInMonth,
  weekdaysInYear,
  formatDate,
  parseDate,
} from './calendar-utils';
export type { CalendarYearSummary } from './calendar-bridge';
export {
  computeCalendarYearSummary,
  calendarEntriesToLeaveEvents,
  calendarToLeaveBalance,
} from './calendar-bridge';
