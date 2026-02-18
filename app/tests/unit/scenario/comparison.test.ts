/**
 * Scenario Comparison Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  computeMetricDelta,
  formatMetric,
  formatDelta,
  prettifyMetricName,
} from '@utils/scenario-comparison';
import type { ScenarioComparisonMetrics } from '@models/scenario';

// Sample baseline metrics
const baseline: ScenarioComparisonMetrics = {
  scenarioId: 'base-001',
  label: 'Baseline',
  year1Annuity: 27900,
  year1SupplementaryAnnuity: 12300,
  year1SocialSecurity: 0,
  year1TSPWithdrawal: 18000,
  year1GrossIncome: 58200,
  year1FederalTax: 6420,
  year1StateTax: 0,
  year1IrmaaSurcharge: 0,
  year1AfterTaxIncome: 51780,
  year1MonthlyAfterTax: 4315,
  totalLifetimeIncome: 1847569,
  totalLifetimeTax: 187450,
  totalLifetimeAfterTaxIncome: 1660119,
  effectiveFederalRate: 10.14,
  effectiveTotalRate: 10.14,
  depletionAge: null,
  balanceAt85: 723456,
  retirementAge: 57,
  years: 40,
};

// Sample comparison metrics (slightly better scenario)
const comparison: ScenarioComparisonMetrics = {
  ...baseline,
  scenarioId: 'scen-002',
  label: 'Scenario 2',
  year1Annuity: 31200,
  year1GrossIncome: 62400,
  year1FederalTax: 7100,
  year1AfterTaxIncome: 55300,
  year1MonthlyAfterTax: 4608,
  totalLifetimeIncome: 1987234,
  totalLifetimeTax: 195620,
  totalLifetimeAfterTaxIncome: 1791614,
};

describe('computeMetricDelta', () => {
  it('Computes positive delta for income increase', () => {
    const delta = computeMetricDelta('year1Annuity', baseline, comparison);
    expect(delta.deltaValue).toBe(3300);
    expect(delta.deltaPercentage).toBeCloseTo(11.83, 1);
    expect(delta.isImprovement).toBe(true);
  });

  it('Identifies higher tax as disadvantage', () => {
    const delta = computeMetricDelta('year1FederalTax', baseline, comparison);
    expect(delta.deltaValue).toBe(680);
    expect(delta.isImprovement).toBe(false); // higher tax is worse
  });

  it('Handles zero-value baseline (no percentage)', () => {
    const delta = computeMetricDelta('year1SocialSecurity', baseline, comparison);
    expect(delta.deltaPercentage).toBe(0);
  });

  it('Identifies null depletionAge correctly', () => {
    const delta = computeMetricDelta('depletionAge', baseline, comparison);
    expect(delta.baselineValue).toBe(null);
    expect(delta.comparisonValue).toBe(null);
  });

  it('Computes delta percentage correctly for negative deltas', () => {
    const improved = { ...comparison, year1FederalTax: 5000 };
    const delta = computeMetricDelta('year1FederalTax', baseline, improved);
    expect(delta.deltaValue).toBe(-1420);
    expect(delta.isImprovement).toBe(true); // lower tax is better
  });
});

describe('formatMetric', () => {
  it('Formats currency with commas', () => {
    expect(formatMetric('year1Annuity', 27900)).toBe('$27,900');
    expect(formatMetric('totalLifetimeIncome', 1847569)).toBe('$1,847,569');
  });

  it('Formats monthly income with /mo suffix', () => {
    expect(formatMetric('year1MonthlyAfterTax', 4315)).toBe('$4,315/mo');
  });

  it('Formats rates with percent sign', () => {
    expect(formatMetric('effectiveFederalRate', 10.14)).toBe('10.1%');
  });

  it('Formats depletionAge as "Age X"', () => {
    expect(formatMetric('depletionAge', 81)).toBe('Age 81');
    expect(formatMetric('depletionAge', null)).toBe('Never');
  });

  it('Formats retirementAge as "Age X"', () => {
    expect(formatMetric('retirementAge', 57)).toBe('Age 57');
  });

  it('Formats years with count', () => {
    expect(formatMetric('years', 40)).toBe('40 years');
  });

  it('Rounds currency values to nearest dollar', () => {
    expect(formatMetric('year1Annuity', 27900.76)).toBe('$27,901');
  });
});

describe('formatDelta', () => {
  it('Formats positive income delta with up arrow', () => {
    const delta = computeMetricDelta('year1Annuity', baseline, comparison);
    const formatted = formatDelta(delta);
    expect(formatted).toMatch(/\+\$3,300/);
    expect(formatted).toMatch(/▲/);
  });

  it('Formats tax delta with down arrow when improvement', () => {
    const improved = { ...comparison, year1FederalTax: 5000 };
    const delta = computeMetricDelta('year1FederalTax', baseline, improved);
    const formatted = formatDelta(delta);
    expect(formatted).toMatch(/−\$1,420/); // minus sign
    expect(formatted).toMatch(/▲/); // improvement arrow
  });

  it('Formats zero delta as dash', () => {
    const noChange = { ...baseline };
    const delta = computeMetricDelta('year1Annuity', baseline, noChange);
    expect(formatDelta(delta)).toBe('—');
  });

  it('Formats rate delta in percentage points', () => {
    const improved = { ...comparison, effectiveFederalRate: 9.5 };
    const delta = computeMetricDelta('effectiveFederalRate', baseline, improved);
    const formatted = formatDelta(delta);
    expect(formatted).toMatch(/pp/); // percentage points
  });
});

describe('prettifyMetricName', () => {
  it('Converts camelCase to title case', () => {
    expect(prettifyMetricName('year1FederalTax')).toBe('Year 1 Federal Tax');
    expect(prettifyMetricName('totalLifetimeIncome')).toBe('Total Lifetime Income');
  });

  it('Preserves special abbreviations', () => {
    expect(prettifyMetricName('effectiveFederalRate')).toContain('Federal');
  });

  it('Handles all-caps acronyms', () => {
    const formatted = prettifyMetricName('year1TSPWithdrawal');
    expect(formatted).toContain('TSP');
  });
});
