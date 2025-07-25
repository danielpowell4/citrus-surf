# Target Shape Import Connection

## Overview

The Target Shape Import Connection system allows users to apply target shapes to imported data, enabling column mapping, data validation, and transformation workflows. This creates a bridge between raw imported data and structured, validated output.

## User Workflow

### 1. Import Data First
Users start by importing their data through the standard data import interface:
- Upload CSV, TSV, or paste JSON data
- Data is imported into the table with auto-generated internal IDs
- Navigate to the data table view

### 2. Apply Target Shape (Post-Import)
In the data table view, users can apply a target shape:
- Click "Templates & Shapes" to open the drawer
- Select from saved target shapes
- Click "Apply" to enter mapping mode

### 3. Column Mapping Mode
When a target shape is applied, the interface enters mapping mode:
- Shows side-by-side comparison of import columns vs target fields
- Displays target shape requirements (required fields, data types)
- Provides mapping preview interface
- URL reflects mapping state: `/playground/data-table?targetShape={id}&mode=mapping`

### 4. Active Work Mode
The mapping mode provides:
- Visual indication that mapping is active (badge in header)
- Column mapping preview
- Exit mapping mode option
- Apply mapping action (future implementation)

## Technical Implementation

### URL-Based State Management
The mapping mode is managed through URL parameters:
- `targetShape={id}`: The ID of the selected target shape
- `mode=mapping`: Indicates active mapping mode
- State persists across page refreshes and navigation

### Component Structure

#### DataImport Component
- Simplified to focus on data import only
- No target shape selection during import
- Maintains existing CSV/JSON import functionality

#### DataTable Page
- Enhanced with target shape integration
- Handles URL parameter-based mapping mode
- Shows mapping interface when active
- Provides mapping controls and navigation

#### Templates Drawer
- Lists available target shapes
- Allows shape application to imported data
- Triggers mapping mode when shape is selected

### State Flow
```
Import Data → Data Table → Apply Target Shape → Mapping Mode → Active Work
```

## Features Implemented

### ✅ Core Functionality
- [x] Import data without target shape selection
- [x] Apply target shapes post-import
- [x] URL-based mapping mode state
- [x] Visual mapping mode indicators
- [x] Interactive 1:1 column mapping interface
- [x] Auto-suggestion for similar column names
- [x] Required field validation and coverage
- [x] Apply mapping data transformation
- [x] Exit mapping mode capability

### ✅ User Experience
- [x] Clear visual feedback for mapping mode
- [x] Interactive dropdown column selection
- [x] Real-time mapping validation
- [x] Auto-suggested column mappings
- [x] Visual status indicators (✓, ⚠️, ⚠️)
- [x] Required field coverage tracking
- [x] Unmapped column warnings
- [x] Seamless mode transitions
- [x] Persistent URL state

### ✅ Technical Quality
- [x] Comprehensive test coverage
- [x] Type-safe implementation
- [x] Redux integration
- [x] URL parameter handling
- [x] Component separation of concerns

## Testing

### Core Logic Tests
Tests are located in `lib/utils/column-mapping-logic.test.ts` and cover:
- Column mapping auto-suggestions
- Required field validation
- Data transformation with mappings
- Edge cases (empty data, missing columns)
- Internal ID preservation

### Component Tests  
Tests are located in `components/column-mapping.test.tsx` and cover:
- Interactive mapping interface
- Dropdown selections and validations
- Auto-mapping initialization
- Required field coverage indicators

Run tests with:
```bash
npm test column-mapping-logic
npm test column-mapping
```

## Future Enhancements

### Planned Features
- [ ] Drag-and-drop column mapping
- [ ] Data transformation preview
- [ ] Bulk mapping operations  
- [ ] Mapping templates and presets
- [ ] Advanced pattern matching
- [ ] Custom transformation rules

### Advanced Mapping
- [ ] Complex field transformations
- [ ] Multi-column to single field mapping
- [ ] Conditional mapping rules
- [ ] Data quality scoring
- [ ] Validation error highlighting

### Integration Features
- [ ] Export mapped data in target shape format
- [ ] Save mapping configurations
- [ ] Mapping history and undo
- [ ] Collaboration on mappings
- [ ] API integration for automated mapping

## Code Examples

### Applying Target Shape
```typescript
const handleApplyTemplate = async (shape: TargetShape) => {
  setSelectedShape(shape);
  setMappingMode(true);
  router.push(`/playground/data-table?targetShape=${shape.id}&mode=mapping`);
};
```

### URL Parameter Detection
```typescript
useEffect(() => {
  const targetShapeId = searchParams.get('targetShape');
  const mode = searchParams.get('mode');
  
  if (targetShapeId && mode === 'mapping') {
    const shape = shapes.find(s => s.id === targetShapeId);
    if (shape) {
      setSelectedShape(shape);
      setMappingMode(true);
    }
  }
}, [searchParams, shapes]);
```

### Column Mapping Preview
```typescript
// Extract import columns (excluding internal fields)
const importColumns = data.length > 0 
  ? Object.keys(data[0]).filter(key => !key.startsWith('_'))
  : [];

// Display target shape fields with requirements
{selectedShape.fields.map(field => (
  <div key={field.id}>
    <div className="font-medium">{field.name}</div>
    <div className="text-xs text-muted-foreground">
      {field.type} {field.required && '(required)'}
    </div>
  </div>
))}
```

## Integration Points

### With Import System
- Uses existing data import functionality
- Preserves import flow and user experience
- Maintains data integrity and ID generation

### With Target Shape System
- Leverages existing target shape storage
- Uses Redux store for state management
- Integrates with shape creation workflows

### With Data Table
- Enhances existing table functionality
- Maintains editing and filtering capabilities
- Adds mapping mode overlay

## Benefits

### For Users
- **Clear Workflow**: Import first, then apply structure
- **Visual Feedback**: Clear indication of mapping state
- **Flexibility**: Can import data without pre-planning structure
- **Control**: Full visibility into mapping process

### For Developers
- **Separation of Concerns**: Import and mapping are distinct phases
- **URL-Based State**: Shareable and bookmarkable mapping sessions
- **Test Coverage**: Comprehensive testing ensures reliability
- **Extensibility**: Clear architecture for future enhancements

This implementation provides a solid foundation for connecting target shapes with imported data while maintaining the simplicity and transparency that are core to the Citrus Surf philosophy.