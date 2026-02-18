import { describe, it, expect } from 'vitest';
import {
  computeProvisionalIncome,
  computeSSTaxableFraction,
  computeTaxableSS,
  getSSTaxationTier,
  computeSSBenefitTaxation,
} from '@modules/tax';

describe('Social Security Taxation (IRC § 86)', () => {
  describe('computeProvisionalIncome', () => {
    it('calculates provisional income = AGI + exempt interest + 50% of SS', () => {
      const pi = computeProvisionalIncome(50000, 5000, 24000);
      // 50k + 5k + (24k × 0.5) = 50k + 5k + 12k = 67k
      expect(pi).toBe(67000);
    });

    it('handles zero components', () => {
      const pi = computeProvisionalIncome(0, 0, 0);
      expect(pi).toBe(0);
    });

    it('throws for negative AGI', () => {
      expect(() => computeProvisionalIncome(-1000, 0, 0)).toThrow(RangeError);
    });

    it('throws for negative exempt interest', () => {
      expect(() => computeProvisionalIncome(50000, -100, 0)).toThrow(RangeError);
    });

    it('throws for negative SS benefit', () => {
      expect(() => computeProvisionalIncome(50000, 0, -1000)).toThrow(RangeError);
    });
  });

  describe('computeSSTaxableFraction - Single/HoH filers', () => {
    it('returns 0 when PI <= $25,000', () => {
      expect(computeSSTaxableFraction(25000, 'single')).toBe(0);
      expect(computeSSTaxableFraction(20000, 'single')).toBe(0);
      expect(computeSSTaxableFraction(0, 'single')).toBe(0);
    });

    it('returns 0.5 when $25k < PI <= $34k', () => {
      expect(computeSSTaxableFraction(25001, 'single')).toBe(0.5);
      expect(computeSSTaxableFraction(30000, 'single')).toBe(0.5);
      expect(computeSSTaxableFraction(34000, 'single')).toBe(0.5);
    });

    it('returns 0.85 when PI > $34k', () => {
      expect(computeSSTaxableFraction(34001, 'single')).toBe(0.85);
      expect(computeSSTaxableFraction(50000, 'single')).toBe(0.85);
      expect(computeSSTaxableFraction(100000, 'single')).toBe(0.85);
    });

    it('head-of-household uses same thresholds as single', () => {
      expect(computeSSTaxableFraction(30000, 'head-of-household')).toBe(
        computeSSTaxableFraction(30000, 'single'),
      );
    });
  });

  describe('computeSSTaxableFraction - Married Filing Jointly', () => {
    it('returns 0 when PI <= $32,000', () => {
      expect(computeSSTaxableFraction(32000, 'married-joint')).toBe(0);
      expect(computeSSTaxableFraction(20000, 'married-joint')).toBe(0);
    });

    it('returns 0.5 when $32k < PI <= $44k', () => {
      expect(computeSSTaxableFraction(32001, 'married-joint')).toBe(0.5);
      expect(computeSSTaxableFraction(40000, 'married-joint')).toBe(0.5);
      expect(computeSSTaxableFraction(44000, 'married-joint')).toBe(0.5);
    });

    it('returns 0.85 when PI > $44k', () => {
      expect(computeSSTaxableFraction(44001, 'married-joint')).toBe(0.85);
      expect(computeSSTaxableFraction(50000, 'married-joint')).toBe(0.85);
    });

    it('MFJ has higher thresholds than single', () => {
      // At PI = $33k: single is 0.5, MFJ is also 0.5 (since 32k < 33k <= 44k)
      expect(computeSSTaxableFraction(33000, 'single')).toBe(0.5);
      expect(computeSSTaxableFraction(33000, 'married-joint')).toBe(0.5);
    });
  });

  describe('computeSSTaxableFraction - Married Filing Separately', () => {
    it('always returns 0.85 regardless of PI (punitive rule)', () => {
      expect(computeSSTaxableFraction(0, 'married-separate')).toBe(0.85);
      expect(computeSSTaxableFraction(20000, 'married-separate')).toBe(0.85);
      expect(computeSSTaxableFraction(100000, 'married-separate')).toBe(0.85);
    });

    it('is much worse than other filing statuses', () => {
      const pi = 50000;
      expect(computeSSTaxableFraction(pi, 'married-separate')).toBe(0.85);
      expect(computeSSTaxableFraction(pi, 'single')).toBe(0.85); // coincidentally same at $50k
      expect(computeSSTaxableFraction(pi, 'married-joint')).toBe(0.85); // same at $50k
      // But at lower income levels MFS is much worse
      expect(computeSSTaxableFraction(30000, 'married-separate')).toBe(0.85);
      expect(computeSSTaxableFraction(30000, 'single')).toBe(0.5);
    });
  });

  describe('computeTaxableSS', () => {
    it('applies fraction to annual benefit', () => {
      // $25k benefit, PI=$35k (>$34k) → 0.85 fraction = $21,250 taxable
      const taxable = computeTaxableSS(25000, 35000, 'single');
      expect(taxable).toBe(25000 * 0.85); // 21,250
    });

    it('handles 0% taxable fraction', () => {
      // PI = $20k (< $25k) → 0% taxable
      const taxable = computeTaxableSS(30000, 20000, 'single');
      expect(taxable).toBe(0);
    });

    it('handles 85% taxable fraction', () => {
      // PI = $50k (> $34k) → 85% taxable
      const taxable = computeTaxableSS(24000, 50000, 'single');
      expect(taxable).toBe(24000 * 0.85); // 20,400
    });
  });

  describe('getSSTaxationTier', () => {
    it('returns tier 1 for PI <= lower threshold', () => {
      expect(getSSTaxationTier(25000, 'single')).toBe(1);
      expect(getSSTaxationTier(32000, 'married-joint')).toBe(1);
    });

    it('returns tier 2 for PI in middle range', () => {
      expect(getSSTaxationTier(30000, 'single')).toBe(2);
      expect(getSSTaxationTier(40000, 'married-joint')).toBe(2);
    });

    it('returns tier 3 for PI above upper threshold', () => {
      expect(getSSTaxationTier(35000, 'single')).toBe(3);
      expect(getSSTaxationTier(50000, 'married-joint')).toBe(3);
    });
  });

  describe('computeSSBenefitTaxation', () => {
    it('returns full result structure', () => {
      const result = computeSSBenefitTaxation(50000, 0, 24000, 'single');
      expect(result.annualSSBenefit).toBe(24000);
      expect(result.provisionalIncome).toBe(50000 + 0 + 12000); // 62k
      expect(result.taxableFraction).toBe(0.85);
      expect(result.taxableBenefit).toBe(24000 * 0.85); // 20,400
      expect(result.tier).toBe(3);
    });

    it('integrates AGI, exempt interest, and SS correctly', () => {
      // MFJ: AGI $45k, exempt interest $3k, SS $20k
      // PI = 45k + 3k + 10k = 58k → tier 3 (> 44k)
      const result = computeSSBenefitTaxation(45000, 3000, 20000, 'married-joint');
      expect(result.provisionalIncome).toBe(58000);
      expect(result.tier).toBe(3);
      expect(result.taxableFraction).toBe(0.85);
      expect(result.taxableBenefit).toBe(20000 * 0.85); // 17,000
    });

    it('example: early retiree with no other income (single)', () => {
      // Claim SS at 62: no other income, just SS
      // AGI = 0, exempt interest = 0, SS = $24k
      // PI = 0 + 0 + 12k = 12k → tier 1 (< 25k) → 0% taxable
      const result = computeSSBenefitTaxation(0, 0, 24000, 'single');
      expect(result.provisionalIncome).toBe(12000);
      expect(result.taxableFraction).toBe(0);
      expect(result.taxableBenefit).toBe(0);
    });

    it('example: retiree with annuity and TSP withdrawal (MFJ)', () => {
      // MFJ: annuity $30k, TSP withdrawal $20k, SS $24k
      // AGI = 50k, exempt int = 0
      // PI = 50k + 0 + 12k = 62k → tier 3 (> 44k) → 85% taxable
      const result = computeSSBenefitTaxation(50000, 0, 24000, 'married-joint');
      expect(result.provisionalIncome).toBe(62000);
      expect(result.taxableFraction).toBe(0.85);
      expect(result.taxableBenefit).toBeCloseTo(20400, 0); // 24k × 0.85
    });
  });

  describe('Boundary conditions', () => {
    it('exactly at lower threshold (single)', () => {
      // PI exactly $25,000 → tier 1, 0% taxable
      expect(computeSSTaxableFraction(25000, 'single')).toBe(0);
      // PI $25,001 → tier 2, 50% taxable
      expect(computeSSTaxableFraction(25001, 'single')).toBe(0.5);
    });

    it('exactly at upper threshold (single)', () => {
      // PI exactly $34,000 → tier 2, 50% taxable
      expect(computeSSTaxableFraction(34000, 'single')).toBe(0.5);
      // PI $34,001 → tier 3, 85% taxable
      expect(computeSSTaxableFraction(34001, 'single')).toBe(0.85);
    });

    it('handles very high PI', () => {
      const result = computeSSBenefitTaxation(1000000, 0, 24000, 'single');
      expect(result.taxableFraction).toBe(0.85);
      expect(result.taxableBenefit).toBe(24000 * 0.85);
    });
  });
});
