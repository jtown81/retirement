/**
 * Traditional TSP Projection
 * Formula: tsp/traditional-growth
 *
 * Projects the pre-tax Traditional TSP balance year-by-year.
 * Includes both employee contributions and agency contributions (automatic 1% + match).
 *
 * Growth model: end-of-year compounding — contributions are assumed to be deposited
 * evenly throughout the year, so they earn half a year of growth on average (mid-year
 * approximation). This is standard for annual projection models.
 *
 * ASSUMPTION: Constant growth rate per projection segment. Users can supply a lower
 * rate for conservative planning. Typical default: 0.07 (7% nominal).
 *
 * Source: 5 U.S.C. § 8432; TSP regulations 5 CFR Part 1600
 */

import { clampToContributionLimit } from '../../data/tsp-limits';
import { computeAgencyMatch } from './agency-match';

export interface TraditionalProjectionYear {
  year: number;
  openingBalance: number;
  employeeContribution: number;
  agencyContribution: number;
  growth: number;
  closingBalance: number;
}

export interface TraditionalProjectionInput {
  /** Starting Traditional TSP balance */
  openingBalance: number;
  /** Annual gross salary (used to compute agency match) */
  annualSalary: number;
  /** Employee elective deferral amount in dollars for this segment */
  employeeAnnualContribution: number;
  /** Employee contribution rate as decimal (e.g., 0.10 for 10%) — for agency match calc */
  employeeContributionPct: number;
  /** Annual growth rate as decimal (e.g., 0.07 for 7%) */
  growthRate: number;
  /** Number of years to project */
  years: number;
  /** Calendar year at start of projection (for IRS limit enforcement) */
  startYear: number;
  /** Employee age at the start of this projection segment (used to determine catch-up eligibility) */
  employeeStartAge: number;
}

/**
 * Projects the Traditional TSP balance year-by-year for a fixed contribution segment.
 *
 * Formula ID: tsp/traditional-growth
 *
 * Growth applied as mid-year approximation:
 *   closingBalance = (openingBalance × (1 + r)) + contributions × (1 + r/2)
 *
 * @param input - Projection parameters for this segment
 * @returns Array of annual snapshots
 */
export function projectTraditionalBalance(
  openingBalance: number,
  annualContributions: number,
  agencyContributions: number,
  growthRate: number,
  years: number,
): number {
  if (years < 0) throw new RangeError('years must be >= 0');
  if (growthRate < -1) throw new RangeError('growthRate must be > -1');

  let balance = openingBalance;
  for (let i = 0; i < years; i++) {
    const totalContributions = annualContributions + agencyContributions;
    balance = balance * (1 + growthRate) + totalContributions * (1 + growthRate / 2);
  }
  return balance;
}

/**
 * Projects Traditional TSP year-by-year with IRS limit enforcement and agency match.
 * Returns a detailed per-year breakdown.
 *
 * Formula ID: tsp/traditional-growth (detailed)
 */
export function projectTraditionalDetailed(
  input: TraditionalProjectionInput,
): TraditionalProjectionYear[] {
  const {
    openingBalance,
    annualSalary,
    employeeAnnualContribution,
    employeeContributionPct,
    growthRate,
    years,
    startYear,
    employeeStartAge,
  } = input;

  if (years < 0) throw new RangeError('years must be >= 0');
  if (growthRate < -1) throw new RangeError('growthRate must be > -1');

  const results: TraditionalProjectionYear[] = [];
  let balance = openingBalance;

  for (let i = 0; i < years; i++) {
    const calendarYear = startYear + i;
    const employeeAge = employeeStartAge + i;
    const opening = balance;

    // IRS limit enforcement
    const employeeContrib = clampToContributionLimit(
      employeeAnnualContribution,
      calendarYear,
      employeeAge,
    );

    // Agency match always goes to Traditional
    const { totalAgencyContribution: agencyContrib } = computeAgencyMatch(
      annualSalary,
      employeeContributionPct,
    );

    const totalContrib = employeeContrib + agencyContrib;
    const closing = opening * (1 + growthRate) + totalContrib * (1 + growthRate / 2);
    const growth = closing - opening - totalContrib;

    results.push({
      year: calendarYear,
      openingBalance: opening,
      employeeContribution: employeeContrib,
      agencyContribution: agencyContrib,
      growth,
      closingBalance: closing,
    });

    balance = closing;
  }

  return results;
}
