// Simple test to demonstrate row ID injection
import {
  injectRowIds,
  processImportedData,
  validateRowIds,
} from "./data-processing";

// Test data
const sampleData = [
  { firstName: "John", lastName: "Doe", email: "john@example.com" },
  { firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
  { firstName: "Bob", lastName: "Johnson", email: "bob@example.com" },
];

const dataWithExistingIds = [
  { id: "EMP001", firstName: "John", lastName: "Doe" },
  { id: "EMP002", firstName: "Jane", lastName: "Smith" },
];

console.log("=== Row ID Injection Examples ===");

// Test basic row ID injection
console.log("\n1. Basic Row ID Injection:");
const dataWithIds = injectRowIds(sampleData);
console.log("Original data:", sampleData);
console.log("Data with IDs:", dataWithIds);

// Test preserving existing IDs
console.log("\n2. Preserving Existing IDs:");
const dataWithPreservedIds = injectRowIds(dataWithExistingIds, true);
console.log("Original data with IDs:", dataWithExistingIds);
console.log("Data with preserved IDs:", dataWithPreservedIds);

// Test full data processing
console.log("\n3. Full Data Processing:");
const processedData = processImportedData(sampleData, {
  injectRowIds: true,
  preserveExistingId: false,
  addMetadata: true,
  source: "test-import",
});
console.log("Fully processed data:", processedData);

// Test validation
console.log("\n4. ID Validation:");
const validation = validateRowIds(dataWithIds);
console.log("Validation result:", validation);

// Example output:
// === Row ID Injection Examples ===
//
// 1. Basic Row ID Injection:
// Original data: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }, ...]
// Data with IDs: [{ id: 'EMP001', _rowId: 'cs_01H9X2K3L4M5N6P7Q8R9S0T1U', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }, ...]
//
// 2. Preserving Existing IDs:
// Original data with IDs: [{ id: 'EMP001', firstName: 'John', lastName: 'Doe' }, ...]
// Data with preserved IDs: [{ id: 'EMP001', _rowId: 'cs_01H9X2K3L4M5N6P7Q8R9S0T1U', firstName: 'John', lastName: 'Doe' }, ...]
//
// 3. Full Data Processing:
// Fully processed data: [{ id: 'EMP001', _rowId: 'cs_01H9X2K3L4M5N6P7Q8R9S0T1U', firstName: 'John', lastName: 'Doe', email: 'john@example.com', _metadata: { importedAt: '2024-01-15T10:30:00.000Z', source: 'test-import', originalIndex: 0, rowNumber: 1 } }, ...]
//
// 4. ID Validation:
// Validation result: { isValid: true, duplicates: [], missing: [] }
