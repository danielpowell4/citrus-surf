import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

export interface HistoryAction {
  type: string;
  payload?: any;
  timestamp: number;
  id: string;
  stateSnapshot?: any; // Store state at this point
}

interface HistoryState {
  actions: HistoryAction[];
  currentIndex: number;
  isTimeTraveling: boolean;
  maxHistorySize: number;
}

const initialState: HistoryState = {
  actions: [],
  currentIndex: -1,
  isTimeTraveling: false,
  maxHistorySize: 100, // Limit history size to prevent memory issues
};

export const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    addAction: (state, action: PayloadAction<HistoryAction>) => {
      // If we're time traveling, remove all actions after current index
      if (state.isTimeTraveling) {
        state.actions = state.actions.slice(0, state.currentIndex + 1);
        state.isTimeTraveling = false;
      }

      // Add new action
      state.actions.push(action.payload);
      state.currentIndex = state.actions.length - 1;

      // Limit history size
      if (state.actions.length > state.maxHistorySize) {
        state.actions = state.actions.slice(-state.maxHistorySize);
        state.currentIndex = state.actions.length - 1;
      }
    },

    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
      state.isTimeTraveling = true;
    },

    clearHistory: state => {
      state.actions = [];
      state.currentIndex = -1;
      state.isTimeTraveling = false;
    },

    setMaxHistorySize: (state, action: PayloadAction<number>) => {
      state.maxHistorySize = action.payload;
    },

    importHistory: (state, action: PayloadAction<HistoryAction[]>) => {
      state.actions = action.payload;
      state.currentIndex = action.payload.length - 1;
      state.isTimeTraveling = false;
    },
  },
});

export const {
  addAction,
  setCurrentIndex,
  clearHistory,
  setMaxHistorySize,
  importHistory,
} = historySlice.actions;

// Selectors
export const selectHistory = (state: RootState) => state.history.actions;
export const selectCurrentIndex = (state: RootState) =>
  state.history.currentIndex;
export const selectIsTimeTraveling = (state: RootState) =>
  state.history.isTimeTraveling;
export const selectCurrentAction = (state: RootState) => {
  const { actions, currentIndex } = state.history;
  return currentIndex >= 0 ? actions[currentIndex] : null;
};

export default historySlice.reducer;
