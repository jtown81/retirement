/**
 * Local Storage Schema
 *
 * Every stored record includes a schemaVersion field.
 * This enables safe migrations when the data model changes.
 *
 * Version history:
 *   1 — initial schema (Phase 2)
 *   2 — add tax module, TSP snapshots, named scenarios (Phase 10 / PR-001/002)
 */

export const CURRENT_SCHEMA_VERSION = 2;

export interface StoredRecord<T> {
  schemaVersion: number;
  updatedAt: string;  // ISO 8601
  data: T;
}

/** Storage keys — all app data lives under these keys */
export const STORAGE_KEYS = {
  // Personal & career
  PERSONAL_INFO: 'retire:personal',
  CAREER_PROFILE: 'retire:career',
  MILITARY_SERVICE: 'retire:military',

  // Leave
  LEAVE_BALANCE: 'retire:leave',
  LEAVE_CALENDAR: 'retire:leave-calendar',

  // TSP (v1 point-in-time balance; deprecated in v3)
  TSP_BALANCES: 'retire:tsp',
  TSP_CONTRIBUTIONS: 'retire:tsp:contributions',
  // v2 addition: balance history with fund allocation
  TSP_SNAPSHOTS: 'retire:tsp:snapshots',
  TSP_ACCOUNT_SNAPSHOTS: 'retire:tsp:snapshots', // Alias for clarity

  // Expenses
  EXPENSE_PROFILE: 'retire:expenses',

  // Tax (NEW in v2)
  TAX_PROFILE: 'retire:tax-profile',

  // Assumptions & simulation
  ASSUMPTIONS: 'retire:assumptions',
  SIMULATION_CONFIG: 'retire:simulation-config',

  // FERS estimate
  FERS_ESTIMATE: 'retire:fers-estimate',
  FERS_FORM_DRAFT: 'retire:fers-form-draft',

  // Scenarios (v2: renamed to NAMED_SCENARIOS for clarity, but key unchanged)
  SCENARIOS: 'retire:scenarios',
  NAMED_SCENARIOS: 'retire:scenarios', // Alias (same key as SCENARIOS)
} as const;
