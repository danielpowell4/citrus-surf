import { useState, useEffect, useCallback } from "react";
import { storage } from "@/lib/utils/localStorage";

/**
 * Custom hook for localStorage with superjson serialization
 *
 * This hook provides the same API as useLocalStorage from usehooks-ts
 * but uses superjson for proper handling of Date objects and other complex types.
 */
export function useSuperjsonStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    initializeWithValue?: boolean;
  }
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    if (options?.initializeWithValue === false) {
      return initialValue;
    }

    try {
      const item = storage.getItem<T>(key);
      return item ?? initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== "undefined") {
          storage.setItem(key, valueToStore);
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = storage.getItem<T>(key);
          if (newValue !== null) {
            setStoredValue(newValue);
          }
        } catch (error) {
          console.error(
            `Error reading localStorage key "${key}" from storage event:`,
            error
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook for storing Date objects in localStorage
 *
 * Convenience hook specifically for Date objects that ensures
 * proper serialization/deserialization.
 */
export function useDateStorage(
  key: string,
  initialValue: Date
): [Date, (value: Date | ((prev: Date) => Date)) => void] {
  return useSuperjsonStorage<Date>(key, initialValue);
}

/**
 * Hook for storing arrays with Date objects in localStorage
 *
 * Convenience hook for arrays that may contain Date objects.
 */
export function useArrayWithDatesStorage<T extends Record<string, any>>(
  key: string,
  initialValue: T[]
): [T[], (value: T[] | ((prev: T[]) => T[])) => void] {
  return useSuperjsonStorage<T[]>(key, initialValue);
}
