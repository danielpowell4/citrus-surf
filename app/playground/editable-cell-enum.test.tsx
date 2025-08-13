import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { EditableCell } from "./editable-cell";
import tableReducer from "@/lib/features/tableSlice";
import persistenceReducer from "@/lib/features/persistenceSlice";

// Mock table and column objects for enum field
const createMockTable = () => ({
  getRowModel: () => ({
    rows: [
      { id: "1", original: { id: "1", status: "active" } },
    ],
  }),
  getVisibleLeafColumns: () => [
    {
      id: "status",
      columnDef: {
        meta: {
          editable: {
            type: "select",
            options: [
              { value: "active", label: "Active Employee" },
              { value: "inactive", label: "Inactive Employee" },
              { value: "pending", label: "Pending Review" },
            ],
          },
        },
      },
    },
  ],
});

const createMockColumn = () => ({
  id: "status",
  columnDef: {
    meta: {
      editable: {
        type: "select",
        options: [
          { value: "active", label: "Active Employee" },
          { value: "inactive", label: "Inactive Employee" },
          { value: "pending", label: "Pending Review" },
        ],
      },
    },
  },
});

const createMockRow = () => ({
  id: "1",
  original: { id: "1", status: "active" },
});

describe("EditableCell - Enum Label Display", () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        table: tableReducer,
        persistence: persistenceReducer,
      },
    });

  it("should display enum label in badge, not the raw value", () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <EditableCell
          value="active"
          row={createMockRow()}
          column={createMockColumn()}
          getValue={() => "active"}
          table={createMockTable()}
        />
      </Provider>
    );

    // Should display the label "Active Employee", not the value "active"
    expect(screen.getByText("Active Employee")).toBeInTheDocument();
    expect(screen.queryByText("active")).not.toBeInTheDocument();
  });

  it("should fall back to value if label is not found", () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <EditableCell
          value="unknown_value"
          row={createMockRow()}
          column={createMockColumn()}
          getValue={() => "unknown_value"}
          table={createMockTable()}
        />
      </Provider>
    );

    // Should display the raw value as fallback when label is not found
    expect(screen.getByText("unknown_value")).toBeInTheDocument();
  });

  it("should display label for different enum values", () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <EditableCell
          value="pending"
          row={createMockRow()}
          column={createMockColumn()}
          getValue={() => "pending"}
          table={createMockTable()}
        />
      </Provider>
    );

    // Should display "Pending Review" for value "pending"
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.queryByText("pending")).not.toBeInTheDocument();
  });

  it("should handle empty options gracefully", () => {
    const store = createTestStore();
    
    const mockColumnWithEmptyOptions = {
      id: "status",
      columnDef: {
        meta: {
          editable: {
            type: "select",
            options: [],
          },
        },
      },
    };
    
    render(
      <Provider store={store}>
        <EditableCell
          value="some_value"
          row={createMockRow()}
          column={mockColumnWithEmptyOptions}
          getValue={() => "some_value"}
          table={createMockTable()}
        />
      </Provider>
    );

    // Should fall back to displaying the raw value
    expect(screen.getByText("some_value")).toBeInTheDocument();
  });
});