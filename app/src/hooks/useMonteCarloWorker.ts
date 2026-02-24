import { useState, useEffect, useMemo } from 'react';
import type { SimulationConfig } from '@fedplan/models';
import type { MonteCarloResult } from '@fedplan/simulation';
import type { MonteCarloWorkerRequest, MonteCarloWorkerResponse } from '@workers/monte-carlo-worker-types';

const isBrowser = typeof window !== 'undefined';

export function useMonteCarloWorker(
  simConfig: SimulationConfig | null,
): { result: MonteCarloResult | null; isPending: boolean } {
  // Serialize to string to stabilize useEffect dependency
  const configKey = useMemo(() => (simConfig ? JSON.stringify(simConfig) : null), [simConfig]);

  const [state, setState] = useState<{ result: MonteCarloResult | null; isPending: boolean }>(
    () => ({ result: null, isPending: isBrowser && simConfig !== null }),
  );

  useEffect(() => {
    if (!isBrowser || !simConfig) {
      setState({ result: null, isPending: false });
      return;
    }
    setState({ result: null, isPending: true });

    const worker = new Worker(
      new URL('../workers/monte-carlo.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (event: MessageEvent<MonteCarloWorkerResponse>) => {
      if (event.data.type === 'result') {
        setState({ result: event.data.result, isPending: false });
      } else {
        console.error('[MonteCarloWorker]', event.data.message);
        setState({ result: null, isPending: false });
      }
      worker.terminate();
    };

    worker.onerror = (err) => {
      console.error('[MonteCarloWorker] Uncaught:', err);
      setState({ result: null, isPending: false });
      worker.terminate();
    };

    worker.postMessage({ type: 'run', config: simConfig, mcConfig: { iterations: 1000 } } satisfies MonteCarloWorkerRequest);

    return () => { worker.terminate(); };
  }, [configKey]); // stable string dep — not simConfig object reference

  return state;
}
