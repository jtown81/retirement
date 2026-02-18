/**
 * TSP CSV Parser
 *
 * Parse TSP.gov account activity CSV export into TSPTransactionRow array.
 * Handles fund mapping, amount parsing, and error reporting.
 *
 * Expected CSV format (from TSP.gov Account Activity download):
 * Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
 * "04/15/2024","Agency Auto (k)",C Fund,Agency Auto,100.00,123.45,0.811,25000.00
 */

import type { TSPTransactionRow, TSPImportError, TSPFundCode } from '@models/tsp';
import type { ISODate } from '@models/common';

/**
 * Map TSP.gov fund names to fund codes
 */
const TSP_FUND_MAP: Record<string, TSPFundCode> = {
  'G Fund': 'G',
  'F Fund': 'F',
  'C Fund': 'C',
  'S Fund': 'S',
  'I Fund': 'I',
  'L Income Fund': 'L-Income',
  'L 2025 Fund': 'L2025',
  'L 2030 Fund': 'L2030',
  'L 2035 Fund': 'L2035',
  'L 2040 Fund': 'L2040',
  'L 2045 Fund': 'L2045',
  'L 2050 Fund': 'L2050',
  'L 2055 Fund': 'L2055',
  'L 2060 Fund': 'L2060',
  'L 2065 Fund': 'L2065',
};

/**
 * Expected CSV headers
 */
const EXPECTED_HEADERS = [
  'Date',
  'Transaction Description',
  'Fund',
  'Source',
  'Amount',
  'Share Price',
  'Shares',
  'Running Balance',
];

/**
 * Parse MM/DD/YYYY date string to ISO date (YYYY-MM-DD)
 */
export function parseMMDDYYYY(dateStr: string): ISODate {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid date format: ${dateStr}. Expected MM/DD/YYYY`);
  }
  const [, month, day, year] = match;
  return `${year}-${month}-${day}` as ISODate;
}

/**
 * Map TSP.gov source name to transaction source type
 */
export function mapTransactionSource(
  sourceStr: string,
): 'employee' | 'agency-auto' | 'agency-match' | 'earnings' | 'withdrawal' | 'other' {
  const lower = sourceStr.toLowerCase().trim();
  if (lower.includes('employee')) return 'employee';
  if (lower.includes('agency') && lower.includes('auto')) return 'agency-auto';
  if (lower.includes('agency') && (lower.includes('match') || lower.includes('contribution')))
    return 'agency-match';
  if (lower.includes('earnings') || lower.includes('dividend') || lower.includes('interest'))
    return 'earnings';
  if (lower.includes('withdrawal') || lower.includes('transfer out')) return 'withdrawal';
  return 'other';
}

/**
 * Parse dollar amount string with $ and commas
 * e.g., "$1,234.56" → 1234.56
 */
export function parseDollarAmount(amountStr: string): number {
  const cleaned = amountStr.trim().replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) {
    throw new Error(`Invalid amount format: ${amountStr}`);
  }
  return num;
}

/**
 * Map TSP.gov fund name to fund code, or null if unknown
 */
export function mapTSPFund(fundName: string): TSPFundCode | null {
  return TSP_FUND_MAP[fundName.trim()] ?? null;
}

/**
 * Parse TSP.gov account activity CSV into TSPTransactionRow array
 *
 * Returns either array of rows (success) or error object.
 * On error, includes row number for user to investigate.
 */
export function parseTSPCSV(rawText: string): TSPTransactionRow[] | TSPImportError {
  // Strip BOM if present (some Excel exports include it)
  const text = rawText.startsWith('\uFEFF') ? rawText.slice(1) : rawText;

  // Split into lines, preserving quoted fields
  const lines = text.trim().split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Validate headers exist and have expected count
  if (headers.length < EXPECTED_HEADERS.length) {
    return {
      type: 'parse-error',
      message: `Expected ${EXPECTED_HEADERS.length} columns, found ${headers.length}. Ensure you exported "Account Activity" from TSP.gov.`,
      row: 0,
    };
  }

  // If only header row, return empty array
  if (lines.length === 1) {
    return [];
  }

  // Parse data rows
  const rows: TSPTransactionRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    try {
      const cols = parseCSVLine(line);
      if (cols.length < 8) {
        continue; // Skip incomplete rows
      }

      const date = parseMMDDYYYY(cols[0]);
      const description = cols[1];
      const fundName = cols[2];
      const source = mapTransactionSource(cols[3]);
      const amount = parseDollarAmount(cols[4]);
      const runningBalance = parseDollarAmount(cols[7]);

      const fund = mapTSPFund(fundName);
      if (!fund && fundName.trim()) {
        // Unknown fund name - log but don't fail
        console.warn(`Unknown TSP fund in row ${i + 1}: "${fundName}". Will treat as other.`);
      }

      rows.push({
        date,
        description,
        fund: fund ?? null,
        source,
        amount,
        runningBalance,
      });
    } catch (error) {
      return {
        type: 'parse-error',
        message: `${error instanceof Error ? error.message : 'Unknown error'}`,
        row: i + 1,
      };
    }
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 * Splits on commas but respects quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Extract balance snapshot from transaction rows
 * Uses the last row's running balance and reconstructs fund allocation if possible
 */
export function extractSnapshotFromRows(
  rows: TSPTransactionRow[],
  traditionalRothSplit: { traditional: number; roth: number } = { traditional: 0.6, roth: 0.4 },
): {
  asOf: ISODate;
  traditionalBalance: number;
  rothBalance: number;
  totalBalance: number;
} {
  if (rows.length === 0) {
    return {
      asOf: new Date().toISOString().split('T')[0] as ISODate,
      traditionalBalance: 0,
      rothBalance: 0,
      totalBalance: 0,
    };
  }

  const lastRow = rows[rows.length - 1];
  const totalBalance = lastRow.runningBalance;

  // Simple heuristic: use traditional/roth split from recent contributions
  // For now, use provided ratio
  const traditionalBalance = totalBalance * traditionalRothSplit.traditional;
  const rothBalance = totalBalance * traditionalRothSplit.roth;

  return {
    asOf: lastRow.date,
    traditionalBalance,
    rothBalance,
    totalBalance,
  };
}
