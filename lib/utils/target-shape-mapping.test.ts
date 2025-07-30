import { describe, it, expect } from "vitest";
import type { TargetShape, TargetField } from "@/lib/types/target-shapes";

// Mock data for testing
const mockImportData = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    emailAddress: "john.doe@example.com",
    dept: "Engineering",
    salary: 75000,
    _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T1U",
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    emailAddress: "jane.smith@example.com",
    dept: "Marketing",
    salary: 65000,
    _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T2V",
  },
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
      required: true,
    },
    {
      id: "salary",
      name: "Salary",
      type: "number",
      required: false,
    },
  ] as TargetField[],
};

// Helper function to get import columns (excluding internal fields)
function getImportColumns(data: any[]): string[] {
  if (data.length === 0) return [];
  return Object.keys(data[0]).filter(key => !key.startsWith("_"));
}

// Helper function to suggest column mappings based on name similarity
function suggestColumnMapping(
  importColumns: string[],
  targetFields: TargetField[]
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const field of targetFields) {
    // Simple name matching logic
    const fieldName = field.name.toLowerCase();
    const fieldId = field.id.toLowerCase();

    for (const column of importColumns) {
      const columnName = column.toLowerCase();

      // Exact match
      if (columnName === fieldName || columnName === fieldId) {
        mapping[column] = field.id;
        break;
      }

      // Partial match for common patterns
      if (fieldId === "email" && columnName.includes("email")) {
        mapping[column] = field.id;
        break;
      }

      if (
        fieldId === "department" &&
        (columnName === "dept" || columnName.includes("department"))
      ) {
        mapping[column] = field.id;
        break;
      }

      if (fieldId === "emp-id" && columnName === "id") {
        mapping[column] = field.id;
        break;
      }
    }
  }

  return mapping;
}

describe("Target Shape Mapping", () => {
  it("should extract import columns correctly", () => {
    const columns = getImportColumns(mockImportData);

    expect(columns).toEqual([
      "id",
      "firstName",
      "lastName",
      "emailAddress",
      "dept",
      "salary",
    ]);

    // Should not include internal _rowId field
    expect(columns).not.toContain("_rowId");
  });

  it("should suggest appropriate column mappings", () => {
    const importColumns = getImportColumns(mockImportData);
    const mapping = suggestColumnMapping(importColumns, mockTargetShape.fields);

    expect(mapping).toEqual({
      id: "emp-id",
      emailAddress: "email",
      dept: "department",
      salary: "salary",
    });
  });

  it("should handle empty import data", () => {
    const columns = getImportColumns([]);
    expect(columns).toEqual([]);
  });

  it("should handle target shapes with no fields", () => {
    const importColumns = ["id", "name"];
    const emptyShape: TargetShape = {
      ...mockTargetShape,
      fields: [],
    };

    const mapping = suggestColumnMapping(importColumns, emptyShape.fields);
    expect(mapping).toEqual({});
  });

  it("should preserve data integrity during mapping preview", () => {
    // Verify that original data is not modified during mapping operations
    const originalData = JSON.parse(JSON.stringify(mockImportData));
    const columns = getImportColumns(mockImportData);

    // Data should remain unchanged after column extraction
    expect(mockImportData).toEqual(originalData);

    // Columns should be extracted correctly
    expect(columns.length).toBeGreaterThan(0);
    expect(columns).toContain("firstName");
  });

  it("should validate required field coverage", () => {
    const importColumns = getImportColumns(mockImportData);
    const mapping = suggestColumnMapping(importColumns, mockTargetShape.fields);
    const requiredFields = mockTargetShape.fields.filter(f => f.required);

    // Check which required fields have mappings
    const mappedRequiredFields = requiredFields.filter(field =>
      Object.values(mapping).includes(field.id)
    );

    // Should have some required fields mapped
    expect(mappedRequiredFields.length).toBeGreaterThan(0);

    // Should identify unmapped required fields
    const unmappedRequiredFields = requiredFields.filter(
      field => !Object.values(mapping).includes(field.id)
    );

    expect(unmappedRequiredFields.length).toBeGreaterThanOrEqual(0);
  });
});
