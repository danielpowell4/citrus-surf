// Simple test to demonstrate ID generation
import {
  generateId,
  generateShapeId,
  generateFieldId,
  isValidId,
  getPrefixFromId,
  ID_PREFIXES,
} from "./id-generator";

// Test ID generation
console.log("=== ID Generation Examples ===");
console.log("Shape ID:", generateShapeId());
console.log("Field ID:", generateFieldId());
console.log("Custom ID:", generateId("custom"));

// Test validation
const testIds = [
  generateShapeId(),
  generateFieldId(),
  "invalid_id",
  "shape_01H9X2K3L4M5N6P7Q8R9S0T1U",
];

console.log("\n=== ID Validation ===");
testIds.forEach(id => {
  console.log(`${id}: ${isValidId(id) ? "Valid" : "Invalid"}`);
});

// Test prefix extraction
console.log("\n=== Prefix Extraction ===");
testIds.forEach(id => {
  const prefix = getPrefixFromId(id);
  console.log(`${id}: prefix = ${prefix || "none"}`);
});

// Example output:
// === ID Generation Examples ===
// Shape ID: shape_01H9X2K3L4M5N6P7Q8R9S0T1U
// Field ID: field_01H9X2K3L4M5N6P7Q8R9S0T1U
// Row ID: cs_01H9X2K3L4M5N6P7Q8R9S0T1U
// Custom ID: custom_01H9X2K3L4M5N6P7Q8R9S0T1U
//
// === ID Validation ===
// shape_01H9X2K3L4M5N6P7Q8R9S0T1U: Valid
// field_01H9X2K3L4M5N6P7Q8R9S0T1U: Valid
// cs_01H9X2K3L4M5N6P7Q8R9S0T1U: Valid
// invalid_id: Invalid
//
// === Prefix Extraction ===
// shape_01H9X2K3L4M5N6P7Q8R9S0T1U: prefix = shape
// field_01H9X2K3L4M5N6P7Q8R9S0T1U: prefix = field
// cs_01H9X2K3L4M5N6P7Q8R9S0T1U: prefix = cs
// invalid_id: prefix = none
