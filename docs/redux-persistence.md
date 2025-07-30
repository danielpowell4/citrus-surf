# Redux Persistence with SuperJSON

This document explains the Redux persistence system in Citrus Surf, which automatically saves the entire Redux store to localStorage using superjson for proper type preservation and debounced writes to prevent excessive storage operations.

## Overview

The Redux persistence system provides:

- **Automatic state persistence** - Entire Redux store is saved to localStorage
- **SuperJSON serialization** - Proper handling of Date objects, BigInt, undefined, etc.
- **Debounced writes** - Prevents excessive localStorage operations
- **Type safety** - Full TypeScript support
- **Error handling** - Graceful fallbacks and error logging
- **SSR compatibility** - Works correctly in server-side rendering with hydration-safe approach

## Architecture

### Components

1. **ReduxPersistenceManager** (`lib/utils/redux-persistence.ts`)
   - Singleton class that manages persistence operations
   - Handles debouncing with configurable delay
   - Provides status tracking and error handling

2. **Persistence Middleware** (`lib/utils/redux-persistence.ts`)
   - Redux middleware that automatically saves state after actions
   - Configurable to ignore specific actions
   - Integrates with the persistence manager

3. **Persistence Slice** (`lib/features/persistenceSlice.ts`)
   - Redux slice for tracking persistence state
   - Stores timestamps, error states, and initialization status
   - Provides actions for managing persistence

4. **usePersistence Hook** (`lib/hooks/usePersistence.ts`)
   - React hook for accessing persistence state and operations
   - Provides utilities for clearing persisted data
   - Returns formatted timestamps and status information

## Configuration

### Store Setup

The persistence is automatically configured in the store:

```typescript
// lib/store.ts
export const makeStore = () => {
  // Load persisted state
  const persistedState = reduxPersistence.loadState();

  // Create persistence middleware with configuration
  const persistenceMiddleware = createPersistenceMiddleware({
    enabled: true,
    debounceDelay: 1000, // 1 second debounce
    meaningfulActions: [
      // Only persist meaningful data changes
      "table/setData",
      "table/importJsonData",
      "table/updateCell",
      "table/setSorting",
      "table/toggleColumnSort",
      "targetShapes/addShape",
      "targetShapes/updateShape",
      "targetShapes/deleteShape",
    ],
    debug: process.env.NODE_ENV === "development",
  });

  const store = configureStore({
    reducer: {
      table: tableReducer,
      history: historyReducer,
      targetShapes: targetShapesReducer,
      persistence: persistenceReducer,
    },
    preloadedState: persistedState, // Load saved state
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(historyMiddleware, persistenceMiddleware),
  });

  return store;
};
```

### Custom Configuration

You can customize the persistence behavior:

```typescript
import { createPersistenceMiddleware } from "@/lib/utils/redux-persistence";

const customPersistenceMiddleware = createPersistenceMiddleware({
  enabled: true,
  debounceDelay: 2000, // 2 second debounce
  meaningfulActions: [
    // Custom list of actions that should trigger persistence
    "table/setData",
    "table/updateCell",
    "custom/importantAction",
  ],
  debug: true, // Enable debug logging
});
```

## Usage

### Automatic Persistence

Once configured, persistence works automatically for meaningful data changes:

```typescript
// These actions will trigger persistence
dispatch(setData(newData));
dispatch(updateCell({ rowId: "1", columnId: "name", value: "New Name" }));
dispatch(setSorting([{ id: "name", desc: true }]));

// These actions will NOT trigger persistence (UI state changes)
dispatch(setPagination({ pageIndex: 1, pageSize: 10 }));
dispatch(setRowSelection({ "1": true }));
dispatch(setGlobalFilter("search term"));

// State is automatically saved with 1-second debouncing
```

### Using the Persistence Hook

```typescript
import { usePersistence } from "@/lib/hooks/usePersistence";

function MyComponent() {
  const {
    isInitialized,
    hasPersistedState,
    wasStateLoaded,
    wasRecentlySaved,
    lastSavedAt,
    lastLoadedAt,
    error,
    clearPersistedState,
    getFormattedTimestamps,
  } = usePersistence();

  const timestamps = getFormattedTimestamps();

  return (
    <div>
      <p>Has saved state: {hasPersistedState ? "Yes" : "No"}</p>
      <p>Last saved: {timestamps.lastSaved}</p>
      <p>Last loaded: {timestamps.lastLoaded}</p>

      {error && <p>Error: {error}</p>}

      <button onClick={clearPersistedState}>
        Clear Persisted State
      </button>
    </div>
  );
}
```

### Persistence Status Component

A pre-built component is available for displaying persistence status:

```typescript
import { PersistenceStatus } from "@/components/persistence-status";

function MyPage() {
  return (
    <div>
      <h1>My App</h1>
      <PersistenceStatus />
      {/* Rest of your app */}
    </div>
  );
}
```

## Data Flow

### State Loading

1. **Store Initialization**

   ```typescript
   const persistedState = reduxPersistence.loadState();
   ```

2. **Preloaded State**

   ```typescript
   const store = configureStore({
     preloadedState: persistedState,
     // ...
   });
   ```

3. **Persistence Status Update**
   ```typescript
   dispatch({ type: "persistence/markLoaded" });
   dispatch({
     type: "persistence/setPersistenceStatus",
     payload: { hasPersistedState: true, lastLoadedAt: Date.now() },
   });
   ```

### State Saving

1. **Action Dispatch**

   ```typescript
   dispatch(setData(newData));
   ```

2. **Middleware Interception**

   ```typescript
   const persistenceMiddleware = store => next => action => {
     const result = next(action);
     reduxPersistence.saveState(store.getState());
     return result;
   };
   ```

3. **Debounced Save**

   ```typescript
   // Multiple rapid actions trigger only one save after 1 second
   reduxPersistence.saveState(state); // Debounced
   ```

4. **SuperJSON Serialization**
   ```typescript
   storage.setItem("citrus-surf-redux-state", state);
   // Uses superjson.stringify() internally
   ```

## Storage Format

The persisted state is stored using SuperJSON format:

```json
{
  "json": {
    "table": {
      "data": [...],
      "sorting": [...],
      "columnFilters": [...],
      // ... all table state
    },
    "history": {
      "actions": [...],
      // ... all history state
    },
    "targetShapes": {
      "shapes": [...],
      // ... all target shapes state
    },
    "persistence": {
      "isInitialized": true,
      "hasPersistedState": true,
      "lastSavedAt": 1703123456789,
      "lastLoadedAt": 1703123456789,
      "error": null
    }
  },
  "meta": {
    "version": "1.0.0"
  }
}
```

## Performance Considerations

### Selective Persistence

- **Meaningful actions only**: Only data changes trigger persistence
- **UI state ignored**: Pagination, selection, filtering don't trigger saves
- **Configurable**: Customize which actions trigger persistence

### Debouncing

- **Default delay**: 1 second
- **Multiple actions**: Only the last state is saved
- **Configurable**: Can be adjusted per application needs

### Storage Size

- **SuperJSON overhead**: Slightly larger than JSON due to type metadata
- **Compression**: Consider enabling gzip compression for large states
- **Cleanup**: Regularly clear old persisted data

### Memory Usage

- **State snapshots**: Only current state is kept in memory
- **History**: History actions are stored separately
- **Cleanup**: Automatic cleanup on component unmount

## Error Handling

### Storage Errors

```typescript
try {
  storage.setItem(key, value);
} catch (error) {
  console.error("Error persisting Redux state:", error);
  // State continues to work, just not persisted
}
```

### Loading Errors

```typescript
try {
  const savedState = storage.getItem(key);
  return savedState ?? undefined;
} catch (error) {
  console.error("Error loading persisted Redux state:", error);
  return undefined; // Fall back to initial state
}
```

### SSR Compatibility

```typescript
if (typeof window === "undefined") {
  return undefined; // Skip persistence in SSR
}
```

## Migration from Manual Persistence

### Before (Manual)

```typescript
// Manual persistence
const saveState = state => {
  localStorage.setItem("my-app-state", JSON.stringify(state));
};

const loadState = () => {
  const saved = localStorage.getItem("my-app-state");
  return saved ? JSON.parse(saved) : undefined;
};

// Manual integration
const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadState(),
});

store.subscribe(() => {
  saveState(store.getState());
});
```

### After (Automatic)

```typescript
// Automatic persistence
const store = configureStore({
  reducer: {
    ...rootReducer,
    persistence: persistenceReducer,
  },
  preloadedState: reduxPersistence.loadState(),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(persistenceMiddleware),
});

// No manual subscription needed!
```

## Testing

### Unit Tests

```typescript
import { reduxPersistence } from "@/lib/utils/redux-persistence";

describe("Redux Persistence", () => {
  it("should save state with debouncing", () => {
    const mockState = { table: { data: [] } };

    reduxPersistence.saveState(mockState);
    expect(localStorage.setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

```typescript
import { renderHook } from "@testing-library/react";
import { usePersistence } from "@/lib/hooks/usePersistence";

describe("usePersistence", () => {
  it("should provide persistence status", () => {
    const { result } = renderHook(() => usePersistence());

    expect(result.current.hasPersistedState).toBeDefined();
    expect(result.current.clearPersistedState).toBeDefined();
  });
});
```

## Troubleshooting

### State Not Persisting

1. **Check middleware configuration**

   ```typescript
   // Ensure persistence middleware is included
   middleware: getDefaultMiddleware =>
     getDefaultMiddleware().concat(persistenceMiddleware),
   ```

2. **Check meaningful actions**

   ```typescript
   // Verify your action is in the meaningful actions list
   meaningfulActions: ["your-action-type"],
   ```

3. **Check browser storage**
   ```typescript
   // Verify localStorage is available
   console.log(localStorage.getItem("citrus-surf-redux-state"));
   ```

### Performance Issues

1. **Reduce debounce delay**

   ```typescript
   debounceDelay: 500, // Faster saves
   ```

2. **Customize meaningful actions**

   ```typescript
   meaningfulActions: ["only-important-actions"],
   ```

3. **Monitor storage size**
   ```typescript
   // Check storage usage
   console.log(localStorage.length);
   ```

### SSR Issues

1. **Check window availability**

   ```typescript
   if (typeof window === "undefined") {
     return undefined;
   }
   ```

2. **Use dynamic imports**
   ```typescript
   const PersistenceStatus = dynamic(() => import("./PersistenceStatus"), {
     ssr: false,
   });
   ```

## SSR and Hydration Strategy

### Hydration-Safe Approach

To prevent hydration mismatches between server and client, the persistence system uses a two-phase loading approach:

#### Phase 1: Consistent Initial State

```typescript
// In makeStore() - lib/store.ts
export const makeStore = () => {
  // Always start with empty state during SSR and initial client render
  const persistedState = undefined;

  const store = configureStore({
    preloadedState: persistedState, // undefined for both server and client
    // ... rest of config
  });
};
```

**Why this works:**

- Server renders with empty state
- Client also starts with empty state
- No hydration mismatch occurs

#### Phase 2: Post-Hydration Loading

```typescript
// In useHydration hook - lib/hooks/useHydration.ts
useEffect(() => {
  // Load persisted state AFTER initial render
  const persistedState = reduxPersistence.loadState();

  if (persistedState) {
    // Restore entire state with a single action
    dispatch(restoreFromStorage(persistedState));
  }

  setIsHydrated(true);
}, [dispatch]);
```

### State Restoration Middleware

The `restoreFromStorage` action is handled by a dedicated middleware that orchestrates the restoration:

```typescript
// In lib/store.ts
const stateRestorationMiddleware =
  (store: any) => (next: any) => (action: any) => {
    if (action.type === RESTORE_FROM_STORAGE) {
      const { payload } = action;

      // Restore table data if it exists
      if (payload?.table?.data?.length > 0) {
        store.dispatch({ type: "table/setData", payload: payload.table.data });
      }

      // Restore table state (sorting, filters, pagination, etc.)
      if (payload?.table) {
        const tableState = payload.table;
        if (tableState.sorting) {
          store.dispatch({
            type: "table/setSorting",
            payload: tableState.sorting,
          });
        }
        // ... other table state restoration
      }

      // Load target shapes if they exist
      if (payload?.targetShapes?.shapes?.length > 0) {
        store.dispatch({ type: "targetShapes/loadShapes" });
      }

      // Update persistence status
      store.dispatch({
        type: "persistence/setPersistenceStatus",
        payload: { hasPersistedState: true, lastLoadedAt: Date.now() },
      });
    }

    return next(action);
  };
```

**Benefits**:

- **Single Action**: One dispatch call restores entire application state
- **Extensible**: Easy to add new slices without modifying useHydration hook
- **Centralized**: All restoration logic in one place
- **Type-Safe**: Proper action dispatching with correct payloads

### Integration with Components

Components that depend on persisted data should use the hydration hook:

```typescript
import { useHydration } from "@/lib/hooks/useHydration";

function DataTableComponent() {
  const { isHydrated } = useHydration();
  const data = useAppSelector(state => state.table.data);

  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return <DataTable data={data} />;
}
```

### Benefits

- **No Hydration Mismatches**: Server and client render identically initially
- **Better UX**: Clear loading states during hydration
- **Maintainable**: Single pattern for all components
- **Future-Proof**: Works with any new persistence features

See [Hydration Handling Documentation](./hydration-handling.md) for detailed implementation guidelines.

## Best Practices

1. **Configure meaningful actions** - Only persist important data changes
2. **Monitor storage size** - Clear old data periodically
3. **Handle errors gracefully** - Don't break the app if persistence fails
4. **Use hydration hooks** - For components depending on persisted data
5. **Test thoroughly** - Verify persistence works in your specific use case
6. **Document customizations** - Keep track of any custom persistence logic
