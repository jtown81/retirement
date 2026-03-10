/**
 * useFullSimulation Hook
 *
 * Computes the full post-retirement simulation with tax calculations.
 * This complements useSimulation which provides the simple income-vs-expenses view.
 *
 * Returns FullSimulationResult if SimulationConfig is available, or null if not.
 */

import { useMemo } from 'react';
import type { SimulationConfig, FullSimulationResult } from '@models/simulation';
import { unifiedRetirementSimulation } from '@modules/simulation';
import { useLocalStorage } from './useLocalStorage';

/**
 * Get the simulation config from localStorage.
 */
function getSimulationConfig(): SimulationConfig | null {
  const stored = localStorage.getItem('retire:simulation-config');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Compute the full retirement simulation with tax calculations.
 * Returns null if SimulationConfig is not configured.
 */
export function useFullSimulation(): FullSimulationResult | null {
  return useMemo(() => {
    const config = getSimulationConfig();
    if (!config) return null;

    try {
      return unifiedRetirementSimulation(config);
    } catch (error) {
      console.error('Error computing full simulation:', error);
      return null;
    }
  }, []);
}
