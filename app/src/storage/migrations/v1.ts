/**
 * Schema Migration: v0 → v1
 *
 * Initial schema — no prior version to migrate from.
 * This file serves as the baseline for all future migrations.
 *
 * When adding a v2, create migrations/v2.ts that transforms v1 → v2.
 */

export const VERSION = 1;

// No-op for initial version.
export function migrate(_data: unknown): unknown {
  return _data;
}
