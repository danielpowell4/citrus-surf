# SuperJSON localStorage Integration

This document explains how to use the superjson-enhanced localStorage utilities in Citrus Surf to properly handle complex types like Date objects.

## Overview

The standard `JSON.stringify()` and `JSON.parse()` methods don't handle complex types like `Date`, `BigInt`, `undefined`, etc. properly. When you store a Date object with `JSON.stringify()`, it becomes a string, and when you retrieve it, you get a string instead of a Date object.

SuperJSON solves this by providing a serialization format that preserves type information, allowing you to store and retrieve complex types correctly.

## Available Utilities

### 1. Storage Utility (`lib/utils/localStorage.ts`)

The main storage utility provides a drop-in replacement for localStorage with superjson serialization:

```typescript
import { storage } from "@/lib/utils/localStorage";

// Store data with Date objects
const data = {
  id: "user-1",
  createdAt: new Date("2023-01-15T10:30:00Z"),
  updatedAt: new Date("2023-01-16T15:45:00Z"),
  metadata: {
    lastLogin: new Date("2023-01-17T09:00:00Z"),
  },
};

storage.setItem("user-data", data);

// Retrieve data - Date objects are preserved!
const retrieved = storage.getItem("user-data");
console.log(retrieved.createdAt instanceof Date); // true
console.log(retrieved.metadata.lastLogin instanceof Date); // true
```

### 2. React Hook (`lib/hooks/useSuperjsonStorage.ts`)

A React hook that provides the same API as `useLocalStorage` from `usehooks-ts` but with superjson support:

```typescript
import { useSuperjsonStorage, useDateStorage } from "@/lib/hooks/useSuperjsonStorage";

function MyComponent() {
  // General purpose hook
  const [userData, setUserData] = useSuperjsonStorage("user-data", {
    id: "default",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Specific hook for Date objects
  const [lastVisit, setLastVisit] = useDateStorage("last-visit", new Date());

  // Update with function (same API as useState)
  const updateUser = () => {
    setUserData(prev => ({
      ...prev,
      updatedAt: new Date(),
    }));
  };

  return (
    <div>
      <p>Created: {userData.createdAt.toLocaleDateString()}</p>
      <p>Last Visit: {lastVisit.toLocaleDateString()}</p>
      <button onClick={updateUser}>Update User</button>
    </div>
  );
}
```

## Migration Guide

### From Direct localStorage Usage

**Before:**

```typescript
// ❌ Date objects become strings
const data = { createdAt: new Date() };
localStorage.setItem("data", JSON.stringify(data));
const retrieved = JSON.parse(localStorage.getItem("data") || "{}");
console.log(retrieved.createdAt instanceof Date); // false - it's a string!
```

**After:**

```typescript
// ✅ Date objects are preserved
import { storage } from "@/lib/utils/localStorage";

const data = { createdAt: new Date() };
storage.setItem("data", data);
const retrieved = storage.getItem("data");
console.log(retrieved?.createdAt instanceof Date); // true!
```

### From useLocalStorage Hook

**Before:**

```typescript
// ❌ Date objects become strings
import { useLocalStorage } from "usehooks-ts";

const [data, setData] = useLocalStorage("data", {
  createdAt: new Date(),
});
// data.createdAt is now a string, not a Date object
```

**After:**

```typescript
// ✅ Date objects are preserved
import { useSuperjsonStorage } from "@/lib/hooks/useSuperjsonStorage";

const [data, setData] = useSuperjsonStorage("data", {
  createdAt: new Date(),
});
// data.createdAt is still a Date object
```

## Supported Types

SuperJSON supports many complex types that JSON doesn't handle well:

- **Date objects** - Preserved as Date instances
- **BigInt** - Preserved as BigInt instances
- **undefined** - Preserved (JSON.stringify ignores undefined)
- **NaN** - Preserved (JSON.stringify converts to null)
- **Infinity** - Preserved (JSON.stringify converts to null)
- **RegExp** - Preserved as RegExp instances
- **Map/Set** - Preserved as Map/Set instances
- **Custom classes** - Can be registered for custom serialization

## Examples

### Target Shapes Storage

The target shapes storage has been updated to use superjson:

```typescript
// Before: Date objects were stored as strings
const shape = {
  id: "shape-1",
  createdAt: new Date(), // Would become a string
  updatedAt: new Date(), // Would become a string
};

// After: Date objects are preserved
import { targetShapesStorage } from "@/lib/utils/target-shapes-storage";

const savedShape = targetShapesStorage.save({
  name: "My Shape",
  description: "A test shape",
  // createdAt and updatedAt are automatically added as Date objects
});

console.log(savedShape.createdAt instanceof Date); // true
console.log(savedShape.updatedAt instanceof Date); // true
```

### Complex Data Structures

```typescript
import { useSuperjsonStorage } from "@/lib/hooks/useSuperjsonStorage";

const [complexData, setComplexData] = useSuperjsonStorage("complex-data", {
  id: "data-1",
  timestamps: {
    created: new Date(),
    modified: new Date(),
    accessed: new Date(),
  },
  metadata: {
    tags: new Set(["tag1", "tag2"]),
    settings: new Map([
      ["theme", "dark"],
      ["language", "en"],
    ]),
    optionalField: undefined,
  },
  numbers: {
    big: BigInt("12345678901234567890"),
    small: 42,
  },
});

// All complex types are preserved!
console.log(complexData.timestamps.created instanceof Date); // true
console.log(complexData.metadata.tags instanceof Set); // true
console.log(complexData.metadata.settings instanceof Map); // true
console.log(typeof complexData.numbers.big === "bigint"); // true
console.log(complexData.metadata.optionalField === undefined); // true
```

## Best Practices

1. **Use the storage utility** for direct localStorage operations
2. **Use the React hooks** for component state that needs to persist
3. **Migrate existing code** gradually - the utilities are backward compatible
4. **Test thoroughly** - especially when migrating from JSON.stringify/parse
5. **Consider storage size** - superjson serialization may be slightly larger than JSON

## Testing

The utilities include comprehensive tests to ensure they work correctly:

```bash
# Test the storage utility
npm test lib/utils/localStorage.test.ts

# Test the React hooks
npm test lib/hooks/useSuperjsonStorage.test.tsx
```

## Migration Checklist

When migrating existing code to use superjson localStorage:

- [ ] Replace `localStorage.setItem(key, JSON.stringify(value))` with `storage.setItem(key, value)`
- [ ] Replace `JSON.parse(localStorage.getItem(key))` with `storage.getItem(key)`
- [ ] Replace `useLocalStorage` with `useSuperjsonStorage` for complex types
- [ ] Update any code that expects string dates to handle Date objects
- [ ] Test that Date methods like `.toLocaleDateString()` work correctly
- [ ] Verify that existing stored data is handled gracefully (may need migration logic)

## Troubleshooting

### Existing Data Migration

If you have existing data stored with JSON.stringify, you may need to migrate it:

```typescript
// Check if data needs migration
const stored = localStorage.getItem("my-key");
if (stored && !stored.includes('"__superjson_type__"')) {
  // This is old JSON data, migrate it
  const oldData = JSON.parse(stored);
  // Convert string dates to Date objects if needed
  if (typeof oldData.createdAt === "string") {
    oldData.createdAt = new Date(oldData.createdAt);
  }
  // Store with superjson
  storage.setItem("my-key", oldData);
}
```

### Performance Considerations

SuperJSON serialization is slightly slower than JSON.stringify, but the benefits usually outweigh the performance cost. For high-frequency operations, consider:

- Debouncing storage updates
- Using the React hooks which optimize re-renders
- Storing only essential data in localStorage
