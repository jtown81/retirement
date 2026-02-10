import { describe, it, expect } from 'vitest';
import { projectTraditionalBalance, projectTraditionalDetailed } from '../../../src/modules/tsp/traditional';
import { projectRothBalance, projectRothDetailed } from '../../../src/modules/tsp/roth';

describe('projectTraditionalBalance', () => {
  it('returns opening balance when years = 0', () => {
    expect(projectTraditionalBalance(100_000, 10_000, 5_000, 0.07, 0)).toBe(100_000);
  });

  it('grows balance with no contributions', () => {
    // 100k × 1.07 = 107,000
    const result = projectTraditionalBalance(100_000, 0, 0, 0.07, 1);
    expect(result).toBeCloseTo(107_000);
  });

  it('adds contributions at mid-year rate', () => {
    // 0 balance, 10k contrib, 0% growth → 10k exactly
    expect(projectTraditionalBalance(0, 10_000, 0, 0, 1)).toBeCloseTo(10_000);
  });

  it('compounds over multiple years', () => {
    const result = projectTraditionalBalance(0, 10_000, 5_000, 0.07, 10);
    expect(result).toBeGreaterThan(150_000); // sanity: 10 years of contributions + growth
    expect(result).toBeLessThan(300_000);
  });

  it('throws for negative years', () => {
    expect(() => projectTraditionalBalance(0, 0, 0, 0.07, -1)).toThrow(RangeError);
  });

  it('throws for growth rate < -1', () => {
    expect(() => projectTraditionalBalance(0, 0, 0, -1.5, 5)).toThrow(RangeError);
  });
});

describe('projectRothBalance', () => {
  it('returns opening balance when years = 0', () => {
    expect(projectRothBalance(50_000, 5_000, 0.07, 0)).toBe(50_000);
  });

  it('does not include agency contributions', () => {
    // Roth projection with same inputs should be LESS than Traditional (no agency match)
    const roth = projectRothBalance(0, 10_000, 0.07, 10);
    const trad = projectTraditionalBalance(0, 10_000, 5_000, 0.07, 10);
    expect(roth).toBeLessThan(trad);
  });

  it('grows balance with no contributions', () => {
    expect(projectRothBalance(100_000, 0, 0.07, 1)).toBeCloseTo(107_000);
  });

  it('matches Traditional projection math when agency = 0', () => {
    const roth = projectRothBalance(50_000, 8_000, 0.05, 5);
    const trad = projectTraditionalBalance(50_000, 8_000, 0, 0.05, 5);
    expect(roth).toBeCloseTo(trad, 2);
  });

  it('throws for negative years', () => {
    expect(() => projectRothBalance(0, 0, 0.07, -1)).toThrow(RangeError);
  });
});

describe('projectTraditionalDetailed', () => {
  const BASE = {
    openingBalance: 0,
    annualSalary: 100_000,
    employeeAnnualContribution: 10_000,
    employeeContributionPct: 0.10,
    growthRate: 0.07,
    years: 3,
    startYear: 2025,
    isCatchUpEligible: false,
  };

  it('returns one entry per year', () => {
    const result = projectTraditionalDetailed(BASE);
    expect(result).toHaveLength(3);
  });

  it('calendar years are sequential', () => {
    const result = projectTraditionalDetailed(BASE);
    expect(result.map((r) => r.year)).toEqual([2025, 2026, 2027]);
  });

  it('agency contribution is always positive (automatic 1%)', () => {
    const result = projectTraditionalDetailed(BASE);
    for (const yr of result) {
      expect(yr.agencyContribution).toBeGreaterThan(0);
    }
  });

  it('closing balance of year N equals opening balance of year N+1', () => {
    const result = projectTraditionalDetailed(BASE);
    expect(result[1].openingBalance).toBeCloseTo(result[0].closingBalance, 2);
    expect(result[2].openingBalance).toBeCloseTo(result[1].closingBalance, 2);
  });

  it('enforces IRS contribution cap', () => {
    const overLimit = {
      ...BASE,
      employeeAnnualContribution: 999_999,
    };
    const result = projectTraditionalDetailed(overLimit);
    expect(result[0].employeeContribution).toBe(23500); // 2025 limit
  });
});

describe('projectRothDetailed', () => {
  it('agency contribution is never included in Roth projection', () => {
    const result = projectRothDetailed({
      openingBalance: 0,
      employeeAnnualContribution: 10_000,
      growthRate: 0.07,
      years: 3,
      startYear: 2025,
      isCatchUpEligible: false,
    });
    // Roth snapshots have no agencyContribution field — employee only
    for (const yr of result) {
      expect(yr).not.toHaveProperty('agencyContribution');
    }
  });

  it('enforces combined Traditional + Roth limit', () => {
    // Traditional takes 23500 (full 2025 limit), Roth should get 0
    const result = projectRothDetailed({
      openingBalance: 0,
      employeeAnnualContribution: 10_000,
      growthRate: 0.07,
      years: 1,
      startYear: 2025,
      isCatchUpEligible: false,
      traditionalEmployeeContribution: 23500,
    });
    expect(result[0].employeeContribution).toBe(0);
  });
});
