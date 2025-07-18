import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ExpandedState,
  GroupingState,
  PaginationState,
} from "@tanstack/react-table";

// Sample data structure
export type Person = {
  id: string; // User-input ID field
  _rowId?: string; // Vendor-prefixed row ID injected during import
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
  email: string;
  department: string;
  salary: number;
  startDate: string;
};

// Sample data
const defaultData: Person[] = [
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
];

interface TableState {
  data: Person[];
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
  editingCell: { rowId: string; columnId: keyof Person } | null;
}

const initialState: TableState = {
  data: defaultData,
  sorting: [{ id: "firstName", desc: false }], // Default sort by first name
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
};

export const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    // Data management
    setData: (state, action: PayloadAction<Person[]>) => {
      state.data = action.payload;
      state.error = null;
    },
    resetData: state => {
      state.data = defaultData;
      state.error = null;
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
            state.sorting = [{ id: "firstName", desc: false }];
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
        } else {
          state.error = "Data must be an array";
        }
      } catch (error) {
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
        columnId: keyof Person;
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
        columnId: keyof Person;
      }>
    ) => {
      state.editingCell = action.payload;
    },

    stopEditing: state => {
      state.editingCell = null;
    },

    // History restoration action
    restoreFromHistory: (
      state,
      action: PayloadAction<{
        restoredFrom: number;
        restoredFromAction: string;
        [key: string]: any;
      }>
    ) => {
      // This action is used to mark when a state is restored from history
      // The actual state restoration is handled by the time travel utility
      // This just ensures the action is tracked in the history
    },
  },
});

export const {
  setData,
  resetData,
  setSorting,
  toggleColumnSort,
  setColumnFilters,
  setColumnVisibility,
  setRowSelection,
  setGlobalFilter,
  setGrouping,
  setExpanded,
  setPagination,
  setImportData,
  clearImportData,
  setLoading,
  setError,
  importJsonData,
  updateCell,
  startEditing,
  stopEditing,
  restoreFromHistory,
} = tableSlice.actions;

export default tableSlice.reducer;
