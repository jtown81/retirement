/// <reference lib="webworker" />
import type { MonteCarloWorkerRequest, MonteCarloWorkerResponse } from './monte-carlo-worker-types';
import { runMonteCarlo } from '../modules/simulation/monte-carlo';

self.onmessage = (event: MessageEvent<MonteCarloWorkerRequest>) => {
  if (event.data.type !== 'run') return;
  try {
    const result = runMonteCarlo(event.data.config, event.data.mcConfig);
    self.postMessage({ type: 'result', result } satisfies MonteCarloWorkerResponse);
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies MonteCarloWorkerResponse);
  }
};
