/**
 * Schema Migration: v2 → v3
 *
 * Changes:
 * 1. Deprecate retire:leave (LEAVE_BALANCE) as primary storage
 * 2. retire:leave-calendar is now the single source of truth for leave data
 * 3. useLeaveCalendar() no longer writes to retire:leave (balance is derived)
 * 4. useAssembleInput() now reads retire:leave-calendar and derives balance
 *
 * Backward compat: useLeaveCalendar() seeds from retire:leave if calendar
 * doesn't exist yet. After first user interaction, calendar becomes primary.
 *
 * Migration is idempotent — safe to call multiple times.
 */

export const VERSION = 3;

/**
 * Migrate from v2 to v3 schema.
 *
 * @param data - Raw localStorage data (the actual stored value, not the full record)
 * @returns Data unchanged; migration is semantic only
 */
export function migrate(data: unknown): unknown {
  // No data shape changes needed — LEAVE_BALANCE schema is unchanged.
  // LEAVE_CALENDAR schema is unchanged.
  // The migration is purely about which key is used and by which code path.
  return data;
}
