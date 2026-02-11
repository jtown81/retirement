/**
 * Zod Runtime Schemas
 *
 * Mirror every storable model with Zod for validation at the
 * localStorage boundary. These are the single source of truth
 * for what "valid stored data" means at runtime.
 *
 * Rule: Every schema here must stay in sync with its TypeScript
 * interface in src/models/. TypeScript provides compile-time safety;
 * Zod provides runtime safety when reading untrusted localStorage data.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date string in YYYY-MM-DD format');

export const USDSchema = z.number().finite().nonnegative();

export const RateSchema = z.number().finite();

export const GSGradeSchema = z.number().int().min(1).max(15);

export const GSStepSchema = z.number().int().min(1).max(10);

export const PaySystemSchema = z.enum(['GS', 'LEO', 'Title38']);

// ---------------------------------------------------------------------------
// Career
// ---------------------------------------------------------------------------

export const CareerEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'hire',
    'promotion',
    'step-increase',
    'locality-change',
    'separation',
    'rehire',
  ]),
  effectiveDate: ISODateSchema,
  grade: GSGradeSchema,
  step: GSStepSchema,
  localityCode: z.string().min(1),
  paySystem: PaySystemSchema,
  annualSalary: USDSchema,
  notes: z.string().optional(),
});

export const CareerProfileSchema = z.object({
  id: z.string().min(1),
  scdLeave: ISODateSchema,
  scdRetirement: ISODateSchema,
  paySystem: PaySystemSchema,
  events: z.array(CareerEventSchema),
});

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------

export const LeaveTypeSchema = z.enum(['annual', 'sick', 'family-care']);

export const LeaveBalanceSchema = z.object({
  asOf: ISODateSchema,
  annualLeaveHours: z.number().finite().nonnegative(),
  sickLeaveHours: z.number().finite().nonnegative(),
  familyCareUsedCurrentYear: z.number().finite().nonnegative(),
});

export const LeaveEventSchema = z.object({
  id: z.string().min(1),
  date: ISODateSchema,
  type: LeaveTypeSchema,
  hoursUsed: z.number().finite().positive(),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// TSP
// ---------------------------------------------------------------------------

export const TSPBalancesSchema = z.object({
  asOf: ISODateSchema,
  traditionalBalance: USDSchema,
  rothBalance: USDSchema,
});

export const TSPContributionEventSchema = z.object({
  id: z.string().min(1),
  effectiveDate: ISODateSchema,
  employeeContributionPct: RateSchema.min(0).max(1),
  isRoth: z.boolean(),
  catchUpEnabled: z.boolean(),
});

// ---------------------------------------------------------------------------
// Military
// ---------------------------------------------------------------------------

export const MilitaryServiceSchema = z.object({
  id: z.string().min(1),
  startDate: ISODateSchema,
  endDate: ISODateSchema,
  branch: z.string().min(1),
  annualBasicPayByYear: z.record(z.coerce.number().int().positive(), USDSchema),
  buybackDepositPaid: USDSchema,
  buybackDepositDate: ISODateSchema.optional(),
  militaryRetirementWaived: z.boolean(),
});

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export const ExpenseCategoryNameSchema = z.enum([
  'housing',
  'transportation',
  'food',
  'healthcare',
  'insurance',
  'travel-leisure',
  'utilities',
  'personal-care',
  'gifts-charitable',
  'other',
]);

export const SmileCurveParamsSchema = z.object({
  earlyMultiplier: z.number().finite().positive(),
  midMultiplier: z.number().finite().positive(),
  lateMultiplier: z.number().finite().positive(),
  midDipYear: z.number().int().positive(),
});

export const ExpenseCategorySchema = z.object({
  name: ExpenseCategoryNameSchema,
  annualAmount: USDSchema,
  notes: z.string().optional(),
});

export const ExpenseProfileSchema = z.object({
  id: z.string().min(1),
  baseYear: z.number().int().min(2000).max(2100),
  categories: z.array(ExpenseCategorySchema),
  inflationRate: RateSchema.min(0).max(0.2),
  smileCurveEnabled: z.boolean(),
  smileCurveParams: SmileCurveParamsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Personal info (new — form input section)
// ---------------------------------------------------------------------------

export const PersonalInfoSchema = z.object({
  birthDate: ISODateSchema,
  scdLeave: ISODateSchema,
  scdRetirement: ISODateSchema,
  paySystem: PaySystemSchema,
});

// ---------------------------------------------------------------------------
// Simulation assumptions
// ---------------------------------------------------------------------------

export const RetirementAssumptionsSchema = z.object({
  proposedRetirementDate: ISODateSchema,
  tspGrowthRate: RateSchema.min(0).max(1),
  colaRate: RateSchema.min(0).max(0.1),
  retirementHorizonYears: z.number().int().min(1).max(60),
});

/** Extended assumptions schema for form storage (includes optional fields) */
export const RetirementAssumptionsFullSchema = RetirementAssumptionsSchema.extend({
  tspWithdrawalRate: RateSchema.min(0).max(1).optional(),
  estimatedSSMonthlyAt62: USDSchema.optional(),
});

// ---------------------------------------------------------------------------
// Scenarios (stored as an array)
// ---------------------------------------------------------------------------

/**
 * Minimal scenario schema for storage — stores input only.
 * Results are recomputed on load; storing them is optional.
 */
export const RetirementScenarioStoredSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  input: z.object({
    profile: z.object({
      birthDate: ISODateSchema,
      career: CareerProfileSchema,
      leaveBalance: LeaveBalanceSchema,
      tspBalances: TSPBalancesSchema,
      tspContributions: z.array(TSPContributionEventSchema),
      militaryService: z.array(MilitaryServiceSchema).optional(),
      expenses: ExpenseProfileSchema,
    }),
    assumptions: RetirementAssumptionsSchema,
  }),
});

export const ScenariosSchema = z.array(RetirementScenarioStoredSchema);

// ---------------------------------------------------------------------------
// StoredRecord wrapper
// ---------------------------------------------------------------------------

export const StoredRecordSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    schemaVersion: z.number().int().nonnegative(),
    updatedAt: z.string().datetime(),
    data: dataSchema,
  });
