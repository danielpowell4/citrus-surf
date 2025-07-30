import React from "react";
import type { TargetShape, TargetField } from "@/lib/types/target-shapes";
import type {
  SimpleColumnDef,
  ColumnMeta,
} from "@/lib/utils/column-transformer";
import type { TableRow } from "@/lib/features/tableSlice";

/**
 * Generates column definitions from a target shape
 */
export function generateColumnsFromTargetShape(
  targetShape: TargetShape,
  columnOrder: string[],
  data: TableRow[]
): SimpleColumnDef<TableRow>[] {
  // Create a field lookup for quick access
  const fieldLookup = new Map(
    targetShape.fields.map(field => [field.name, field])
  );

  return columnOrder.map(columnKey => {
    const field = fieldLookup.get(columnKey);

    if (!field) {
      // Fallback for columns not found in target shape
      return generateDefaultColumn(columnKey, data);
    }

    return generateColumnFromTargetField(field, data);
  });
}

/**
 * Generates a default target shape from imported data
 */
export function generateDefaultTargetShape(data: TableRow[]): TargetShape {
  if (data.length === 0) {
    return {
      id: "default",
      name: "Default Shape",
      description: "Auto-generated from imported data",
      fields: [],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Get all keys from the first row, excluding vendor-prefixed keys
  const keys = Object.keys(data[0]).filter(key => !key.startsWith("_"));

  const fields: TargetField[] = keys.map((key, index) => {
    const sampleValue = data[0][key];

    // Infer field type from sample data
    let type: TargetField["type"] = "string";
    if (typeof sampleValue === "number") {
      type = Number.isInteger(sampleValue) ? "integer" : "number";
    } else if (typeof sampleValue === "boolean") {
      type = "boolean";
    } else if (sampleValue instanceof Date) {
      type = "date";
    } else if (typeof sampleValue === "string") {
      // More strict date detection - only if it contains date-like patterns
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
        /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
      ];

      const looksLikeDate =
        datePatterns.some(pattern => pattern.test(sampleValue)) &&
        !isNaN(Date.parse(sampleValue));

      if (looksLikeDate) {
        type = "date";
      }

      // Check for currency patterns
      if (
        key.toLowerCase().includes("salary") ||
        key.toLowerCase().includes("price") ||
        key.toLowerCase().includes("cost") ||
        key.toLowerCase().includes("amount")
      ) {
        type = "currency";
      }
    }

    // Create a formatted name from the key
    const name = key
      .replace(/([A-Z])/g, " $1") // Add space before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();

    return {
      id: key,
      name: key, // Use the original key as the name to match data structure
      displayName: name,
      type,
      required: false,
      description: `Auto-generated field for ${name}`,
      order: index,
    };
  });

  return {
    id: "default",
    name: "Default Shape",
    description: "Auto-generated from imported data",
    fields,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates a column definition from a target field
 */
function generateColumnFromTargetField(
  field: TargetField,
  data: TableRow[]
): SimpleColumnDef<TableRow> {
  const meta: ColumnMeta = {
    sortType: "natural",
    editable: getEditableConfig(field, data),
  };

  // Special handling for progress fields
  if (
    field.type === "number" &&
    field.name.toLowerCase().includes("progress")
  ) {
    return {
      accessorKey: field.name as keyof TableRow,
      header: field.displayName || field.name,
      size: 120,
      cell: (info: any) => (
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${info.getValue()}%` }}
          />
        </div>
      ),
      meta: {
        editable: false,
      },
    };
  }

  return {
    accessorKey: field.name as keyof TableRow,
    header: field.displayName || field.name,
    size: field.name.toLowerCase() === "id" ? 80 : undefined,
    meta,
  };
}

/**
 * Generates a default column definition for fields not found in target shape
 */
function generateDefaultColumn(
  columnKey: string,
  data: TableRow[]
): SimpleColumnDef<TableRow> {
  // Create a formatted header from the key
  const header = columnKey
    .replace(/([A-Z])/g, " $1") // Add space before capitals
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();

  // Determine column type from sample data
  const sampleValue = data.length > 0 ? data[0][columnKey] : null;
  let meta: ColumnMeta = {
    sortType: "natural",
    editable: {
      type: "text",
      placeholder: `Enter ${header.toLowerCase()}`,
      maxLength: 100,
    },
  };

  // Special handling for common field types
  if (typeof sampleValue === "number") {
    meta.editable = {
      type: "number",
      precision: "integer",
    };
  }

  return {
    accessorKey: columnKey as keyof TableRow,
    header,
    size: columnKey.toLowerCase() === "id" ? 80 : undefined,
    meta,
  };
}

/**
 * Gets editable configuration for a target field
 */
function getEditableConfig(
  field: TargetField,
  data: TableRow[]
): ColumnMeta["editable"] {
  switch (field.type) {
    case "string":
      // Check if it's a select field based on validation rules or data patterns
      if (field.validation?.enum) {
        return {
          type: "select",
          options: field.validation.enum.map(value => ({
            value,
            label: value,
          })),
        };
      }

      // Check for status/department fields and extract unique values from data
      if (
        field.name.toLowerCase().includes("status") ||
        field.name.toLowerCase().includes("department")
      ) {
        const uniqueValues = Array.from(
          new Set(data.map(row => row[field.name]).filter(Boolean))
        ).map(value => ({
          value: String(value),
          label: String(value),
        }));

        if (uniqueValues.length > 0 && uniqueValues.length <= 20) {
          // Only use select for reasonable number of options
          return {
            type: "select",
            options: uniqueValues,
          };
        }
      }

      return {
        type: "text",
        placeholder: `Enter ${field.displayName || field.name}`,
        maxLength: field.validation?.maxLength || 100,
      };

    case "integer":
    case "number":
      return {
        type: "number",
        min: field.validation?.min,
        max: field.validation?.max,
        precision: field.type === "integer" ? "integer" : undefined,
      };

    case "currency":
      return {
        type: "number",
        min: 0,
        precision: "currency",
        currency: field.validation?.currency || "USD",
      };

    case "date":
      return {
        type: "date",
        format: field.validation?.format || "YYYY-MM-DD",
      };

    case "boolean":
      return {
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
      };

    default:
      return {
        type: "text",
        placeholder: `Enter ${field.displayName || field.name}`,
        maxLength: 100,
      };
  }
}
