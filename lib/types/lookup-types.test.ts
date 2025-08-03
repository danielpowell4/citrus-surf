import { describe, it, expect } from "vitest";
import type {
  FieldType,
  TargetField,
  LookupField,
  LookupMatch,
  SmartMatching,
  DerivedField,
} from "./target-shapes";

describe("Lookup Types", () => {
  describe("FieldType", () => {
    it("should include lookup as a valid field type", () => {
      const fieldType: FieldType = "lookup";
      expect(fieldType).toBe("lookup");
    });

    it("should maintain backward compatibility with existing field types", () => {
      const fieldTypes: FieldType[] = [
        "string",
        "number",
        "integer",
        "decimal",
        "boolean",
        "date",
        "datetime",
        "email",
        "phone",
        "url",
        "currency",
        "percentage",
        "enum",
        "array",
        "object",
        "lookup",
      ];
      
      expect(fieldTypes).toContain("lookup");
      expect(fieldTypes).toContain("string");
      expect(fieldTypes).toContain("number");
    });
  });

  describe("LookupMatch", () => {
    it("should require on and get properties", () => {
      const match: LookupMatch = {
        on: "department_name",
        get: "department_id",
      };
      
      expect(match.on).toBe("department_name");
      expect(match.get).toBe("department_id");
    });

    it("should allow optional show property", () => {
      const match: LookupMatch = {
        on: "department_name",
        get: "department_id",
        show: "department_display_name",
      };
      
      expect(match.show).toBe("department_display_name");
    });
  });

  describe("SmartMatching", () => {
    it("should require enabled and confidence properties", () => {
      const smartMatching: SmartMatching = {
        enabled: true,
        confidence: 0.8,
      };
      
      expect(smartMatching.enabled).toBe(true);
      expect(smartMatching.confidence).toBe(0.8);
    });

    it("should accept confidence values between 0 and 1", () => {
      const configs: SmartMatching[] = [
        { enabled: true, confidence: 0 },
        { enabled: true, confidence: 0.5 },
        { enabled: true, confidence: 1 },
      ];
      
      configs.forEach(config => {
        expect(config.confidence).toBeGreaterThanOrEqual(0);
        expect(config.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("DerivedField", () => {
    it("should require name and source properties", () => {
      const derivedField: DerivedField = {
        name: "department_code",
        source: "code",
      };
      
      expect(derivedField.name).toBe("department_code");
      expect(derivedField.source).toBe("code");
    });

    it("should allow optional type property", () => {
      const derivedField: DerivedField = {
        name: "department_code",
        source: "code",
        type: "string",
      };
      
      expect(derivedField.type).toBe("string");
    });
  });

  describe("LookupField", () => {
    it("should extend TargetField with lookup-specific properties", () => {
      const lookupField: LookupField = {
        id: "dept_lookup",
        name: "Department",
        type: "lookup",
        required: true,
        referenceFile: "departments.csv",
        match: {
          on: "department_name",
          get: "department_id",
        },
        smartMatching: {
          enabled: true,
          confidence: 0.8,
        },
        onMismatch: "error",
      };
      
      // Test TargetField properties
      expect(lookupField.id).toBe("dept_lookup");
      expect(lookupField.name).toBe("Department");
      expect(lookupField.type).toBe("lookup");
      expect(lookupField.required).toBe(true);
      
      // Test lookup-specific properties
      expect(lookupField.referenceFile).toBe("departments.csv");
      expect(lookupField.match.on).toBe("department_name");
      expect(lookupField.match.get).toBe("department_id");
      expect(lookupField.smartMatching.enabled).toBe(true);
      expect(lookupField.onMismatch).toBe("error");
    });

    it("should support all onMismatch options", () => {
      const onMismatchOptions: Array<"error" | "warning" | "null"> = [
        "error",
        "warning", 
        "null",
      ];
      
      onMismatchOptions.forEach(option => {
        const field: Partial<LookupField> = {
          onMismatch: option,
        };
        expect(field.onMismatch).toBe(option);
      });
    });

    it("should support optional properties", () => {
      const lookupField: LookupField = {
        id: "dept_lookup",
        name: "Department",
        type: "lookup",
        required: true,
        referenceFile: "departments.csv",
        match: {
          on: "department_name",
          get: "department_id",
          show: "department_display_name",
        },
        alsoGet: [
          {
            name: "department_code",
            source: "code",
            type: "string",
          },
          {
            name: "department_manager",
            source: "manager_name",
          },
        ],
        smartMatching: {
          enabled: true,
          confidence: 0.8,
        },
        onMismatch: "warning",
        showReferenceInfo: true,
        allowReferenceEdit: false,
        description: "Department lookup with smart matching",
        validation: [],
        transformation: [],
      };
      
      expect(lookupField.alsoGet).toHaveLength(2);
      expect(lookupField.showReferenceInfo).toBe(true);
      expect(lookupField.allowReferenceEdit).toBe(false);
      expect(lookupField.description).toBe("Department lookup with smart matching");
    });

    it("should be assignable to TargetField", () => {
      const lookupField: LookupField = {
        id: "test",
        name: "Test",
        type: "lookup",
        required: false,
        referenceFile: "test.csv",
        match: { on: "col1", get: "col2" },
        smartMatching: { enabled: false, confidence: 0.5 },
        onMismatch: "null",
      };
      
      // This should compile without errors
      const targetField: TargetField = lookupField;
      expect(targetField.type).toBe("lookup");
    });
  });

  describe("Type Serialization", () => {
    it("should serialize and deserialize lookup field correctly", () => {
      const lookupField: LookupField = {
        id: "dept_lookup",
        name: "Department",
        type: "lookup",
        required: true,
        referenceFile: "departments.csv",
        match: {
          on: "department_name",
          get: "department_id",
        },
        smartMatching: {
          enabled: true,
          confidence: 0.8,
        },
        onMismatch: "error",
      };
      
      const serialized = JSON.stringify(lookupField);
      const deserialized = JSON.parse(serialized) as LookupField;
      
      expect(deserialized.type).toBe("lookup");
      expect(deserialized.referenceFile).toBe("departments.csv");
      expect(deserialized.match.on).toBe("department_name");
      expect(deserialized.smartMatching.enabled).toBe(true);
    });
  });
});