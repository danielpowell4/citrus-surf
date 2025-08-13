import { describe, it, expect } from "vitest";
import {
  generateSmartColumnName,
  generateSmartDescription,
  generateLookupPreview,
} from "./smart-column-naming";
import type { LookupField, DerivedField } from "@/lib/types/target-shapes";

describe("Smart Column Naming", () => {
  describe("generateSmartColumnName", () => {
    it("should generate contextual names for derived fields", () => {
      const lookupField = "department";
      const derivedField: DerivedField = { name: "", source: "manager" };

      const result = generateSmartColumnName(
        lookupField,
        derivedField,
        "manager"
      );
      expect(result).toBe("department_manager");
    });

    it("should use existing name if provided", () => {
      const lookupField = "department";
      const derivedField: DerivedField = {
        name: "dept_head",
        source: "manager",
      };

      const result = generateSmartColumnName(
        lookupField,
        derivedField,
        "manager"
      );
      expect(result).toBe("dept_head");
    });

    it("should handle cases where source already contains context", () => {
      const lookupField = "product";
      const derivedField: DerivedField = { name: "", source: "product_price" };

      const result = generateSmartColumnName(
        lookupField,
        derivedField,
        "product_price"
      );
      expect(result).toBe("product_price");
    });
  });

  describe("generateSmartDescription", () => {
    it("should generate contextual descriptions", () => {
      const lookupField = "department";
      const derivedField: DerivedField = { name: "manager", source: "manager" };

      const result = generateSmartDescription(lookupField, derivedField);
      expect(result).toBe("Manager responsible for this department");
    });

    it("should handle budget fields", () => {
      const lookupField = "department";
      const derivedField: DerivedField = { name: "budget", source: "budget" };

      const result = generateSmartDescription(lookupField, derivedField);
      expect(result).toBe("Budget allocated to this department");
    });

    it("should include reference file name when provided", () => {
      const lookupField = "department";
      const derivedField: DerivedField = {
        name: "unknown_field",
        source: "unknown_field",
      };

      const result = generateSmartDescription(
        lookupField,
        derivedField,
        "departments.csv"
      );
      expect(result).toBe("unknown_field from departments.csv reference data");
    });
  });

  describe("type inference", () => {
    it("should correctly infer types from sample values", () => {
      const lookupField: LookupField = {
        id: "test",
        name: "test",
        displayName: "Test",
        type: "lookup",
        required: false,
        referenceFile: "test.csv",
        match: { sourceColumn: "name", targetColumn: "code" },
        alsoGet: [
          { name: "", source: "manager", targetFieldName: "manager" },
          { name: "", source: "budget", targetFieldName: "budget" },
          { name: "", source: "count", targetFieldName: "count" },
          { name: "", source: "email", targetFieldName: "email" },
          {
            name: "",
            source: "fake_date_string",
            targetFieldName: "fake_date_string",
          },
        ],
        smartMatching: { enabled: true, threshold: 0.8 },
        onMismatch: "warning",
        showReferenceInfo: true,
        allowReferenceEdit: false,
        order: 0,
      };

      const referenceData = [
        {
          name: "Engineering",
          code: "ENG001",
          manager: "Sarah Johnson", // Should be 'string'
          budget: 500000, // Should be 'integer'
          count: 25, // Should be 'integer'
          email: "sarah@company.com", // Should be 'email'
          fake_date_string: "Sample text 3", // Should be 'string' (not date!)
        },
      ];

      const preview = generateLookupPreview(lookupField, referenceData);

      expect(preview.derivedColumns[0].type).toBe("string"); // manager
      expect(preview.derivedColumns[1].type).toBe("integer"); // budget
      expect(preview.derivedColumns[2].type).toBe("integer"); // count
      expect(preview.derivedColumns[3].type).toBe("email"); // email
      expect(preview.derivedColumns[4].type).toBe("string"); // fake_date_string
    });
  });

  describe("generateLookupPreview", () => {
    it("should generate preview with smart naming", () => {
      const lookupField: LookupField = {
        id: "dept-lookup",
        name: "department",
        displayName: "Department",
        type: "lookup",
        required: false,
        referenceFile: "departments.csv",
        match: {
          sourceColumn: "dept_name",
          targetColumn: "dept_code",
        },
        alsoGet: [
          { name: "", source: "manager", targetFieldName: "manager" },
          { name: "", source: "budget", targetFieldName: "budget" },
        ],
        smartMatching: { enabled: true, threshold: 0.8 },
        onMismatch: "warning",
        showReferenceInfo: true,
        allowReferenceEdit: false,
        order: 0,
      };

      const referenceData = [
        {
          dept_name: "Engineering",
          dept_code: "ENG001",
          manager: "Sarah Johnson",
          budget: 500000,
        },
      ];

      const preview = generateLookupPreview(lookupField, referenceData);

      expect(preview.lookupColumn.name).toBe("department");
      expect(preview.lookupColumn.example).toBe("ENG001");

      expect(preview.derivedColumns).toHaveLength(2);
      expect(preview.derivedColumns[0].name).toBe("department_manager");
      expect(preview.derivedColumns[0].example).toBe("Sarah Johnson");
      expect(preview.derivedColumns[1].name).toBe("department_budget");
      expect(preview.derivedColumns[1].example).toBe("$500,000");
      expect(preview.derivedColumns[1].type).toBe("integer");
    });
  });
});
