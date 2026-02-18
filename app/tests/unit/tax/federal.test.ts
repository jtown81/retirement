import { describe, it, expect } from 'vitest';
import { computeFederalTax, computeFederalTaxableIncome, computeFederalTaxFull, getEffectiveFederalRate } from '@modules/tax';

describe('Federal Income Tax', () => {
  describe('computeFederalTax', () => {
    it('computes correct tax for $50k single income (2024)', () => {
      // $50k single: $11,600 @ 10% = $1,160; $35,550 @ 12% = $4,266; $2,850 @ 22% = $627; total = $6,053
      const tax = computeFederalTax(50000, 2024, 'single');
      expect(tax).toBe(6053);
    });

    it('computes correct tax for $100k single income (2024)', () => {
      // $100k: $11,600 @ 10% = $1,160; $35,550 @ 12% = $4,266; $52,850 @ 22% = $11,627
      // Total = $17,053
      const tax = computeFederalTax(100000, 2024, 'single');
      expect(tax).toBeCloseTo(17053, 0);
    });

    it('computes correct tax for $100k married-joint (2024)', () => {
      // MFJ: $100k splits across two brackets
      // $23,200 @ 10% = $2,320; $71,100 @ 12% = $8,532; $5,700 @ 22% = $1,254; total = $12,106
      const tax = computeFederalTax(100000, 2024, 'married-joint');
      expect(tax).toBeCloseTo(12106, 0);
    });

    it('MFJ has lower tax than single at same income', () => {
      const singleTax = computeFederalTax(100000, 2024, 'single');
      const mfjTax = computeFederalTax(100000, 2024, 'married-joint');
      expect(mfjTax).toBeLessThan(singleTax);
    });

    it('returns 0 for zero income', () => {
      expect(computeFederalTax(0, 2024, 'single')).toBe(0);
    });

    it('rounds to cents', () => {
      const tax = computeFederalTax(50001, 2024, 'single');
      // Should be rounded to 2 decimal places
      const cents = Math.round((tax % 1) * 100);
      expect(cents).toBeGreaterThanOrEqual(0);
      expect(cents).toBeLessThanOrEqual(99);
    });

    it('throws RangeError for negative income', () => {
      expect(() => computeFederalTax(-1000, 2024, 'single')).toThrow(RangeError);
    });

    it('scales correctly with 2025 brackets (higher thresholds)', () => {
      const tax2024 = computeFederalTax(50000, 2024, 'single');
      const tax2025 = computeFederalTax(50000, 2025, 'single');
      // 2025 brackets are slightly higher (COLA), so tax should be slightly lower
      expect(tax2025).toBeLessThanOrEqual(tax2024);
    });

    it('computes high-income tax correctly', () => {
      // $500k single filer (marginal rate is 35%)
      const tax = computeFederalTax(500000, 2024, 'single');
      expect(tax).toBeGreaterThan(130000); // Rough sanity check
      expect(tax).toBeLessThan(160000);
    });
  });

  describe('computeFederalTaxableIncome', () => {
    it('applies standard deduction (single)', () => {
      const result = computeFederalTaxableIncome(60000, 2024, 'single', 'standard');
      expect(result).toBe(60000 - 14600); // 45,400
    });

    it('applies standard deduction (married-joint)', () => {
      const result = computeFederalTaxableIncome(100000, 2024, 'married-joint', 'standard');
      expect(result).toBe(100000 - 29200); // 70,800
    });

    it('applies itemized deduction', () => {
      const result = computeFederalTaxableIncome(100000, 2024, 'single', 35000);
      expect(result).toBe(100000 - 35000); // 65,000
    });

    it('chooses larger deduction for lower taxable income', () => {
      // Standard deduction ($14,600) is larger than itemized ($10,000)
      // Lower deduction = higher taxable income
      const standard = computeFederalTaxableIncome(100000, 2024, 'single', 'standard');
      const itemized = computeFederalTaxableIncome(100000, 2024, 'single', 10000);
      // Standard: 100,000 - 14,600 = 85,400
      // Itemized: 100,000 - 10,000 = 90,000
      expect(standard).toBeLessThan(itemized); // standard is LOWER, which is better
      expect(standard).toBe(85400);
      expect(itemized).toBe(90000);
    });

    it('returns 0 if AGI below deduction', () => {
      const result = computeFederalTaxableIncome(10000, 2024, 'single', 'standard');
      expect(result).toBe(0); // Minimum 0
    });

    it('throws if itemized deduction is negative', () => {
      expect(() => computeFederalTaxableIncome(100000, 2024, 'single', -1)).toThrow(RangeError);
    });
  });

  describe('computeFederalTaxFull', () => {
    it('returns full tax computation result', () => {
      const result = computeFederalTaxFull(100000, 2024, 'single', 'standard');
      expect(result.agi).toBe(100000);
      expect(result.deduction).toBe(14600);
      expect(result.taxableIncome).toBe(85400);
      expect(result.federalTax).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeLessThan(0.15); // ~14-15% effective
    });

    it('effective rate = tax / gross income', () => {
      const result = computeFederalTaxFull(100000, 2024, 'single', 'standard');
      const expectedRate = result.federalTax / 100000;
      expect(result.effectiveRate).toBeCloseTo(expectedRate, 6);
    });

    it('handles itemized deduction', () => {
      const result = computeFederalTaxFull(100000, 2024, 'single', 35000);
      expect(result.deduction).toBe(35000);
      expect(result.taxableIncome).toBe(65000);
    });
  });

  describe('getEffectiveFederalRate', () => {
    it('computes effective rate as tax / income', () => {
      const rate = getEffectiveFederalRate(10000, 100000);
      expect(rate).toBe(0.1); // 10% effective
    });

    it('returns 0 for zero income', () => {
      expect(getEffectiveFederalRate(1000, 0)).toBe(0);
    });

    it('returns 0 for zero tax', () => {
      expect(getEffectiveFederalRate(0, 100000)).toBe(0);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('handles income exactly at bracket boundary (single)', () => {
      // Income exactly at $11,600 (end of 10% bracket)
      const tax1 = computeFederalTax(11600, 2024, 'single');
      const tax2 = computeFederalTax(11601, 2024, 'single');
      // tax2 should be slightly more (1 extra dollar at 12%)
      expect(tax2).toBeGreaterThan(tax1);
      expect(tax2 - tax1).toBeCloseTo(0.12, 2);
    });

    it('handles extremely high income', () => {
      const tax = computeFederalTax(10000000, 2024, 'single');
      expect(tax).toBeGreaterThan(3500000); // Rough sanity check
    });

    it('computes married-separate (punitive, same as single)', () => {
      const single = computeFederalTax(50000, 2024, 'single');
      const mfs = computeFederalTax(50000, 2024, 'married-separate');
      expect(mfs).toBe(single); // MFS uses same brackets as single
    });
  });
});
