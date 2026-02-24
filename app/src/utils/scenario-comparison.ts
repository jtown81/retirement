/**
 * Scenario Comparison Utilities
 * Functions for calculating deltas and formatting metrics for display.
 */

import type { ScenarioComparisonMetrics, ScenarioDelta } from '@fedplan/models';

/**
 * Compute delta between two scenarios for a single metric
 */
export function computeMetricDelta(
  metricName: keyof ScenarioComparisonMetrics,
  baseline: ScenarioComparisonMetrics,
  comparison: ScenarioComparisonMetrics,
): ScenarioDelta {
  const baselineValue = baseline[metricName] as number | null;
  const comparisonValue = comparison[metricName] as number | null;

  if (typeof baselineValue !== 'number' || typeof comparisonValue !== 'number') {
    return {
      label: metricName,
      baselineValue: (baselineValue as any) ?? null,
      comparisonValue: (comparisonValue as any) ?? null,
      deltaValue: 0,
      deltaPercentage: 0,
      isImprovement: false,
    };
  }

  const deltaValue = comparisonValue - baselineValue;
  const deltaPercentage =
    baselineValue !== 0 ? (deltaValue / Math.abs(baselineValue)) * 100 : 0;

  // Determine if improvement based on metric (some metrics are better if lower)
  const lowerIsBetter = [
    'year1FederalTax',
    'year1StateTax',
    'year1IrmaaSurcharge',
    'totalLifetimeTax',
    'effectiveFederalRate',
    'effectiveTotalRate',
  ];

  const isImprovement = lowerIsBetter.includes(metricName)
    ? deltaValue < 0
    : deltaValue > 0;

  return {
    label: metricName,
    baselineValue,
    comparisonValue,
    deltaValue,
    deltaPercentage,
    isImprovement,
  };
}

/**
 * Format a scenario metric value for display
 */
export function formatMetric(
  name: keyof ScenarioComparisonMetrics,
  value: any,
): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    if (name === 'depletionAge' || name === 'retirementAge') {
      return 'Never';
    }
    return String(value);
  }

  if (typeof value !== 'number') {
    return String(value);
  }

  // Monthly income (check first before general income check)
  if (name === 'year1MonthlyAfterTax') {
    return `$${Math.round(value).toLocaleString('en-US')}/mo`;
  }

  // Currency fields (annuity, income, tax, balance)
  if (
    name.includes('Annuity') ||
    name.includes('Income') ||
    name.includes('Tax') ||
    name.includes('Balance') ||
    name.includes('Total')
  ) {
    return `$${Math.round(value).toLocaleString('en-US')}`;
  }

  // Percentage fields
  if (name.includes('Rate')) {
    return `${value.toFixed(1)}%`;
  }

  // Age fields
  if (name === 'depletionAge' || name === 'retirementAge') {
    return `Age ${Math.round(value)}`;
  }

  // Integer fields
  if (name === 'years') {
    return `${Math.round(value)} years`;
  }

  // Default: round and format with commas
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Format delta for display in comparison table
 * Shows delta value with appropriate unit and improvement indicator
 */
export function formatDelta(delta: ScenarioDelta): string {
  if (typeof delta.deltaValue !== 'number') {
    return '—';
  }

  if (delta.deltaValue === 0) {
    return '—';
  }

  const sign = delta.deltaValue > 0 ? '+' : delta.deltaValue < 0 ? '−' : '';

  // Format based on metric type
  let metric = '';
  if (delta.label.includes('Rate')) {
    // Rate: show percentage points
    metric = `${sign}${Math.abs(delta.deltaPercentage).toFixed(1)}pp`;
  } else if (
    delta.label.includes('Age') ||
    delta.label === 'years'
  ) {
    // Age: show absolute value
    metric = `${sign}${Math.abs(delta.deltaValue)}`;
  } else {
    // Currency: show dollar amount
    metric = `${sign}$${Math.abs(delta.deltaValue).toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })}`;
  }

  const arrow =
    delta.isImprovement ? ' ▲' : delta.deltaValue !== 0 ? ' ▼' : '';
  return `${metric}${arrow}`;
}

/**
 * Convert camelCase metric name to display label
 * e.g., "year1FederalTax" → "Year 1 Federal Tax"
 */
export function prettifyMetricName(name: string): string {
  return (
    name
      // Insert space after numbers when followed by capital (1F → 1 F)
      .replace(/(\d)([A-Z])/g, '$1 $2')
      // Insert space before capital letters (aB → a B)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Insert space before numbers (a1 → a 1)
      .replace(/([a-z])(\d)/g, '$1 $2')
      // Capitalize first letter
      .replace(/^./, (c) => c.toUpperCase())
      .trim()
      // Fix common abbreviations to preserve them
      .replace(/\bTsp\b/g, 'TSP')
      .replace(/\bSs\b/g, 'SS')
      .replace(/\bIrmaa\b/g, 'IRMAA')
  );
}

/**
 * Metric grouping for comparison table sections
 */
export interface MetricGroup {
  group: string;
  metrics: (keyof ScenarioComparisonMetrics)[];
}

/**
 * Standard metric groups for comparison table display
 */
export const METRIC_GROUPS: MetricGroup[] = [
  {
    group: 'Year 1 Income',
    metrics: [
      'year1Annuity',
      'year1SupplementaryAnnuity',
      'year1SocialSecurity',
      'year1TSPWithdrawal',
      'year1GrossIncome',
    ],
  },
  {
    group: 'Year 1 Taxes & Deductions',
    metrics: ['year1FederalTax', 'year1StateTax', 'year1IrmaaSurcharge'],
  },
  {
    group: 'Year 1 After-Tax',
    metrics: ['year1AfterTaxIncome', 'year1MonthlyAfterTax'],
  },
  {
    group: 'Lifetime Summary',
    metrics: [
      'totalLifetimeIncome',
      'totalLifetimeTax',
      'totalLifetimeAfterTaxIncome',
      'effectiveFederalRate',
    ],
  },
  {
    group: 'TSP & Longevity',
    metrics: ['depletionAge', 'balanceAt85', 'retirementAge', 'years'],
  },
];
