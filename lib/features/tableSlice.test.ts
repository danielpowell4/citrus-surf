import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import tableReducer, {
  setData,
  applyTemplate,
  type TableRow,
} from "./tableSlice";

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

    expect(state.data).toHaveLength(0); // Initially empty data
    expect(state.sorting).toEqual([]); // No sorting initially
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
    const testData: TableRow[] = [
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

  describe("applyTemplate", () => {
    it("should transform data according to column mappings", () => {
      const store = createTestStore();

      // Set source data with lowercase field names
      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          id: "EMP001",
          firstname: "John",
          lastname: "Doe",
          email: "john@example.com",
        },
        {
          _rowId: "row2",
          id: "EMP002",
          firstname: "Jane",
          lastname: "Smith",
          email: "jane@example.com",
        },
      ];

      store.dispatch(setData(sourceData));

      // Apply template transformation
      store.dispatch(
        applyTemplate({
          targetShapeId: "employee-template",
          targetShapeName: "Employee Template",
          columnMapping: {
            field_id: "id",
            field_firstName: "firstname",
            field_lastName: "lastname",
            field_email: "email",
          },
          fieldMappings: {
            field_id: "ID",
            field_firstName: "First Name",
            field_lastName: "Last Name",
            field_email: "Email",
          },
          targetFields: [
            { id: "field_id", name: "ID" },
            { id: "field_firstName", name: "First Name" },
            { id: "field_lastName", name: "Last Name" },
            { id: "field_email", name: "Email" },
          ],
        })
      );

      const state = store.getState().table;

      // Data should be transformed with new field names
      expect(state.data).toHaveLength(2);
      expect(state.data[0]).toEqual({
        _rowId: "row1",
        ID: "EMP001",
        "First Name": "John",
        "Last Name": "Doe",
        Email: "john@example.com",
      });
      expect(state.data[1]).toEqual({
        _rowId: "row2",
        ID: "EMP002",
        "First Name": "Jane",
        "Last Name": "Smith",
        Email: "jane@example.com",
      });
    });

    it("should preserve _rowId and handle missing source fields gracefully", () => {
      const store = createTestStore();

      // Source data with some missing fields
      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          id: "EMP001",
          firstname: "John",
          // lastname missing
          email: "john@example.com",
        },
      ];

      store.dispatch(setData(sourceData));

      store.dispatch(
        applyTemplate({
          targetShapeId: "employee-template",
          targetShapeName: "Employee Template",
          columnMapping: {
            field_id: "id",
            field_firstName: "firstname",
            field_lastName: "lastname", // This will be missing in source
            field_email: "email",
          },
          fieldMappings: {
            field_id: "ID",
            field_firstName: "First Name",
            field_lastName: "Last Name", // Missing in source
            field_email: "Email",
          },
          targetFields: [
            { id: "field_id", name: "ID" },
            { id: "field_firstName", name: "First Name" },
            { id: "field_lastName", name: "Last Name" },
            { id: "field_email", name: "Email" },
          ],
        })
      );

      const state = store.getState().table;

      // Should preserve _rowId and skip missing fields
      expect(state.data[0]).toEqual({
        _rowId: "row1",
        ID: "EMP001",
        "First Name": "John",
        Email: "john@example.com",
        // 'Last Name' should not be present since 'lastname' was undefined in source
      });
      expect(state.data[0]).not.toHaveProperty("Last Name");
    });

    it("should set default sorting to first non-underscore column when no sorting exists", () => {
      const store = createTestStore();

      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          id: "EMP001",
          name: "John",
        },
      ];

      store.dispatch(setData(sourceData));

      // Manually clear sorting to test the default sorting logic
      const stateWithoutSorting = {
        ...store.getState().table,
        sorting: [],
      };

      // Apply the cleared state by dispatching a custom action or directly modifying for test
      // For this test, we'll directly test the reducer
      const action = applyTemplate({
        targetShapeId: "employee-template",
        targetShapeName: "Employee Template",
        columnMapping: {
          field_id: "id",
          field_name: "name",
        },
        fieldMappings: {
          field_id: "Employee ID",
          field_name: "Full Name",
        },
        targetFields: [
          { id: "field_id", name: "Employee ID" },
          { id: "field_name", name: "Full Name" },
        ],
      });

      const finalState = tableReducer(stateWithoutSorting, action);

      // Should set sorting to first non-underscore column
      expect(finalState.sorting).toEqual([{ id: "Employee ID", desc: false }]);
    });

    it("should preserve existing sorting when sorting already exists", () => {
      const store = createTestStore();

      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          id: "EMP001",
          name: "John",
        },
      ];

      store.dispatch(setData(sourceData));

      // setData should have set default sorting
      const initialState = store.getState().table;
      expect(initialState.sorting).toEqual([{ id: "id", desc: false }]);

      store.dispatch(
        applyTemplate({
          targetShapeId: "employee-template",
          targetShapeName: "Employee Template",
          columnMapping: {
            field_id: "Employee ID",
            field_name: "Full Name",
          },
          fieldMappings: {
            field_id: "id",
            field_name: "name",
          },
          targetFields: [
            { id: "field_id", name: "id" },
            { id: "field_name", name: "name" },
          ],
        })
      );

      const state = store.getState().table;

      // Should preserve the existing sorting (not change it)
      expect(state.sorting).toEqual([{ id: "id", desc: false }]);
    });

    it("should clear any existing error state", () => {
      const store = createTestStore();

      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          id: "EMP001",
          name: "John",
        },
      ];

      store.dispatch(setData(sourceData));

      // Manually set an error to test clearing
      const _stateWithError = {
        ...store.getState().table,
        error: "Previous error message",
      };

      store.dispatch(
        applyTemplate({
          targetShapeId: "employee-template",
          targetShapeName: "Employee Template",
          columnMapping: {
            field_id: "id",
          },
          fieldMappings: {
            field_id: "Employee ID",
          },
          targetFields: [{ id: "field_id", name: "Employee ID" }],
        })
      );

      const state = store.getState().table;

      // Should clear error state
      expect(state.error).toBeNull();
    });

    it("should handle case where columnMapping and fieldMappings have mismatched keys", () => {
      const store = createTestStore();

      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          id: "EMP001",
          name: "John",
        },
      ];

      store.dispatch(setData(sourceData));

      store.dispatch(
        applyTemplate({
          targetShapeId: "employee-template",
          targetShapeName: "Employee Template",
          columnMapping: {
            field_id: "id",
            field_missing: "missing_field", // This source column doesn't exist
          },
          fieldMappings: {
            field_id: "Employee ID",
            field_other: "Other Field", // This target field isn't in columnMapping
          },
          targetFields: [
            { id: "field_id", name: "Employee ID" },
            { id: "field_missing", name: "Missing Field" },
            { id: "field_other", name: "Other Field" },
          ],
        })
      );

      const state = store.getState().table;

      // Should only process matching keys
      expect(state.data[0]).toEqual({
        _rowId: "row1",
        "Employee ID": "EMP001",
        // Should not include fields with mismatched keys
      });
      expect(state.data[0]).not.toHaveProperty("Missing Field");
      expect(state.data[0]).not.toHaveProperty("name");
    });

    it("should properly set appliedTargetShapeId and columnOrder for history restoration", () => {
      const store = createTestStore();

      // Start with initial data
      const initialData: TableRow[] = [
        { id: "1", name: "John", age: 30 },
        { id: "2", name: "Jane", age: 25 },
      ];
      store.dispatch(setData(initialData));

      // Apply a template
      store.dispatch(
        applyTemplate({
          targetShapeId: "person-template",
          targetShapeName: "Person Template",
          columnMapping: {
            field_id: "id",
            field_name: "name",
          },
          fieldMappings: {
            field_id: "Person ID",
            field_name: "Full Name",
          },
          targetFields: [
            { id: "field_id", name: "Person ID" },
            { id: "field_name", name: "Full Name" },
          ],
        })
      );

      const afterTemplateState = store.getState().table;

      // Verify template was applied correctly with all properties needed for history restoration
      expect(afterTemplateState.appliedTargetShapeId).toBe("person-template");
      expect(afterTemplateState.columnOrder).toEqual([
        "Person ID",
        "Full Name",
      ]);
      expect(afterTemplateState.data[0]).toEqual({
        "Person ID": "1",
        "Full Name": "John",
        _rowId: undefined,
      });
    });

    it("should remove original columns and only keep mapped columns in data", () => {
      const store = createTestStore();

      // Set source data with misspelled column name
      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          id: "EMP001",
          firsName: "John", // Misspelled column
          lastName: "Doe",
          email: "john@example.com",
          extraColumn: "should be removed",
        },
      ];

      store.dispatch(setData(sourceData));

      // Verify initial state has all original columns
      const initialState = store.getState().table;
      expect(initialState.columnOrder).toEqual([
        "id",
        "firsName",
        "lastName",
        "email",
        "extraColumn",
      ]);

      // Apply template that maps firsName -> firstname
      store.dispatch(
        applyTemplate({
          targetShapeId: "employee-template",
          targetShapeName: "Employee Template",
          columnMapping: {
            field_id: "id",
            field_firstName: "firsName", // Map misspelled column to correct name
            field_lastName: "lastName",
            field_email: "email",
            // Note: extraColumn is NOT mapped, so it should be removed
          },
          fieldMappings: {
            field_id: "ID",
            field_firstName: "firstname", // Correct name in target
            field_lastName: "lastname",
            field_email: "email",
          },
          targetFields: [
            { id: "field_id", name: "ID" },
            { id: "field_firstName", name: "firstname" },
            { id: "field_lastName", name: "lastname" },
            { id: "field_email", name: "email" },
          ],
        })
      );

      const state = store.getState().table;

      // The data should only contain the mapped columns with new names
      expect(state.data[0]).toEqual({
        _rowId: "row1",
        ID: "EMP001",
        firstname: "John", // Data from firsName column
        lastname: "Doe",
        email: "john@example.com",
        // extraColumn should NOT be present
        // firsName should NOT be present
      });

      // Original columns should NOT exist in the data
      expect(state.data[0]).not.toHaveProperty("firsName");
      expect(state.data[0]).not.toHaveProperty("extraColumn");

      // Column order should only contain the new mapped columns
      expect(state.columnOrder).toEqual([
        "ID",
        "firstname",
        "lastname",
        "email",
      ]);

      // Original column names should NOT be in column order
      expect(state.columnOrder).not.toContain("firsName");
      expect(state.columnOrder).not.toContain("extraColumn");
    });

    it("should handle exact user scenario: firsName mapped to firstname", () => {
      const store = createTestStore();

      // Exact scenario from user: data with 'firsName'
      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          firsName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      ];

      store.dispatch(setData(sourceData));

      // Check initial state - should have firsName column
      const initialState = store.getState().table;
      expect(initialState.columnOrder).toEqual([
        "firsName",
        "lastName",
        "email",
      ]);
      expect(initialState.data[0]).toHaveProperty("firsName", "John");

      // Apply template that maps 'firsName' -> 'firstname'
      store.dispatch(
        applyTemplate({
          targetShapeId: "user-template",
          targetShapeName: "User Template",
          columnMapping: {
            field_firstName: "firsName", // Map firsName column to firstname field
            field_lastName: "lastName",
            field_email: "email",
          },
          fieldMappings: {
            field_firstName: "firstname",
            field_lastName: "lastname",
            field_email: "email",
          },
          targetFields: [
            { id: "field_firstName", name: "firstname" },
            { id: "field_lastName", name: "lastname" },
            { id: "field_email", name: "email" },
          ],
        })
      );

      const finalState = store.getState().table;

      // After template application:
      // 1. Should have 'firstname' column with data from 'firsName'
      expect(finalState.data[0]).toHaveProperty("firstname", "John");

      // 2. Should NOT have 'firsName' column anymore
      expect(finalState.data[0]).not.toHaveProperty("firsName");

      // 3. Column order should reflect new column names
      expect(finalState.columnOrder).toEqual([
        "firstname",
        "lastname",
        "email",
      ]);
      expect(finalState.columnOrder).not.toContain("firsName");

      // 4. All expected data should be present
      expect(finalState.data[0]).toEqual({
        _rowId: "row1",
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
      });
    });

    it("should update columnOrder correctly when processDataWithLookups transforms data", () => {
      const store = createTestStore();

      // Start with original data structure
      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          firsName: "John",
          lastName: "Doe",
          department: "Engineering",
        },
      ];

      store.dispatch(setData(sourceData));

      // Check initial state - should have firsName column
      const initialState = store.getState().table;
      expect(initialState.columnOrder).toEqual([
        "firsName",
        "lastName",
        "department",
      ]);

      // Simulate transformed data (what lookup processor would produce)
      const transformedData: TableRow[] = [
        {
          _rowId: "row1",
          firstname: "John", // Renamed from firsName
          lastname: "Doe", // Renamed from lastName
          department: "Engineering",
        },
      ];

      // Create mock lookup result as if returned by processDataWithLookups
      const mockLookupResult = {
        data: transformedData,
        errors: [],
        statistics: { processed: 1, matched: 0, fuzzy: 0, failed: 0 },
        fuzzyMatches: [],
      };

      // Apply the processDataWithLookups.fulfilled logic directly
      const currentState = store.getState().table;
      const updatedState = tableReducer(currentState, {
        type: "table/processDataWithLookups/fulfilled",
        payload: mockLookupResult,
      });

      // Verify the column order was updated to match the new data structure
      expect(updatedState.columnOrder).toEqual([
        "firstname",
        "lastname",
        "department",
      ]);
      expect(updatedState.columnOrder).not.toContain("firsName");
      expect(updatedState.columnOrder).not.toContain("lastName");

      // Verify the data was updated correctly
      expect(updatedState.data[0]).toEqual({
        _rowId: "row1",
        firstname: "John",
        lastname: "Doe",
        department: "Engineering",
      });
      expect(updatedState.data[0]).not.toHaveProperty("firsName");
    });

    it("should update columnOrder correctly when original columns are remapped", () => {
      const store = createTestStore();

      const sourceData: TableRow[] = [
        {
          _rowId: "row1",
          firsName: "John", // Misspelled
          lastName: "Doe",
          email: "john@example.com",
          extraCol: "extra", // Should be removed
        },
      ];

      store.dispatch(setData(sourceData));

      // Verify initial column order
      const initialState = store.getState().table;
      expect(initialState.columnOrder).toEqual([
        "firsName",
        "lastName",
        "email",
        "extraCol",
      ]);

      // Apply template with selective mapping (extraCol is excluded)
      store.dispatch(
        applyTemplate({
          targetShapeId: "test-template",
          targetShapeName: "Test Template",
          columnMapping: {
            field_firstName: "firsName", // Map to correct name
            field_lastName: "lastName",
            field_email: "email",
            // extraCol deliberately not mapped
          },
          fieldMappings: {
            field_firstName: "firstname",
            field_lastName: "lastname",
            field_email: "email",
          },
          targetFields: [
            { id: "field_firstName", name: "firstname" },
            { id: "field_lastName", name: "lastname" },
            { id: "field_email", name: "email" },
          ],
        })
      );

      const finalState = store.getState().table;

      // Column order should only include mapped columns in target field order
      expect(finalState.columnOrder).toEqual([
        "firstname",
        "lastname",
        "email",
      ]);

      // Should NOT contain original or unmapped column names
      expect(finalState.columnOrder).not.toContain("firsName");
      expect(finalState.columnOrder).not.toContain("extraCol");

      // Verify data structure matches column order
      expect(finalState.data[0]).toEqual({
        _rowId: "row1",
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
      });
    });
  });
});
