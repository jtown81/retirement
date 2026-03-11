/**
 * Monte Carlo Simulation for TSP Balance Projection
 * Formula: simulation/monte-carlo
 *
 * Runs N stochastic simulations with varied investment returns to generate
 * confidence bands (p10, p50, p90) around TSP balance projections.
 *
 * Source: Standard Monte Carlo methodology applied to TSP asset allocation.
 * Uses deterministic seeded random numbers for reproducibility.
 */

import type { SimulationConfig } from '../../models/simulation';
import { unifiedRetirementSimulation } from './unified-engine';

export interface MonteCarloResult {
  year: number;
  age: number;
  p10: number;  // 10th percentile
  p50: number;  // Median (50th percentile)
  p90: number;  // 90th percentile
}

/**
 * Simple seeded PRNG using Mulberry32 (32-bit hash).
 * Deterministic and doesn't require external dependencies.
 */
function seededRandom(seed: number): number {
  const t = (seed += 0x6d2b79f5);
  const x = Math.imul(t ^ (t >>> 15), 1 | t);
  return ((x ^ (x + 1)) >>> 0) / 4294967296;
}

/**
 * Box-Muller transform to sample from a standard normal distribution.
 * Uses seeded RNG for reproducibility.
 */
function sampleNormal(seed: number): [number, number] {
  const rng1 = seededRandom(seed);
  const rng2 = seededRandom(seed + 1);
  const u1 = Math.max(1e-8, rng1); // Avoid log(0)
  const u2 = rng2;
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
  return [z0, z1];
}

/**
 * Runs a Monte Carlo simulation with N iterations of stochastic returns.
 * Samples highRiskROI from a normal distribution with std dev = 0.06.
 *
 * @param config - Simulation configuration (must be valid for unifiedRetirementSimulation)
 * @param n - Number of simulations to run (default: 200)
 * @returns Percentile results (p10, p50, p90) per year
 */
export function runMonteCarlo(config: SimulationConfig, n = 200): MonteCarloResult[] {
  const results: MonteCarloResult[] = [];
  const tspBalancesByYear: number[][] = [];

  // Run N simulations with varied returns
  for (let i = 0; i < n; i++) {
    const seed = i * 12345 + 67890; // Deterministic seed based on iteration
    const [z0] = sampleNormal(seed);

    // Sample highRiskROI from Normal(mean, σ=0.06)
    const sampledROI = config.highRiskROI + z0 * 0.06;

    // Create a config variant with the sampled ROI
    const variantConfig: SimulationConfig = {
      ...config,
      highRiskROI: sampledROI,
    };

    // Run the full simulation with this variant
    const fullResult = unifiedRetirementSimulation(variantConfig);

    // Extract TSP balances per year
    for (let y = 0; y < fullResult.years.length; y++) {
      if (!tspBalancesByYear[y]) {
        tspBalancesByYear[y] = [];
      }
      tspBalancesByYear[y].push(fullResult.years[y].totalTSPBalance);
    }
  }

  // Compute percentiles per year
  for (let y = 0; y < tspBalancesByYear.length; y++) {
    const balances = tspBalancesByYear[y].sort((a, b) => a - b);
    const p10Idx = Math.floor(balances.length * 0.1);
    const p50Idx = Math.floor(balances.length * 0.5);
    const p90Idx = Math.floor(balances.length * 0.9);

    results.push({
      year: config.retirementAge + y,
      age: config.retirementAge + y,
      p10: balances[p10Idx] ?? 0,
      p50: balances[p50Idx] ?? 0,
      p90: balances[p90Idx] ?? 0,
    });
  }

  return results;
}
