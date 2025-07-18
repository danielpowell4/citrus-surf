import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { TargetShape, ShapeSelection } from "@/lib/types/target-shapes";
import {
  targetShapesStorage,
  templateStorage,
} from "@/lib/utils/target-shapes-storage";

interface TargetShapesState {
  // Available shapes and templates
  savedShapes: TargetShape[];
  templates: any[]; // Will be properly typed when we add template types

  // Current selection
  selectedShape: TargetShape | null;
  selectionType: "saved" | "template" | "new" | null;

  // UI state
  isLoading: boolean;
  error: string | null;
}

const initialState: TargetShapesState = {
  savedShapes: [],
  templates: [],
  selectedShape: null,
  selectionType: null,
  isLoading: false,
  error: null,
};

const targetShapesSlice = createSlice({
  name: "targetShapes",
  initialState,
  reducers: {
    // Load saved shapes from storage
    loadSavedShapes: state => {
      state.savedShapes = targetShapesStorage.getAll();
    },

    // Load templates
    loadTemplates: state => {
      state.templates = templateStorage.getAll();
    },

    // Select a saved shape
    selectSavedShape: (state, action: PayloadAction<string>) => {
      const shape = targetShapesStorage.getById(action.payload);
      if (shape) {
        state.selectedShape = shape;
        state.selectionType = "saved";
        state.error = null;
      } else {
        state.error = "Shape not found";
      }
    },

    // Select a template
    selectTemplate: (state, action: PayloadAction<string>) => {
      const template = templateStorage.getById(action.payload);
      if (template) {
        state.selectedShape = {
          ...template.shape,
          id: `tmpl_${template.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.selectionType = "template";
        state.error = null;
      } else {
        state.error = "Template not found";
      }
    },

    // Set a new shape (from visual builder)
    setNewShape: (state, action: PayloadAction<TargetShape>) => {
      state.selectedShape = action.payload;
      state.selectionType = "new";
      state.error = null;
    },

    // Save the current shape
    saveCurrentShape: state => {
      if (state.selectedShape && state.selectionType === "new") {
        const savedShape = targetShapesStorage.save({
          name: state.selectedShape.name,
          description: state.selectedShape.description,
          version: state.selectedShape.version,
          fields: state.selectedShape.fields,
          metadata: state.selectedShape.metadata,
        });

        // Update the selected shape with the saved version
        state.selectedShape = savedShape;
        state.selectionType = "saved";

        // Reload saved shapes
        state.savedShapes = targetShapesStorage.getAll();
      }
    },

    // Clear selection
    clearSelection: state => {
      state.selectedShape = null;
      state.selectionType = null;
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  loadSavedShapes,
  loadTemplates,
  selectSavedShape,
  selectTemplate,
  setNewShape,
  saveCurrentShape,
  clearSelection,
  setLoading,
  setError,
} = targetShapesSlice.actions;

export default targetShapesSlice.reducer;
