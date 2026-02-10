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
  // Career
  CareerEventSchema,
  CareerProfileSchema,
  // Leave
  LeaveTypeSchema,
  LeaveBalanceSchema,
  LeaveEventSchema,
  // TSP
  TSPBalancesSchema,
  TSPContributionEventSchema,
  // Military
  MilitaryServiceSchema,
  // Expenses
  ExpenseCategoryNameSchema,
  SmileCurveParamsSchema,
  ExpenseCategorySchema,
  ExpenseProfileSchema,
  // Simulation
  RetirementAssumptionsSchema,
  RetirementScenarioStoredSchema,
  ScenariosSchema,
  // Envelope
  StoredRecordSchema,
} from './zod-schemas';
