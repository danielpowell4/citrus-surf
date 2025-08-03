# Editable Cell System Documentation

## Overview

The editable cell system provides a flexible, type-safe way to configure cell editing behavior in TanStack Table. Each column can be configured with specific input types, validation rules, and formatting options.

## Quick Start

```typescript
import { EditableCell } from './editable-cell';

const columns = [
  {
    accessorKey: "name",
    header: "Name",
    cell: info => (
      <EditableCell
        value={info.getValue()}
        row={info.row}
        column={info.column}
        getValue={info.getValue}
        table={info.table}
      />
    ),
    meta: {
      editable: {
        type: 'text',
        placeholder: 'Enter name',
        maxLength: 50
      }
    }
  }
];
```

## Column Types

### 1. Text Input

**Type**: `'text'`

Basic text input with optional constraints.

#### Configuration Options

| Option        | Type     | Description             | Default     |
| ------------- | -------- | ----------------------- | ----------- |
| `placeholder` | `string` | Placeholder text        | `undefined` |
| `maxLength`   | `number` | Maximum character limit | `undefined` |

#### Example

```typescript
{
  accessorKey: "firstName",
  header: "First Name",
  meta: {
    editable: {
      type: 'text',
      placeholder: 'Enter first name',
      maxLength: 50
    }
  }
}
```

### 2. Number Input

**Type**: `'number'`

Numeric input with precision control and validation.

#### Configuration Options

| Option          | Type                   | Description                | Default                         |
| --------------- | ---------------------- | -------------------------- | ------------------------------- |
| `min`           | `number`               | Minimum value              | `undefined`                     |
| `max`           | `number`               | Maximum value              | `undefined`                     |
| `step`          | `number`               | Step increment             | `1` (integer) or `0.01` (float) |
| `precision`     | `'integer' \| 'float'` | Number precision           | `'float'`                       |
| `decimalPlaces` | `number`               | Decimal places for display | `undefined`                     |

#### Examples

**Integer Only:**

```typescript
{
  meta: {
    editable: {
      type: 'number',
      min: 18,
      max: 100,
      precision: 'integer'
    }
  }
}
```

**Float with 2 Decimal Places:**

```typescript
{
  meta: {
    editable: {
      type: 'number',
      precision: 'float',
      decimalPlaces: 2
    }
  }
}
```

### 3. Currency Input

**Type**: `'currency'`

Currency input with automatic formatting and validation.

#### Configuration Options

| Option          | Type                      | Description                | Default                         |
| --------------- | ------------------------- | -------------------------- | ------------------------------- |
| `currency`      | `'USD' \| 'EUR' \| 'GBP'` | Currency type              | `'USD'`                         |
| `min`           | `number`                  | Minimum value              | `undefined`                     |
| `max`           | `number`                  | Maximum value              | `undefined`                     |
| `step`          | `number`                  | Step increment             | `1` (integer) or `0.01` (float) |
| `precision`     | `'integer' \| 'float'`    | Number precision           | `'float'`                       |
| `decimalPlaces` | `number`                  | Decimal places for display | `undefined`                     |

#### Example

```typescript
{
  accessorKey: "salary",
  header: "Salary",
  meta: {
    editable: {
      type: 'currency',
      currency: 'USD',
      min: 0,
      precision: 'integer'
    }
  }
}
```

**Display Output**: `$75,000`

### 4. Date Input

**Type**: `'date'`

Date input with format control and range validation.

#### Configuration Options

| Option   | Type                                           | Description               | Default        |
| -------- | ---------------------------------------------- | ------------------------- | -------------- |
| `format` | `'YYYY-MM-DD' \| 'MM/DD/YYYY' \| 'DD/MM/YYYY'` | Display format            | `'YYYY-MM-DD'` |
| `min`    | `string`                                       | Minimum date (YYYY-MM-DD) | `undefined`    |
| `max`    | `string`                                       | Maximum date (YYYY-MM-DD) | `undefined`    |

#### Examples

**US Date Format:**

```typescript
{
  meta: {
    editable: {
      type: 'date',
      format: 'MM/DD/YYYY'
    }
  }
}
```

**With Date Range:**

```typescript
{
  meta: {
    editable: {
      type: 'date',
      format: 'MM/DD/YYYY',
      min: '2020-01-01',
      max: '2030-12-31'
    }
  }
}
```

**Display Output**: `12/25/2023`

### 5. Select Dropdown

**Type**: `'select'`

Dropdown selection with predefined options.

#### Configuration Options

| Option    | Type                                    | Description       | Default |
| --------- | --------------------------------------- | ----------------- | ------- |
| `options` | `Array<{value: string, label: string}>` | Available options | `[]`    |

#### Example

```typescript
{
  accessorKey: "department",
  header: "Department",
  meta: {
    editable: {
      type: 'select',
      options: [
        { value: 'engineering', label: 'Engineering' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'sales', label: 'Sales' },
        { value: 'hr', label: 'Human Resources' }
      ]
    }
  }
}
```

### 6. Lookup Input

**Type**: `'lookup'`

Cross-reference lookup with automatic derived column updates. The lookup field itself is editable, but derived columns are read-only.

#### Configuration Options

| Option              | Type                | Description                           | Default |
| ------------------- | ------------------- | ------------------------------------- | ------- |
| `referenceFile`     | `string`            | Reference data source file            | Required |
| `match.on`          | `string`            | Column to match against               | Required |
| `match.get`         | `string`            | Column to return as value             | Required |
| `match.show`        | `string`            | Column to display (optional)          | `match.on` |
| `alsoGet`           | `string[]`          | Additional columns to derive          | `[]` |
| `smartMatching.enabled` | `boolean`       | Enable fuzzy matching                 | `true` |
| `smartMatching.confidence` | `number`     | Match confidence threshold (0-1)      | `0.85` |

#### Editability Rules

- **Source column** (`match.on`): **Editable** with dropdown + fuzzy search
- **Derived columns** (`alsoGet`): **Read-only**, auto-update when source changes
- **Visual indicators**: Derived columns shown grayed/disabled

#### Example

```typescript
{
  accessorKey: "department",
  header: "Department", 
  meta: {
    editable: {
      type: 'lookup',
      referenceFile: 'departments.csv',
      match: {
        on: 'dept_name',
        get: 'dept_id',
        show: 'dept_name'
      },
      alsoGet: ['budget_code', 'manager'],
      smartMatching: {
        enabled: true,
        confidence: 0.85
      }
    }
  }
}

// Derived columns (auto-generated, read-only):
{
  accessorKey: "budget_code",
  header: "Budget Code",
  meta: { 
    editable: false,
    derivedFrom: "department" // Indicates this is auto-derived
  }
}
```

#### Interaction Behavior

```typescript
// User edits department:
"Engineering" → Auto-updates:
- dept_id: "ENG001"
- budget_code: "TECH-001" 
- manager: "Sarah Johnson"

// Invalid entry with suggestion:
"Enginering" → Shows: "Did you mean 'Engineering'?"
```

#### Reference Data Transparency

**UI Enhancement Features**:
- **Info icon** (ℹ️) next to lookup fields shows available options
- **Source indicator** displays reference file name and row count
- **View/Edit links** allow inspection and modification of reference data

**Example Enhanced UI**:
```
| Department                    | Dept ID | Budget Code |
|-------------------------------|---------|-------------|  
| [Engineering ▼] ℹ️           | ENG001  | TECH-001    |
    ↳ Popup shows:
      📋 Available Options:
      • Engineering
      • Marketing  
      • HR
      • Finance
      
      📁 Source: departments.csv (23 rows)
      [👁 View Reference Data] [✏️ Edit Values]
```

**Configuration for Enhanced UI**:
```typescript
{
  type: 'lookup',
  referenceFile: 'departments.csv',
  match: { on: 'dept_name', get: 'dept_id' },
  showReferenceInfo: true,     // Enable info icon
  allowReferenceEdit: true,    // Enable edit reference data
  showSourceIndicator: true    // Show "From: file.csv"
}
```

## Non-Editable Columns

To make a column non-editable, set `editable: false`:

### Static Read-Only Columns

```typescript
{
  accessorKey: "id",
  header: "ID",
  meta: {
    editable: false
  }
}
```

### Derived Read-Only Columns (from Lookup Fields)

Columns automatically derived from lookup fields are read-only but show their source:

```typescript
{
  accessorKey: "budget_code",
  header: "Budget Code",
  meta: { 
    editable: false,
    derivedFrom: "department",        // Source lookup field
    referenceFile: "departments.csv" // Source data file
  }
}
```

## TypeScript Interfaces

The system uses TypeScript interfaces for type safety:

```typescript
interface BaseColumnConfig {
  type: "text" | "number" | "currency" | "date" | "select";
}

interface TextColumnConfig extends BaseColumnConfig {
  type: "text";
  placeholder?: string;
  maxLength?: number;
}

interface NumberColumnConfig extends BaseColumnConfig {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  precision?: "integer" | "float";
  decimalPlaces?: number;
}

interface CurrencyColumnConfig extends BaseColumnConfig {
  type: "currency";
  currency?: "USD" | "EUR" | "GBP";
  min?: number;
  max?: number;
  step?: number;
  precision?: "integer" | "float";
  decimalPlaces?: number;
}

interface DateColumnConfig extends BaseColumnConfig {
  type: "date";
  format?: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  min?: string;
  max?: string;
}

interface SelectColumnConfig extends BaseColumnConfig {
  type: "select";
  options: Array<{ value: string; label: string }>;
}

type ColumnConfig =
  | TextColumnConfig
  | NumberColumnConfig
  | CurrencyColumnConfig
  | DateColumnConfig
  | SelectColumnConfig;
```

## User Interaction

### Editing Cells

- **Double-click** any editable cell to enter edit mode
- **Press Enter** to save changes
- **Press Escape** to cancel editing
- **Click outside** the cell to save changes

### Visual Feedback

- Editing cells show a ring border and background color
- Toast notifications appear when entering edit mode
- Debug panel shows current edit state

### Keyboard Shortcuts

- `Enter`: Save changes and exit edit mode
- `Escape`: Cancel editing and revert changes
- `Tab`: Navigate between cells (when supported)

## Redux Integration

The editable cell system integrates with Redux for state management:

### Actions

- `startEditing({ rowId, columnId })`: Start editing a cell
- `stopEditing()`: Stop editing current cell
- `updateCell({ rowId, columnId, value })`: Update cell value

### State

```typescript
editingCell: { rowId: string; columnId: keyof Person } | null;
```

## Extending the System

### Adding New Column Types

1. **Define the interface**:

```typescript
interface NewColumnConfig extends BaseColumnConfig {
  type: "newType";
  // Add your configuration options
}
```

2. **Add to the union type**:

```typescript
type ColumnConfig = TextColumnConfig | NumberColumnConfig | ... | NewColumnConfig;
```

3. **Implement rendering logic** in `renderInput()` and `renderDisplay()` functions.

4. **Add formatting helpers** if needed.

### Example: Adding a Color Picker

```typescript
interface ColorColumnConfig extends BaseColumnConfig {
  type: 'color';
  allowCustom?: boolean;
  presetColors?: string[];
}

// In renderInput():
case 'color':
  return (
    <input
      type="color"
      value={value}
      onChange={e => setValue(e.target.value)}
      // ... other props
    />
  );

// In renderDisplay():
case 'color':
  return (
    <div
      className="w-6 h-6 rounded border"
      style={{ backgroundColor: value }}
    />
  );
```

## Best Practices

1. **Use appropriate types** for your data
2. **Provide meaningful placeholders** for text inputs
3. **Set reasonable min/max values** for numeric inputs
4. **Use consistent formatting** across similar columns
5. **Handle edge cases** in your validation logic
6. **Test with various data types** and edge cases

## Troubleshooting

### Common Issues

1. **Cell not editable**: Check that `meta.editable` is not set to `false`
2. **Type errors**: Ensure column configuration matches the defined interfaces
3. **Formatting issues**: Verify that the input type supports your formatting needs
4. **Validation not working**: Check that min/max values are properly set

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// In the playground page
console.log("Column config:", column.columnDef.meta?.editable);
console.log("Current value:", value);
console.log("Is editing:", isEditing);
```

The debug panel in the playground shows current edit state and can help identify configuration issues.
