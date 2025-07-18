import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import tableReducer, { setData, resetData, Person } from "./tableSlice";

describe("Table Slice", () => {
  const createTestStore = () => {
    return configureStore({
      reducer: {
        table: tableReducer,
      },
    });
  };

  it("should handle initial state", () => {
    const store = createTestStore();
    const state = store.getState().table;

    expect(state.data).toHaveLength(5); // Has default data
    expect(state.sorting).toEqual([{ id: "firstName", desc: false }]);
    expect(state.columnFilters).toEqual([]);
    expect(state.columnVisibility).toEqual({});
    expect(state.rowSelection).toEqual({});
    expect(state.globalFilter).toBe("");
    expect(state.grouping).toEqual([]);
    expect(state.expanded).toEqual({});
    expect(state.pagination).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });
    expect(state.editingCell).toBeNull();
  });

  it("should handle setData", () => {
    const store = createTestStore();
    const testData: Person[] = [
      {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        age: 30,
        visits: 5,
        status: "Active",
        progress: 75,
        email: "john@example.com",
        department: "Engineering",
        salary: 75000,
        startDate: "2020-01-15",
      },
    ];

    store.dispatch(setData(testData));
    const state = store.getState().table;

    expect(state.data).toEqual(testData);
  });

  it("should handle resetData", () => {
    const store = createTestStore();
    const testData: Person[] = [
      {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        age: 30,
        visits: 5,
        status: "Active",
        progress: 75,
        email: "john@example.com",
        department: "Engineering",
        salary: 75000,
        startDate: "2020-01-15",
      },
    ];

    // First set some data
    store.dispatch(setData(testData));
    expect(store.getState().table.data).toEqual(testData);

    // Then reset it
    store.dispatch(resetData());
    expect(store.getState().table.data).toHaveLength(5); // resetData restores default data
  });
});
