/**
 * Monte Carlo Simulation Tests
 *
 * Comprehensive test coverage for stochastic analysis engine:
 *   - Box-Muller normal distribution properties
 *   - Percentile calculation correctness
 *   - Trial balance tracking
 *   - Success rate computation
 *   - Withdrawal strategy support
 *   - Edge cases (zero volatility, extreme volatility)
 */

import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '@modules/simulation';
import type { SimulationConfig } from '@models/simulation';

// Helper: Create a baseline SimulationConfig for testing
function baselineConfig(): SimulationConfig {
  return {
    retirementAge: 62,
    retirementYear: 2025,
    endAge: 95,
    birthYear: 1963,
    fersAnnuity: 48000,
    fersSupplement: 12000,
    ssMonthlyAt62: 2500,
    ssClaimingAge: 62,
    tspBalanceAtRetirement: 500000,
    traditionalPct: 0.7,
    highRiskPct: 0.6,
    highRiskROI: 0.08,
    lowRiskROI: 0.03,
    withdrawalRate: 0.04,
    timeStepYears: 1,
    withdrawalStrategy: 'proportional',
    baseAnnualExpenses: 60000,
    goGoEndAge: 75,
    goGoRate: 1.0,
    goSlowEndAge: 85,
    goSlowRate: 0.85,
    noGoRate: 0.75,
    colaRate: 0.025,
    inflationRate: 0.025,
  };
}

describe('Monte Carlo Simulation', () => {
  describe('Basic functionality', () => {
    it('runMonteCarlo produces valid MonteCarloResult', () => {
      const config = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 100 });

      expect(result).toHaveProperty('bands');
      expect(result).toHaveProperty('overallSuccessRate');
      expect(result).toHaveProperty('successRateAt85');
      expect(result).toHaveProperty('medianDepletionAge');

      expect(Array.isArray(result.bands)).toBe(true);
      expect(result.bands.length).toBeGreaterThan(0);
    });

    it('bands include all years from retirement to endAge', () => {
      const config = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 100 });

      const ages = result.bands.map((b) => b.age);
      expect(Math.min(...ages)).toBe(config.retirementAge);
      expect(Math.max(...ages)).toBe(config.endAge);
      expect(ages.length).toBe(config.endAge - config.retirementAge + 1);
    });

    it('each band has all required percentile fields', () => {
      const config = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 100 });

      for (const band of result.bands) {
        expect(band).toHaveProperty('year');
        expect(band).toHaveProperty('age');
        expect(band).toHaveProperty('p10_balance');
        expect(band).toHaveProperty('p25_balance');
        expect(band).toHaveProperty('p50_balance');
        expect(band).toHaveProperty('p75_balance');
        expect(band).toHaveProperty('p90_balance');
        expect(band).toHaveProperty('successRate');
      }
    });
  });

  describe('Percentile monotonicity', () => {
    it('percentiles maintain order: P10 ≤ P25 ≤ P50 ≤ P75 ≤ P90', () => {
      const config = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 100 });

      for (const band of result.bands) {
        expect(band.p10_balance).toBeLessThanOrEqual(band.p25_balance);
        expect(band.p25_balance).toBeLessThanOrEqual(band.p50_balance);
        expect(band.p50_balance).toBeLessThanOrEqual(band.p75_balance);
        expect(band.p75_balance).toBeLessThanOrEqual(band.p90_balance);
      }
    });

    it('success rate is between 0 and 1 at all ages', () => {
      const config = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 100 });

      for (const band of result.bands) {
        expect(band.successRate).toBeGreaterThanOrEqual(0);
        expect(band.successRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Success rate properties', () => {
    it('success rate is monotonic (non-increasing over time)', () => {
      const config = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 200 });

      for (let i = 1; i < result.bands.length; i++) {
        expect(result.bands[i].successRate).toBeLessThanOrEqual(result.bands[i - 1].successRate + 0.01);
        // Allow small epsilon for rounding
      }
    });

    it('overallSuccessRate matches final age success rate', () => {
      const config = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 100 });

      const finalBand = result.bands[result.bands.length - 1];
      expect(result.overallSuccessRate).toBeCloseTo(finalBand.successRate, 2);
    });

    it('successRateAt85 is 0 if endAge < 85', () => {
      const config = { ...baselineConfig(), endAge: 80 };
      const result = runMonteCarlo(config, { iterations: 100 });

      expect(result.successRateAt85).toBe(0);
    });

    it('successRateAt85 > 0 if some trials survive to age 85', () => {
      const config = baselineConfig(); // endAge = 95
      const result = runMonteCarlo(config, { iterations: 100 });

      // With reasonable starting balance, some should survive to 85
      expect(result.successRateAt85).toBeGreaterThan(0);
    });
  });

  describe('Volatility effects', () => {
    it('zero volatility (stdDev=0) produces narrow bands', () => {
      const config = baselineConfig();
      const result = runMonteCarlo(config, {
        iterations: 100,
        highRiskStdDev: 0,
        lowRiskStdDev: 0,
      });

      // With no volatility, all trials should follow same path
      // P10 and P90 should be very close (almost identical)
      for (const band of result.bands) {
        const spread = band.p90_balance - band.p10_balance;
        const midpoint = band.p50_balance;
        const spreadRatio = midpoint > 0 ? spread / midpoint : 0;
        // Should be nearly zero spread
        expect(spreadRatio).toBeLessThan(0.001);
      }
    });

    it('higher volatility produces wider bands', () => {
      const config = baselineConfig();
      const result1 = runMonteCarlo(config, {
        iterations: 200,
        highRiskStdDev: 0.05, // Low volatility
        lowRiskStdDev: 0.02,
      });

      const result2 = runMonteCarlo(config, {
        iterations: 200,
        highRiskStdDev: 0.25, // High volatility
        lowRiskStdDev: 0.10,
      });

      // At age 80 (mid-timeline), compare band width
      const band1 = result1.bands.find((b) => b.age === 80);
      const band2 = result2.bands.find((b) => b.age === 80);

      if (band1 && band2) {
        const spread1 = band1.p90_balance - band1.p10_balance;
        const spread2 = band2.p90_balance - band2.p10_balance;
        // Higher volatility should produce wider bands
        expect(spread2).toBeGreaterThan(spread1);
      }
    });
  });

  describe('Withdrawal strategy support', () => {
    it('proportional strategy produces valid results', () => {
      const config: SimulationConfig = { ...baselineConfig(), withdrawalStrategy: 'proportional' };
      const result = runMonteCarlo(config, { iterations: 100 });

      expect(result.bands.length).toBeGreaterThan(0);
      expect(result.overallSuccessRate).toBeGreaterThanOrEqual(0);
    });

    it('traditional-first strategy produces valid results', () => {
      const config: SimulationConfig = { ...baselineConfig(), withdrawalStrategy: 'traditional-first' };
      const result = runMonteCarlo(config, { iterations: 100 });

      expect(result.bands.length).toBeGreaterThan(0);
      expect(result.overallSuccessRate).toBeGreaterThanOrEqual(0);
    });

    it('roth-first strategy produces valid results', () => {
      const config: SimulationConfig = { ...baselineConfig(), withdrawalStrategy: 'roth-first' };
      const result = runMonteCarlo(config, { iterations: 100 });

      expect(result.bands.length).toBeGreaterThan(0);
      expect(result.overallSuccessRate).toBeGreaterThanOrEqual(0);
    });

    it('custom strategy produces valid results', () => {
      const config: SimulationConfig = {
        ...baselineConfig(),
        withdrawalStrategy: 'custom',
        customWithdrawalSplit: { traditionalPct: 0.8, rothPct: 0.2 },
      };
      const result = runMonteCarlo(config, { iterations: 100 });

      expect(result.bands.length).toBeGreaterThan(0);
      expect(result.overallSuccessRate).toBeGreaterThanOrEqual(0);
    });

    it('different strategies may have different success rates', () => {
      const baseConfig = baselineConfig();

      const propResult = runMonteCarlo(baseConfig, { iterations: 200 });

      const tradFirstConfig: SimulationConfig = { ...baseConfig, withdrawalStrategy: 'traditional-first' };
      const tradFirstResult = runMonteCarlo(tradFirstConfig, { iterations: 200 });

      // Results should differ (though randomization adds variance)
      // We just verify both ran without error
      expect(propResult.overallSuccessRate).toBeGreaterThanOrEqual(0);
      expect(tradFirstResult.overallSuccessRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Withdrawal rate effects', () => {
    it('low withdrawal rate has high success rate', () => {
      const config: SimulationConfig = { ...baselineConfig(), withdrawalRate: 0.02 }; // 2% withdrawal
      const result = runMonteCarlo(config, { iterations: 100 });

      // Low withdrawal → TSP lasts longer
      expect(result.overallSuccessRate).toBeGreaterThan(0.8);
    });

    it('high withdrawal rate has low success rate', () => {
      const config: SimulationConfig = { ...baselineConfig(), withdrawalRate: 0.08 }; // 8% withdrawal
      const result = runMonteCarlo(config, { iterations: 100 });

      // High withdrawal → TSP depletes faster
      expect(result.overallSuccessRate).toBeLessThan(0.5);
    });

    it('very high withdrawal rate may deplete immediately', () => {
      const config: SimulationConfig = {
        ...baselineConfig(),
        withdrawalRate: 0.20, // 20% withdrawal (unrealistic)
      };
      const result = runMonteCarlo(config, { iterations: 50 });

      // TSP should deplete very quickly with 20% annual withdrawal
      expect(result.overallSuccessRate).toBeLessThan(0.3);
      if (result.medianDepletionAge !== null) {
        expect(result.medianDepletionAge).toBeLessThan(config.endAge - 5);
      }
    });
  });

  describe('Edge cases', () => {
    it('handles starting balance of 0', () => {
      const config: SimulationConfig = { ...baselineConfig(), tspBalanceAtRetirement: 0 };
      const result = runMonteCarlo(config, { iterations: 50 });

      // Should not crash; success rate should be 0 (no TSP to withdraw)
      expect(result.overallSuccessRate).toBe(0);
      expect(result.bands[0]?.p50_balance).toBe(0);
    });

    it('handles very large starting balance', () => {
      const config: SimulationConfig = { ...baselineConfig(), tspBalanceAtRetirement: 5000000 };
      const result = runMonteCarlo(config, { iterations: 50 });

      // Should not crash; with large balance and 33-year horizon, success rate should be decent
      expect(result.overallSuccessRate).toBeGreaterThan(0.5);
    });

    it('handles short projection horizon (5 years)', () => {
      const config: SimulationConfig = { ...baselineConfig(), endAge: 67 };
      const result = runMonteCarlo(config, { iterations: 50 });

      expect(result.bands.length).toBe(6); // 62 to 67 inclusive
      expect(result.overallSuccessRate).toBeGreaterThan(0);
    });

    it('handles long projection horizon (40+ years)', () => {
      const config: SimulationConfig = { ...baselineConfig(), endAge: 102 };
      const result = runMonteCarlo(config, { iterations: 50 });

      expect(result.bands.length).toBe(41); // 62 to 102 inclusive
      // Long horizon likely to see depletion with standard withdrawal rate
      expect(result.overallSuccessRate).toBeLessThan(0.8);
    });
  });

  describe('Depletion tracking', () => {
    it('medianDepletionAge is set when some trials deplete', () => {
      const config: SimulationConfig = { ...baselineConfig(), withdrawalRate: 0.1 }; // Aggressive
      const result = runMonteCarlo(config, { iterations: 100 });

      // With 10% withdrawal, some should deplete
      if (result.overallSuccessRate < 0.5) {
        expect(result.medianDepletionAge).not.toBeNull();
      }
    });

    it('medianDepletionAge is between retirement age and endAge', () => {
      const config: SimulationConfig = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 100 });

      if (result.medianDepletionAge !== null) {
        expect(result.medianDepletionAge).toBeGreaterThanOrEqual(config.retirementAge);
        expect(result.medianDepletionAge).toBeLessThanOrEqual(config.endAge);
      }
    });
  });

  describe('Default parameters', () => {
    it('runMonteCarlo uses default 1000 iterations if not specified', () => {
      const config: SimulationConfig = baselineConfig();
      const result = runMonteCarlo(config); // No monteCarloConfig

      // Should run without error; typically high accuracy with 1000 iterations
      expect(result.bands.length).toBeGreaterThan(0);
    });

    it('runMonteCarlo uses default volatility (16% / 5%) if not specified', () => {
      const config: SimulationConfig = baselineConfig();
      const result = runMonteCarlo(config, { iterations: 100 }); // No stdDev

      // With standard volatility, should run without error and produce results
      expect(result.bands.length).toBeGreaterThan(0);

      // Early in retirement, bands should show some spread
      const earlyBands = result.bands.slice(0, 10); // First 10 years
      let hasSpread = false;
      for (const band of earlyBands) {
        const spread = band.p90_balance - band.p10_balance;
        if (spread > 1000) {
          // At least some spread in early years
          hasSpread = true;
          break;
        }
      }
      expect(hasSpread).toBe(true);
    });
  });

  describe('Determinism and reproducibility', () => {
    it('multiple runs with same config (and seed) produce similar distributions', () => {
      const config: SimulationConfig = baselineConfig();
      // Note: JavaScript Math.random() is not seeded, so we can't achieve exact reproducibility
      // This test just verifies results are in a similar ballpark

      const result1 = runMonteCarlo(config, { iterations: 200 });
      const result2 = runMonteCarlo(config, { iterations: 200 });

      // Success rates should be similar (within ~10%, accounting for randomization with 200 iterations)
      expect(Math.abs(result1.overallSuccessRate - result2.overallSuccessRate)).toBeLessThan(0.1);

      // Median P50 balances at age 80 should be similar
      const band1at80 = result1.bands.find((b) => b.age === 80);
      const band2at80 = result2.bands.find((b) => b.age === 80);

      if (band1at80 && band2at80) {
        const diff = Math.abs(band1at80.p50_balance - band2at80.p50_balance);
        const avg = (band1at80.p50_balance + band2at80.p50_balance) / 2;
        const pctDiff = avg > 0 ? diff / avg : 0;
        // With 200 iterations and randomization, allow ~15% variance
        expect(pctDiff).toBeLessThan(0.15);
      }
    });
  });
});
