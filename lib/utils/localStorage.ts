import superjson from "superjson";

/**
 * localStorage wrapper with superjson serialization
 *
 * This utility provides type-safe localStorage operations that properly handle
 * complex types like Date objects, BigInt, undefined, etc. that don't serialize
 * well with JSON.stringify/parse.
 */
export const storage = {
  /**
   * Get an item from localStorage with superjson deserialization
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return defaultValue ?? null;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        return defaultValue ?? null;
      }
      return superjson.parse(stored);
    } catch (error) {
      console.error(`Error loading from localStorage (${key}):`, error);
      return defaultValue ?? null;
    }
  },

  /**
   * Set an item in localStorage with superjson serialization
   */
  setItem<T>(key: string, value: T): void {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      const serialized = superjson.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  },

  /**
   * Remove an item from localStorage
   */
  removeItem(key: string): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    localStorage.removeItem(key);
  },

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    localStorage.clear();
  },

  /**
   * Get the number of items in localStorage
   */
  get length(): number {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return 0;
    }
    return localStorage.length;
  },

  /**
   * Get a key by index
   */
  key(index: number): string | null {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return null;
    }
    return localStorage.key(index);
  },
};

/**
 * Legacy compatibility function for existing code that expects JSON.parse/stringify
 * Use this when migrating existing localStorage code
 */
export const legacyStorage = {
  getItem<T>(key: string, defaultValue?: T): T | null {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return defaultValue ?? null;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error(`Error loading from localStorage (${key}):`, error);
      return defaultValue ?? null;
    }
  },

  setItem<T>(key: string, value: T): void {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  },

  removeItem: storage.removeItem,
  clear: storage.clear,
  get length() {
    return storage.length;
  },
  key: storage.key,
};
