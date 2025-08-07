import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReferenceDataEditor } from './useReferenceDataEditor';
import { referenceDataManager } from '@/lib/utils/reference-data-manager';
import type { ReferenceDataInfo } from '@/lib/types/reference-data-types';

// Mock the reference data manager
vi.mock('@/lib/utils/reference-data-manager');

const mockReferenceDataManager = referenceDataManager as any;

describe('useReferenceDataEditor', () => {
  const mockReferenceInfo: ReferenceDataInfo = {
    id: 'test-ref',
    filename: 'test-data.csv',
    format: 'csv',
    columns: ['id', 'name', 'category'],
    rowCount: 3,
    fileSize: 1024,
    uploadedAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  };

  const mockData = [
    { id: '1', name: 'Item 1', category: 'A' },
    { id: '2', name: 'Item 2', category: 'B' },
    { id: '3', name: 'Item 3', category: 'A' },
  ];

  const defaultOptions = {
    referenceId: 'test-ref',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to valid reference data with mock data for most tests
    mockReferenceDataManager.getReferenceData.mockReturnValue({
      info: mockReferenceInfo,
    });
    mockReferenceDataManager.getReferenceDataRows.mockReturnValue(mockData);
    mockReferenceDataManager.updateReferenceData.mockImplementation(() => {});
  });

  it('initializes with correct default state', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));
    
    await act(async () => {
      // Wait for the load to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [state] = result.current;

    expect(state.data).toEqual(mockData);
    expect(state.originalData).toEqual(mockData);
    expect(state.referenceInfo).toEqual(mockReferenceInfo);
    expect(state.isLoading).toBe(false);
    expect(state.isSaving).toBe(false);
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.validationErrors).toEqual([]);
    expect(state.error).toBeNull();
  });

  it('loads data on mount', async () => {
    // Set up mocks for this specific test
    mockReferenceDataManager.getReferenceData.mockReturnValue({
      info: mockReferenceInfo,
    });
    mockReferenceDataManager.getReferenceDataRows.mockReturnValue(mockData);

    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      // Wait for the load to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [state] = result.current;
    expect(state.data).toEqual(mockData);
    expect(state.originalData).toEqual(mockData);
    expect(state.referenceInfo).toEqual(mockReferenceInfo);
    expect(state.isLoading).toBe(false);
  });

  it('handles loading errors', async () => {
    mockReferenceDataManager.getReferenceData.mockReturnValue(null);
    
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [state] = result.current;
    expect(state.error).toBe('Reference data not found');
    expect(state.isLoading).toBe(false);
  });

  it('updates cell values', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    act(() => {
      actions.updateCell(0, 'name', 'Updated Item 1');
    });

    const [state] = result.current;
    expect(state.data[0].name).toBe('Updated Item 1');
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('adds new rows', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    act(() => {
      actions.addRow({ id: '4', name: 'Item 4', category: 'C' });
    });

    const [state] = result.current;
    expect(state.data).toHaveLength(4);
    expect(state.data[3]).toEqual({ id: '4', name: 'Item 4', category: 'C' });
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('adds empty rows when no data provided', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    act(() => {
      actions.addRow();
    });

    const [state] = result.current;
    expect(state.data).toHaveLength(4);
    expect(state.data[3]).toEqual({ id: '', name: '', category: '' });
  });

  it('deletes rows', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    act(() => {
      actions.deleteRow(1);
    });

    const [state] = result.current;
    expect(state.data).toHaveLength(2);
    expect(state.data.find(item => item.id === '2')).toBeUndefined();
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('duplicates rows', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    act(() => {
      actions.duplicateRow(0);
    });

    const [state] = result.current;
    expect(state.data).toHaveLength(4);
    expect(state.data[1]).toEqual(state.data[0]);
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('moves rows', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    act(() => {
      actions.moveRow(0, 2);
    });

    const [state] = result.current;
    expect(state.data[0].id).toBe('2');
    expect(state.data[1].id).toBe('3');
    expect(state.data[2].id).toBe('1');
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('validates data', async () => {
    const { result } = renderHook(() => useReferenceDataEditor({
      ...defaultOptions,
      validateOnChange: true,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    // Create duplicate key
    act(() => {
      actions.updateCell(1, 'id', '1');
    });

    const [state] = result.current;
    expect(state.validationErrors).toHaveLength(2); // Two rows with same key
    expect(state.validationErrors[0].type).toBe('duplicate');
    expect(state.validationErrors[1].type).toBe('duplicate');
  });

  it('validates required key field', async () => {
    // Set up mocks for this test with data to validate
    mockReferenceDataManager.getReferenceData.mockReturnValue({
      info: mockReferenceInfo,
    });
    mockReferenceDataManager.getReferenceDataRows.mockReturnValue(mockData);

    const { result } = renderHook(() => useReferenceDataEditor({
      ...defaultOptions,
      validateOnChange: true,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    // Clear the key field (first column)
    act(() => {
      actions.updateCell(0, 'id', '');
    });

    const [state] = result.current;
    // The validation generates 2 errors: 1 for required key field, 1 for populated fields needing key
    expect(state.validationErrors).toHaveLength(2);
    expect(state.validationErrors.some(error => error.type === 'required' && error.message === 'Key field is required')).toBe(true);
  });

  it('saves data successfully', async () => {
    const onSave = vi.fn();
    
    // Set up mocks for this test with data to save
    mockReferenceDataManager.getReferenceData.mockReturnValue({
      info: mockReferenceInfo,
    });
    mockReferenceDataManager.getReferenceDataRows.mockReturnValue(mockData);
    mockReferenceDataManager.updateReferenceData.mockReturnValue(true);
    
    const { result } = renderHook(() => useReferenceDataEditor({
      ...defaultOptions,
      onSave,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    // Make a change
    act(() => {
      actions.updateCell(0, 'name', 'Updated Item 1');
    });

    // Verify the change was applied
    const [stateAfterUpdate] = result.current;
    expect(stateAfterUpdate.data[0].name).toBe('Updated Item 1');
    expect(stateAfterUpdate.hasUnsavedChanges).toBe(true);

    // Get fresh reference to actions after state update
    const [, freshActions] = result.current;
    
    let saveResult: boolean;
    await act(async () => {
      saveResult = await freshActions.save();
    });

    expect(saveResult).toBe(true);
    expect(mockReferenceDataManager.updateReferenceData).toHaveBeenCalledWith(
      'test-ref',
      expect.arrayContaining([
        expect.objectContaining({ id: '1', name: 'Updated Item 1' })
      ])
    );
    expect(onSave).toHaveBeenCalledWith('test-ref', expect.any(Array));

    const [state] = result.current;
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.isSaving).toBe(false);
  });

  it('prevents saving with validation errors', async () => {
    // Set up mocks for this test with data to validate
    mockReferenceDataManager.getReferenceData.mockReturnValue({
      info: mockReferenceInfo,
    });
    mockReferenceDataManager.getReferenceDataRows.mockReturnValue(mockData);
    
    const { result } = renderHook(() => useReferenceDataEditor({
      ...defaultOptions,
      validateOnChange: true,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    // Create validation error
    act(() => {
      actions.updateCell(0, 'id', '');
    });

    // Verify validation errors exist
    const [stateWithErrors, freshActionsForValidation] = result.current;
    expect(stateWithErrors.validationErrors.length).toBeGreaterThan(0);

    let saveResult: boolean;
    await act(async () => {
      saveResult = await freshActionsForValidation.save();
    });

    expect(saveResult).toBe(false);
    expect(mockReferenceDataManager.updateReferenceData).not.toHaveBeenCalled();
  });

  it('handles save errors', async () => {
    const onError = vi.fn();
    mockReferenceDataManager.updateReferenceData.mockImplementation(() => {
      throw new Error('Save failed');
    });

    const { result } = renderHook(() => useReferenceDataEditor({
      ...defaultOptions,
      onError,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    let saveResult: boolean;
    await act(async () => {
      saveResult = await actions.save();
    });

    expect(saveResult).toBe(false);
    expect(onError).toHaveBeenCalledWith('Save failed');

    const [state] = result.current;
    expect(state.error).toBe('Save failed');
    expect(state.isSaving).toBe(false);
  });

  it('resets data to original state', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    // Make changes
    act(() => {
      actions.updateCell(0, 'name', 'Updated Item 1');
      actions.addRow({ id: '4', name: 'Item 4', category: 'C' });
    });

    // Reset
    act(() => {
      actions.reset();
    });

    const [state] = result.current;
    expect(state.data).toEqual(mockData);
    expect(state.hasUnsavedChanges).toBe(false);
  });

  it('exports data as CSV', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    const csvData = actions.exportData('csv');
    
    expect(csvData).toContain('id,name,category');
    expect(csvData).toContain('1,Item 1,A');
    expect(csvData).toContain('2,Item 2,B');
    expect(csvData).toContain('3,Item 3,A');
  });

  it('exports data as JSON', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    const jsonData = actions.exportData('json');
    const parsed = JSON.parse(jsonData);
    
    expect(parsed).toEqual(mockData);
  });

  it('imports data', async () => {
    const { result } = renderHook(() => useReferenceDataEditor(defaultOptions));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    const newData = [
      { id: '10', name: 'New Item 1', category: 'X' },
      { id: '20', name: 'New Item 2', category: 'Y' },
    ];

    act(() => {
      actions.importData(newData);
    });

    const [state] = result.current;
    expect(state.data).toEqual(newData);
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it.skip('supports auto-save functionality', async () => {
    vi.useFakeTimers();
    
    const onSave = vi.fn();
    const { result } = renderHook(() => useReferenceDataEditor({
      ...defaultOptions,
      autoSave: true,
      onSave,
      validateOnChange: true,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    // Make a valid change
    act(() => {
      actions.updateCell(0, 'name', 'Auto-saved Item 1');
    });

    // Fast-forward time to trigger auto-save
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockReferenceDataManager.updateReferenceData).toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it.skip('does not auto-save with validation errors', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useReferenceDataEditor({
      ...defaultOptions,
      autoSave: true,
      validateOnChange: true,
    }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const [, actions] = result.current;

    // Make an invalid change
    act(() => {
      actions.updateCell(0, 'id', '');
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockReferenceDataManager.updateReferenceData).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });
});