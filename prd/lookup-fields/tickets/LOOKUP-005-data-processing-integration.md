# LOOKUP-005: Data Processing Integration

## Context

Integrate the lookup matching engine with the existing data processing pipeline. This ensures lookup operations happen automatically when data is imported or edited, and derived columns are updated accordingly.

## Acceptance Criteria

### AC1: Data Import Integration
- [ ] Automatically perform lookups when target shape has lookup fields
- [ ] Process all lookup fields during data import workflow
- [ ] Generate derived columns in the final dataset
- [ ] Handle lookup errors gracefully during import

### AC2: Real-time Updates
- [ ] Trigger lookup when user edits lookup field values
- [ ] Update derived columns immediately when source lookup changes
- [ ] Maintain data consistency across all related fields

### AC3: Batch Processing
- [ ] Efficient processing of large datasets with lookups
- [ ] Progress indicators for long-running lookup operations
- [ ] Memory management for large reference datasets

### AC4: Error Handling & Reporting
- [ ] Collect and report unmatched values with suggestions
- [ ] Provide summary statistics (X/Y matched, Z errors)
- [ ] Allow user review/approval of fuzzy matches

## Technical Notes

```typescript
interface LookupProcessor {
  processDataWithLookups(
    data: any[], 
    targetShape: TargetShape,
    referenceDataManager: ReferenceDataManager
  ): ProcessedLookupResult;
  
  processSingleLookup(
    value: any,
    field: LookupField,
    referenceData: any[]
  ): LookupResult;
  
  updateDerivedColumns(
    rowData: any,
    lookupResults: Record<string, LookupResult>
  ): any;
}

interface ProcessedLookupResult {
  data: any[];
  errors: LookupError[];
  stats: LookupStats;
  fuzzyMatches: FuzzyMatch[];
}

interface LookupStats {
  totalFields: number;
  exactMatches: number;
  fuzzyMatches: number;
  noMatches: number;
  derivedColumns: number;
}
```

## Dependencies
- LOOKUP-003 (Target Shapes Integration)
- LOOKUP-004 (Matching Engine)
- Existing data processing pipeline

## Estimated Effort
**Large** (4-5 days)

## Files to Modify
- `lib/utils/data-processing.ts`
- `lib/features/tableSlice.ts`

## Implementation TODOs

### Types & Interfaces
- [ ] Define interfaces for all processor components and results
- [ ] Create proper error and statistics types
- [ ] Add types for batch processing operations
- [ ] Ensure compatibility with existing data processing types

### Testing
- [ ] Unit tests for lookup processing during data import
- [ ] Unit tests for real-time lookup updates
- [ ] Unit tests for batch processing with large datasets
- [ ] Integration tests with existing data processing pipeline
- [ ] Test error handling and recovery scenarios
- [ ] Test memory management during processing
- [ ] Performance tests with various data sizes

### Documentation
- [ ] Document integration with existing data processing flow
- [ ] Add JSDoc for all processor methods
- [ ] Document performance characteristics and limitations
- [ ] Create troubleshooting guide for lookup processing issues

### Redux History Integration
- [ ] Add data processing actions to `meaningfulActions` in `lib/store.ts`:
  - `table/processDataWithLookups` (if new action needed)
  - `table/updateLookupValue` (for real-time updates)
- [ ] Ensure lookup processing results are tracked in history
- [ ] Test time-travel with processed lookup data
- [ ] Verify derived columns restore properly
- [ ] Update `lib/utils/time-travel.ts` for lookup data restoration

## Files to Modify
- `lib/utils/data-processing.ts`
- `lib/features/tableSlice.ts`
- `lib/store.ts` (add to meaningfulActions)
- `lib/utils/time-travel.ts` (for restoration)

## Files to Create
- `lib/utils/lookup-processor.ts`
- `lib/utils/lookup-processor.test.ts`