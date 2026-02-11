/**
 * Local Storage Schema
 *
 * Every stored record includes a schemaVersion field.
 * This enables safe migrations when the data model changes.
 *
 * Version history:
 *   1 — initial schema (Phase 2)
 */

export const CURRENT_SCHEMA_VERSION = 1;

export interface StoredRecord<T> {
  schemaVersion: number;
  updatedAt: string;  // ISO 8601
  data: T;
}

/** Storage keys — all app data lives under these keys */
export const STORAGE_KEYS = {
  PERSONAL_INFO: 'retire:personal',
  CAREER_PROFILE: 'retire:career',
  LEAVE_BALANCE: 'retire:leave',
  TSP_BALANCES: 'retire:tsp',
  TSP_CONTRIBUTIONS: 'retire:tsp:contributions',
  MILITARY_SERVICE: 'retire:military',
  EXPENSE_PROFILE: 'retire:expenses',
  ASSUMPTIONS: 'retire:assumptions',
  SCENARIOS: 'retire:scenarios',
} as const;
