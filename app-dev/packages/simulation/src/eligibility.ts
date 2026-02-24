/**
 * FERS Retirement Eligibility
 * Formula: simulation/fers-eligibility
 *
 * Determines whether a federal employee meets FERS retirement criteria.
 *
 * Unreduced annuity eligibility (standard FERS):
 *   - MRA + 30 years of service   (immediate, unreduced)
 *   - Age 60 + 20 years           (immediate, unreduced)
 *   - Age 62 + 5 years            (immediate, unreduced — 1.1% multiplier if 20+ years)
 *
 * Reduced annuity (MRA+10 rule — not modeled here; flag for Phase 7 extension):
 *   - MRA + 10–29 years: eligible but annuity reduced 5%/year under age 62
 *
 * Mandatory separation:
 *   - LEO/FF: age 57 (handled in career module; flagged here only)
 *
 * MRA by birth year (OPM FERS Handbook, Ch. 40):
 *   Born before 1948:  55y 0m
 *   Born 1948:         55y 2m
 *   Born 1949:         55y 4m
 *   Born 1950:         55y 6m
 *   Born 1951:         55y 8m
 *   Born 1952:         55y 10m
 *   Born 1953–1964:    56y 0m
 *   Born 1965:         56y 2m
 *   Born 1966:         56y 4m
 *   Born 1967:         56y 6m
 *   Born 1968:         56y 8m
 *   Born 1969:         56y 10m
 *   Born 1970+:        57y 0m
 *
 * Source: OPM FERS Handbook, Ch. 40; 5 U.S.C. § 8412
 */

export interface MRAResult {
  /** MRA in whole years */
  years: number;
  /** Additional months beyond whole years */
  months: number;
  /** MRA as a decimal age (e.g., 55 + 2/12 ≈ 55.167) */
  decimalAge: number;
}

export interface EligibilityResult {
  eligible: boolean;
  /** Type of eligibility met, or null if not eligible */
  type:
    | 'MRA+30'
    | 'Age60+20'
    | 'Age62+5'
    | 'MRA+10-reduced'
    | null;
  /** True if the 1.1% annuity multiplier applies (age 62+ with 20+ years) */
  enhancedMultiplier: boolean;
}

/** MRA table: [birthYear, years, months] */
const MRA_TABLE: ReadonlyArray<[number, number, number]> = [
  [1948, 55, 2],
  [1949, 55, 4],
  [1950, 55, 6],
  [1951, 55, 8],
  [1952, 55, 10],
  [1953, 56, 0],
  // 1953–1964 all map to 56y 0m — handled by range logic below
  [1965, 56, 2],
  [1966, 56, 4],
  [1967, 56, 6],
  [1968, 56, 8],
  [1969, 56, 10],
] as const;

/**
 * Returns the Minimum Retirement Age for a given birth year.
 *
 * Formula ID: simulation/fers-eligibility (MRA lookup)
 *
 * @param birthYear - Employee's 4-digit birth year
 * @returns MRA in years, months, and decimal form
 */
export function getMRA(birthYear: number): MRAResult {
  if (birthYear < 1900 || birthYear > 2100) {
    throw new RangeError(`birthYear ${birthYear} is out of plausible range`);
  }

  if (birthYear < 1948) return { years: 55, months: 0, decimalAge: 55 };
  if (birthYear >= 1953 && birthYear <= 1964) return { years: 56, months: 0, decimalAge: 56 };
  if (birthYear >= 1970) return { years: 57, months: 0, decimalAge: 57 };

  const entry = MRA_TABLE.find(([yr]) => yr === birthYear);
  if (entry) {
    const [, years, months] = entry;
    return { years, months, decimalAge: years + months / 12 };
  }

  // Should never reach here given the ranges above
  throw new Error(`No MRA entry found for birth year ${birthYear}`);
}

/**
 * Determines FERS retirement eligibility.
 *
 * Formula ID: simulation/fers-eligibility
 *
 * Uses decimal age comparisons (age >= mra.decimalAge).
 * Years of service should be the total creditable service (civilian + military buyback + sick leave credit).
 *
 * @param age - Employee's age at proposed retirement date (decimal, e.g., 57.5)
 * @param yearsOfService - Total creditable service years (fractional)
 * @param birthYear - Employee's birth year (for MRA lookup)
 * @returns Eligibility result with type and multiplier flag
 */
export function checkFERSEligibility(
  age: number,
  yearsOfService: number,
  birthYear: number,
): EligibilityResult {
  if (age < 0) throw new RangeError('age must be >= 0');
  if (yearsOfService < 0) throw new RangeError('yearsOfService must be >= 0');

  const mra = getMRA(birthYear);

  // Unreduced: Age 62 + 5 years (enhanced multiplier if 20+ years)
  if (age >= 62 && yearsOfService >= 5) {
    return {
      eligible: true,
      type: 'Age62+5',
      enhancedMultiplier: age >= 62 && yearsOfService >= 20,
    };
  }

  // Unreduced: Age 60 + 20 years
  if (age >= 60 && yearsOfService >= 20) {
    return { eligible: true, type: 'Age60+20', enhancedMultiplier: false };
  }

  // Unreduced: MRA + 30 years
  if (age >= mra.decimalAge && yearsOfService >= 30) {
    return { eligible: true, type: 'MRA+30', enhancedMultiplier: false };
  }

  // Reduced: MRA + 10 years (5% reduction per year under 62)
  // ASSUMPTION: We flag this as eligible-reduced but the annuity reduction
  // is applied separately in the annuity formula.
  if (age >= mra.decimalAge && yearsOfService >= 10) {
    return { eligible: true, type: 'MRA+10-reduced', enhancedMultiplier: false };
  }

  return { eligible: false, type: null, enhancedMultiplier: false };
}

/**
 * Computes the MRA+10 annuity reduction factor.
 * Annuity is reduced 5% for each full year the employee is under age 62 at retirement.
 *
 * @param ageAtRetirement - Employee's age at retirement (decimal)
 * @returns Reduction factor (e.g., 0.80 means 20% reduction)
 */
export function mra10ReductionFactor(ageAtRetirement: number): number {
  if (ageAtRetirement >= 62) return 1.0;
  const yearsUnder62 = Math.floor(62 - ageAtRetirement);
  return Math.max(0, 1 - yearsUnder62 * 0.05);
}
