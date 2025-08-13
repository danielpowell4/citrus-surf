# Reference Data Management System

## Overview

The Reference Data Management System provides comprehensive tools for uploading, viewing, editing, and managing reference data files used by lookup fields. This system enables users to maintain their lookup data directly within the application without external tools.

## Core Components

### ReferenceDataViewer

**Location**: `components/reference-data-viewer.tsx`

A modal component for viewing reference data with comprehensive functionality:

- **Sortable columns** with TanStack Table integration
- **Global search/filter** across all columns
- **Pagination** for large datasets (25 rows per page)
- **Export functionality** to download as CSV
- **Impact analysis** showing which lookup fields use the reference data
- **File statistics** display (row count, columns, file size, dates)

```typescript
interface ReferenceDataViewerProps {
  referenceId: string;
  isOpen: boolean;
  onClose: () => void;
  allowEdit?: boolean;
  onReferenceEdit?: (referenceId: string) => void;
  onReferenceDownload?: (referenceId: string) => void;
  onReferenceDelete?: (referenceId: string) => void;
  onReferenceReplace?: (referenceId: string) => void;
}
```

### ReferenceDataEditor

**Location**: `components/reference-data-editor.tsx`

A comprehensive editor for modifying reference data inline:

- **Inline cell editing** with click-to-edit interface
- **Add/delete rows** with undo functionality for deletions
- **Real-time validation** with error highlighting
- **Duplicate key detection** for key columns
- **Auto-save functionality** on successful edits
- **Bulk operations** support

```typescript
interface ReferenceDataEditorProps {
  referenceId: string;
  data: Record<string, unknown>[];
  referenceInfo: ReferenceDataInfo;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>[]) => void;
  onCancel: () => void;
  keyColumn?: string;
}
```

### ReferenceUploadDialog

**Location**: `components/reference-upload-dialog.tsx`

A file upload dialog with validation and preview:

- **Drag-and-drop file upload** with visual feedback
- **File validation** with detailed error reporting
- **Data preview** showing first 5 rows
- **Progress tracking** during upload
- **Replace mode** for updating existing reference data
- **Custom ID assignment** for new uploads

```typescript
interface ReferenceUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (referenceInfo: ReferenceDataInfo) => void;
  onError?: (error: string) => void;
  mode?: "upload" | "replace";
  existingReferenceId?: string;
  existingReferenceInfo?: ReferenceDataInfo;
}
```

## Hook Integration

### useReferenceDataEditor

**Location**: `hooks/useReferenceDataEditor.ts`

A comprehensive hook for managing reference data editing state:

```typescript
const [state, actions] = useReferenceDataEditor({
  referenceId,
  onSave,
  onError,
  autoSave: false,
  validateOnChange: true,
});

// State includes: data, validationErrors, hasUnsavedChanges, etc.
// Actions include: updateCell, addRow, deleteRow, save, reset, etc.
```

## Redux Integration

### referenceDataSlice

**Location**: `lib/features/referenceDataSlice.ts`

Redux slice for managing reference data state with full history integration:

- **File management** tracking with upload/delete/update actions
- **History tracking** for undo/redo functionality
- **Statistics tracking** (total files, rows, size)
- **Time travel support** for complete state restoration
- **Error handling** with meaningful error states

Key actions:

- `uploadFileSuccess` - Track new file uploads
- `updateFileData` - Track data modifications
- `deleteFile` - Track file deletions
- `undoAction`/`redoAction` - History navigation
- `syncWithStorage` - Sync with localStorage

## Impact Analysis

The system automatically tracks which lookup fields reference each data file:

```typescript
const findAffectedLookupFields = (referenceId: string): string[] => {
  const allShapes = targetShapesStorage.getAll();
  const affectedFields: string[] = [];

  allShapes.forEach((shape: TargetShape) => {
    shape.fields.forEach(field => {
      if (field.type === "lookup") {
        const lookupField = field as LookupField;
        if (lookupField.referenceFile === referenceId) {
          affectedFields.push(`${shape.name}.${field.name}`);
        }
      }
    });
  });

  return affectedFields;
};
```

## Workflows

### Viewing Reference Data

1. User clicks "View Reference Data" from lookup field configuration
2. `ReferenceDataViewer` opens showing:
   - File information and statistics
   - Sortable, searchable data table
   - Impact analysis (which fields use this data)
   - Export/edit options

### Editing Reference Data

1. User clicks "Edit Data" in viewer
2. `ReferenceDataEditor` opens with:
   - Click-to-edit cells
   - Add/delete row functionality
   - Real-time validation
   - Save/cancel options

3. On save:
   - Data validation runs
   - If valid, data is saved to storage
   - Redux history is updated
   - Editor closes and viewer refreshes

### Uploading New Reference Data

1. User clicks "Upload Reference Data"
2. `ReferenceUploadDialog` opens
3. User drags/drops or selects file
4. File validation runs automatically
5. Data preview shows
6. User confirms upload
7. File is processed and stored
8. Redux state is updated

### Replacing Existing Reference Data

1. User clicks "Replace" on existing reference data
2. `ReferenceUploadDialog` opens in replace mode
3. Same upload flow but overwrites existing data
4. Impact analysis warns of affected lookup fields

## Validation Rules

### File Validation

- **File types**: CSV, JSON only
- **File size**: Maximum 10MB
- **Format**: Valid CSV/JSON structure required
- **Headers**: Must have column headers

### Data Validation

- **Key uniqueness**: Key column values must be unique
- **Required fields**: Key column cannot be empty
- **Consistency**: Empty rows allowed but not partial rows

### UI Validation

- **Real-time feedback** with error highlighting
- **Detailed error messages** with specific locations
- **Save prevention** when validation errors exist

## Performance Considerations

- **Pagination**: 25 rows per page for large datasets
- **Virtual scrolling**: Not yet implemented (future enhancement)
- **Debounced search**: Immediate filtering without debouncing
- **Memory management**: Efficient data structures for large files

## Error Handling

- **File upload errors**: Detailed validation feedback
- **Save errors**: Clear error messages with retry options
- **Network errors**: Graceful degradation (local storage only)
- **Validation errors**: Contextual help and suggestions

## Testing

Comprehensive test coverage includes:

- **Component tests**: Full UI interaction testing
- **Hook tests**: State management and validation logic
- **Redux tests**: Action creators and reducers
- **Integration tests**: End-to-end workflows

Key test files:

- `components/reference-data-viewer.test.tsx`
- `components/reference-data-editor.test.tsx`
- `components/reference-upload-dialog.test.tsx`
- `hooks/useReferenceDataEditor.test.ts`
- `lib/features/referenceDataSlice.test.ts`

## Future Enhancements

- **Bulk edit operations** (find/replace, column operations)
- **Advanced search** with column-specific filters
- **Data validation rules** beyond uniqueness
- **Import from external sources** (APIs, databases)
- **Collaborative editing** with conflict resolution
- **Advanced export options** (Excel, filtered exports)

## Integration Points

### With Lookup Fields

- Reference data files are linked via `referenceFile` property
- Impact analysis tracks these relationships
- Changes trigger lookup field re-validation

### With Target Shapes

- Target shapes contain lookup field definitions
- Reference data changes may affect shape validation
- Template system can include reference data

### With History System

- All reference data changes are tracked in Redux history
- Undo/redo works across file operations
- Time travel restores complete reference data state

## Security Considerations

- **Client-side only**: No server uploads (Step 0 MVP)
- **File validation**: Prevents malicious file uploads
- **Size limits**: Prevents memory exhaustion
- **XSS prevention**: All data is properly escaped in UI
