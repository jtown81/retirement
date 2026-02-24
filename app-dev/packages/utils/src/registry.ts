/**
 * Formula Registry
 *
 * Runtime registry of all formulas used in the app.
 * Each formula entry provides full auditability.
 *
 * The canonical human-readable registry lives in: docs/formula-registry.md
 * This module provides the programmatic version for tooling and validation.
 */

export interface FormulaEntry {
  id: string;           // e.g., "simulation/fers-basic-annuity"
  name: string;
  module: string;
  purpose: string;
  sourceRef: string;    // OPM chapter, IRC section, or spreadsheet cell
  classification: 'hard-regulatory' | 'assumption' | 'user-configurable';
  version: string;      // semver
  changelog: Array<{ date: string; author: string; description: string }>;
}

const registry: Map<string, FormulaEntry> = new Map();

export function registerFormula(entry: FormulaEntry): void {
  registry.set(entry.id, entry);
}

export function getFormula(id: string): FormulaEntry | undefined {
  return registry.get(id);
}

export function getAllFormulas(): FormulaEntry[] {
  return Array.from(registry.values());
}
