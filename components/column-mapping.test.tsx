import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ColumnMapping } from "./column-mapping";
import type { TargetShape, TargetField } from "@/lib/types/target-shapes";

// Mock data for testing
const mockImportColumns = [
  "id",
  "firstName",
  "lastName",
  "emailAddress",
  "dept",
  "salary",
];

const mockTargetShape: TargetShape = {
  id: "employee-shape-1",
  name: "Employee Database",
  description: "Standard employee record format",
  version: "1.0.0",
  createdAt: new Date(),
  updatedAt: new Date(),
  fields: [
    {
      id: "emp-id",
      name: "Employee ID",
      type: "string",
      required: true,
    },
    {
      id: "full-name",
      name: "Full Name",
      type: "string",
      required: true,
    },
    {
      id: "email",
      name: "Email",
      type: "email",
      required: true,
    },
    {
      id: "department",
      name: "Department",
      type: "string",
      required: false,
    },
    {
      id: "salary",
      name: "Salary",
      type: "number",
      required: false,
    },
  ] as TargetField[],
};

describe("ColumnMapping Component", () => {
  const mockOnMappingChange = vi.fn();
  const mockOnApplyMapping = vi.fn();

  beforeEach(() => {
    mockOnMappingChange.mockClear();
    mockOnApplyMapping.mockClear();
  });

  it("renders column mapping interface correctly", () => {
    render(
      <ColumnMapping
        importColumns={mockImportColumns}
        targetShape={mockTargetShape}
        onMappingChange={mockOnMappingChange}
        onApplyMapping={mockOnApplyMapping}
      />
    );

    // Check title
    expect(
      screen.getByText("Column Mapping: Employee Database")
    ).toBeInTheDocument();

    // Check target fields are displayed
    expect(screen.getByText("Employee ID")).toBeInTheDocument();
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();

    // Check required badges
    const requiredBadges = screen.getAllByText("Required");
    expect(requiredBadges).toHaveLength(3); // emp-id, full-name, email
  });

  it("suggests automatic mappings based on column names", async () => {
    render(
      <ColumnMapping
        importColumns={mockImportColumns}
        targetShape={mockTargetShape}
        onMappingChange={mockOnMappingChange}
        onApplyMapping={mockOnApplyMapping}
      />
    );

    // Wait for automatic mapping suggestions to be applied
    await waitFor(() => {
      expect(mockOnMappingChange).toHaveBeenCalled();
    });

    // Check that suggested mappings were made
    const lastCall =
      mockOnMappingChange.mock.calls[mockOnMappingChange.mock.calls.length - 1];
    const mapping = lastCall[0];

    // Should suggest reasonable mappings based on exact matches
    expect(mapping["emp-id"]).toBe("id"); // ID field should map to id column
    expect(mapping["email"]).toBe("emailAddress"); // Email should map to emailAddress

    // The email field should map to emailAddress column
    expect(mapping["email"]).toBeDefined();
    expect(mapping["email"]).toBe("emailAddress");

    // All mapped columns should be valid import columns
    const mappedColumns = Object.values(mapping);
    mappedColumns.forEach(column => {
      expect(mockImportColumns).toContain(column);
    });

    // No duplicate column mappings
    const uniqueMappedColumns = new Set(mappedColumns);
    expect(mappedColumns.length).toBe(uniqueMappedColumns.size);
  });

  it("shows validation status for required fields", () => {
    render(
      <ColumnMapping
        importColumns={mockImportColumns}
        targetShape={mockTargetShape}
        onMappingChange={mockOnMappingChange}
        onApplyMapping={mockOnApplyMapping}
      />
    );

    // Should show required field mapping status
    expect(screen.getByText(/required fields mapped/)).toBeInTheDocument();
  });

  it("prevents applying mapping when required fields are not mapped", () => {
    const incompleteTargetShape: TargetShape = {
      ...mockTargetShape,
      fields: [
        {
          id: "unmappable-field",
          name: "Unmappable Field",
          type: "string",
          required: true,
        },
      ] as TargetField[],
    };

    render(
      <ColumnMapping
        importColumns={mockImportColumns}
        targetShape={incompleteTargetShape}
        onMappingChange={mockOnMappingChange}
        onApplyMapping={mockOnApplyMapping}
      />
    );

    const applyButton = screen.getByRole("button", { name: /apply mapping/i });
    expect(applyButton).toBeDisabled();
    expect(applyButton).toHaveTextContent("missing required fields");
  });

  it("shows unmapped columns warning", async () => {
    const smallTargetShape: TargetShape = {
      ...mockTargetShape,
      fields: [
        {
          id: "single-field",
          name: "Single Field",
          type: "string",
          required: false,
        },
      ] as TargetField[],
    };

    render(
      <ColumnMapping
        importColumns={mockImportColumns}
        targetShape={smallTargetShape}
        onMappingChange={mockOnMappingChange}
        onApplyMapping={mockOnApplyMapping}
      />
    );

    // Should show warning about unmapped columns
    await waitFor(() => {
      expect(screen.getByText("Unmapped Columns")).toBeInTheDocument();
    });
  });

  it("prevents duplicate column mappings", async () => {
    render(
      <ColumnMapping
        importColumns={["uniqueCol1", "uniqueCol2", "uniqueCol3"]}
        targetShape={{
          ...mockTargetShape,
          fields: [
            {
              id: "field1",
              name: "Field Alpha",
              type: "string",
              required: false,
            },
            {
              id: "field2",
              name: "Field Beta",
              type: "string",
              required: false,
            },
          ] as TargetField[],
        }}
        onMappingChange={mockOnMappingChange}
        onApplyMapping={mockOnApplyMapping}
      />
    );

    // Get dropdown triggers (there should be 2 for 2 fields)
    const triggers = screen.getAllByRole("combobox");
    expect(triggers).toHaveLength(2);

    // First trigger should have all columns available initially
    fireEvent.click(triggers[0]);
    await waitFor(() => {
      // Look for dropdown options within the dropdown content
      expect(screen.getAllByText("uniqueCol1").length).toBeGreaterThan(0);
      expect(screen.getAllByText("uniqueCol2").length).toBeGreaterThan(0);
      expect(screen.getAllByText("uniqueCol3").length).toBeGreaterThan(0);
    });

    // Close the first dropdown by clicking elsewhere
    fireEvent.click(document.body);
  });

  it("calls onApplyMapping when apply button is clicked", async () => {
    render(
      <ColumnMapping
        importColumns={mockImportColumns}
        targetShape={mockTargetShape}
        onMappingChange={mockOnMappingChange}
        onApplyMapping={mockOnApplyMapping}
      />
    );

    // Wait for auto-mapping to complete
    await waitFor(() => {
      const applyButton = screen.getByRole("button", {
        name: /apply mapping/i,
      });
      expect(applyButton).not.toBeDisabled();
    });

    const applyButton = screen.getByRole("button", { name: /apply mapping/i });
    fireEvent.click(applyButton);

    expect(mockOnApplyMapping).toHaveBeenCalledTimes(1);
  });

  it("updates mapping when dropdown selection changes", async () => {
    render(
      <ColumnMapping
        importColumns={["testCol", "anotherCol"]}
        targetShape={{
          ...mockTargetShape,
          fields: [
            {
              id: "testField",
              name: "Test Field",
              type: "string",
              required: false,
            },
          ] as TargetField[],
        }}
        onMappingChange={mockOnMappingChange}
        onApplyMapping={mockOnApplyMapping}
      />
    );

    // Wait for initial auto-mapping to complete
    await waitFor(() => {
      expect(mockOnMappingChange).toHaveBeenCalled();
    });

    // Clear the mock to ignore initial auto-mapping calls
    mockOnMappingChange.mockClear();

    // Open dropdown and select a different option
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    await waitFor(() => {
      // Look for "No mapping" option and click it to change the selection
      const noMappingOption = screen.getByText("No mapping");
      fireEvent.click(noMappingOption);
    });

    // Should have called onMappingChange with empty mapping
    await waitFor(() => {
      expect(mockOnMappingChange).toHaveBeenCalledWith({});
    });
  });
});
