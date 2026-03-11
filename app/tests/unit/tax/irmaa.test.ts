/**
 * IRMAA (Income-Related Monthly Adjustment Amount) Tests
 *
 * Tests Medicare Part B and Part D premium surcharges per 42 U.S.C. § 1395r.
 */

import { describe, it, expect } from 'vitest';
import { computeIRMAASurcharge, getIRMAATier } from '../../../src/modules/tax';

describe('IRMAA Surcharges (2025)', () => {
  describe('computeIRMAASurcharge', () => {
    it('returns 0 for beneficiaries under age 65', () => {
      const surcharge = computeIRMAASurcharge(200000, 2025, 'single', 64);
      expect(surcharge).toBe(0);
    });

    it('returns 0 at or below income threshold', () => {
      // Single: $97K threshold
      expect(computeIRMAASurcharge(97000, 2025, 'single', 65)).toBe(0);
      expect(computeIRMAASurcharge(90000, 2025, 'single', 65)).toBe(0);
    });

    describe('single filer (2025 thresholds)', () => {
      it('applies Tier 1 surcharge: $97,001–$123,000', () => {
        // Tier 1: $70 Part B + $12.60 Part D = $82.60/month
        const surcharge = computeIRMAASurcharge(100000, 2025, 'single', 65);
        const expected = (70 + 12.60) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });

      it('applies Tier 2 surcharge: $123,001–$153,000', () => {
        // Tier 2: $175 Part B + $32.50 Part D = $207.50/month
        const surcharge = computeIRMAASurcharge(130000, 2025, 'single', 65);
        const expected = (175 + 32.50) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });

      it('applies Tier 3 surcharge: $153,001–$183,000', () => {
        // Tier 3: $280 Part B + $52.00 Part D = $332/month
        const surcharge = computeIRMAASurcharge(160000, 2025, 'single', 65);
        const expected = (280 + 52) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });

      it('applies Tier 4 surcharge: $183,001–$213,000', () => {
        // Tier 4: $385 Part B + $71.50 Part D = $456.50/month
        const surcharge = computeIRMAASurcharge(200000, 2025, 'single', 65);
        const expected = (385 + 71.50) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });

      it('applies Tier 5 surcharge: > $213,000', () => {
        // Tier 5: $490 Part B + $91.00 Part D = $581/month
        const surcharge = computeIRMAASurcharge(300000, 2025, 'single', 65);
        const expected = (490 + 91) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });
    });

    describe('married filing jointly (2025 thresholds)', () => {
      it('applies Tier 0 (no surcharge) at or below $194,000', () => {
        expect(computeIRMAASurcharge(194000, 2025, 'married_joint', 65)).toBe(0);
        expect(computeIRMAASurcharge(180000, 2025, 'married_joint', 65)).toBe(0);
      });

      it('applies Tier 1 surcharge: $194,001–$246,000', () => {
        // Tier 1: $70 Part B + $12.60 Part D = $82.60/month
        const surcharge = computeIRMAASurcharge(220000, 2025, 'married_joint', 65);
        const expected = (70 + 12.60) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });

      it('applies Tier 2 surcharge: $246,001–$306,000', () => {
        // Tier 2: $175 Part B + $32.50 Part D = $207.50/month
        const surcharge = computeIRMAASurcharge(270000, 2025, 'married_joint', 65);
        const expected = (175 + 32.50) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });

      it('applies highest tier surcharge above $426,000', () => {
        // Tier 5: $490 Part B + $91.00 Part D
        const surcharge = computeIRMAASurcharge(500000, 2025, 'married_joint', 65);
        const expected = (490 + 91) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });
    });

    describe('realistic retirement scenarios', () => {
      it('$60K annuity + $20K TSP + $20K SS = $100K, age 65, single', () => {
        const income = 60000 + 20000 + 20000;
        const surcharge = computeIRMAASurcharge(income, 2025, 'single', 65);
        // $100K is in Tier 1 ($97K–$123K): $82.60/month
        const expected = (70 + 12.60) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });

      it('$80K annuity + $30K TSP + $20K SS = $130K, age 70, single', () => {
        const income = 80000 + 30000 + 20000;
        const surcharge = computeIRMAASurcharge(income, 2025, 'single', 70);
        // $130K is in Tier 2 ($123K–$153K): $207.50/month
        const expected = (175 + 32.50) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });

      it('married couple, $100K annuity + $40K TSP = $140K MAGI, both age 65', () => {
        const income = 100000 + 40000;
        const surcharge = computeIRMAASurcharge(income, 2025, 'married_joint', 65);
        // $140K is below MFJ Tier 1 threshold ($194K): no surcharge
        expect(surcharge).toBe(0);
      });

      it('married couple, $150K annuity + $100K TSP = $250K MAGI, both age 65', () => {
        const income = 150000 + 100000;
        const surcharge = computeIRMAASurcharge(income, 2025, 'married_joint', 65);
        // $250K is in MFJ Tier 2 ($246K–$306K): $207.50/month
        const expected = (175 + 32.50) * 12;
        expect(surcharge).toBeCloseTo(expected, 0);
      });
    });
  });

  describe('getIRMAATier', () => {
    it('returns tier index for single filer', () => {
      expect(getIRMAATier(90000, 2025, 'single')).toBe(0); // No surcharge
      expect(getIRMAATier(110000, 2025, 'single')).toBe(1); // Tier 1
      expect(getIRMAATier(140000, 2025, 'single')).toBe(2); // Tier 2
    });

    it('returns tier index for married filing jointly', () => {
      expect(getIRMAATier(180000, 2025, 'married_joint')).toBe(0); // No surcharge
      expect(getIRMAATier(220000, 2025, 'married_joint')).toBe(1); // Tier 1
      expect(getIRMAATier(280000, 2025, 'married_joint')).toBe(2); // Tier 2
    });

    it('returns highest tier for very high income', () => {
      const maxTier = getIRMAATier(5000000, 2025, 'single');
      expect(maxTier).toBe(5); // Highest tier
    });
  });

  describe('edge cases', () => {
    it('handles boundary income exactly at threshold', () => {
      // Single, at Tier 1 boundary ($123,000)
      const surcharge1 = computeIRMAASurcharge(123000, 2025, 'single', 65);
      // At threshold, applies Tier 1 surcharge
      const expected1 = (70 + 12.60) * 12;
      expect(surcharge1).toBeCloseTo(expected1, 0);

      // Single, just above Tier 1 start
      const surcharge2 = computeIRMAASurcharge(123001, 2025, 'single', 65);
      expect(surcharge2).toBeGreaterThan(0);
    });

    it('age 65 exactly applies IRMAA', () => {
      const surcharge = computeIRMAASurcharge(100000, 2025, 'single', 65);
      expect(surcharge).toBeGreaterThan(0);
    });

    it('age 64 does not apply IRMAA', () => {
      const surcharge = computeIRMAASurcharge(100000, 2025, 'single', 64);
      expect(surcharge).toBe(0);
    });
  });
});
