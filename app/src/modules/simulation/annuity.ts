/**
 * FERS Annuity Calculation
 * Formulas: simulation/fers-basic-annuity, simulation/high-3-salary, simulation/fers-supplement
 *
 * FERS Basic Annuity:
 *   annuity = high3Salary × creditableService × multiplier
 *   multiplier = 1.1% if (age >= 62 AND service >= 20), else 1.0%
 *
 * FERS Supplement (Special Retirement Supplement / SRS):
 *   Paid from retirement until age 62 (when Social Security eligibility begins).
 *   Approximates the SS benefit earned during federal service.
 *   Formula: estimatedSSAt62 × (federalServiceYears / 40)
 *   Note: Subject to Social Security earnings test if employee has earned income.
 *
 * Source: OPM FERS Handbook, Ch. 50, § 50B2; 5 U.S.C. § 8421
 */

import { computeHigh3Salary } from '../career/projection';
import { mra10ReductionFactor } from './eligibility';

export interface FERSAnnuityResult {
  /** High-3 average salary used in computation */
  high3Salary: number;
  /** Total creditable service years (including sick leave and military buyback) */
  creditableServiceYears: number;
  /** Multiplier applied: 0.01 (standard) or 0.011 (enhanced) */
  multiplier: 0.01 | 0.011;
  /** Annual FERS basic annuity before any reduction */
  grossAnnualAnnuity: number;
  /** MRA+10 reduction factor (1.0 if not applicable) */
  reductionFactor: number;
  /** Net annual annuity after MRA+10 reduction (if applicable) */
  netAnnualAnnuity: number;
}

export interface FERSSupplementResult {
  /** Whether the employee is eligible for the FERS Supplement */
  eligible: boolean;
  /** Annual supplement amount (0 if not eligible) */
  annualAmount: number;
}

/**
 * Computes the High-3 average salary.
 * Delegates to the career module's computeHigh3Salary.
 *
 * Formula ID: simulation/high-3-salary
 *
 * @param salaryHistory - Array of annual salary records
 * @returns Highest 36-month average basic pay
 */
/** Minimal salary record accepted by computeHigh3. */
export interface SalaryRecord {
  year: number;
  annualSalary: number;
  [key: string]: unknown;
}

export function computeHigh3(salaryHistory: SalaryRecord[]): number {
  // computeHigh3Salary only reads year and annualSalary — the cast is safe
  return computeHigh3Salary(salaryHistory as unknown as Parameters<typeof computeHigh3Salary>[0]);
}

/**
 * Computes the FERS basic annuity.
 *
 * Formula ID: simulation/fers-basic-annuity
 *
 * Multiplier rules:
 *   1.1% — age >= 62 AND creditableService >= 20 years
 *   1.0% — all other cases
 *
 * MRA+10 reduction: 5% per full year the employee is under 62 at retirement.
 * Applied only if eligibilityType is 'MRA+10-reduced'.
 *
 * @param high3Salary - High-3 average salary
 * @param creditableServiceYears - Total creditable service (including sick leave + military)
 * @param ageAtRetirement - Employee's age at retirement (decimal)
 * @param eligibilityType - The eligibility basis (for MRA+10 reduction)
 * @returns Detailed annuity result
 */
export function computeFERSAnnuity(
  high3Salary: number,
  creditableServiceYears: number,
  ageAtRetirement: number,
  eligibilityType?: string | null,
): FERSAnnuityResult {
  if (high3Salary < 0) throw new RangeError('high3Salary must be >= 0');
  if (creditableServiceYears < 0) throw new RangeError('creditableServiceYears must be >= 0');
  if (ageAtRetirement < 0) throw new RangeError('ageAtRetirement must be >= 0');

  const multiplier: 0.01 | 0.011 =
    ageAtRetirement >= 62 && creditableServiceYears >= 20 ? 0.011 : 0.01;

  const gross = high3Salary * creditableServiceYears * multiplier;

  const reductionFactor =
    eligibilityType === 'MRA+10-reduced' ? mra10ReductionFactor(ageAtRetirement) : 1.0;

  return {
    high3Salary,
    creditableServiceYears,
    multiplier,
    grossAnnualAnnuity: gross,
    reductionFactor,
    netAnnualAnnuity: gross * reductionFactor,
  };
}

/**
 * Determines FERS Supplement (SRS) eligibility and amount.
 *
 * Formula ID: simulation/fers-supplement
 *
 * Eligibility: employee retires before age 62 under an immediate, unreduced annuity
 * (MRA+30 or Age60+20). NOT available for MRA+10-reduced retirements.
 *
 * Amount: estimated Social Security benefit at age 62 × (federalServiceYears / 40)
 *
 * ASSUMPTION: The estimatedSSAt62 is user-provided or estimated by the app.
 * If not provided, a rough estimate of high3Salary × 0.30 × (federalYears/40) is used.
 * Users should verify against their actual Social Security statement.
 *
 * @param ageAtRetirement - Employee's age at retirement (decimal)
 * @param eligibilityType - The retirement eligibility basis
 * @param federalServiceYears - Civilian federal service years (not including military)
 * @param estimatedSSAt62 - Estimated monthly Social Security benefit at age 62
 * @returns Supplement eligibility and annual amount
 */
export function computeFERSSupplement(
  ageAtRetirement: number,
  eligibilityType: string | null,
  federalServiceYears: number,
  estimatedSSAt62: number,
): FERSSupplementResult {
  if (federalServiceYears < 0) throw new RangeError('federalServiceYears must be >= 0');
  if (estimatedSSAt62 < 0) throw new RangeError('estimatedSSAt62 must be >= 0');

  // Only available for immediate unreduced annuity before age 62
  const eligibleTypes = new Set(['MRA+30', 'Age60+20']);
  const eligible =
    ageAtRetirement < 62 &&
    eligibilityType !== null &&
    eligibleTypes.has(eligibilityType);

  if (!eligible) {
    return { eligible: false, annualAmount: 0 };
  }

  // SRS formula: monthly SS benefit × (federal service / 40) → annualize
  const monthlyAmount = estimatedSSAt62 * (Math.min(federalServiceYears, 40) / 40);
  const annualAmount = monthlyAmount * 12;

  return { eligible: true, annualAmount };
}
