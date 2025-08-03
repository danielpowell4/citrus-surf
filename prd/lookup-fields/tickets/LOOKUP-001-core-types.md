# LOOKUP-001: Core Type Definitions

## Context

Establish the foundational TypeScript types and interfaces for the lookup field system. This extends the existing target shapes type system to support cross-reference functionality.

## Acceptance Criteria

### AC1: Extend FieldType Union
- [ ] Add `"lookup"` to the `FieldType` union in `lib/types/target-shapes.ts`
- [ ] Ensure backward compatibility with existing field types

### AC2: Define LookupField Interface
- [ ] Create `LookupField` interface extending `TargetField`
- [ ] Include all required properties: `referenceFile`, `match`, `alsoGet`, `smartMatching`
- [ ] Add optional properties: `onMismatch`, `showReferenceInfo`, `allowReferenceEdit`

### AC3: Define Supporting Types
- [ ] Create `LookupMatch` interface for match configuration
- [ ] Create `SmartMatching` interface for fuzzy matching settings  
- [ ] Create `DerivedField` interface for additional column derivation

### AC4: Validation Integration
- [ ] Define how lookup fields auto-generate enum validation rules
- [ ] Ensure compatibility with existing `ValidationRule` interface

## Technical Notes

```typescript
interface LookupField extends TargetField {
  type: "lookup";
  referenceFile: string;
  match: {
    on: string;      // Column to match against
    get: string;     // Column to return as value
    show?: string;   // Column to display (optional)
  };
  alsoGet?: string[];
  smartMatching: {
    enabled: boolean;
    confidence: number; // 0-1 threshold
  };
  onMismatch: "error" | "warning" | "null";
  showReferenceInfo?: boolean;
  allowReferenceEdit?: boolean;
}
```

## Dependencies
- None (foundational)

## Estimated Effort
**Small** (1-2 days)

## Implementation TODOs

### Types & Interfaces
- [ ] Add comprehensive TypeScript types for all lookup interfaces
- [ ] Ensure proper type exports from `lib/types/target-shapes.ts`
- [ ] Add JSDoc documentation for all new types
- [ ] Validate type compatibility with existing TargetField interface

### Testing
- [ ] Create unit tests for type definitions (compilation tests)
- [ ] Test type inference and compatibility
- [ ] Validate serialization/deserialization of lookup types

### Documentation
- [ ] Update `docs/target-shapes.md` with new lookup field type
- [ ] Update `docs/column-types-reference.md` with lookup examples
- [ ] Add type definitions to documentation

### Redux History Integration
- [ ] Ensure lookup field configurations are properly serialized in history
- [ ] Test that lookup fields restore correctly with time-travel
- [ ] No new actions needed at this level (just types)

## Files to Modify
- `lib/types/target-shapes.ts`

## Files to Create
- `lib/types/lookup-types.test.ts` (type validation tests)