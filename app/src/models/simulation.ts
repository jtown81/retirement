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
