# LOOKUP-010: Fuzzy Match Review UI

## Context

Create a dedicated interface for users to review and approve/reject fuzzy matches that fall below the confidence threshold or require manual verification.

## Acceptance Criteria

### AC1: Fuzzy Match Review Modal

- [x] Modal displaying all fuzzy matches requiring review
- [x] Side-by-side comparison of input value vs suggested match
- [x] Confidence score display with visual indicators
- [x] Batch approve/reject functionality for similar matches

### AC2: Individual Match Review

- [x] Accept/reject buttons for each fuzzy match
- [x] Option to manually enter correct value if no suggestion is appropriate
- [x] Show impact of accepting/rejecting (how many rows affected)
- [x] Preview of derived column values for accepted matches

### AC3: Batch Operations

- [x] Select all matches above a certain confidence threshold
- [x] Bulk accept all high-confidence matches
- [x] Filter matches by confidence level or similarity type
- [x] Search/filter matches by input value or suggestion

### AC4: Review Summary & Statistics

- [x] Summary of total matches requiring review
- [x] Statistics on confidence distribution
- [x] Progress indicator during review process
- [x] Final summary after review completion

## Technical Notes

```typescript
interface FuzzyMatchReviewProps {
  matches: FuzzyMatch[];
  onAccept: (matchId: string, acceptedValue: string) => void;
  onReject: (matchId: string) => void;
  onBatchAccept: (matchIds: string[]) => void;
  onManualEntry: (matchId: string, value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface FuzzyMatchReviewState {
  selectedMatches: Set<string>;
  confidenceFilter: [number, number];
  searchTerm: string;
  groupByField: string;
}
```

## Implementation TODOs

### Types & Interfaces

- [x] Define comprehensive interfaces for fuzzy match review components
- [x] Create types for match approval/rejection operations
- [x] Add proper types for batch operations and filtering
- [x] Ensure compatibility with matching engine result types
- [x] Use proper ID patterns: `batch_` prefix for match batches, `match_` for individual matches

### Testing

- [x] Unit tests for fuzzy match review modal
- [x] Unit tests for individual match accept/reject functionality
- [x] Unit tests for batch operations and filtering
- [x] Unit tests for manual value entry and validation
- [x] Integration tests with lookup processing pipeline
- [x] Accessibility testing for review interface

### Documentation

- [x] Add user guide for fuzzy match review process
- [x] Document best practices for handling fuzzy matches
- [x] Create troubleshooting guide for common review scenarios
- [x] Add component documentation with examples

### Redux History Integration

- [x] Add fuzzy match review actions to `meaningfulActions`:
  - `lookup/acceptFuzzyMatch`
  - `lookup/rejectFuzzyMatch`
  - `lookup/batchAcceptMatches`
  - `lookup/manualEntryForMatch`
- [x] Ensure match approval/rejection is tracked in history
- [x] Test undo/redo functionality for match decisions
- [x] Verify that batch operations are properly captured in history

## Dependencies

- LOOKUP-004 (Matching Engine)
- LOOKUP-005 (Data Processing Integration)

## Estimated Effort

**Medium** (4-5 days)

## Files to Create

- `components/fuzzy-match-review-modal.tsx`
- `components/fuzzy-match-review-modal.test.tsx`
- `components/match-comparison-card.tsx`
- `components/match-comparison-card.test.tsx`
- `hooks/useFuzzyMatchReview.ts`
- `hooks/useFuzzyMatchReview.test.ts`

## Files to Modify

- `lib/store.ts` (add match review actions to meaningfulActions)
- `lib/features/tableSlice.ts` (add fuzzy match review state if needed)
