import { useState, useCallback } from 'react';
import { z } from 'zod';
import { save, load } from '@storage/index';

const isBrowser = typeof window !== 'undefined';

/**
 * React hook wrapping the typed localStorage persistence layer.
 * Reads on mount, writes on set. SSR-safe (returns null on server).
 */
export function useLocalStorage<T>(
  key: string,
  schema: z.ZodType<T>,
): [T | null, (value: T) => void, () => void] {
  const [stored, setStored] = useState<T | null>(() =>
    isBrowser ? load(key, schema) : null,
  );

  const set = useCallback(
    (value: T) => {
      if (isBrowser) save(key, value);
      setStored(value);
    },
    [key],
  );

  const remove = useCallback(() => {
    if (isBrowser) localStorage.removeItem(key);
    setStored(null);
  }, [key]);

  return [stored, set, remove];
}
