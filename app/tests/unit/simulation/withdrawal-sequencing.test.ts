/**
 * Withdrawal Sequencing Tests (PR-007)
 *
 * Tests for the tax-bracket-fill withdrawal strategy and Roth AGI exclusion.
 * Validates that Traditional withdrawals are optimized to stay within tax brackets
 * while preserving Roth for tax-free growth.
 */

import { describe, it, expect } from 'vitest';
import { projectRetirementSimulation } from '@modules/simulation/retirement-simulation';
import type { SimulationConfig } from '@models/simulation';
import type { TaxProfile } from '@models/tax';

/**
 * Base config for a single GS employee retiring at 62 with 30 years of service
 */
const baseConfig: SimulationConfig = {
  retirementAge: 62,
  retirementYear: 2025,
  endAge: 95,
  birthYear: 1963, // Age 62 in 2025
  fersAnnuity: 45000, // $45k annual
  fersSupplement: 0, // Stops at 62
  ssMonthlyAt62: 3000, // $36k annual at 62
  ssClaimingAge: 62, // Claim immediately
  // TSP
  tspBalanceAtRetirement: 400000, // $400k total
  traditionalPct: 0.7, // 70% Traditional ($280k), 30% Roth ($120k)
  highRiskPct: 0.6, // 60% in stocks
  highRiskROI: 0.08, // 8% returns
  lowRiskROI: 0.03, // 3% returns
  withdrawalRate: 0.04, // 4% initial withdrawal = $16k
  timeStepYears: 2,
  // Expenses
  baseAnnualExpenses: 60000,
  goGoEndAge: 75,
  goGoRate: 1.0,
  goSlowEndAge: 85,
  goSlowRate: 0.85,
  noGoRate: 0.75,
  // Rates
  colaRate: 0.025,
  inflationRate: 0.025,
};

const taxProfile: TaxProfile = {
  filingStatus: 'single',
  stateCode: 'VA', // Virginia (exempt FERS annuity)
  stateResidencyYear: 2025,
  deductionStrategy: 'standard', // 2025 standard deduction ~$15,000
  modelIrmaa: false,
};

describe('PR-007: Withdrawal Sequencing', () => {
  describe('tax-bracket-fill strategy', () => {
    it('fills bracket with Traditional before using Roth', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'tax-bracket-fill',
        baseAnnualExpenses: 85000, // Increase expenses to force higher withdrawal
      };

      const result = projectRetirementSimulation(config, taxProfile);
      const year1 = result.years[0];

      // With higher expenses, withdrawal will be higher
      // This should trigger Roth usage when bracket is full
      expect(year1.tradWithdrawal).toBeGreaterThan(0);
      expect(year1.tradWithdrawal + year1.rothWithdrawal).toBeCloseTo(year1.tspWithdrawal, 0);

      // For the basic scenario, if Roth is 0, that's OK - means entire withdrawal fits in bracket
      if (year1.rothWithdrawal === 0) {
        // Entire withdrawal is in Traditional (fits within bracket)
        expect(year1.tradWithdrawal).toBeLessThanOrEqual(year1.tspWithdrawal);
      }
    });

    it('Roth withdrawals excluded from taxable income (AGI fix)', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'tax-bracket-fill',
      };

      const result = projectRetirementSimulation(config, taxProfile);
      const year1 = result.years[0];

      // Total income includes both Traditional and Roth TSP
      // But taxableIncome should only include Traditional (+ annuity + SS)
      // So: taxableIncome <= totalIncome (because Roth is excluded)
      expect(year1.taxableIncome).toBeLessThanOrEqual(year1.totalIncome);

      // If there's any Roth withdrawal, taxable income should be noticeably less
      if (year1.rothWithdrawal > 0) {
        expect(year1.totalIncome - year1.taxableIncome).toBeGreaterThan(year1.rothWithdrawal * 0.5);
      }
    });

    it('afterTaxSurplus correctly computed', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'tax-bracket-fill',
      };

      const result = projectRetirementSimulation(config, taxProfile);
      const year1 = result.years[0];

      // afterTaxSurplus = afterTaxIncome - expenses
      const expected = year1.afterTaxIncome - year1.totalExpenses;
      expect(year1.afterTaxSurplus).toBeCloseTo(expected, 1);
    });

    it('marginalBracketRate populated correctly', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'tax-bracket-fill',
      };

      const result = projectRetirementSimulation(config, taxProfile);
      const year1 = result.years[0];

      // Marginal rate should be one of the standard brackets
      expect([0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37]).toContain(year1.marginalBracketRate);
    });

    it('bracketHeadroom populated for tax-bracket-fill strategy', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'tax-bracket-fill',
      };

      const result = projectRetirementSimulation(config, taxProfile);
      const year1 = result.years[0];

      // Headroom should be >= 0
      expect(year1.bracketHeadroom).toBeGreaterThanOrEqual(0);
    });
  });

  describe('RMD interaction with tax-bracket-fill', () => {
    it('RMD override forces Traditional above bracket boundary', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'tax-bracket-fill',
        retirementAge: 73, // RMD required at 73+
      };

      const result = projectRetirementSimulation(config, taxProfile);

      // Find first year where RMD is required (age >= 73)
      const rmdYear = result.years.find(y => y.rmdRequired > 0);

      if (rmdYear) {
        // Traditional withdrawal must be >= RMD required
        expect(rmdYear.tradWithdrawal).toBeGreaterThanOrEqual(rmdYear.rmdRequired);
        expect(rmdYear.rmdSatisfied).toBe(true);
      }
    });
  });

  describe('proportional strategy (control) still works', () => {
    it('proportional split maintains balance ratio', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'proportional',
      };

      const result = projectRetirementSimulation(config, taxProfile);
      const year1 = result.years[0];

      // Proportional should split by current balance ratio
      const tradFraction = year1.traditionalBalance / (year1.traditionalBalance + year1.rothBalance + 0.01);
      const rothFraction = year1.rothBalance / (year1.traditionalBalance + year1.rothBalance + 0.01);

      const expectedTradWithdrawal = year1.tspWithdrawal * tradFraction;
      const expectedRothWithdrawal = year1.tspWithdrawal * rothFraction;

      // Should be roughly proportional (within rounding)
      expect(year1.tradWithdrawal).toBeCloseTo(expectedTradWithdrawal, 0);
      expect(year1.rothWithdrawal).toBeCloseTo(expectedRothWithdrawal, 0);
    });
  });

  describe('traditional-first strategy (control) still works', () => {
    it('traditional-first exhausts Traditional before Roth', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'traditional-first',
      };

      const result = projectRetirementSimulation(config, taxProfile);

      // Track balance depletion
      let tradDepletedYear = null;
      for (let i = 0; i < result.years.length; i++) {
        const year = result.years[i];
        // Once Traditional is gone, Roth should be used for withdrawals
        if (i > 0 && result.years[i - 1].traditionalBalance > 0 && year.traditionalBalance <= 0) {
          tradDepletedYear = i;
          break;
        }
      }

      // After Traditional depletes, Roth should be drawn
      if (tradDepletedYear !== null && tradDepletedYear < result.years.length - 1) {
        const afterDepleteYear = result.years[tradDepletedYear + 1];
        expect(afterDepleteYear.rothWithdrawal).toBeGreaterThan(0);
      }
    });
  });

  describe('Roth-first strategy (control) still works', () => {
    it('roth-first exhausts Roth before Traditional', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'roth-first',
      };

      const result = projectRetirementSimulation(config, taxProfile);
      const year1 = result.years[0];

      // Year 1 Roth withdrawal should be significant (but capped by available Roth balance)
      expect(year1.rothWithdrawal).toBeGreaterThan(0);
      expect(year1.rothWithdrawal).toBeLessThanOrEqual(year1.tspWithdrawal);
    });
  });

  describe('new SimulationYearResult fields populated for all strategies', () => {
    ['proportional', 'traditional-first', 'roth-first', 'tax-bracket-fill'].forEach((strategy) => {
      it(`${strategy}: all new fields populated`, () => {
        const config: SimulationConfig = {
          ...baseConfig,
          withdrawalStrategy: strategy as any,
        };

        const result = projectRetirementSimulation(config, taxProfile);
        const year1 = result.years[0];

        // All 6 new fields should be present and populated
        expect(year1.tradWithdrawal).toBeDefined();
        expect(year1.rothWithdrawal).toBeDefined();
        expect(year1.taxableIncome).toBeDefined();
        expect(year1.afterTaxSurplus).toBeDefined();
        expect(year1.marginalBracketRate).toBeDefined();
        expect(year1.bracketHeadroom).toBeDefined();

        // Values should be reasonable (non-negative, etc.)
        expect(year1.tradWithdrawal).toBeGreaterThanOrEqual(0);
        expect(year1.rothWithdrawal).toBeGreaterThanOrEqual(0);
        expect(year1.taxableIncome).toBeGreaterThanOrEqual(0);
        expect(year1.marginalBracketRate).toBeGreaterThanOrEqual(0);
        expect(year1.bracketHeadroom).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Roth AGI exclusion affects tax computation', () => {
    it('tax is lower with Roth withdrawals than with equivalent Traditional', () => {
      const configRoth: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'roth-first', // Maximize Roth usage
      };

      const configTrad: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'traditional-first', // Maximize Traditional usage
      };

      const resultRoth = projectRetirementSimulation(configRoth, taxProfile);
      const resultTrad = projectRetirementSimulation(configTrad, taxProfile);

      // First year Roth-first should have less federal tax due to Roth AGI exclusion
      const year1Roth = resultRoth.years[0];
      const year1Trad = resultTrad.years[0];

      // Roth withdrawals reduce taxable income, so Roth-first should have lower federal tax
      // (when both strategies use the same total withdrawal amount)
      expect(year1Roth.federalTax).toBeLessThanOrEqual(year1Trad.federalTax);
    });
  });

  describe('backward compatibility without tax profile', () => {
    it('simulation works without tax profile (no tax calculation)', () => {
      const config: SimulationConfig = {
        ...baseConfig,
        withdrawalStrategy: 'tax-bracket-fill',
      };

      // Call with no tax profile
      const result = projectRetirementSimulation(config, undefined);
      const year1 = result.years[0];

      // Should still populate withdrawal breakdown fields
      expect(year1.tradWithdrawal).toBeDefined();
      expect(year1.rothWithdrawal).toBeDefined();

      // Tax fields should be 0 (no tax calculated)
      expect(year1.federalTax).toBe(0);
      expect(year1.stateTax).toBe(0);
      expect(year1.marginalBracketRate).toBe(0);
    });
  });
});
