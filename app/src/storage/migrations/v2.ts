/**
 * Schema Migration: v1 → v2
 *
 * Changes:
 * 1. Adds TAX_PROFILE key with default TaxProfile
 * 2. Adds TSP_SNAPSHOTS key to support balance history (wraps v1 TSP_BALANCES)
 * 3. Clarifies SCENARIOS → NAMED_SCENARIOS (same key, semantic rename)
 *
 * Migration is idempotent — safe to call multiple times.
 */

import type { TaxProfile } from '@fedplan/models';
import type { TSPBalances, TSPAccountSnapshot } from '@fedplan/models';
import type { StoredRecord } from '@storage/schema';

export const VERSION = 2;

/**
 * Migrate from v1 to v2 schema.
 *
 * @param data - Raw localStorage data object (keyed by storage key)
 * @returns Migrated data with v2 keys populated
 */
export function migrate(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return data;
  }
  const dataObj = data as Record<string, unknown>;
  // 1. Initialize TAX_PROFILE if not present
  if (!dataObj['retire:tax-profile']) {
    const defaultTaxProfile: TaxProfile = {
      filingStatus: 'single',
      stateCode: null,
      stateResidencyYear: new Date().getFullYear(),
      deductionStrategy: 'standard',
      modelIrmaa: false,
    };
    dataObj['retire:tax-profile'] = wrapRecord(defaultTaxProfile, 2);
  }

  // 2. Initialize TSP_SNAPSHOTS if not present
  // If v1 TSP_BALANCES exists, wrap it as a snapshot; otherwise start empty
  if (!dataObj['retire:tsp:snapshots']) {
    const snapshots: TSPAccountSnapshot[] = [];

    // If v1 TSP_BALANCES exists, migrate it to snapshot format
    if (dataObj['retire:tsp']) {
      try {
        const legacyRecord = dataObj['retire:tsp'] as StoredRecord<TSPBalances>;
        if (legacyRecord.data) {
          const legacy = legacyRecord.data;
          const snapshot: TSPAccountSnapshot = {
            id: generateUUID(),
            asOf: legacy.asOf,
            source: 'manual',
            traditionalBalance: legacy.traditionalBalance,
            rothBalance: legacy.rothBalance,
            ytdEmployeeContributions: 0,
            ytdAgencyContributions: 0,
            fundAllocations: [],
            notes: 'Migrated from v1 TSP_BALANCES',
          };
          snapshots.push(snapshot);
        }
      } catch (e) {
        // If legacy data is malformed, skip it; start with empty snapshots
      }
    }

    dataObj['retire:tsp:snapshots'] = wrapRecord(snapshots, 2);
  }

  // 3. SCENARIOS key remains unchanged; migration is semantic only

  return dataObj;
}

/**
 * Wraps data in a StoredRecord envelope with schemaVersion and timestamp.
 */
function wrapRecord<T>(data: T, schemaVersion: number): StoredRecord<T> {
  return {
    schemaVersion,
    updatedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Generates a simple UUID (v4-ish) for snapshot IDs.
 * In production, use crypto.randomUUID() if available.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: simple random string (not cryptographically secure, but sufficient for local storage)
  return `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
