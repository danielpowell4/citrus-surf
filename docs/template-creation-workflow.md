# Template Creation Workflow

## Overview

The template creation workflow provides seamless integration between template building and data mapping, automatically transitioning users to mapping mode when data is available for immediate column mapping.

## User Experience Flow

### With Data Available
1. **Upload data** to the data table playground
2. **Click "Create New Template"** in the right drawer (or "From Current Data")
3. **Build template** using the template builder workflow
4. **Upon creation completion** → **Automatically redirected to mapping mode**
5. **Start mapping columns immediately** - no additional navigation steps

### Without Data Available  
1. **Click "Create New Template"** from any state
2. **Build template** using the template builder workflow
3. **Upon creation completion** → **Redirected to data table**
4. **Ready for data import** when user uploads data later

## Field Types

### Standard Field Types
- **Text** - Basic string fields
- **Number** - Numeric values (integer, decimal)
- **Boolean** - True/false values
- **Date/DateTime** - Date and time fields
- **Email** - Email address validation
- **Phone** - Phone number formatting
- **URL** - URL validation
- **Currency** - Monetary values with formatting
- **Percentage** - Percentage values
- **Enum** - Predefined value lists

### Lookup Fields
**New in LOOKUP-009**: Create fields that reference external data sources for data enrichment and validation.

#### Lookup Field Configuration
1. **Reference Data Selection** - Choose from uploaded reference files or upload new CSV/JSON files
2. **Match Configuration** - Define which columns to match against and return
3. **Smart Matching** - Enable fuzzy matching with configurable confidence thresholds
4. **Derived Fields** - Automatically include additional columns from reference data
5. **Error Handling** - Configure behavior for unmatched values (error, warning, or null)

#### Lookup Field Preview
The template preview shows comprehensive lookup field information:
- Reference data source filename
- Match configuration (input → output columns)
- Fuzzy matching settings and confidence thresholds
- Derived fields that will be automatically generated

## Technical Implementation

### Key Files

| File | Purpose |
|------|---------|
| `app/playground/template-builder/page.tsx` | Template creation navigation logic |
| `app/playground/target-shape-workflow.tsx` | Template creation UI and save logic with lookup field support |
| `lib/features/targetShapesSlice.ts` | Redux actions including async thunk |
| `lib/features/referenceDataSlice.ts` | Reference data management for lookup fields |

### Architecture Details

#### ID Synchronization Challenge

**Problem**: Template creation workflow was experiencing ID mismatches between redirect URLs and stored shapes.

**Root Cause**: 
- Template builder creates shape with temporary ID (e.g., `shape_01K1EYC7...`)
- Storage layer generates new final ID (e.g., `shape_01K1EYCP...`) 
- Redirect used original temp ID, but stored shape had different ID
- Data table couldn't find shape, mapping mode failed to open

**Solution**: `saveTargetShapeAsync` Redux Thunk

```typescript
// Before: Sync action, callback used original shape
dispatch(saveTargetShape(data));
onShapeCreated(data); // Used temp ID

// After: Async thunk returns saved shape with correct ID  
const result = await dispatch(saveTargetShapeAsync(data));
const savedShape = result.payload; // Has storage-generated ID
onShapeCreated(savedShape); // Uses correct ID
```

#### Navigation Logic

```typescript
const handleShapeCreated = (shape: TargetShape) => {
  dispatch(selectTargetShape(shape.id));
  dispatch(loadShapes()); // Ensure shape is available
  
  if (data.length > 0) {
    // With data: Go to mapping mode
    router.push(`/playground/data-table?targetShape=${shape.id}&mode=mapping`);
  } else {
    // Without data: Go to data table  
    router.push("/playground/data-table");
  }
};
```

### Redux Implementation

#### Async Thunk for Shape Saving

```typescript
export const saveTargetShapeAsync = createAsyncThunk(
  'targetShapes/saveAsync',
  async (shape: TargetShape) => {
    const savedShape = targetShapesStorage.save(shape);
    return savedShape; // Returns shape with correct storage-generated ID
  }
);
```

#### Extra Reducers for Thunk Handling

```typescript
extraReducers: (builder) => {
  builder
    .addCase(saveTargetShapeAsync.fulfilled, (state, action) => {
      state.shapes.push(action.payload);
      state.error = null;
      state.isLoading = false;
    })
    .addCase(saveTargetShapeAsync.pending, (state) => {
      state.isLoading = true;
    })
    .addCase(saveTargetShapeAsync.rejected, (state, action) => {
      state.error = action.error.message || "Failed to save target shape";
      state.isLoading = false;
    });
}
```

### Workflow Component Integration

#### Template Builder Page

The template builder page handles the navigation after shape creation:

```typescript
const handleShapeCreated = (shape: TargetShape) => {
  dispatch(selectTargetShape(shape.id));
  dispatch(loadShapes());
  
  // Conditional navigation based on data availability
  if (data.length > 0) {
    router.push(`/playground/data-table?targetShape=${shape.id}&mode=mapping`);
  } else {
    router.push("/playground/data-table");
  }
};
```

#### Template Workflow Component

The workflow component uses the async thunk to save and return the correct shape:

```typescript
const handleSave = async () => {
  if (isEditMode) {
    // Update existing shape (synchronous)
    dispatch(updateTargetShape({ id: data.id, updates: data }));
    onShapeCreated(data);
  } else {
    // Create new shape (asynchronous to get correct ID)
    const result = await dispatch(saveTargetShapeAsync(data));
    if (saveTargetShapeAsync.fulfilled.match(result)) {
      onShapeCreated(result.payload); // Use saved shape with correct ID
    }
  }
};
```

## URL Parameter Handling

The data table page handles the mapping mode transition via URL parameters:

```typescript
useEffect(() => {
  const targetShapeId = searchParams.get("targetShape");
  const mode = searchParams.get("mode");

  if (targetShapeId && mode === "mapping") {
    const shape = shapes.find(s => s.id === targetShapeId);
    if (shape) {
      setSelectedShape(shape);
      setMappingMode(true);
    }
  }
}, [searchParams, shapes]);
```

## Testing Coverage

### Navigation Logic Tests

Location: `app/playground/template-builder/page.test.tsx`

- ✅ **Data available scenario**: Redirects to mapping mode
- ✅ **No data scenario**: Redirects to data table only
- ✅ **ID synchronization**: Uses saved shape ID (not original temp ID)
- ✅ **Both creation flows**: "From data" and "from scratch"

### Redux Thunk Tests

Location: `lib/features/targetShapesSlice.test.ts`

- ✅ **Async save success**: Returns saved shape with correct ID
- ✅ **Error handling**: Proper error states and loading management
- ✅ **Loading states**: Pending/fulfilled/rejected lifecycle
- ✅ **State management**: Proper integration with Redux store

## Common Issues & Solutions

### Issue: Mapping Mode Not Opening

**Symptoms**: User redirected to data table but mapping mode doesn't activate

**Causes**:
1. Shape ID mismatch between URL and store
2. Shape not loaded in Redux store when page mounts
3. URL parameters not properly parsed

**Solutions**:
1. Use `saveTargetShapeAsync` to ensure correct ID
2. Dispatch `loadShapes()` after shape creation
3. Verify URL format: `?targetShape=ID&mode=mapping`

### Issue: Duplicate Shapes in Store

**Symptoms**: Same shape appears multiple times in sidebar

**Cause**: Both sync and async actions adding shape to store

**Solution**: Use either `saveTargetShape` OR `saveTargetShapeAsync`, not both

## Performance Considerations

- **Async save operations**: Minimal impact, storage operations are fast
- **Shape loading**: Debounced to prevent excessive storage reads
- **Navigation timing**: Waits for save completion before redirect
- **Memory usage**: Shape list bounded by user usage patterns

## Future Enhancements

- **Optimistic updates**: Show shape immediately, sync in background
- **Error recovery**: Retry failed saves with user notification
- **Bulk operations**: Save multiple shapes in single transaction
- **Real-time sync**: WebSocket updates for collaborative editing

## Related Documentation

- [Target Shapes System](./target-shapes.md) - Core data transformation system
- [History System](./history-system.md) - Undo/redo functionality
- [Redux Persistence](./redux-persistence.md) - State persistence patterns
- [Import System](./import-system.md) - Data import workflow