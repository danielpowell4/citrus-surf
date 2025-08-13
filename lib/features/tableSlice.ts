import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ExpandedState,
  GroupingState,
  PaginationState,
} from "@tanstack/react-table";
import {
  lookupProcessor,
  ProcessedLookupResult,
  LookupProcessingOptions,
} from "../utils/lookup-processor";
import type { TargetShape, LookupField } from "../types/target-shapes";
import type { RowValidationMetadata, ValidationState } from "../types/validation";
import { createEmptyValidationState } from "../types/validation";

// Flexible row data type for dynamic data import and transformation
export type TableRow = Record<string, unknown> & {
  _rowId?: string; // Vendor-prefixed row ID injected during import
  _validationMetadata?: RowValidationMetadata; // Validation metadata for this row
};

// Sample data
export const defaultData: TableRow[] = [
  {
    id: "EMP001",
    firstName: "John",
    lastName: "Doe",
    age: 30,
    visits: 10,
    status: "Active",
    progress: 75,
    email: "john.doe@example.com",
    department: "Engineering",
    salary: 75000,
    startDate: "2023-01-15",
  },
  {
    id: "EMP002",
    firstName: "Jane",
    lastName: "Smith",
    age: 28,
    visits: 15,
    status: "Active",
    progress: 90,
    email: "jane.smith@example.com",
    department: "Marketing",
    salary: 65000,
    startDate: "2023-03-20",
  },
  {
    id: "EMP003",
    firstName: "Bob",
    lastName: "Johnson",
    age: 35,
    visits: 8,
    status: "Inactive",
    progress: 45,
    email: "bob.johnson@example.com",
    department: "Sales",
    salary: 80000,
    startDate: "2022-11-10",
  },
  {
    id: "EMP004",
    firstName: "Alice",
    lastName: "Brown",
    age: 32,
    visits: 12,
    status: "Active",
    progress: 60,
    email: "alice.brown@example.com",
    department: "Engineering",
    salary: 70000,
    startDate: "2023-02-05",
  },
  {
    id: "EMP005",
    firstName: "Charlie",
    lastName: "Wilson",
    age: 29,
    visits: 20,
    status: "Active",
    progress: 85,
    email: "charlie.wilson@example.com",
    department: "Marketing",
    salary: 60000,
    startDate: "2023-04-12",
  },
  {
    id: "EMP006",
    firstName: "David",
    lastName: "Miller",
    age: 25,
    visits: 2,
    status: "Active",
    progress: 30,
    email: "david.miller@example.com",
    department: "Engineering",
    salary: 55000,
    startDate: "2023-05-01",
  },
  {
    id: "EMP007",
    firstName: "Eva",
    lastName: "Garcia",
    age: 40,
    visits: 100,
    status: "Active",
    progress: 95,
    email: "eva.garcia@example.com",
    department: "Sales",
    salary: 85000,
    startDate: "2022-08-15",
  },
  {
    id: "EMP008",
    firstName: "Frank",
    lastName: "Taylor",
    age: 22,
    visits: 1,
    status: "Inactive",
    progress: 15,
    email: "frank.taylor@example.com",
    department: "HR",
    salary: 45000,
    startDate: "2023-06-10",
  },
];

interface TableState {
  data: TableRow[];
  columnOrder: string[]; // Array of field keys that determines column display order
  appliedTargetShapeId: string | null; // ID of currently applied target shape (null = default shape)
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: Record<string, boolean>;
  globalFilter: string;
  grouping: GroupingState;
  expanded: ExpandedState;
  pagination: PaginationState;
  importData: string;
  isLoading: boolean;
  error: string | null;
  // Add edit state tracking
  editingCell: { rowId: string; columnId: string } | null;

  // Lookup processing state
  lookupProcessing: {
    isProcessing: boolean;
    progress: number;
    result: ProcessedLookupResult | null;
    error: string | null;
  };

  // Validation state
  validation: ValidationState;
}

const initialState: TableState = {
  data: [],
  columnOrder: [], // Will be set when data is loaded
  appliedTargetShapeId: null, // null = default/auto-generated shape
  sorting: [], // Will be set dynamically when data is loaded
  columnFilters: [],
  columnVisibility: {}, // No hidden columns by default
  rowSelection: {},
  globalFilter: "",
  grouping: [],
  expanded: {},
  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },
  importData: "",
  isLoading: false,
  error: null,
  editingCell: null,
  lookupProcessing: {
    isProcessing: false,
    progress: 0,
    result: null,
    error: null,
  },
  validation: createEmptyValidationState(),
};

// Async thunk for processing data with lookups
export const processDataWithLookups = createAsyncThunk(
  "table/processDataWithLookups",
  async (
    {
      data,
      targetShape,
      options = {},
    }: {
      data: TableRow[];
      targetShape: TargetShape;
      options?: LookupProcessingOptions;
    },
    { dispatch }
  ) => {
    // Set up progress callback
    const onProgress = (processed: number, total: number) => {
      const progress = Math.floor((processed / total) * 100);
      dispatch(setLookupProgress(progress));
    };

    const result = await lookupProcessor.processDataWithLookups(
      data,
      targetShape,
      {
        ...options,
        onProgress,
      }
    );

    return result;
  }
);

// Async thunk for real-time lookup updates
export const updateLookupValue = createAsyncThunk(
  "table/updateLookupValue",
  async ({
    rowId,
    fieldName,
    value,
    field,
    rowData,
  }: {
    rowId: string;
    fieldName: string;
    value: any;
    field: LookupField;
    rowData: TableRow;
  }) => {
    const result = await lookupProcessor.processLookupUpdate(
      value,
      field,
      rowData
    );
    return { rowId, fieldName, result };
  }
);

export const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    // Data management
    setData: (state, action: PayloadAction<TableRow[]>) => {
      state.data = action.payload;
      state.error = null;

      // Set column order from data keys if not already set
      if (action.payload.length > 0 && state.columnOrder.length === 0) {
        state.columnOrder = Object.keys(action.payload[0]).filter(
          key => !key.startsWith("_")
        );
      }

      // Set default sorting to first column when data is loaded
      if (action.payload.length > 0 && state.sorting.length === 0) {
        const firstColumnKey =
          state.columnOrder.length > 0
            ? state.columnOrder[0]
            : Object.keys(action.payload[0]).find(key => !key.startsWith("_"));
        if (firstColumnKey) {
          state.sorting = [{ id: firstColumnKey, desc: false }];
        }
      }
    },

    // Apply template transformation to data
    applyTemplate: (
      state,
      action: PayloadAction<{
        targetShapeId: string;
        targetShapeName: string;
        columnMapping: Record<string, string>; // targetFieldId -> sourceColumnName
        fieldMappings: Record<string, string>; // targetFieldId -> targetFieldName
        targetFields: Array<{ id: string; name: string }>; // Target shape fields in order
      }>
    ) => {
      const { targetShapeId, columnMapping, targetFields } = action.payload;

      // Transform data according to mapping using current state data
      const transformedData = state.data.map(row => {
        const newRow: Record<string, unknown> = { _rowId: row._rowId }; // Preserve internal ID

        // Apply column mappings
        Object.entries(columnMapping).forEach(
          ([targetFieldId, sourceColumn]) => {
            const targetField = targetFields.find(f => f.id === targetFieldId);
            if (targetField && row[sourceColumn] !== undefined) {
              newRow[targetField.name] = row[sourceColumn];
            }
          }
        );

        return newRow;
      });

      state.data = transformedData;
      state.error = null;

      // Set applied target shape ID
      state.appliedTargetShapeId = targetShapeId;

      // Set column order based on target shape field order
      state.columnOrder = targetFields
        .filter(field => columnMapping[field.id]) // Only include mapped fields
        .map(field => field.name); // Use target field names from targetFields

      // Set default sorting to first column when data is transformed
      if (state.columnOrder.length > 0) {
        state.sorting = [{ id: state.columnOrder[0], desc: false }];
      }
    },

    // Table state management
    setSorting: (state, action: PayloadAction<SortingState>) => {
      state.sorting = action.payload;
    },
    toggleColumnSort: (
      state,
      action: PayloadAction<{ columnId: string; shiftKey?: boolean }>
    ) => {
      const { columnId, shiftKey = false } = action.payload;
      const currentSort = state.sorting.find(sort => sort.id === columnId);

      if (shiftKey) {
        // Multi-column sort: add to existing sorts
        if (currentSort) {
          // Cycle through: asc -> desc -> remove
          if (currentSort.desc) {
            // Remove from sorting
            state.sorting = state.sorting.filter(sort => sort.id !== columnId);
          } else {
            // Change to desc
            currentSort.desc = true;
          }
        } else {
          // Add as last sort (append to end)
          state.sorting = [...state.sorting, { id: columnId, desc: false }];
        }
      } else {
        // Single column sort: replace all sorts
        if (currentSort) {
          if (currentSort.desc) {
            // Remove from sorting, fall back to default
            state.sorting = [{ id: "id", desc: false }];
          } else {
            // Change to desc
            state.sorting = [{ id: columnId, desc: true }];
          }
        } else {
          // Add as only sort
          state.sorting = [{ id: columnId, desc: false }];
        }
      }
    },
    setColumnFilters: (state, action: PayloadAction<ColumnFiltersState>) => {
      state.columnFilters = action.payload;
    },
    setColumnVisibility: (state, action: PayloadAction<VisibilityState>) => {
      state.columnVisibility = action.payload;
    },
    setRowSelection: (
      state,
      action: PayloadAction<Record<string, boolean>>
    ) => {
      state.rowSelection = action.payload;
    },
    setGlobalFilter: (state, action: PayloadAction<string>) => {
      state.globalFilter = action.payload;
    },
    setGrouping: (state, action: PayloadAction<GroupingState>) => {
      state.grouping = action.payload;
    },
    setExpanded: (state, action: PayloadAction<ExpandedState>) => {
      state.expanded = action.payload;
    },
    setPagination: (state, action: PayloadAction<PaginationState>) => {
      state.pagination = action.payload;
    },

    // Column order management
    setColumnOrder: (state, action: PayloadAction<string[]>) => {
      state.columnOrder = action.payload;
    },
    reorderColumns: (
      state,
      action: PayloadAction<{ from: number; to: number }>
    ) => {
      const { from, to } = action.payload;
      const newColumnOrder = [...state.columnOrder];
      const [removed] = newColumnOrder.splice(from, 1);
      newColumnOrder.splice(to, 0, removed);
      state.columnOrder = newColumnOrder;
    },

    // Import/Export management
    setImportData: (state, action: PayloadAction<string>) => {
      state.importData = action.payload;
    },
    clearImportData: state => {
      state.importData = "";
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Import action with validation
    importJsonData: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;

      try {
        const parsedData = JSON.parse(action.payload);
        if (Array.isArray(parsedData)) {
          state.data = parsedData;
          state.importData = "";
          state.error = null;

          // Set column order from data keys
          if (parsedData.length > 0) {
            state.columnOrder = Object.keys(parsedData[0]).filter(
              key => !key.startsWith("_")
            );

            // Set default sorting to first column when data is imported
            if (state.sorting.length === 0 && state.columnOrder.length > 0) {
              state.sorting = [{ id: state.columnOrder[0], desc: false }];
            }
          }
        } else {
          state.error = "Data must be an array";
        }
      } catch {
        state.error = "Invalid JSON format";
      } finally {
        state.isLoading = false;
      }
    },

    // Cell editing
    updateCell: (
      state,
      action: PayloadAction<{
        rowId: string;
        columnId: string;
        value: any;
      }>
    ) => {
      const { rowId, columnId, value } = action.payload;
      const rowIndex = state.data.findIndex(row => row.id === rowId);
      if (rowIndex !== -1) {
        (state.data[rowIndex] as any)[columnId] = value;
      }
      // Clear editing state when cell is updated
      state.editingCell = null;
    },

    // Edit state management
    startEditing: (
      state,
      action: PayloadAction<{
        rowId: string;
        columnId: string;
      }>
    ) => {
      state.editingCell = action.payload;
    },

    stopEditing: state => {
      state.editingCell = null;
    },

    // Set applied target shape ID
    setAppliedTargetShapeId: (state, action: PayloadAction<string | null>) => {
      state.appliedTargetShapeId = action.payload;
    },

    // History restoration action
    restoreFromHistory: (
      _state,
      _action: PayloadAction<{
        restoredFrom: number;
        restoredFromAction: string;
        [key: string]: any;
      }>
    ) => {
      // This action is used to mark when a state is restored from history
      // The actual state restoration is handled by the time travel utility
      // This just ensures the action is tracked in the history
      // No state changes needed - this is just for history tracking
    },

    // Lookup processing reducers
    setLookupProgress: (state, action: PayloadAction<number>) => {
      state.lookupProcessing.progress = action.payload;
    },

    clearLookupProcessing: state => {
      state.lookupProcessing = {
        isProcessing: false,
        progress: 0,
        result: null,
        error: null,
      };
    },
  },
  extraReducers: builder => {
    builder
      // Handle processDataWithLookups async thunk
      .addCase(processDataWithLookups.pending, state => {
        state.lookupProcessing.isProcessing = true;
        state.lookupProcessing.progress = 0;
        state.lookupProcessing.error = null;
      })
      .addCase(processDataWithLookups.fulfilled, (state, action) => {
        state.lookupProcessing.isProcessing = false;
        state.lookupProcessing.progress = 100;
        state.lookupProcessing.result = action.payload;
        state.lookupProcessing.error = null;

        // Update table data with processed results
        state.data = action.payload.data;

        // Update column order to match the actual data structure
        if (action.payload.data.length > 0) {
          const newColumns = Object.keys(action.payload.data[0]).filter(
            key => !key.startsWith("_")
          );
          // Replace column order with actual columns from processed data
          // This ensures removed/renamed columns are properly handled
          state.columnOrder = newColumns;
        }
      })
      .addCase(processDataWithLookups.rejected, (state, action) => {
        state.lookupProcessing.isProcessing = false;
        state.lookupProcessing.error =
          action.error.message || "Lookup processing failed";
      })

      // Handle updateLookupValue async thunk
      .addCase(updateLookupValue.fulfilled, (state, action) => {
        const { rowId, result } = action.payload;
        if (result.success) {
          // Update the specific row with the new lookup values
          const rowIndex = state.data.findIndex(row => row._rowId === rowId);
          if (rowIndex !== -1) {
            state.data[rowIndex] = result.updatedRow;
          }
        }
      });
  },
});

export const {
  setData,
  applyTemplate,
  setSorting,
  toggleColumnSort,
  setColumnFilters,
  setColumnVisibility,
  setRowSelection,
  setGlobalFilter,
  setGrouping,
  setExpanded,
  setPagination,
  setColumnOrder,
  reorderColumns,
  setImportData,
  clearImportData,
  setLoading,
  setError,
  importJsonData,
  updateCell,
  startEditing,
  stopEditing,
  setAppliedTargetShapeId,
  restoreFromHistory,
  setLookupProgress,
  clearLookupProcessing,
} = tableSlice.actions;

export default tableSlice.reducer;
