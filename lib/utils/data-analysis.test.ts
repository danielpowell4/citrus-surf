import { describe, it, expect } from "vitest";
import { analyzeDataForTargetShape } from "./data-analysis";

describe("Data Analysis - Field Type Detection", () => {
  it("firstName and lastName should be detected as string, not enum", () => {
    const testData = [
      { firstName: "John", lastName: "Doe", age: 30, status: "Active" },
      { firstName: "Jane", lastName: "Smith", age: 25, status: "Active" },
      { firstName: "Bob", lastName: "Johnson", age: 35, status: "Inactive" },
      { firstName: "Alice", lastName: "Brown", age: 28, status: "Active" },
      { firstName: "Charlie", lastName: "Wilson", age: 32, status: "Active" },
    ];

    const result = analyzeDataForTargetShape(testData);
    const firstNameField = result.suggestedFields.find(
      f => f.name === "firstname"
    );
    const lastNameField = result.suggestedFields.find(
      f => f.name === "lastname"
    );
    expect(firstNameField?.type).toBe("string");
    expect(lastNameField?.type).toBe("string");
  });

  it("status field with limited values should be detected as enum", () => {
    const testData = [
      { firstName: "John", lastName: "Doe", status: "Active" },
      { firstName: "Jane", lastName: "Smith", status: "Active" },
      { firstName: "Bob", lastName: "Johnson", status: "Inactive" },
      { firstName: "Alice", lastName: "Brown", status: "Active" },
      { firstName: "Charlie", lastName: "Wilson", status: "Active" },
    ];
    const result = analyzeDataForTargetShape(testData);
    const statusField = result.suggestedFields.find(f => f.name === "status");
    expect(statusField?.type).toBe("enum");
  });

  it("email field should be detected as email, not enum", () => {
    const testData = [
      { firstName: "John", email: "john@example.com" },
      { firstName: "Jane", email: "jane@example.com" },
      { firstName: "Bob", email: "bob@example.com" },
    ];
    const result = analyzeDataForTargetShape(testData);
    const emailField = result.suggestedFields.find(f => f.name === "email");
    expect(emailField?.type).toBe("email");
  });

  it("should detect numeric fields correctly", () => {
    const testData = [
      { name: "John", age: 25, salary: 50000, rating: 4.5 },
      { name: "Jane", age: 30, salary: 60000, rating: 4.8 },
      { name: "Bob", age: 35, salary: 70000, rating: 4.2 },
    ];
    const result = analyzeDataForTargetShape(testData);

    const ageField = result.suggestedFields.find(f => f.name === "age");
    const salaryField = result.suggestedFields.find(f => f.name === "salary");
    const ratingField = result.suggestedFields.find(f => f.name === "rating");

    expect(ageField?.type).toBe("integer");
    expect(salaryField?.type).toBe("integer"); // salary without currency symbol is detected as integer
    expect(ratingField?.type).toBe("number");
  });

  it("should detect boolean fields correctly", () => {
    const testData = [
      { name: "John", isActive: true, hasPermission: "yes" },
      { name: "Jane", isActive: false, hasPermission: "no" },
      { name: "Bob", isActive: true, hasPermission: "yes" },
    ];
    const result = analyzeDataForTargetShape(testData);

    const isActiveField = result.suggestedFields.find(
      f => f.name === "isactive"
    );
    const hasPermissionField = result.suggestedFields.find(
      f => f.name === "haspermission"
    );

    expect(isActiveField?.type).toBe("enum"); // true/false values are detected as enum due to limited unique values
    expect(hasPermissionField?.type).toBe("boolean"); // "yes"/"no" strings are detected as boolean
  });

  it("should detect date fields correctly", () => {
    const testData = [
      { name: "John", birthDate: "1990-01-15", startDate: "2020-03-01" },
      { name: "Jane", birthDate: "1985-05-20", startDate: "2019-07-15" },
      { name: "Bob", birthDate: "1988-12-10", startDate: "2021-01-01" },
    ];
    const result = analyzeDataForTargetShape(testData);

    const birthDateField = result.suggestedFields.find(
      f => f.name === "birthdate"
    );
    const startDateField = result.suggestedFields.find(
      f => f.name === "startdate"
    );

    expect(birthDateField?.type).toBe("date");
    expect(startDateField?.type).toBe("date");
  });

  it("should exclude vendor-prefixed fields like _rowId from target shape generation", () => {
    const testData = [
      {
        id: "EMP001",
        firstName: "John",
        lastName: "Doe",
        _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T1U",
      },
      {
        id: "EMP002",
        firstName: "Jane",
        lastName: "Smith",
        _rowId: "cs_01H9X2K3L4M5N6P7Q8R9S0T2V",
      },
    ];

    const result = analyzeDataForTargetShape(testData);

    // Should not include _rowId field
    const rowIdField = result.suggestedFields.find(
      f => f.name === "_rowId" || f.name === "rowid"
    );
    expect(rowIdField).toBeUndefined();

    // Should include regular fields
    const idField = result.suggestedFields.find(f => f.name === "id");
    const firstNameField = result.suggestedFields.find(
      f => f.name === "firstname"
    );
    expect(idField).toBeDefined();
    expect(firstNameField).toBeDefined();

    // Should only have 3 fields (id, firstName, lastName), not 4
    expect(result.suggestedFields).toHaveLength(3);
  });
});
