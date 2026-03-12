import { describe, it, expect } from 'vitest';
import { computeAgencyMatch } from '../../../src/modules/tsp/agency-match';

describe('computeAgencyMatch', () => {
  const SALARY = 100_000;

  it('pays 1% automatic contribution when employee contributes nothing', () => {
    const result = computeAgencyMatch(SALARY, 0);
    expect(result.automaticContribution).toBe(1000);
    expect(result.matchingContribution).toBe(0);
    expect(result.totalAgencyContribution).toBe(1000);
  });

  it('matches 100% on first 3% of employee contribution', () => {
    const result = computeAgencyMatch(SALARY, 0.03);
    expect(result.automaticContribution).toBe(1000);
    expect(result.matchingContribution).toBe(3000); // 3% × 100%
    expect(result.totalAgencyContribution).toBe(4000);
  });

  it('matches 50% on next 2% (3–5% range)', () => {
    const result = computeAgencyMatch(SALARY, 0.04);
    // tier1: 3% × 100% = 3000; tier2: 1% × 50% = 500
    expect(result.matchingContribution).toBeCloseTo(3500);
    expect(result.totalAgencyContribution).toBeCloseTo(4500);
  });

  it('caps at 5% total agency contribution (1% auto + 4% match) at 5%+ employee contribution', () => {
    const result = computeAgencyMatch(SALARY, 0.05);
    expect(result.automaticContribution).toBe(1000);
    expect(result.matchingContribution).toBe(4000); // 3% × 100% + 2% × 50% = 4000
    expect(result.totalAgencyContribution).toBe(5000);
  });

  it('no additional match above 5% employee contribution', () => {
    const at5 = computeAgencyMatch(SALARY, 0.05);
    const at10 = computeAgencyMatch(SALARY, 0.10);
    expect(at5.totalAgencyContribution).toBe(at10.totalAgencyContribution);
  });

  it('returns correct amounts at max (100%) contribution', () => {
    const result = computeAgencyMatch(SALARY, 1.0);
    expect(result.totalAgencyContribution).toBe(5000); // same cap as 5%
  });

  it('scales proportionally with salary', () => {
    const r50k = computeAgencyMatch(50_000, 0.05);
    const r100k = computeAgencyMatch(100_000, 0.05);
    expect(r100k.totalAgencyContribution).toBeCloseTo(r50k.totalAgencyContribution * 2);
  });

  it('throws for negative salary', () => {
    expect(() => computeAgencyMatch(-1, 0.05)).toThrow(RangeError);
  });

  it('throws for contribution percentage outside 0–1', () => {
    expect(() => computeAgencyMatch(SALARY, -0.01)).toThrow(RangeError);
    expect(() => computeAgencyMatch(SALARY, 1.01)).toThrow(RangeError);
  });

  it('works with zero salary', () => {
    const result = computeAgencyMatch(0, 0.05);
    expect(result.totalAgencyContribution).toBe(0);
  });
});
