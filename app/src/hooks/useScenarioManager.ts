/**
 * Scenario Manager Hook
 * CRUD operations for named scenarios and comparison utilities.
 */

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS, NamedScenariosArraySchema } from '@storage/index';
import type { NamedScenario, ScenarioComparisonMetrics } from '@models/scenario';
import type { FullSimulationResult } from '@models/simulation';

/**
 * Custom hook for scenario management.
 * Handles CRUD operations (create, read, update, delete) on named scenarios
 * and comparison metrics extraction.
 */
export function useScenarioManager() {
  const [scenarios, setScenarios] = useLocalStorage(
    STORAGE_KEYS.NAMED_SCENARIOS,
    NamedScenariosArraySchema,
  );

  /**
   * Save current inputs + simulation result as a new scenario
   */
  const saveScenario = useCallback(
    (
      label: string,
      inputs: any, // SimulationInput
      result: FullSimulationResult,
      description?: string,
    ): string | null => {
      if (!scenarios) return null;

      const newScenario: NamedScenario = {
        id: crypto.randomUUID?.() ?? generateId(),
        label,
        createdAt: new Date().toISOString().split('T')[0],
        description,
        inputs,
        result,
        isBaseline: scenarios.length === 0, // first scenario is baseline
      };

      setScenarios([...scenarios, newScenario]);
      return newScenario.id;
    },
    [scenarios, setScenarios],
  );

  /**
   * Load a saved scenario (returns the scenario object, caller populates forms)
   */
  const loadScenario = useCallback(
    (id: string): NamedScenario | null => {
      const scenario = scenarios?.find((s) => s.id === id);
      return (scenario ?? null) as NamedScenario | null;
    },
    [scenarios],
  );

  /**
   * Update scenario label and description
   */
  const updateScenario = useCallback(
    (id: string, updates: { label?: string; description?: string }): void => {
      if (!scenarios) return;
      setScenarios(
        scenarios.map((s) =>
          s.id === id
            ? {
                ...s,
                ...updates,
                updatedAt: new Date().toISOString().split('T')[0],
              }
            : s,
        ),
      );
    },
    [scenarios, setScenarios],
  );

  /**
   * Delete a scenario
   * Prevents deletion if it's the only baseline scenario
   */
  const deleteScenario = useCallback(
    (id: string): void => {
      if (!scenarios) return;

      const baselines = scenarios.filter((s) => s.isBaseline);
      if (baselines.length === 1 && baselines[0].id === id) {
        throw new Error('Cannot delete the last baseline scenario');
      }

      setScenarios(scenarios.filter((s) => s.id !== id));
    },
    [scenarios, setScenarios],
  );

  /**
   * Set which scenario is the baseline for comparison
   */
  const setBaseline = useCallback(
    (id: string): void => {
      if (!scenarios) return;
      setScenarios(
        scenarios.map((s) => ({
          ...s,
          isBaseline: s.id === id,
        })),
      );
    },
    [scenarios, setScenarios],
  );

  /**
   * Get the baseline scenario (only one at a time)
   */
  const getBaseline = useCallback((): (NamedScenario & any) | null => {
    return (scenarios?.find((s) => s.isBaseline) ?? null) as (NamedScenario & any) | null;
  }, [scenarios]);

  /**
   * Extract comparison metrics from a scenario
   * Metrics include Year 1 income/tax, lifetime summary, and effective rates
   */
  const getComparisonMetrics = useCallback(
    (scenario: NamedScenario & any): ScenarioComparisonMetrics => {
      const year1 = scenario.result.years[0];
      const totalIncome = scenario.result.totalLifetimeIncome;
      const totalTax = scenario.result.totalLifetimeTax ?? 0;

      return {
        scenarioId: scenario.id,
        label: scenario.label,

        // Year 1 Income
        year1Annuity: year1?.annuity ?? 0,
        year1SupplementaryAnnuity: year1?.fersSupplement ?? 0,
        year1SocialSecurity: year1?.socialSecurity ?? 0,
        year1TSPWithdrawal: year1?.tspWithdrawal ?? 0,
        year1GrossIncome: year1?.totalIncome ?? 0,

        // Year 1 Taxes
        year1FederalTax: year1?.federalTax ?? 0,
        year1StateTax: year1?.stateTax ?? 0,
        year1IrmaaSurcharge: year1?.irmaaSurcharge ?? 0,

        // Year 1 After-Tax
        year1AfterTaxIncome: year1?.afterTaxIncome ?? 0,
        year1MonthlyAfterTax: (year1?.afterTaxIncome ?? 0) / 12,

        // Lifetime Summary
        totalLifetimeIncome: totalIncome,
        totalLifetimeTax: totalTax,
        totalLifetimeAfterTaxIncome: scenario.result.totalLifetimeAfterTaxIncome ?? 0,

        // Effective Rates
        effectiveFederalRate: totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0,
        effectiveTotalRate: totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0,

        // Longevity
        depletionAge: scenario.result.depletionAge,
        balanceAt85: scenario.result.balanceAt85,

        // User Inputs
        retirementAge: scenario.result.config.retirementAge,
        years: scenario.result.years.length,
      };
    },
    [],
  );

  return {
    scenarios: scenarios ?? [],
    saveScenario,
    loadScenario,
    updateScenario,
    deleteScenario,
    setBaseline,
    getBaseline,
    getComparisonMetrics,
  };
}

/**
 * Fallback ID generator (for browsers without crypto.randomUUID)
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
