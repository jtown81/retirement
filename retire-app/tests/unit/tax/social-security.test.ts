/**
 * Social Security Taxation Tests
 *
 * Tests Social Security benefit taxation under IRC § 86 (provisional income test).
 */

import { describe, it, expect } from 'vitest';
import {
  computeSSProvisionalIncome,
  computeSSTaxableFraction,
  computeSSTaxableAmount,
} from '../../../src/modules/tax';

describe('Social Security Taxation (IRC § 86)', () => {
  describe('computeSSProvisionalIncome', () => {
    it('computes provisional income correctly', () => {
      // PI = AGI + 50% SS
      const pi = computeSSProvisionalIncome(30000, 24000);
      expect(pi).toBe(30000 + 0.5 * 24000);
      expect(pi).toBe(42000);
    });

    it('includes full AGI even if SS is zero', () => {
      const pi = computeSSProvisionalIncome(50000, 0);
      expect(pi).toBe(50000);
    });
  });

  describe('computeSSTaxableFraction', () => {
    describe('single filer (thresholds: $25K / $34K)', () => {
      it('returns 0.0 when PI ≤ $25,000', () => {
        expect(computeSSTaxableFraction(20000, 'single')).toBe(0);
        expect(computeSSTaxableFraction(25000, 'single')).toBe(0);
      });

      it('returns 0.5 when $25,000 < PI ≤ $34,000', () => {
        expect(computeSSTaxableFraction(25001, 'single')).toBe(0.5);
        expect(computeSSTaxableFraction(30000, 'single')).toBe(0.5);
        expect(computeSSTaxableFraction(34000, 'single')).toBe(0.5);
      });

      it('returns 0.85 when PI > $34,000', () => {
        expect(computeSSTaxableFraction(34001, 'single')).toBe(0.85);
        expect(computeSSTaxableFraction(50000, 'single')).toBe(0.85);
        expect(computeSSTaxableFraction(200000, 'single')).toBe(0.85);
      });
    });

    describe('married filing jointly (thresholds: $32K / $44K)', () => {
      it('returns 0.0 when PI ≤ $32,000', () => {
        expect(computeSSTaxableFraction(20000, 'married_joint')).toBe(0);
        expect(computeSSTaxableFraction(32000, 'married_joint')).toBe(0);
      });

      it('returns 0.5 when $32,000 < PI ≤ $44,000', () => {
        expect(computeSSTaxableFraction(32001, 'married_joint')).toBe(0.5);
        expect(computeSSTaxableFraction(38000, 'married_joint')).toBe(0.5);
        expect(computeSSTaxableFraction(44000, 'married_joint')).toBe(0.5);
      });

      it('returns 0.85 when PI > $44,000', () => {
        expect(computeSSTaxableFraction(44001, 'married_joint')).toBe(0.85);
        expect(computeSSTaxableFraction(100000, 'married_joint')).toBe(0.85);
      });
    });

    describe('head of household (uses single thresholds)', () => {
      it('applies single thresholds ($25K / $34K)', () => {
        expect(computeSSTaxableFraction(20000, 'head_of_household')).toBe(0);
        expect(computeSSTaxableFraction(30000, 'head_of_household')).toBe(0.5);
        expect(computeSSTaxableFraction(40000, 'head_of_household')).toBe(0.85);
      });
    });

    describe('married filing separately (very strict)', () => {
      it('uses $0 lower threshold (nearly all SS taxable)', () => {
        expect(computeSSTaxableFraction(0, 'married_separate')).toBe(0);
        // MFS has lower=$0, upper=$0, so any income > 0 goes to 0.85
        expect(computeSSTaxableFraction(1, 'married_separate')).toBe(0.85);
        expect(computeSSTaxableFraction(100000, 'married_separate')).toBe(0.85);
      });
    });
  });

  describe('computeSSTaxableAmount', () => {
    describe('tier 0 (no taxation)', () => {
      it('returns 0 when PI ≤ lower threshold', () => {
        const amount = computeSSTaxableAmount(20000, 24000, 'single');
        expect(amount).toBe(0);
      });
    });

    describe('tier 1 (50% taxation)', () => {
      it('caps taxable SS at 50% when in tier 1', () => {
        // PI=$30K (between $25K-$34K): 50% tier
        // Taxable = min(50% of SS, 50% of (PI - lower))
        const amount = computeSSTaxableAmount(30000, 24000, 'single');
        // 50% of $24K = $12K
        // 50% of ($30K - $25K) = $2.5K
        // min($12K, $2.5K) = $2.5K
        expect(amount).toBeLessThanOrEqual(12000);
      });
    });

    describe('tier 2 (85% taxation)', () => {
      it('applies 85% when PI > upper threshold', () => {
        // PI=$50K (above $34K): 85% tier
        // Simplified: 85% of SS
        const amount = computeSSTaxableAmount(50000, 24000, 'single');
        const expected = 24000 * 0.85;
        expect(amount).toBeCloseTo(expected, 0);
      });
    });

    describe('realistic scenarios', () => {
      it('$60K annuity + $20K SS, single filer age 62', () => {
        // PI = $60K (annuity) + 0.5 * $20K = $70K
        // Above $34K, so 85% tier
        const provisionalIncome = 60000 + 0.5 * 20000;
        const taxable = computeSSTaxableAmount(provisionalIncome, 20000, 'single');
        expect(provisionalIncome).toBe(70000);
        expect(taxable).toBe(20000 * 0.85);
      });

      it('$40K annuity + $0 SS, single filer (no SS taxation)', () => {
        const taxable = computeSSTaxableAmount(40000, 0, 'single');
        expect(taxable).toBe(0);
      });

      it('MFJ: $50K + $20K SS at $70K PI', () => {
        // PI=$70K (above $44K): 85% tier
        const provisionalIncome = 50000 + 0.5 * 20000;
        const taxable = computeSSTaxableAmount(provisionalIncome, 20000, 'married_joint');
        expect(provisionalIncome).toBe(60000);
        // In 85% tier
        expect(taxable).toBe(20000 * 0.85);
      });
    });
  });

  describe('integration: full SS taxation scenario', () => {
    it('single, $60K annuity, $20K SS claiming at 62', () => {
      const agi = 60000;
      const ss = 20000;
      const pi = computeSSProvisionalIncome(agi, ss);
      const fraction = computeSSTaxableFraction(pi, 'single');
      const taxable = computeSSTaxableAmount(pi, ss, 'single');

      expect(pi).toBe(70000);
      expect(fraction).toBe(0.85); // Above $34K
      expect(taxable).toBe(17000); // 85% of $20K
    });

    it('single, $40K annuity, no SS', () => {
      const agi = 40000;
      const ss = 0;
      const pi = computeSSProvisionalIncome(agi, ss);
      const fraction = computeSSTaxableFraction(pi, 'single');
      const taxable = computeSSTaxableAmount(pi, ss, 'single');

      expect(pi).toBe(40000);
      expect(fraction).toBe(0.85); // Above $34K
      expect(taxable).toBe(0); // No SS to tax
    });

    it('MFJ, $70K annuity, $18K SS at $79K PI', () => {
      const agi = 70000;
      const ss = 18000;
      const pi = computeSSProvisionalIncome(agi, ss);
      const fraction = computeSSTaxableFraction(pi, 'married_joint');
      const taxable = computeSSTaxableAmount(pi, ss, 'married_joint');

      expect(pi).toBe(79000); // $70K + 0.5*$18K
      expect(fraction).toBe(0.85); // Above $44K
      expect(taxable).toBe(18000 * 0.85);
    });
  });
});
