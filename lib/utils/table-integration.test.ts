// Simple test to demonstrate table integration with row IDs
import { injectRowIds } from "./data-processing";

// Simulate imported data
const importedData = [
  { firstName: "John", lastName: "Doe", email: "john@example.com" },
  { firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
  { firstName: "Bob", lastName: "Johnson", email: "bob@example.com" },
];

// Process data with row IDs
const dataWithRowIds = injectRowIds(importedData);

console.log("=== Table Integration with Row IDs ===");

// Simulate TanStack Table row structure
const tableRows = dataWithRowIds.map((row, index) => ({
  id: row.id, // This is what TanStack Table uses for row identification
  original: row, // Original data
  index,
}));

console.log("\n1. Table Row Structure:");
tableRows.forEach((row, index) => {
  console.log(`Row ${index}:`);
  console.log(`  - row.id: ${row.id}`);
  console.log(`  - row.original.id: ${row.original.id}`);
  console.log(`  - row.original.firstName: ${row.original.firstName}`);
});

// Simulate row selection (TanStack Table uses row.id for selection)
const rowSelection: Record<string, boolean> = {};
tableRows.forEach((row, index) => {
  if (index % 2 === 0) {
    // Select even rows
    rowSelection[row.id] = true;
  }
});

console.log("\n2. Row Selection (using row.id):");
console.log("Selected rows:", Object.keys(rowSelection));

// Simulate cell editing (uses row.original.id for editing state)
const editingCell = {
  rowId: tableRows[0].original.id,
  columnId: "firstName" as const,
};

console.log("\n3. Cell Editing State:");
console.log("Editing cell:", editingCell);

// Simulate finding a row for updates (table slice uses row.id)
const findRowForUpdate = (rowId: string) => {
  return dataWithRowIds.findIndex(row => row.id === rowId);
};

console.log("\n4. Row Lookup for Updates:");
const firstRowId = tableRows[0].id;
const rowIndex = findRowForUpdate(firstRowId);
console.log(`Row ID: ${firstRowId}`);
console.log(`Found at index: ${rowIndex}`);

// Example output:
// === Table Integration with Row IDs ===
//
// 1. Table Row Structure:
// Row 0:
//   - row.id: row_01H9X2K3L4M5N6P7Q8R9S0T1U
//   - row.original.id: row_01H9X2K3L4M5N6P7Q8R9S0T1U
//   - row.original.firstName: John
// Row 1:
//   - row.id: row_01H9X2K3L4M5N6P7Q8R9S0T1U
//   - row.original.id: row_01H9X2K3L4M5N6P7Q8R9S0T1U
//   - row.original.firstName: Jane
//
// 2. Row Selection (using row.id):
// Selected rows: ['row_01H9X2K3L4M5N6P7Q8R9S0T1U', 'row_01H9X2K3L4M5N6P7Q8R9S0T1U']
//
// 3. Cell Editing State:
// Editing cell: { rowId: 'row_01H9X2K3L4M5N6P7Q8R9S0T1U', columnId: 'firstName' }
//
// 4. Row Lookup for Updates:
// Row ID: row_01H9X2K3L4M5N6P7Q8R9S0T1U
// Found at index: 0
