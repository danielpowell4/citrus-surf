# History System Documentation

## Overview

The history system provides time-travel functionality for the table playground, allowing users to undo/redo actions and view a complete history of changes. It's built on Redux Toolkit with custom middleware and a dedicated history slice.

## Architecture

### Core Components

1. **History Middleware** (`lib/store.ts`)
   - Captures meaningful user actions
   - Adds timestamps and state snapshots
   - Filters out internal/automatic actions

2. **History Slice** (`lib/features/historySlice.ts`)
   - Manages history state and current position
   - Provides selectors for history data

3. **Time Travel Utilities** (`lib/utils/time-travel.ts`)
   - Handles state restoration
   - Provides action summaries and categorization

4. **Compact History UI** (`components/compact-history.tsx`)
   - Drawer-based history interface
   - Undo/redo controls
   - Version navigation

## How It Works

### Action Capture

The history middleware automatically captures table actions that are meaningful to users:

```typescript
// Only these actions are tracked in history
const meaningfulActions = [
  "table/setData", // Data loading/resetting
  "table/applyTemplate", // Template/shape application
  "table/importJsonData",
  "table/updateCell", // Cell editing
  "table/setSorting", // Sorting changes
  "table/toggleColumnSort",
  "table/setColumnFilters", // Filtering changes
  "table/setGlobalFilter",
  "table/setColumnVisibility", // Visibility changes
  "table/restoreFromHistory", // History restoration
];
```

### State Snapshots

Each action captures a complete snapshot of the table state:

```typescript
const actionWithTimestamp = {
  ...action,
  timestamp: Date.now(),
  id: Math.random().toString(36).substr(2, 9),
  stateSnapshot: store.getState().table, // Complete table state
};
```

### Time Travel

Users can navigate through history using:

- **Undo/Redo buttons** - Step-by-step navigation
- **Keyboard shortcuts** - Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y
- **History drawer** - Click any version to restore
- **Reapply buttons** - Restore specific versions

## Adding New Actions

### Step 1: Add Action to Table Slice

```typescript
// In lib/features/tableSlice.ts
export const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    // Your new action
    myNewAction: (state, action: PayloadAction<MyPayload>) => {
      // Update state
      state.someProperty = action.payload;
    },
  },
});

export const { myNewAction } = tableSlice.actions;
```

### Step 2: Add to Meaningful Actions List

```typescript
// In lib/store.ts - historyMiddleware
const meaningfulActions = [
  // ... existing actions
  "table/myNewAction", // Add your new action here
];
```

### Step 3: Add Action Summary (Optional)

```typescript
// In lib/utils/time-travel.ts
export const getActionSummary = (action: HistoryAction) => {
  const actionType = action.type.replace("table/", "");

  switch (actionType) {
    // ... existing cases
    case "myNewAction":
      return `Performed my new action: ${action.payload?.description}`;
    default:
      return actionType;
  }
};
```

### Step 4: Add Action Category (Optional)

```typescript
// In lib/utils/time-travel.ts
export const getActionCategory = (actionType: string) => {
  // ... existing categories
  if (actionType.includes("myNewAction")) {
    return "custom"; // or appropriate category
  }
  return "other";
};
```

### Step 5: Add Action Icon (Optional)

```typescript
// In components/compact-history.tsx
const getActionIcon = (actionType: string) => {
  // ... existing icons
  if (actionType.includes("myNewAction")) {
    return <MyIcon className="w-4 h-4" />;
  }
  return <FileText className="w-4 h-4" />;
};
```

### Step 6: Add Action Color (Optional)

```typescript
// In components/compact-history.tsx
const getActionColor = (actionType: string) => {
  // ... existing colors
  if (actionType.includes("myNewAction")) {
    return "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300";
  }
  return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
};
```

## Action Categories

The system categorizes actions for better organization:

- **data** - Data loading, importing, cell updates
- **sorting** - Column sorting changes
- **filtering** - Column and global filters
- **visibility** - Column visibility, row selection, grouping
- **pagination** - Page navigation
- **import** - Data import operations
- **restore** - History restoration actions
- **custom** - User-defined actions

## State Restoration

When restoring a state, the system:

1. **Extracts the state snapshot** from the history action
2. **Dispatches all necessary actions** to recreate the state
3. **Updates the current index** to reflect the new position
4. **Creates a restoration record** for tracking

The restoration process includes all critical table state properties:

- **Data**: Row data and structure
- **Sorting**: Column sort states
- **Filtering**: Column and global filters
- **Visibility**: Column visibility and row selection
- **Layout**: Column order and applied target shapes
- **UI State**: Pagination, grouping, and expansion

```typescript
// Example restoration
const handleReapplyState = (actionIndex: number) => {
  const targetAction = history[actionIndex];
  if (targetAction) {
    restoreStateToAction(dispatch, targetAction);
    dispatch(setCurrentIndex(actionIndex));
  }
};
```

### Template Application Restoration

Template applications (`applyTemplate` action) require special handling to ensure complete restoration:

```typescript
// Critical properties restored for template applications:
// - data: Transformed row data
// - columnOrder: Column display order from target shape
// - appliedTargetShapeId: Which target shape is currently applied
// - sorting: Updated sort state for new columns

// This ensures template applications can be properly reverted in 1 click
```

## Keyboard Shortcuts

The system supports standard keyboard shortcuts:

- **Cmd/Ctrl + Z** - Undo
- **Cmd/Ctrl + Shift + Z** - Redo (macOS style)
- **Cmd/Ctrl + Y** - Redo (Windows style)
- **Escape** - Close history drawer

Shortcuts are disabled when typing in input fields to avoid conflicts.

## Best Practices

### 1. Action Naming

- Use descriptive action names: `updateCell`, `setColumnVisibility`
- Follow the pattern: `table/actionName`
- Use camelCase for action names

### 2. Payload Design

- Keep payloads minimal but complete
- Include all necessary data for restoration
- Use TypeScript interfaces for type safety

### 3. State Snapshots

- The middleware automatically captures complete state
- No need to manually include state in action payloads
- Snapshots include all table properties

### 4. Performance

- Only meaningful user actions are tracked
- Internal/automatic actions are filtered out
- History is limited to user interactions

### 5. User Experience

- Provide clear action descriptions
- Use appropriate icons and colors
- Maintain consistent undo/redo behavior

## Troubleshooting

### Action Not Appearing in History

1. Check if the action is in the `meaningfulActions` list
2. Verify the action type matches exactly
3. Ensure the action is dispatched from the table slice

### State Restoration Issues

1. Check if the state snapshot is complete
2. Verify all required actions are dispatched during restoration
3. Ensure the action payload contains necessary data

### Performance Issues

1. Review if too many actions are being captured
2. Consider filtering out frequent internal actions
3. Check if state snapshots are too large

## Example: Adding a Custom Action

Here's a complete example of adding a custom "highlight row" action:

```typescript
// 1. Add to table slice
export const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    highlightRow: (state, action: PayloadAction<{ rowId: string; highlighted: boolean }>) => {
      const { rowId, highlighted } = action.payload;
      if (!state.highlightedRows) state.highlightedRows = {};
      state.highlightedRows[rowId] = highlighted;
    },
  },
});

// 2. Add to meaningful actions
const meaningfulActions = [
  // ... existing actions
  "table/highlightRow",
];

// 3. Add summary
case "highlightRow":
  return `Highlighted row: ${action.payload?.rowId}`;

// 4. Add category
if (actionType.includes("highlightRow")) {
  return "visibility";
}

// 5. Add icon
if (actionType.includes("highlightRow")) {
  return <Star className="w-4 h-4" />;
}

// 6. Add color
if (actionType.includes("highlightRow")) {
  return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300";
}
```

This documentation ensures that any new actions can be properly integrated into the history system while maintaining consistency and user experience.
