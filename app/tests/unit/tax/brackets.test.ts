/**
 * Federal Income Tax Bracket Tests
 *
 * Tests federal income tax computation and standard deduction calculation.
 */

import { describe, it, expect } from 'vitest';
import {
  computeFederalTax,
  computeStandardDeduction,
  computeEffectiveRate,
} from '../../../src/modules/tax';

describe('Federal Tax Brackets', () => {
  describe('computeFederalTax', () => {
    it('returns 0 for zero or negative taxable income', () => {
      expect(computeFederalTax(0, 2024, 'single')).toBe(0);
      expect(computeFederalTax(-100, 2024, 'single')).toBe(0);
    });

    it('computes 2024 single filer tax correctly', () => {
      // Single filer 2024: 10% on first $11,600
      const tax1 = computeFederalTax(11600, 2024, 'single');
      expect(tax1).toBeCloseTo(1160, 0);

      // 12% on next portion ($47,150 - $11,600 = $35,550)
      const tax2 = computeFederalTax(47150, 2024, 'single');
      expect(tax2).toBeCloseTo(1160 + 35550 * 0.12, 0);

      // Into 22% bracket
      const tax3 = computeFederalTax(100000, 2024, 'single');
      const expected = 1160 + 35550 * 0.12 + (100000 - 47150) * 0.22;
      expect(tax3).toBeCloseTo(expected, 0);
    });

    it('computes 2025 single filer tax correctly', () => {
      // 2025 brackets are adjusted for inflation
      const tax = computeFederalTax(100000, 2025, 'single');
      expect(tax).toBeGreaterThan(0);
      expect(tax).toBeLessThan(30000); // Reasonable bounds
    });

    it('computes 2024 married filing jointly tax', () => {
      // MFJ 2024: 10% on first $23,200
      const tax1 = computeFederalTax(23200, 2024, 'married_joint');
      expect(tax1).toBeCloseTo(2320, 0);

      // 12% on next portion
      const tax2 = computeFederalTax(94300, 2024, 'married_joint');
      const expected = 2320 + (94300 - 23200) * 0.12;
      expect(tax2).toBeCloseTo(expected, 0);
    });

    it('applies highest bracket correctly', () => {
      // Single filer, top bracket (37%)
      const lowIncome = computeFederalTax(100000, 2024, 'single');
      const highIncome = computeFederalTax(1000000, 2024, 'single');
      expect(highIncome).toBeGreaterThan(lowIncome);
      // 37% marginal rate on top, but many lower brackets apply
      // ~$328K for $1M income is reasonable
      expect(highIncome).toBeGreaterThan(300000);
    });

    it('computes head of household correctly', () => {
      const tax = computeFederalTax(100000, 2024, 'head_of_household');
      expect(tax).toBeGreaterThan(0);
      expect(tax).toBeLessThan(30000);
    });

    it('computes married filing separately correctly', () => {
      const tax = computeFederalTax(50000, 2024, 'married_separate');
      expect(tax).toBeGreaterThan(0);
      expect(tax).toBeLessThan(20000);
    });
  });

  describe('computeStandardDeduction', () => {
    it('returns base standard deduction for age < 65', () => {
      const deduction = computeStandardDeduction(2024, 'single', 40);
      expect(deduction).toBe(14600); // 2024 single base
    });

    it('includes age 65+ additional deduction for single', () => {
      const deduction = computeStandardDeduction(2024, 'single', 65);
      expect(deduction).toBe(14600 + 2000); // Base + $2,000 for 65+
    });

    it('includes age 65+ additional deduction for married filing jointly', () => {
      const deduction = computeStandardDeduction(2024, 'married_joint', 65);
      expect(deduction).toBe(29200 + 1600); // Base + $1,600 per spouse
    });

    it('includes age 65+ additional deduction for head of household', () => {
      const deduction = computeStandardDeduction(2024, 'head_of_household', 65);
      expect(deduction).toBe(21900 + 2000);
    });

    it('includes age 65+ additional deduction for married separate', () => {
      const deduction = computeStandardDeduction(2024, 'married_separate', 65);
      expect(deduction).toBe(14600 + 1600);
    });

    it('uses 2025 rates for 2025 year', () => {
      const deduction2025 = computeStandardDeduction(2025, 'single', 40);
      const deduction2024 = computeStandardDeduction(2024, 'single', 40);
      expect(deduction2025).toBeGreaterThan(deduction2024);
      expect(deduction2025).toBe(15000); // 2025 single base
    });

    it('uses future year base for years beyond 2025', () => {
      // Falls back to 2025 (most recent)
      const deduction = computeStandardDeduction(2030, 'single', 40);
      expect(deduction).toBe(15000); // 2025 base
    });
  });

  describe('computeEffectiveRate', () => {
    it('returns 0 for zero or negative income', () => {
      expect(computeEffectiveRate(1000, 0)).toBe(0);
      expect(computeEffectiveRate(1000, -500)).toBe(0);
    });

    it('computes effective rate correctly', () => {
      // $10,000 tax on $100,000 income = 10%
      const rate = computeEffectiveRate(10000, 100000);
      expect(rate).toBeCloseTo(0.1, 4);

      // $25,000 tax on $100,000 income = 25%
      const rate2 = computeEffectiveRate(25000, 100000);
      expect(rate2).toBeCloseTo(0.25, 4);
    });
  });

  describe('integration: standard deduction + federal tax', () => {
    it('single filer $60K annuity with standard deduction', () => {
      // $60,000 annuity - $14,600 std ded = $45,400 taxable
      const deduction = computeStandardDeduction(2024, 'single', 55);
      const taxableIncome = Math.max(0, 60000 - deduction);
      const tax = computeFederalTax(taxableIncome, 2024, 'single');

      expect(deduction).toBe(14600);
      expect(taxableIncome).toBe(45400);
      // 10% on $11.6K = $1,160; 12% on $33.8K = $4,056; total ≈ $5,216
      expect(tax).toBeCloseTo(5216, 0);
    });

    it('single filer age 65+ gets additional standard deduction', () => {
      const deduction = computeStandardDeduction(2024, 'single', 65);
      const taxableIncome = Math.max(0, 60000 - deduction);
      const tax = computeFederalTax(taxableIncome, 2024, 'single');

      expect(deduction).toBe(14600 + 2000); // $16,600
      expect(taxableIncome).toBe(43400);
      expect(tax).toBeLessThan(5000); // Slightly less tax
    });
  });
});
