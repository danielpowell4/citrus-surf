import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PersistenceState {
  isInitialized: boolean;
  hasPersistedState: boolean;
  lastSavedAt: number | null;
  lastLoadedAt: number | null;
  error: string | null;
}

const initialState: PersistenceState = {
  isInitialized: false,
  hasPersistedState: false,
  lastSavedAt: null,
  lastLoadedAt: null,
  error: null,
};

export const persistenceSlice = createSlice({
  name: "persistence",
  initialState,
  reducers: {
    // Mark persistence as initialized
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },

    // Update persistence status
    setPersistenceStatus: (
      state,
      action: PayloadAction<{
        hasPersistedState: boolean;
        lastSavedAt?: number;
        lastLoadedAt?: number;
      }>
    ) => {
      state.hasPersistedState = action.payload.hasPersistedState;
      if (action.payload.lastSavedAt) {
        state.lastSavedAt = action.payload.lastSavedAt;
      }
      if (action.payload.lastLoadedAt) {
        state.lastLoadedAt = action.payload.lastLoadedAt;
      }
    },

    // Mark state as saved
    markSaved: state => {
      state.lastSavedAt = Date.now();
    },

    // Mark state as loaded
    markLoaded: state => {
      state.lastLoadedAt = Date.now();
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: state => {
      state.error = null;
    },

    // Reset persistence state
    reset: state => {
      state.isInitialized = false;
      state.hasPersistedState = false;
      state.lastSavedAt = null;
      state.lastLoadedAt = null;
      state.error = null;
    },
  },
});

export const {
  setInitialized,
  setPersistenceStatus,
  markSaved,
  markLoaded,
  setError,
  clearError,
  reset,
} = persistenceSlice.actions;

export default persistenceSlice.reducer;
