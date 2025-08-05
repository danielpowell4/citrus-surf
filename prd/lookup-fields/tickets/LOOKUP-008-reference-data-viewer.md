# LOOKUP-008: Reference Data Viewer & Editor

## Context

Create a modal/popup interface for viewing and editing reference data directly within the application. This provides transparency and allows users to maintain their lookup data without external tools.

## Acceptance Criteria

### AC1: Reference Data Viewer Modal
- [x] Modal popup displaying reference data in table format
- [x] Sortable columns with TanStack Table
- [x] Search/filter functionality across all columns
- [x] Row count and data statistics display
- [x] Export reference data functionality

### AC2: Inline Reference Data Editor
- [x] Edit reference data cells directly in the modal
- [x] Add new rows to reference data
- [x] Delete rows from reference data
- [x] Validation to prevent duplicate keys
- [x] Auto-save changes to reference data storage

### AC3: Impact Analysis
- [x] Show which lookup fields use this reference data
- [x] Display count of affected records when editing
- [x] Preview impact of reference data changes
- [x] Confirm dialog for destructive changes

### AC4: Reference Data Management
- [x] Upload new reference files via drag-and-drop
- [x] Replace existing reference data
- [x] Download reference data as CSV
- [x] Delete reference data files (with confirmation)

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
- [x] Define comprehensive props interfaces for all viewer/editor components
- [x] Create types for reference data editing operations and validation
- [x] Add proper types for impact analysis and change previews
- [x] Ensure compatibility with existing modal/dialog patterns

### Testing
- [x] Unit tests for reference data viewer modal
- [x] Unit tests for inline editing functionality
- [x] Unit tests for impact analysis features
- [x] Unit tests for file upload/download operations
- [x] Integration tests with TanStack Table
- [x] End-to-end tests for complete edit workflows
- [x] Accessibility testing for modal interactions

### Documentation
- [x] Add comprehensive component documentation
- [x] Document reference data editing workflows
- [x] Create user guide for reference data management
- [x] Add troubleshooting guide for common editing issues

### Redux History Integration
- [x] Create dedicated reference data slice for viewer/editor state
- [x] Add reference data editing actions to separate history:
  - `referenceData/editCell`
  - `referenceData/addRow`
  - `referenceData/deleteRow`
  - `referenceData/replaceData`
- [x] Implement separate undo/redo for reference data edits
- [x] Test time-travel functionality for reference data changes
- [x] Ensure reference data editor state doesn't interfere with main table history

### Navigation & Routing Integration
- [x] Integrate with `/playground/reference-data` route structure
- [x] Support deep linking to reference file viewer/editor
- [x] Implement user-friendly redirects after edit operations
- [x] Add breadcrumb navigation back to main workflow

## Files Created
- ✅ `components/reference-data-viewer.tsx`
- ✅ `components/reference-data-viewer.test.tsx`
- ✅ `components/reference-data-editor.tsx`
- ✅ `components/reference-data-editor.test.tsx`
- ✅ `components/reference-upload-dialog.tsx`
- ✅ `components/reference-upload-dialog.test.tsx`
- ✅ `hooks/useReferenceDataEditor.ts`
- ✅ `hooks/useReferenceDataEditor.test.ts`
- ✅ `lib/features/referenceDataSlice.ts` (separate slice for reference data state)
- ✅ `lib/features/referenceDataSlice.test.ts`
- ✅ `docs/reference-data-management.md` (comprehensive documentation)