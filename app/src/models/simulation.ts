/**
 * Simulation Data Models
 * No business logic — pure data shapes.
 */

import type { ISODate, USD, Rate } from './common';
import type { CareerProfile } from './career';
import type { LeaveBalance } from './leave';
import type { TSPBalances, TSPContributionEvent } from './tsp';
import type { MilitaryService } from './military';
import type { ExpenseProfile } from './expenses';

/**
 * Retirement planning assumptions — user-configurable parameters
 * that drive the simulation forward.
 */
export interface RetirementAssumptions {
  /** Proposed retirement date for this scenario */
  proposedRetirementDate: ISODate;
  /** Assumed annual TSP portfolio growth rate (e.g., 0.07 = 7%) */
  tspGrowthRate: Rate;
  /**
   * FERS annuity COLA rate applied in post-retirement projections.
   * ASSUMPTION: COLA is uncertain; this is a user-configurable estimate.
   * Hard cap: FERS COLA ≤ CSRS COLA; see OPM FERS Handbook Ch. 2.
   */
  colaRate: Rate;
  /** Number of years to project post-retirement (e.g., 30) */
  retirementHorizonYears: number;
  /**
   * Annual TSP withdrawal as a fraction of the TSP balance at retirement (default: 0.04).
   * ASSUMPTION: Constant percentage withdrawal ("4% rule" as default).
   * User-configurable. Withdrawals grow with COLA in subsequent years.
   */
  tspWithdrawalRate?: Rate;
  /**
   * Estimated monthly Social Security benefit at age 62 (in today's dollars).
   * Used to compute the FERS Supplement (SRS).
   * ASSUMPTION: User-provided from their Social Security statement.
   * If omitted, SRS is set to 0.
   */
  estimatedSSMonthlyAt62?: USD;
}

export interface SimulationInput {
  profile: {
    birthDate: ISODate;
    career: CareerProfile;
    leaveBalance: LeaveBalance;
    tspBalances: TSPBalances;
    tspContributions: TSPContributionEvent[];
    militaryService?: MilitaryService[];
    expenses: ExpenseProfile;
  };
  assumptions: RetirementAssumptions;
}

export interface AnnualProjection {
  year: number;
  age: number;
  annuity: USD;
  fersSupplementAmount: USD;
  tspWithdrawal: USD;
  totalIncome: USD;
  totalExpenses: USD;
  surplus: USD;     // positive = income exceeds expenses
}

export interface SimulationResult {
  inputSummary: SimulationInput;
  high3Salary: USD;
  creditableServiceYears: number;
  annualAnnuity: USD;
  fersSupplementEligible: boolean;
  projections: AnnualProjection[];
  eligibility: { eligible: boolean; type: string | null };
}

export interface RetirementScenario {
  id: string;
  label: string;
  input: SimulationInput;
  result?: SimulationResult;
}

// ---------------------------------------------------------------------------
// Retirement Simulation (post-retirement year-by-year projection)
// ---------------------------------------------------------------------------

/**
 * Configuration for the full retirement simulation engine.
 * Drives the year-by-year post-retirement projection with dual-pot TSP,
 * RMD compliance, and expense smile curve (GoGo/GoSlow/NoGo).
 */
export interface SimulationConfig {
  // ── Core (drawn from FERS Estimate results) ──
  /** Age at retirement (integer) */
  retirementAge: number;
  /** End age for projection (default: 95, max: 104) */
  endAge: number;
  /** Net annual FERS annuity (after survivor benefit reduction) */
  fersAnnuity: USD;
  /** Annual FERS Supplement (0 if not eligible; paid until age 62) */
  fersSupplement: USD;
  /** Monthly Social Security benefit at age 62 (0 if unknown) */
  ssMonthlyAt62: USD;

  // ── TSP ──
  /** Total TSP balance at retirement */
  tspBalanceAtRetirement: USD;
  /** Fraction of TSP that is Traditional (e.g. 0.70 = 70% Trad, 30% Roth) */
  traditionalPct: Rate;
  /** Fraction of total TSP in high-risk funds (C/S/I). Remainder is low-risk (G/F). */
  highRiskPct: Rate;
  /** Annual ROI for high-risk pot (e.g. 0.08 = 8%) */
  highRiskROI: Rate;
  /** Annual ROI for low-risk pot (e.g. 0.03 = 3%) */
  lowRiskROI: Rate;
  /** Annual withdrawal rate as fraction of initial balance (e.g. 0.04 = 4%) */
  withdrawalRate: Rate;
  /**
   * Number of years of withdrawals to keep in the low-risk pot as a buffer.
   * At end of each year, high-risk transfers to low-risk to maintain this buffer.
   */
  timeStepYears: 1 | 2 | 3;

  // ── Expenses (GoGo / GoSlow / NoGo smile curve) ──
  /** Base annual expenses in today's dollars */
  baseAnnualExpenses: USD;
  /** Age at which GoGo phase ends and GoSlow begins */
  goGoEndAge: number;
  /** Spending multiplier during GoGo phase (e.g. 1.0) */
  goGoRate: Rate;
  /** Age at which GoSlow phase ends and NoGo begins */
  goSlowEndAge: number;
  /** Spending multiplier during GoSlow phase (e.g. 0.85) */
  goSlowRate: Rate;
  /** Spending multiplier during NoGo phase (e.g. 0.75) */
  noGoRate: Rate;

  // ── Rates ──
  /** Annual COLA rate for annuity and FERS supplement */
  colaRate: Rate;
  /** Annual inflation rate for general expense adjustment */
  inflationRate: Rate;
  /** Annual inflation rate for healthcare expenses (typically higher than general) */
  healthcareInflationRate?: Rate;
  /** Annual healthcare expense amount (split from baseAnnualExpenses for separate inflation) */
  healthcareAnnualExpenses?: USD;
}

/**
 * Per-year result row from the retirement simulation.
 */
export interface SimulationYearResult {
  year: number;
  age: number;
  // Income
  annuity: USD;
  fersSupplement: USD;
  socialSecurity: USD;
  tspWithdrawal: USD;
  totalIncome: USD;
  // Expenses
  smileMultiplier: number;
  totalExpenses: USD;
  // TSP Balances (end of year)
  highRiskBalance: USD;
  lowRiskBalance: USD;
  traditionalBalance: USD;
  rothBalance: USD;
  totalTSPBalance: USD;
  // RMD
  rmdRequired: USD;
  rmdSatisfied: boolean;
  // Net
  surplus: USD;
}

/**
 * Full output of the retirement simulation.
 */
export interface FullSimulationResult {
  config: SimulationConfig;
  years: SimulationYearResult[];
  /** Age at which total TSP hits 0, or null if it survives */
  depletionAge: number | null;
  /** TSP balance at age 85 */
  balanceAt85: USD;
  /** Total lifetime income across all projected years */
  totalLifetimeIncome: USD;
  /** Total lifetime expenses across all projected years */
  totalLifetimeExpenses: USD;
}
