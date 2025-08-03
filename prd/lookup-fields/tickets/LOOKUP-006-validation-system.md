# LOOKUP-006: Enhanced Validation System

## Context

Extend the validation system to handle lookup-specific validations, including auto-generated enum rules from reference data and fuzzy match confidence scoring.

## Acceptance Criteria

### AC1: Auto-Generated Enum Validation
- [ ] Automatically create enum validation rules from reference data
- [ ] Update validation rules when reference data changes
- [ ] Maintain existing validation behavior for other field types

### AC2: Fuzzy Match Validation
- [ ] Add validation rule type for fuzzy match confidence
- [ ] Allow configuration of confidence thresholds per field
- [ ] Provide clear error messages for low-confidence matches

### AC3: Reference Data Validation
- [ ] Validate that required reference files exist
- [ ] Check that lookup columns exist in reference data
- [ ] Validate reference data integrity (no duplicates in key column)

### AC4: Validation Error Enhancement
- [ ] Enhanced error messages with suggestions for lookup fields
- [ ] Show available options when validation fails
- [ ] Provide "Did you mean X?" suggestions for fuzzy matches

## Technical Notes

```typescript
// New validation rule types
interface LookupValidationRule extends ValidationRule {
  type: "lookup_enum" | "lookup_confidence" | "lookup_reference";
  referenceFile?: string;
  confidenceThreshold?: number;
  suggestions?: string[];
}

interface ValidationError {
  // Existing properties...
  suggestions?: string[];      // For fuzzy match suggestions
  availableOptions?: string[]; // For enum-like display
  referenceSource?: string;    // Which reference file
}

// Enhanced validation functions
interface LookupValidator {
  validateLookupField(value: any, field: LookupField, referenceData: any[]): ValidationResult;
  generateEnumRules(referenceData: any[], keyColumn: string): ValidationRule[];
  validateReferenceIntegrity(data: any[], keyColumn: string): ValidationResult;
}
```

## Dependencies
- LOOKUP-001 (Core Types)
- LOOKUP-004 (Matching Engine)
- Existing validation system

## Estimated Effort
**Medium** (3-4 days)

## Files to Modify
- `lib/utils/data-analysis.ts` (validation logic)
- `lib/types/target-shapes.ts` (validation rule types)

## Implementation TODOs

### Types & Interfaces
- [ ] Define enhanced validation rule types for lookup fields
- [ ] Create proper error types with suggestion support
- [ ] Add interfaces for validation results with fuzzy match info
- [ ] Ensure type compatibility with existing validation system

### Testing
- [ ] Unit tests for auto-generated enum validation from reference data
- [ ] Unit tests for fuzzy match confidence validation
- [ ] Unit tests for reference data integrity validation
- [ ] Unit tests for enhanced error messages with suggestions
- [ ] Integration tests with existing validation pipeline
- [ ] Edge case testing for malformed reference data

### Documentation
- [ ] Document new validation rule types and their usage
- [ ] Add examples of lookup-specific validation scenarios
- [ ] Update `docs/target-shapes.md` with validation integration details
- [ ] Create troubleshooting guide for validation issues

### Redux History Integration
- [ ] Validation operations themselves should NOT be tracked in history
- [ ] However, validation rule changes (when reference data updates) should be tracked
- [ ] Test that validation state restores correctly with time-travel
- [ ] Ensure validation error state is properly managed during restoration

## Files to Modify
- `lib/utils/data-analysis.ts` (validation logic)
- `lib/types/target-shapes.ts` (validation rule types)

## Files to Create
- `lib/utils/lookup-validation.ts`
- `lib/utils/lookup-validation.test.ts`