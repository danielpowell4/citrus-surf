import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { targetShapesStorage } from "@/lib/utils/target-shapes-storage";
import type { TargetShape } from "@/lib/types/target-shapes";

interface TargetShapesState {
  shapes: TargetShape[];
  selectedShapeId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Async thunk for saving target shape
export const saveTargetShapeAsync = createAsyncThunk(
  'targetShapes/saveAsync',
  async (shape: TargetShape) => {
    const savedShape = targetShapesStorage.save(shape);
    return savedShape;
  }
);

const initialState: TargetShapesState = {
  shapes: typeof window === "undefined" ? [] : targetShapesStorage.getAll(),
  selectedShapeId: null,
  isLoading: false,
  error: null,
};

export const targetShapesSlice = createSlice({
  name: "targetShapes",
  initialState,
  reducers: {
    // Load all shapes
    loadShapes: state => {
      state.shapes = targetShapesStorage.getAll();
      state.error = null;
    },

    // Save a new shape (synchronous version - kept for compatibility)
    saveTargetShape: (state, action: PayloadAction<TargetShape>) => {
      try {
        const savedShape = targetShapesStorage.save(action.payload);
        state.shapes.push(savedShape);
        state.error = null;
      } catch (error) {
        state.error = "Failed to save target shape";
      }
    },

    // Update an existing shape
    updateTargetShape: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<TargetShape> }>
    ) => {
      const { id, updates } = action.payload;
      const updatedShape = targetShapesStorage.update(id, updates);

      if (updatedShape) {
        const index = state.shapes.findIndex(shape => shape.id === id);
        if (index !== -1) {
          state.shapes[index] = updatedShape;
        }
        state.error = null;
      } else {
        state.error = "Failed to update target shape";
      }
    },

    // Delete a shape
    deleteTargetShape: (state, action: PayloadAction<string>) => {
      const success = targetShapesStorage.delete(action.payload);

      if (success) {
        state.shapes = state.shapes.filter(
          shape => shape.id !== action.payload
        );
        if (state.selectedShapeId === action.payload) {
          state.selectedShapeId = null;
        }
        state.error = null;
      } else {
        state.error = "Failed to delete target shape";
      }
    },

    // Select a shape
    selectTargetShape: (state, action: PayloadAction<string | null>) => {
      state.selectedShapeId = action.payload;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveTargetShapeAsync.fulfilled, (state, action) => {
        state.shapes.push(action.payload);
        state.error = null;
        state.isLoading = false;
      })
      .addCase(saveTargetShapeAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveTargetShapeAsync.rejected, (state, action) => {
        state.error = action.error.message || "Failed to save target shape";
        state.isLoading = false;
      });
  },
});

export const {
  loadShapes,
  saveTargetShape,
  updateTargetShape,
  deleteTargetShape,
  selectTargetShape,
  setLoading,
  setError,
  clearError,
} = targetShapesSlice.actions;

export default targetShapesSlice.reducer;
