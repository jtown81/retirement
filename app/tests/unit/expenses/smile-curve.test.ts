import { describe, it, expect } from 'vitest';
import {
  smileCurveMultiplier,
  applySmileCurve,
  defaultSmileCurveParams,
  validateSmileCurveParams,
} from '../../../src/modules/expenses/smile-curve';

describe('smileCurveMultiplier — default params (early=1.0, mid=0.85@15, late=0.95@30)', () => {
  it('returns earlyMultiplier at year 0', () => {
    expect(smileCurveMultiplier(0)).toBe(1.0);
  });

  it('returns midMultiplier at midDipYear (year 15)', () => {
    expect(smileCurveMultiplier(15)).toBeCloseTo(0.85);
  });

  it('returns lateMultiplier at 2×midDipYear (year 30)', () => {
    expect(smileCurveMultiplier(30)).toBeCloseTo(0.95);
  });

  it('holds lateMultiplier constant beyond 2×midDipYear', () => {
    expect(smileCurveMultiplier(31)).toBeCloseTo(0.95);
    expect(smileCurveMultiplier(50)).toBeCloseTo(0.95);
  });

  it('interpolates correctly at midpoint of segment 1 (year 7.5)', () => {
    // Halfway between early=1.0 and mid=0.85 → 0.925
    expect(smileCurveMultiplier(7.5)).toBeCloseTo(0.925);
  });

  it('interpolates correctly at midpoint of segment 2 (year 22.5)', () => {
    // Halfway between mid=0.85 and late=0.95 → 0.90
    expect(smileCurveMultiplier(22.5)).toBeCloseTo(0.90);
  });

  it('multiplier is below 1.0 between year 1 and year 29 (smile shape)', () => {
    for (let yr = 1; yr < 30; yr++) {
      expect(smileCurveMultiplier(yr)).toBeLessThan(1.0);
    }
  });

  it('throws for negative yearsIntoRetirement', () => {
    expect(() => smileCurveMultiplier(-1)).toThrow(RangeError);
  });
});

describe('smileCurveMultiplier — custom params', () => {
  const FLAT: typeof defaultSmileCurveParams = {
    earlyMultiplier: 1.0,
    midMultiplier: 1.0,
    lateMultiplier: 1.0,
    midDipYear: 15,
  };

  it('returns 1.0 at all points when all multipliers are 1.0 (flat curve)', () => {
    expect(smileCurveMultiplier(0, FLAT)).toBe(1.0);
    expect(smileCurveMultiplier(15, FLAT)).toBe(1.0);
    expect(smileCurveMultiplier(30, FLAT)).toBe(1.0);
    expect(smileCurveMultiplier(50, FLAT)).toBe(1.0);
  });

  it('adjustable midDipYear shifts the trough', () => {
    const early10 = { ...defaultSmileCurveParams, midDipYear: 10 };
    expect(smileCurveMultiplier(10, early10)).toBeCloseTo(0.85);
    expect(smileCurveMultiplier(20, early10)).toBeCloseTo(0.95);
  });
});

describe('validateSmileCurveParams', () => {
  it('accepts valid default params', () => {
    expect(() => validateSmileCurveParams(defaultSmileCurveParams)).not.toThrow();
  });

  it('throws for zero earlyMultiplier', () => {
    expect(() =>
      validateSmileCurveParams({ ...defaultSmileCurveParams, earlyMultiplier: 0 }),
    ).toThrow(RangeError);
  });

  it('throws for zero midDipYear', () => {
    expect(() =>
      validateSmileCurveParams({ ...defaultSmileCurveParams, midDipYear: 0 }),
    ).toThrow(RangeError);
  });
});

describe('applySmileCurve', () => {
  const BASE = 60_000;

  it('returns base expenses at year 0 (multiplier = 1.0)', () => {
    expect(applySmileCurve(BASE, 0)).toBe(BASE);
  });

  it('returns reduced expenses at mid-dip year', () => {
    // 60,000 × 0.85 = 51,000
    expect(applySmileCurve(BASE, 15)).toBeCloseTo(51_000);
  });

  it('returns late-retirement expenses at year 30', () => {
    // 60,000 × 0.95 = 57,000
    expect(applySmileCurve(BASE, 30)).toBeCloseTo(57_000);
  });

  it('expenses are lower at mid-dip than at start', () => {
    expect(applySmileCurve(BASE, 15)).toBeLessThan(applySmileCurve(BASE, 0));
  });

  it('expenses recover partially late in retirement', () => {
    expect(applySmileCurve(BASE, 30)).toBeGreaterThan(applySmileCurve(BASE, 15));
  });

  it('handles zero base expenses', () => {
    expect(applySmileCurve(0, 10)).toBe(0);
  });

  it('throws for negative base expenses', () => {
    expect(() => applySmileCurve(-1, 10)).toThrow(RangeError);
  });
});
