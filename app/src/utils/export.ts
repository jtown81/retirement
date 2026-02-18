/**
 * Export Utilities
 * Functions for exporting retirement projections and scenarios to CSV, JSON, and PDF.
 */

import type { SimulationYearResult } from '@models/simulation';
import type { NamedScenario } from '@models/scenario';

/**
 * Export projection table to CSV format
 *
 * CSV columns: Year, Age, Annuity, FERS Supplement, Social Security,
 *              TSP Withdrawal, Gross Income, Federal Tax, State Tax,
 *              IRMAA Surcharge, After-Tax Income, Total Expenses, Net Surplus, TSP Balance
 *
 * @param years - Array of simulation year results
 * @param filename - Optional custom filename (defaults to retirement-projection-YYYY-MM-DD.csv)
 */
export function exportProjectionCSV(
  years: SimulationYearResult[],
  filename?: string,
): void {
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

  const rows = years.map((year) => [
    year.year,
    Math.round(year.age),
    formatCurrency(year.annuity),
    formatCurrency(year.fersSupplement),
    formatCurrency(year.socialSecurity),
    formatCurrency(year.tspWithdrawal),
    formatCurrency(year.totalIncome),
    formatCurrency(year.federalTax),
    formatCurrency(year.stateTax),
    formatCurrency(year.irmaaSurcharge),
    formatCurrency(year.afterTaxIncome),
    formatCurrency(year.totalExpenses),
    formatCurrency(year.surplus),
    formatCurrency(year.totalTSPBalance),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join(
    '\n',
  );

  const defaultFilename = `retirement-projection-${new Date()
    .toISOString()
    .split('T')[0]}.csv`;
  triggerDownload(csvContent, 'text/csv; charset=utf-8', filename ?? defaultFilename);
}

/**
 * Export a single scenario to JSON
 */
export function exportScenarioJSON(scenario: NamedScenario, filename?: string): void {
  const json = JSON.stringify(scenario, null, 2);
  const labelSlug = sanitizeFilename(scenario.label);
  const defaultFilename = `scenario-${labelSlug}-${new Date()
    .toISOString()
    .split('T')[0]}.json`;
  triggerDownload(json, 'application/json; charset=utf-8', filename ?? defaultFilename);
}

/**
 * Export multiple scenarios to JSON
 */
export function exportScenariosJSON(
  scenarios: NamedScenario[],
  filename?: string,
): void {
  const json = JSON.stringify(scenarios, null, 2);
  const defaultFilename = `scenarios-${new Date().toISOString().split('T')[0]}.json`;
  triggerDownload(json, 'application/json; charset=utf-8', filename ?? defaultFilename);
}

/**
 * Trigger browser download dialog
 *
 * @param content - File content as string
 * @param mimeType - MIME type (e.g., 'text/csv; charset=utf-8')
 * @param filename - Suggested filename for download
 */
export function triggerDownload(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser print dialog (uses @media print CSS)
 *
 * @param title - Optional title to set for print
 */
export function triggerPrint(title?: string): void {
  if (title) {
    const oldTitle = document.title;
    document.title = title;
    window.print();
    document.title = oldTitle;
  } else {
    window.print();
  }
}

/**
 * Format number as currency for CSV (no $ or commas, machine-readable)
 */
function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Sanitize label for safe filename use
 * Replaces whitespace with hyphens, removes special characters, and converts to lowercase
 */
function sanitizeFilename(label: string): string {
  return label
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, '-') // Replace whitespace with hyphens
    .toLowerCase();
}
