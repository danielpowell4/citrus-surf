# LOOKUP-009: Template Builder Integration

## Context

Integrate lookup fields into the existing template builder UI, allowing users to create and configure lookup fields through the visual target shape builder interface.

## Acceptance Criteria

### AC1: Lookup Field Creation in Template Builder
- [ ] Add "Lookup" option to field type dropdown in template builder
- [ ] Create lookup field configuration form with all necessary options
- [ ] Allow users to upload and select reference files during template creation
- [ ] Provide preview of lookup field behavior

### AC2: Reference File Management in Builder
- [ ] File upload interface for reference data within template builder
- [ ] Validation of reference file structure and columns
- [ ] Preview of available reference values
- [ ] Option to edit reference data inline during template creation

### AC3: Lookup Configuration UI
- [ ] Intuitive dropdowns for selecting match columns and return columns
- [ ] Smart matching configuration (enable/disable, confidence threshold)
- [ ] Derived fields selection with multi-select interface
- [ ] Real-time validation of lookup configuration

### AC4: Template Preview with Lookup Fields
- [ ] Preview how lookup fields will behave in the final table
- [ ] Show derived columns in template preview
- [ ] Display reference data source information
- [ ] Validate lookup configuration before template save

## Technical Notes

```typescript
interface LookupFieldBuilderProps {
  field: LookupField;
  availableReferenceFiles: ReferenceDataInfo[];
  onFieldChange: (field: LookupField) => void;
  onReferenceUpload: (file: File) => Promise<void>;
}

// Integration points:
// - Template builder form components
// - File upload handling
// - Real-time validation
// - Preview generation
```

## Implementation TODOs

### Types & Interfaces
- [ ] Define props interfaces for lookup field builder components
- [ ] Create types for reference file selection and validation
- [ ] Add proper types for template preview with lookup fields
- [ ] Ensure compatibility with existing template builder types

### Testing
- [ ] Unit tests for lookup field creation in template builder
- [ ] Unit tests for reference file upload and validation
- [ ] Unit tests for lookup configuration form validation
- [ ] Integration tests with existing template builder
- [ ] End-to-end tests for complete lookup template creation workflow

### Documentation
- [ ] Update template builder documentation with lookup field creation
- [ ] Add user guide for configuring lookup fields in templates
- [ ] Document best practices for reference data organization
- [ ] Create troubleshooting guide for lookup configuration issues

### Redux History Integration
- [ ] Add template builder actions to `meaningfulActions`:
  - `templateBuilder/addLookupField`
  - `templateBuilder/updateLookupField`
  - `templateBuilder/removeLookupField`
- [ ] Ensure template building with lookup fields is tracked in history
- [ ] Test undo/redo functionality during template creation
- [ ] Verify that reference file uploads are handled appropriately in history

## Dependencies
- LOOKUP-001 (Core Types)
- LOOKUP-002 (Reference Data Manager)
- Existing template builder system

## Estimated Effort
**Medium** (4-5 days)

## Files to Create
- `app/playground/template-builder/lookup-field-builder.tsx`
- `app/playground/template-builder/lookup-field-builder.test.tsx`
- `app/playground/template-builder/reference-file-uploader.tsx`
- `components/lookup-configuration-form.tsx`
- `components/lookup-configuration-form.test.tsx`

## Files to Modify
- `app/playground/template-builder/page.tsx`
- `lib/store.ts` (add template builder actions to meaningfulActions)