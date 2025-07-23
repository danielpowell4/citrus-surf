# Sort Utilities

This document describes the natural sorting utilities used in the Citrus Surf application for handling alphanumeric data in tables and other components.

## Overview

The sort utilities provide intelligent sorting for mixed alphanumeric content, ensuring that numeric parts are compared numerically rather than lexicographically. This is particularly useful for:

- Employee IDs (EMP1, EMP2, EMP10)
- File names (file1.txt, file2.txt, file10.txt)
- Version numbers (v1.1.0, v1.2.0, v1.10.0)
- Any mixed alphanumeric strings

## Functions

### `naturalSort(a, b)`

The core natural sorting function that handles mixed alphanumeric content.

**Parameters:**

- `a` - First value to compare
- `b` - Second value to compare

**Returns:**

- Negative number if `a < b`
- Positive number if `a > b`
- 0 if `a === b`

**Examples:**

```typescript
import { naturalSort } from "@/lib/utils/sort-utils";

// Employee IDs
const employees = ["EMP10", "EMP1", "EMP2"];
employees.sort(naturalSort);
// Result: ['EMP1', 'EMP2', 'EMP10']

// File names
const files = ["file10.txt", "file1.txt", "file2.txt"];
files.sort(naturalSort);
// Result: ['file1.txt', 'file2.txt', 'file10.txt']

// Version numbers
const versions = ["v1.10.0", "v1.1.0", "v1.2.0"];
versions.sort(naturalSort);
// Result: ['v1.1.0', 'v1.2.0', 'v1.10.0']
```

### `naturalSortForTable(rowA, rowB, columnId)`

A wrapper function specifically designed for TanStack Table v8 that extracts values from row objects before applying natural sorting.

**Parameters:**

- `rowA` - First row object from TanStack Table
- `rowB` - Second row object from TanStack Table
- `columnId` - The column ID to extract values from

**Returns:**

- The result of naturalSort comparison

**Usage with TanStack Table:**

```typescript
import { naturalSortForTable } from "@/lib/utils/sort-utils";

const table = useReactTable({
  data,
  columns,
  sortingFns: {
    custom: naturalSortForTable,
  },
  // ... other config
});
```

## How It Works

The natural sort function uses a tokenization approach:

1. **Tokenization**: Breaks strings into alternating numeric and non-numeric parts using regex `/(\d+|\D+)/g`
2. **Type Conversion**: Converts numeric tokens to numbers, alphabetic tokens to lowercase strings
3. **Comparison**: Compares tokens pairwise, with numbers comparing numerically and strings alphabetically
4. **Edge Handling**: Properly handles null/undefined values and strings of different lengths

**Example Tokenization:**

```
"EMP10" → ["EMP", 10]
"EMP2"  → ["EMP", 2]
"file1.txt" → ["file", 1, ".txt"]
"file10.txt" → ["file", 10, ".txt"]
```

## Edge Cases

The function handles various edge cases gracefully:

- **Null values**: Come first in sorting order
- **Undefined values**: Come last in sorting order
- **Empty strings**: Treated as regular strings
- **Case sensitivity**: Alphabetic tokens are converted to lowercase for comparison
- **Mixed data types**: Numbers and strings are handled appropriately
- **Different lengths**: Shorter strings come before longer ones when prefixes match

## Testing

The sort utilities include comprehensive tests covering:

- Basic functionality (alphabetical and numerical sorting)
- Employee IDs and different prefix patterns
- Version numbers and semantic versioning
- File names with various extensions
- Edge cases (null, undefined, empty strings, case sensitivity)
- Complex scenarios (multiple numeric parts, dates)
- TanStack Table integration

Run tests with:

```bash
npm test lib/utils/sort-utils.test.ts
```

## Integration with Data Tables

To use natural sorting in data tables:

1. **Import the utility:**

   ```typescript
   import { naturalSortForTable } from "@/lib/utils/sort-utils";
   ```

2. **Register the sorting function:**

   ```typescript
   const table = useReactTable({
     // ... other config
     sortingFns: {
       custom: naturalSortForTable,
     },
   });
   ```

3. **Apply to columns:**
   ```typescript
   const columns = [
     {
       accessorKey: "id",
       header: "ID",
       meta: {
         sortType: "natural", // This enables natural sorting
       },
     },
   ];
   ```

## Performance Considerations

- The tokenization approach is efficient for most use cases
- Regex matching and array operations are fast for typical string lengths
- For very large datasets, consider caching tokenized results if needed
- The function is pure and can be safely memoized

## Future Enhancements

Potential improvements could include:

- Locale-aware sorting for international applications
- Custom tokenization patterns for specific domains
- Performance optimizations for large datasets
- Additional sorting functions for dates, currencies, etc.
