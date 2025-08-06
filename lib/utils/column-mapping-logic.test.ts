import { describe, it, expect } from "vitest";
import type { TargetField } from "@/lib/types/target-shapes";

// Extract the mapping logic for testing
function suggestColumnMapping(
  importColumns: string[],
  targetFields: TargetField[]
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const field of targetFields) {
    const fieldName = field.name.toLowerCase();
    const fieldId = field.id.toLowerCase();

    for (const column of importColumns) {
      const columnName = column.toLowerCase();

      // Exact match
      if (columnName === fieldName || columnName === fieldId) {
        mapping[field.id] = column;
        break;
      }

      // Partial match for common patterns
      if (fieldId.includes("email") && columnName.includes("email")) {
        mapping[field.id] = column;
        break;
      }

      if (fieldId.includes("name") && columnName.includes("name")) {
        mapping[field.id] = column;
        break;
      }

      if (fieldId.includes("id") && columnName === "id") {
        mapping[field.id] = column;
        break;
      }

      // Department variations
      if (
        fieldName.includes("department") &&
        (columnName === "dept" || columnName.includes("department"))
      ) {
        mapping[field.id] = column;
        break;
      }
    }
  }

  return mapping;
}

function validateMapping(
  mapping: Record<string, string>,
  targetFields: TargetField[]
): {
  requiredFieldsCovered: boolean;
  unmappedRequiredFields: TargetField[];
  mappedRequiredFields: TargetField[];
} {
  const requiredFields = targetFields.filter(f => f.required);
  const mappedRequiredFields = requiredFields.filter(f => mapping[f.id]);
  const unmappedRequiredFields = requiredFields.filter(f => !mapping[f.id]);

  return {
    requiredFieldsCovered: unmappedRequiredFields.length === 0,
    unmappedRequiredFields,
    mappedRequiredFields,
  };
}

function applyMapping(
  data: any[],
  mapping: Record<string, string>,
  targetFields: TargetField[]
): any[] {
  return data.map(row => {
    const newRow: any = { _rowId: row._rowId }; // Preserve internal ID

    // Apply column mappings
    Object.entries(mapping).forEach(([targetFieldId, sourceColumn]) => {
      const targetField = targetFields.find(f => f.id === targetFieldId);
      if (targetField && row[sourceColumn] !== undefined) {
        newRow[targetField.name] = row[sourceColumn];
      }
    });

    return newRow;
  });
}

// Test data
const mockImportColumns = [
  "id",
  "firstName",
  "lastName",
  "emailAddress",
  "dept",
  "salary",
];

const mockTargetFields: TargetField[] = [
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
];

const mockData = [
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

describe("Column Mapping Logic", () => {
  it("suggests appropriate column mappings", () => {
    const mapping = suggestColumnMapping(mockImportColumns, mockTargetFields);

    expect(mapping).toEqual({
      "emp-id": "id",
      "full-name": "firstName",
      email: "emailAddress",
      department: "dept",
      salary: "salary",
    });
  });

  it("validates mapping completeness for required fields", () => {
    const completeMapping = {
      "emp-id": "id",
      "full-name": "firstName",
      email: "emailAddress",
    };

    const validation = validateMapping(completeMapping, mockTargetFields);

    expect(validation.requiredFieldsCovered).toBe(true);
    expect(validation.unmappedRequiredFields).toHaveLength(0);
    expect(validation.mappedRequiredFields).toHaveLength(3);
  });

  it("identifies missing required field mappings", () => {
    const incompleteMapping = {
      "emp-id": "id",
      // Missing 'full-name' and 'email' mappings
    };

    const validation = validateMapping(incompleteMapping, mockTargetFields);

    expect(validation.requiredFieldsCovered).toBe(false);
    expect(validation.unmappedRequiredFields).toHaveLength(2);
    expect(validation.mappedRequiredFields).toHaveLength(1);
  });

  it("applies mapping to transform data correctly", () => {
    const mapping = {
      "emp-id": "id",
      "full-name": "firstName",
      email: "emailAddress",
      department: "dept",
    };

    const transformedData = applyMapping(mockData, mapping, mockTargetFields);

    expect(transformedData).toHaveLength(2);
    expect(transformedData[0]).toEqual({
      _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T1U",
      "Employee ID": 1,
      "Full Name": "John",
      Email: "john.doe@example.com",
      Department: "Engineering",
    });
    expect(transformedData[1]).toEqual({
      _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T2V",
      "Employee ID": 2,
      "Full Name": "Jane",
      Email: "jane.smith@example.com",
      Department: "Marketing",
    });
  });

  it("preserves internal row IDs during transformation", () => {
    const mapping = { "emp-id": "id" };
    const transformedData = applyMapping(mockData, mapping, mockTargetFields);

    expect(transformedData[0]._rowId).toBe("cs_01H9X2K3L4M5N6P7Q8R9S0T1U");
    expect(transformedData[1]._rowId).toBe("cs_01H9X2K3L4M5N6P7Q8R9S0T2V");
  });

  it("handles empty mappings gracefully", () => {
    const emptyMapping = {};
    const transformedData = applyMapping(
      mockData,
      emptyMapping,
      mockTargetFields
    );

    expect(transformedData).toHaveLength(2);
    expect(transformedData[0]).toEqual({
      _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T1U",
    });
  });

  it("handles missing source columns gracefully", () => {
    const mapping = {
      "emp-id": "nonexistentColumn",
      email: "emailAddress",
    };

    const transformedData = applyMapping(mockData, mapping, mockTargetFields);

    expect(transformedData[0]).toEqual({
      _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T1U",
      Email: "john.doe@example.com",
      // 'Employee ID' should not be present due to missing source column
    });
  });

  it("suggests mappings for complex field name patterns", () => {
    const complexColumns = [
      "user_id",
      "full_name",
      "email_address",
      "department_name",
    ];
    const complexFields: TargetField[] = [
      { id: "user-id", name: "User ID", type: "string", required: true },
      { id: "name", name: "Name", type: "string", required: true },
      { id: "email", name: "Email", type: "email", required: true },
      { id: "department", name: "Department", type: "string", required: false },
    ];

    const mapping = suggestColumnMapping(complexColumns, complexFields);

    expect(mapping["name"]).toBe("full_name");
    expect(mapping["email"]).toBe("email_address");
    expect(mapping["department"]).toBe("department_name");
  });
});
