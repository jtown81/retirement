/**
 * Chart Data Point Types
 *
 * Flat data shapes for chart rendering — no module types leak into components.
 * Each chart component receives pre-computed data points; all business logic
 * stays in the demo fixture or useSimulation hook.
 */

import type { AnnualProjection } from '@models/simulation';

// ── Data point interfaces ────────────────────────────────────────────────────

export interface PayGrowthDataPoint {
  year: number;
  salary: number;
  grade: number;
  step: number;
}

export interface LeaveBalanceDataPoint {
  year: number;
  annualLeaveHours: number;
  sickLeaveHours: number;
}

export interface TSPBalanceDataPoint {
  year: number;
  traditionalBalance: number;
  rothBalance: number;
  totalBalance: number;
}

export interface SmileCurveDataPoint {
  yearsIntoRetirement: number;
  multiplier: number;
  adjustedExpenses: number;
  baseExpenses: number;
}

// ── Props interfaces ─────────────────────────────────────────────────────────

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  minHeight?: number;
  children: React.ReactNode;
}

export interface PayGrowthChartProps {
  data: PayGrowthDataPoint[];
  retirementYear?: number;
}

export interface LeaveBalancesChartProps {
  data: LeaveBalanceDataPoint[];
}

export interface TSPBalancesChartProps {
  data: TSPBalanceDataPoint[];
}

export interface IncomeVsExpensesChartProps {
  data: AnnualProjection[];
}

export interface ExpenseSmileCurveChartProps {
  data: SmileCurveDataPoint[];
}

export interface MetricCardProps {
  label: string;
  value: string;
  variant?: 'positive' | 'negative' | 'neutral' | 'default';
}

export interface SummaryPanelProps {
  annuity: string;
  high3: string;
  creditableService: string;
  eligibilityType: string;
  fersSupplement: string;
  year1Surplus: string;
  year1SurplusVariant: MetricCardProps['variant'];
}
