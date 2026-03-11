/**
 * Federal Income Tax Brackets & Standard Deduction Data
 *
 * Contains IRS tax tables for computing federal income tax by filing status.
 * Standard deduction includes age 65+ additional amounts (IRC § 63(c)(7)).
 *
 * Source: IRS Rev. Proc. 2024-40 (2024 tables), IRS Rev. Proc. 2025-43 (2025 tables).
 * ASSUMPTION: 2026+ uses 2025 rates with projected increases.
 * Classification: Hard regulatory (current year tables); Assumption (future years).
 *
 * Standard deduction 2024-2025 reflects annual CPI adjustments per IRC § 63.
 * Age 65+ additional deduction is $2,000 (single) or $1,600 per spouse (MFJ).
 */

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household';

export interface FederalBracket {
  /** Upper limit of bracket (null = no limit, top bracket) */
  upTo: number | null;
  /** Marginal tax rate as decimal (e.g., 0.22 = 22%) */
  rate: number;
}

export interface FederalTaxTable {
  /** Tax year (YYYY) */
  year: number;
  /** Filing status this table applies to */
  filingStatus: FilingStatus;
  /** Standard deduction for this year/status (before age 65+ adjustment) */
  standardDeduction: number;
  /** Additional standard deduction for taxpayer age 65+ (IRC § 63(f)) */
  additionalStandardDeduction65: number;
  /** Tax brackets for this year/status, ordered by upTo amount */
  brackets: readonly FederalBracket[];
}

/**
 * 2024 Federal Tax Tables
 * Source: IRS Revenue Procedure 2024-40
 */
export const FEDERAL_TAX_2024: readonly FederalTaxTable[] = [
  {
    year: 2024,
    filingStatus: 'single',
    standardDeduction: 14600,
    additionalStandardDeduction65: 2000,
    brackets: [
      { upTo: 11600, rate: 0.10 },
      { upTo: 47150, rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ] as const,
  },
  {
    year: 2024,
    filingStatus: 'married_joint',
    standardDeduction: 29200,
    additionalStandardDeduction65: 1600,
    brackets: [
      { upTo: 23200, rate: 0.10 },
      { upTo: 94300, rate: 0.12 },
      { upTo: 201050, rate: 0.22 },
      { upTo: 383900, rate: 0.24 },
      { upTo: 487450, rate: 0.32 },
      { upTo: 731200, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ] as const,
  },
  {
    year: 2024,
    filingStatus: 'married_separate',
    standardDeduction: 14600,
    additionalStandardDeduction65: 1600,
    brackets: [
      { upTo: 11600, rate: 0.10 },
      { upTo: 47150, rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 365600, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ] as const,
  },
  {
    year: 2024,
    filingStatus: 'head_of_household',
    standardDeduction: 21900,
    additionalStandardDeduction65: 2000,
    brackets: [
      { upTo: 16550, rate: 0.10 },
      { upTo: 63100, rate: 0.12 },
      { upTo: 100500, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243700, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ] as const,
  },
];

/**
 * 2025 Federal Tax Tables
 * Source: IRS Revenue Procedure 2025-43
 */
export const FEDERAL_TAX_2025: readonly FederalTaxTable[] = [
  {
    year: 2025,
    filingStatus: 'single',
    standardDeduction: 15000,
    additionalStandardDeduction65: 2000,
    brackets: [
      { upTo: 11900, rate: 0.10 },
      { upTo: 48475, rate: 0.12 },
      { upTo: 103200, rate: 0.22 },
      { upTo: 196950, rate: 0.24 },
      { upTo: 250200, rate: 0.32 },
      { upTo: 626350, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ] as const,
  },
  {
    year: 2025,
    filingStatus: 'married_joint',
    standardDeduction: 30000,
    additionalStandardDeduction65: 1600,
    brackets: [
      { upTo: 23800, rate: 0.10 },
      { upTo: 96950, rate: 0.12 },
      { upTo: 206100, rate: 0.22 },
      { upTo: 393900, rate: 0.24 },
      { upTo: 500400, rate: 0.32 },
      { upTo: 751200, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ] as const,
  },
  {
    year: 2025,
    filingStatus: 'married_separate',
    standardDeduction: 15000,
    additionalStandardDeduction65: 1600,
    brackets: [
      { upTo: 11900, rate: 0.10 },
      { upTo: 48475, rate: 0.12 },
      { upTo: 103200, rate: 0.22 },
      { upTo: 196950, rate: 0.24 },
      { upTo: 250200, rate: 0.32 },
      { upTo: 375600, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ] as const,
  },
  {
    year: 2025,
    filingStatus: 'head_of_household',
    standardDeduction: 22500,
    additionalStandardDeduction65: 2000,
    brackets: [
      { upTo: 17150, rate: 0.10 },
      { upTo: 65100, rate: 0.12 },
      { upTo: 103050, rate: 0.22 },
      { upTo: 196950, rate: 0.24 },
      { upTo: 250200, rate: 0.32 },
      { upTo: 626350, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ] as const,
  },
];

/**
 * All available federal tax tables (2024–2025).
 * For years beyond, the most recent table will be used.
 */
export const ALL_FEDERAL_TAX_TABLES: readonly FederalTaxTable[] = [
  ...FEDERAL_TAX_2024,
  ...FEDERAL_TAX_2025,
];

/**
 * Retrieves the federal tax table for a given year and filing status.
 * Falls back to the most recent available year for future years.
 *
 * @param year - Tax year (YYYY)
 * @param filingStatus - Filing status
 * @returns FederalTaxTable with brackets and standard deduction
 */
export function getFederalTaxTable(year: number, filingStatus: FilingStatus): FederalTaxTable {
  // Try exact year match first
  const exactMatch = ALL_FEDERAL_TAX_TABLES.find(
    (t) => t.year === year && t.filingStatus === filingStatus
  );
  if (exactMatch) return exactMatch;

  // Fall back to most recent year
  const sorted = [...ALL_FEDERAL_TAX_TABLES]
    .filter((t) => t.filingStatus === filingStatus)
    .sort((a, b) => b.year - a.year);

  if (sorted.length === 0) {
    // Fallback: should not happen, but return 2025 single
    return FEDERAL_TAX_2025[0]!;
  }

  return sorted[0]!;
}
