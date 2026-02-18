/**
 * Scenario Data Models
 * Named scenario management for retirement plan "what-if" analysis.
 */

import type { ISODate, USD } from './common';
import type { SimulationInput, SimulationConfig, SimulationYearResult, FullSimulationResult } from './simulation';

/**
 * A user-saved retirement plan scenario.
 * Captures a complete snapshot of inputs and results at a point in time.
 */
export interface NamedScenario {
  /** Unique identifier (UUID or timestamp-based) */
  id: string;
  /** User-defined label (e.g., "Retire at 57 — MRA+30") */
  label: string;
  /** ISO date when scenario was created */
  createdAt: ISODate;
  /** Optional user description/notes */
  description?: string;
  /** Snapshot of all form inputs at time of save */
  inputs: SimulationInput;
  /** Snapshot of full simulation result at time of save */
  result: FullSimulationResult;
  /** Whether this is the "baseline" scenario for comparison */
  isBaseline: boolean;
  /** ISO date when scenario was last modified */
  updatedAt?: ISODate;
}

/**
 * Comparison metrics extracted from a scenario for display in comparison table.
 * Includes key metrics from Year 1 and full lifecycle summary.
 */
export interface ScenarioComparisonMetrics {
  scenarioId: string;
  label: string;

  // Year 1 Income
  year1Annuity: USD;
  year1SupplementaryAnnuity: USD;
  year1SocialSecurity: USD;
  year1TSPWithdrawal: USD;
  year1GrossIncome: USD;

  // Year 1 Taxes
  year1FederalTax: USD;
  year1StateTax: USD;
  year1IrmaaSurcharge: USD;

  // Year 1 After-Tax
  year1AfterTaxIncome: USD;
  year1MonthlyAfterTax: USD;

  // Lifetime Summary
  totalLifetimeIncome: USD;
  totalLifetimeTax: USD;
  totalLifetimeAfterTaxIncome: USD;

  // Effective Rates
  effectiveFederalRate: number; // percentage, e.g. 11.5
  effectiveTotalRate: number;

  // Longevity
  depletionAge: number | null;
  balanceAt85: USD;

  // User Inputs (for reference)
  retirementAge: number;
  years: number; // length of projection
}

/**
 * Delta (difference) between two scenarios for a single metric.
 * Used in comparison table.
 */
export interface ScenarioDelta {
  label: string;
  baselineValue: number | USD | null;
  comparisonValue: number | USD | null;
  deltaValue: number | USD;
  deltaPercentage: number; // e.g., 5.2 for +5.2%
  isImprovement: boolean; // true if delta is positive for this metric
}
