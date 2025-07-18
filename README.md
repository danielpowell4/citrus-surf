# Citrus Surf - Data Tools Portal

A comprehensive collection of data manipulation tools built with Next.js, TanStack Table, and Redux Toolkit.

## 🎯 Features

- **Citrus Surf Importer**: Interactive table with editable cells, import/export, and advanced features
- **Data Import/Export**: Support for JSON and CSV formats
- **Editable Cells**: Configurable cell editing with multiple input types
- **Redux State Management**: Centralized state management with per-request stores
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📊 Editable Cell System

The playground features a powerful editable cell system that supports multiple column types with rich configuration options.

### Supported Column Types

#### 1. Text (`type: 'text'`)

Basic text input with optional constraints.

```typescript
meta: {
  editable: {
    type: 'text',
    placeholder?: string,    // Placeholder text
    maxLength?: number       // Maximum character limit
  }
}
```

**Example:**

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

#### 2. Number (`type: 'number'`)

Numeric input with precision control and validation.

```typescript
meta: {
  editable: {
    type: 'number',
    min?: number,                    // Minimum value
    max?: number,                    // Maximum value
    step?: number,                   // Step increment
    precision?: 'integer' | 'float', // Number precision
    decimalPlaces?: number           // Decimal places for display
  }
}
```

**Examples:**

```typescript
// Integer only
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

// Float with 2 decimal places
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

#### 3. Currency (`type: 'currency'`)

Currency input with formatting and validation.

```typescript
meta: {
  editable: {
    type: 'currency',
    currency?: 'USD' | 'EUR' | 'GBP', // Currency type
    min?: number,                      // Minimum value
    max?: number,                      // Maximum value
    step?: number,                     // Step increment
    precision?: 'integer' | 'float',   // Number precision
    decimalPlaces?: number             // Decimal places for display
  }
}
```

**Example:**

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

#### 4. Date (`type: 'date'`)

Date input with format control and range validation.

```typescript
meta: {
  editable: {
    type: 'date',
    format?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY', // Display format
    min?: string,  // Minimum date (YYYY-MM-DD)
    max?: string   // Maximum date (YYYY-MM-DD)
  }
}
```

**Example:**

```typescript
{
  accessorKey: "startDate",
  header: "Start Date",
  meta: {
    editable: {
      type: 'date',
      format: 'MM/DD/YYYY'
    }
  }
}
```

#### 5. Select (`type: 'select'`)

Dropdown selection with predefined options.

```typescript
meta: {
  editable: {
    type: 'select',
    options: Array<{ value: string; label: string }> // Available options
  }
}
```

**Example:**

```typescript
{
  accessorKey: "department",
  header: "Department",
  meta: {
    editable: {
      type: 'select',
      options: [
        { value: 'Engineering', label: 'Engineering' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'Sales', label: 'Sales' }
      ]
    }
  }
}
```

### Non-Editable Columns

To make a column non-editable, set `editable: false`:

```typescript
meta: {
  editable: false;
}
```

## 🎮 Usage

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

## 🔧 Redux State Management

The table uses Redux Toolkit for state management with the following features:

### State Structure

```typescript
interface TableState {
  data: Person[];
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: Record<string, boolean>;
  globalFilter: string;
  grouping: GroupingState;
  expanded: ExpandedState;
  pagination: PaginationState;
  importData: string;
  isLoading: boolean;
  error: string | null;
  editingCell: { rowId: string; columnId: keyof Person } | null;
}
```

### Key Actions

- `startEditing({ rowId, columnId })`: Start editing a cell
- `stopEditing()`: Stop editing current cell
- `updateCell({ rowId, columnId, value })`: Update cell value
- `setData(data)`: Replace all table data
- `importJsonData(jsonString)`: Import JSON data with validation

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[History System](docs/history-system.md)** - Time-travel functionality and undo/redo
- **[Export System](docs/export-system.md)** - Multi-format export with toast notifications
- **[Import System](docs/import-system.md)** - Intelligent data import with auto-detection
- **[Editable Cells](docs/editable-cells.md)** - Cell editing system and column types
- **[Column Types Reference](docs/column-types-reference.md)** - Complete column configuration guide
- **[Column Sorting](docs/column-sorting.md)** - Sorting implementation details
- **[Column Abstraction Example](docs/column-abstraction-example.md)** - Advanced column patterns

## 🛠️ Development

### Project Structure

```
citrus-surf/
├── app/
│   ├── playground/          # TanStack Table playground
│   │   ├── page.tsx        # Main playground page
│   │   ├── editable-cell.tsx # Editable cell component
│   │   └── data-import.tsx # Data import component
│   └── tools/              # Other data tools
├── lib/
│   ├── features/
│   │   ├── tableSlice.ts   # Redux table slice
│   │   └── historySlice.ts # History management
│   ├── utils/
│   │   ├── csv-export.ts   # CSV export utilities
│   │   └── time-travel.ts  # History restoration
│   ├── store.ts            # Redux store configuration
│   └── hooks.ts            # Redux hooks
├── components/
│   ├── export-dropdown.tsx # Export functionality
│   ├── compact-history.tsx # History UI component
│   └── ui/                 # shadcn/ui components
└── docs/                   # Documentation
    ├── export-system.md    # Export system guide
    ├── history-system.md   # History system guide
    └── ...                 # Other documentation
```

### Adding New Column Types

1. **Define the interface** in `editable-cell.tsx`:

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

### Styling

The project uses Tailwind CSS with a custom color scheme defined in `app/globals.css`. The editable cells use consistent styling with hover states and focus indicators.

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

1. **Invalid hook call error**: Ensure hooks are called inside function components
2. **TypeScript errors**: Check that column configurations match the defined interfaces
3. **Redux state not updating**: Verify that actions are properly dispatched
4. **Cell not editable**: Check that `meta.editable` is not set to `false`

### Debug Mode

The playground includes a debug panel that shows:

- Current edit state
- Redux state information
- Error messages

Enable debug logging by uncommenting the console.log statements in the playground page.
