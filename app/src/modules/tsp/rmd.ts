/**
 * Required Minimum Distributions (RMD)
 *
 * Computes the annual minimum distribution from Traditional TSP/IRA
 * accounts as required by the IRS.
 *
 * RMD age: 73 (SECURE 2.0 Act § 107, effective 2023)
 * Increases to 75 starting in 2033.
 *
 * Formula: RMD = Account Balance (Dec 31 prior year) / Distribution Period
 * Distribution period comes from IRS Uniform Lifetime Table (Table III),
 * used when the sole beneficiary is NOT a spouse more than 10 years younger.
 *
 * Source: IRC § 401(a)(9); IRS Publication 590-B; SECURE 2.0 Act § 107
 * Classification: Hard regulatory requirement
 */

import { registerFormula } from '../../registry/index';

registerFormula({
  id: 'tsp/rmd',
  name: 'Required Minimum Distribution',
  module: 'tsp',
  purpose: 'Computes minimum annual withdrawal from Traditional TSP per IRS rules.',
  sourceRef: 'IRC § 401(a)(9); IRS Pub 590-B Table III; SECURE 2.0 Act § 107',
  classification: 'hard-regulatory',
  version: '1.0.0',
  changelog: [{ date: '2026-02-11', author: 'system', description: 'Initial implementation' }],
});

/**
 * IRS Uniform Lifetime Table (Table III) — Distribution Periods
 * Used for most TSP/IRA owners. Keyed by age.
 * Source: IRS Publication 590-B (2024 revision)
 */
const UNIFORM_LIFETIME_TABLE: Record<number, number> = {
  72: 27.4,
  73: 26.5,
  74: 25.5,
  75: 24.6,
  76: 23.7,
  77: 22.9,
  78: 22.0,
  79: 21.1,
  80: 20.2,
  81: 19.4,
  82: 18.5,
  83: 17.7,
  84: 16.8,
  85: 16.0,
  86: 15.2,
  87: 14.4,
  88: 13.7,
  89: 12.9,
  90: 12.2,
  91: 11.5,
  92: 10.8,
  93: 10.1,
  94: 9.5,
  95: 8.9,
  96: 8.4,
  97: 7.8,
  98: 7.3,
  99: 6.8,
  100: 6.4,
  101: 6.0,
  102: 5.6,
  103: 5.2,
  104: 4.9,
  105: 4.6,
  106: 4.3,
  107: 4.1,
  108: 3.9,
  109: 3.7,
  110: 3.5,
  111: 3.4,
  112: 3.3,
  113: 3.1,
  114: 3.0,
  115: 2.9,
};

/** Maximum age in the table. Ages above this use the last entry. */
const MAX_TABLE_AGE = 115;
const MIN_TABLE_AGE = 72;

/**
 * Returns the distribution period from the Uniform Lifetime Table for a given age.
 */
export function getDistributionPeriod(age: number): number {
  if (age < MIN_TABLE_AGE) return UNIFORM_LIFETIME_TABLE[MIN_TABLE_AGE];
  if (age > MAX_TABLE_AGE) return UNIFORM_LIFETIME_TABLE[MAX_TABLE_AGE];
  return UNIFORM_LIFETIME_TABLE[age] ?? UNIFORM_LIFETIME_TABLE[MAX_TABLE_AGE];
}

/**
 * Computes RMD start age based on birth year (SECURE 2.0 Act § 107).
 *
 * @param birthYear - Year of birth (e.g., 1960)
 * @returns Age at which RMD begins (73 for born before 1960, 75 for born 1960+)
 *
 * SECURE 2.0 Phase-in:
 * - Born before 1960: RMD age 73 (effective 2023)
 * - Born 1960: RMD age 75 (effective 2035)
 */
export function getRMDStartAge(birthYear: number): number {
  return birthYear < 1960 ? 73 : 75;
}

/**
 * Returns true if RMDs are required at the given age.
 * Under SECURE 2.0 Act, RMD begins at age 73 (for those born before 1960)
 * or age 75 (for those born 1960+).
 *
 * @param age - Current age
 * @param birthYear - Optional birth year to determine RMD start age (defaults to born before 1960 → age 73)
 */
export function isRMDRequired(age: number, birthYear?: number): boolean {
  const rmdStartAge = birthYear ? getRMDStartAge(birthYear) : 73;
  return age >= rmdStartAge;
}

/**
 * Computes the Required Minimum Distribution for a given year.
 *
 * @param traditionalBalance - Traditional TSP/IRA balance as of Dec 31 of prior year
 * @param age - Owner's age in the distribution year
 * @param birthYear - Optional birth year to determine RMD start age
 * @returns The minimum amount that must be withdrawn, or 0 if not yet required
 */
export function computeRMD(traditionalBalance: number, age: number, birthYear?: number): number {
  if (traditionalBalance <= 0) return 0;
  if (!isRMDRequired(age, birthYear)) return 0;

  const period = getDistributionPeriod(age);
  return traditionalBalance / period;
}
