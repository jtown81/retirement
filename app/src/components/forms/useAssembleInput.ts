import { useMemo } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  PersonalInfoSchema,
  CareerProfileSchema,
  LeaveCalendarDataSchema,
  TSPBalancesSchema,
  TSPContributionEventSchema,
  TSPAccountSnapshotSchema,
  ExpenseProfileSchema,
  RetirementAssumptionsFullSchema,
  MilitaryServiceSchema,
  FERSEstimateSchema,
  SimulationConfigSchema,
} from '@storage/index';
import { calculateAnnualPay } from '@fedplan/career';
import { calendarToLeaveBalance } from '@fedplan/leave';
import { z } from 'zod';
import type { SimulationInput, SimulationConfig } from '@fedplan/models';
import type { CareerProfile } from '@fedplan/models';
import type { GSGrade, GSStep } from '@fedplan/models';
import type { TSPBalances } from '@fedplan/models';

const TSPContributionListSchema = z.array(TSPContributionEventSchema);
const TSPSnapshotListSchema = z.array(TSPAccountSnapshotSchema);
const MilitaryServiceListSchema = z.array(MilitaryServiceSchema);

/**
 * Reads all form sections from localStorage and assembles a SimulationInput.
 * Returns null if any required section is missing.
 */
export function useAssembleInput(): SimulationInput | null {
  const [personal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [career] = useLocalStorage(STORAGE_KEYS.CAREER_PROFILE, CareerProfileSchema);
  // D-2: Read leave calendar; derive balance from calendar data
  const [leaveCalendar] = useLocalStorage(STORAGE_KEYS.LEAVE_CALENDAR, LeaveCalendarDataSchema);
  const [tspSnapshots] = useLocalStorage(STORAGE_KEYS.TSP_SNAPSHOTS, TSPSnapshotListSchema);
  const [tspContributions] = useLocalStorage(STORAGE_KEYS.TSP_CONTRIBUTIONS, TSPContributionListSchema);
  const [expenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);
  const [assumptions] = useLocalStorage(STORAGE_KEYS.ASSUMPTIONS, RetirementAssumptionsFullSchema);
  const [military] = useLocalStorage(STORAGE_KEYS.MILITARY_SERVICE, MilitaryServiceListSchema);
  const [fersEstimate] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [simConfig] = useLocalStorage(STORAGE_KEYS.SIMULATION_CONFIG, SimulationConfigSchema);

  return useMemo(() => {
    // D-1: Use only TSP snapshots (deprecated retire:tsp flat balance key)
    const snapshotList = Array.isArray(tspSnapshots) ? tspSnapshots : [];
    const latestSnapshot = snapshotList.length > 0
      ? [...snapshotList].sort((a, b) => new Date(b.asOf).getTime() - new Date(a.asOf).getTime())[0]
      : null;

    const tspBalances: TSPBalances | null = latestSnapshot
      ? {
          asOf: latestSnapshot.asOf,
          traditionalBalance: latestSnapshot.traditionalBalance,
          rothBalance: latestSnapshot.rothBalance,
        }
      : null;

    // D-3: Derive assumptions from SimulationConfig first, then fall back to assumptions key
    const effectiveAssumptions = simConfig
      ? {
          proposedRetirementDate: simConfig.proposedRetirementDate ?? new Date().toISOString().slice(0, 10),
          tspGrowthRate: simConfig.tspGrowthRate ?? 0.07,
          colaRate: simConfig.colaRate,
          retirementHorizonYears: simConfig.retirementHorizonYears ?? 30,
          ...(simConfig.tspWithdrawalRate != null ? { tspWithdrawalRate: simConfig.tspWithdrawalRate } : {}),
          ...(simConfig.estimatedSSMonthlyAt62 != null ? { estimatedSSMonthlyAt62: simConfig.estimatedSSMonthlyAt62 } : {}),
        }
      : assumptions;

    // personal, tspBalances, expenses, effective assumptions are always required
    if (!personal || !tspBalances || !expenses || !effectiveAssumptions) {
      return null;
    }

    // D-2: Derive leave balance from calendar or create empty default
    const effectiveLeave = leaveCalendar
      ? (() => {
          const activeYearData = leaveCalendar.years[leaveCalendar.activeYear];
          return activeYearData
            ? calendarToLeaveBalance(activeYearData)
            : {
                asOf: new Date().toISOString().slice(0, 10),
                annualLeaveHours: 0,
                sickLeaveHours: 0,
                familyCareUsedCurrentYear: 0,
              };
        })()
      : {
          asOf: new Date().toISOString().slice(0, 10),
          annualLeaveHours: 0,
          sickLeaveHours: 0,
          familyCareUsedCurrentYear: 0,
        };

    // Build career profile: use saved career if available, otherwise
    // synthesize a minimal one from personal info + FERS estimate
    let mergedCareer: CareerProfile;
    if (career) {
      mergedCareer = {
        ...(career as CareerProfile),
        scdLeave: personal.scdLeave,
        scdRetirement: personal.scdRetirement,
        paySystem: personal.paySystem,
      };
    } else {
      // No career events saved — build a single-event career from FERS data
      const grade = (fersEstimate?.gsGrade ?? 12) as GSGrade;
      const step = (fersEstimate?.gsStep ?? 5) as GSStep;
      const localityCode = fersEstimate?.localityCode ?? 'RUS';
      const currentYear = new Date().getFullYear();
      const payResult = calculateAnnualPay(grade, step, localityCode, currentYear);

      mergedCareer = {
        id: 'auto',
        scdLeave: personal.scdLeave,
        scdRetirement: personal.scdRetirement,
        paySystem: personal.paySystem,
        events: [{
          id: 'auto-hire',
          type: 'hire',
          effectiveDate: personal.scdLeave, // FIX: use hire date (scdLeave), not retirement date
          grade,
          step,
          localityCode,
          paySystem: personal.paySystem,
          annualSalary: payResult.totalAnnualPay, // FIX: compute from pay tables
        }],
      };
    }

    const input: SimulationInput = {
      profile: {
        birthDate: personal.birthDate,
        career: mergedCareer,
        leaveBalance: effectiveLeave,
        tspBalances,
        tspContributions: tspContributions ?? [],
        expenses,
        ...(military && military.length > 0 ? { militaryService: military } : {}),
      },
      assumptions: {
        proposedRetirementDate: effectiveAssumptions.proposedRetirementDate,
        tspGrowthRate: effectiveAssumptions.tspGrowthRate,
        colaRate: effectiveAssumptions.colaRate,
        retirementHorizonYears: effectiveAssumptions.retirementHorizonYears,
        ...(effectiveAssumptions.tspWithdrawalRate != null ? { tspWithdrawalRate: effectiveAssumptions.tspWithdrawalRate } : {}),
        ...(effectiveAssumptions.estimatedSSMonthlyAt62 != null ? { estimatedSSMonthlyAt62: effectiveAssumptions.estimatedSSMonthlyAt62 } : {}),
      },
    };

    return input;
  }, [personal, career, leaveCalendar, tspSnapshots, tspContributions, expenses, assumptions, simConfig, military, fersEstimate]);
}

/**
 * Returns the SimulationConfig if available from localStorage.
 * This is used by the full retirement simulation path (projectRetirementSimulation).
 * Returns null if the user hasn't completed the Simulation form tab.
 */
export function useSimulationConfig(): SimulationConfig | null {
  const [simConfig] = useLocalStorage(STORAGE_KEYS.SIMULATION_CONFIG, SimulationConfigSchema);
  return simConfig ?? null;
}
