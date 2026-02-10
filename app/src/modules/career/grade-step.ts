/**
 * Grade/Step Salary Lookup and WGI Timing
 *
 * Formulas: career/grade-step-to-salary, career/wgi-timing
 *
 * Sources:
 *   - OPM GS Pay Schedule (base salary lookup)
 *   - 5 CFR Part 531, Subpart D (within-grade increase timing)
 */

import { registerFormula } from '../../registry/index';
import { getGSBasePay } from '../../data/gs-pay-tables';
import { toISODate } from '../../utils/date';

// ---------------------------------------------------------------------------
// Formula registry entries
// ---------------------------------------------------------------------------

registerFormula({
  id: 'career/grade-step-to-salary',
  name: 'GS Grade/Step Base Salary Lookup',
  module: 'career',
  purpose: 'Returns the annual GS base pay for a given grade, step, and pay year before locality adjustment.',
  sourceRef: 'OPM GS Pay Schedule; 5 U.S.C. § 5332',
  classification: 'hard-regulatory',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Phase 3 implementation' }],
});

registerFormula({
  id: 'career/wgi-timing',
  name: 'Within-Grade Increase (WGI) Timing',
  module: 'career',
  purpose: 'Returns the date on which the next step increase is due, based on current step and the date the current step was attained.',
  sourceRef: '5 CFR § 531.405(b)',
  classification: 'hard-regulatory',
  version: '1.0.0',
  changelog: [{ date: '2026-02-10', author: 'system', description: 'Phase 3 implementation' }],
});

// ---------------------------------------------------------------------------
// WGI waiting periods
// ---------------------------------------------------------------------------

/**
 * Calendar-week waiting periods for each within-grade step increase.
 * Index 0 = weeks to advance from step 1 to step 2, etc.
 * Source: 5 CFR § 531.405(b)
 *
 * Steps 1–3:  52 weeks (1 year)
 * Steps 4–6: 104 weeks (2 years)
 * Steps 7–9: 156 weeks (3 years)
 * Step 10:   no further WGI
 */
export const WGI_WEEKS: readonly number[] = [
  52,   // step 1 → 2
  52,   // step 2 → 3
  52,   // step 3 → 4
  104,  // step 4 → 5
  104,  // step 5 → 6
  104,  // step 6 → 7
  156,  // step 7 → 8
  156,  // step 8 → 9
  156,  // step 9 → 10
  // step 10: terminal
];

// ---------------------------------------------------------------------------
// Implementations
// ---------------------------------------------------------------------------

/**
 * Returns the annual GS base salary for a given grade, step, and pay year.
 * Does NOT include locality pay — call applyLocality() separately.
 *
 * @param grade            GS grade (1–15)
 * @param step             GS step (1–10)
 * @param payYear          Calendar year
 * @param assumedIncrease  Annual pay scale assumption for projected years (default 2%)
 */
export function gradeStepToSalary(
  grade: number,
  step: number,
  payYear: number,
  assumedIncrease = 0.02,
): number {
  return getGSBasePay(grade, step, payYear, assumedIncrease);
}

/**
 * Returns the date on which the next within-grade step increase is due.
 * Returns null if the employee is already at step 10 (no further WGI).
 *
 * The waiting period begins on the effective date of the current step.
 * Only full calendar weeks count; non-pay-status time may toll the period
 * (handled in the validation layer, not here).
 *
 * @param currentStep     Current GS step (1–10)
 * @param stepStartDate   Date the current step became effective
 */
export function getStepIncreaseDate(currentStep: number, stepStartDate: Date): Date | null {
  if (currentStep < 1 || currentStep > 10) {
    throw new RangeError(`Invalid GS step: ${currentStep}. Must be 1–10.`);
  }
  if (currentStep === 10) return null;  // terminal step

  const weeksToWait = WGI_WEEKS[currentStep - 1];
  const ms = weeksToWait * 7 * 24 * 60 * 60 * 1000;
  return new Date(stepStartDate.getTime() + ms);
}

/**
 * Returns the ISO date string of the next WGI, or null if at step 10.
 * Convenience wrapper around getStepIncreaseDate for callers using ISO dates.
 */
export function getNextWGIDate(currentStep: number, stepStartDate: string): string | null {
  const date = getStepIncreaseDate(currentStep, new Date(stepStartDate));
  return date ? toISODate(date) : null;
}
