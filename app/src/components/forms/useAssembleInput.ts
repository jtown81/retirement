import { useMemo } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  PersonalInfoSchema,
  CareerProfileSchema,
  LeaveBalanceSchema,
  TSPBalancesSchema,
  TSPContributionEventSchema,
  ExpenseProfileSchema,
  RetirementAssumptionsFullSchema,
  MilitaryServiceSchema,
} from '@storage/index';
import { z } from 'zod';
import type { SimulationInput } from '@models/simulation';
import type { CareerProfile } from '@models/career';

const TSPContributionListSchema = z.array(TSPContributionEventSchema);
const MilitaryServiceListSchema = z.array(MilitaryServiceSchema);

/**
 * Reads all form sections from localStorage and assembles a SimulationInput.
 * Returns null if any required section is missing.
 */
export function useAssembleInput(): SimulationInput | null {
  const [personal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [career] = useLocalStorage(STORAGE_KEYS.CAREER_PROFILE, CareerProfileSchema);
  const [leave] = useLocalStorage(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
  const [tspBalances] = useLocalStorage(STORAGE_KEYS.TSP_BALANCES, TSPBalancesSchema);
  const [tspContributions] = useLocalStorage(STORAGE_KEYS.TSP_CONTRIBUTIONS, TSPContributionListSchema);
  const [expenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);
  const [assumptions] = useLocalStorage(STORAGE_KEYS.ASSUMPTIONS, RetirementAssumptionsFullSchema);
  const [military] = useLocalStorage(STORAGE_KEYS.MILITARY_SERVICE, MilitaryServiceListSchema);

  return useMemo(() => {
    // All required sections must be present
    if (!personal || !career || !leave || !tspBalances || !expenses || !assumptions) {
      return null;
    }

    // Merge personal info fields into the career profile
    // Cast needed: Zod infers grade/step as `number` but model uses GSGrade/GSStep literal unions
    const mergedCareer: CareerProfile = {
      ...(career as CareerProfile),
      scdLeave: personal.scdLeave,
      scdRetirement: personal.scdRetirement,
      paySystem: personal.paySystem,
    };

    const input: SimulationInput = {
      profile: {
        birthDate: personal.birthDate,
        career: mergedCareer,
        leaveBalance: leave,
        tspBalances,
        tspContributions: tspContributions ?? [],
        expenses,
        ...(military && military.length > 0 ? { militaryService: military } : {}),
      },
      assumptions: {
        proposedRetirementDate: assumptions.proposedRetirementDate,
        tspGrowthRate: assumptions.tspGrowthRate,
        colaRate: assumptions.colaRate,
        retirementHorizonYears: assumptions.retirementHorizonYears,
        ...(assumptions.tspWithdrawalRate != null ? { tspWithdrawalRate: assumptions.tspWithdrawalRate } : {}),
        ...(assumptions.estimatedSSMonthlyAt62 != null ? { estimatedSSMonthlyAt62: assumptions.estimatedSSMonthlyAt62 } : {}),
      },
    };

    return input;
  }, [personal, career, leave, tspBalances, tspContributions, expenses, assumptions, military]);
}
