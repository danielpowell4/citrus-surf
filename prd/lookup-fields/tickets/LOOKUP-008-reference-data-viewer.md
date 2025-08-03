# LOOKUP-008: Reference Data Viewer & Editor

## Context

Create a modal/popup interface for viewing and editing reference data directly within the application. This provides transparency and allows users to maintain their lookup data without external tools.

## Acceptance Criteria

### AC1: Reference Data Viewer Modal
- [ ] Modal popup displaying reference data in table format
- [ ] Sortable columns with TanStack Table
- [ ] Search/filter functionality across all columns
- [ ] Row count and data statistics display
- [ ] Export reference data functionality

### AC2: Inline Reference Data Editor
- [ ] Edit reference data cells directly in the modal
- [ ] Add new rows to reference data
- [ ] Delete rows from reference data
- [ ] Validation to prevent duplicate keys
- [ ] Auto-save changes to reference data storage

### AC3: Impact Analysis
- [ ] Show which lookup fields use this reference data
- [ ] Display count of affected records when editing
- [ ] Preview impact of reference data changes
- [ ] Confirm dialog for destructive changes

### AC4: Reference Data Management
- [ ] Upload new reference files via drag-and-drop
- [ ] Replace existing reference data
- [ ] Download reference data as CSV
- [ ] Delete reference data files (with confirmation)

## Technical Notes

```typescript
interface ReferenceDataViewerProps {
  referenceId: string;
  isOpen: boolean;
  onClose: () => void;
  allowEdit?: boolean;
}

interface ReferenceDataEditor {
  data: any[];
  columns: string[];
  keyColumn: string;
  onDataChange: (data: any[]) => void;
  validation: {
    keyColumnUnique: boolean;
    requiredColumns: string[];
  };
}

// Features to implement:
// - TanStack Table for data display
// - Inline editing with validation
// - Impact analysis for changes
// - File upload/download
// - Real-time validation
```

## Dependencies
- LOOKUP-002 (Reference Data Manager)
- TanStack Table
- shadcn/ui components (Dialog, Table, etc.)
- File upload utilities

## Estimated Effort
**Large** (6-7 days)

## Implementation TODOs

### Types & Interfaces
- [ ] Define comprehensive props interfaces for all viewer/editor components
- [ ] Create types for reference data editing operations and validation
- [ ] Add proper types for impact analysis and change previews
- [ ] Ensure compatibility with existing modal/dialog patterns

### Testing
- [ ] Unit tests for reference data viewer modal
- [ ] Unit tests for inline editing functionality
- [ ] Unit tests for impact analysis features
- [ ] Unit tests for file upload/download operations
- [ ] Integration tests with TanStack Table
- [ ] End-to-end tests for complete edit workflows
- [ ] Accessibility testing for modal interactions

### Documentation
- [ ] Add comprehensive component documentation
- [ ] Document reference data editing workflows
- [ ] Create user guide for reference data management
- [ ] Add troubleshooting guide for common editing issues

### Redux History Integration
- [ ] Create dedicated reference data slice for viewer/editor state
- [ ] Add reference data editing actions to separate history:
  - `referenceData/editCell`
  - `referenceData/addRow`
  - `referenceData/deleteRow`
  - `referenceData/replaceData`
- [ ] Implement separate undo/redo for reference data edits
- [ ] Test time-travel functionality for reference data changes
- [ ] Ensure reference data editor state doesn't interfere with main table history

### Navigation & Routing Integration
- [ ] Integrate with `/playground/reference-data` route structure
- [ ] Support deep linking to reference file viewer/editor
- [ ] Implement user-friendly redirects after edit operations
- [ ] Add breadcrumb navigation back to main workflow

## Files to Create
- `components/reference-data-viewer.tsx`
- `components/reference-data-viewer.test.tsx`
- `components/reference-data-editor.tsx`
- `components/reference-data-editor.test.tsx`
- `components/reference-upload-dialog.tsx`
- `components/reference-upload-dialog.test.tsx`
- `hooks/useReferenceDataEditor.ts`
- `hooks/useReferenceDataEditor.test.ts`
- `lib/features/referenceDataSlice.ts` (separate slice for reference data state)
- `lib/features/referenceDataSlice.test.ts`