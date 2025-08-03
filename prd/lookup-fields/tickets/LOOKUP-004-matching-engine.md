# LOOKUP-004: Lookup Matching Engine

## Context

Implement the core matching algorithm that performs exact, normalized, and fuzzy matching between input data and reference data. This is the heart of the lookup functionality.

## Acceptance Criteria

### AC1: Exact Matching
- [ ] Implement exact string matching with case sensitivity options
- [ ] Handle null/undefined values appropriately
- [ ] Return match results with confidence scores

### AC2: Normalized Matching  
- [ ] Auto-trim whitespace from both input and reference values
- [ ] Case-insensitive matching option
- [ ] Handle common encoding/character issues

### AC3: Fuzzy Matching
- [ ] Implement string similarity algorithm (Levenshtein/Jaro-Winkler)
- [ ] Configurable confidence threshold (0-1)
- [ ] Return multiple potential matches with scores
- [ ] Performance optimization for large datasets

### AC4: Matching API
- [ ] `performLookup(inputValue: string, referenceData: any[], config: LookupConfig): LookupResult`
- [ ] `batchLookup(inputValues: string[], referenceData: any[], config: LookupConfig): LookupResult[]`
- [ ] Support for derived field extraction in single operation

## Technical Notes

```typescript
interface LookupResult {
  inputValue: string;
  matched: boolean;
  confidence: number;        // 0-1 confidence score
  matchType: 'exact' | 'normalized' | 'fuzzy' | 'none';
  matchedValue: any;         // The matched reference value
  derivedValues: Record<string, any>; // Additional columns
  suggestions?: LookupSuggestion[]; // For fuzzy matches
}

interface LookupSuggestion {
  value: any;
  confidence: number;
  reason: string; // "Similar spelling", "Case difference", etc.
}

interface MatchingEngine {
  performLookup(input: string, referenceData: any[], config: LookupConfig): LookupResult;
  batchLookup(inputs: string[], referenceData: any[], config: LookupConfig): LookupResult[];
  calculateSimilarity(str1: string, str2: string): number;
}
```

## Dependencies
- LOOKUP-001 (Core Types)
- LOOKUP-002 (Reference Data Manager)

## Estimated Effort
**Large** (5-6 days)

## Implementation TODOs

### Types & Interfaces
- [ ] Define comprehensive interfaces for all matching engine components
- [ ] Create proper result types with confidence scoring
- [ ] Add types for different match strategies and configurations
- [ ] Ensure type safety for large dataset operations

### Testing
- [ ] Unit tests for exact matching algorithms
- [ ] Unit tests for normalized matching (case, whitespace)
- [ ] Unit tests for fuzzy matching with various similarity algorithms
- [ ] Performance tests with large datasets (10k+ rows)
- [ ] Edge case testing (null values, empty strings, special characters)
- [ ] Batch processing tests
- [ ] Memory usage tests for large reference datasets

### Documentation
- [ ] Comprehensive JSDoc for all public methods
- [ ] Document matching algorithm choices and trade-offs
- [ ] Add performance characteristics and limitations
- [ ] Create usage examples with different match types

### Redux History Integration
- [ ] Matching operations should NOT be tracked in history (they're processing)
- [ ] Ensure matching results don't pollute Redux state unnecessarily
- [ ] Focus on data transformation results, not matching internals

## Files to Create
- `lib/utils/lookup-matching-engine.ts`
- `lib/utils/lookup-matching-engine.test.ts`
- `lib/utils/string-similarity.ts` (helper utilities)
- `lib/utils/string-similarity.test.ts`