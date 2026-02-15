import { describe, it, expect } from 'vitest';
import { computeTSPFutureValue, projectTSPDepletion, projectPreRetirementTSP } from '../../../src/modules/tsp/future-value';

describe('computeTSPFutureValue', () => {
  it('returns current balance when years = 0', () => {
    expect(computeTSPFutureValue(100_000, 500, 0.07, 0)).toBe(100_000);
  });

  it('handles zero growth rate (no interest)', () => {
    // $100k + $500/mo × 120 months = $100k + $60k = $160k
    const result = computeTSPFutureValue(100_000, 500, 0, 10);
    expect(result).toBeCloseTo(160_000, 0);
  });

  it('handles zero contribution (growth only)', () => {
    // $100k with 7% annual rate, monthly compounding, 10 years
    // = $100k × (1 + 0.07/12)^120 ≈ $200,966
    const result = computeTSPFutureValue(100_000, 0, 0.07, 10);
    expect(result).toBeCloseTo(200_966, -2);
  });

  it('computes compound interest with monthly contributions', () => {
    // Spreadsheet scenario: $207k balance, $874.26 biweekly → ~$1,894/mo, 7% growth, ~17.83 years
    const monthlyContrib = (874.26 * 26) / 12; // convert biweekly to monthly
    const result = computeTSPFutureValue(207_000, monthlyContrib, 0.07, 17.83);
    // Spreadsheet shows ~$1,521,380
    expect(result).toBeGreaterThan(1_400_000);
    expect(result).toBeLessThan(1_700_000);
  });

  it('throws on negative balance', () => {
    expect(() => computeTSPFutureValue(-1, 500, 0.07, 10)).toThrow('currentBalance must be >= 0');
  });

  it('throws on negative contribution', () => {
    expect(() => computeTSPFutureValue(100_000, -1, 0.07, 10)).toThrow('monthlyContribution must be >= 0');
  });

  it('throws on negative years', () => {
    expect(() => computeTSPFutureValue(100_000, 500, 0.07, -1)).toThrow('yearsToRetirement must be >= 0');
  });
});

describe('projectTSPDepletion', () => {
  it('returns "NEVER" when growth exceeds withdrawals', () => {
    // $1M balance, $30k withdrawal (3%), 7% growth — never depletes
    const result = projectTSPDepletion(1_000_000, 30_000, 0.07, 62);
    expect(result.depletionAge).toBeNull();
    expect(result.balanceAt85).toBeGreaterThan(0);
  });

  it('finds depletion age when withdrawals exceed growth', () => {
    // $200k balance, $30k withdrawal (15%), 3% growth — will deplete
    const result = projectTSPDepletion(200_000, 30_000, 0.03, 62);
    expect(result.depletionAge).not.toBeNull();
    expect(result.depletionAge).toBeGreaterThan(62);
    expect(result.depletionAge).toBeLessThan(80);
  });

  it('projects through age 104', () => {
    const result = projectTSPDepletion(1_000_000, 40_000, 0.05, 62);
    const lastEntry = result.yearByYear[result.yearByYear.length - 1];
    expect(lastEntry.age).toBe(104);
  });

  it('balance at 85 is 0 if depleted before 85', () => {
    const result = projectTSPDepletion(100_000, 50_000, 0.02, 62);
    expect(result.depletionAge).toBeLessThan(85);
    expect(result.balanceAt85).toBe(0);
  });

  it('handles one-time withdrawal at a specific age', () => {
    const withoutOneTime = projectTSPDepletion(1_000_000, 40_000, 0.05, 62);
    const withOneTime = projectTSPDepletion(1_000_000, 40_000, 0.05, 62, { amount: 200_000, age: 65 });
    // One-time withdrawal reduces balance at 85
    expect(withOneTime.balanceAt85).toBeLessThan(withoutOneTime.balanceAt85);
  });

  it('handles zero withdrawal (savings only)', () => {
    const result = projectTSPDepletion(500_000, 0, 0.05, 62);
    expect(result.depletionAge).toBeNull();
    expect(result.balanceAt85).toBeGreaterThan(500_000);
  });

  it('starts year-by-year at retirement age', () => {
    const result = projectTSPDepletion(500_000, 20_000, 0.05, 65);
    expect(result.yearByYear[0].age).toBe(65);
    expect(result.yearByYear[0].balance).toBe(500_000);
  });
});

describe('projectPreRetirementTSP (Phase D)', () => {
  it('returns correct number of years', () => {
    const result = projectPreRetirementTSP(
      100_000,   // currentBalance
      0.70,      // traditionalPct
      80_000,    // annualSalary
      0.03,      // salaryGrowthRate
      0.06,      // contributionPct (6%)
      false,     // isRothContribution
      0.07,      // annualGrowthRate
      10,        // yearsToRetirement
    );
    expect(result.years).toHaveLength(10);
  });

  it('accounts for salary growth in contributions', () => {
    const result = projectPreRetirementTSP(
      100_000,
      0.70,
      100_000,
      0.05,      // 5% annual salary growth
      0.05,      // 5% contribution
      false,
      0.07,
      5,
    );
    const yr0 = result.years[0];
    const yr4 = result.years[4];
    // Year 0: $100k salary × 5% = $5k contribution
    // Year 4: ~$127.6k salary × 5% = ~$6.38k contribution
    expect(yr0.employeeContribution).toBeCloseTo(5_000, 0);
    expect(yr4.employeeContribution).toBeGreaterThan(6_000);
  });

  it('includes agency automatic contribution (1%)', () => {
    const result = projectPreRetirementTSP(
      100_000,
      0.70,
      100_000,
      0.02,
      0.05,
      false,
      0.07,
      3,
    );
    const yr0 = result.years[0];
    // Agency automatic should be 1% of salary
    expect(yr0.agencyAutomatic).toBeCloseTo(1_000, 0);
  });

  it('includes agency match (matches contributions up to 5%)', () => {
    const result = projectPreRetirementTSP(
      100_000,
      0.70,
      100_000,
      0.02,
      0.05,      // 5% contribution
      false,
      0.07,
      1,
    );
    const yr0 = result.years[0];
    // Employee contribution: $100k × 5% = $5k
    // Agency match: 100% of first 3% + 50% of next 2%
    //             = $3k + $1k = $4k
    expect(yr0.agencyMatch).toBeCloseTo(4_000, 0);
  });

  it('splits Traditional/Roth correctly for employee contributions', () => {
    const result = projectPreRetirementTSP(
      100_000,
      0.50,      // 50/50 split initially
      100_000,
      0.02,
      0.06,
      true,      // Roth contributions
      0.07,
      1,
    );
    const yr0 = result.years[0];
    // Employee contribution should be to Roth
    // Agency contributions (auto + match) should be to Traditional
    const totalTrad = yr0.agencyAutomatic + yr0.agencyMatch;
    const totalEmpl = yr0.employeeContribution;
    expect(yr0.traditionalBalance).toBeGreaterThan(100_000 * 0.50 + totalTrad);
    expect(yr0.rothBalance).toBeGreaterThan(100_000 * 0.50 + totalEmpl);
  });

  it('compounds growth within each year', () => {
    const result = projectPreRetirementTSP(
      1_000_000,
      0.70,
      100_000,
      0.02,
      0.05,
      false,
      0.08,     // 8% growth
      1,
    );
    const yr0 = result.years[0];
    // With ~$11k contributions and 8% growth on starting balance
    // Balance should grow significantly
    expect(yr0.growthAmount).toBeGreaterThan(0);
    expect(yr0.endingBalance).toBeGreaterThan(yr0.startingBalance + yr0.totalContribution);
  });

  it('final balance is sum of Traditional and Roth', () => {
    const result = projectPreRetirementTSP(
      100_000,
      0.70,
      80_000,
      0.03,
      0.05,
      false,
      0.07,
      10,
    );
    const sumBalances = result.finalTraditionalBalance + result.finalRothBalance;
    expect(result.finalBalance).toBeCloseTo(sumBalances, 0);
  });

  it('handles zero starting balance', () => {
    const result = projectPreRetirementTSP(
      0,
      0.70,
      100_000,
      0.02,
      0.05,
      false,
      0.07,
      5,
    );
    expect(result.finalBalance).toBeGreaterThan(0);
    expect(result.years[0].startingBalance).toBe(0);
  });

  it('balance grows each year', () => {
    const result = projectPreRetirementTSP(
      100_000,
      0.70,
      100_000,
      0.02,
      0.05,
      false,
      0.07,
      10,
    );
    for (let i = 1; i < result.years.length; i++) {
      expect(result.years[i].endingBalance).toBeGreaterThan(result.years[i - 1].endingBalance);
    }
  });
});
