/**
 * Local Persistence Layer
 *
 * Typed localStorage wrapper with:
 *   - Schema version checking on every read
 *   - Automatic migration when version is outdated
 *   - Zod validation after migration (rejects corrupted data)
 *   - No silent failures — returns null on any read error
 *
 * All app data lives under keys prefixed with "retire:" (see STORAGE_KEYS).
 * Never import this module from business-logic code; only UI and
 * initialization layers should call save/load directly.
 */

import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEYS } from './schema';
import { StoredRecordSchema } from './zod-schemas';
import { runMigrations } from './migrations/index';

/**
 * Persist `data` under `key`. Wraps data in a `StoredRecord` envelope
 * with the current schema version and a UTC timestamp.
 *
 * Throws if localStorage is unavailable (e.g., private browsing with
 * storage quota exceeded); callers should handle gracefully.
 */
export function save<T>(key: string, data: T): void {
  const record = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    data,
  };
  localStorage.setItem(key, JSON.stringify(record));
}

/**
 * Load and validate data for `key`.
 *
 * Steps:
 *   1. Read raw JSON from localStorage
 *   2. Parse outer `StoredRecord` envelope
 *   3. If schema version is outdated, run migrations
 *   4. Validate migrated data against `schema`
 *   5. Return typed data, or `null` on any failure
 *
 * Returns `null` (never throws) when:
 *   - Key is not present
 *   - JSON is malformed
 *   - Data fails Zod validation after migration
 */
export function load<T>(
  key: string,
  schema: z.ZodType<T>,
): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`[retire:storage] Failed to parse JSON for key "${key}". Discarding.`);
    localStorage.removeItem(key);
    return null;
  }

  // Validate the outer StoredRecord envelope
  const envelopeResult = StoredRecordSchema(z.unknown()).safeParse(parsed);
  if (!envelopeResult.success) {
    console.warn(`[retire:storage] Invalid envelope for key "${key}". Discarding.`);
    localStorage.removeItem(key);
    return null;
  }

  const { schemaVersion, data } = envelopeResult.data;

  // Apply migrations if stored version is behind current
  let migratedData: unknown = data;
  if (schemaVersion < CURRENT_SCHEMA_VERSION) {
    try {
      migratedData = runMigrations(data, schemaVersion, CURRENT_SCHEMA_VERSION);
    } catch (err) {
      console.warn(`[retire:storage] Migration failed for key "${key}":`, err);
      return null;
    }
    // Re-save with updated schema version so future loads skip migrations
    save(key, migratedData);
  }

  // Validate data shape against caller-supplied Zod schema
  const dataResult = schema.safeParse(migratedData);
  if (!dataResult.success) {
    console.warn(
      `[retire:storage] Validation failed for key "${key}":`,
      dataResult.error.flatten(),
    );
    return null;
  }

  return dataResult.data;
}

/**
 * Remove a single key from localStorage.
 */
export function remove(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Remove all `retire:*` keys from localStorage.
 * Use with care — this deletes all user data.
 */
export function clearAll(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}

/**
 * Export all `retire:*` entries as a JSON string.
 * Returns a record of key → raw stored value (unparsed).
 * Intended for backup/restore and debugging.
 */
export function exportAll(): string {
  const snapshot: Record<string, unknown> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        snapshot[key] = JSON.parse(raw);
      } catch {
        snapshot[key] = raw;
      }
    }
  }
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Import data from a JSON string produced by `exportAll()`.
 * Writes raw values directly; subsequent `load()` calls will
 * validate and migrate as normal.
 *
 * Throws if `json` is not a valid JSON object.
 */
export function importAll(json: string): void {
  const data: unknown = JSON.parse(json);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('importAll: expected a JSON object');
  }
  const validKeys = new Set<string>(Object.values(STORAGE_KEYS));
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (validKeys.has(key)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}
