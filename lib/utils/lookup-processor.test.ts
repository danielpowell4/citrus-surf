/**
 * Tests for Lookup Data Processing Integration
 *
 * Comprehensive test suite for the lookup processor that integrates the matching engine
 * with the data processing pipeline for automatic lookups during import and real-time updates.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LookupProcessor,
  lookupProcessor,
  hasLookupFields,
  getLookupFields,
} from "./lookup-processor";
import type { TargetShape, LookupField } from "../types/target-shapes";
import type { TableRow } from "../features/tableSlice";

// Mock the reference data manager
const mockReferenceData = {
  "departments.csv": [
    {
      dept_id: "ENG001",
      dept_name: "Engineering",
      manager: "Sarah Johnson",
      budget: 1000000,
    },
    {
      dept_id: "MKT001",
      dept_name: "Marketing",
      manager: "Mike Chen",
      budget: 500000,
    },
    {
      dept_id: "HR001",
      dept_name: "Human Resources",
      manager: "Lisa Wong",
      budget: 300000,
    },
    {
      dept_id: "FIN001",
      dept_name: "Finance",
      manager: "David Kim",
      budget: 750000,
    },
  ],
  "products.csv": [
    {
      sku: "LAPTOP001",
      name: "MacBook Pro 16-inch",
      category: "Electronics",
      price: 2499,
    },
    {
      sku: "PHONE001",
      name: "iPhone 15 Pro Max",
      category: "Electronics",
      price: 1199,
    },
    { sku: "TABLET001", name: "iPad Air", category: "Electronics", price: 599 },
  ],
};

vi.mock("./reference-data-manager", () => ({
  referenceDataManager: {
    getReferenceDataRows: vi.fn((filename: string) => {
      return (
        mockReferenceData[filename as keyof typeof mockReferenceData] || null
      );
    }),
  },
}));

describe("LookupProcessor", () => {
  let processor: LookupProcessor;
  let sampleData: TableRow[];
  let targetShapeWithLookups: TargetShape;
  let targetShapeWithoutLookups: TargetShape;

  beforeEach(() => {
    processor = new LookupProcessor();

    sampleData = [
      {
        _rowId: "cs_row1",
        employee_id: "EMP001",
        name: "John Doe",
        department: "Engineering",
        product: "MacBook Pro 16-inch",
      },
      {
        _rowId: "cs_row2",
        employee_id: "EMP002",
        name: "Jane Smith",
        department: "Marketing",
        product: "iPhone 15 Pro Max",
      },
      {
        _rowId: "cs_row3",
        employee_id: "EMP003",
        name: "Bob Wilson",
        department: "Human Resources",
        product: "iPad Air",
      },
    ];

    targetShapeWithLookups = {
      id: "employee-lookup-shape",
      name: "Employee with Lookups",
      description: "Employee data with department and product lookups",
      version: "1.0.0",
      fields: [
        {
          id: "employee_id",
          name: "employee_id",
          type: "string",
          required: true,
        },
        {
          id: "name",
          name: "name",
          type: "string",
          required: true,
        },
        {
          id: "department",
          name: "department",
          type: "lookup",
          required: true,
          referenceFile: "departments.csv",
          match: {
            on: "dept_name",
            get: "dept_id",
          },
          alsoGet: [
            { name: "department_manager", source: "manager" },
            { name: "department_budget", source: "budget" },
          ],
          smartMatching: {
            enabled: true,
            confidence: 0.7,
          },
          onMismatch: "warning",
        },
        {
          id: "product",
          name: "product",
          type: "lookup",
          required: false,
          referenceFile: "products.csv",
          match: {
            on: "name",
            get: "sku",
          },
          alsoGet: [
            { name: "product_category", source: "category" },
            { name: "product_price", source: "price" },
          ],
          smartMatching: {
            enabled: true,
            confidence: 0.8,
          },
          onMismatch: "null",
        },
      ],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    targetShapeWithoutLookups = {
      id: "simple-shape",
      name: "Simple Employee",
      description: "Basic employee data without lookups",
      version: "1.0.0",
      fields: [
        {
          id: "employee_id",
          name: "employee_id",
          type: "string",
          required: true,
        },
        {
          id: "name",
          name: "name",
          type: "string",
          required: true,
        },
      ],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };
  });

  describe("Basic Functionality", () => {
    it("should create a new processor instance", () => {
      expect(processor).toBeInstanceOf(LookupProcessor);
    });

    it("should have required methods", () => {
      expect(typeof processor.processDataWithLookups).toBe("function");
      expect(typeof processor.processSingleLookup).toBe("function");
      expect(typeof processor.processLookupUpdate).toBe("function");
      expect(typeof processor.batchProcessLookups).toBe("function");
      expect(typeof processor.getLookupFieldStats).toBe("function");
    });
  });

  describe("Data Processing with Lookups", () => {
    it("should process data with lookup fields successfully", async () => {
      const result = await processor.processDataWithLookups(
        sampleData,
        targetShapeWithLookups
      );

      expect(result.data).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalRows).toBe(3);
      expect(result.stats.totalFields).toBe(2); // 2 lookup fields
      expect(result.stats.exactMatches).toBeGreaterThan(0);
      expect(result.performance.totalTime).toBeGreaterThan(0);

      // Check that lookup values are updated
      const firstRow = result.data[0];
      expect(firstRow.department).toBe("ENG001"); // Should be replaced with dept_id
      expect(firstRow.department_manager).toBe("Sarah Johnson"); // Derived field
      expect(firstRow.department_budget).toBe(1000000); // Derived field

      expect(firstRow.product).toBe("LAPTOP001"); // Should be replaced with SKU
      expect(firstRow.product_category).toBe("Electronics"); // Derived field
      expect(firstRow.product_price).toBe(2499); // Derived field
    });

    it("should handle data without lookup fields", async () => {
      const result = await processor.processDataWithLookups(
        sampleData,
        targetShapeWithoutLookups
      );

      expect(result.data).toEqual(sampleData); // Data should be unchanged
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalFields).toBe(0);
      expect(result.stats.exactMatches).toBe(0);
      expect(result.stats.successRate).toBe(1);
    });

    it("should handle processing options correctly", async () => {
      const progressUpdates: number[] = [];
      const onProgress = (processed: number, total: number) => {
        progressUpdates.push(Math.floor((processed / total) * 100));
      };

      const result = await processor.processDataWithLookups(
        sampleData,
        targetShapeWithLookups,
        {
          minConfidence: 0.9,
          maxFuzzyMatches: 5,
          processDerivedFields: false,
          onProgress,
          continueOnError: true,
        }
      );

      expect(result.data).toHaveLength(3);
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Derived fields should not be processed
      expect(result.data[0]).not.toHaveProperty("department_manager");
      expect(result.data[0]).not.toHaveProperty("product_category");
    });

    it("should collect errors for unmatched values", async () => {
      const dataWithUnknownValues = [
        {
          _rowId: "cs_row1",
          employee_id: "EMP001",
          name: "John Doe",
          department: "Unknown Department",
          product: "Unknown Product",
        },
      ];

      const result = await processor.processDataWithLookups(
        dataWithUnknownValues,
        targetShapeWithLookups
      );

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe("no_match");
      expect(result.errors[0].fieldName).toBe("department");
      expect(result.errors[0].inputValue).toBe("Unknown Department");
    });

    it("should handle fuzzy matches correctly", async () => {
      const dataWithTypos = [
        {
          _rowId: "cs_row1",
          employee_id: "EMP001",
          name: "John Doe",
          department: "Enginering", // Typo in Engineering
          product: "MacBook Pro",
        },
      ];

      const result = await processor.processDataWithLookups(
        dataWithTypos,
        targetShapeWithLookups,
        {
          minConfidence: 0.6,
        }
      );

      expect(result.data[0].department).toBe("ENG001"); // Should match Engineering
      expect(result.stats.fuzzyMatches).toBeGreaterThan(0);
    });
  });

  describe("Single Lookup Processing", () => {
    it("should process a single lookup successfully", async () => {
      const lookupField = targetShapeWithLookups.fields.find(
        f => f.name === "department"
      ) as LookupField;

      const result = await processor.processSingleLookup(
        "Engineering",
        lookupField,
        "test_row"
      );

      expect(result.matched).toBe(true);
      expect(result.matchType).toBe("exact");
      expect(result.matchedValue).toBe("ENG001");
      expect(result.derivedValues).toEqual({
        department_manager: "Sarah Johnson",
        department_budget: 1000000,
      });
    });

    it("should handle missing reference data", async () => {
      const lookupFieldWithMissingRef: LookupField = {
        id: "missing_ref",
        name: "missing_ref",
        type: "lookup",
        required: false,
        referenceFile: "nonexistent.csv",
        match: { on: "name", get: "id" },
        smartMatching: { enabled: false, confidence: 0.7 },
        onMismatch: "null",
      };

      await expect(
        processor.processSingleLookup(
          "test",
          lookupFieldWithMissingRef,
          "test_row"
        )
      ).rejects.toThrow("Reference data not found");
    });
  });

  describe("Real-time Lookup Updates", () => {
    it("should process real-time lookup update successfully", async () => {
      const lookupField = targetShapeWithLookups.fields.find(
        f => f.name === "department"
      ) as LookupField;
      const rowData = sampleData[0];

      const result = await processor.processLookupUpdate(
        "Marketing",
        lookupField,
        rowData
      );

      expect(result.success).toBe(true);
      expect(result.updatedRow.department).toBe("MKT001");
      expect(result.updatedRow.department_manager).toBe("Mike Chen");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should handle failed lookup updates", async () => {
      const lookupField = targetShapeWithLookups.fields.find(
        f => f.name === "department"
      ) as LookupField;
      const rowData = sampleData[0];

      const result = await processor.processLookupUpdate(
        "Unknown Department",
        lookupField,
        rowData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("No match found");
      expect(result.updatedRow).toEqual(rowData); // Should be unchanged
    });
  });

  describe("Batch Processing", () => {
    it("should process batch lookup updates", async () => {
      const lookupField = targetShapeWithLookups.fields.find(
        f => f.name === "department"
      ) as LookupField;
      const updates = [
        {
          rowId: "cs_row1",
          fieldName: "department",
          value: "Finance",
          field: lookupField,
          rowData: sampleData[0],
        },
        {
          rowId: "cs_row2",
          fieldName: "department",
          value: "Human Resources",
          field: lookupField,
          rowData: sampleData[1],
        },
      ];

      const progressUpdates: number[] = [];
      const onProgress = (processed: number, _total: number) => {
        progressUpdates.push(processed);
      };

      const results = await processor.batchProcessLookups(updates, onProgress);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].updatedRow.department).toBe("FIN001");
      expect(results[1].success).toBe(true);
      expect(results[1].updatedRow.department).toBe("HR001");
      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe("Statistics and Utilities", () => {
    it("should provide lookup field statistics", () => {
      const stats = processor.getLookupFieldStats(targetShapeWithLookups);

      expect(stats.totalLookupFields).toBe(2);
      expect(stats.totalDerivedFields).toBe(4); // 2 fields from dept + 2 from product
      expect(stats.lookupFields).toHaveLength(2);
      expect(stats.lookupFields[0].name).toBe("department");
      expect(stats.lookupFields[0].derivedFieldCount).toBe(2);
    });

    it("should provide empty statistics for shapes without lookups", () => {
      const stats = processor.getLookupFieldStats(targetShapeWithoutLookups);

      expect(stats.totalLookupFields).toBe(0);
      expect(stats.totalDerivedFields).toBe(0);
      expect(stats.lookupFields).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed input data gracefully", async () => {
      const malformedData = [
        { _rowId: "cs_row1" }, // Missing required fields
        null as any, // Null row
        { _rowId: "cs_row2", department: undefined }, // Undefined lookup value
      ];

      const result = await processor.processDataWithLookups(
        malformedData,
        targetShapeWithLookups,
        { continueOnError: true }
      );

      expect(result.data).toHaveLength(3);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should stop processing on error when continueOnError is false", async () => {
      const malformedData = [{ _rowId: "cs_row1", department: "Unknown" }];

      await expect(
        processor.processDataWithLookups(
          malformedData,
          targetShapeWithLookups,
          {
            continueOnError: false,
          }
        )
      ).rejects.toThrow();
    });
  });

  describe("Performance Testing", () => {
    it("should handle large datasets efficiently", async () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        _rowId: `cs_row${i}`,
        employee_id: `EMP${i.toString().padStart(3, "0")}`,
        name: `Employee ${i}`,
        department: i % 2 === 0 ? "Engineering" : "Marketing",
        product: i % 3 === 0 ? "MacBook Pro 16-inch" : "iPhone 15 Pro Max",
      })) as TableRow[];

      const startTime = performance.now();
      const result = await processor.processDataWithLookups(
        largeDataset,
        targetShapeWithLookups
      );
      const endTime = performance.now();

      expect(result.data).toHaveLength(1000);
      expect(result.stats.successRate).toBeGreaterThan(0.8);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.performance.throughput).toBeGreaterThan(50); // At least 50 ops/second
    });
  });

  describe("Global Utilities", () => {
    it("should detect if target shape has lookup fields", () => {
      expect(hasLookupFields(targetShapeWithLookups)).toBe(true);
      expect(hasLookupFields(targetShapeWithoutLookups)).toBe(false);
    });

    it("should extract lookup fields from target shape", () => {
      const lookupFields = getLookupFields(targetShapeWithLookups);
      expect(lookupFields).toHaveLength(2);
      expect(lookupFields[0].type).toBe("lookup");
      expect(lookupFields[1].type).toBe("lookup");

      const noLookupFields = getLookupFields(targetShapeWithoutLookups);
      expect(noLookupFields).toHaveLength(0);
    });

    it("should use global processor instance", () => {
      expect(lookupProcessor).toBeInstanceOf(LookupProcessor);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle mixed exact and fuzzy matches in same dataset", async () => {
      const mixedData = [
        {
          _rowId: "cs_row1",
          employee_id: "EMP001",
          name: "John Doe",
          department: "Engineering", // Exact match
          product: "MacBook Pro 16-inch", // Exact match
        },
        {
          _rowId: "cs_row2",
          employee_id: "EMP002",
          name: "Jane Smith",
          department: "Marketting", // Fuzzy match (typo)
          product: "iPhone 15 Pro", // Fuzzy match (partial)
        },
      ];

      const result = await processor.processDataWithLookups(
        mixedData,
        targetShapeWithLookups
      );

      expect(result.data).toHaveLength(2);
      expect(result.stats.exactMatches).toBeGreaterThan(0);
      expect(result.stats.fuzzyMatches).toBeGreaterThan(0);
      expect(result.stats.successRate).toBeGreaterThan(0.5);
    });

    it("should handle multiple derived fields correctly", async () => {
      const result = await processor.processDataWithLookups(
        [sampleData[0]],
        targetShapeWithLookups
      );

      const processedRow = result.data[0];

      // Check department derived fields
      expect(processedRow.department_manager).toBe("Sarah Johnson");
      expect(processedRow.department_budget).toBe(1000000);

      // Check product derived fields
      expect(processedRow.product_category).toBe("Electronics");
      expect(processedRow.product_price).toBe(2499);

      expect(result.stats.derivedColumns).toBe(4); // 2 from dept + 2 from product
    });

    it("should preserve original row structure and metadata", async () => {
      const result = await processor.processDataWithLookups(
        sampleData,
        targetShapeWithLookups
      );

      result.data.forEach((row, index) => {
        // Original fields should be preserved
        expect(row._rowId).toBe(sampleData[index]._rowId);
        expect(row.employee_id).toBe(sampleData[index].employee_id);
        expect(row.name).toBe(sampleData[index].name);
      });
    });
  });
});
