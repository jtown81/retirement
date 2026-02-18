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

import { clampToContributionLimit, getTSPLimits } from '../../data/tsp-limits';
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
  /**
   * True if the payroll provider performs annual agency match true-up.
   * When an employee front-loads contributions and hits the 402(g) cap mid-year,
   * they stop contributing. Without true-up (default), agency stops matching those periods.
   * With true-up, agency restores match retroactively to reach the annual 5% maximum.
   * Source: TSP regulations 5 CFR Part 1600; TSP Bulletin 2012-2
   * HOOK: tsp/annual-trueup
   */
  agencyMatchTrueUp?: boolean;
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
    agencyMatchTrueUp = false,
  } = input;

  if (years < 0) throw new RangeError('years must be >= 0');
  if (growthRate < -1) throw new RangeError('growthRate must be > -1');

  const results: TraditionalProjectionYear[] = [];
  let balance = openingBalance;
  const BIWEEKLY_PERIODS = 26;

  for (let i = 0; i < years; i++) {
    const calendarYear = startYear + i;
    const employeeAge = employeeStartAge + i;
    const opening = balance;

    // IRS limit enforcement: cap employee contributions to annual limit
    const cappedEmployeeContrib = clampToContributionLimit(
      employeeAnnualContribution,
      calendarYear,
      employeeAge,
    );

    // Agency match always goes to Traditional
    let agencyContrib = computeAgencyMatch(
      annualSalary,
      employeeContributionPct,
    ).totalAgencyContribution;

    // True-up logic: if cap was hit and true-up is enabled, restore match
    if (agencyMatchTrueUp && cappedEmployeeContrib < employeeAnnualContribution) {
      // Employee was capped, meaning they couldn't contribute the full amount
      // Calculate what match would have been paid if no cap existed
      const limits = getTSPLimits(calendarYear);
      const annualCap = limits.electiveDeferralLimit;

      // Assuming biweekly contributions at constant rate:
      // perPeriodIntended = employeeAnnualContribution / BIWEEKLY_PERIODS
      // Find the period where the cap was hit
      const perPeriodIntended = employeeAnnualContribution / BIWEEKLY_PERIODS;
      const perPeriodSalary = annualSalary / BIWEEKLY_PERIODS;
      let cumulativeContrib = 0;
      let capHitPeriod = BIWEEKLY_PERIODS; // default: cap never hit

      for (let period = 1; period <= BIWEEKLY_PERIODS; period++) {
        cumulativeContrib += perPeriodIntended;
        if (cumulativeContrib >= annualCap) {
          capHitPeriod = period;
          break;
        }
      }

      // Periods remaining after cap was hit
      const periodsAfterCap = BIWEEKLY_PERIODS - capHitPeriod;

      if (periodsAfterCap > 0) {
        // Calculate the match for remaining periods assuming the intended contribution rate
        // Using the tiered match: 100% on first 3%, 50% on next 2%
        const { totalAgencyContribution: hypotheticalMatch } = computeAgencyMatch(
          perPeriodSalary,
          employeeContributionPct,
        );
        const trueUpAmount = hypotheticalMatch * periodsAfterCap;

        // Cap the true-up so total agency doesn't exceed 5%
        const maxTotalAgency = annualSalary * 0.05;
        agencyContrib = Math.min(agencyContrib + trueUpAmount, maxTotalAgency);
      }
    }

    const totalContrib = cappedEmployeeContrib + agencyContrib;
    const closing = opening * (1 + growthRate) + totalContrib * (1 + growthRate / 2);
    const growth = closing - opening - totalContrib;

    results.push({
      year: calendarYear,
      openingBalance: opening,
      employeeContribution: cappedEmployeeContrib,
      agencyContribution: agencyContrib,
      growth,
      closingBalance: closing,
    });

    balance = closing;
  }

  return results;
}
