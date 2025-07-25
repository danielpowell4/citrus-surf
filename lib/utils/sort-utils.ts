/**
 * Natural Sort Utility Functions
 *
 * This module provides sorting utilities that handle natural ordering of alphanumeric strings.
 * The natural sort function breaks strings into tokens and compares them intelligently,
 * ensuring that numeric parts are compared numerically rather than lexicographically.
 */

/**
 * Natural sort function for proper alphanumeric sorting.
 *
 * This function implements natural sorting that handles mixed alphanumeric content
 * by breaking strings into tokens and comparing them intelligently:
 * - Numeric tokens are compared as numbers
 * - Alphabetic tokens are compared as lowercase strings
 * - Handles null/undefined values (null comes first, undefined comes last)
 *
 * Examples:
 * - "file1.txt" vs "file10.txt" → "file1.txt" comes first
 * - "EMP1" vs "EMP10" → "EMP1" comes first
 * - "v1.1.0" vs "v1.10.0" → "v1.1.0" comes first
 * - "Alice" vs "Bob" → "Alice" comes first
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns
 *   - Negative number if a < b
 *   - Positive number if a > b
 *   - 0 if a === b
 *
 * @example
 * ```typescript
 * const items = ["file1.txt", "file10.txt", "file2.txt"];
 * items.sort(naturalSort);
 * // Result: ["file1.txt", "file2.txt", "file10.txt"]
 *
 * const employees = ["EMP1", "EMP10", "EMP2"];
 * employees.sort(naturalSort);
 * // Result: ["EMP1", "EMP2", "EMP10"]
 * ```
 */
export function naturalSort(a: any, b: any): number {
  // Handle null/undefined values
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  const tokenize = (str: string) =>
    str
      .match(/(\d+|\D+)/g)
      ?.map(part =>
        isNaN(Number(part)) ? part.toLowerCase() : Number(part)
      ) || [];

  const aTokens = tokenize(String(a));
  const bTokens = tokenize(String(b));

  const len = Math.max(aTokens.length, bTokens.length);
  for (let i = 0; i < len; i++) {
    const aPart = aTokens[i];
    const bPart = bTokens[i];

    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;

    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }

  return 0;
}

/**
 * TanStack Table v8 compatible sorting function wrapper.
 *
 * This function wraps the naturalSort function to work with TanStack Table v8's
 * sorting function signature, which passes row objects instead of direct values.
 *
 * @param rowA - First row object from TanStack Table
 * @param rowB - Second row object from TanStack Table
 * @param columnId - The column ID to extract values from
 * @returns The result of naturalSort comparison
 *
 * @example
 * ```typescript
 * const table = useReactTable({
 *   // ... other config
 *   sortingFns: {
 *     custom: naturalSortForTable,
 *   },
 * });
 * ```
 */
export function naturalSortForTable(
  rowA: any,
  rowB: any,
  columnId: string
): number {
  const a = rowA.getValue(columnId);
  const b = rowB.getValue(columnId);
  return naturalSort(a, b);
}

/**
 * Type definitions for sort utilities
 */
export interface SortUtils {
  naturalSort: typeof naturalSort;
  naturalSortForTable: typeof naturalSortForTable;
}
