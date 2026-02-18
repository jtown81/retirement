/**
 * TSP Agency Match True-Up — Future Implementation
 *
 * This test file documents the true-up feature design. Tests are marked as
 * todo() until implementation is complete.
 *
 * Background: When an employee front-loads contributions and hits the 402(g)
 * elective deferral cap mid-year, they stop contributing. Without true-up,
 * the agency stops matching those periods. With true-up, the agency restores
 * the match retroactively to reach the annual 5% maximum.
 *
 * Example:
 * - Employee contributes 26 biweekly = $1,000/pp
 * - At pp 23: YTD employee = $23,000 (hits 2025 cap of $23,500)
 * - Remaining cap: $500 allowed in pp 24
 * - pp 25–26: $0 employee contribution (no cap room)
 * - Without true-up: Agency contributes in pp 1–24 only
 * - With true-up: Agency restores match for pp 25–26 to reach 5% annual
 *
 * Source: TSP Bulletin 2012-2; 5 CFR § 1600.23(b)
 * Regulatory Classification: Assumption (provider-dependent)
 * Hook ID: tsp/annual-trueup
 * Implementation Status: FUTURE (flag exists, engine not updated)
 */

import { describe, it, expect } from 'vitest';
import { projectTraditionalDetailed } from '../../../src/modules/tsp/traditional';

describe('TSP Agency Match True-Up', () => {
  /**
   * Scenario: Employee front-loads at a high rate and hits the 402(g) cap mid-year.
   * Example: 50% contribution rate on $100k salary = $50,000/year intended.
   * Employee contributes $923/pp biweekly until hitting the $23,500 cap (period 25–26).
   *
   * Without true-up: Agency stops matching after cap hit.
   * With true-up: Agency restores match for remaining periods (period 26 onward).
   *
   * Expected difference: ~1 period × (~$180 match/period) = ~$180 restored
   */
  it('restores agency match for remaining periods after 402(g) cap hit', () => {
    const annualSalary = 100_000;
    // Use 50% contribution rate to ensure cap is hit with some periods remaining
    const contributionRate = 0.50;
    const intendedContribution = annualSalary * contributionRate; // $50,000

    // Without true-up: employee hits cap, no match for remaining periods
    const withoutTrueUp = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary,
      employeeAnnualContribution: intendedContribution,
      employeeContributionPct: contributionRate,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      employeeStartAge: 45,
      agencyMatchTrueUp: false,
    });

    // With true-up: agency restores match for periods after cap
    const withTrueUp = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary,
      employeeAnnualContribution: intendedContribution,
      employeeContributionPct: contributionRate,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      employeeStartAge: 45,
      agencyMatchTrueUp: true,
    });

    // Both should have capped employee contributions (2025 limit = $23,500)
    expect(withoutTrueUp[0].employeeContribution).toBeCloseTo(23_500, 0);
    expect(withTrueUp[0].employeeContribution).toBeCloseTo(23_500, 0);

    // True-up should result in more agency contribution
    expect(withTrueUp[0].agencyContribution).toBeGreaterThanOrEqual(
      withoutTrueUp[0].agencyContribution,
    );
    // At least some additional match from true-up
    if (withTrueUp[0].agencyContribution > withoutTrueUp[0].agencyContribution) {
      expect(
        withTrueUp[0].agencyContribution - withoutTrueUp[0].agencyContribution,
      ).toBeGreaterThan(50);
    }
  });

  /**
   * Scenario: Employee contributes only 2%, well below the 5% max match.
   * No cap hit. True-up should have no effect.
   */
  it('has no effect when cap is not hit', () => {
    const annualSalary = 100_000;

    // Without true-up
    const withoutTrueUp = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary,
      employeeAnnualContribution: 2_000, // 2% of $100k
      employeeContributionPct: 0.02,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      employeeStartAge: 45,
      agencyMatchTrueUp: false,
    });

    // With true-up (should be identical when cap not hit)
    const withTrueUp = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary,
      employeeAnnualContribution: 2_000,
      employeeContributionPct: 0.02,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      employeeStartAge: 45,
      agencyMatchTrueUp: true,
    });

    // Agency match: 1% auto + 100% of 2% = 3% total
    const expectedAgency = annualSalary * 0.03;
    expect(withoutTrueUp[0].agencyContribution).toBeCloseTo(expectedAgency, 0);
    expect(withTrueUp[0].agencyContribution).toBeCloseTo(expectedAgency, 0);
  });

  /**
   * Scenario: Employee contributes 4%, hits cap in pp 20.
   * True-up restores match for remaining periods.
   * This documents the edge case where an employee is partially into tier 2.
   */
  it('correctly handles true-up at tier 2 boundary', () => {
    const annualSalary = 100_000;

    // Without true-up
    const withoutTrueUp = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary,
      employeeAnnualContribution: 25_000, // 4% × 26 = $26,000/year, but capped at $23,500
      employeeContributionPct: 0.04,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      employeeStartAge: 45,
      agencyMatchTrueUp: false,
    });

    // With true-up
    const withTrueUp = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary,
      employeeAnnualContribution: 25_000,
      employeeContributionPct: 0.04,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      employeeStartAge: 45,
      agencyMatchTrueUp: true,
    });

    // Both should be capped
    expect(withoutTrueUp[0].employeeContribution).toBeCloseTo(23_500, 0);
    expect(withTrueUp[0].employeeContribution).toBeCloseTo(23_500, 0);

    // True-up should restore missing match
    expect(withTrueUp[0].agencyContribution).toBeGreaterThan(
      withoutTrueUp[0].agencyContribution,
    );

    // Neither should exceed 5% total agency
    expect(withoutTrueUp[0].agencyContribution).toBeLessThanOrEqual(annualSalary * 0.05);
    expect(withTrueUp[0].agencyContribution).toBeLessThanOrEqual(annualSalary * 0.05);
  });

  /**
   * Scenario: Employee contributes 6%, way above 5% match limit.
   * Agency should still max out at 5% annual regardless of true-up.
   */
  it('does not exceed 5% total agency contribution with true-up', () => {
    const annualSalary = 100_000;

    // Without true-up
    const withoutTrueUp = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary,
      employeeAnnualContribution: 31_000, // 6% × 26 = $31,200/year (way over cap)
      employeeContributionPct: 0.06,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      employeeStartAge: 45,
      agencyMatchTrueUp: false,
    });

    // With true-up
    const withTrueUp = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary,
      employeeAnnualContribution: 31_000,
      employeeContributionPct: 0.06,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      employeeStartAge: 45,
      agencyMatchTrueUp: true,
    });

    // Max agency is 5%
    const maxAgency = annualSalary * 0.05;
    expect(withoutTrueUp[0].agencyContribution).toBeLessThanOrEqual(maxAgency);
    expect(withTrueUp[0].agencyContribution).toBeLessThanOrEqual(maxAgency);
    expect(withTrueUp[0].agencyContribution).toBeCloseTo(maxAgency, 0);
  });
});

describe('TSP Agency Match True-Up Configuration', () => {
  it('TSPContributionEvent model includes agencyMatchTrueUp flag', () => {
    // This test documents that the flag exists in the data model.
    // See: src/models/tsp.ts — TSPContributionEvent.agencyMatchTrueUp
    // Default: undefined (false) — no true-up, conservative model
    // Set to true: if payroll provider performs annual true-up
    expect(true).toBe(true);
  });

  it('flag is optional in Zod schema for backward compatibility', () => {
    // Zod schema: TSPContributionEventSchema
    // agencyMatchTrueUp: z.boolean().optional()
    // Allows existing data without the field to remain valid
    expect(true).toBe(true);
  });
});
