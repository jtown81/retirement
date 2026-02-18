/**
 * TSP Agency Match
 * Formula: tsp/agency-match
 *
 * FERS agency contributions consist of two parts, both always deposited to Traditional TSP:
 *
 *   1. Automatic contribution: 1% of gross salary, regardless of employee contribution
 *   2. Matching contribution (on top of the automatic 1%):
 *        - 100% match on first 3% of salary the employee contributes
 *        - 50% match on next 2% of salary the employee contributes
 *        - No match above 5% employee contribution
 *
 * Maximum total agency contribution: 5% of salary (1% auto + 4% match).
 * Agency contributions do NOT go to Roth under any circumstances.
 *
 * Source: 5 U.S.C. § 8432(c); TSP regulations 5 CFR Part 1600
 *
 * NOTE: This implementation assumes no annual match true-up (HOOK: tsp/annual-trueup).
 * If an employee front-loads contributions and hits the 402(g) cap mid-year, this
 * implementation assumes they lose agency match for remaining pay periods. To enable
 * true-up support, wire TSPContributionEvent.agencyMatchTrueUp flag into the
 * pre-retirement projection engine. See: tests/unit/tsp/agency-match-trueup.test.ts
 */

export interface AgencyMatchResult {
  /** 1% automatic contribution (always paid, regardless of employee deferral) */
  automaticContribution: number;
  /** Dollar amount of matching contribution (0–4% of salary) */
  matchingContribution: number;
  /** Total agency contribution (automatic + matching); always to Traditional TSP */
  totalAgencyContribution: number;
}

/**
 * Computes the FERS agency TSP contribution for one pay period or one year.
 *
 * Formula ID: tsp/agency-match
 *
 * @param salary - Gross pay for the period (annual or per-pay-period)
 * @param employeeContributionPct - Employee contribution as a decimal (e.g., 0.05 = 5%)
 * @returns Breakdown of automatic, matching, and total agency contributions
 */
export function computeAgencyMatch(
  salary: number,
  employeeContributionPct: number,
): AgencyMatchResult {
  if (salary < 0) throw new RangeError('salary must be >= 0');
  if (employeeContributionPct < 0 || employeeContributionPct > 1) {
    throw new RangeError('employeeContributionPct must be between 0 and 1');
  }

  const automatic = salary * 0.01;

  // Match schedule: 100% on first 3%, 50% on next 2%
  const tier1 = Math.min(employeeContributionPct, 0.03); // first 3% → 100% match
  const tier2 = Math.max(0, Math.min(employeeContributionPct - 0.03, 0.02)); // next 2% → 50% match
  const matching = salary * (tier1 * 1.0 + tier2 * 0.5);

  return {
    automaticContribution: automatic,
    matchingContribution: matching,
    totalAgencyContribution: automatic + matching,
  };
}
