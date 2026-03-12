import { describe, it, expect } from 'vitest';
import { getTSPLimits, clampToContributionLimit } from '../../../src/data/tsp-limits';

describe('getTSPLimits', () => {
  it('returns correct 2024 limits', () => {
    const limits = getTSPLimits(2024);
    expect(limits.electiveDeferralLimit).toBe(23000);
    expect(limits.catchUpLimit).toBe(7500);
  });

  it('returns correct 2025 limits', () => {
    const limits = getTSPLimits(2025);
    expect(limits.electiveDeferralLimit).toBe(23500);
  });

  it('falls back to earliest year for pre-table years', () => {
    const limits = getTSPLimits(1990);
    expect(limits.year).toBe(2020);
  });

  it('falls back to latest year for post-table years', () => {
    const limits = getTSPLimits(2099);
    expect(limits.year).toBe(2045);
  });
});

describe('clampToContributionLimit', () => {
  it('returns intended amount when under the limit', () => {
    expect(clampToContributionLimit(10000, 2024, false)).toBe(10000);
  });

  it('caps at elective deferral limit without catch-up', () => {
    expect(clampToContributionLimit(99999, 2024, false)).toBe(23000);
  });

  it('allows catch-up on top of base limit for age 50+', () => {
    expect(clampToContributionLimit(99999, 2024, true)).toBe(23000 + 7500);
  });

  it('does not apply catch-up when ineligible', () => {
    expect(clampToContributionLimit(99999, 2024, false)).toBe(23000);
  });

  it('throws for negative intended contribution', () => {
    expect(() => clampToContributionLimit(-1, 2024, false)).toThrow(RangeError);
  });

  it('returns zero for zero contribution', () => {
    expect(clampToContributionLimit(0, 2024, false)).toBe(0);
  });
});
