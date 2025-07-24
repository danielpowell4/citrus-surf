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

export const makeStore = () => {
  // Load persisted state only on client side
  // During SSR, we always start with empty state to prevent hydration mismatches
  const persistedState =
    typeof window === "undefined" ? undefined : reduxPersistence.loadState();

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
      "targetShapes/addShape",
      "targetShapes/updateShape",
      "targetShapes/deleteShape",
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
      getDefaultMiddleware().concat(historyMiddleware, persistenceMiddleware),
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
