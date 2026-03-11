/**
 * Retirement Simulation Engine
 *
 * DEPRECATED: This module is maintained for backward compatibility.
 * Use unifiedRetirementSimulation() from unified-engine.ts instead.
 *
 * This is now a thin wrapper around the unified engine that provides
 * the same public API as before.
 *
 * Year-by-year post-retirement projection with:
 *   - Dual-pot TSP (high-risk / low-risk) with separate ROIs
 *   - Traditional / Roth balance tracking through both pots
 *   - RMD compliance (SECURE 2.0: age 73+)
 *   - GoGo / GoSlow / NoGo expense smile curve
 *   - Time-step buffer rebalancing (1–3 years in low-risk pot)
 *   - FERS annuity + Supplement + Social Security income
 *   - Tax calculations (federal + IRMAA)
 *   - COLA and inflation adjustments
 *
 * Source: Retire-original.xlsx "Retirement Assumptions" tab; OPM FERS Handbook;
 *         IRC § 401(a)(9); IRS Pub 590-B
 *
 * @deprecated Use unifiedRetirementSimulation() from unified-engine.ts
 */

import type {
  SimulationConfig,
  SimulationYearResult,
  FullSimulationResult,
} from '../../models/simulation';
import { unifiedRetirementSimulation } from './unified-engine';

/**
 * Runs the full post-retirement simulation.
 *
 * DEPRECATED: This function is now a thin wrapper around unifiedRetirementSimulation()
 * for backward compatibility. Direct calls to unifiedRetirementSimulation() are preferred.
 *
 * Processing order per year:
 *   1. Compute income (annuity, supplement, SS)
 *   1.5. Compute federal tax (income tax + IRMAA) if filing status configured
 *   2. Compute expenses (smile curve × inflation)
 *   3. Determine TSP withdrawal needed (expenses - other income)
 *   4. Enforce RMD on Traditional balance
 *   5. Withdraw from TSP (low-risk pot first)
 *   6. Grow balances by ROI
 *   7. Rebalance high→low to maintain time-step buffer
 *   8. Record year results
 *
 * @param config - SimulationConfig with all projection parameters
 * @returns FullSimulationResult with year-by-year projections
 *
 * @deprecated Use unifiedRetirementSimulation() from unified-engine.ts instead
 */
export function projectRetirementSimulation(
  config: SimulationConfig,
): FullSimulationResult {
  return unifiedRetirementSimulation(config);
}
