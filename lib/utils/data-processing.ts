import { generateRowId } from "./id-generator";

/**
 * Process imported data by injecting unique row IDs
 *
 * @param data - Raw imported data (array of objects or arrays)
 * @param preserveExistingId - Whether to preserve existing 'id' field if present
 * @returns Processed data with unique row IDs
 */
export function injectRowIds(
  data: any[],
  preserveExistingId: boolean = false
): any[] {
  return data.map((row, index) => {
    const processedRow = { ...row };

    // Generate unique row ID with vendor prefix (cs_...)
    const rowId = generateRowId();

    // Always inject the vendor-prefixed row ID into a hidden field
    processedRow._rowId = rowId;

    // Always preserve the existing ID field (user input)
    // The vendor-prefixed row ID is stored separately in _rowId

    return processedRow;
  });
}

/**
 * Process imported data with additional metadata
 *
 * @param data - Raw imported data
 * @param options - Processing options
 * @returns Processed data with IDs and metadata
 */
export function processImportedData(
  data: any[],
  options: {
    injectRowIds?: boolean;
    preserveExistingId?: boolean;
    addMetadata?: boolean;
    source?: string;
  } = {}
): any[] {
  const {
    injectRowIds: shouldInjectIds = true,
    preserveExistingId = false,
    addMetadata = false,
    source = "import",
  } = options;

  let processedData = [...data];

  // Inject row IDs if requested
  if (shouldInjectIds) {
    processedData = injectRowIds(processedData, preserveExistingId);
  }

  // Add metadata if requested
  if (addMetadata) {
    processedData = processedData.map((row, index) => ({
      ...row,
      _metadata: {
        importedAt: new Date().toISOString(),
        source,
        originalIndex: index,
        rowNumber: index + 1,
      },
    }));
  }

  return processedData;
}

/**
 * Validate that all rows have unique IDs
 *
 * @param data - Data to validate
 * @param idField - Field name to check for IDs (default: 'id')
 * @returns Validation result
 */
export function validateRowIds(
  data: any[],
  idField: string = "id"
): { isValid: boolean; duplicates: string[]; missing: number[] } {
  const ids = new Set<string>();
  const duplicates: string[] = [];
  const missing: number[] = [];

  data.forEach((row, index) => {
    const id = row[idField];

    if (!id) {
      missing.push(index);
    } else if (ids.has(id)) {
      duplicates.push(id);
    } else {
      ids.add(id);
    }
  });

  return {
    isValid: duplicates.length === 0 && missing.length === 0,
    duplicates,
    missing,
  };
}
