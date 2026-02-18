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

  it('includes rmdAmount and actualWithdrawal in yearByYear', () => {
    const result = projectTSPDepletion(500_000, 20_000, 0.05, 65);
    for (const year of result.yearByYear) {
      expect(year).toHaveProperty('rmdAmount');
      expect(year).toHaveProperty('actualWithdrawal');
      expect(typeof year.rmdAmount).toBe('number');
      expect(typeof year.actualWithdrawal).toBe('number');
    }
  });

  it('computes RMD at age 73 when birthYear provided (born before 1960)', () => {
    // Employee born in 1959 → RMD starts at age 73
    // Retirement at 65 means RMD starts 8 years later
    const result = projectTSPDepletion(1_000_000, 30_000, 0.05, 65, undefined, 1959);
    const age73 = result.yearByYear.find((y) => y.age === 73);
    expect(age73).toBeDefined();
    // RMD at age 73 with $1M traditional balance (approx) should be > 0
    expect(age73!.rmdAmount).toBeGreaterThan(0);
    // Actual withdrawal should be at least the RMD
    expect(age73!.actualWithdrawal).toBeGreaterThanOrEqual(age73!.rmdAmount);
  });

  it('does not compute RMD before age 73 when birthYear provided (born before 1960)', () => {
    const result = projectTSPDepletion(1_000_000, 30_000, 0.05, 65, undefined, 1959);
    // RMD age is 73, so ages 65–72 should have rmdAmount = 0
    for (const year of result.yearByYear) {
      if (year.age < 73) {
        expect(year.rmdAmount).toBe(0);
      }
    }
  });

  it('computes RMD at age 75 when birthYear provided (born 1960+)', () => {
    // Employee born in 1960 → RMD starts at age 75
    const result = projectTSPDepletion(1_000_000, 30_000, 0.05, 65, undefined, 1960);
    const age75 = result.yearByYear.find((y) => y.age === 75);
    expect(age75).toBeDefined();
    expect(age75!.rmdAmount).toBeGreaterThan(0);
  });

  it('does not enforce RMD when birthYear is not provided', () => {
    // Without birthYear, all rmdAmount should be 0, and actualWithdrawal should equal planned
    const result = projectTSPDepletion(1_000_000, 30_000, 0.05, 65);
    // First entry (retirement age) has no withdrawal
    expect(result.yearByYear[0].rmdAmount).toBe(0);
    expect(result.yearByYear[0].actualWithdrawal).toBe(0);
    // Subsequent years should have no RMD and withdrawal = planned
    for (let i = 1; i < result.yearByYear.length; i++) {
      const year = result.yearByYear[i];
      expect(year.rmdAmount).toBe(0);
      expect(year.actualWithdrawal).toBe(30_000); // Just the planned withdrawal
    }
  });

  it('RMD floor causes higher withdrawal when RMD > planned', () => {
    // Large balance, small planned withdrawal → RMD should exceed withdrawal
    const result = projectTSPDepletion(5_000_000, 10_000, 0.05, 65, undefined, 1959);
    const age73 = result.yearByYear.find((y) => y.age === 73);
    expect(age73).toBeDefined();
    // RMD from $5M balance at age 73 should be much larger than $10k planned
    expect(age73!.rmdAmount).toBeGreaterThan(100_000);
    expect(age73!.actualWithdrawal).toBe(age73!.rmdAmount);
  });

  it('planned withdrawal exceeds RMD when contribution rate is high', () => {
    // Large planned withdrawal, reasonable balance → planned exceeds RMD
    const result = projectTSPDepletion(500_000, 100_000, 0.05, 65, undefined, 1959);
    const age73 = result.yearByYear.find((y) => y.age === 73);
    expect(age73).toBeDefined();
    // Planned withdrawal ($100k) should exceed RMD from ~$650k balance
    expect(age73!.actualWithdrawal).toBeGreaterThanOrEqual(age73!.rmdAmount);
  });
});

describe('projectPreRetirementTSP (Phase D)', () => {
  it('returns correct number of years', () => {
    const result = projectPreRetirementTSP(
      100_000,   // currentBalance
      0.70,      // traditionalPct (of existing balance)
      80_000,    // annualSalary
      0.03,      // salaryGrowthRate
      0.06,      // traditionalContribPct (6% to Traditional)
      0.00,      // rothContribPct (0% to Roth)
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
      0.05,      // 5% Traditional contribution
      0.00,      // 0% Roth contribution
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
      0.05,      // 5% Traditional
      0.00,      // 0% Roth
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
      0.05,      // 5% Traditional contribution
      0.00,      // 0% Roth contribution
      0.07,
      1,
    );
    const yr0 = result.years[0];
    // Employee contribution: $100k × 5% = $5k (total)
    // Agency match: 100% of first 3% + 50% of next 2%
    //             = $3k + $1k = $4k
    expect(yr0.agencyMatch).toBeCloseTo(4_000, 0);
  });

  it('splits Traditional/Roth correctly for employee contributions', () => {
    const result = projectPreRetirementTSP(
      100_000,
      0.50,      // 50/50 split of existing balance
      100_000,
      0.02,
      0.00,      // 0% Traditional (all Roth)
      0.06,      // 6% Roth contributions
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
      0.05,      // 5% Traditional
      0.00,      // 0% Roth
      0.08,      // 8% growth
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
      0.05,      // 5% Traditional
      0.00,      // 0% Roth
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
      0.05,      // 5% Traditional
      0.00,      // 0% Roth
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
      0.05,      // 5% Traditional
      0.00,      // 0% Roth
      0.07,
      10,
    );
    for (let i = 1; i < result.years.length; i++) {
      expect(result.years[i].endingBalance).toBeGreaterThan(result.years[i - 1].endingBalance);
    }
  });
});
