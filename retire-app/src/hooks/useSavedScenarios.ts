import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS, SimScenariosListSchema } from '@storage/index';
import type { SimScenario } from '@storage/index';
import type { SimulationConfig } from '@models/simulation';

export function useSavedScenarios() {
  const [list, setList] = useLocalStorage(STORAGE_KEYS.SCENARIOS, SimScenariosListSchema);
  const scenarios = list ?? [];

  const saveScenario = (label: string, config: SimulationConfig) => {
    const next: SimScenario = {
      id: crypto.randomUUID(),
      label,
      savedAt: new Date().toISOString(),
      config,
    };
    setList([...scenarios, next]);
  };

  const deleteScenario = (id: string) => {
    setList(scenarios.filter((s) => s.id !== id));
  };

  return { scenarios, saveScenario, deleteScenario };
}
