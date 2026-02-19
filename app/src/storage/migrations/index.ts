/**
 * Migration Runner
 *
 * Applies sequential schema migrations from a stored version up to the
 * current version. Each migration file transforms the raw data shape
 * from one version to the next.
 *
 * How to add a new migration:
 *   1. Create `migrations/vN.ts` with a `migrate(data: unknown): unknown`
 *      function and a `VERSION = N` constant.
 *   2. Import it here and add an entry to the `MIGRATIONS` table (sorted by version).
 *   3. Increment `CURRENT_SCHEMA_VERSION` in `schema.ts`.
 *   4. Add a unit test in `tests/unit/storage/migrations/`.
 *   5. Update version history in `schema.ts` comments.
 */

import { migrate as v1Migrate, VERSION as V1 } from './v1';
import { migrate as v2Migrate, VERSION as V2 } from './v2';
import { migrate as v3Migrate, VERSION as V3 } from './v3';
import { migrate as v4Migrate, VERSION as V4 } from './v4';

interface Migration {
  version: number;
  migrate: (data: unknown) => unknown;
}

/**
 * Ordered list of all migrations.
 * Must stay sorted by version ascending.
 */
const MIGRATIONS: Migration[] = [
  { version: V1, migrate: v1Migrate },
  { version: V2, migrate: v2Migrate },
  { version: V3, migrate: v3Migrate },
  { version: V4, migrate: v4Migrate },
];

/**
 * Run all migrations needed to bring `data` from `fromVersion`
 * up to `toVersion`. Migrations are applied in order.
 *
 * @param data        Raw stored data (untrusted shape)
 * @param fromVersion Schema version embedded in the stored record
 * @param toVersion   Target version (typically CURRENT_SCHEMA_VERSION)
 * @returns           Migrated data (still unvalidated — caller must Zod-parse)
 */
export function runMigrations(
  data: unknown,
  fromVersion: number,
  toVersion: number,
): unknown {
  let result = data;
  for (const m of MIGRATIONS) {
    if (m.version > fromVersion && m.version <= toVersion) {
      result = m.migrate(result);
    }
  }
  return result;
}
