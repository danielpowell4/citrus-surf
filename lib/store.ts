import { configureStore } from "@reduxjs/toolkit";
import tableReducer from "./features/tableSlice";
import historyReducer from "./features/historySlice";
import targetShapesReducer from "./features/targetShapesSlice";
import persistenceReducer from "./features/persistenceSlice";
import {
  reduxPersistence,
  createPersistenceMiddleware,
} from "./utils/redux-persistence";

/**
 * History tracking middleware
 *
 * This middleware automatically captures meaningful user actions and stores them
 * in the history for time-travel functionality. It filters out internal/automatic
 * actions to keep the history clean and focused on user interactions.
 *
 * To add new actions to history tracking:
 * 1. Add the action type to the meaningfulActions array below
 * 2. Optionally add action summaries in lib/utils/time-travel.ts
 * 3. See docs/history-system.md for complete integration guide
 */
const historyMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);

  // Skip history actions to prevent infinite loops
  if (action.type.startsWith("history/")) {
    return result;
  }

  // Only track meaningful user actions, skip internal/automatic actions
  // Add new action types here to include them in history tracking
  const meaningfulActions = [
    "table/setData", // Data loading/resetting
    "table/applyTemplate", // Template application
    "table/importJsonData", // JSON data import
    "table/updateCell", // Cell editing
    "table/setSorting", // Column sorting
    "table/toggleColumnSort",
    "table/setColumnFilters", // Column filtering
    "table/setColumnVisibility", // Column visibility
    "table/setGlobalFilter", // Global search
    "table/restoreFromHistory", // History restoration
  ];

  // Skip actions that are not meaningful user interactions
  if (!meaningfulActions.includes(action.type)) {
    return result;
  }

  // Add timestamp to action for history tracking
  const actionWithTimestamp = {
    ...action,
    timestamp: Date.now(),
    id: Math.random().toString(36).substr(2, 9),
    stateSnapshot: store.getState().table, // Store current table state
  };

  // Dispatch to history slice
  store.dispatch({ type: "history/addAction", payload: actionWithTimestamp });

  // Also store in window for backward compatibility (only in browser)
  if (typeof window !== "undefined") {
    if (!window.__REDUX_HISTORY__) {
      window.__REDUX_HISTORY__ = [];
    }
    window.__REDUX_HISTORY__.push(actionWithTimestamp);
  }

  return result;
};

// Global action type for restoring from storage
const RESTORE_FROM_STORAGE = "global/RESTORE_FROM_STORAGE";

// Action creator for restoring from storage
export const restoreFromStorage = (persistedState: any) => ({
  type: RESTORE_FROM_STORAGE,
  payload: persistedState,
});

// Middleware to handle global state restoration
const stateRestorationMiddleware =
  (store: any) => (next: any) => (action: any) => {
    if (action.type === RESTORE_FROM_STORAGE) {
      const { payload } = action;

      // Restore table data if it exists
      if (payload?.table?.data?.length > 0) {
        store.dispatch({ type: "table/setData", payload: payload.table.data });
      }

      // Restore other table state (sorting, filters, etc.)
      if (payload?.table) {
        const tableState = payload.table;

        // Restore sorting
        if (tableState.sorting) {
          store.dispatch({
            type: "table/setSorting",
            payload: tableState.sorting,
          });
        }

        // Restore column filters
        if (tableState.columnFilters) {
          store.dispatch({
            type: "table/setColumnFilters",
            payload: tableState.columnFilters,
          });
        }

        // Restore column visibility
        if (tableState.columnVisibility) {
          store.dispatch({
            type: "table/setColumnVisibility",
            payload: tableState.columnVisibility,
          });
        }

        // Restore global filter
        if (tableState.globalFilter) {
          store.dispatch({
            type: "table/setGlobalFilter",
            payload: tableState.globalFilter,
          });
        }

        // Restore pagination
        if (tableState.pagination) {
          store.dispatch({
            type: "table/setPagination",
            payload: tableState.pagination,
          });
        }
      }

      // Load target shapes if they exist
      if (payload?.targetShapes?.shapes?.length > 0) {
        store.dispatch({ type: "targetShapes/loadShapes" });
      }

      // Update persistence state
      store.dispatch({
        type: "persistence/setPersistenceStatus",
        payload: {
          hasPersistedState: true,
          lastLoadedAt: Date.now(),
        },
      });

      return next(action);
    }

    return next(action);
  };

export const makeStore = () => {
  // Always start with empty state during SSR and initial client render
  // The persistence will be handled after hydration via useHydration hook
  const persistedState = undefined;

  // Create persistence middleware with configuration
  const persistenceMiddleware = createPersistenceMiddleware({
    enabled: true,
    debounceDelay: 1000,
    meaningfulActions: [
      // Only persist meaningful data changes
      "table/setData",
      "table/importJsonData",
      "table/updateCell",
      "table/setSorting",
      "table/toggleColumnSort",
      "targetShapes/saveTargetShape",
      "targetShapes/updateTargetShape",
      "targetShapes/deleteTargetShape",
    ],
    debug: process.env.NODE_ENV === "development",
  });

  const store = configureStore({
    reducer: {
      table: tableReducer,
      history: historyReducer,
      targetShapes: targetShapesReducer,
      persistence: persistenceReducer,
    },
    preloadedState: persistedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(
        historyMiddleware,
        persistenceMiddleware,
        stateRestorationMiddleware
      ),
  });

  // Mark persistence as initialized only on client side
  if (typeof window !== "undefined") {
    reduxPersistence.markInitialized();
  }

  return store;
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

// Extend Window interface for history tracking
declare global {
  interface Window {
    __REDUX_HISTORY__?: Array<{
      type: string;
      payload?: any;
      timestamp: number;
      id: string;
    }>;
  }
}
