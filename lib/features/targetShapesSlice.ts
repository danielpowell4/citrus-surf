import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { targetShapesStorage } from "@/lib/utils/target-shapes-storage";
import type { TargetShape, TargetField, LookupField } from "@/lib/types/target-shapes";
import { referenceDataManager } from "@/lib/utils/reference-data-manager";
import { generateLookupValidation } from "@/lib/utils/lookup-validation";
import { generateSmartColumnName, generateSmartDescription } from "@/lib/utils/smart-column-naming";

// Note: generateLookupValidation function moved to lookup-validation.ts for better organization

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
      } catch {
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

    // Lookup Field Management Actions
    
    // Add a lookup field to a target shape
    addLookupField: (
      state,
      action: PayloadAction<{ shapeId: string; field: LookupField }>
    ) => {
      const { shapeId, field } = action.payload;
      try {
        const shape = state.shapes.find(s => s.id === shapeId);
        if (!shape) {
          state.error = `Target shape with ID '${shapeId}' not found`;
          return;
        }

        // Generate enum validation from reference data
        const validationRules = generateLookupValidation(field);
        const fieldWithValidation: LookupField = {
          ...field,
          validation: [...(field.validation || []), ...validationRules],
        };

        // Add field to shape
        const updatedShape = {
          ...shape,
          fields: [...shape.fields, fieldWithValidation],
          updatedAt: new Date().toISOString(),
        };

        // Save to storage
        const savedShape = targetShapesStorage.update(shapeId, updatedShape);
        if (savedShape) {
          const index = state.shapes.findIndex(s => s.id === shapeId);
          if (index !== -1) {
            state.shapes[index] = savedShape;
          }
          state.error = null;
        } else {
          state.error = "Failed to add lookup field";
        }
      } catch (error) {
        state.error = `Failed to add lookup field: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },

    // Update a lookup field
    updateLookupField: (
      state,
      action: PayloadAction<{ 
        shapeId: string; 
        fieldId: string; 
        updates: Partial<LookupField> 
      }>
    ) => {
      const { shapeId, fieldId, updates } = action.payload;
      try {
        const shape = state.shapes.find(s => s.id === shapeId);
        if (!shape) {
          state.error = `Target shape with ID '${shapeId}' not found`;
          return;
        }

        const fieldIndex = shape.fields.findIndex(f => f.id === fieldId);
        if (fieldIndex === -1) {
          state.error = `Field with ID '${fieldId}' not found`;
          return;
        }

        const existingField = shape.fields[fieldIndex];
        if (existingField.type !== 'lookup') {
          state.error = `Field '${fieldId}' is not a lookup field`;
          return;
        }

        // Update the field
        const updatedField: LookupField = {
          ...existingField as LookupField,
          ...updates,
        };

        // Regenerate validation if reference data related properties changed
        if (updates.referenceFile || updates.match) {
          const validationRules = generateLookupValidation(updatedField);
          updatedField.validation = [
            ...(updatedField.validation?.filter(rule => rule.type !== 'enum') || []),
            ...validationRules,
          ];
        }

        // Update shape
        const updatedFields = [...shape.fields];
        updatedFields[fieldIndex] = updatedField;

        const updatedShape = {
          ...shape,
          fields: updatedFields,
          updatedAt: new Date().toISOString(),
        };

        // Save to storage
        const savedShape = targetShapesStorage.update(shapeId, updatedShape);
        if (savedShape) {
          const index = state.shapes.findIndex(s => s.id === shapeId);
          if (index !== -1) {
            state.shapes[index] = savedShape;
          }
          state.error = null;
        } else {
          state.error = "Failed to update lookup field";
        }
      } catch (error) {
        state.error = `Failed to update lookup field: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },

    // Remove a lookup field
    removeLookupField: (
      state,
      action: PayloadAction<{ shapeId: string; fieldId: string }>
    ) => {
      const { shapeId, fieldId } = action.payload;
      try {
        const shape = state.shapes.find(s => s.id === shapeId);
        if (!shape) {
          state.error = `Target shape with ID '${shapeId}' not found`;
          return;
        }

        const fieldToRemove = shape.fields.find(f => f.id === fieldId);
        if (!fieldToRemove) {
          state.error = `Field with ID '${fieldId}' not found`;
          return;
        }

        // Remove field and any derived fields if it's a lookup field
        let updatedFields = shape.fields.filter(f => f.id !== fieldId);

        if (fieldToRemove.type === 'lookup') {
          const lookupField = fieldToRemove as LookupField;
          // Remove derived fields created by this lookup
          if (lookupField.alsoGet) {
            const derivedFieldNames = lookupField.alsoGet.map(d => d.name);
            updatedFields = updatedFields.filter(f => !derivedFieldNames.includes(f.name));
          }
        }

        const updatedShape = {
          ...shape,
          fields: updatedFields,
          updatedAt: new Date().toISOString(),
        };

        // Save to storage
        const savedShape = targetShapesStorage.update(shapeId, updatedShape);
        if (savedShape) {
          const index = state.shapes.findIndex(s => s.id === shapeId);
          if (index !== -1) {
            state.shapes[index] = savedShape;
          }
          state.error = null;
        } else {
          state.error = "Failed to remove lookup field";
        }
      } catch (error) {
        state.error = `Failed to remove lookup field: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },

    // Refresh validation for lookup fields when reference data changes
    refreshLookupValidation: (
      state,
      action: PayloadAction<{ shapeId: string; fieldId?: string }>
    ) => {
      const { shapeId, fieldId } = action.payload;
      try {
        const shape = state.shapes.find(s => s.id === shapeId);
        if (!shape) {
          state.error = `Target shape with ID '${shapeId}' not found`;
          return;
        }

        let fieldsToUpdate = shape.fields.filter(f => f.type === 'lookup') as LookupField[];
        
        // If fieldId specified, only update that field
        if (fieldId) {
          fieldsToUpdate = fieldsToUpdate.filter(f => f.id === fieldId);
        }

        if (fieldsToUpdate.length === 0) {
          return; // No lookup fields to update
        }

        let hasUpdates = false;
        const updatedFields = shape.fields.map(field => {
          if (field.type === 'lookup' && fieldsToUpdate.some(f => f.id === field.id)) {
            const lookupField = field as LookupField;
            const newValidation = generateLookupValidation(lookupField);
            
            // Replace enum validation rules
            const updatedValidation = [
              ...(lookupField.validation?.filter(rule => rule.type !== 'enum') || []),
              ...newValidation,
            ];

            hasUpdates = true;
            return {
              ...lookupField,
              validation: updatedValidation,
            };
          }
          return field;
        });

        if (hasUpdates) {
          const updatedShape = {
            ...shape,
            fields: updatedFields,
            updatedAt: new Date().toISOString(),
          };

          // Save to storage
          const savedShape = targetShapesStorage.update(shapeId, updatedShape);
          if (savedShape) {
            const index = state.shapes.findIndex(s => s.id === shapeId);
            if (index !== -1) {
              state.shapes[index] = savedShape;
            }
            state.error = null;
          } else {
            state.error = "Failed to refresh lookup validation";
          }
        }
      } catch (error) {
        state.error = `Failed to refresh lookup validation: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },

    // Update derived fields when lookup source data changes
    updateDerivedFields: (
      state,
      action: PayloadAction<{ shapeId: string; lookupFieldId: string }>
    ) => {
      const { shapeId, lookupFieldId } = action.payload;
      try {
        const shape = state.shapes.find(s => s.id === shapeId);
        if (!shape) {
          state.error = `Target shape with ID '${shapeId}' not found`;
          return;
        }

        const lookupField = shape.fields.find(f => f.id === lookupFieldId && f.type === 'lookup') as LookupField;
        if (!lookupField) {
          state.error = `Lookup field with ID '${lookupFieldId}' not found`;
          return;
        }

        // Generate/update derived fields
        if (lookupField.alsoGet && lookupField.alsoGet.length > 0) {
          const referenceData = referenceDataManager.getReferenceDataRows(lookupField.referenceFile);
          if (referenceData && referenceData.length > 0) {
            const sampleRow = referenceData[0];
            
            // Remove existing derived fields
            const updatedFields = shape.fields.filter(f => 
              !lookupField.alsoGet?.some(d => d.name === f.name)
            );

            // Add new derived fields with smart naming
            lookupField.alsoGet.forEach(derivedField => {
              if (sampleRow.hasOwnProperty(derivedField.source)) {
                // Generate smart column name if not explicitly set
                const smartName = derivedField.name || generateSmartColumnName(
                  lookupField.name,
                  derivedField,
                  derivedField.source
                );
                
                // Generate smart description
                const smartDescription = generateSmartDescription(
                  lookupField.name,
                  derivedField,
                  lookupField.referenceFile
                );
                
                const newField: TargetField = {
                  id: `${lookupFieldId}_${smartName}`,
                  name: smartName,
                  type: derivedField.type || 'string',
                  required: false,
                  description: smartDescription,
                  metadata: {
                    source: `lookup:${lookupFieldId}`,
                    dataRule: `derived from ${lookupField.referenceFile}`,
                    sourceField: derivedField.source, // Track original source field
                  },
                };
                updatedFields.push(newField);
              }
            });

            const updatedShape = {
              ...shape,
              fields: updatedFields,
              updatedAt: new Date().toISOString(),
            };

            // Save to storage
            const savedShape = targetShapesStorage.update(shapeId, updatedShape);
            if (savedShape) {
              const index = state.shapes.findIndex(s => s.id === shapeId);
              if (index !== -1) {
                state.shapes[index] = savedShape;
              }
              state.error = null;
            } else {
              state.error = "Failed to update derived fields";
            }
          }
        }
      } catch (error) {
        state.error = `Failed to update derived fields: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
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
  addLookupField,
  updateLookupField,
  removeLookupField,
  refreshLookupValidation,
  updateDerivedFields,
} = targetShapesSlice.actions;

export default targetShapesSlice.reducer;
