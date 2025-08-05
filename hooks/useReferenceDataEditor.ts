import { useState, useCallback, useEffect } from 'react';
import { referenceDataManager } from '@/lib/utils/reference-data-manager';
import type { ReferenceDataInfo } from '@/lib/types/reference-data-types';

export interface UseReferenceDataEditorOptions {
  referenceId: string;
  onSave?: (referenceId: string, data: Record<string, unknown>[]) => void;
  onError?: (error: string) => void;
  autoSave?: boolean;
  validateOnChange?: boolean;
}

export interface ReferenceDataEditorState {
  data: Record<string, unknown>[];
  originalData: Record<string, unknown>[];
  referenceInfo: ReferenceDataInfo | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  validationErrors: ValidationError[];
  error: string | null;
}

export interface ValidationError {
  rowIndex: number;
  columnId: string;
  message: string;
  type: 'required' | 'duplicate' | 'invalid';
}

export interface ReferenceDataEditorActions {
  loadData: () => Promise<void>;
  updateCell: (rowIndex: number, columnId: string, value: unknown) => void;
  addRow: (data?: Record<string, unknown>) => void;
  deleteRow: (rowIndex: number) => void;
  duplicateRow: (rowIndex: number) => void;
  moveRow: (fromIndex: number, toIndex: number) => void;
  save: () => Promise<boolean>;
  reset: () => void;
  validate: () => ValidationError[];
  exportData: (format: 'csv' | 'json') => string;
  importData: (data: Record<string, unknown>[]) => void;
}

export function useReferenceDataEditor({
  referenceId,
  onSave,
  onError,
  autoSave = false,
  validateOnChange = true,
}: UseReferenceDataEditorOptions): [ReferenceDataEditorState, ReferenceDataEditorActions] {
  const [state, setState] = useState<ReferenceDataEditorState>({
    data: [],
    originalData: [],
    referenceInfo: null,
    isLoading: false,
    isSaving: false,
    hasUnsavedChanges: false,
    validationErrors: [],
    error: null,
  });

  // Validation function
  const validateData = useCallback((data: Record<string, unknown>[], referenceInfo: ReferenceDataInfo | null): ValidationError[] => {
    if (!referenceInfo) return [];

    const errors: ValidationError[] = [];
    const seenKeys = new Map<string, number[]>();

    data.forEach((row, rowIndex) => {
      referenceInfo.columns.forEach(columnId => {
        const value = row[columnId];
        const stringValue = value != null ? String(value).trim() : '';

        // Check for required fields (first column is typically the key)
        if (columnId === referenceInfo.columns[0] && !stringValue) {
          errors.push({
            rowIndex,
            columnId,
            message: 'Key field is required',
            type: 'required',
          });
        }

        // Check for duplicates in key column
        if (columnId === referenceInfo.columns[0] && stringValue) {
          if (!seenKeys.has(stringValue)) {
            seenKeys.set(stringValue, []);
          }
          seenKeys.get(stringValue)!.push(rowIndex);
        }

        // Check for empty values in populated rows
        if (!stringValue && hasOtherValues(row, columnId, referenceInfo.columns)) {
          errors.push({
            rowIndex,
            columnId,
            message: 'Value required when other fields are populated',
            type: 'required',
          });
        }
      });
    });

    // Add duplicate errors
    seenKeys.forEach((indices, key) => {
      if (indices.length > 1) {
        indices.forEach(rowIndex => {
          errors.push({
            rowIndex,
            columnId: referenceInfo.columns[0],
            message: `Duplicate key "${key}"`,
            type: 'duplicate',
          });
        });
      }
    });

    return errors;
  }, []);

  // Helper function to check if row has other values
  const hasOtherValues = (row: Record<string, unknown>, excludeColumn: string, columns: string[]): boolean => {
    return columns.some(col => 
      col !== excludeColumn && 
      row[col] != null && 
      String(row[col]).trim() !== ''
    );
  };

  // Load reference data
  const loadData = useCallback(async () => {
    if (!referenceId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const referenceData = referenceDataManager.getReferenceData(referenceId);
      if (!referenceData) {
        throw new Error('Reference data not found');
      }

      const data = referenceDataManager.getReferenceDataRows(referenceId) || [];
      const errors = validateOnChange ? validateData(data, referenceData.info) : [];

      setState(prev => ({
        ...prev,
        data: [...data],
        originalData: [...data],
        referenceInfo: referenceData.info,
        validationErrors: errors,
        hasUnsavedChanges: false,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reference data';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      onError?.(errorMessage);
    }
  }, [referenceId, validateOnChange, validateData, onError]);

  // Update cell value
  const updateCell = useCallback((rowIndex: number, columnId: string, value: unknown) => {
    setState(prev => {
      const newData = [...prev.data];
      newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
      
      const errors = validateOnChange ? validateData(newData, prev.referenceInfo) : [];
      const hasChanges = JSON.stringify(newData) !== JSON.stringify(prev.originalData);

      return {
        ...prev,
        data: newData,
        validationErrors: errors,
        hasUnsavedChanges: hasChanges,
      };
    });
  }, [validateOnChange, validateData]);

  // Add new row
  const addRow = useCallback((rowData?: Record<string, unknown>) => {
    setState(prev => {
      const newRow = rowData || {};
      // Initialize with empty values for all columns
      prev.referenceInfo?.columns.forEach(col => {
        if (!(col in newRow)) {
          newRow[col] = '';
        }
      });

      const newData = [...prev.data, newRow];
      const errors = validateOnChange ? validateData(newData, prev.referenceInfo) : [];

      return {
        ...prev,
        data: newData,
        validationErrors: errors,
        hasUnsavedChanges: true,
      };
    });
  }, [validateOnChange, validateData]);

  // Delete row
  const deleteRow = useCallback((rowIndex: number) => {
    setState(prev => {
      const newData = prev.data.filter((_, index) => index !== rowIndex);
      const errors = validateOnChange ? validateData(newData, prev.referenceInfo) : [];
      const hasChanges = JSON.stringify(newData) !== JSON.stringify(prev.originalData);

      return {
        ...prev,
        data: newData,
        validationErrors: errors,
        hasUnsavedChanges: hasChanges,
      };
    });
  }, [validateOnChange, validateData]);

  // Duplicate row
  const duplicateRow = useCallback((rowIndex: number) => {
    setState(prev => {
      const rowToDuplicate = { ...prev.data[rowIndex] };
      const newData = [...prev.data];
      newData.splice(rowIndex + 1, 0, rowToDuplicate);
      
      const errors = validateOnChange ? validateData(newData, prev.referenceInfo) : [];

      return {
        ...prev,
        data: newData,
        validationErrors: errors,
        hasUnsavedChanges: true,
      };
    });
  }, [validateOnChange, validateData]);

  // Move row
  const moveRow = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newData = [...prev.data];
      const [movedRow] = newData.splice(fromIndex, 1);
      newData.splice(toIndex, 0, movedRow);

      return {
        ...prev,
        data: newData,
        hasUnsavedChanges: true,
      };
    });
  }, []);

  // Save data
  const save = useCallback(async (): Promise<boolean> => {
    if (!referenceId || !state.referenceInfo) return false;

    const errors = validateData(state.data, state.referenceInfo);
    if (errors.length > 0) {
      setState(prev => ({ ...prev, validationErrors: errors }));
      return false;
    }

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      referenceDataManager.updateReferenceData(referenceId, state.data);
      
      setState(prev => ({
        ...prev,
        originalData: [...prev.data],
        hasUnsavedChanges: false,
        isSaving: false,
        validationErrors: [],
      }));

      onSave?.(referenceId, state.data);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save reference data';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isSaving: false,
      }));
      onError?.(errorMessage);
      return false;
    }
  }, [referenceId, state.data, state.referenceInfo, validateData, onSave, onError]);

  // Reset data
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: [...prev.originalData],
      hasUnsavedChanges: false,
      validationErrors: validateOnChange ? validateData(prev.originalData, prev.referenceInfo) : [],
    }));
  }, [validateOnChange, validateData]);

  // Validate current data
  const validate = useCallback((): ValidationError[] => {
    const errors = validateData(state.data, state.referenceInfo);
    setState(prev => ({ ...prev, validationErrors: errors }));
    return errors;
  }, [state.data, state.referenceInfo, validateData]);

  // Export data
  const exportData = useCallback((format: 'csv' | 'json'): string => {
    if (format === 'json') {
      return JSON.stringify(state.data, null, 2);
    }

    if (!state.referenceInfo) return '';
    
    // CSV format
    const headers = state.referenceInfo.columns.join(',');
    const rows = state.data.map(row => 
      state.referenceInfo!.columns.map(col => {
        const value = row[col];
        if (value != null && String(value).includes(',')) {
          return `"${String(value).replace(/"/g, '""')}"`;
        }
        return value != null ? String(value) : '';
      }).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }, [state.data, state.referenceInfo]);

  // Import data
  const importData = useCallback((data: Record<string, unknown>[]) => {
    const errors = validateOnChange ? validateData(data, state.referenceInfo) : [];
    const hasChanges = JSON.stringify(data) !== JSON.stringify(state.originalData);

    setState(prev => ({
      ...prev,
      data,
      validationErrors: errors,
      hasUnsavedChanges: hasChanges,
    }));
  }, [validateOnChange, validateData, state.referenceInfo, state.originalData]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && state.hasUnsavedChanges && state.validationErrors.length === 0) {
      const timeoutId = setTimeout(() => {
        save();
      }, 2000); // 2 second delay for auto-save

      return () => clearTimeout(timeoutId);
    }
  }, [autoSave, state.hasUnsavedChanges, state.validationErrors.length, save]);

  // Load data on mount or when referenceId changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  const actions: ReferenceDataEditorActions = {
    loadData,
    updateCell,
    addRow,
    deleteRow,
    duplicateRow,
    moveRow,
    save,
    reset,
    validate,
    exportData,
    importData,
  };

  return [state, actions];
}