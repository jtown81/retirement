/**
 * Career Salary Projection
 * Formula: career/salary-history
 *
 * Builds a year-by-year salary history from a CareerProfile's events,
 * projecting automatic WGI step increases and pay scale adjustments.
 *
 * Used by:
 *   - simulation/high-3-salary (High-3 average computation)
 *   - Visualization layer (pay growth chart)
 *
 * Source: OPM FERS Handbook Ch. 50; 5 CFR § 531.405
 */

import type { CareerProfile, CareerEvent } from '../../models/career';
import type { GSGrade, GSStep, PaySystem, ISODate } from '../../models/common';
import { registerFormula } from '../../registry/index';
import { calculateAnnualPay } from './pay-calculator';
import { getNextWGIDate } from './grade-step';

registerFormula({
  id: 'career/salary-history',
  name: 'Career Salary History Builder',
  module: 'career',
  purpose: 'Generates a year-by-year salary record from career events, projecting automatic WGI step increases and annual pay scale adjustments.',
  sourceRef: 'OPM FERS Handbook Ch. 50; 5 CFR § 531.405; 5 U.S.C. § 5332',
  classification: 'hard-regulatory',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Phase 3 implementation' }],
});

export interface SalaryYear {
  year: number;
  annualSalary: number;
  grade: GSGrade;
  step: GSStep;
  localityCode: string;
  paySystem: PaySystem;
  /** True if salary was a user-entered Title 38 value (not computed from GS table) */
  isTitle38Override: boolean;
}

/**
 * Internal representation of an employee's state at a point in time.
 */
interface CareerState {
  grade: GSGrade;
  step: GSStep;
  localityCode: string;
  paySystem: PaySystem;
  /** Salary explicitly set by an event (used for Title 38 and as a reference for LEO) */
  eventSalary: number;
  /** Date the current step became effective (ISO) */
  stepEffectiveDate: ISODate;
  active: boolean;  // false during separations
}

/**
 * Applies all career events that occurred on or before a given date,
 * returning the employee state at that point.
 *
 * Events are applied in chronological order. The state at `asOf` reflects
 * all explicit events; WGI step increases are applied separately.
 */
function stateAtDate(
  events: CareerEvent[],
  asOf: Date,
): CareerState | null {
  const sorted = [...events].sort(
    (a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime(),
  );

  const states: CareerState[] = [];

  for (const event of sorted) {
    if (new Date(event.effectiveDate) > asOf) break;
    const prev = states[states.length - 1] ?? null;

    if (event.type === 'hire' || event.type === 'rehire') {
      states.push({
        grade: event.grade,
        step: event.step,
        localityCode: event.localityCode,
        paySystem: event.paySystem,
        eventSalary: event.annualSalary,
        stepEffectiveDate: event.effectiveDate,
        active: true,
      });
    } else if (event.type === 'separation' && prev !== null) {
      states.push({ grade: prev.grade, step: prev.step, localityCode: prev.localityCode, paySystem: prev.paySystem, eventSalary: prev.eventSalary, stepEffectiveDate: prev.stepEffectiveDate, active: false });
    } else if (prev !== null) {
      // promotion, step-increase, locality-change
      const updatesStep = event.type === 'promotion' || event.type === 'step-increase';
      states.push({
        grade: event.grade,
        step: event.step,
        localityCode: event.localityCode,
        paySystem: event.paySystem,
        eventSalary: event.annualSalary,
        stepEffectiveDate: updatesStep ? event.effectiveDate : prev.stepEffectiveDate,
        active: prev.active,
      });
    }
  }

  return states[states.length - 1] ?? null;
}

/**
 * Projects the WGI step at the end of a given year, given the state
 * at the start of that year and all explicit events within the year.
 *
 * Returns the state with any automatic WGI step increases applied.
 */
function applyWGIs(
  state: CareerState,
  yearStart: Date,
  yearEnd: Date,
): CareerState {
  let current = { ...state };

  // Keep advancing if a WGI fires before yearEnd
  while (current.active && current.step < 10) {
    const nextWGI = getNextWGIDate(current.step, current.stepEffectiveDate);
    if (!nextWGI) break;

    const wgiDate = new Date(nextWGI);
    if (wgiDate > yearEnd) break;
    if (wgiDate < yearStart) {
      // WGI already fired before this year — state should already reflect it
      // (advance stepEffectiveDate to keep from looping infinitely)
      current = {
        ...current,
        step: Math.min(current.step + 1, 10) as GSStep,
        stepEffectiveDate: nextWGI,
      };
      continue;
    }

    // WGI fires within [yearStart, yearEnd]
    current = {
      ...current,
      step: Math.min(current.step + 1, 10) as GSStep,
      stepEffectiveDate: nextWGI,
    };
  }

  return current;
}

/**
 * Builds a year-by-year salary history for the given career profile.
 *
 * For each year from the hire year through `throughYear`, resolves the
 * employee's grade, step, locality, and pay system at year-end, then
 * computes total annual pay (including any WGI step advances that year).
 *
 * Years before hire or during separations are omitted.
 *
 * @param profile               The employee's career profile
 * @param throughYear           Last year to include (inclusive)
 * @param assumedPayIncrease    Annual GS pay scale increase for projected years (default 2%)
 */
export function buildSalaryHistory(
  profile: CareerProfile,
  throughYear: number,
  assumedPayIncrease = 0.02,
): SalaryYear[] {
  if (profile.events.length === 0) return [];

  const sorted = [...profile.events].sort(
    (a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime(),
  );

  const hireYear = new Date(sorted[0].effectiveDate).getFullYear();
  const results: SalaryYear[] = [];

  for (let year = hireYear; year <= throughYear; year++) {
    const yearEnd = new Date(year, 11, 31);  // Dec 31

    // Get state from explicit events up to year-end
    const explicit = stateAtDate(sorted, yearEnd);
    if (!explicit || !explicit.active) continue;

    // Apply any WGIs that fired during this year
    const yearStart = new Date(year, 0, 1);
    const state = applyWGIs(explicit, yearStart, yearEnd);

    // Compute pay using the resolved state at year-end
    const isTitle38 = state.paySystem === 'Title38';
    const pay = calculateAnnualPay(
      state.grade,
      state.step,
      state.localityCode,
      year,
      state.paySystem,
      isTitle38 ? state.eventSalary : undefined,
      assumedPayIncrease,
    );

    results.push({
      year,
      annualSalary: pay.totalAnnualPay,
      grade: state.grade,
      step: state.step,
      localityCode: state.localityCode,
      paySystem: state.paySystem,
      isTitle38Override: isTitle38,
    });
  }

  return results;
}

/**
 * Computes the High-3 average salary from a salary history.
 *
 * The High-3 is the average of the 3 consecutive highest-earning years.
 * Per OPM, this is the highest 36-month period, not necessarily the last 3 years.
 *
 * Formula ID: simulation/high-3-salary
 * Source: OPM FERS Handbook, Ch. 50, § 50A1.1-2
 *
 * @param salaryHistory  Output of buildSalaryHistory()
 */
export function computeHigh3Salary(salaryHistory: SalaryYear[]): number {
  if (salaryHistory.length < 3) {
    // Fewer than 3 years: average all available
    if (salaryHistory.length === 0) return 0;
    const sum = salaryHistory.reduce((acc, y) => acc + y.annualSalary, 0);
    return Math.round(sum / salaryHistory.length);
  }

  let maxAverage = 0;
  for (let i = 0; i <= salaryHistory.length - 3; i++) {
    const avg =
      (salaryHistory[i].annualSalary +
        salaryHistory[i + 1].annualSalary +
        salaryHistory[i + 2].annualSalary) /
      3;
    if (avg > maxAverage) maxAverage = avg;
  }

  return Math.round(maxAverage);
}
