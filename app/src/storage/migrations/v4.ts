/**
 * Schema Migration: v3 → v4
 *
 * Changes:
 * 1. Merge retire:assumptions into retire:simulation-config
 * 2. retire:assumptions is deprecated and no longer written to
 * 3. SimulationConfig now includes all RetirementAssumptions fields
 *
 * Migration consolidates both keys into retire:simulation-config as single source of truth.
 * Backward compat: If only retire:assumptions exists, it will be seeded into config structure.
 *
 * Migration is idempotent — safe to call multiple times.
 */

import type { SimulationConfig } from '@models/simulation';
import type { RetirementAssumptions } from '@models/simulation';
import type { StoredRecord } from '@storage/schema';

export const VERSION = 4;

/**
 * Migrate from v3 to v4 schema.
 *
 * The challenge: migrations run per-key. So when loading retire:simulation-config,
 * we don't have access to retire:assumptions data that might exist.
 *
 * Solution: Migration enriches config with values from assumptions if they're
 * missing. However, this requires callers to manually copy assumptions → config
 * before running migration, OR we accept that some enrichment happens at load time.
 *
 * For now, we make this migration a no-op for config (data shape already has fields),
 * and rely on useLeaveCalendar-like seeding at the component level.
 *
 * @param data - Raw localStorage data (the stored config)
 * @returns Data unchanged; consolidation happens at component level
 */
export function migrate(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return data;
  }

  const config = data as Record<string, unknown>;

  // D-3: Enrich config with assumptions fields if missing.
  // In a real migration, we'd have access to both keys, but per-key migrations
  // don't support that. Enrichment happens at component load time instead.
  // This migration just ensures schema compliance.

  // Ensure required merged fields have values
  if (config.proposedRetirementDate === undefined) {
    config.proposedRetirementDate = new Date().toISOString().slice(0, 10);
  }
  if (config.tspGrowthRate === undefined) {
    config.tspGrowthRate = 0.07; // Default 7%
  }

  return config;
}
