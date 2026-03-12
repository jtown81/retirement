/**
 * Unit tests: Local Persistence Layer
 *
 * Validates save/load round-trips, migration triggering,
 * corrupt-data rejection, and clearAll behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  save,
  load,
  remove,
  clearAll,
  exportAll,
  importAll,
  STORAGE_KEYS,
  LeaveBalanceSchema,
  TSPBalancesSchema,
  CareerProfileSchema,
} from '@storage/index';
import { CURRENT_SCHEMA_VERSION } from '@storage/schema';

// jsdom provides localStorage; clear between tests
beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// save / load round-trip
// ---------------------------------------------------------------------------

describe('save and load', () => {
  it('round-trips a LeaveBalance', () => {
    const balance = {
      asOf: '2025-01-01',
      annualLeaveHours: 160,
      sickLeaveHours: 240,
      familyCareUsedCurrentYear: 0,
    };
    save(STORAGE_KEYS.LEAVE_BALANCE, balance);
    const loaded = load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
    expect(loaded).toEqual(balance);
  });

  it('round-trips a TSPBalances record', () => {
    const tsp = {
      asOf: '2025-06-01',
      traditionalBalance: 150_000,
      rothBalance: 50_000,
    };
    save(STORAGE_KEYS.TSP_BALANCES, tsp);
    const loaded = load(STORAGE_KEYS.TSP_BALANCES, TSPBalancesSchema);
    expect(loaded).toEqual(tsp);
  });

  it('stores a StoredRecord envelope with current schema version', () => {
    save(STORAGE_KEYS.LEAVE_BALANCE, { asOf: '2025-01-01', annualLeaveHours: 0, sickLeaveHours: 0, familyCareUsedCurrentYear: 0 });
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCE)!);
    expect(raw.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(raw.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ---------------------------------------------------------------------------
// missing / null
// ---------------------------------------------------------------------------

describe('load — missing key', () => {
  it('returns null when key is absent', () => {
    const result = load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// corrupt data rejection
// ---------------------------------------------------------------------------

describe('load — corrupt data', () => {
  it('returns null and removes key when JSON is malformed', () => {
    localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCE, '{not valid json}');
    const result = load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
    expect(result).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCE)).toBeNull();
  });

  it('returns null when envelope is missing schemaVersion', () => {
    localStorage.setItem(
      STORAGE_KEYS.LEAVE_BALANCE,
      JSON.stringify({ data: { asOf: '2025-01-01' } }),
    );
    expect(load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema)).toBeNull();
  });

  it('returns null when data fails schema validation', () => {
    const badRecord = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      data: { asOf: 'not-a-date', annualLeaveHours: -5 },
    };
    localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCE, JSON.stringify(badRecord));
    expect(load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// migration triggering
// ---------------------------------------------------------------------------

describe('load — schema migration', () => {
  it('successfully loads data stored with an older schema version', () => {
    // Simulate data written by schema version 0 (pre-v1)
    const legacyRecord = {
      schemaVersion: 0,
      updatedAt: '2024-01-01T00:00:00.000Z',
      data: {
        asOf: '2024-01-01',
        annualLeaveHours: 80,
        sickLeaveHours: 120,
        familyCareUsedCurrentYear: 8,
      },
    };
    localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCE, JSON.stringify(legacyRecord));

    const loaded = load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
    expect(loaded).not.toBeNull();
    expect(loaded!.annualLeaveHours).toBe(80);
  });

  it('re-saves with current schema version after migration', () => {
    const legacyRecord = {
      schemaVersion: 0,
      updatedAt: '2024-01-01T00:00:00.000Z',
      data: { asOf: '2024-01-01', annualLeaveHours: 80, sickLeaveHours: 120, familyCareUsedCurrentYear: 0 },
    };
    localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCE, JSON.stringify(legacyRecord));
    load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);

    const updated = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCE)!);
    expect(updated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

describe('remove', () => {
  it('deletes the stored key', () => {
    save(STORAGE_KEYS.LEAVE_BALANCE, { asOf: '2025-01-01', annualLeaveHours: 0, sickLeaveHours: 0, familyCareUsedCurrentYear: 0 });
    remove(STORAGE_KEYS.LEAVE_BALANCE);
    expect(load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearAll
// ---------------------------------------------------------------------------

describe('clearAll', () => {
  it('removes all retire: keys', () => {
    save(STORAGE_KEYS.LEAVE_BALANCE, { asOf: '2025-01-01', annualLeaveHours: 0, sickLeaveHours: 0, familyCareUsedCurrentYear: 0 });
    save(STORAGE_KEYS.TSP_BALANCES, { asOf: '2025-01-01', traditionalBalance: 100_000, rothBalance: 0 });
    clearAll();
    expect(load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema)).toBeNull();
    expect(load(STORAGE_KEYS.TSP_BALANCES, TSPBalancesSchema)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// exportAll / importAll
// ---------------------------------------------------------------------------

describe('exportAll and importAll', () => {
  it('exports a JSON string with stored keys', () => {
    const balance = { asOf: '2025-01-01', annualLeaveHours: 80, sickLeaveHours: 120, familyCareUsedCurrentYear: 0 };
    save(STORAGE_KEYS.LEAVE_BALANCE, balance);
    const json = exportAll();
    const parsed = JSON.parse(json);
    expect(parsed[STORAGE_KEYS.LEAVE_BALANCE].data).toEqual(balance);
  });

  it('importAll restores keys that can then be loaded', () => {
    const balance = { asOf: '2025-01-01', annualLeaveHours: 40, sickLeaveHours: 200, familyCareUsedCurrentYear: 0 };
    save(STORAGE_KEYS.LEAVE_BALANCE, balance);
    const json = exportAll();

    localStorage.clear();
    importAll(json);

    const loaded = load(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
    expect(loaded).toEqual(balance);
  });

  it('importAll ignores unknown keys', () => {
    const json = JSON.stringify({ 'some-other-app:data': { foo: 'bar' } });
    importAll(json);
    expect(localStorage.getItem('some-other-app:data')).toBeNull();
  });

  it('importAll throws on non-object JSON', () => {
    expect(() => importAll('"just a string"')).toThrow();
    expect(() => importAll('[1,2,3]')).toThrow();
  });
});
