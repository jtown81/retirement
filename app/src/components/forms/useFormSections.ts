import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  PersonalInfoSchema,
  CareerProfileSchema,
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
  tier: 'basic' | 'premium';
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
    { id: 'personal', label: 'FERS Estimate', complete: personal !== null, required: true, tier: 'basic' },
    { id: 'career', label: 'Career', complete: career !== null, required: false, tier: 'basic' },
    { id: 'expenses', label: 'Expenses', complete: expenses !== null, required: true, tier: 'basic' },
    { id: 'simulation', label: 'Simulation', complete: simConfig !== null, required: true, tier: 'premium' },
    { id: 'tax', label: 'Tax Profile', complete: taxProfile !== null, required: false, tier: 'premium' },
    { id: 'tsp-monitor', label: 'TSP Monitor', complete: tspSnapshotList.length > 0, required: false, tier: 'basic' },
  ];
}
