/**
 * Shared primitive types and utilities used across all models.
 * No business logic here.
 */

/** ISO 8601 date string (YYYY-MM-DD) */
export type ISODate = string;

/** US dollar amount (positive number) */
export type USD = number;

/** Annual percentage rate expressed as decimal (e.g., 0.025 = 2.5%) */
export type Rate = number;

/** Federal pay year */
export type PayYear = number;

/** GS grade (1–15) */
export type GSGrade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/** GS step (1–10) */
export type GSStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Pay system type */
export type PaySystem = 'GS' | 'LEO' | 'Title38';
