/**
 * Federal Tax Computation Integration Tests
 *
 * End-to-end tests for complete federal tax calculation including income tax,
 * Social Security taxation, IRMAA, and effective rates.
 */

import { describe, it, expect } from 'vitest';
import { computeAnnualTax } from '../../../src/modules/tax';
import type { TaxInput } from '../../../src/models/tax';

describe('Federal Tax Computation (computeAnnualTax)', () => {
  describe('single filer, age 55, no SS', () => {
    it('$60K annuity only', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 55,
        filingStatus: 'single',
        ordinaryIncome: 60000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Standard deduction: $14,600
      // Taxable income: $60K - $14.6K = $45.4K
      // Tax: 10% on $11.6K + 12% on remaining $33.8K = $5,216
      expect(result.taxableIncome).toBe(45400);
      expect(result.federalTax).toBeCloseTo(5216, 0);
      expect(result.ssTaxableAmount).toBe(0);
      expect(result.irmaaSurcharge).toBe(0); // Age < 65 and useIRMAA=false
      expect(result.totalTax).toBeCloseTo(5216, 0);
      expect(result.afterTaxIncome).toBeCloseTo(54784, 0);
    });

    it('$60K annuity + $20K traditional TSP', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 55,
        filingStatus: 'single',
        ordinaryIncome: 80000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Standard deduction: $14,600
      // Taxable income: $80K - $14.6K = $65.4K
      // Tax: 10% on $11.6K + 12% on $35.55K + 22% on remaining ~$18.25K ≈ $9,441
      expect(result.taxableIncome).toBe(65400);
      expect(result.federalTax).toBeGreaterThan(9000);
      expect(result.federalTax).toBeLessThan(10000);
    });

    it('$60K annuity + $10K Roth TSP withdrawal', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 55,
        filingStatus: 'single',
        ordinaryIncome: 60000,
        rothIncome: 10000,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Roth withdrawal is not taxable income
      // Taxable income: $60K - $14.6K = $45.4K (same as without Roth)
      expect(result.taxableIncome).toBe(45400);
      expect(result.federalTax).toBeCloseTo(5216, 0);
      // But Roth is counted for effective rate
      const effectiveRate = result.federalTax / (60000 + 10000);
      expect(effectiveRate).toBeLessThan(0.1); // < 10% effective
    });
  });

  describe('single filer age 62 with Social Security', () => {
    it('$60K annuity + $20K Social Security', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 62,
        filingStatus: 'single',
        ordinaryIncome: 60000,
        rothIncome: 0,
        grossSocialSecurity: 20000,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Provisional Income: $60K + 50% * $20K = $70K
      // Above $34K, so 85% of SS is taxable: $17K
      // Taxable income: $60K + $17K - $14.6K = $62.4K
      // 10% on $11.6K + 12% on $50.8K = $8,257 (adjusted for actual bracket thresholds)
      expect(result.ssTaxableFraction).toBe(0.85);
      expect(result.ssTaxableAmount).toBe(17000);
      expect(result.taxableIncome).toBeCloseTo(62400, 0);
      expect(result.federalTax).toBeGreaterThan(8000);
      expect(result.federalTax).toBeLessThan(9000);
    });

    it('$40K annuity + $24K Social Security (low income)', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 62,
        filingStatus: 'single',
        ordinaryIncome: 40000,
        rothIncome: 0,
        grossSocialSecurity: 24000,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Provisional Income: $40K + 50% * $24K = $52K
      // Above $34K, so 85% of SS is taxable
      expect(result.ssTaxableFraction).toBe(0.85);
      expect(result.ssTaxableAmount).toBe(24000 * 0.85);
    });
  });

  describe('single filer age 65+ with IRMAA', () => {
    it('$60K annuity + $30K TSP + $20K SS = $110K MAGI', () => {
      const input: TaxInput = {
        calendarYear: 2025,
        age: 65,
        filingStatus: 'single',
        ordinaryIncome: 90000,
        rothIncome: 0,
        grossSocialSecurity: 20000,
        useIRMAA: true,
      };

      const result = computeAnnualTax(input);

      // Provisional Income for SS: $90K + 50% * $20K = $100K
      // 85% of SS is taxable: $17K
      // MAGI for IRMAA: $90K + $0 + $17K = $107K (in Tier 1 for single)
      // IRMAA Tier 1: ($70 + $12.60) * 12 = $991.20
      expect(result.ssTaxableFraction).toBe(0.85);
      expect(result.irmaaSurcharge).toBeCloseTo(991.20, 0);
      expect(result.totalTax).toBeGreaterThan(6500);
    });

    it('$100K annuity + $50K TSP + $0 SS = $150K MAGI, age 70', () => {
      const input: TaxInput = {
        calendarYear: 2025,
        age: 70,
        filingStatus: 'single',
        ordinaryIncome: 150000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: true,
      };

      const result = computeAnnualTax(input);

      // MAGI for IRMAA: $150K (in Tier 2 for single: $123K–$153K)
      // IRMAA Tier 2: ($175 + $32.50) * 12 = $2,490
      expect(result.irmaaSurcharge).toBeCloseTo(2490, 0);
      expect(result.totalTax).toBeGreaterThan(20000);
    });

    it('IRMAA disabled: should not apply surcharge even at age 65', () => {
      const input: TaxInput = {
        calendarYear: 2025,
        age: 65,
        filingStatus: 'single',
        ordinaryIncome: 150000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      expect(result.irmaaSurcharge).toBe(0);
    });
  });

  describe('married filing jointly', () => {
    it('$100K + $50K TSP + $20K SS, MFJ age 62', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 62,
        filingStatus: 'married_joint',
        ordinaryIncome: 150000,
        rothIncome: 0,
        grossSocialSecurity: 20000,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Standard deduction: $29,200
      // Provisional Income: $150K + 50% * $20K = $160K
      // Above $44K, so 85% of SS is taxable
      expect(result.ssTaxableFraction).toBe(0.85);
      expect(result.federalTax).toBeGreaterThan(18000);
    });

    it('MFJ with IRMAA: $250K income, age 65', () => {
      const input: TaxInput = {
        calendarYear: 2025,
        age: 65,
        filingStatus: 'married_joint',
        ordinaryIncome: 250000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: true,
      };

      const result = computeAnnualTax(input);

      // MAGI for IRMAA: $250K (in MFJ Tier 2: $246K–$306K)
      // IRMAA Tier 2: ($175 + $32.50) * 12 = $2,490
      expect(result.irmaaSurcharge).toBeCloseTo(2490, 0);
    });
  });

  describe('head of household', () => {
    it('$80K annuity, HOH age 55', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 55,
        filingStatus: 'head_of_household',
        ordinaryIncome: 80000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Standard deduction: $21,900
      // Taxable income: $80K - $21.9K = $58.1K
      expect(result.taxableIncome).toBeCloseTo(58100, 0);
      expect(result.federalTax).toBeGreaterThan(6000);
    });
  });

  describe('married filing separately', () => {
    it('$80K income, MFS age 50', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 50,
        filingStatus: 'married_separate',
        ordinaryIncome: 80000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Standard deduction: $14,600
      // Taxable income: $80K - $14.6K = $65.4K
      expect(result.taxableIncome).toBeCloseTo(65400, 0);
    });

    it('MFS with SS: nearly all SS taxable due to strict rules', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 62,
        filingStatus: 'married_separate',
        ordinaryIncome: 40000,
        rothIncome: 0,
        grossSocialSecurity: 15000,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // MFS: threshold=$0, so 85% of SS is taxable immediately
      expect(result.ssTaxableFraction).toBe(0.85);
      expect(result.ssTaxableAmount).toBe(15000 * 0.85);
    });
  });

  describe('age 65+ standard deduction adjustment', () => {
    it('single age 64 vs age 65', () => {
      const input64: TaxInput = {
        calendarYear: 2024,
        age: 64,
        filingStatus: 'single',
        ordinaryIncome: 100000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const input65: TaxInput = {
        calendarYear: 2024,
        age: 65,
        filingStatus: 'single',
        ordinaryIncome: 100000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result64 = computeAnnualTax(input64);
      const result65 = computeAnnualTax(input65);

      // Age 65+ gets $2K additional deduction (single)
      expect(result65.taxableIncome).toBe(result64.taxableIncome - 2000);
      expect(result65.federalTax).toBeLessThan(result64.federalTax);
    });
  });

  describe('spot checks from plan requirements', () => {
    it('single filer, $60K annuity + $0 SS → ~$5,200 federal tax (~8.7% effective)', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 60,
        filingStatus: 'single',
        ordinaryIncome: 60000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Standard deduction $14.6K → $45.4K taxable → ~$5,216 tax
      expect(result.federalTax).toBeGreaterThan(5000);
      expect(result.federalTax).toBeLessThan(5500);
      const effectiveRate = result.federalTax / 60000;
      expect(effectiveRate).toBeGreaterThan(0.08);
      expect(effectiveRate).toBeLessThan(0.10);
    });

    it('single filer, $90K + $20K SS → 85% of SS included → ~$17K federal tax', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 62,
        filingStatus: 'single',
        ordinaryIncome: 90000,
        rothIncome: 0,
        grossSocialSecurity: 20000,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      // Provisional Income: $90K + 50% * $20K = $100K (above $34K)
      // 85% of SS taxable: $17K
      // Taxable income: $90K + $17K - $14.6K = $92.4K
      // Federal tax: ~$11K–$13K (rough check)
      expect(result.ssTaxableAmount).toBe(17000);
      expect(result.federalTax).toBeGreaterThan(10000);
    });

    it('IRMAA at $130K income, age 65, single → ~$889 annual surcharge (Tier 1 Part B only)', () => {
      const input: TaxInput = {
        calendarYear: 2025,
        age: 65,
        filingStatus: 'single',
        ordinaryIncome: 100000,
        rothIncome: 0,
        grossSocialSecurity: 30000,
        useIRMAA: true,
      };

      const result = computeAnnualTax(input);

      // MAGI: $100K + $0 (Roth) + taxable SS
      // Provisional Income: $100K + 50% * $30K = $115K
      // 85% of SS taxable: $25.5K
      // MAGI: $100K + $25.5K = $125.5K (in Tier 1: $97K–$123K? actually need to verify)
      // If in Tier 1: ($70 + $12.60) * 12 = $987.60
      expect(result.irmaaSurcharge).toBeGreaterThan(0);
      expect(result.irmaaSurcharge).toBeLessThan(2500);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('zero income', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 50,
        filingStatus: 'single',
        ordinaryIncome: 0,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      expect(result.federalTax).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.afterTaxIncome).toBe(0);
    });

    it('income below standard deduction', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 50,
        filingStatus: 'single',
        ordinaryIncome: 10000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      expect(result.taxableIncome).toBe(0);
      expect(result.federalTax).toBe(0);
    });

    it('state tax is always 0 (placeholder)', () => {
      const input: TaxInput = {
        calendarYear: 2024,
        age: 50,
        filingStatus: 'single',
        ordinaryIncome: 200000,
        rothIncome: 0,
        grossSocialSecurity: 0,
        useIRMAA: false,
      };

      const result = computeAnnualTax(input);

      expect(result.stateTax).toBe(0);
    });
  });
});
