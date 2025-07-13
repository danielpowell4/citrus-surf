# Column Definition Abstraction

The table now uses a simplified column definition system that automatically handles sorting and editing functionality.

## Basic Usage

Instead of writing complex TanStack table column definitions, you can now use a simple format:

```typescript
const simpleColumns: SimpleColumnDef<Person>[] = [
  {
    accessorKey: "firstName",
    header: "First Name",
    meta: {
      editable: {
        type: "text",
        placeholder: "Enter first name",
        maxLength: 50,
      },
    },
  },
];
```

## Sorting Configuration

### Default Behavior

- **All columns are sortable by default** (no configuration needed)
- **Three-state sorting**: ascending → descending → no sort
- **Multi-column sorting** with Shift key (new columns added to end of sort order)
- **Hover indicators**: Arrows only show on hover when not sorted
- **Sort order badges**: Numbered indicators (1, 2, 3) for multi-column sorting

### Disable Sorting

```typescript
{
  accessorKey: "progress",
  header: "Progress",
  meta: {
    sortable: false, // Explicitly disable sorting
    editable: false,
  },
}
```

### Custom Sortable Column

```typescript
{
  accessorKey: "id",
  header: "ID",
  meta: {
    sortable: true, // Explicitly enable sorting (default)
    editable: false,
  },
}
```

## Editing Configuration

### Default Behavior

- **All columns are editable by default** (no configuration needed)
- **Automatic cell type detection** based on data type

### Disable Editing

```typescript
{
  accessorKey: "progress",
  header: "Progress",
  meta: {
    editable: false, // Disable editing
  },
}
```

### Custom Editable Configuration

```typescript
{
  accessorKey: "age",
  header: "Age",
  meta: {
    editable: {
      type: "number",
      min: 18,
      max: 100,
      precision: "integer",
    },
  },
}
```

## Custom Cell Renderers

You can still provide custom cell renderers when needed:

```typescript
{
  accessorKey: "progress",
  header: "Progress",
  cell: info => (
    <div className="w-full bg-secondary rounded-full h-2">
      <div
        className="bg-primary h-2 rounded-full"
        style={{ width: `${info.getValue()}%` }}
      />
    </div>
  ),
  meta: {
    editable: false,
  },
}
```

## Transformation Process

The `transformColumns` function automatically:

1. **Adds SortableHeader components** to sortable columns
2. **Adds EditableCell components** to editable columns
3. **Preserves custom cell renderers** when provided
4. **Handles keyboard events** and accessibility
5. **Manages sort state** through Redux

## Before vs After

### Before (Complex)

```typescript
{
  accessorKey: "firstName",
  header: ({ column }) => (
    <SortableHeader
      isSorted={!!column.getIsSorted()}
      isSortedDesc={column.getIsSorted() === "desc"}
      onSort={(event) => {
        const shiftKey = (event as React.MouseEvent).shiftKey;
        dispatch(toggleColumnSort({ columnId: column.id, shiftKey }));
      }}
    >
      First Name
    </SortableHeader>
  ),
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
      type: "text",
      placeholder: "Enter first name",
      maxLength: 50,
    },
  },
}
```

### After (Simple)

```typescript
{
  accessorKey: "firstName",
  header: "First Name",
  meta: {
    editable: {
      type: "text",
      placeholder: "Enter first name",
      maxLength: 50,
    },
  },
}
```

## Benefits

1. **DRY Principle**: No repetitive sorting/editing code
2. **Consistency**: All columns behave the same way by default
3. **Maintainability**: Changes to sorting/editing logic in one place
4. **Readability**: Column definitions are much cleaner
5. **Flexibility**: Easy to override defaults when needed
