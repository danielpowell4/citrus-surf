import { describe, it, expect } from "vitest";
import type { TableRow } from "../features/tableSlice";
import {
  ValidationRuleType,
  ValidationStatus,
  createRowMetadata,
  createEmptyValidationResult,
} from "./validation";

describe("Validation Integration with TableRow", () => {
  it("should extend TableRow with validation metadata", () => {
    const row: TableRow = {
      id: "row-123",
      name: "John Doe",
      email: "john@example.com",
      _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T1U",
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

  it("should work with TableRow without validation metadata", () => {
    const row: TableRow = {
      id: "row-456",
      name: "Jane Smith",
      email: "jane@example.com",
    };

    expect(row.id).toBe("row-456");
    expect(row._validationMetadata).toBeUndefined();
  });

  it("should create validation metadata and attach to TableRow", () => {
    const validationResult = createEmptyValidationResult();
    validationResult.isValid = false;
    validationResult.errors = [
      {
        ruleId: "required-001",
        ruleType: ValidationRuleType.REQUIRED,
        message: "Email is required",
        fieldName: "email",
        currentValue: "",
        suggestedFixes: [],
      },
    ];

    const rowMetadata = createRowMetadata("row-789", validationResult);

    const row: TableRow = {
      id: "row-789",
      name: "Bob Wilson",
      email: "",
      _validationMetadata: rowMetadata,
    };

    expect(row._validationMetadata?.hasErrors).toBe(true);
    expect(row._validationMetadata?.errorCount).toBe(1);
    expect(row._validationMetadata?.status).toBe(ValidationStatus.ERRORS);
  });

  it("should handle arrays of TableRow with mixed validation states", () => {
    const rows: TableRow[] = [
      {
        id: "row-1",
        name: "Valid User",
        email: "valid@example.com",
        _validationMetadata: {
          rowId: "row-1",
          hasErrors: false,
          hasWarnings: false,
          errorCount: 0,
          warningCount: 0,
          lastValidated: "2023-12-25T10:00:00Z",
          status: ValidationStatus.VALID,
        },
      },
      {
        id: "row-2",
        name: "Warning User",
        email: "warning@example.com",
        _validationMetadata: {
          rowId: "row-2",
          hasErrors: false,
          hasWarnings: true,
          errorCount: 0,
          warningCount: 1,
          lastValidated: "2023-12-25T10:00:00Z",
          status: ValidationStatus.WARNINGS,
        },
      },
      {
        id: "row-3",
        name: "",
        email: "",
        _validationMetadata: {
          rowId: "row-3",
          hasErrors: true,
          hasWarnings: false,
          errorCount: 2,
          warningCount: 0,
          lastValidated: "2023-12-25T10:00:00Z",
          status: ValidationStatus.ERRORS,
        },
      },
      {
        id: "row-4",
        name: "Not Validated",
        email: "not.validated@example.com",
        // No validation metadata
      },
    ];

    expect(rows).toHaveLength(4);

    // Valid row
    expect(rows[0]._validationMetadata?.status).toBe(ValidationStatus.VALID);

    // Warning row
    expect(rows[1]._validationMetadata?.status).toBe(ValidationStatus.WARNINGS);
    expect(rows[1]._validationMetadata?.warningCount).toBe(1);

    // Error row
    expect(rows[2]._validationMetadata?.status).toBe(ValidationStatus.ERRORS);
    expect(rows[2]._validationMetadata?.errorCount).toBe(2);

    // Not validated row
    expect(rows[3]._validationMetadata).toBeUndefined();
  });

  it("should support filtering rows by validation status", () => {
    const rows: TableRow[] = [
      {
        id: "row-1",
        _validationMetadata: {
          rowId: "row-1",
          hasErrors: false,
          hasWarnings: false,
          errorCount: 0,
          warningCount: 0,
          lastValidated: "2023-12-25T10:00:00Z",
          status: ValidationStatus.VALID,
        },
      },
      {
        id: "row-2",
        _validationMetadata: {
          rowId: "row-2",
          hasErrors: true,
          hasWarnings: false,
          errorCount: 1,
          warningCount: 0,
          lastValidated: "2023-12-25T10:00:00Z",
          status: ValidationStatus.ERRORS,
        },
      },
      {
        id: "row-3",
        _validationMetadata: {
          rowId: "row-3",
          hasErrors: false,
          hasWarnings: true,
          errorCount: 0,
          warningCount: 1,
          lastValidated: "2023-12-25T10:00:00Z",
          status: ValidationStatus.WARNINGS,
        },
      },
    ];

    // Filter rows with errors
    const errorRows = rows.filter(
      row => row._validationMetadata?.hasErrors === true
    );
    expect(errorRows).toHaveLength(1);
    expect(errorRows[0].id).toBe("row-2");

    // Filter rows with warnings
    const warningRows = rows.filter(
      row => row._validationMetadata?.hasWarnings === true
    );
    expect(warningRows).toHaveLength(1);
    expect(warningRows[0].id).toBe("row-3");

    // Filter valid rows
    const validRows = rows.filter(
      row => row._validationMetadata?.status === ValidationStatus.VALID
    );
    expect(validRows).toHaveLength(1);
    expect(validRows[0].id).toBe("row-1");

    // Filter rows without validation
    const unvalidatedRows = rows.filter(row => !row._validationMetadata);
    expect(unvalidatedRows).toHaveLength(0);
  });
});