/**
 * Local Persistence Layer — Public API
 *
 * All storage access goes through this module.
 * Never import from persistence.ts or zod-schemas.ts directly in
 * business-logic code; use this barrel export.
 */

export { STORAGE_KEYS, CURRENT_SCHEMA_VERSION } from './schema';
export type { StoredRecord } from './schema';

export {
  save,
  load,
  remove,
  clearAll,
  exportAll,
  importAll,
} from './persistence';

export {
  // Primitive schemas
  ISODateSchema,
  USDSchema,
  RateSchema,
  GSGradeSchema,
  GSStepSchema,
  PaySystemSchema,
  // Personal info
  PersonalInfoSchema,
  // Career
  CareerEventSchema,
  CareerProfileSchema,
  // Leave
  LeaveTypeSchema,
  LeaveBalanceSchema,
  LeaveEventSchema,
  // Leave Calendar
  CalendarLeaveTypeSchema,
  SickLeaveCodeSchema,
  CalendarLeaveEntrySchema,
  LeaveCarryOverSchema,
  AccrualRateSchema,
  LeaveCalendarYearSchema,
  LeaveCalendarDataSchema,
  // TSP
  TSPBalancesSchema,
  TSPContributionEventSchema,
  // Military
  MilitaryServiceSchema,
  // TSP Snapshots
  TSPFundCodeSchema,
  TSPFundAllocationSchema,
  TSPAccountSnapshotSchema,
  TSPTransactionRowSchema,
  // Tax
  TaxProfileSchema,
  FilingStatusSchema,
  StateCodeSchema,
  // Expenses
  ExpenseCategoryNameSchema,
  SmileCurveParamsSchema,
  ExpenseCategorySchema,
  ExpenseProfileSchema,
  // FERS Estimate
  FERSEstimateSchema,
  // Simulation Config
  SimulationConfigSchema,
  TimeStepYearsSchema,
  // Simulation (legacy)
  RetirementAssumptionsSchema,
  RetirementAssumptionsFullSchema,
  RetirementScenarioStoredSchema,
  ScenariosSchema,
  // Envelope
  StoredRecordSchema,
} from './zod-schemas';
