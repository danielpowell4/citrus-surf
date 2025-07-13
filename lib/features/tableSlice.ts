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
  id: string;
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
    id: "1",
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
    id: "2",
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
    id: "3",
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
    id: "4",
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
    id: "5",
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
}

const initialState: TableState = {
  data: defaultData,
  sorting: [],
  columnFilters: [],
  columnVisibility: {},
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
  },
});

export const {
  setData,
  resetData,
  setSorting,
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
} = tableSlice.actions;

export default tableSlice.reducer;
