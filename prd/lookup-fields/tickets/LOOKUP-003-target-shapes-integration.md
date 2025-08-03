# LOOKUP-003: Target Shapes Integration

## Context

Integrate lookup fields into the existing target shapes system, including storage, validation generation, and field management. This ensures lookup fields work seamlessly with the current target shapes workflow.

## Acceptance Criteria

### AC1: Target Shapes Storage Integration
- [ ] Update `target-shapes-storage.ts` to handle lookup field configurations
- [ ] Serialize/deserialize lookup field properties correctly
- [ ] Maintain backward compatibility with existing target shapes

### AC2: Auto-Generated Validation
- [ ] Generate enum validation rules from reference data automatically
- [ ] Update validation when reference data changes
- [ ] Integrate with existing validation error handling

### AC3: Field Dependencies Management
- [ ] Track which fields are derived from lookup fields
- [ ] Handle cascade updates when lookup source data changes
- [ ] Manage cleanup when lookup fields are removed

### AC4: Target Shapes Slice Integration
- [ ] Add actions for lookup field creation/update/deletion
- [ ] Add actions for reference data management
- [ ] Ensure state consistency between lookup config and reference data

## Technical Notes

```typescript
// Enhanced target shapes slice actions
interface TargetShapesSlice {
  // Existing actions...
  
  // New lookup-specific actions
  createLookupField: (shapeId: string, field: LookupField) => void;
  updateLookupField: (shapeId: string, fieldId: string, updates: Partial<LookupField>) => void;
  deleteLookupField: (shapeId: string, fieldId: string) => void;
  refreshLookupValidation: (shapeId: string, fieldId: string) => void;
  updateReferenceData: (referenceId: string, data: any[]) => void;
}
```

## Dependencies
- LOOKUP-001 (Core Types)
- LOOKUP-002 (Reference Data Manager)
- Existing target shapes system

## Estimated Effort
**Medium** (3-4 days)

## Implementation TODOs

### Types & Interfaces
- [ ] Add proper typing for all new slice actions and state
- [ ] Ensure reducer state includes lookup field support
- [ ] Type the relationship between lookup fields and reference data
- [ ] Add proper action payload types

### Testing
- [ ] Unit tests for all new slice actions (create, update, delete lookup fields)
- [ ] Test target shape serialization/deserialization with lookup fields
- [ ] Test validation generation from reference data
- [ ] Test field dependency management
- [ ] Test cascade updates when reference data changes
- [ ] Integration tests with existing target shape functionality

### Documentation
- [ ] Update `docs/target-shapes.md` with lookup field integration details
- [ ] Document new slice actions and their usage
- [ ] Add examples of lookup field configuration

### Redux History Integration
- [ ] Add new lookup actions to `meaningfulActions` array in `lib/store.ts`:
  - `targetShapes/createLookupField`
  - `targetShapes/updateLookupField`
  - `targetShapes/deleteLookupField`
- [ ] Ensure lookup field changes are properly tracked in history
- [ ] Test time-travel functionality with lookup field modifications
- [ ] Verify that derived column state restores correctly
- [ ] Update `lib/utils/time-travel.ts` to handle lookup field restoration

## Files to Modify
- `lib/features/targetShapesSlice.ts`
- `lib/utils/target-shapes-storage.ts`
- `lib/features/targetShapesSlice.test.ts`
- `lib/store.ts` (add to meaningfulActions)
- `lib/utils/time-travel.ts` (if special restoration needed)