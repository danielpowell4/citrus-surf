# VS-006: Redux Validation State Integration

## Context

Integrate validation engine with Redux table state management, ensuring validation metadata is properly maintained, persisted, and synchronized with table operations like sorting, filtering, and editing.

## Acceptance Criteria

### AC1: Redux State Integration

- [ ] Add validation actions to `tableSlice.ts`
- [ ] Implement `validateTableData` async thunk
- [ ] Implement `updateValidationState` reducer
- [ ] Implement `clearValidationErrors` reducer
- [ ] Store validation results in table state

### AC2: Validation Triggers

- [ ] Auto-validate on data import/update
- [ ] Validate on cell value changes during editing
- [ ] Re-validate when target shape changes
- [ ] Debounced validation for performance

### AC3: State Synchronization

- [ ] Maintain validation metadata during row operations (sort, filter, delete)
- [ ] Update validation state when target shape fields change
- [ ] Preserve validation state during undo/redo operations
- [ ] Clear stale validation data when appropriate

### AC4: Performance Optimizations

- [ ] Incremental validation for single row/cell updates
- [ ] Background validation with progress indicators
- [ ] Validation result caching and invalidation
- [ ] Memory-efficient state updates

## Technical Requirements

- Use Redux Toolkit async thunks for validation operations
- Maintain immutable state updates
- Handle validation errors gracefully
- Support both sync and async validation modes

## Testing Requirements

- [ ] Test async validation thunk creation and execution
- [ ] Test reducer state updates for all validation actions
- [ ] Test validation triggers on data changes
- [ ] Test state synchronization during table operations
- [ ] Test performance with large datasets (10k+ rows)
- [ ] Test error handling for validation failures
- [ ] All tests must pass: `npm run test lib/features/tableSlice.validation.test.ts`

## Lint Requirements

- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing Redux patterns

## Status: 📋 Planned

Critical integration layer connecting validation engine with application state management.