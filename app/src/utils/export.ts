/**
 * Export Utilities
 * Functions for exporting retirement projections and scenarios to CSV, JSON, Excel, and PDF.
 */

import type { SimulationYearResult, SimulationInput } from '@models/simulation';
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
 * Export projection table to Excel (.xlsx) format with multiple sheets
 *
 * Sheet 1 (Inputs): Key plan parameters from SimulationInput
 * Sheet 2 (Projection): Full year-by-year projection with all fields
 * Sheet 3 (Scenarios): Summary comparison of all saved scenarios (optional)
 *
 * @param years - Array of simulation year results
 * @param input - Optional simulation input for sheet 1
 * @param scenarios - Optional scenarios for sheet 3
 * @param filename - Optional custom filename (defaults to retirement-projection-YYYY-MM-DD.xlsx)
 */
export async function exportProjectionXLSX(
  years: SimulationYearResult[],
  input?: SimulationInput | null,
  scenarios?: NamedScenario[],
  filename?: string,
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Inputs ──
  if (input) {
    // Calculate total expenses from categories
    const totalExpenses = input.profile.expenses.categories.reduce(
      (sum, cat) => sum + cat.annualAmount,
      0,
    );

    const inputRows: Array<(string | number)[]> = [
      ['FERS Estimate', ''],
      ['Birth Date', input.profile.birthDate],
      ['', ''],
      ['TSP at Retirement', ''],
      ['Traditional Balance', input.profile.tspBalances.traditionalBalance],
      ['Roth Balance', input.profile.tspBalances.rothBalance],
      ['', ''],
      ['Assumptions', ''],
      ['Retirement Date', input.assumptions.proposedRetirementDate],
      ['TSP Growth Rate', `${(input.assumptions.tspGrowthRate * 100).toFixed(1)}%`],
      ['COLA Rate', `${(input.assumptions.colaRate * 100).toFixed(1)}%`],
      ['Retirement Horizon', `${input.assumptions.retirementHorizonYears} years`],
      ['TSP Withdrawal Rate', `${((input.assumptions.tspWithdrawalRate ?? 0.04) * 100).toFixed(1)}%`],
      ['Social Security at 62 (monthly)', input.assumptions.estimatedSSMonthlyAt62 ?? 0],
      ['', ''],
      ['Expenses', ''],
      ['Total Annual Expenses', totalExpenses],
      ['Inflation Rate', `${(input.profile.expenses.inflationRate * 100).toFixed(1)}%`],
    ];

    const inputWs = XLSX.utils.aoa_to_sheet(inputRows);
    inputWs['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, inputWs, 'Inputs');
  }

  // ── Sheet 2: Full Projection ──
  const projectionHeaders = [
    'Year',
    'Age',
    'Annuity',
    'FERS Supplement',
    'Social Security',
    'TSP Withdrawal',
    'Total Income',
    'Federal Tax',
    'State Tax',
    'IRMAA Surcharge',
    'Total Tax',
    'After-Tax Income',
    'Traditional Withdrawal',
    'Roth Withdrawal',
    'Taxable Income',
    'After-Tax Surplus',
    'Smile Multiplier',
    'Total Expenses',
    'High-Risk Balance',
    'Low-Risk Balance',
    'Traditional TSP Balance',
    'Roth TSP Balance',
    'Total TSP Balance',
    'RMD Required',
    'RMD Satisfied',
    'Surplus',
    'Marginal Bracket Rate',
    'Bracket Headroom',
  ];

  const projectionRows = years.map((year) => [
    year.year,
    Math.round(year.age),
    year.annuity,
    year.fersSupplement,
    year.socialSecurity,
    year.tspWithdrawal,
    year.totalIncome,
    year.federalTax,
    year.stateTax,
    year.irmaaSurcharge,
    year.totalTax,
    year.afterTaxIncome,
    year.tradWithdrawal,
    year.rothWithdrawal,
    year.taxableIncome,
    year.afterTaxSurplus,
    year.smileMultiplier.toFixed(3),
    year.totalExpenses,
    year.highRiskBalance,
    year.lowRiskBalance,
    year.traditionalBalance,
    year.rothBalance,
    year.totalTSPBalance,
    year.rmdRequired,
    year.rmdSatisfied ? 'Yes' : 'No',
    year.surplus,
    `${(year.marginalBracketRate * 100).toFixed(2)}%`,
    year.bracketHeadroom,
  ]);

  const projectionWs = XLSX.utils.aoa_to_sheet([projectionHeaders, ...projectionRows]);
  // Set column widths
  projectionWs['!cols'] = Array(projectionHeaders.length).fill({ wch: 16 });
  XLSX.utils.book_append_sheet(wb, projectionWs, 'Projection');

  // ── Sheet 3: Scenarios (conditional) ──
  if (scenarios && scenarios.length > 0) {
    const scenarioRows: Array<(string | number)[]> = [
      ['Scenario Name', ...scenarios.map((s) => s.label)],
      ['Created', ...scenarios.map((s) => new Date(s.createdAt as string).toLocaleDateString())],
      ['Last Updated', ...scenarios.map((s) => (s.updatedAt ? new Date(s.updatedAt as string).toLocaleDateString() : ''))],
      ['', ''],
    ];

    // Try to extract summary metrics from each scenario if available
    let hasMetrics = false;
    const allMetrics: Record<string, (string | number)[]> = {};

    scenarios.forEach((scenario, idx) => {
      // FullSimulationResult has 'years' property, not 'projections'
      if (scenario.result?.years && scenario.result.years.length > 0) {
        hasMetrics = true;
        const year1 = scenario.result.years[0];
        const finalYear = scenario.result.years[scenario.result.years.length - 1];

        if (!allMetrics['Year 1 Gross Income']) {
          allMetrics['Year 1 Gross Income'] = Array(scenarios.length).fill(0);
        }
        allMetrics['Year 1 Gross Income'][idx] = year1.totalIncome;

        if (!allMetrics['Year 1 Expenses']) {
          allMetrics['Year 1 Expenses'] = Array(scenarios.length).fill(0);
        }
        allMetrics['Year 1 Expenses'][idx] = year1.totalExpenses;

        if (!allMetrics['Year 1 Surplus']) {
          allMetrics['Year 1 Surplus'] = Array(scenarios.length).fill(0);
        }
        allMetrics['Year 1 Surplus'][idx] = year1.surplus;

        if (!allMetrics['Final Year TSP Balance']) {
          allMetrics['Final Year TSP Balance'] = Array(scenarios.length).fill(0);
        }
        allMetrics['Final Year TSP Balance'][idx] = finalYear.totalTSPBalance;
      }
    });

    if (hasMetrics) {
      for (const [metricName, values] of Object.entries(allMetrics)) {
        scenarioRows.push([metricName, ...values]);
      }
    }

    const scenarioWs = XLSX.utils.aoa_to_sheet(scenarioRows);
    scenarioWs['!cols'] = Array(scenarios.length + 1).fill({ wch: 20 });
    XLSX.utils.book_append_sheet(wb, scenarioWs, 'Scenarios');
  }

  // ── Write and download ──
  const defaultFilename = `retirement-projection-${new Date()
    .toISOString()
    .split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename ?? defaultFilename);
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
 * Export comparison of two scenarios as CSV
 *
 * Columns: Metric | Baseline Value | Comparison Value | Absolute Difference | Percent Difference
 *
 * @param baselineLabel - Name of baseline scenario
 * @param comparisonLabel - Name of comparison scenario
 * @param baselineMetrics - Metrics from baseline scenario
 * @param comparisonMetrics - Metrics from comparison scenario
 * @param filename - Optional custom filename
 */
export function exportScenarioDiffCSV(
  baselineLabel: string,
  comparisonLabel: string,
  baselineMetrics: Record<string, number | string>,
  comparisonMetrics: Record<string, number | string>,
  filename?: string,
): void {
  const headers = ['Metric', baselineLabel, comparisonLabel, 'Difference', 'Difference %'];

  const rows: string[][] = [];

  // Iterate through all metric keys
  const allKeys = new Set([...Object.keys(baselineMetrics), ...Object.keys(comparisonMetrics)]);
  for (const key of Array.from(allKeys).sort()) {
    const baseValue = baselineMetrics[key];
    const compValue = comparisonMetrics[key];

    const baseNum = typeof baseValue === 'number' ? baseValue : 0;
    const compNum = typeof compValue === 'number' ? compValue : 0;

    const diff = compNum - baseNum;
    const diffPct = baseNum !== 0 ? ((diff / baseNum) * 100).toFixed(2) : '0.00';

    rows.push([
      key,
      typeof baseValue === 'number' ? Math.round(baseValue).toString() : String(baseValue),
      typeof compValue === 'number' ? Math.round(compValue).toString() : String(compValue),
      Math.round(diff).toString(),
      `${diffPct}%`,
    ]);
  }

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const baseSlug = sanitizeFilename(baselineLabel);
  const compSlug = sanitizeFilename(comparisonLabel);
  const defaultFilename = `scenario-diff-${baseSlug}-vs-${compSlug}-${new Date()
    .toISOString()
    .split('T')[0]}.csv`;

  triggerDownload(csvContent, 'text/csv; charset=utf-8', filename ?? defaultFilename);
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
 * Format number as currency for Excel (numeric, not string)
 */
function formatCurrencyForExcel(value: number): number {
  return Math.round(value);
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
