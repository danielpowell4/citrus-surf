import { storage } from "./localStorage";

const PERSISTENCE_KEY = "citrus-surf-redux-state";
const DEBOUNCE_DELAY = 1000; // 1 second debounce

/**
 * Redux persistence manager with debounced writes
 *
 * This utility handles persisting the entire Redux store to localStorage
 * using superjson for proper type preservation and debounced writes to
 * prevent excessive storage operations.
 */
class ReduxPersistenceManager {
  private debounceTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize persistence by loading the saved state
   */
  loadState(): any {
    if (typeof window === "undefined") {
      return undefined;
    }

    try {
      const savedState = storage.getItem(PERSISTENCE_KEY);
      if (savedState) {
        console.log("Loaded persisted Redux state from localStorage");
        return savedState;
      }
    } catch (error) {
      console.error("Error loading persisted Redux state:", error);
    }

    return undefined;
  }

  /**
   * Load state and dispatch persistence actions
   */
  loadStateWithDispatch(dispatch: any): any {
    const savedState = this.loadState();

    if (savedState) {
      dispatch({ type: "persistence/markLoaded" });
      dispatch({
        type: "persistence/setPersistenceStatus",
        payload: {
          hasPersistedState: true,
          lastLoadedAt: Date.now(),
        },
      });
    } else {
      dispatch({
        type: "persistence/setPersistenceStatus",
        payload: {
          hasPersistedState: false,
        },
      });
    }

    return savedState;
  }

  /**
   * Save state to localStorage with debouncing
   */
  saveState(state: any): void {
    if (typeof window === "undefined") {
      return;
    }

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounced save
    this.debounceTimer = setTimeout(() => {
      try {
        storage.setItem(PERSISTENCE_KEY, state);
        console.log("Persisted Redux state to localStorage");
      } catch (error) {
        console.error("Error persisting Redux state:", error);
      }
    }, DEBOUNCE_DELAY);
  }

  /**
   * Clear persisted state
   */
  clearState(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    try {
      storage.removeItem(PERSISTENCE_KEY);
      console.log("Cleared persisted Redux state");
    } catch (error) {
      console.error("Error clearing persisted Redux state:", error);
    }
  }

  /**
   * Get persistence status
   */
  getStatus(): { isInitialized: boolean; hasPersistedState: boolean } {
    if (typeof window === "undefined") {
      return { isInitialized: false, hasPersistedState: false };
    }

    try {
      const savedState = storage.getItem(PERSISTENCE_KEY);
      return {
        isInitialized: this.isInitialized,
        hasPersistedState: savedState !== null,
      };
    } catch {
      return { isInitialized: this.isInitialized, hasPersistedState: false };
    }
  }

  /**
   * Mark as initialized
   */
  markInitialized(): void {
    this.isInitialized = true;
  }

  /**
   * Cleanup on unmount
   */
  cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

// Create singleton instance
export const reduxPersistence = new ReduxPersistenceManager();

/**
 * Redux middleware for automatic state persistence
 *
 * This middleware automatically saves the Redux state to localStorage
 * for meaningful data changes, with debounced writes to prevent
 * excessive storage operations.
 */
export const persistenceMiddleware =
  (store: any) => (next: any) => (action: any) => {
    const result = next(action);

    // Default meaningful actions for backward compatibility
    const defaultMeaningfulActions = [
      "table/setData",
      "table/importJsonData",
      "table/updateCell",
      "table/setSorting",
      "table/toggleColumnSort",
      "targetShapes/addShape",
      "targetShapes/updateShape",
      "targetShapes/deleteShape",
      "history/addAction",
      "history/clearHistory",
    ];

    if (defaultMeaningfulActions.includes(action.type)) {
      // Save state after meaningful action is processed
      reduxPersistence.saveState(store.getState());

      // Mark as saved (this will be debounced)
      if (action.type !== "persistence/markSaved") {
        store.dispatch({ type: "persistence/markSaved" });
      }
    }

    return result;
  };

/**
 * Configuration options for Redux persistence
 */
export interface PersistenceConfig {
  /** Whether to enable persistence (default: true) */
  enabled?: boolean;
  /** Storage key for the persisted state (default: "citrus-surf-redux-state") */
  key?: string;
  /** Debounce delay in milliseconds (default: 1000) */
  debounceDelay?: number;
  /** Actions to ignore for persistence (default: []) */
  ignoreActions?: string[];
  /** Actions that trigger persistence (default: meaningful data changes) */
  meaningfulActions?: string[];
  /** Whether to log persistence operations (default: false) */
  debug?: boolean;
}

/**
 * Create a configured persistence middleware
 */
export function createPersistenceMiddleware(config: PersistenceConfig = {}) {
  const {
    enabled = true,
    ignoreActions = [],
    meaningfulActions = [
      "table/setData",
      "table/importJsonData",
      "table/updateCell",
      "table/setSorting",
      "table/toggleColumnSort",
      "targetShapes/addShape",
      "targetShapes/updateShape",
      "targetShapes/deleteShape",
      "history/addAction",
      "history/clearHistory",
    ],
    debug = false,
  } = config;

  if (!enabled) {
    return () => (next: any) => (action: any) => next(action);
  }

  return (store: any) => (next: any) => (action: any) => {
    const result = next(action);

    // Skip persistence for ignored actions
    if (ignoreActions.includes(action.type)) {
      return result;
    }

    // Only save on meaningful data changes, not UI state changes
    if (meaningfulActions.includes(action.type)) {
      // Save state after meaningful action is processed
      reduxPersistence.saveState(store.getState());

      if (debug) {
        console.log(`Persisting state after action: ${action.type}`);
      }
    }

    return result;
  };
}
