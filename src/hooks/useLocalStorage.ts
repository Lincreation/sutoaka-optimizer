import { useState, useCallback } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => loadFromStorage(key, defaultValue));

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        saveToStorage(key, next);
        return next;
      });
    },
    [key]
  );

  return [state, setValue];
}
