import { useState, useCallback } from 'react';
import { z } from 'zod';
import { save, load } from '@storage/index';

/**
 * React hook wrapping the typed localStorage persistence layer.
 * Reads on mount, writes on set.
 */
export function useLocalStorage<T>(
  key: string,
  schema: z.ZodType<T>,
): [T | null, (value: T) => void, () => void] {
  const [stored, setStored] = useState<T | null>(() => load(key, schema));

  const set = useCallback(
    (value: T) => {
      save(key, value);
      setStored(value);
    },
    [key],
  );

  const remove = useCallback(() => {
    localStorage.removeItem(key);
    setStored(null);
  }, [key]);

  return [stored, set, remove];
}
