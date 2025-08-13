import { describe, it, expect } from "vitest";
import { analyzeDataForTargetShape } from "./data-analysis";
import type { EnumField } from "@/lib/types/target-shapes";

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

    // JavaScript true/false boolean values should be detected as boolean
    expect(isActiveField?.type).toBe("boolean");
    // String "yes"/"no" values should be detected as boolean
    expect(hasPermissionField?.type).toBe("boolean");
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

describe("Data Analysis - Enum Options Population", () => {
  it("should detect status field as enum and populate options", () => {
    const testData = [
      { id: 1, status: "active", name: "John Doe" },
      { id: 2, status: "inactive", name: "Jane Smith" },
      { id: 3, status: "pending", name: "Bob Johnson" },
      { id: 4, status: "active", name: "Alice Brown" },
      { id: 5, status: "inactive", name: "Charlie Wilson" },
    ];

    const result = analyzeDataForTargetShape(testData);
    
    const statusField = result.suggestedFields.find(field => field.name === "status");
    expect(statusField).toBeDefined();
    expect(statusField!.type).toBe("enum");

    const enumField = statusField as EnumField;
    expect(enumField.options).toBeDefined();
    expect(enumField.options).toHaveLength(3);
    
    // Check that options are sorted alphabetically
    expect(enumField.options[0]).toEqual({ value: "active", label: "Active" });
    expect(enumField.options[1]).toEqual({ value: "inactive", label: "Inactive" });
    expect(enumField.options[2]).toEqual({ value: "pending", label: "Pending" });
  });

  it("should detect department field as enum with proper labels", () => {
    const testData = [
      { employee_id: 1, department: "engineering", salary: 80000 },
      { employee_id: 2, department: "marketing", salary: 70000 },
      { employee_id: 3, department: "hr", salary: 65000 },
      { employee_id: 4, department: "engineering", salary: 85000 },
      { employee_id: 5, department: "sales", salary: 75000 },
    ];

    const result = analyzeDataForTargetShape(testData);
    
    const deptField = result.suggestedFields.find(field => field.name === "department");
    expect(deptField).toBeDefined();
    expect(deptField!.type).toBe("enum");

    const enumField = deptField as EnumField;
    expect(enumField.options).toHaveLength(4);
    
    // Check that labels are properly formatted
    const hrOption = enumField.options.find(opt => opt.value === "hr");
    expect(hrOption).toEqual({ value: "hr", label: "Hr" });
    
    const engineeringOption = enumField.options.find(opt => opt.value === "engineering");
    expect(engineeringOption).toEqual({ value: "engineering", label: "Engineering" });
  });

  it("should handle snake_case and camelCase values in enum labels", () => {
    const testData = [
      { priority: "high_priority", category: "userInterface" },
      { priority: "low_priority", category: "backEnd" },
      { priority: "medium_priority", category: "database" },
      { priority: "high_priority", category: "userInterface" },
    ];

    const result = analyzeDataForTargetShape(testData);
    
    const priorityField = result.suggestedFields.find(field => field.name === "priority") as EnumField;
    expect(priorityField.type).toBe("enum");
    
    const highPriorityOption = priorityField.options.find(opt => opt.value === "high_priority");
    expect(highPriorityOption!.label).toBe("High Priority");
    
    const categoryField = result.suggestedFields.find(field => field.name === "category") as EnumField;
    expect(categoryField.type).toBe("enum");
    
    const uiOption = categoryField.options.find(opt => opt.value === "userInterface");
    expect(uiOption!.label).toBe("User Interface");
  });

  it("should handle empty and null values in enum detection", () => {
    const testData = [
      { status: "active", level: "beginner" },
      { status: "inactive", level: "intermediate" },
      { status: "", level: null },
      { status: "pending", level: "advanced" },
      { status: null, level: "beginner" },
    ];

    const result = analyzeDataForTargetShape(testData);
    
    const statusField = result.suggestedFields.find(field => field.name === "status") as EnumField;
    expect(statusField.type).toBe("enum");
    expect(statusField.options).toHaveLength(3); // Should exclude empty/null values
    
    const levelField = result.suggestedFields.find(field => field.name === "level") as EnumField;
    expect(levelField.type).toBe("enum");
    expect(levelField.options).toHaveLength(3); // Should exclude null values
  });
});
