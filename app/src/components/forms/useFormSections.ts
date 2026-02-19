import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  PersonalInfoSchema,
  CareerProfileSchema,
  LeaveBalanceSchema,
  ExpenseProfileSchema,
  SimulationConfigSchema,
  RetirementAssumptionsFullSchema,
  TaxProfileSchema,
  TSPAccountSnapshotSchema,
} from '@storage/index';

export interface SectionStatus {
  id: string;
  label: string;
  complete: boolean;
  required: boolean;
}

export function useFormSections(): SectionStatus[] {
  const [personal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [career] = useLocalStorage(STORAGE_KEYS.CAREER_PROFILE, CareerProfileSchema);
  const [expenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);
  const [simConfig] = useLocalStorage(STORAGE_KEYS.SIMULATION_CONFIG, SimulationConfigSchema);
  const [assumptions] = useLocalStorage(STORAGE_KEYS.ASSUMPTIONS, RetirementAssumptionsFullSchema);
  const [taxProfile] = useLocalStorage(STORAGE_KEYS.TAX_PROFILE, TaxProfileSchema);
  const [tspSnapshots] = useLocalStorage(STORAGE_KEYS.TSP_SNAPSHOTS, TSPAccountSnapshotSchema as any);

  const tspSnapshotList = Array.isArray(tspSnapshots) ? tspSnapshots : [];

  return [
    { id: 'personal', label: 'FERS Estimate', complete: personal !== null, required: true },
    { id: 'career', label: 'Career', complete: career !== null, required: false },
    { id: 'expenses', label: 'Expenses', complete: expenses !== null, required: true },
    { id: 'simulation', label: 'Simulation', complete: simConfig !== null, required: true },
    { id: 'tax', label: 'Tax Profile', complete: taxProfile !== null, required: false },
    { id: 'tsp-monitor', label: 'TSP Monitor', complete: tspSnapshotList.length > 0, required: false },
  ];
}

/** Check if Leave section is complete (used for dashboard unlock). */
export function useLeaveComplete(): boolean {
  const [leave] = useLocalStorage(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
  return leave !== null;
}
