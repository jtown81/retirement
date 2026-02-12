import { describe, it, expect } from 'vitest';
import { projectRetirementSimulation } from '../../../src/modules/simulation/retirement-simulation';
import type { SimulationConfig } from '../../../src/models/simulation';

function makeConfig(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return {
    retirementAge: 60,
    endAge: 95,
    fersAnnuity: 30_000,
    fersSupplement: 10_000,
    ssMonthlyAt62: 1_800,
    tspBalanceAtRetirement: 500_000,
    traditionalPct: 0.70,
    highRiskPct: 0.60,
    highRiskROI: 0.08,
    lowRiskROI: 0.03,
    withdrawalRate: 0.04,
    timeStepYears: 2,
    baseAnnualExpenses: 60_000,
    goGoEndAge: 72,
    goGoRate: 1.0,
    goSlowEndAge: 82,
    goSlowRate: 0.85,
    noGoRate: 0.75,
    colaRate: 0.02,
    inflationRate: 0.025,
    ...overrides,
  };
}

describe('projectRetirementSimulation', () => {
  it('returns correct number of years', () => {
    const result = projectRetirementSimulation(makeConfig({ retirementAge: 60, endAge: 95 }));
    expect(result.years).toHaveLength(36); // ages 60-95 inclusive
  });

  it('first year starts at retirement age', () => {
    const result = projectRetirementSimulation(makeConfig());
    expect(result.years[0].age).toBe(60);
  });

  it('last year ends at end age', () => {
    const result = projectRetirementSimulation(makeConfig({ endAge: 95 }));
    expect(result.years[result.years.length - 1].age).toBe(95);
  });

  it('FERS annuity grows by COLA each year', () => {
    const result = projectRetirementSimulation(makeConfig({ colaRate: 0.02 }));
    const yr0 = result.years[0];
    const yr1 = result.years[1];
    expect(yr1.annuity).toBeCloseTo(yr0.annuity * 1.02, 2);
  });

  it('FERS supplement ends at age 62', () => {
    const result = projectRetirementSimulation(makeConfig({ retirementAge: 60 }));
    // Age 61 should have supplement
    expect(result.years[1].fersSupplement).toBeGreaterThan(0);
    // Age 62 should not
    expect(result.years[2].fersSupplement).toBe(0);
  });

  it('Social Security starts at age 62', () => {
    const result = projectRetirementSimulation(makeConfig({ retirementAge: 60, ssMonthlyAt62: 1800 }));
    expect(result.years[0].socialSecurity).toBe(0); // age 60
    expect(result.years[1].socialSecurity).toBe(0); // age 61
    expect(result.years[2].socialSecurity).toBeGreaterThan(0); // age 62
  });

  it('uses GoGo/GoSlow/NoGo smile curve multipliers', () => {
    const config = makeConfig({
      retirementAge: 60,
      goGoEndAge: 72,
      goGoRate: 1.0,
      goSlowEndAge: 82,
      goSlowRate: 0.85,
      noGoRate: 0.75,
    });
    const result = projectRetirementSimulation(config);

    // GoGo: age 60-71
    expect(result.years[0].smileMultiplier).toBe(1.0);
    expect(result.years[11].smileMultiplier).toBe(1.0);

    // GoSlow: age 72-81
    expect(result.years[12].smileMultiplier).toBe(0.85);

    // NoGo: age 82+
    expect(result.years[22].smileMultiplier).toBe(0.75);
  });

  it('tracks Traditional and Roth balances separately', () => {
    const result = projectRetirementSimulation(makeConfig({ traditionalPct: 0.70 }));
    const yr0 = result.years[0];
    // Both should be tracked (non-zero initially)
    expect(yr0.traditionalBalance).toBeGreaterThan(0);
    expect(yr0.rothBalance).toBeGreaterThan(0);
  });

  it('tracks high-risk and low-risk balances separately', () => {
    const result = projectRetirementSimulation(makeConfig());
    const yr0 = result.years[0];
    expect(yr0.highRiskBalance).toBeGreaterThan(0);
    expect(yr0.lowRiskBalance).toBeGreaterThan(0);
  });

  it('RMD is 0 before age 73', () => {
    const result = projectRetirementSimulation(makeConfig({ retirementAge: 60 }));
    // ages 60-72 → no RMD
    for (let i = 0; i <= 12; i++) {
      expect(result.years[i].rmdRequired).toBe(0);
    }
  });

  it('RMD is computed at age 73+', () => {
    const result = projectRetirementSimulation(makeConfig({ retirementAge: 60, endAge: 80 }));
    // age 73 = index 13
    expect(result.years[13].rmdRequired).toBeGreaterThan(0);
    expect(result.years[13].rmdSatisfied).toBe(true);
  });

  it('computes depletion age when TSP runs out', () => {
    const result = projectRetirementSimulation(makeConfig({
      tspBalanceAtRetirement: 50_000,
      withdrawalRate: 0.10,
      highRiskROI: 0.02,
      lowRiskROI: 0.01,
      baseAnnualExpenses: 80_000,
      endAge: 104,
    }));
    expect(result.depletionAge).not.toBeNull();
    expect(result.depletionAge).toBeLessThan(104);
  });

  it('reports null depletion when TSP survives', () => {
    const result = projectRetirementSimulation(makeConfig({
      tspBalanceAtRetirement: 2_000_000,
      withdrawalRate: 0.02,
      highRiskROI: 0.08,
      lowRiskROI: 0.03,
    }));
    expect(result.depletionAge).toBeNull();
  });

  it('balanceAt85 is captured correctly', () => {
    const result = projectRetirementSimulation(makeConfig({
      retirementAge: 60,
      endAge: 95,
    }));
    expect(result.balanceAt85).toBeGreaterThanOrEqual(0);
    // Should match the year result at age 85
    const yr85 = result.years.find((y) => y.age === 85);
    expect(yr85).toBeDefined();
    expect(result.balanceAt85).toBe(yr85!.totalTSPBalance);
  });

  it('time-step buffer rebalances high→low', () => {
    // With timeStepYears=3 and large withdrawals, low-risk should get refilled
    const result = projectRetirementSimulation(makeConfig({
      timeStepYears: 3,
      withdrawalRate: 0.05,
    }));
    // After year 1, low-risk should have approximately 3× next year's withdrawal
    const yr1 = result.years[1];
    expect(yr1.lowRiskBalance).toBeGreaterThan(0);
  });

  it('lifetime totals are accumulated', () => {
    const result = projectRetirementSimulation(makeConfig());
    expect(result.totalLifetimeIncome).toBeGreaterThan(0);
    expect(result.totalLifetimeExpenses).toBeGreaterThan(0);
    // Lifetime income should be sum of all year incomes
    const sumIncome = result.years.reduce((s, y) => s + y.totalIncome, 0);
    expect(result.totalLifetimeIncome).toBeCloseTo(sumIncome, 0);
  });
});
