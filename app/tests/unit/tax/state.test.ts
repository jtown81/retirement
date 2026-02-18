import { describe, it, expect } from 'vitest';
import { getStateTaxRule, computeStateTax, computeStateTaxDetailed } from '@modules/tax';

describe('State Income Tax', () => {
  describe('getStateTaxRule', () => {
    it('returns no-tax rule for FL', () => {
      const rule = getStateTaxRule('FL', 2024);
      expect(rule.noIncomeTax).toBe(true);
      expect(rule.approximateFlatRate).toBe(0);
    });

    it('returns no-tax rule for TX', () => {
      const rule = getStateTaxRule('TX', 2024);
      expect(rule.noIncomeTax).toBe(true);
    });

    it('returns rule for VA with federal pension exemption', () => {
      const rule = getStateTaxRule('VA', 2024);
      expect(rule.noIncomeTax).toBe(false);
      expect(rule.exemptsFersAnnuity).toBe(true);
      expect(rule.exemptsTspWithdrawals).toBe(true);
      expect(rule.approximateFlatRate).toBeGreaterThan(0);
    });

    it('returns rule for CA with no exemptions', () => {
      const rule = getStateTaxRule('CA', 2024);
      expect(rule.noIncomeTax).toBe(false);
      expect(rule.exemptsFersAnnuity).toBe(false);
      expect(rule.exemptsTspWithdrawals).toBe(false);
      expect(rule.approximateFlatRate).toBeGreaterThan(0);
    });

    it('returns rule for NC with partial exemption', () => {
      const rule = getStateTaxRule('NC', 2024);
      expect(rule.exemptsFersAnnuity).toBe(true);
      expect(rule.exemptsTspWithdrawals).toBe(false); // TSP is not exempt in NC
    });

    it('returns default for unknown state', () => {
      const rule = getStateTaxRule('ZZ', 2024); // Fake state
      expect(rule.noIncomeTax).toBe(false);
      expect(rule.approximateFlatRate).toBe(0.05); // Conservative 5% default
      expect(rule.exemptsFersAnnuity).toBe(false);
    });

    it('returns no-tax rule for null state', () => {
      const rule = getStateTaxRule(null, 2024);
      expect(rule.noIncomeTax).toBe(true);
      expect(rule.approximateFlatRate).toBe(0);
    });

    it('includes source reference', () => {
      const rule = getStateTaxRule('VA', 2024);
      expect(rule.source).toBeDefined();
      expect(rule.source.length).toBeGreaterThan(0);
    });
  });

  describe('computeStateTax - No income tax states', () => {
    it('returns $0 for FL regardless of income', () => {
      expect(computeStateTax(50000, 30000, 20000, 'FL', 2024)).toBe(0);
      expect(computeStateTax(100000, 50000, 50000, 'FL', 2024)).toBe(0);
    });

    it('returns $0 for TX regardless of income', () => {
      expect(computeStateTax(100000, 60000, 40000, 'TX', 2024)).toBe(0);
    });

    it('returns $0 for WA regardless of income', () => {
      expect(computeStateTax(100000, 60000, 40000, 'WA', 2024)).toBe(0);
    });

    it('returns $0 for null state (no state income tax)', () => {
      expect(computeStateTax(100000, 60000, 40000, null, 2024)).toBe(0);
    });
  });

  describe('computeStateTax - VA (federal pension exemption)', () => {
    it('returns $0 when all income is exempt annuity and TSP', () => {
      // $30k annuity + $20k TSP = $50k total, both exempt
      const tax = computeStateTax(50000, 30000, 20000, 'VA', 2024);
      expect(tax).toBe(0);
    });

    it('applies rate to non-exempt income only', () => {
      // $30k annuity (exempt) + $20k TSP (exempt) + $10k other = $60k total
      // Taxable: $10k × 5.75% = $575
      const tax = computeStateTax(60000, 30000, 20000, 'VA', 2024);
      expect(tax).toBeCloseTo(10000 * 0.0575, 0); // ~$575
    });

    it('applies full rate when income is not from annuity/TSP', () => {
      // Example: $50k from other sources (taxable)
      const tax = computeStateTax(50000, 0, 0, 'VA', 2024);
      expect(tax).toBeCloseTo(50000 * 0.0575, 0); // ~$2,875
    });

    it('handles mixed income sources', () => {
      // $40k annuity (exempt) + $30k TSP (exempt) + $30k other (taxable)
      const tax = computeStateTax(100000, 40000, 30000, 'VA', 2024);
      expect(tax).toBeCloseTo(30000 * 0.0575, 0); // Only $30k taxed
    });

    it('returns 0 if all income is below amounts', () => {
      const tax = computeStateTax(0, 0, 0, 'VA', 2024);
      expect(tax).toBe(0);
    });
  });

  describe('computeStateTax - CA (no exemptions)', () => {
    it('applies flat rate to all income', () => {
      // $50k × 9.3% = $4,650 (approximate)
      const tax = computeStateTax(50000, 30000, 20000, 'CA', 2024);
      expect(tax).toBeCloseTo(50000 * 0.093, 0); // ~$4,650
    });

    it('annuity exemption does not apply in CA', () => {
      // Even if declared as annuity, CA taxes it
      const tax = computeStateTax(50000, 50000, 0, 'CA', 2024);
      expect(tax).toBeCloseTo(50000 * 0.093, 0);
    });

    it('TSP withdrawal exemption does not apply in CA', () => {
      const tax = computeStateTax(50000, 0, 50000, 'CA', 2024);
      expect(tax).toBeCloseTo(50000 * 0.093, 0);
    });

    it('scales with income', () => {
      const tax50 = computeStateTax(50000, 0, 0, 'CA', 2024);
      const tax100 = computeStateTax(100000, 0, 0, 'CA', 2024);
      expect(tax100).toBeCloseTo(tax50 * 2, 1);
    });
  });

  describe('computeStateTax - NC (partial exemption)', () => {
    it('exempts FERS annuity but not TSP', () => {
      // $40k annuity (exempt) + $30k TSP (taxable) + $30k other (taxable)
      // Taxable = $60k × 4.9% = $2,940
      const tax = computeStateTax(100000, 40000, 30000, 'NC', 2024);
      expect(tax).toBeCloseTo(60000 * 0.049, 0);
    });

    it('with only annuity, tax is $0', () => {
      const tax = computeStateTax(40000, 40000, 0, 'NC', 2024);
      expect(tax).toBe(0);
    });

    it('with only TSP, tax applies', () => {
      const tax = computeStateTax(40000, 0, 40000, 'NC', 2024);
      expect(tax).toBeCloseTo(40000 * 0.049, 0);
    });
  });

  describe('computeStateTax - Edge cases', () => {
    it('handles zero income', () => {
      const tax = computeStateTax(0, 0, 0, 'CA', 2024);
      expect(tax).toBe(0);
    });

    it('rounds to cents', () => {
      const tax = computeStateTax(50001, 0, 0, 'VA', 2024);
      // Check that it's rounded to 2 decimal places (no third decimal)
      const cents = Math.round(tax * 100);
      expect(tax).toBe(cents / 100);
    });

    it('never returns negative tax', () => {
      // Exemptions can't create negative tax
      const tax = computeStateTax(50000, 100000, 100000, 'VA', 2024);
      expect(tax).toBe(0); // Taxable income is 0
    });

    it('handles very high income', () => {
      const tax = computeStateTax(1000000, 0, 0, 'CA', 2024);
      expect(tax).toBeCloseTo(1000000 * 0.093, 0);
    });
  });

  describe('computeStateTaxDetailed', () => {
    it('returns full result structure', () => {
      const result = computeStateTaxDetailed(50000, 30000, 20000, 'VA', 2024);
      expect(result.stateCode).toBe('VA');
      expect(result.year).toBe(2024);
      expect(result.grossIncome).toBe(50000);
      expect(result.rule).toBeDefined();
      expect(result.rule.exemptsFersAnnuity).toBe(true);
      expect(result.stateTax).toBe(0); // All exempt
    });

    it('calculates taxable income correctly', () => {
      const result = computeStateTaxDetailed(100000, 40000, 30000, 'VA', 2024);
      expect(result.grossIncome).toBe(100000);
      expect(result.taxableIncome).toBe(30000); // Only non-exempt portion
      expect(result.stateTax).toBeCloseTo(30000 * 0.0575, 0);
    });

    it('example: federal retiree in VA', () => {
      // Retired FERS employee in VA
      // $30k annuity + $25k TSP withdrawal + $5k interest = $60k
      const result = computeStateTaxDetailed(60000, 30000, 25000, 'VA', 2024);
      expect(result.taxableIncome).toBe(5000); // Only interest is taxable
      expect(result.stateTax).toBeCloseTo(5000 * 0.0575, 0); // ~$288
    });

    it('example: federal retiree in CA', () => {
      // Same person in CA (no exemptions)
      const result = computeStateTaxDetailed(60000, 30000, 25000, 'CA', 2024);
      expect(result.taxableIncome).toBe(60000); // All income taxable
      expect(result.stateTax).toBeCloseTo(60000 * 0.093, 0); // ~$5,580
    });

    it('example: in PA (flat 3.07%)', () => {
      const result = computeStateTaxDetailed(100000, 60000, 40000, 'PA', 2024);
      expect(result.rule.approximateFlatRate).toBe(0.0307);
      expect(result.taxableIncome).toBe(100000); // PA taxes all income
      expect(result.stateTax).toBeCloseTo(100000 * 0.0307, 0); // ~$3,070
    });
  });

  describe('Comparison across states', () => {
    it('no-tax state beats high-tax state', () => {
      const fl = computeStateTax(100000, 60000, 40000, 'FL', 2024);
      const ca = computeStateTax(100000, 60000, 40000, 'CA', 2024);
      expect(fl).toBe(0);
      expect(ca).toBeGreaterThan(5000);
    });

    it('federal pension exemption saves money in VA vs CA', () => {
      const va = computeStateTax(100000, 60000, 40000, 'VA', 2024);
      const ca = computeStateTax(100000, 60000, 40000, 'CA', 2024);
      expect(va).toBeLessThan(ca);
    });

    it('partial exemption in NC is better than none (CA)', () => {
      const nc = computeStateTax(100000, 60000, 40000, 'NC', 2024);
      const ca = computeStateTax(100000, 60000, 40000, 'CA', 2024);
      expect(nc).toBeLessThan(ca);
    });
  });
});
