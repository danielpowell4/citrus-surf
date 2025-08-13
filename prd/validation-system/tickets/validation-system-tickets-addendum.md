# Validation System Additional Tickets

## Ticket VS-011: Error Management Actions

### Description
Implement essential error management actions for the validation system, including filtered data export and bulk error dismissal capabilities to streamline error resolution workflows.

### Acceptance Criteria

**AC1: Filter to Errors Only Action**
- [ ] Add "Show Errors Only" action button/toggle to table toolbar
- [ ] Filter table data to display only rows with validation errors (hasErrors = true)
- [ ] Update table row count display: "Showing X of Y rows (errors only)"
- [ ] Persist error filter state in Redux store
- [ ] Clear filter state when validation is re-run or data changes
- [ ] Show "Clear Filter" option when error filter is active

**AC2: Export Current View Action**
- [ ] Add "Download Current View" action button to table toolbar
- [ ] Export currently visible/filtered data as CSV file
- [ ] Include validation metadata in export: error messages, validation status
- [ ] Generate filename with timestamp: "data-with-errors-2023-12-25.csv"
- [ ] Support exporting error-only view when filter is active
- [ ] Include columns: original data + validation_status + error_messages

**AC3: Bulk Error Dismissal Action**
- [ ] Add "Dismiss All Errors" action button (with confirmation dialog)
- [ ] Clear validation metadata from all rows (reset to unvalidated state)
- [ ] Update ValidationState to reflect cleared errors (totalErrors = 0)
- [ ] Show confirmation dialog: "This will dismiss X validation errors. Continue?"
- [ ] Log dismissal action for audit trail
- [ ] Update UI indicators after dismissal (remove error badges, borders)

**AC4: Selective Error Actions**
- [ ] Add "Dismiss Selected Errors" action for checked rows
- [ ] Support row selection with checkboxes in error-filtered view
- [ ] Bulk actions dropdown: "Mark as Reviewed", "Ignore Warnings", "Fix Later"
- [ ] Add status metadata to track user actions on errors
- [ ] Show action history in validation panel

### Technical Requirements
- Integration with existing table filtering system
- CSV export functionality compatible with current export utilities
- Redux actions for state management of error filters and dismissals
- Confirmation dialogs using existing UI components
- Performance optimized for large datasets (1000+ errors)

### Testing Requirements
- [ ] Test error filter toggle functionality with mixed validation states
- [ ] Test CSV export with error-only filtered data
- [ ] Test bulk error dismissal with confirmation workflow
- [ ] Test selective error dismissal with row selection
- [ ] Test filter persistence across page refreshes
- [ ] Test export filename generation and content validation
- [ ] Test performance with large error datasets (1000+ error rows)
- [ ] All tests must pass: `npm run test components/error-management-actions.test.tsx`

### Lint Requirements
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing action button and dialog patterns

---

## Ticket VS-012: Enhanced Validation State Management

### Description
Extend Redux validation state management to support error filtering, dismissal tracking, and export functionality required for comprehensive error management workflows.

### Acceptance Criteria

**AC1: Error Filter State Management**
- [ ] Add `errorFilter: { active: boolean; type: 'errors' | 'warnings' | 'all' }` to ValidationState
- [ ] Create `setValidationFilter` action to update filter state
- [ ] Create `clearValidationFilter` action to reset filter
- [ ] Add filtered row selectors: `selectErrorRows`, `selectWarningRows`, `selectValidRows`
- [ ] Persist filter state in Redux store

**AC2: Error Dismissal State Tracking**
- [ ] Add `dismissedErrors: string[]` array to ValidationState (stores error rule IDs)
- [ ] Create `dismissValidationError` action with error rule ID payload
- [ ] Create `dismissAllValidationErrors` action to clear all errors
- [ ] Create `restoreDismissedErrors` action for undo functionality
- [ ] Update validation selectors to exclude dismissed errors from counts

**AC3: Export State Management**
- [ ] Add `exportState: { isExporting: boolean; lastExport?: string }` to ValidationState
- [ ] Create `startValidationExport` action to set export loading state
- [ ] Create `completeValidationExport` action with export metadata
- [ ] Track export history for user reference
- [ ] Support export configuration (include/exclude columns, format options)

**AC4: Enhanced Validation Selectors**
- [ ] Create `selectVisibleRows` selector respecting current filters
- [ ] Create `selectExportData` selector for formatted export data
- [ ] Create `selectValidationSummary` selector with filter-aware counts
- [ ] Create `selectErrorManagementState` selector for UI components
- [ ] Optimize selectors for performance with large datasets

### Technical Requirements
- Extend existing Redux validation state without breaking changes
- Use Redux Toolkit createSlice patterns for new actions
- Memoized selectors for performance optimization
- Integration with existing table state management

### Testing Requirements
- [ ] Test error filter state updates and persistence
- [ ] Test error dismissal actions and state tracking
- [ ] Test export state management and history
- [ ] Test validation selectors with different filter states
- [ ] Test performance of selectors with large datasets
- [ ] Test integration with existing validation workflow
- [ ] All tests must pass: `npm run test lib/features/validation-state.test.ts`

### Lint Requirements
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing Redux patterns and naming conventions

---

## Integration Notes

### Dependencies
- **VS-011** depends on VS-006 (Redux Integration) and VS-007 (UI Indicators)
- **VS-012** extends VS-006 (Redux Integration) and supports VS-011 actions
- Both tickets integrate with VS-008 (Error Filtering) for enhanced filtering

### User Workflow
1. **Error Discovery**: User runs validation and sees errors in table
2. **Filter to Errors**: User clicks "Show Errors Only" to focus on problems
3. **Review & Fix**: User works through errors using existing resolution tools
4. **Export for Review**: User downloads error-only CSV for external review/sharing
5. **Bulk Actions**: User dismisses resolved errors or marks them for later review
6. **Clean State**: User returns to full dataset view with remaining errors

### Success Metrics
- **Error Resolution Efficiency**: Reduce time to identify and fix validation errors
- **Export Usage**: Track usage of error-only export functionality  
- **Bulk Action Adoption**: Monitor usage of bulk dismissal features
- **User Workflow Completion**: Measure successful error resolution workflows

These tickets fill the gaps in the current validation system to provide comprehensive error management capabilities that match real-world data validation workflows.