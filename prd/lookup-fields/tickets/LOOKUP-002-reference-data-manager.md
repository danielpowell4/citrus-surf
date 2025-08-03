# LOOKUP-002: Reference Data Manager

## Context

Create utilities to manage reference data files - uploading, parsing, storing, and retrieving reference data for lookup operations. This provides the foundation for all lookup functionality.

## Acceptance Criteria

### AC1: Reference Data Storage
- [ ] Create `ReferenceDataManager` class in `lib/utils/`
- [ ] Support CSV and JSON reference file formats
- [ ] Store reference data in browser storage with efficient retrieval
- [ ] Handle multiple reference files per session

### AC2: Data Parsing & Validation
- [ ] Parse uploaded reference files into structured data
- [ ] Validate reference data structure (required columns exist)
- [ ] Provide meaningful error messages for malformed data
- [ ] Support common CSV encoding issues (UTF-8, BOM, etc.)

### AC3: Reference Data API
- [ ] `uploadReferenceFile(file: File, id: string)` - Upload and store
- [ ] `getReferenceData(id: string)` - Retrieve parsed data  
- [ ] `listReferenceFiles()` - Get all available reference files
- [ ] `deleteReferenceFile(id: string)` - Remove reference data
- [ ] `updateReferenceData(id: string, data: any[])` - Update existing data

### AC4: Memory Management
- [ ] Implement efficient storage for large reference files
- [ ] Add cleanup for unused reference data
- [ ] Provide reference data size/row count information

## Technical Notes

```typescript
interface ReferenceDataManager {
  uploadReferenceFile(file: File, id: string): Promise<ReferenceDataInfo>;
  getReferenceData(id: string): any[] | null;
  listReferenceFiles(): ReferenceDataInfo[];
  deleteReferenceFile(id: string): boolean;
  updateReferenceData(id: string, data: any[]): boolean;
}

interface ReferenceDataInfo {
  id: string;
  filename: string;
  rowCount: number;
  columns: string[];
  uploadedAt: string;
  lastModified: string;
}
```

## Dependencies
- Existing CSV parsing utilities
- localStorage/storage system

## Estimated Effort
**Medium** (3-4 days)

## Implementation TODOs

### Types & Interfaces
- [ ] Define comprehensive TypeScript interfaces for all manager methods
- [ ] Create types for reference data metadata and storage
- [ ] Add proper error types for reference data operations
- [ ] Export all types from appropriate location
- [ ] Use proper ID generation patterns: `ref_` prefix for reference files

### Testing
- [ ] Unit tests for all ReferenceDataManager methods
- [ ] Test file upload parsing (CSV, JSON, various encodings)
- [ ] Test storage operations (upload, retrieve, delete, update)
- [ ] Test error handling for malformed/invalid data
- [ ] Test memory management and cleanup
- [ ] Performance tests for large reference files

### Documentation
- [ ] Add comprehensive JSDoc for all public methods
- [ ] Update relevant docs with reference data management info
- [ ] Create usage examples and best practices guide

### Redux History Integration
- [ ] Create dedicated reference data history system (separate from main table history)
- [ ] Track reference data operations: upload, edit, delete operations
- [ ] Add actions for reference data history:
  - `referenceData/uploadFile`
  - `referenceData/updateData`
  - `referenceData/deleteFile`
- [ ] Implement undo/redo for reference data changes
- [ ] Ensure reference data history persists independently of table state
- [ ] Test time-travel for reference data modifications

## Files to Create
- `lib/utils/reference-data-manager.ts`
- `lib/utils/reference-data-manager.test.ts`
- `lib/types/reference-data-types.ts` (if types are substantial)