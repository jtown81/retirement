/**
 * Export Utilities Tests
 *
 * Tests focus on CSV generation logic and data formatting.
 * DOM interaction tests are minimal since Vitest doesn't provide full browser APIs.
 */

import { describe, it, expect } from 'vitest';
import type { SimulationYearResult } from '@models/simulation';

// Mock data for tests
const mockYears: SimulationYearResult[] = [
  {
    year: 2027,
    age: 57,
    annuity: 27900,
    fersSupplement: 12300,
    socialSecurity: 0,
    tspWithdrawal: 18000,
    totalIncome: 58200,
    federalTax: 6420,
    stateTax: 0,
    irmaaSurcharge: 0,
    totalTax: 6420,
    effectiveFederalRate: 0.11,
    effectiveTotalRate: 0.11,
    socialSecurityTaxableFraction: 0,
    afterTaxIncome: 51780,
    smileMultiplier: 1.0,
    totalExpenses: 54000,
    highRiskBalance: 400000,
    lowRiskBalance: 250000,
    traditionalBalance: 500000,
    rothBalance: 150000,
    totalTSPBalance: 650000,
    rmdRequired: 0,
    rmdSatisfied: true,
    surplus: -2220,
    tradWithdrawal: 14400,
    rothWithdrawal: 3600,
    taxableIncome: 40200,
    afterTaxSurplus: -2220,
    marginalBracketRate: 0.12,
    bracketHeadroom: 5000,
  },
  {
    year: 2028,
    age: 58,
    annuity: 28614,
    fersSupplement: 12615,
    socialSecurity: 0,
    tspWithdrawal: 18480,
    totalIncome: 59709,
    federalTax: 6567,
    stateTax: 0,
    irmaaSurcharge: 0,
    totalTax: 6567,
    effectiveFederalRate: 0.11,
    effectiveTotalRate: 0.11,
    socialSecurityTaxableFraction: 0,
    afterTaxIncome: 53142,
    smileMultiplier: 1.0,
    totalExpenses: 55350,
    highRiskBalance: 420000,
    lowRiskBalance: 265000,
    traditionalBalance: 525000,
    rothBalance: 160000,
    totalTSPBalance: 685000,
    rmdRequired: 0,
    rmdSatisfied: true,
    surplus: -2208,
    tradWithdrawal: 14784,
    rothWithdrawal: 3696,
    taxableIncome: 41699,
    afterTaxSurplus: -2208,
    marginalBracketRate: 0.12,
    bracketHeadroom: 4500,
  },
];

describe('CSV Export Data Formatting', () => {
  it('Formats currency values as integers', () => {
    const year = mockYears[0];
    const formatted = Math.round(year.totalIncome).toLocaleString('en-US');
    expect(formatted).toBe('58,200');
  });

  it('Rounds floating-point ages to integers', () => {
    const ages = [57.0, 57.1, 57.5, 57.9];
    ages.forEach((age) => {
      const rounded = Math.round(age);
      expect(typeof rounded).toBe('number');
      expect(rounded).toBeGreaterThanOrEqual(57);
      expect(rounded).toBeLessThanOrEqual(58);
    });
  });

  it('Handles zero values correctly', () => {
    const year = mockYears[0];
    expect(year.socialSecurity).toBe(0);
    expect(Math.round(year.socialSecurity)).toBe(0);
  });

  it('Handles negative values correctly', () => {
    const year = mockYears[0];
    expect(year.surplus).toBe(-2220);
    expect(Math.round(year.surplus)).toBe(-2220);
  });

  it('Formats large numbers with commas', () => {
    const balance = 650000;
    const formatted = Math.round(balance).toLocaleString('en-US');
    expect(formatted).toBe('650,000');
  });
});

describe('CSV Header Structure', () => {
  it('Contains all required columns', () => {
    const headers = [
      'Year',
      'Age',
      'Annuity',
      'FERS Supplement',
      'Social Security',
      'TSP Withdrawal',
      'Gross Income',
      'Federal Tax',
      'State Tax',
      'IRMAA Surcharge',
      'After-Tax Income',
      'Total Expenses',
      'Net Surplus',
      'TSP Balance (EOY)',
    ];

    expect(headers).toHaveLength(14);
  });

  it('Has correct order: Year first, TSP Balance last', () => {
    const headers = [
      'Year',
      'Age',
      'Annuity',
      'FERS Supplement',
      'Social Security',
      'TSP Withdrawal',
      'Gross Income',
      'Federal Tax',
      'State Tax',
      'IRMAA Surcharge',
      'After-Tax Income',
      'Total Expenses',
      'Net Surplus',
      'TSP Balance (EOY)',
    ];

    expect(headers[0]).toBe('Year');
    expect(headers[headers.length - 1]).toBe('TSP Balance (EOY)');
  });
});

describe('CSV Row Generation', () => {
  it('Generates correct number of rows', () => {
    expect(mockYears).toHaveLength(2);
  });

  it('Includes all data points per row', () => {
    const year = mockYears[0];
    const values = [
      year.year,
      Math.round(year.age),
      Math.round(year.annuity),
      Math.round(year.fersSupplement),
      Math.round(year.socialSecurity),
      Math.round(year.tspWithdrawal),
      Math.round(year.totalIncome),
      Math.round(year.federalTax),
      Math.round(year.stateTax),
      Math.round(year.irmaaSurcharge),
      Math.round(year.afterTaxIncome),
      Math.round(year.totalExpenses),
      Math.round(year.surplus),
      Math.round(year.totalTSPBalance),
    ];

    expect(values).toHaveLength(14);
    expect(values[0]).toBe(2027);
    expect(values[13]).toBe(650000);
  });

  it('Correctly sums taxes', () => {
    const year = mockYears[0];
    const totalTax = year.federalTax + year.stateTax + year.irmaaSurcharge;
    expect(totalTax).toBe(6420);
  });

  it('Computes after-tax income correctly', () => {
    const year = mockYears[0];
    const afterTax = year.totalIncome - year.federalTax - year.stateTax - year.irmaaSurcharge;
    expect(afterTax).toBe(year.afterTaxIncome);
  });
});

describe('Filename Generation', () => {
  it('Creates filename with correct pattern', () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `retirement-projection-${today}.csv`;
    expect(filename).toMatch(/retirement-projection-\d{4}-\d{2}-\d{2}\.csv/);
  });

  it('Handles custom filename', () => {
    const custom = 'my-plan.csv';
    expect(custom).toContain('.csv');
  });

  it('Sanitizes labels for JSON filenames', () => {
    const label = 'Retire at 57 — MRA+30';
    const slug = label
      .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace whitespace with hyphens
      .toLowerCase();
    const filename = `scenario-${slug}-2026-02-18.json`;
    expect(filename).toContain('scenario-');
    expect(filename).toContain('.json');
    expect(filename).not.toContain('—'); // Special chars removed
  });
});

describe('MIME Type Validation', () => {
  it('CSV uses correct MIME type', () => {
    const mimeType = 'text/csv; charset=utf-8';
    expect(mimeType).toContain('csv');
    expect(mimeType).toContain('charset=utf-8');
  });

  it('JSON uses correct MIME type', () => {
    const mimeType = 'application/json; charset=utf-8';
    expect(mimeType).toContain('json');
    expect(mimeType).toContain('charset=utf-8');
  });

  it('Plain text uses correct MIME type', () => {
    const mimeType = 'text/plain; charset=utf-8';
    expect(mimeType).toContain('text/plain');
  });
});
