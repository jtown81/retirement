import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  PersonalInfoSchema,
  CareerProfileSchema,
  LeaveBalanceSchema,
  TSPBalancesSchema,
  ExpenseProfileSchema,
  RetirementAssumptionsFullSchema,
  MilitaryServiceSchema,
} from '@storage/index';
import { z } from 'zod';

export interface SectionStatus {
  id: string;
  label: string;
  complete: boolean;
  required: boolean;
}

const MilitaryServiceListSchema = z.array(MilitaryServiceSchema);

export function useFormSections(): SectionStatus[] {
  const [personal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [career] = useLocalStorage(STORAGE_KEYS.CAREER_PROFILE, CareerProfileSchema);
  const [leave] = useLocalStorage(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
  const [tsp] = useLocalStorage(STORAGE_KEYS.TSP_BALANCES, TSPBalancesSchema);
  const [expenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);
  const [assumptions] = useLocalStorage(STORAGE_KEYS.ASSUMPTIONS, RetirementAssumptionsFullSchema);
  const [military] = useLocalStorage(STORAGE_KEYS.MILITARY_SERVICE, MilitaryServiceListSchema);

  return [
    { id: 'personal', label: 'Personal', complete: personal !== null, required: true },
    { id: 'career', label: 'Career', complete: career !== null, required: true },
    { id: 'leave', label: 'Leave', complete: leave !== null, required: true },
    { id: 'tsp', label: 'TSP', complete: tsp !== null, required: true },
    { id: 'military', label: 'Military', complete: military !== null, required: false },
    { id: 'expenses', label: 'Expenses', complete: expenses !== null, required: true },
    { id: 'assumptions', label: 'Assumptions', complete: assumptions !== null, required: true },
  ];
}
