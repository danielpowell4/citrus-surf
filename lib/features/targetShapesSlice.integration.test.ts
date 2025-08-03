import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import targetShapesReducer, {
  addLookupField,
  updateLookupField,
  removeLookupField,
  refreshLookupValidation,
  updateDerivedFields,
  saveTargetShape,
} from './targetShapesSlice';
import type { TargetShape, LookupField } from '../types/target-shapes';

// Mock the reference data manager
const mockReferenceData = [
  { dept_name: 'Engineering', dept_id: 'ENG001', budget_code: 'TECH-001', manager: 'Sarah Johnson' },
  { dept_name: 'Marketing', dept_id: 'MKT001', budget_code: 'SALES-001', manager: 'Mike Chen' },
  { dept_name: 'HR', dept_id: 'HR001', budget_code: 'ADMIN-001', manager: 'Lisa Wong' },
];

vi.mock('../utils/reference-data-manager', () => ({
  referenceDataManager: {
    getReferenceDataRows: vi.fn((id: string) => {
      if (id === 'ref_departments') {
        return mockReferenceData;
      }
      return null;
    }),
  },
}));

// Mock target shapes storage
vi.mock('../utils/target-shapes-storage', () => ({
  targetShapesStorage: {
    update: vi.fn((id: string, shape: any) => ({ ...shape, id })),
    save: vi.fn((shape: any) => ({ 
      ...shape, 
      id: 'test_shape_id',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    })),
    getAll: vi.fn(() => []),
  },
}));

// Mock ID generator
vi.mock('../utils/id-generator', () => ({
  generateShapeId: vi.fn(() => 'test_shape_id'),
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      targetShapes: targetShapesReducer,
    },
  });
};

describe('Target Shapes Lookup Integration', () => {
  let store: ReturnType<typeof createTestStore>;
  
  const mockTargetShape: TargetShape = {
    id: 'test_shape',
    name: 'Test Shape',
    description: 'Test shape for lookup integration',
    version: '1.0.0',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    fields: [
      {
        id: 'field_name',
        name: 'Name',
        type: 'string',
        required: true,
      },
    ],
  };

  const mockLookupField: LookupField = {
    id: 'field_department',
    name: 'Department',
    type: 'lookup',
    required: true,
    referenceFile: 'ref_departments',
    match: {
      on: 'dept_name',
      get: 'dept_id',
      show: 'dept_name',
    },
    alsoGet: [
      { name: 'budget_code', source: 'budget_code', type: 'string' },
      { name: 'manager', source: 'manager', type: 'string' },
    ],
    smartMatching: {
      enabled: true,
      confidence: 0.85,
    },
    onMismatch: 'error',
    description: 'Department lookup field',
  };

  beforeEach(() => {
    store = createTestStore();
    // Add the test shape to the store
    store.dispatch(saveTargetShape(mockTargetShape));
  });

  describe('Adding Lookup Fields', () => {
    it('should add a lookup field to a target shape', () => {
      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: mockLookupField,
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBeNull();
      
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      expect(shape).toBeTruthy();
      expect(shape!.fields).toHaveLength(2); // Original field + lookup field
      
      const lookupField = shape!.fields.find(f => f.type === 'lookup') as LookupField;
      expect(lookupField).toBeTruthy();
      expect(lookupField.name).toBe('Department');
      expect(lookupField.referenceFile).toBe('ref_departments');
    });

    it('should generate enum validation from reference data', () => {
      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: mockLookupField,
      }));

      const state = store.getState().targetShapes;
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      const lookupField = shape!.fields.find(f => f.type === 'lookup') as LookupField;
      
      const enumValidation = lookupField.validation?.find(v => v.type === 'enum');
      expect(enumValidation).toBeTruthy();
      expect(enumValidation!.value).toEqual(['Engineering', 'Marketing', 'HR']);
    });

    it('should handle missing target shape', () => {
      store.dispatch(addLookupField({
        shapeId: 'nonexistent_shape',
        field: mockLookupField,
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBe("Target shape with ID 'nonexistent_shape' not found");
    });
  });

  describe('Updating Lookup Fields', () => {
    beforeEach(() => {
      // Add a lookup field first
      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: mockLookupField,
      }));
    });

    it('should update lookup field properties', () => {
      const updates: Partial<LookupField> = {
        description: 'Updated department lookup',
        onMismatch: 'warning',
        smartMatching: {
          enabled: false,
          confidence: 0.9,
        },
      };

      store.dispatch(updateLookupField({
        shapeId: 'test_shape_id',
        fieldId: 'field_department',
        updates,
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBeNull();
      
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      const lookupField = shape!.fields.find(f => f.id === 'field_department') as LookupField;
      
      expect(lookupField.description).toBe('Updated department lookup');
      expect(lookupField.onMismatch).toBe('warning');
      expect(lookupField.smartMatching.enabled).toBe(false);
      expect(lookupField.smartMatching.confidence).toBe(0.9);
    });

    it('should regenerate validation when reference file changes', () => {
      const updates: Partial<LookupField> = {
        referenceFile: 'ref_new_departments',
      };

      store.dispatch(updateLookupField({
        shapeId: 'test_shape_id',
        fieldId: 'field_department',
        updates,
      }));

      const state = store.getState().targetShapes;
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      const lookupField = shape!.fields.find(f => f.id === 'field_department') as LookupField;
      
      expect(lookupField.referenceFile).toBe('ref_new_departments');
      // Validation should be updated (empty since mock doesn't return data for new reference)
    });

    it('should handle updating non-lookup field', () => {
      store.dispatch(updateLookupField({
        shapeId: 'test_shape_id',
        fieldId: 'field_name', // This is a string field, not lookup
        updates: { onMismatch: 'error' },
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBe("Field 'field_name' is not a lookup field");
    });
  });

  describe('Removing Lookup Fields', () => {
    beforeEach(() => {
      // Add a lookup field first
      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: mockLookupField,
      }));
    });

    it('should remove lookup field and derived fields', () => {
      // First, update derived fields to add them
      store.dispatch(updateDerivedFields({
        shapeId: 'test_shape_id',
        lookupFieldId: 'field_department',
      }));

      // Check that derived fields were added
      let state = store.getState().targetShapes;
      let shape = state.shapes.find(s => s.id === 'test_shape_id');
      expect(shape!.fields.length).toBeGreaterThan(2); // Original + lookup + derived fields

      // Now remove the lookup field
      store.dispatch(removeLookupField({
        shapeId: 'test_shape_id',
        fieldId: 'field_department',
      }));

      state = store.getState().targetShapes;
      expect(state.error).toBeNull();
      
      shape = state.shapes.find(s => s.id === 'test_shape_id');
      expect(shape!.fields).toHaveLength(1); // Only original field should remain
      expect(shape!.fields.find(f => f.type === 'lookup')).toBeUndefined();
    });

    it('should handle removing non-existent field', () => {
      store.dispatch(removeLookupField({
        shapeId: 'test_shape_id',
        fieldId: 'nonexistent_field',
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBe("Field with ID 'nonexistent_field' not found");
    });
  });

  describe('Refreshing Lookup Validation', () => {
    beforeEach(() => {
      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: mockLookupField,
      }));
    });

    it('should refresh validation for specific lookup field', () => {
      store.dispatch(refreshLookupValidation({
        shapeId: 'test_shape_id',
        fieldId: 'field_department',
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBeNull();
      
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      const lookupField = shape!.fields.find(f => f.id === 'field_department') as LookupField;
      
      const enumValidation = lookupField.validation?.find(v => v.type === 'enum');
      expect(enumValidation).toBeTruthy();
      expect(enumValidation!.value).toEqual(['Engineering', 'Marketing', 'HR']);
    });

    it('should refresh validation for all lookup fields when no fieldId specified', () => {
      // Add another lookup field
      const secondLookupField: LookupField = {
        ...mockLookupField,
        id: 'field_department2',
        name: 'Secondary Department',
      };

      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: secondLookupField,
      }));

      store.dispatch(refreshLookupValidation({
        shapeId: 'test_shape_id',
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBeNull();
      
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      const lookupFields = shape!.fields.filter(f => f.type === 'lookup') as LookupField[];
      
      expect(lookupFields).toHaveLength(2);
      lookupFields.forEach(field => {
        const enumValidation = field.validation?.find(v => v.type === 'enum');
        expect(enumValidation).toBeTruthy();
      });
    });
  });

  describe('Updating Derived Fields', () => {
    beforeEach(() => {
      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: mockLookupField,
      }));
    });

    it('should create derived fields from lookup configuration', () => {
      store.dispatch(updateDerivedFields({
        shapeId: 'test_shape_id',
        lookupFieldId: 'field_department',
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBeNull();
      
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      
      // Should have original field + lookup field + derived fields
      expect(shape!.fields.length).toBeGreaterThan(2);
      
      const budgetCodeField = shape!.fields.find(f => f.name === 'budget_code');
      expect(budgetCodeField).toBeTruthy();
      expect(budgetCodeField!.metadata?.source).toBe('lookup:field_department');
      
      const managerField = shape!.fields.find(f => f.name === 'manager');
      expect(managerField).toBeTruthy();
      expect(managerField!.metadata?.source).toBe('lookup:field_department');
    });

    it('should replace existing derived fields', () => {
      // Create derived fields twice to test replacement
      store.dispatch(updateDerivedFields({
        shapeId: 'test_shape_id',
        lookupFieldId: 'field_department',
      }));

      let state = store.getState().targetShapes;
      let shape = state.shapes.find(s => s.id === 'test_shape_id');
      const firstCount = shape!.fields.length;

      store.dispatch(updateDerivedFields({
        shapeId: 'test_shape_id',
        lookupFieldId: 'field_department',
      }));

      state = store.getState().targetShapes;
      shape = state.shapes.find(s => s.id === 'test_shape_id');
      
      // Should not duplicate derived fields
      expect(shape!.fields.length).toBe(firstCount);
    });

    it('should handle lookup field without alsoGet configuration', () => {
      const simpleLookupField: LookupField = {
        ...mockLookupField,
        id: 'field_simple_department',
        alsoGet: undefined,
      };

      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: simpleLookupField,
      }));

      store.dispatch(updateDerivedFields({
        shapeId: 'test_shape_id',
        lookupFieldId: 'field_simple_department',
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBeNull();
      
      // Should not add any derived fields
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      expect(shape!.fields).toHaveLength(3); // Original + 2 lookup fields, no derived
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when reference data is unavailable', () => {
      const invalidLookupField: LookupField = {
        ...mockLookupField,
        referenceFile: 'ref_nonexistent',
      };

      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: invalidLookupField,
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBeNull(); // Should not error, just skip validation generation
      
      const shape = state.shapes.find(s => s.id === 'test_shape_id');
      const lookupField = shape!.fields.find(f => f.type === 'lookup') as LookupField;
      
      // Should not have enum validation since reference data is unavailable
      const enumValidation = lookupField.validation?.find(v => v.type === 'enum');
      expect(enumValidation).toBeUndefined();
    });

    it('should handle missing reference column', () => {
      const invalidLookupField: LookupField = {
        ...mockLookupField,
        match: {
          on: 'nonexistent_column',
          get: 'dept_id',
        },
      };

      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: invalidLookupField,
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBeNull(); // Should not error, just skip validation generation
    });
  });

  describe('Integration with Target Shapes Storage', () => {
    it('should persist lookup fields correctly', async () => {
      const { targetShapesStorage } = await import('../utils/target-shapes-storage');
      
      store.dispatch(addLookupField({
        shapeId: 'test_shape_id',
        field: mockLookupField,
      }));

      // Verify that storage update was called
      expect(vi.mocked(targetShapesStorage.update)).toHaveBeenCalledWith(
        'test_shape_id',
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              type: 'lookup',
              referenceFile: 'ref_departments',
            }),
          ]),
        })
      );
    });
  });
});