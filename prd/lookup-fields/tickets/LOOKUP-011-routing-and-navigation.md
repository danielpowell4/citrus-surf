# LOOKUP-011: Routing and Navigation Patterns

## Context

Implement proper routing and navigation patterns for lookup field workflows, following existing app conventions for user-friendly redirects, URL structure, and deep linking support.

## Acceptance Criteria

### AC1: Reference Data Management Routes
- [ ] Create dedicated route: `/playground/reference-data` for reference data management
- [ ] Support query params: `?file={fileId}&mode={view|edit}`
- [ ] Deep linking to specific reference files and edit modes
- [ ] Breadcrumb navigation back to main workflow

### AC2: Lookup Configuration Routes
- [ ] Extend template builder routes to support lookup field configuration
- [ ] Query params: `?field={fieldId}&action={configure-lookup}`
- [ ] Reference data upload flow within template builder
- [ ] Navigation to reference data viewer from template builder

### AC3: Fuzzy Match Review Routes
- [ ] Modal overlay route: `/playground/data-table?review=fuzzy-matches&batch={batchId}`
- [ ] Deep linking to specific match review sessions
- [ ] Navigation back to data table with applied changes
- [ ] Progress preservation during navigation

### AC4: User-Friendly Redirects
- [ ] After reference data upload → Redirect to reference data viewer
- [ ] After lookup field creation → Redirect to template preview with lookup
- [ ] After fuzzy match review → Redirect to data table with processed data
- [ ] After reference data edit → Show confirmation and redirect options

## Technical Notes

```typescript
// New route structure
/playground/reference-data                    // Reference data management
/playground/reference-data?file=ref_xxx      // View specific reference file
/playground/reference-data?file=ref_xxx&mode=edit // Edit reference file
/playground/template-builder?field=field_xxx&action=configure-lookup // Lookup config
/playground/data-table?review=fuzzy-matches&batch=batch_xxx // Match review

// ID patterns to add
export const ID_PREFIXES = {
  // ... existing
  REFERENCE: "ref",
  LOOKUP_BATCH: "batch",
  FUZZY_MATCH: "match",
} as const;
```

## Implementation TODOs

### Types & Interfaces
- [ ] Define route parameter types for all new routes
- [ ] Create navigation helper types and utilities
- [ ] Add proper types for URL search params handling
- [ ] Ensure type safety for all route transitions

### Testing
- [ ] Unit tests for navigation helper functions
- [ ] Integration tests for route transitions and redirects
- [ ] End-to-end tests for complete user workflows across routes
- [ ] Test deep linking and URL sharing functionality
- [ ] Test browser back/forward navigation

### Documentation
- [ ] Document new route structure and navigation patterns
- [ ] Add user guide for reference data management workflows
- [ ] Create developer guide for navigation patterns
- [ ] Update existing routing documentation

### Redux History Integration
- [ ] Route transitions should NOT be tracked in main history
- [ ] However, ensure navigation preserves current history state
- [ ] Test that time-travel works correctly across route changes
- [ ] Verify that modal routes maintain underlying page state

### ID Generation Integration
- [ ] Add new ID prefixes to `lib/utils/id-generator.ts`:
  - `REFERENCE: "ref"` for reference files
  - `LOOKUP_BATCH: "batch"` for fuzzy match batches
  - `FUZZY_MATCH: "match"` for individual fuzzy matches
- [ ] Create convenience functions:
  - `generateReferenceId()`
  - `generateLookupBatchId()`
  - `generateFuzzyMatchId()`
- [ ] Ensure all lookup-related entities use proper ID patterns

## Dependencies
- Existing Next.js App Router structure
- Current navigation patterns
- ID generation system

## Estimated Effort
**Medium** (3-4 days)

## Files to Create
- `app/playground/reference-data/page.tsx`
- `app/playground/reference-data/layout.tsx`
- `lib/utils/lookup-navigation.ts` (navigation helpers)
- `lib/utils/lookup-navigation.test.ts`

## Files to Modify
- `lib/utils/id-generator.ts` (add new ID prefixes)
- `app/playground/template-builder/page.tsx` (add lookup configuration routes)
- `app/playground/data-table/page.tsx` (add fuzzy match review routes)
- Existing navigation components to support new routes