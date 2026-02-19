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
  averageAnnualSickLeaveUsage: z.number().finite().nonnegative().optional(),
});

export const LeaveEventSchema = z.object({
  id: z.string().min(1),
  date: ISODateSchema,
  type: LeaveTypeSchema,
  hoursUsed: z.number().finite().positive(),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Leave Calendar
// ---------------------------------------------------------------------------

export const CalendarLeaveTypeSchema = z.enum([
  'planned-annual',
  'planned-sick',
  'actual-annual',
  'actual-sick',
]);

export const SickLeaveCodeSchema = z.enum(['LS', 'DE']);

export const CalendarLeaveEntrySchema = z.object({
  id: z.string().min(1),
  date: ISODateSchema,
  leaveType: CalendarLeaveTypeSchema,
  hours: z.number().finite().min(0.25).max(8),
  sickCode: SickLeaveCodeSchema.optional(),
  notes: z.string().optional(),
});

export const LeaveCarryOverSchema = z.object({
  annualLeaveHours: z.number().finite().nonnegative(),
  sickLeaveHours: z.number().finite().nonnegative(),
});

export const AccrualRateSchema = z.union([z.literal(4), z.literal(6), z.literal(8)]);

export const LeaveCalendarYearSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  accrualRatePerPP: AccrualRateSchema,
  carryOver: LeaveCarryOverSchema,
  entries: z.array(CalendarLeaveEntrySchema),
});

export const LeaveCalendarDataSchema = z.object({
  years: z.record(z.coerce.number().int(), LeaveCalendarYearSchema),
  activeYear: z.number().int().min(2000).max(2100),
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
  employeeTraditionalPct: RateSchema.min(0).max(1),
  employeeRothPct: RateSchema.min(0).max(1),
  catchUpEnabled: z.boolean(),
  agencyMatchTrueUp: z.boolean().optional(),
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
// TSP (NEW in Phase 10 — balance snapshots)
// ---------------------------------------------------------------------------

export const TSPFundCodeSchema = z.enum([
  'G', 'F', 'C', 'S', 'I',
  'L-Income', 'L2025', 'L2030', 'L2035', 'L2040',
  'L2045', 'L2050', 'L2055', 'L2060', 'L2065',
]);

export const TSPFundAllocationSchema = z.object({
  fund: TSPFundCodeSchema,
  percentage: z.number().finite().min(0).max(100),
});

export const TSPAccountSnapshotSchema = z.object({
  id: z.string().min(1),
  asOf: ISODateSchema,
  source: z.enum(['tsp-statement', 'manual', 'import']),
  traditionalBalance: USDSchema,
  rothBalance: USDSchema,
  ytdEmployeeContributions: USDSchema.optional(),
  ytdAgencyContributions: USDSchema.optional(),
  fundAllocations: z.array(TSPFundAllocationSchema),
  notes: z.string().optional(),
});

export const TSPTransactionRowSchema = z.object({
  date: ISODateSchema,
  description: z.string().min(1),
  fund: TSPFundCodeSchema.nullable(),
  source: z.enum(['employee', 'agency-auto', 'agency-match', 'earnings', 'withdrawal', 'other']),
  amount: z.number().finite(),
  runningBalance: z.number().finite().nonnegative(),
});

// ---------------------------------------------------------------------------
// Tax (NEW in Phase 10)
// ---------------------------------------------------------------------------

export const FilingStatusSchema = z.enum([
  'single',
  'married-joint',
  'married-separate',
  'head-of-household',
]);

export const StateCodeSchema = z.string().length(2).nullable();

export const TaxProfileSchema = z.object({
  filingStatus: FilingStatusSchema,
  stateCode: StateCodeSchema,
  stateResidencyYear: z.number().int().min(2000).max(2100),
  deductionStrategy: z.union([z.literal('standard'), z.number().nonnegative()]),
  modelIrmaa: z.boolean(),
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
  healthcareInflationRate: RateSchema.min(0).max(0.2).optional(),
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
// FERS Estimate (Basic Calculator inputs)
// ---------------------------------------------------------------------------

export const FERSEstimateSchema = z.object({
  // Service & salary
  retirementAgeOption: z.enum(['MRA', '60', '62', 'custom']).optional(),
  retirementDate: ISODateSchema,
  gsGrade: GSGradeSchema.optional(),
  gsStep: GSStepSchema.optional(),
  localityCode: z.string().min(1).optional(),
  annualRaiseRate: RateSchema.min(0).max(0.1).optional(),
  high3Override: USDSchema.optional(),
  sickLeaveHours: z.number().finite().nonnegative(),
  // Annuity
  annuityReductionPct: RateSchema.min(0).max(1),
  // Social Security
  ssaBenefitAt62: USDSchema.optional(),
  annualEarnings: USDSchema.optional(),
  // TSP projection
  currentTspBalance: USDSchema,
  traditionalTspBalance: USDSchema.optional(),
  rothTspBalance: USDSchema.optional(),
  /** Employee Traditional TSP contribution as % of gross pay (e.g., 0.05 = 5%) */
  traditionalContribPct: RateSchema.min(0).max(1),
  /** Employee Roth TSP contribution as % of gross pay (e.g., 0.05 = 5%) */
  rothContribPct: RateSchema.min(0).max(1),
  catchUpEligible: z.boolean().optional(),
  agencyMatchTrueUp: z.boolean().optional(),
  tspGrowthRate: RateSchema.min(0).max(1),
  // TSP withdrawals
  withdrawalRate: RateSchema.min(0).max(1),
  withdrawalStartAge: z.number().int().min(50).max(90),
  oneTimeWithdrawalAmount: USDSchema.optional(),
  oneTimeWithdrawalAge: z.number().int().min(50).max(90).optional(),
});

// ---------------------------------------------------------------------------
// Simulation Config (post-retirement projection)
// ---------------------------------------------------------------------------

export const TimeStepYearsSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const WithdrawalStrategySchema = z.enum([
  'proportional',
  'traditional-first',
  'roth-first',
  'custom',
  'tax-bracket-fill',
]);

export const CustomWithdrawalSplitSchema = z
  .object({
    traditionalPct: RateSchema.min(0).max(1),
    rothPct: RateSchema.min(0).max(1),
  })
  .refine((d) => Math.abs(d.traditionalPct + d.rothPct - 1.0) < 0.001, {
    message: 'traditionalPct + rothPct must equal 1.0',
  });

export const SSClaimingAgeSchema = z.union([z.literal(62), z.literal(67), z.literal(70)]);

export const SimulationConfigSchema = z.object({
  // D-3: Consolidated Assumptions (merged from RetirementAssumptions)
  proposedRetirementDate: ISODateSchema,
  tspGrowthRate: RateSchema.min(-0.5).max(0.5),
  // Core
  retirementAge: z.number().int().min(50).max(90),
  retirementYear: z.number().int().min(2000).max(2100),
  endAge: z.number().int().min(70).max(104),
  birthYear: z.number().int().min(1900).max(2010).optional(),
  fersAnnuity: USDSchema,
  fersSupplement: USDSchema,
  ssMonthlyAt62: USDSchema,
  ssClaimingAge: SSClaimingAgeSchema.optional(),
  // TSP
  tspBalanceAtRetirement: USDSchema,
  traditionalPct: RateSchema.min(0).max(1),
  highRiskPct: RateSchema.min(0).max(1),
  highRiskROI: RateSchema.min(-0.5).max(0.5),
  lowRiskROI: RateSchema.min(-0.5).max(0.5),
  withdrawalRate: RateSchema.min(0).max(1),
  timeStepYears: TimeStepYearsSchema,
  // Withdrawal Strategy (Phase C)
  withdrawalStrategy: WithdrawalStrategySchema.optional().default('proportional'),
  customWithdrawalSplit: CustomWithdrawalSplitSchema.optional(),
  // Expenses
  baseAnnualExpenses: USDSchema,
  goGoEndAge: z.number().int().min(50).max(104),
  goGoRate: RateSchema.min(0).max(2),
  goSlowEndAge: z.number().int().min(50).max(104),
  goSlowRate: RateSchema.min(0).max(2),
  noGoRate: RateSchema.min(0).max(2),
  // Rates (D-3: merged from RetirementAssumptions)
  retirementHorizonYears: z.number().int().min(0).max(100).optional(),
  colaRate: RateSchema.min(0).max(0.1),
  inflationRate: RateSchema.min(0).max(0.2),
  healthcareInflationRate: RateSchema.min(0).max(0.2).optional(),
  healthcareAnnualExpenses: USDSchema.optional(),
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
// Named Scenarios (NEW in Phase 11, PR-005)
// Full scenario with snapshot of complete simulation result
// ---------------------------------------------------------------------------

export const SimulationYearResultSchema = z.object({
  year: z.number().int(),
  age: z.number(),
  annuity: USDSchema,
  fersSupplement: USDSchema,
  socialSecurity: USDSchema,
  tspWithdrawal: USDSchema,
  totalIncome: USDSchema,
  federalTax: USDSchema,
  stateTax: USDSchema,
  irmaaSurcharge: USDSchema,
  totalTax: USDSchema,
  effectiveFederalRate: RateSchema,
  effectiveTotalRate: RateSchema,
  socialSecurityTaxableFraction: z.union([z.literal(0), z.literal(0.5), z.literal(0.85)]),
  afterTaxIncome: USDSchema,
  smileMultiplier: z.number(),
  totalExpenses: USDSchema,
  highRiskBalance: USDSchema,
  lowRiskBalance: USDSchema,
  traditionalBalance: USDSchema,
  rothBalance: USDSchema,
  totalTSPBalance: USDSchema,
  rmdRequired: USDSchema,
  rmdSatisfied: z.boolean(),
  surplus: USDSchema,
});

export const FullSimulationResultSchema = z.object({
  config: SimulationConfigSchema,
  years: z.array(SimulationYearResultSchema),
  depletionAge: z.number().int().nullable(),
  balanceAt85: USDSchema,
  totalLifetimeIncome: USDSchema,
  totalLifetimeExpenses: USDSchema,
  totalLifetimeFederalTax: USDSchema.optional(),
  totalLifetimeStateTax: USDSchema.optional(),
  totalLifetimeIrmaa: USDSchema.optional(),
  totalLifetimeTax: USDSchema.optional(),
  totalLifetimeAfterTaxIncome: USDSchema.optional(),
});

export const SimulationInputSchema = z.object({
  profile: z.object({
    birthDate: ISODateSchema,
    career: CareerProfileSchema,
    leaveBalance: LeaveBalanceSchema,
    tspBalances: TSPBalancesSchema,
    tspContributions: z.array(TSPContributionEventSchema),
    militaryService: z.array(MilitaryServiceSchema).optional(),
    expenses: ExpenseProfileSchema,
  }),
  assumptions: RetirementAssumptionsFullSchema,
});

export const NamedScenarioSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(200),
  createdAt: ISODateSchema,
  description: z.string().optional(),
  inputs: SimulationInputSchema,
  result: FullSimulationResultSchema,
  isBaseline: z.boolean(),
  updatedAt: ISODateSchema.optional(),
});

export const NamedScenariosArraySchema = z.array(NamedScenarioSchema);

// ---------------------------------------------------------------------------
// StoredRecord wrapper
// ---------------------------------------------------------------------------

export const StoredRecordSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    schemaVersion: z.number().int().nonnegative(),
    updatedAt: z.string().datetime(),
    data: dataSchema,
  });
