import { describe, it, expect } from "vitest";
import { generateColumnsFromTargetShape } from "./column-generator";
import type { TargetShape, EnumField } from "@/lib/types/target-shapes";
import type { TableRow } from "@/lib/features/tableSlice";

describe("Column Generator - Enum Field Support", () => {
  it("should generate select dropdown for enum fields", () => {
    const enumField: EnumField = {
      id: "status-field-id",
      name: "status",
      displayName: "Status",
      type: "enum",
      required: true,
      description: "Employee status",
      validation: [],
      transformation: [],
      options: [
        { value: "active", label: "Active Employee" },
        { value: "inactive", label: "Inactive Employee" },
        { value: "pending", label: "Pending Review" },
      ],
      unique: false,
    };

    const targetShape: TargetShape = {
      id: "test-shape",
      name: "Test Shape",
      description: "Test target shape with enum field",
      fields: [enumField],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const testData: TableRow[] = [
      { id: "1", status: "active" },
      { id: "2", status: "inactive" },
      { id: "3", status: "pending" },
    ];

    const columns = generateColumnsFromTargetShape(
      targetShape,
      ["status"],
      testData
    );

    expect(columns).toHaveLength(1);
    
    const statusColumn = columns[0];
    expect(statusColumn.accessorKey).toBe("status");
    expect(statusColumn.header).toBe("Status");
    expect(statusColumn.meta?.editable).toEqual({
      type: "select",
      options: [
        { value: "active", label: "Active Employee" },
        { value: "inactive", label: "Inactive Employee" },
        { value: "pending", label: "Pending Review" },
      ],
    });
  });

  it("should handle enum fields with empty options", () => {
    const enumField: EnumField = {
      id: "empty-enum-field-id",
      name: "category",
      displayName: "Category",
      type: "enum",
      required: false,
      description: "Category field with no options",
      validation: [],
      transformation: [],
      options: [],
      unique: false,
    };

    const targetShape: TargetShape = {
      id: "test-shape",
      name: "Test Shape",
      description: "Test target shape with empty enum field",
      fields: [enumField],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const testData: TableRow[] = [
      { id: "1", category: "" },
    ];

    const columns = generateColumnsFromTargetShape(
      targetShape,
      ["category"],
      testData
    );

    expect(columns).toHaveLength(1);
    
    const categoryColumn = columns[0];
    expect(categoryColumn.meta?.editable).toEqual({
      type: "select",
      options: [],
    });
  });

  it("should handle enum fields with undefined options", () => {
    const enumField: EnumField = {
      id: "undefined-enum-field-id",
      name: "priority",
      displayName: "Priority",
      type: "enum",
      required: false,
      description: "Priority field with undefined options",
      validation: [],
      transformation: [],
      // options property is intentionally missing
      unique: false,
    } as EnumField;

    const targetShape: TargetShape = {
      id: "test-shape",
      name: "Test Shape",
      description: "Test target shape with undefined enum options",
      fields: [enumField],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const testData: TableRow[] = [
      { id: "1", priority: "" },
    ];

    const columns = generateColumnsFromTargetShape(
      targetShape,
      ["priority"],
      testData
    );

    expect(columns).toHaveLength(1);
    
    const priorityColumn = columns[0];
    expect(priorityColumn.meta?.editable).toEqual({
      type: "select",
      options: [],
    });
  });
});