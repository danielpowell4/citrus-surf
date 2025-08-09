/**
 * Smart Column Naming Utilities
 *
 * Generates intuitive, context-aware names for derived lookup columns
 * that make demos and user experience more grok'able.
 */

import type { LookupField, DerivedField } from "@/lib/types/target-shapes";

/**
 * Generates a context-aware name for a derived field
 */
export function generateSmartColumnName(
  lookupFieldName: string,
  derivedField: DerivedField,
  sourceColumnName: string
): string {
  // If name is explicitly provided, use it
  if (derivedField.name && derivedField.name.trim()) {
    return derivedField.name;
  }

  // Clean the source column name (remove common suffixes/prefixes)
  const cleanSourceName = cleanColumnName(sourceColumnName);
  const cleanLookupName = cleanColumnName(lookupFieldName);

  // If the source name already contains the lookup context, use as-is
  if (cleanSourceName.toLowerCase().includes(cleanLookupName.toLowerCase())) {
    return cleanSourceName;
  }

  // Generate contextual name: lookup_field + derived_meaning
  return `${cleanLookupName}_${cleanSourceName}`;
}

/**
 * Generates a human-readable description for a derived field
 */
export function generateSmartDescription(
  lookupFieldName: string,
  derivedField: DerivedField,
  referenceFileName?: string
): string {
  const cleanLookupName = cleanColumnName(lookupFieldName);
  const cleanSourceName = cleanColumnName(derivedField.source);

  // Generate contextual descriptions
  const contextualDescriptions: Record<string, string> = {
    manager: `Manager responsible for this ${cleanLookupName}`,
    budget: `Budget allocated to this ${cleanLookupName}`,
    location: `Physical location of this ${cleanLookupName}`,
    address: `Address associated with this ${cleanLookupName}`,
    phone: `Phone number for this ${cleanLookupName}`,
    email: `Email contact for this ${cleanLookupName}`,
    code: `Unique code identifier for this ${cleanLookupName}`,
    id: `System ID for this ${cleanLookupName}`,
    price: `Current price for this ${cleanLookupName}`,
    cost: `Cost associated with this ${cleanLookupName}`,
    category: `Category classification for this ${cleanLookupName}`,
    type: `Type classification for this ${cleanLookupName}`,
    status: `Current status of this ${cleanLookupName}`,
    date: `Date associated with this ${cleanLookupName}`,
    count: `Count or quantity for this ${cleanLookupName}`,
    total: `Total amount for this ${cleanLookupName}`,
  };

  // Try to find a contextual description
  const description = contextualDescriptions[cleanSourceName.toLowerCase()];
  if (description) {
    return description;
  }

  // Fall back to generic description
  const sourceName = referenceFileName
    ? `${referenceFileName} reference data`
    : `${cleanLookupName} lookup`;

  return `${cleanSourceName} from ${sourceName}`;
}

/**
 * Clean column names by removing common prefixes/suffixes and converting to display format
 */
function cleanColumnName(columnName: string): string {
  return (
    columnName
      // Remove common prefixes
      .replace(/^(ref_|lookup_|tbl_|col_)/i, "")
      // Remove common suffixes
      .replace(/(_id|_code|_name|_ref)$/i, "")
      // Convert snake_case to readable format
      .replace(/_/g, " ")
      // Capitalize first letter of each word
      .replace(/\b\w/g, l => l.toUpperCase())
      // Convert back to snake_case for field names
      .replace(/\s+/g, "_")
      .toLowerCase()
  );
}

/**
 * Generate preview data showing what columns will be created
 */
export interface LookupPreview {
  lookupColumn: {
    name: string;
    description: string;
    example: string;
  };
  derivedColumns: Array<{
    name: string;
    description: string;
    example: string;
    type: string;
  }>;
}

/**
 * Creates a preview of what the lookup will generate
 */
export function generateLookupPreview(
  lookupField: LookupField,
  sampleReferenceData: Record<string, any>[]
): LookupPreview {
  const sampleRow = sampleReferenceData[0] || {};

  // Generate lookup column preview
  const lookupColumn = {
    name: lookupField.name,
    description: `Lookup result from ${lookupField.referenceFile}`,
    example: sampleRow[lookupField.match.get] || "ENG001",
  };

  // Generate derived columns preview
  const derivedColumns = (lookupField.alsoGet || []).map(derivedField => {
    const smartName = generateSmartColumnName(
      lookupField.name,
      derivedField,
      derivedField.source
    );

    const smartDescription = generateSmartDescription(
      lookupField.name,
      derivedField,
      lookupField.referenceFile
    );

    const exampleValue = sampleRow[derivedField.source];
    let formattedExample = "Sample Value";

    if (exampleValue !== undefined) {
      // Format example based on type
      if (typeof exampleValue === "number") {
        if (
          derivedField.source.toLowerCase().includes("budget") ||
          derivedField.source.toLowerCase().includes("price") ||
          derivedField.source.toLowerCase().includes("cost")
        ) {
          formattedExample = `$${exampleValue.toLocaleString()}`;
        } else {
          formattedExample = exampleValue.toString();
        }
      } else {
        formattedExample = String(exampleValue);
      }
    }

    return {
      name: smartName,
      description: smartDescription,
      example: formattedExample,
      type: derivedField.type || inferTypeFromValue(exampleValue),
    };
  });

  return {
    lookupColumn,
    derivedColumns,
  };
}

/**
 * Infer field type from sample value
 */
function inferTypeFromValue(value: any): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  if (value instanceof Date) {
    return "date";
  }
  if (typeof value === "string") {
    // Check for common patterns first
    if (value.includes("@")) return "email";
    if (value.match(/^\$?[\d,]+\.?\d*$/)) return "currency";
    if (value.match(/^\d{3}-?\d{3}-?\d{4}$/)) return "phone";

    // Only check for dates if it looks like a date format
    if (
      value.match(/^\d{4}-\d{2}-\d{2}/) || // ISO date
      value.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) || // US date
      value.match(/^\d{1,2}-\d{1,2}-\d{4}/) || // Dash date
      value.match(/^\w{3}\s+\d{1,2},?\s+\d{4}/)
    ) {
      // Month name date
      const parsed = Date.parse(value);
      if (!isNaN(parsed)) {
        return "date";
      }
    }
  }
  return "string";
}

/**
 * Update derived field names to use smart naming
 */
export function applySmartNaming(
  lookupField: LookupField,
  referenceData: Record<string, any>[]
): LookupField {
  if (!lookupField.alsoGet || lookupField.alsoGet.length === 0) {
    return lookupField;
  }

  const updatedAlsoGet = lookupField.alsoGet.map(derivedField => {
    // Only update if name wasn't explicitly set
    if (!derivedField.name || derivedField.name === derivedField.source) {
      const smartName = generateSmartColumnName(
        lookupField.name,
        derivedField,
        derivedField.source
      );

      return {
        ...derivedField,
        name: smartName,
      };
    }

    return derivedField;
  });

  return {
    ...lookupField,
    alsoGet: updatedAlsoGet,
  };
}
