/**
 * Scenario Engine
 * Formula: simulation/scenario-comparison
 *
 * Runs named retirement scenarios and produces comparable side-by-side results.
 * Typical use: compare retire-at-MRA+30 vs retire-at-62, Roth-heavy vs Traditional-heavy.
 *
 * Deterministic: given the same input, runScenario always returns the same result.
 */

import type { SimulationInput, SimulationResult, RetirementScenario } from '../../models/simulation';
import { projectRetirementIncome } from './income-projection';

export interface ScenarioSummary {
  id: string;
  label: string;
  high3Salary: number;
  creditableServiceYears: number;
  annualAnnuity: number;
  fersSupplementEligible: boolean;
  eligibilityType: string | null;
  /** Net surplus (income - expenses) at year 10, or null if horizon < 10 */
  surplusAtYear10: number | null;
  /** Net surplus at year 20, or null if horizon < 20 */
  surplusAtYear20: number | null;
  /** Net surplus at year 30, or null if horizon < 30 */
  surplusAtYear30: number | null;
  /** True if income exceeds expenses in every projected year */
  sustainableThroughHorizon: boolean;
}

export interface ScenarioComparisonResult {
  scenarios: ScenarioSummary[];
  /** ID of the scenario with the highest year-1 annuity */
  highestAnnuity: string | null;
  /** ID of the scenario that sustains positive surplus longest */
  mostSustainable: string | null;
}

/**
 * Runs a single named retirement scenario.
 *
 * Formula ID: simulation/scenario-comparison (single run)
 *
 * @param input - Simulation input for this scenario
 * @returns RetirementScenario with computed result attached
 */
export function runScenario(input: SimulationInput & { id: string; label: string }): RetirementScenario {
  const result = projectRetirementIncome(input);
  return {
    id: input.id,
    label: input.label,
    input,
    result,
  };
}

/**
 * Compares multiple retirement scenarios side-by-side.
 *
 * Formula ID: simulation/scenario-comparison
 *
 * Each scenario is run independently. Results are not cross-dependent.
 *
 * @param scenarios - Array of labeled simulation inputs
 * @returns Comparison result with per-scenario summaries and winners
 */
export function compareScenarios(
  scenarios: Array<SimulationInput & { id: string; label: string }>,
): ScenarioComparisonResult {
  if (scenarios.length === 0) {
    return { scenarios: [], highestAnnuity: null, mostSustainable: null };
  }

  const summaries: ScenarioSummary[] = scenarios.map((s) => {
    const result = projectRetirementIncome(s);
    return buildSummary(s.id, s.label, result);
  });

  const highestAnnuity = summaries.reduce((best, s) =>
    s.annualAnnuity > (best?.annualAnnuity ?? -Infinity) ? s : best,
  ).id;

  const mostSustainable = summaries
    .filter((s) => s.sustainableThroughHorizon)
    .sort((a, b) => (b.annualAnnuity - a.annualAnnuity))[0]?.id ?? null;

  return { scenarios: summaries, highestAnnuity, mostSustainable };
}

function buildSummary(id: string, label: string, result: SimulationResult): ScenarioSummary {
  const proj = result.projections;

  const surplusAt = (targetYear: number): number | null => {
    const entry = proj.find((p) => p.year === result.projections[0]?.year + targetYear - 1);
    return entry?.surplus ?? null;
  };

  const sustainableThroughHorizon =
    proj.length > 0 && proj.every((p) => p.surplus >= 0);

  return {
    id,
    label,
    high3Salary: result.high3Salary,
    creditableServiceYears: result.creditableServiceYears,
    annualAnnuity: result.annualAnnuity,
    fersSupplementEligible: result.fersSupplementEligible,
    eligibilityType: result.eligibility.type,
    surplusAtYear10: surplusAt(10),
    surplusAtYear20: surplusAt(20),
    surplusAtYear30: surplusAt(30),
    sustainableThroughHorizon,
  };
}
