import { describe, it, expect } from 'vitest';
import { computeTSPFutureValue, projectTSPDepletion } from '../../../src/modules/tsp/future-value';

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
