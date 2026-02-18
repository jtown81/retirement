/**
 * Roth TSP Projection
 * Formula: tsp/roth-growth
 *
 * Projects the after-tax Roth TSP balance year-by-year.
 * Employee contributions only — agency contributions NEVER go to Roth.
 *
 * Growth model: same mid-year approximation as Traditional projection.
 * Tax treatment: contributions are after-tax; qualified withdrawals are tax-free.
 *                The projection tracks nominal (pre-withdrawal) balance only.
 *
 * ASSUMPTION: Constant growth rate per projection segment.
 * ASSUMPTION: Contributions are already after-tax (no gross-up needed in this model).
 *
 * Source: IRC § 402A; TSP regulations 5 CFR Part 1601
 */

import { clampToContributionLimit } from '../../data/tsp-limits';

export interface RothProjectionYear {
  year: number;
  openingBalance: number;
  employeeContribution: number;
  growth: number;
  closingBalance: number;
}

export interface RothProjectionInput {
  /** Starting Roth TSP balance */
  openingBalance: number;
  /** Employee Roth elective deferral in dollars for this segment */
  employeeAnnualContribution: number;
  /** Annual growth rate as decimal (e.g., 0.07 for 7%) */
  growthRate: number;
  /** Number of years to project */
  years: number;
  /** Calendar year at start of projection (for IRS limit enforcement) */
  startYear: number;
  /** Employee age at the start of this projection segment (used to determine catch-up eligibility) */
  employeeStartAge: number;
  /**
   * Annual Traditional TSP employee contribution in dollars (same projection segment).
   * Used to enforce the combined IRS elective deferral limit across both account types.
   */
  traditionalEmployeeContribution?: number;
}

/**
 * Simple Roth TSP balance projection (no IRS limit enforcement, no detailed breakdown).
 * Used by the simulation engine when agency contributions are tracked separately.
 *
 * Formula ID: tsp/roth-growth
 *
 * @param openingBalance - Starting Roth balance
 * @param annualContributions - Employee Roth contributions per year
 * @param growthRate - Annual growth rate as decimal
 * @param years - Number of years to project
 * @returns Final Roth balance after `years` years
 */
export function projectRothBalance(
  openingBalance: number,
  annualContributions: number,
  growthRate: number,
  years: number,
): number {
  if (years < 0) throw new RangeError('years must be >= 0');
  if (growthRate < -1) throw new RangeError('growthRate must be > -1');

  let balance = openingBalance;
  for (let i = 0; i < years; i++) {
    balance = balance * (1 + growthRate) + annualContributions * (1 + growthRate / 2);
  }
  return balance;
}

/**
 * Detailed Roth TSP projection with IRS limit enforcement.
 * Enforces the combined Traditional + Roth elective deferral cap.
 *
 * Formula ID: tsp/roth-growth (detailed)
 */
export function projectRothDetailed(input: RothProjectionInput): RothProjectionYear[] {
  const {
    openingBalance,
    employeeAnnualContribution,
    growthRate,
    years,
    startYear,
    employeeStartAge,
    traditionalEmployeeContribution = 0,
  } = input;

  if (years < 0) throw new RangeError('years must be >= 0');
  if (growthRate < -1) throw new RangeError('growthRate must be > -1');

  const results: RothProjectionYear[] = [];
  let balance = openingBalance;

  for (let i = 0; i < years; i++) {
    const calendarYear = startYear + i;
    const employeeAge = employeeStartAge + i;
    const opening = balance;

    // Combined Traditional + Roth must not exceed the annual elective deferral limit.
    // We apply the cap to the total and allocate proportionally if needed.
    const totalIntended = employeeAnnualContribution + traditionalEmployeeContribution;
    const totalCapped = clampToContributionLimit(totalIntended, calendarYear, employeeAge);

    // If capping occurred, reduce Roth proportionally (traditional gets priority in this model).
    // ASSUMPTION: Traditional contributions are fulfilled first when cap is hit.
    const traditionalActual = Math.min(traditionalEmployeeContribution, totalCapped);
    const rothActual = Math.max(0, totalCapped - traditionalActual);

    const closing = opening * (1 + growthRate) + rothActual * (1 + growthRate / 2);
    const growth = closing - opening - rothActual;

    results.push({
      year: calendarYear,
      openingBalance: opening,
      employeeContribution: rothActual,
      growth,
      closingBalance: closing,
    });

    balance = closing;
  }

  return results;
}
