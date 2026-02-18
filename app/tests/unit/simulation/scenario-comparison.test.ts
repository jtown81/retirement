import { describe, it, expect } from 'vitest';
import {
  extractScenarioMetrics,
  computePresentValue,
  computePresentValueMetrics,
} from '../../../src/modules/simulation/scenario-comparison';
import type { SimulationYearResult } from '../../../src/models/simulation';

// Mock year-by-year projection data
function makeMockYears(startAge: number, endAge: number): SimulationYearResult[] {
  const years: SimulationYearResult[] = [];
  let balance = 500_000;

  for (let age = startAge; age <= endAge; age++) {
    const yearIndex = age - startAge;
    const totalIncome = 50_000 + yearIndex * 1_000; // grows slightly
    const totalExpenses = 45_000 + yearIndex * 500; // grows slightly
    const surplus = totalIncome - totalExpenses;

    // Balance decreases with withdrawals, grows with returns
    balance = balance * 1.05 - 20_000;

    years.push({
      year: 2025 + yearIndex,
      age,
      annuity: 30_000,
      fersSupplement: age < 62 ? 5_000 : 0,
      socialSecurity: age >= 62 ? 18_000 : 0,
      tspWithdrawal: 20_000,
      totalIncome,
      // Tax fields (NEW in Phase 10)
      federalTax: totalIncome * 0.12,
      stateTax: totalIncome * 0.05,
      irmaaSurcharge: 0,
      totalTax: totalIncome * 0.17,
      effectiveFederalRate: 0.12,
      effectiveTotalRate: 0.17,
      socialSecurityTaxableFraction: 0.5,
      afterTaxIncome: totalIncome * 0.83,
      // Expenses
      smileMultiplier: 1.0,
      totalExpenses,
      // TSP
      highRiskBalance: balance * 0.6,
      lowRiskBalance: balance * 0.4,
      traditionalBalance: balance * 0.7,
      rothBalance: balance * 0.3,
      totalTSPBalance: balance,
      // RMD
      rmdRequired: 0,
      rmdSatisfied: true,
      // Net
      surplus,
      // Withdrawal sequencing (NEW in PR-007)
      tradWithdrawal: 14000,
      rothWithdrawal: 6000,
      taxableIncome: 49000,
      afterTaxSurplus: surplus,
      marginalBracketRate: 0.12,
      bracketHeadroom: 5000,
    });
  }

  return years;
}

describe('extractScenarioMetrics (Phase E)', () => {
  it('extracts basic metrics from 30-year projection', () => {
    const years = makeMockYears(60, 89); // 30 years
    const metrics = extractScenarioMetrics('test-scenario', years);

    expect(metrics.scenarioId).toBe('test-scenario');
    expect(metrics.depletionAge).toBeNull(); // balance stays positive
    expect(metrics.balanceAt85).toBeGreaterThan(0);
    expect(metrics.totalLifetimeIncome).toBeGreaterThan(0);
    expect(metrics.totalLifetimeExpenses).toBeGreaterThan(0);
  });

  it('detects depletion age', () => {
    const years: SimulationYearResult[] = [];
    for (let age = 60; age <= 80; age++) {
      years.push({
        year: 2025 + (age - 60),
        age,
        annuity: 30_000,
        fersSupplement: 0,
        socialSecurity: age >= 62 ? 18_000 : 0,
        tspWithdrawal: 20_000,
        totalIncome: 48_000,
        // Tax fields (NEW in Phase 10)
        federalTax: 48_000 * 0.12,
        stateTax: 48_000 * 0.05,
        irmaaSurcharge: 0,
        totalTax: 48_000 * 0.17,
        effectiveFederalRate: 0.12,
        effectiveTotalRate: 0.17,
        socialSecurityTaxableFraction: 0.5,
        afterTaxIncome: 48_000 * 0.83,
        // Expenses
        smileMultiplier: 1.0,
        totalExpenses: 50_000,
        // TSP
        highRiskBalance: age < 75 ? 50_000 : 0,
        lowRiskBalance: age < 75 ? 50_000 : 0,
        traditionalBalance: age < 75 ? 70_000 : 0,
        rothBalance: age < 75 ? 30_000 : 0,
        totalTSPBalance: age < 75 ? 100_000 : 0, // depletes at age 75
        // RMD
        rmdRequired: 0,
        rmdSatisfied: true,
        // Net
        surplus: -2_000,
        // Withdrawal sequencing (NEW in PR-007)
        tradWithdrawal: 14000,
        rothWithdrawal: 6000,
        taxableIncome: 39600,
        afterTaxSurplus: -2_000,
        marginalBracketRate: 0.12,
        bracketHeadroom: 5000,
      });
    }

    const metrics = extractScenarioMetrics('depletion-test', years);
    expect(metrics.depletionAge).toBe(75);
  });

  it('captures balance at 85', () => {
    const years = makeMockYears(60, 90);
    const metrics = extractScenarioMetrics('test', years);
    const yr85 = years.find((y) => y.age === 85);
    expect(metrics.balanceAt85).toBe(yr85?.totalTSPBalance ?? 0);
  });

  it('computes cumulative surplus at year 10', () => {
    const years = makeMockYears(60, 89);
    const metrics = extractScenarioMetrics('test', years);
    const expectedSurplus = years.slice(0, 10).reduce((sum, yr) => sum + yr.surplus, 0);
    expect(metrics.surplusYear10).toBeCloseTo(expectedSurplus, 0);
  });

  it('handles short projections gracefully', () => {
    const years = makeMockYears(60, 65); // only 6 years
    const metrics = extractScenarioMetrics('short-test', years);
    expect(metrics.surplusYear10).toBeGreaterThan(0); // should use all available years
  });
});

describe('computePresentValue', () => {
  it('returns same value at year 0', () => {
    const pv = computePresentValue(100_000, 0, 0.02);
    expect(pv).toBe(100_000);
  });

  it('discounts future value correctly', () => {
    // $100k in 10 years at 2% discount rate
    const pv = computePresentValue(100_000, 10, 0.02);
    // PV = 100k / (1.02^10) ≈ $82,035
    expect(pv).toBeCloseTo(82_035, 0);
  });

  it('applies higher discount rate for larger reductions', () => {
    const pv2pct = computePresentValue(100_000, 10, 0.02);
    const pv5pct = computePresentValue(100_000, 10, 0.05);
    expect(pv5pct).toBeLessThan(pv2pct);
  });

  it('handles zero discount rate', () => {
    const pv = computePresentValue(100_000, 10, 0);
    expect(pv).toBe(100_000);
  });
});

describe('computePresentValueMetrics', () => {
  it('adds PV adjustments to base metrics', () => {
    const years = makeMockYears(60, 89);
    const baseMetrics = extractScenarioMetrics('pv-test', years);
    const pvMetrics = computePresentValueMetrics(baseMetrics, years, 0.02);

    // Should have all original fields plus PV variants
    expect(pvMetrics.scenarioId).toBe(baseMetrics.scenarioId);
    expect(pvMetrics.balanceAt85PV).toBeLessThanOrEqual(pvMetrics.balanceAt85);
    expect(pvMetrics.surplusYear10PV).toBeLessThanOrEqual(pvMetrics.surplusYear10);
  });

  it('discounts balance at 85 correctly', () => {
    const years = makeMockYears(60, 89);
    const baseMetrics = extractScenarioMetrics('test', years);
    const pvMetrics = computePresentValueMetrics(baseMetrics, years, 0.02);

    // 25 years of discounting (age 60 to 85)
    const expectedPV = computePresentValue(baseMetrics.balanceAt85, 25, 0.02);
    expect(pvMetrics.balanceAt85PV).toBeCloseTo(expectedPV, 0);
  });
});
