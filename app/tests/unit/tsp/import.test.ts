/**
 * Tests for TSP CSV import parser
 * Covers: valid CSV, error cases, edge cases, date/amount parsing, fund mapping
 */

import { describe, it, expect } from 'vitest';
import {
  parseTSPCSV,
  parseMMDDYYYY,
  parseDollarAmount,
  mapTSPFund,
  mapTransactionSource,
  extractSnapshotFromRows,
} from '@modules/tsp/import';

describe('TSP CSV Parser', () => {
  describe('parseMMDDYYYY', () => {
    it('parses valid MM/DD/YYYY date', () => {
      expect(parseMMDDYYYY('04/15/2024')).toBe('2024-04-15');
    });

    it('parses date with leading zeros', () => {
      expect(parseMMDDYYYY('01/01/2020')).toBe('2020-01-01');
    });

    it('parses date with double-digit month/day', () => {
      expect(parseMMDDYYYY('12/31/2025')).toBe('2025-12-31');
    });

    it('throws on invalid format', () => {
      expect(() => parseMMDDYYYY('2024-04-15')).toThrow();
      expect(() => parseMMDDYYYY('4/15/24')).toThrow();
      expect(() => parseMMDDYYYY('invalid')).toThrow();
    });
  });

  describe('parseDollarAmount', () => {
    it('parses simple dollar amount', () => {
      expect(parseDollarAmount('100.00')).toBe(100);
    });

    it('parses amount with $', () => {
      expect(parseDollarAmount('$100.00')).toBe(100);
    });

    it('parses amount with commas', () => {
      expect(parseDollarAmount('1,234.56')).toBe(1234.56);
    });

    it('parses amount with $ and commas', () => {
      expect(parseDollarAmount('$1,234.56')).toBe(1234.56);
    });

    it('parses large amounts', () => {
      expect(parseDollarAmount('$1,234,567.89')).toBe(1234567.89);
    });

    it('parses zero', () => {
      expect(parseDollarAmount('$0.00')).toBe(0);
    });

    it('throws on invalid format', () => {
      expect(() => parseDollarAmount('invalid')).toThrow();
      expect(() => parseDollarAmount('$abc.de')).toThrow();
    });
  });

  describe('mapTSPFund', () => {
    it('maps G Fund', () => {
      expect(mapTSPFund('G Fund')).toBe('G');
    });

    it('maps F Fund', () => {
      expect(mapTSPFund('F Fund')).toBe('F');
    });

    it('maps C Fund', () => {
      expect(mapTSPFund('C Fund')).toBe('C');
    });

    it('maps S Fund', () => {
      expect(mapTSPFund('S Fund')).toBe('S');
    });

    it('maps I Fund', () => {
      expect(mapTSPFund('I Fund')).toBe('I');
    });

    it('maps L Funds', () => {
      expect(mapTSPFund('L Income Fund')).toBe('L-Income');
      expect(mapTSPFund('L 2050 Fund')).toBe('L2050');
      expect(mapTSPFund('L 2025 Fund')).toBe('L2025');
    });

    it('returns null for unknown fund', () => {
      expect(mapTSPFund('Unknown Fund')).toBeNull();
      expect(mapTSPFund('X Fund')).toBeNull();
    });

    it('handles whitespace', () => {
      expect(mapTSPFund('  G Fund  ')).toBe('G');
    });
  });

  describe('mapTransactionSource', () => {
    it('maps employee contribution', () => {
      expect(mapTransactionSource('Employee')).toBe('employee');
      expect(mapTransactionSource('Employee Contribution')).toBe('employee');
    });

    it('maps agency auto', () => {
      expect(mapTransactionSource('Agency Auto')).toBe('agency-auto');
    });

    it('maps agency match', () => {
      expect(mapTransactionSource('Agency Match')).toBe('agency-match');
      expect(mapTransactionSource('Agency Contribution')).toBe('agency-match');
    });

    it('maps earnings', () => {
      expect(mapTransactionSource('Earnings')).toBe('earnings');
      expect(mapTransactionSource('Dividend')).toBe('earnings');
    });

    it('maps withdrawal', () => {
      expect(mapTransactionSource('Withdrawal')).toBe('withdrawal');
      expect(mapTransactionSource('Transfer Out')).toBe('withdrawal');
    });

    it('defaults to other', () => {
      expect(mapTransactionSource('Some Other Type')).toBe('other');
    });

    it('is case-insensitive', () => {
      expect(mapTransactionSource('EMPLOYEE')).toBe('employee');
      expect(mapTransactionSource('agency auto')).toBe('agency-auto');
    });
  });

  describe('parseTSPCSV', () => {
    it('parses valid 3-row CSV', () => {
      const csv = `Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
"04/15/2024","Agency Auto (k)",C Fund,Agency Auto,100.00,123.45,0.811,25000.00
"04/20/2024","Employee Contribution",G Fund,Employee,50.00,100.00,0.500,25050.00
"04/25/2024","Earnings",C Fund,Earnings,10.00,124.00,0.081,25060.00`;

      const result = parseTSPCSV(csv);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2024-04-15');
        expect(result[0].amount).toBe(100);
        expect(result[0].runningBalance).toBe(25000);
      }
    });

    it('parses CSV with BOM', () => {
      const csv = `\uFEFFDate,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
"04/15/2024","Agency Auto",C Fund,Agency Auto,100.00,123.45,0.811,25000.00`;

      const result = parseTSPCSV(csv);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result).toHaveLength(1);
      }
    });

    it('handles empty file', () => {
      const csv = '';
      const result = parseTSPCSV(csv);
      expect(result).toEqual([]);
    });

    it('handles header only', () => {
      const csv = `Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance`;
      const result = parseTSPCSV(csv);
      expect(result).toEqual([]);
    });

    it('returns parse error for missing headers', () => {
      const csv = `Date,Fund,Amount
"04/15/2024",C Fund,100.00`;

      const result = parseTSPCSV(csv);
      expect('type' in result).toBe(true);
      if ('type' in result) {
        expect(result.type).toBe('parse-error');
        expect(result.row).toBe(0);
      }
    });

    it('returns parse error for invalid date', () => {
      const csv = `Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
"invalid-date","Employee Contribution",G Fund,Employee,50.00,100.00,0.500,25050.00`;

      const result = parseTSPCSV(csv);
      expect('type' in result).toBe(true);
      if ('type' in result) {
        expect(result.type).toBe('parse-error');
        expect(result.row).toBe(2); // Row 2 (1-indexed, after header)
      }
    });

    it('returns parse error for invalid amount', () => {
      const csv = `Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
"04/15/2024","Employee Contribution",G Fund,Employee,invalid,100.00,0.500,25050.00`;

      const result = parseTSPCSV(csv);
      expect('type' in result).toBe(true);
      if ('type' in result) {
        expect(result.type).toBe('parse-error');
      }
    });

    it('skips empty rows', () => {
      const csv = `Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
"04/15/2024","Agency Auto",C Fund,Agency Auto,100.00,123.45,0.811,25000.00

"04/20/2024","Employee Contribution",G Fund,Employee,50.00,100.00,0.500,25050.00`;

      const result = parseTSPCSV(csv);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result).toHaveLength(2);
      }
    });

    it('handles negative amounts (withdrawals)', () => {
      const csv = `Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
"04/15/2024","Withdrawal",G Fund,Withdrawal,-500.00,100.00,-5.000,24500.00`;

      const result = parseTSPCSV(csv);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0].amount).toBe(-500);
      }
    });

    it('handles zero amounts', () => {
      const csv = `Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
"04/15/2024","Zero transaction",G Fund,Other,0.00,100.00,0.000,25000.00`;

      const result = parseTSPCSV(csv);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0].amount).toBe(0);
      }
    });

    it('maps funds correctly', () => {
      const csv = `Date,Transaction Description,Fund,Source,Amount,Share Price,Shares,Running Balance
"04/15/2024","Transaction 1",G Fund,Employee,100.00,100.00,1.000,100.00
"04/16/2024","Transaction 2",Unknown Fund,Employee,50.00,100.00,0.500,150.00
"04/17/2024","Transaction 3",C Fund,Employee,25.00,100.00,0.250,175.00`;

      const result = parseTSPCSV(csv);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0].fund).toBe('G');
        expect(result[1].fund).toBeNull(); // Unknown fund
        expect(result[2].fund).toBe('C');
      }
    });
  });

  describe('extractSnapshotFromRows', () => {
    it('extracts snapshot from transaction rows', () => {
      const rows = [
        {
          date: '2024-04-15' as any,
          description: 'Transaction 1',
          fund: 'G' as any,
          source: 'employee' as any,
          amount: 1000,
          runningBalance: 25000,
        },
        {
          date: '2024-04-20' as any,
          description: 'Transaction 2',
          fund: 'C' as any,
          source: 'agency-auto' as any,
          amount: 500,
          runningBalance: 25500,
        },
      ];

      const snapshot = extractSnapshotFromRows(rows);
      expect(snapshot.asOf).toBe('2024-04-20');
      expect(snapshot.totalBalance).toBe(25500);
      expect(snapshot.traditionalBalance).toBe(25500 * 0.6);
      expect(snapshot.rothBalance).toBe(25500 * 0.4);
    });

    it('handles empty rows', () => {
      const snapshot = extractSnapshotFromRows([]);
      expect(snapshot.totalBalance).toBe(0);
      expect(snapshot.traditionalBalance).toBe(0);
      expect(snapshot.rothBalance).toBe(0);
    });

    it('respects custom traditional/roth split', () => {
      const rows = [
        {
          date: '2024-04-15' as any,
          description: 'Transaction',
          fund: 'G' as any,
          source: 'employee' as any,
          amount: 1000,
          runningBalance: 10000,
        },
      ];

      const snapshot = extractSnapshotFromRows(rows, { traditional: 0.8, roth: 0.2 });
      expect(snapshot.traditionalBalance).toBe(8000);
      expect(snapshot.rothBalance).toBe(2000);
    });
  });
});
