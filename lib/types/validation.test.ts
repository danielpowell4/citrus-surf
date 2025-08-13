import { describe, it, expect } from "vitest";
import {
  ValidationRuleType,
  ValidationSeverity,
  ValidationStatus,
  ValidationError,
  ValidationWarning,
  ValidationResult,
  RowValidationMetadata,
  CellValidationMetadata,
  ValidationState,
  SuggestedFix,
  isValidationError,
  isValidationWarning,
  isValidationResult,
  isRowValidationMetadata,
  isCellValidationMetadata,
  createEmptyValidationState,
  createEmptyValidationResult,
  createRowMetadata,
  type TableRowWithValidation,
} from "./validation";

describe("Validation Types", () => {
  describe("Enums", () => {
    it("should have correct ValidationRuleType values", () => {
      expect(ValidationRuleType.REQUIRED).toBe("required");
      expect(ValidationRuleType.TYPE).toBe("type");
      expect(ValidationRuleType.ENUM).toBe("enum");
      expect(ValidationRuleType.LOOKUP).toBe("lookup");
      expect(ValidationRuleType.FORMAT).toBe("format");
      expect(ValidationRuleType.RANGE).toBe("range");
    });

    it("should have correct ValidationSeverity values", () => {
      expect(ValidationSeverity.ERROR).toBe("error");
      expect(ValidationSeverity.WARNING).toBe("warning");
    });

    it("should have correct ValidationStatus values", () => {
      expect(ValidationStatus.VALID).toBe("valid");
      expect(ValidationStatus.ERRORS).toBe("errors");
      expect(ValidationStatus.WARNINGS).toBe("warnings");
      expect(ValidationStatus.NOT_VALIDATED).toBe("not_validated");
    });
  });

  describe("SuggestedFix Interface", () => {
    it("should create valid SuggestedFix objects", () => {
      const fix: SuggestedFix = {
        action: "replace",
        description: "Replace with corrected value",
        newValue: "corrected_value",
        metadata: {
          confidence: 0.9,
          source: "fuzzy_match",
          context: { originalValue: "original" },
        },
      };

      expect(fix.action).toBe("replace");
      expect(fix.description).toBe("Replace with corrected value");
      expect(fix.newValue).toBe("corrected_value");
      expect(fix.metadata?.confidence).toBe(0.9);
      expect(fix.metadata?.source).toBe("fuzzy_match");
    });

    it("should work with minimal SuggestedFix", () => {
      const fix: SuggestedFix = {
        action: "mark_exception",
        description: "Mark as acceptable exception",
      };

      expect(fix.action).toBe("mark_exception");
      expect(fix.description).toBe("Mark as acceptable exception");
      expect(fix.newValue).toBeUndefined();
      expect(fix.metadata).toBeUndefined();
    });
  });

  describe("ValidationError Interface", () => {
    it("should create valid ValidationError objects", () => {
      const error: ValidationError = {
        ruleId: "required-field-001",
        ruleType: ValidationRuleType.REQUIRED,
        message: "Field is required but is empty",
        fieldName: "email",
        currentValue: "",
        suggestedFixes: [
          {
            action: "replace",
            description: "Enter a valid email address",
          },
        ],
        metadata: {
          confidence: 1.0,
          context: { fieldType: "email" },
        },
      };

      expect(error.ruleId).toBe("required-field-001");
      expect(error.ruleType).toBe(ValidationRuleType.REQUIRED);
      expect(error.message).toBe("Field is required but is empty");
      expect(error.fieldName).toBe("email");
      expect(error.currentValue).toBe("");
      expect(error.suggestedFixes).toHaveLength(1);
      expect(error.metadata?.confidence).toBe(1.0);
    });
  });

  describe("ValidationWarning Interface", () => {
    it("should create valid ValidationWarning objects", () => {
      const warning: ValidationWarning = {
        ruleId: "enum-case-mismatch-001",
        ruleType: ValidationRuleType.ENUM,
        message: "Value case doesn't match enum option",
        fieldName: "status",
        currentValue: "Active",
        suggestedFixes: [
          {
            action: "replace",
            description: "Change to 'active'",
            newValue: "active",
          },
        ],
      };

      expect(warning.ruleType).toBe(ValidationRuleType.ENUM);
      expect(warning.message).toBe("Value case doesn't match enum option");
      expect(warning.suggestedFixes[0].newValue).toBe("active");
    });
  });

  describe("ValidationResult Interface", () => {
    it("should create valid ValidationResult with errors", () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          {
            ruleId: "required-001",
            ruleType: ValidationRuleType.REQUIRED,
            message: "Name is required",
            fieldName: "name",
            currentValue: null,
            suggestedFixes: [],
          },
        ],
        warnings: [],
        metadata: {
          validatedAt: "2023-12-25T10:00:00Z",
          validationVersion: "1.0.0",
          duration: 15,
          rulesApplied: 5,
        },
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.metadata.validatedAt).toBe("2023-12-25T10:00:00Z");
      expect(result.metadata.duration).toBe(15);
    });

    it("should create valid ValidationResult with warnings only", () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          {
            ruleId: "format-001",
            ruleType: ValidationRuleType.FORMAT,
            message: "Phone format could be improved",
            fieldName: "phone",
            currentValue: "1234567890",
            suggestedFixes: [
              {
                action: "format",
                description: "Format as (123) 456-7890",
                newValue: "(123) 456-7890",
              },
            ],
          },
        ],
        metadata: {
          validatedAt: "2023-12-25T10:00:00Z",
          validationVersion: "1.0.0",
        },
      };

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].ruleType).toBe(ValidationRuleType.FORMAT);
    });
  });

  describe("RowValidationMetadata Interface", () => {
    it("should create valid RowValidationMetadata", () => {
      const metadata: RowValidationMetadata = {
        rowId: "row-123",
        hasErrors: true,
        hasWarnings: false,
        errorCount: 2,
        warningCount: 0,
        lastValidated: "2023-12-25T10:00:00Z",
        status: ValidationStatus.ERRORS,
        cells: {
          email: {
            rowId: "row-123",
            fieldName: "email",
            hasErrors: true,
            hasWarnings: false,
            errors: [],
            warnings: [],
            suggestedFixes: [],
            lastValidated: "2023-12-25T10:00:00Z",
          },
        },
        metadata: {
          rulesApplied: ["required-001", "type-001"],
        },
      };

      expect(metadata.rowId).toBe("row-123");
      expect(metadata.hasErrors).toBe(true);
      expect(metadata.status).toBe(ValidationStatus.ERRORS);
      expect(metadata.cells?.email.fieldName).toBe("email");
      expect(metadata.metadata?.rulesApplied).toContain("required-001");
    });
  });

  describe("CellValidationMetadata Interface", () => {
    it("should create valid CellValidationMetadata", () => {
      const metadata: CellValidationMetadata = {
        rowId: "row-123",
        fieldName: "email",
        hasErrors: true,
        hasWarnings: false,
        errors: [
          {
            ruleId: "required-001",
            ruleType: ValidationRuleType.REQUIRED,
            message: "Email is required",
            fieldName: "email",
            currentValue: "",
            suggestedFixes: [],
          },
        ],
        warnings: [],
        suggestedFixes: [
          {
            action: "replace",
            description: "Enter a valid email",
          },
        ],
        lastValidated: "2023-12-25T10:00:00Z",
        metadata: {
          skipped: false,
        },
      };

      expect(metadata.rowId).toBe("row-123");
      expect(metadata.fieldName).toBe("email");
      expect(metadata.errors).toHaveLength(1);
      expect(metadata.suggestedFixes).toHaveLength(1);
      expect(metadata.metadata?.skipped).toBe(false);
    });
  });

  describe("ValidationState Interface", () => {
    it("should create valid ValidationState", () => {
      const state: ValidationState = {
        isValidating: false,
        lastValidated: "2023-12-25T10:00:00Z",
        totalErrors: 5,
        totalWarnings: 3,
        validatedRows: 100,
        totalRows: 100,
        errorsByType: {
          [ValidationRuleType.REQUIRED]: 2,
          [ValidationRuleType.TYPE]: 1,
          [ValidationRuleType.ENUM]: 2,
          [ValidationRuleType.LOOKUP]: 0,
          [ValidationRuleType.FORMAT]: 0,
          [ValidationRuleType.RANGE]: 0,
        },
        warningsByType: {
          [ValidationRuleType.REQUIRED]: 0,
          [ValidationRuleType.TYPE]: 0,
          [ValidationRuleType.ENUM]: 1,
          [ValidationRuleType.LOOKUP]: 1,
          [ValidationRuleType.FORMAT]: 1,
          [ValidationRuleType.RANGE]: 0,
        },
        errorsByField: {
          email: 2,
          name: 1,
          status: 2,
        },
        warningsByField: {
          phone: 1,
          category: 2,
        },
        progress: 1.0,
        summary: {
          score: 0.92,
          validRowPercentage: 95,
          topErrorTypes: [
            {
              type: ValidationRuleType.REQUIRED,
              count: 2,
              percentage: 40,
            },
          ],
          problematicFields: [
            {
              fieldName: "email",
              errorCount: 2,
              warningCount: 0,
            },
          ],
        },
      };

      expect(state.totalErrors).toBe(5);
      expect(state.totalWarnings).toBe(3);
      expect(state.progress).toBe(1.0);
      expect(state.summary?.score).toBe(0.92);
      expect(state.summary?.topErrorTypes[0].type).toBe(ValidationRuleType.REQUIRED);
    });
  });

  describe("TableRowWithValidation Interface", () => {
    it("should extend basic table row with validation metadata", () => {
      const row: TableRowWithValidation = {
        id: "row-123",
        name: "John Doe",
        email: "john@example.com",
        _validationMetadata: {
          rowId: "row-123",
          hasErrors: false,
          hasWarnings: true,
          errorCount: 0,
          warningCount: 1,
          lastValidated: "2023-12-25T10:00:00Z",
          status: ValidationStatus.WARNINGS,
        },
      };

      expect(row.id).toBe("row-123");
      expect(row.name).toBe("John Doe");
      expect(row._validationMetadata?.status).toBe(ValidationStatus.WARNINGS);
      expect(row._validationMetadata?.warningCount).toBe(1);
    });
  });
});

describe("Type Guards", () => {
  describe("isValidationError", () => {
    it("should return true for valid ValidationError", () => {
      const error: ValidationError = {
        ruleId: "test-001",
        ruleType: ValidationRuleType.REQUIRED,
        message: "Test error",
        fieldName: "test",
        currentValue: null,
        suggestedFixes: [],
      };

      expect(isValidationError(error)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isValidationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
      expect(isValidationError("string")).toBe(false);
      expect(isValidationError({})).toBe(false);
      expect(isValidationError({ ruleId: "test" })).toBe(false);
    });

    it("should return false for object missing required properties", () => {
      const invalidError = {
        ruleId: "test-001",
        message: "Test error",
        // missing ruleType, fieldName, currentValue, suggestedFixes
      };

      expect(isValidationError(invalidError)).toBe(false);
    });
  });

  describe("isValidationWarning", () => {
    it("should return true for valid ValidationWarning", () => {
      const warning: ValidationWarning = {
        ruleId: "test-001",
        ruleType: ValidationRuleType.FORMAT,
        message: "Test warning",
        fieldName: "test",
        currentValue: "test",
        suggestedFixes: [],
      };

      expect(isValidationWarning(warning)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isValidationWarning(null)).toBe(false);
      expect(isValidationWarning({})).toBe(false);
    });
  });

  describe("isValidationResult", () => {
    it("should return true for valid ValidationResult", () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        metadata: {
          validatedAt: "2023-12-25T10:00:00Z",
          validationVersion: "1.0.0",
        },
      };

      expect(isValidationResult(result)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isValidationResult(null)).toBe(false);
      expect(isValidationResult({ isValid: true })).toBe(false);
      expect(isValidationResult({ isValid: true, errors: [] })).toBe(false);
    });
  });

  describe("isRowValidationMetadata", () => {
    it("should return true for valid RowValidationMetadata", () => {
      const metadata: RowValidationMetadata = {
        rowId: "row-123",
        hasErrors: false,
        hasWarnings: false,
        errorCount: 0,
        warningCount: 0,
        lastValidated: "2023-12-25T10:00:00Z",
        status: ValidationStatus.VALID,
      };

      expect(isRowValidationMetadata(metadata)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isRowValidationMetadata(null)).toBe(false);
      expect(isRowValidationMetadata({ rowId: "test" })).toBe(false);
    });
  });

  describe("isCellValidationMetadata", () => {
    it("should return true for valid CellValidationMetadata", () => {
      const metadata: CellValidationMetadata = {
        rowId: "row-123",
        fieldName: "test",
        hasErrors: false,
        hasWarnings: false,
        errors: [],
        warnings: [],
        suggestedFixes: [],
        lastValidated: "2023-12-25T10:00:00Z",
      };

      expect(isCellValidationMetadata(metadata)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isCellValidationMetadata(null)).toBe(false);
      expect(isCellValidationMetadata({ rowId: "test" })).toBe(false);
    });
  });
});

describe("Validation Utilities", () => {
  describe("createEmptyValidationState", () => {
    it("should create a valid empty ValidationState", () => {
      const state = createEmptyValidationState();

      expect(state.isValidating).toBe(false);
      expect(state.totalErrors).toBe(0);
      expect(state.totalWarnings).toBe(0);
      expect(state.validatedRows).toBe(0);
      expect(state.totalRows).toBe(0);
      expect(state.progress).toBe(0);
      
      // Check all error types are initialized to 0
      expect(state.errorsByType[ValidationRuleType.REQUIRED]).toBe(0);
      expect(state.errorsByType[ValidationRuleType.TYPE]).toBe(0);
      expect(state.errorsByType[ValidationRuleType.ENUM]).toBe(0);
      expect(state.errorsByType[ValidationRuleType.LOOKUP]).toBe(0);
      expect(state.errorsByType[ValidationRuleType.FORMAT]).toBe(0);
      expect(state.errorsByType[ValidationRuleType.RANGE]).toBe(0);

      // Check all warning types are initialized to 0
      expect(state.warningsByType[ValidationRuleType.REQUIRED]).toBe(0);
      expect(state.warningsByType[ValidationRuleType.TYPE]).toBe(0);
      expect(state.warningsByType[ValidationRuleType.ENUM]).toBe(0);
      expect(state.warningsByType[ValidationRuleType.LOOKUP]).toBe(0);
      expect(state.warningsByType[ValidationRuleType.FORMAT]).toBe(0);
      expect(state.warningsByType[ValidationRuleType.RANGE]).toBe(0);

      expect(Object.keys(state.errorsByField)).toHaveLength(0);
      expect(Object.keys(state.warningsByField)).toHaveLength(0);
    });
  });

  describe("createEmptyValidationResult", () => {
    it("should create a valid empty ValidationResult", () => {
      const result = createEmptyValidationResult();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.metadata.validationVersion).toBe("1.0.0");
      expect(new Date(result.metadata.validatedAt)).toBeInstanceOf(Date);
    });
  });

  describe("createRowMetadata", () => {
    it("should create RowValidationMetadata from ValidationResult with errors", () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          {
            ruleId: "test-001",
            ruleType: ValidationRuleType.REQUIRED,
            message: "Test error",
            fieldName: "test",
            currentValue: null,
            suggestedFixes: [],
          },
          {
            ruleId: "test-002",
            ruleType: ValidationRuleType.TYPE,
            message: "Type error",
            fieldName: "age",
            currentValue: "not a number",
            suggestedFixes: [],
          },
        ],
        warnings: [],
        metadata: {
          validatedAt: "2023-12-25T10:00:00Z",
          validationVersion: "1.0.0",
        },
      };

      const rowMetadata = createRowMetadata("row-123", result);

      expect(rowMetadata.rowId).toBe("row-123");
      expect(rowMetadata.hasErrors).toBe(true);
      expect(rowMetadata.hasWarnings).toBe(false);
      expect(rowMetadata.errorCount).toBe(2);
      expect(rowMetadata.warningCount).toBe(0);
      expect(rowMetadata.status).toBe(ValidationStatus.ERRORS);
      expect(rowMetadata.lastValidated).toBe("2023-12-25T10:00:00Z");
    });

    it("should create RowValidationMetadata from ValidationResult with warnings", () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          {
            ruleId: "test-001",
            ruleType: ValidationRuleType.FORMAT,
            message: "Format warning",
            fieldName: "phone",
            currentValue: "1234567890",
            suggestedFixes: [],
          },
        ],
        metadata: {
          validatedAt: "2023-12-25T10:00:00Z",
          validationVersion: "1.0.0",
        },
      };

      const rowMetadata = createRowMetadata("row-456", result);

      expect(rowMetadata.hasErrors).toBe(false);
      expect(rowMetadata.hasWarnings).toBe(true);
      expect(rowMetadata.errorCount).toBe(0);
      expect(rowMetadata.warningCount).toBe(1);
      expect(rowMetadata.status).toBe(ValidationStatus.WARNINGS);
    });

    it("should create RowValidationMetadata from valid ValidationResult", () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        metadata: {
          validatedAt: "2023-12-25T10:00:00Z",
          validationVersion: "1.0.0",
        },
      };

      const rowMetadata = createRowMetadata("row-789", result);

      expect(rowMetadata.hasErrors).toBe(false);
      expect(rowMetadata.hasWarnings).toBe(false);
      expect(rowMetadata.errorCount).toBe(0);
      expect(rowMetadata.warningCount).toBe(0);
      expect(rowMetadata.status).toBe(ValidationStatus.VALID);
    });
  });
});