# LOOKUP-010: Fuzzy Match Review UI

## Context

Create a dedicated interface for users to review and approve/reject fuzzy matches that fall below the confidence threshold or require manual verification.

## Acceptance Criteria

### AC1: Fuzzy Match Review Modal
- [ ] Modal displaying all fuzzy matches requiring review
- [ ] Side-by-side comparison of input value vs suggested match
- [ ] Confidence score display with visual indicators
- [ ] Batch approve/reject functionality for similar matches

### AC2: Individual Match Review
- [ ] Accept/reject buttons for each fuzzy match
- [ ] Option to manually enter correct value if no suggestion is appropriate
- [ ] Show impact of accepting/rejecting (how many rows affected)
- [ ] Preview of derived column values for accepted matches

### AC3: Batch Operations
- [ ] Select all matches above a certain confidence threshold
- [ ] Bulk accept all high-confidence matches
- [ ] Filter matches by confidence level or similarity type
- [ ] Search/filter matches by input value or suggestion

### AC4: Review Summary & Statistics
- [ ] Summary of total matches requiring review
- [ ] Statistics on confidence distribution
- [ ] Progress indicator during review process
- [ ] Final summary after review completion

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
- [ ] Define comprehensive interfaces for fuzzy match review components
- [ ] Create types for match approval/rejection operations
- [ ] Add proper types for batch operations and filtering
- [ ] Ensure compatibility with matching engine result types
- [ ] Use proper ID patterns: `batch_` prefix for match batches, `match_` for individual matches

### Testing
- [ ] Unit tests for fuzzy match review modal
- [ ] Unit tests for individual match accept/reject functionality
- [ ] Unit tests for batch operations and filtering
- [ ] Unit tests for manual value entry and validation
- [ ] Integration tests with lookup processing pipeline
- [ ] Accessibility testing for review interface

### Documentation
- [ ] Add user guide for fuzzy match review process
- [ ] Document best practices for handling fuzzy matches
- [ ] Create troubleshooting guide for common review scenarios
- [ ] Add component documentation with examples

### Redux History Integration
- [ ] Add fuzzy match review actions to `meaningfulActions`:
  - `lookup/acceptFuzzyMatch`
  - `lookup/rejectFuzzyMatch`
  - `lookup/batchAcceptMatches`
  - `lookup/manualEntryForMatch`
- [ ] Ensure match approval/rejection is tracked in history
- [ ] Test undo/redo functionality for match decisions
- [ ] Verify that batch operations are properly captured in history

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