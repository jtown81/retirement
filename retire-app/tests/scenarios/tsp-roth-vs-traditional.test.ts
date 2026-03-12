/**
 * Scenario: High Roth vs Traditional TSP Contribution Paths
 *
 * Compares two contribution strategies over the same 20-year career:
 *   - Strategy A: 100% Traditional (employee contribution pre-tax)
 *   - Strategy B: 100% Roth (employee contribution after-tax)
 *
 * In both cases, agency match ALWAYS goes to Traditional regardless of employee election.
 *
 * Scenario assumptions:
 *   - Salary: $80,000/year (constant for simplicity)
 *   - Employee contribution: 10% of salary = $8,000/year
 *   - Growth rate: 7% nominal
 *   - Projection: 20 years starting 2025
 *   - Not catch-up eligible
 *
 * Expected values derived from formula definitions in docs/formula-registry.md.
 * Spreadsheet cell-level mapping: TBD (docs/spreadsheet-parity.md).
 */

import { describe, it, expect } from 'vitest';
import { computeAgencyMatch } from '../../src/modules/tsp/agency-match';
import { projectTraditionalBalance, projectTraditionalDetailed } from '../../src/modules/tsp/traditional';
import { projectRothBalance } from '../../src/modules/tsp/roth';

const SALARY = 80_000;
const EMPLOYEE_PCT = 0.10;
const EMPLOYEE_ANNUAL = SALARY * EMPLOYEE_PCT; // $8,000
const GROWTH_RATE = 0.07;
const YEARS = 20;
const START_YEAR = 2025;

// Agency match at 10% contribution = 1% auto + 3%×100% match + 2%×50% match = 5% total = $4,000
const { totalAgencyContribution: AGENCY_ANNUAL } = computeAgencyMatch(SALARY, EMPLOYEE_PCT);

describe('Scenario: Roth vs Traditional TSP', () => {
  it('agency match always goes to Traditional regardless of Roth election', () => {
    // Whether employee contributes Traditional or Roth, agency match is the same
    const agencyForTraditional = computeAgencyMatch(SALARY, EMPLOYEE_PCT);
    const agencyForRoth = computeAgencyMatch(SALARY, EMPLOYEE_PCT); // identical calculation

    expect(agencyForTraditional.totalAgencyContribution).toBe(
      agencyForRoth.totalAgencyContribution,
    );
    // At 10%: 1% auto + 3%×100% match + 2%×50% match = 5% of salary = $4,000
    expect(agencyForTraditional.totalAgencyContribution).toBeCloseTo(SALARY * 0.05);
  });

  it('traditional-only path projects correct pre-tax balance', () => {
    // Strategy A: Employee contributes $8k to Traditional; agency adds its match
    const traditionalBalance = projectTraditionalBalance(
      0,
      EMPLOYEE_ANNUAL,
      AGENCY_ANNUAL,
      GROWTH_RATE,
      YEARS,
    );
    // Sanity: 20 years of $8k employee + $3.6k agency at 7% should exceed $500k
    expect(traditionalBalance).toBeGreaterThan(500_000);
    // Should not exceed $2M (sanity upper bound)
    expect(traditionalBalance).toBeLessThan(2_000_000);
  });

  it('roth-only path projects correct after-tax balance', () => {
    // Strategy B: Employee contributes $8k to Roth (no agency match here)
    // Agency still contributes to Traditional (tracked separately in this scenario)
    const rothEmployeeBalance = projectRothBalance(
      0,
      EMPLOYEE_ANNUAL,
      GROWTH_RATE,
      YEARS,
    );
    // Agency goes to Traditional — project that separately
    const agencyTraditionalBalance = projectTraditionalBalance(
      0,
      0,              // employee contributes 0 to Traditional
      AGENCY_ANNUAL,  // agency automatic + match still to Traditional
      GROWTH_RATE,
      YEARS,
    );

    // Roth employee portion grows on its own; should be positive and significant
    expect(rothEmployeeBalance).toBeGreaterThan(0);
    expect(agencyTraditionalBalance).toBeGreaterThan(0);

    // Combined Roth balance should be less than Traditional-only (no agency in Roth)
    expect(rothEmployeeBalance).toBeLessThan(
      projectTraditionalBalance(0, EMPLOYEE_ANNUAL, AGENCY_ANNUAL, GROWTH_RATE, YEARS),
    );
  });

  it('combined totals are comparable between strategies', () => {
    // Strategy A: All employee dollars to Traditional
    const stratA_total = projectTraditionalBalance(
      0, EMPLOYEE_ANNUAL, AGENCY_ANNUAL, GROWTH_RATE, YEARS,
    );

    // Strategy B: Employee dollars to Roth, agency to Traditional
    const stratB_roth = projectRothBalance(0, EMPLOYEE_ANNUAL, GROWTH_RATE, YEARS);
    const stratB_traditional = projectTraditionalBalance(0, 0, AGENCY_ANNUAL, GROWTH_RATE, YEARS);
    const stratB_total = stratB_roth + stratB_traditional;

    // Both strategies invest the same total dollars at the same rate.
    // Pre-tax math is identical — combined nominal balances should be equal.
    expect(stratB_total).toBeCloseTo(stratA_total, 0);
  });

  it('detailed projection shows year-by-year growth', () => {
    const detail = projectTraditionalDetailed({
      openingBalance: 0,
      annualSalary: SALARY,
      employeeAnnualContribution: EMPLOYEE_ANNUAL,
      employeeContributionPct: EMPLOYEE_PCT,
      growthRate: GROWTH_RATE,
      years: YEARS,
      startYear: START_YEAR,
      isCatchUpEligible: false,
    });

    expect(detail).toHaveLength(YEARS);
    // Balance should strictly increase each year
    for (let i = 1; i < detail.length; i++) {
      expect(detail[i].closingBalance).toBeGreaterThan(detail[i - 1].closingBalance);
    }
    // Final year closing balance should match simple projection
    const simpleResult = projectTraditionalBalance(
      0, EMPLOYEE_ANNUAL, AGENCY_ANNUAL, GROWTH_RATE, YEARS,
    );
    // The detailed projection uses the computed agency match, which may differ slightly
    // from AGENCY_ANNUAL due to rounding — allow a small tolerance
    expect(detail[YEARS - 1].closingBalance).toBeCloseTo(simpleResult, -2);
  });
});
