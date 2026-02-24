/**
 * Chart Data Point Types
 *
 * Flat data shapes for chart rendering — no module types leak into components.
 * Each chart component receives pre-computed data points; all business logic
 * stays in the demo fixture or useSimulation hook.
 */

import type { AnnualProjection } from '@fedplan/models';

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

export interface IncomeWaterfallDataPoint {
  year: number;
  age: number;
  annuity: number;
  fersSupplement: number;
  socialSecurity: number;
  tspWithdrawal: number;
  totalIncome: number;
  totalExpenses: number;
  surplus: number;
  // Tax data (NEW in Phase 10, optional)
  federalTax?: number;
  stateTax?: number;
  irmaaSurcharge?: number;
  totalTax?: number;
  afterTaxIncome?: number;
}

export interface TSPLifecycleDataPoint {
  year: number;
  age?: number;
  phase: 'accumulation' | 'distribution';
  traditionalBalance: number;
  rothBalance: number;
  totalBalance: number;
  highRiskBalance?: number;
  lowRiskBalance?: number;
  rmdRequired?: number;
  rmdSatisfied?: boolean;
  withdrawal?: number;
}

export interface ExpensePhaseDataPoint {
  year: number;
  age: number;
  yearsIntoRetirement: number;
  phase: 'GoGo' | 'GoSlow' | 'NoGo';
  baseExpenses: number;
  adjustedExpenses: number;
  healthcareExpenses?: number;
  nonHealthcareExpenses?: number;
  blanchettAdjusted: number;
  smileMultiplier: number;
}

export interface RMDDataPoint {
  year: number;
  age: number;
  rmdRequired: number;
  actualWithdrawal: number;
  rmdSatisfied: boolean;
  totalTSPBalance: number;
}

export interface MonteCarloYearBand {
  year: number;
  age: number;
  p10_balance: number;
  p25_balance: number;
  p50_balance: number;
  p75_balance: number;
  p90_balance: number;
  successRate: number;
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
  // Optional: shown when fullSimulation is available
  socialSecurityEstimate?: string;
  tspDepletionAge?: string;
  tspDepletionVariant?: MetricCardProps['variant'];
  lifetimeSurplus?: string;
  lifetimeSurplusVariant?: MetricCardProps['variant'];
}

export interface MonteCarloFanChartProps {
  data: MonteCarloYearBand[];
  overallSuccessRate: number;
  successRateAt85: number;
}
