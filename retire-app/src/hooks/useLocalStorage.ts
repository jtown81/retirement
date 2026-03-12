import { useState, useCallback, useEffect, useRef } from 'react';
import { z } from 'zod';
import { save, load } from '@storage/index';

const isBrowser = typeof window !== 'undefined';

/**
 * Custom event name dispatched (on window) whenever any useLocalStorage
 * instance writes or removes a key. All other instances subscribed to the
 * same key re-read from localStorage so the UI stays consistent within the
 * same tab without requiring a page refresh.
 */
const STORAGE_CHANGE_EVENT = 'retire:storage-change';

/**
 * React hook wrapping the typed localStorage persistence layer.
 * Reads on mount, writes on set. SSR-safe (returns null on server).
 *
 * Cross-instance reactive: all hooks watching the same key update
 * automatically when any instance writes or removes the key.
 */
export function useLocalStorage<T>(
  key: string,
  schema: z.ZodType<T>,
): [T | null, (value: T) => void, () => void] {
  const schemaRef = useRef(schema);

  const [stored, setStored] = useState<T | null>(() =>
    isBrowser ? load(key, schemaRef.current) : null,
  );

  // Re-read when another instance writes to the same key in this tab
  useEffect(() => {
    if (!isBrowser) return;
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ key: string }>).detail?.key === key) {
        setStored(load(key, schemaRef.current));
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [key]);

  const set = useCallback(
    (value: T) => {
      if (isBrowser) {
        save(key, value);
        window.dispatchEvent(
          new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key } }),
        );
      }
      setStored(value);
    },
    [key],
  );

  const remove = useCallback(() => {
    if (isBrowser) {
      localStorage.removeItem(key);
      window.dispatchEvent(
        new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key } }),
      );
    }
    setStored(null);
  }, [key]);

  return [stored, set, remove];
}
