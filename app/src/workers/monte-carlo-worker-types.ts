import type { SimulationConfig } from '@models/simulation';
import type { MonteCarloConfig, MonteCarloResult } from '@modules/simulation';

export interface MonteCarloWorkerRequest {
  type: 'run';
  config: SimulationConfig;
  mcConfig: MonteCarloConfig;
}

export type MonteCarloWorkerResponse =
  | { type: 'result'; result: MonteCarloResult }
  | { type: 'error'; message: string };
