/**
 * @fedplan/models — Data Models & Types
 *
 * All TypeScript types and interfaces used across FedPlan applications.
 * This is the single source of truth for data shapes.
 */

// Common types
export type { ISODate, USD, Rate, PayYear, GSGrade, GSStep, PaySystem } from './common';

// Career model
export type { CareerEvent, CareerProfile, PayPeriod } from './career';

// Leave model
export type { LeaveType, LeaveBalance, LeaveEvent } from './leave';

// Leave calendar model
export type {
  LeaveEntryStatus,
  CalendarLeaveType,
  SickLeaveCode,
  CalendarLeaveEntry,
  LeaveCarryOver,
  AccrualRate,
  LeaveCalendarYear,
  LeaveCalendarData,
} from './leave-calendar';

// Expenses model
export type { ExpenseCategoryName, ExpenseCategory, ExpenseProfile } from './expenses';

// TSP model
export type {
  TSPBalances,
  TSPFundCode,
  TSPFundAllocation,
  TSPAccountSnapshot,
  TSPTransactionRow,
  TSPImportError,
  TSPContributionEvent,
  TSPAllocation,
  TSPBalance,
  TSPConfig,
  TSPProfile,
  WithdrawalStrategy,
} from './tsp';

// Tax model
export type {
  FilingStatus,
  StateCode,
  TaxProfile,
  FederalBracket,
  TaxYearResult,
  StateTaxRule,
  StandardDeduction,
  IrmaaTier,
  FederalDeductions,
  IrmaaThreshold,
  StateResidency,
  TaxProfileInput,
} from './tax';

// Military model
export type { MilitaryService, MilitaryBuyback } from './military';

// Simulation models
export type {
  RetirementAssumptions,
  SimulationInput,
  AnnualProjection,
  SimulationResult,
  RetirementScenario,
  SimulationConfig,
  SimulationYearResult,
  FullSimulationResult,
  SimulationYear,
  SimulationData,
  SimulationDataAdvanced,
} from './simulation';

// Scenario model
export type {
  FormSnapshot,
  NamedScenario,
  ScenarioComparisonMetrics,
  ScenarioDelta,
  ScenarioComparison,
} from './scenario';
