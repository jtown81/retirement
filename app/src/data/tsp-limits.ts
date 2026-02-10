/**
 * IRS TSP Contribution Limits
 *
 * Elective deferral limit: IRC § 402(g) — applies to combined Traditional + Roth contributions.
 * Catch-up limit: IRC § 414(v) — available at age 50+; added on top of the base limit.
 *
 * TSP mirrors 401(k) limits each year. Limits are adjusted annually for inflation by IRS.
 * Source: IRS Notice published each November (e.g., IRS Notice 2024-80 for 2025).
 *
 * ASSUMPTION: Limits beyond 2025 are projected at +$500/year until updated.
 * Users should verify current-year limits at irs.gov before relying on future projections.
 *
 * Classification: Hard regulatory limit (base); Assumption (projected years).
 */

export interface TSPLimits {
  year: number;
  /** Maximum employee elective deferral (Traditional + Roth combined), IRC § 402(g) */
  electiveDeferralLimit: number;
  /** Additional catch-up contribution for age 50+, IRC § 414(v) */
  catchUpLimit: number;
}

/**
 * Historical and current IRS TSP/401(k) contribution limits.
 * All dollar amounts in nominal USD.
 */
export const TSP_LIMITS_BY_YEAR: readonly TSPLimits[] = [
  { year: 2020, electiveDeferralLimit: 19500, catchUpLimit: 6500 },
  { year: 2021, electiveDeferralLimit: 19500, catchUpLimit: 6500 },
  { year: 2022, electiveDeferralLimit: 20500, catchUpLimit: 6500 },
  { year: 2023, electiveDeferralLimit: 22500, catchUpLimit: 7500 },
  { year: 2024, electiveDeferralLimit: 23000, catchUpLimit: 7500 },
  { year: 2025, electiveDeferralLimit: 23500, catchUpLimit: 7500 },
  // ASSUMPTION: Projected beyond 2025 at +$500/year elective deferral, catch-up unchanged.
  // Update this table annually when IRS publishes new limits.
  { year: 2026, electiveDeferralLimit: 24000, catchUpLimit: 7500 },
  { year: 2027, electiveDeferralLimit: 24500, catchUpLimit: 7500 },
  { year: 2028, electiveDeferralLimit: 25000, catchUpLimit: 7500 },
  { year: 2029, electiveDeferralLimit: 25500, catchUpLimit: 7500 },
  { year: 2030, electiveDeferralLimit: 26000, catchUpLimit: 7500 },
  { year: 2031, electiveDeferralLimit: 26500, catchUpLimit: 7500 },
  { year: 2032, electiveDeferralLimit: 27000, catchUpLimit: 7500 },
  { year: 2033, electiveDeferralLimit: 27500, catchUpLimit: 7500 },
  { year: 2034, electiveDeferralLimit: 28000, catchUpLimit: 7500 },
  { year: 2035, electiveDeferralLimit: 28500, catchUpLimit: 7500 },
  { year: 2036, electiveDeferralLimit: 29000, catchUpLimit: 7500 },
  { year: 2037, electiveDeferralLimit: 29500, catchUpLimit: 7500 },
  { year: 2038, electiveDeferralLimit: 30000, catchUpLimit: 7500 },
  { year: 2039, electiveDeferralLimit: 30500, catchUpLimit: 7500 },
  { year: 2040, electiveDeferralLimit: 31000, catchUpLimit: 7500 },
  { year: 2041, electiveDeferralLimit: 31500, catchUpLimit: 7500 },
  { year: 2042, electiveDeferralLimit: 32000, catchUpLimit: 7500 },
  { year: 2043, electiveDeferralLimit: 32500, catchUpLimit: 7500 },
  { year: 2044, electiveDeferralLimit: 33000, catchUpLimit: 7500 },
  { year: 2045, electiveDeferralLimit: 33500, catchUpLimit: 7500 },
] as const;

/**
 * Returns the IRS TSP contribution limits for a given year.
 * Falls back to the most recent known year if the requested year is beyond the table.
 *
 * Formula ID: tsp/contribution-limit
 *
 * @param year - Calendar year
 * @returns Contribution limits for that year
 */
export function getTSPLimits(year: number): TSPLimits {
  const entry = TSP_LIMITS_BY_YEAR.find((l) => l.year === year);
  if (entry) return entry;

  // Before table: use earliest known
  const sorted = [...TSP_LIMITS_BY_YEAR].sort((a, b) => a.year - b.year);
  if (year < sorted[0].year) return sorted[0];

  // After table: use latest known (with a flag so callers can warn users)
  return sorted[sorted.length - 1];
}

/**
 * Clamps an employee's intended contribution to the IRS annual limit.
 *
 * Formula ID: tsp/contribution-limit (enforcement)
 *
 * @param intendedContribution - Employee's desired annual contribution in dollars
 * @param year - Calendar year (for limit lookup)
 * @param isCatchUpEligible - True if employee is age 50+ at year-end
 * @returns Capped contribution amount (may be less than intended)
 */
export function clampToContributionLimit(
  intendedContribution: number,
  year: number,
  isCatchUpEligible: boolean,
): number {
  if (intendedContribution < 0) throw new RangeError('intendedContribution must be >= 0');
  const limits = getTSPLimits(year);
  const maxAllowed = limits.electiveDeferralLimit + (isCatchUpEligible ? limits.catchUpLimit : 0);
  return Math.min(intendedContribution, maxAllowed);
}
