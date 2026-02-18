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
    expect(clampToContributionLimit(10000, 2024, 45)).toBe(10000);
  });

  it('caps at elective deferral limit for age below 50', () => {
    expect(clampToContributionLimit(99999, 2024, 45)).toBe(23000);
  });

  it('allows standard catch-up for age 50+ before 2025', () => {
    expect(clampToContributionLimit(99999, 2024, 50)).toBe(23000 + 7500);
  });

  it('does not apply catch-up for age below 50', () => {
    expect(clampToContributionLimit(99999, 2024, 45)).toBe(23000);
  });

  it('applies standard catch-up for age 59 in 2025 (not enhanced)', () => {
    expect(clampToContributionLimit(99999, 2025, 59)).toBe(23500 + 7500);
  });

  it('applies enhanced catch-up for age 60 in 2025 (SECURE 2.0)', () => {
    expect(clampToContributionLimit(99999, 2025, 60)).toBe(23500 + 11250);
  });

  it('applies enhanced catch-up for age 63 in 2025 (SECURE 2.0)', () => {
    expect(clampToContributionLimit(99999, 2025, 63)).toBe(23500 + 11250);
  });

  it('applies standard catch-up for age 64 in 2025 (not enhanced)', () => {
    expect(clampToContributionLimit(99999, 2025, 64)).toBe(23500 + 7500);
  });

  it('does not apply enhanced catch-up for age 60 in 2024 (pre-SECURE 2.0)', () => {
    expect(clampToContributionLimit(99999, 2024, 60)).toBe(23000 + 7500);
  });

  it('throws for negative intended contribution', () => {
    expect(() => clampToContributionLimit(-1, 2024, 45)).toThrow(RangeError);
  });

  it('returns zero for zero contribution', () => {
    expect(clampToContributionLimit(0, 2024, 45)).toBe(0);
  });
});
