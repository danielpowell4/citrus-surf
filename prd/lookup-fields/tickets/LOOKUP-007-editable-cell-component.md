# LOOKUP-007: Lookup Editable Cell Component

## Context

Create a new editable cell component specifically for lookup fields that provides dropdown selection, fuzzy search, and reference data transparency features.

## Acceptance Criteria

### AC1: Basic Lookup Cell
- [ ] Create `LookupEditableCell` component extending existing editable cell pattern
- [ ] Dropdown with all available reference values
- [ ] Search/filter functionality within dropdown
- [ ] Keyboard navigation support (arrow keys, enter, escape)

### AC2: Fuzzy Search & Suggestions
- [ ] Real-time fuzzy matching as user types
- [ ] Show suggested matches with confidence scores
- [ ] "Did you mean X?" functionality for close matches
- [ ] Accept/reject suggestions workflow

### AC3: Reference Data Transparency
- [ ] Info icon (ℹ️) showing available options popup
- [ ] Source indicator showing reference file name and row count
- [ ] "View Reference Data" and "Edit Values" links
- [ ] Visual distinction for derived/read-only columns

### AC4: Integration with Column Generator
- [ ] Update `column-generator.tsx` to handle lookup field type
- [ ] Auto-configure lookup cells for lookup fields
- [ ] Set derived columns as read-only with proper styling

## Technical Notes

```typescript
interface LookupEditableCellProps extends EditableCellProps {
  referenceData: any[];
  lookupConfig: LookupField['match'];
  smartMatching: LookupField['smartMatching'];
  showReferenceInfo?: boolean;
  allowReferenceEdit?: boolean;
  onReferenceView?: (referenceFile: string) => void;
  onReferenceEdit?: (referenceFile: string) => void;
}

// Component features:
// - Combobox with search
// - Fuzzy match suggestions
// - Reference info popup
// - Visual confidence indicators
// - Source attribution
```

## Dependencies
- LOOKUP-001 (Core Types)
- LOOKUP-004 (Matching Engine)
- Existing editable cell system
- shadcn/ui components (Combobox, Popover, etc.)

## Estimated Effort
**Large** (5-6 days)

## Files to Create
- `app/playground/lookup-editable-cell.tsx`
- `app/playground/lookup-editable-cell.test.tsx`
- `components/reference-info-popup.tsx`

## Implementation TODOs

### Types & Interfaces
- [ ] Define comprehensive props interfaces for lookup cell components
- [ ] Create types for fuzzy match suggestions and confidence display
- [ ] Add proper event handler types for reference data actions
- [ ] Ensure compatibility with existing editable cell prop types

### Testing
- [ ] Unit tests for basic lookup cell functionality
- [ ] Unit tests for dropdown with search/filter
- [ ] Unit tests for fuzzy match suggestions and acceptance
- [ ] Unit tests for reference data transparency features
- [ ] Integration tests with TanStack Table
- [ ] Accessibility testing (keyboard navigation, screen readers)
- [ ] Visual regression tests for lookup cell states

### Documentation
- [ ] Add comprehensive component documentation with examples
- [ ] Update `docs/editable-cells.md` with lookup cell details
- [ ] Document keyboard interactions and accessibility features
- [ ] Create storybook stories for lookup cell variants

### Redux History Integration
- [ ] Add lookup cell edit actions to `meaningfulActions`:
  - `table/updateCellValue` (for lookup field changes)
- [ ] Ensure lookup value changes are tracked in history
- [ ] Test that lookup cell edits can be undone/redone
- [ ] Verify derived column updates are captured in history snapshots

## Files to Create
- `app/playground/lookup-editable-cell.tsx`
- `app/playground/lookup-editable-cell.test.tsx`
- `components/reference-info-popup.tsx`
- `components/reference-info-popup.test.tsx`

## Files to Modify
- `lib/utils/column-generator.tsx`
- `lib/store.ts` (add cell edit actions to meaningfulActions)