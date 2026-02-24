import type { SimulationConfig } from '@fedplan/models';
import type { MonteCarloConfig, MonteCarloResult } from '@fedplan/simulation';

export interface MonteCarloWorkerRequest {
  type: 'run';
  config: SimulationConfig;
  mcConfig: MonteCarloConfig;
}

export type MonteCarloWorkerResponse =
  | { type: 'result'; result: MonteCarloResult }
  | { type: 'error'; message: string };
