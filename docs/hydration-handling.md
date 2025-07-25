# SSR/Hydration Handling in Citrus Surf

This document explains how the application handles server-side rendering (SSR) and client hydration to prevent mismatches and provide a smooth user experience.

## Overview

Citrus Surf uses Next.js with SSR, but the playground functionality relies heavily on client-side state (localStorage, Redux persistence). This creates potential hydration mismatches where the server renders different content than what the client shows after hydration.

## The Problem

**Hydration Mismatch**: When server-rendered content differs from client-rendered content, React throws errors like:
```
Hydration failed because the server rendered text didn't match the client
```

Common causes in our app:
- Server renders empty data tables, client shows persisted data
- Row counts differ between server (0) and client (actual count)
- Dynamic content that's only available on the client

## Our Solution

### 1. Layout-Level Suspense Boundary

**File**: `app/playground/layout.tsx`

```tsx
<Suspense fallback={<PlaygroundLoader />}>
  {children}
</Suspense>
```

- **Purpose**: Handles any `useSearchParams()` usage across playground pages
- **Benefits**: Single point of loading state management
- **Fallback**: Clean loading spinner with "Loading playground..." message

### 2. Consistent Initial State

**File**: `lib/store.ts`

```typescript
// Always start with empty state during SSR and initial client render
const persistedState = undefined;
```

- **Server**: Always starts with empty Redux state
- **Client**: Also starts with empty state initially
- **Hydration**: useHydration hook restores data after initial render

### 3. Post-Hydration State Loading

**File**: `lib/hooks/useHydration.ts`

```typescript
useEffect(() => {
  const persistedState = reduxPersistence.loadState();
  
  if (persistedState) {
    // Restore table data if it exists
    if (persistedState.table?.data?.length > 0) {
      dispatch(setData(persistedState.table.data));
    }
    
    // Load target shapes if they exist
    if (persistedState.targetShapes?.shapes?.length > 0) {
      dispatch(loadShapes());
    }
  }
  
  setIsHydrated(true);
}, [dispatch]);
```

### 4. Loading and Empty States

**File**: `app/playground/data-table.tsx`

```tsx
{!isHydrated ? (
  <div className="flex flex-col items-center gap-3">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    <p className="text-muted-foreground">Loading data...</p>
  </div>
) : (
  <div className="flex flex-col items-center gap-4">
    <Upload className="h-8 w-8 text-muted-foreground/50" />
    <div className="text-center">
      <p className="text-muted-foreground mb-2">No data found</p>
      <Link href="/playground">
        <Button variant="outline">Go to Data Import</Button>
      </Link>
    </div>
  </div>
)}
```

## User Flow Design

The hydration strategy supports the intended user workflow:

1. **Import** → User imports data via CSV, JSON, or manual entry
2. **Data Table** → Shows loading, then data, or helpful empty state
3. **Templates** → Apply target shapes to transform data

### Key UX Principles

- **No Default Data**: Clean slate approach, no sample data cluttering the experience
- **Loading States**: Clear feedback during hydration
- **Helpful Empty States**: Guide users back to import when no data exists
- **Consistent Experience**: Same behavior regardless of refresh/navigation

## Implementation Guidelines

### When Adding New Playground Features

1. **Check for Client-Only Data**: Does your component rely on localStorage, Redux state, or other client-only data?

2. **Use Hydration Hook**: If yes, import and use the hydration hook:
   ```tsx
   import { useHydration } from "@/lib/hooks/useHydration";
   
   function MyComponent() {
     const { isHydrated } = useHydration();
     
     if (!isHydrated) {
       return <LoadingSpinner />;
     }
     
     // Render with client data
   }
   ```

3. **Avoid Dynamic Content in SSR**: Don't render counts, dates, or other dynamic content that differs between server and client.

4. **Provide Loading States**: Always show meaningful loading states while hydrating.

### Common Patterns

#### Dynamic Counts
```tsx
// ❌ Bad - causes hydration mismatch
<h1>Data Table ({data.length} rows)</h1>

// ✅ Good - wait for hydration
<h1>Data Table {isHydrated ? `(${data.length} rows)` : ''}</h1>
```

#### Conditional Rendering
```tsx
// ❌ Bad - different server/client content
{data.length > 0 && <DataDisplay />}

// ✅ Good - consistent initial state
{isHydrated && data.length > 0 && <DataDisplay />}
```

## Debugging Hydration Issues

### Enable Hydration Warnings

In development, React will warn about hydration mismatches. Look for:
- Different text content between server and client
- Different component structure
- Conditional rendering based on client-only state

### Common Fixes

1. **Use the hydration hook** for client-dependent content
2. **Move dynamic content** inside `useEffect` or after hydration
3. **Ensure consistent initial states** between server and client
4. **Add loading states** for async operations

### Testing

Test your components by:
1. Refreshing the page multiple times
2. Checking browser console for hydration warnings
3. Testing with JavaScript disabled (should show loading state)
4. Verifying empty states work correctly

## Benefits of This Approach

- **No Hydration Mismatches**: Server and client render consistently
- **Better UX**: Clear loading states and helpful empty states
- **Maintainable**: Single pattern for handling client-only data
- **Future-Proof**: Works with any new playground features
- **Performance**: Minimal impact on initial page load

This hydration strategy ensures a smooth, consistent user experience while maintaining the flexibility of client-side state management for the playground functionality.