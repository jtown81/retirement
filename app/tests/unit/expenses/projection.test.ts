/**
 * Combined expense projection: categories + smile curve + inflation.
 *
 * Simulates a 30-year retirement horizon for a typical federal retiree
 * with a $60,000/year baseline expense profile.
 */

import { describe, it, expect } from 'vitest';
import { totalAnnualExpenses } from '../../../src/modules/expenses/categories';
import { applySmileCurve, defaultSmileCurveParams } from '../../../src/modules/expenses/smile-curve';
import { adjustForInflation } from '../../../src/modules/expenses/inflation';
import type { ExpenseProfile } from '../../../src/models/expenses';

const PROFILE: ExpenseProfile = {
  id: 'combined-test',
  baseYear: 2026,
  categories: [
    { name: 'housing', annualAmount: 20_000 },
    { name: 'food', annualAmount: 10_000 },
    { name: 'healthcare', annualAmount: 8_000 },
    { name: 'transportation', annualAmount: 5_000 },
    { name: 'travel-leisure', annualAmount: 8_000 },
    { name: 'utilities', annualAmount: 4_000 },
    { name: 'insurance', annualAmount: 3_000 },
    { name: 'personal-care', annualAmount: 1_000 },
    { name: 'gifts-charitable', annualAmount: 1_000 },
  ],
  inflationRate: 0.025,
  smileCurveEnabled: true,
  smileCurveParams: defaultSmileCurveParams,
};

describe('Combined expense projection', () => {
  it('base annual total is $60,000', () => {
    expect(totalAnnualExpenses(PROFILE)).toBe(60_000);
  });

  it('year 0: smile curve = 1.0, inflation = 0 → equals base', () => {
    const base = totalAnnualExpenses(PROFILE);
    const adjusted = applySmileCurve(base, 0);
    expect(adjusted).toBe(base);
  });

  it('year 15: spending is reduced (mid-dip)', () => {
    const base = totalAnnualExpenses(PROFILE);
    const smileAdjusted = applySmileCurve(base, 15); // 60k × 0.85 = 51k before inflation
    const withInflation = adjustForInflation(smileAdjusted, 15, PROFILE.inflationRate);
    // Smile reduces spending, but inflation grows it. Net should be between 51k and 80k.
    expect(withInflation).toBeGreaterThan(51_000);
    expect(withInflation).toBeLessThan(80_000);
  });

  it('year 30: spending is partially recovered (late phase)', () => {
    const base = totalAnnualExpenses(PROFILE);
    const yr15 = applySmileCurve(base, 15);
    const yr30 = applySmileCurve(base, 30);
    // Late multiplier (0.95) > mid multiplier (0.85) in nominal terms
    expect(yr30).toBeGreaterThan(yr15);
  });

  it('inflation dominates over long horizon — year 30 real cost > year 0', () => {
    const base = totalAnnualExpenses(PROFILE);
    const yr30SmileOnly = applySmileCurve(base, 30); // 60k × 0.95 = 57k
    const yr30WithInflation = adjustForInflation(yr30SmileOnly, 30, PROFILE.inflationRate);
    expect(yr30WithInflation).toBeGreaterThan(base);
  });

  it('produces a monotonically non-decreasing series when smile is off (inflation only)', () => {
    const base = totalAnnualExpenses(PROFILE);
    let prev = base;
    for (let yr = 1; yr <= 30; yr++) {
      const inflated = adjustForInflation(base, yr, PROFILE.inflationRate);
      expect(inflated).toBeGreaterThanOrEqual(prev);
      prev = inflated;
    }
  });
});
