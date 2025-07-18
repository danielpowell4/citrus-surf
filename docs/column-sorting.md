# Column Sorting

The table now supports advanced column sorting with the following features:

## Default Behavior

- **Default Sort**: By default, the table is sorted by import order (using the `id` field)
- **Visual Indicators**: Column headers show sort state with arrow icons
- **Three-State Sorting**: Each column cycles through ascending → descending → no sort

## Sorting Controls

### Mouse Interaction

- **Single Click**: Sort by that column (replaces current sort)
- **Shift + Click**: Add to existing sorts (multi-column sorting)
- **Visual Feedback**: Hover effects and focus states

### Keyboard Navigation

- **Tab**: Navigate between sortable headers
- **Enter/Space**: Activate sorting (respects Shift key for multi-sort)
- **Escape**: Clear focus from header

### Sort States

1. **No Sort**: No arrow shown by default, shows up/down arrow (↕️) on hover
2. **Ascending** (↑): Shows up arrow icon
3. **Descending** (↓): Shows down arrow icon

### Multi-Column Sort Indicators

When multiple columns are sorted, each sorted column displays a small numbered badge (1, 2, 3, etc.) in the top-right corner showing the sort priority:

- **1**: Primary sort column
- **2**: Secondary sort column
- **3**: Tertiary sort column
- etc.

## Multi-Column Sorting

When holding Shift while clicking a column header:

- **First click**: Adds column to end of sort order (ascending)
- **Second click**: Changes to descending
- **Third click**: Removes column from sort

**Sort Order Priority:**

- First column in sort array = Primary sort (badge "1")
- Second column in sort array = Secondary sort (badge "2")
- Third column in sort array = Tertiary sort (badge "3")
- etc.

**Example:**

1. Click "First Name" → Primary sort (badge "1")
2. Shift + Click "Last Name" → Secondary sort (badge "2")
3. Shift + Click "Age" → Tertiary sort (badge "3")

## Sort Priority

In multi-column sorting, the order of columns determines priority:

- First column in sort array has highest priority
- Subsequent columns are used as tie-breakers

## Accessibility

- **ARIA Labels**: Screen readers announce current sort state
- **Tooltips**: Hover to see next action
- **Keyboard Navigation**: Full keyboard support
- **Focus Indicators**: Clear visual focus states

## Technical Implementation

The sorting is implemented using:

- **TanStack Table**: Built-in sorting functionality
- **Redux State**: Persistent sort state management
- **Column Transformer**: Automatic header and cell transformation
- **Custom Header Component**: Enhanced with sorting controls
- **TypeScript**: Full type safety

## Column Definition Abstraction

The table now uses a simplified column definition system:

```typescript
// Simple definition
{
  accessorKey: "firstName",
  header: "First Name",
  meta: {
    editable: { type: "text", maxLength: 50 }
  }
}

// Automatically transformed to include sorting and editing
```

See [Column Abstraction Example](./column-abstraction-example.md) for detailed usage.

## Usage Examples

```typescript
// Single column sort
dispatch(toggleColumnSort({ columnId: "firstName" }));

// Multi-column sort
dispatch(toggleColumnSort({ columnId: "lastName", shiftKey: true }));
```

## State Management

Sort state is stored in Redux with the following structure:

```typescript
sorting: [
  { id: "firstName", desc: false },
  { id: "lastName", desc: true },
];
```
