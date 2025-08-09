import { generateFieldId } from "./id-generator";
import type { TargetField, FieldType } from "@/lib/types/target-shapes";

/**
 * Analyze imported data to suggest field definitions for a target shape
 */
export function analyzeDataForTargetShape(data: any[]): {
  suggestedFields: TargetField[];
  dataSummary: {
    rowCount: number;
    uniqueValues: Record<string, number>;
    sampleValues: Record<string, any[]>;
    dataTypes: Record<string, string>;
  };
} {
  if (!data || data.length === 0) {
    return {
      suggestedFields: [],
      dataSummary: {
        rowCount: 0,
        uniqueValues: {},
        sampleValues: {},
        dataTypes: {},
      },
    };
  }

  const rowCount = data.length;
  const allKeys = new Set<string>();
  const uniqueValues: Record<string, Set<any>> = {};
  const sampleValues: Record<string, any[]> = {};
  const dataTypes: Record<string, string> = {};

  // Collect all keys and sample values (excluding vendor-prefixed fields)
  data.forEach(row => {
    Object.keys(row)
      .filter(key => !key.startsWith("_")) // Exclude vendor-prefixed fields like _rowId
      .forEach(key => {
        allKeys.add(key);

        if (!uniqueValues[key]) {
          uniqueValues[key] = new Set();
          sampleValues[key] = [];
        }

        const value = row[key];
        uniqueValues[key].add(value);

        // Collect sample values (up to 5 unique ones)
        if (
          sampleValues[key].length < 5 &&
          !sampleValues[key].includes(value)
        ) {
          sampleValues[key].push(value);
        }
      });
  });

  // Analyze data types and generate field suggestions
  const suggestedFields: TargetField[] = Array.from(allKeys).map(key => {
    const values = Array.from(uniqueValues[key]);
    const sampleData = sampleValues[key];

    // Determine field type based on content analysis
    const fieldType = determineFieldType(key, values, sampleData);

    // Determine if field should be required
    const required = determineIfRequired(data, key);

    // Generate field name (clean up the key)
    const fieldName = generateFieldName(key);

    // Generate description based on content
    const description = generateFieldDescription(key, fieldType, sampleData);

    return {
      id: generateFieldId(),
      name: fieldName,
      type: fieldType,
      required,
      description,
      validation: [],
      transformation: [],
    };
  });

  // Convert Sets to counts for summary
  const uniqueValueCounts: Record<string, number> = {};
  Object.keys(uniqueValues).forEach(key => {
    uniqueValueCounts[key] = uniqueValues[key].size;
  });

  // Convert sample arrays to proper format
  const sampleValueArrays: Record<string, any[]> = {};
  Object.keys(sampleValues).forEach(key => {
    sampleValueArrays[key] = sampleValues[key];
  });

  return {
    suggestedFields,
    dataSummary: {
      rowCount,
      uniqueValues: uniqueValueCounts,
      sampleValues: sampleValueArrays,
      dataTypes,
    },
  };
}

/**
 * Determine the appropriate field type based on content analysis
 */
function determineFieldType(
  key: string,
  values: any[],
  _sampleData: any[]
): FieldType {
  // Skip empty or null values for analysis
  const nonEmptyValues = values.filter(
    v => v !== null && v !== undefined && v !== ""
  );

  if (nonEmptyValues.length === 0) {
    return "string";
  }

  // Check for email patterns
  const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;
  const hasEmails = nonEmptyValues.some(
    v => typeof v === "string" && emailPattern.test(v)
  );
  if (hasEmails && key.toLowerCase().includes("email")) {
    return "email";
  }

  // Check for phone patterns
  const phonePattern = /^[\+]?[0-9\s\-\(\)]+$/;
  const hasPhones = nonEmptyValues.some(
    v => typeof v === "string" && phonePattern.test(v)
  );
  if (
    hasPhones &&
    (key.toLowerCase().includes("phone") || key.toLowerCase().includes("tel"))
  ) {
    return "phone";
  }

  // Check for URL patterns
  const urlPattern = /^https?:\/\/.+/;
  const hasUrls = nonEmptyValues.some(
    v => typeof v === "string" && urlPattern.test(v)
  );
  if (
    hasUrls &&
    (key.toLowerCase().includes("url") || key.toLowerCase().includes("link"))
  ) {
    return "url";
  }

  // Check for date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or M/D/YYYY
  ];
  const hasDates = nonEmptyValues.some(
    v => typeof v === "string" && datePatterns.some(pattern => pattern.test(v))
  );
  if (
    hasDates &&
    (key.toLowerCase().includes("date") ||
      key.toLowerCase().includes("created") ||
      key.toLowerCase().includes("updated"))
  ) {
    return "date";
  }

  // Check for boolean values - more restrictive
  const booleanValues = ["true", "false", "yes", "no", "1", "0"];
  const hasBooleans = nonEmptyValues.every(
    v => typeof v === "string" && booleanValues.includes(v.toLowerCase())
  );
  if (hasBooleans && nonEmptyValues.length <= 4) {
    return "boolean";
  }

  // Check for numeric values
  const hasNumbers = nonEmptyValues.every(v => {
    if (typeof v === "number") return true;
    if (typeof v === "string") {
      const num = parseFloat(v);
      return !isNaN(num) && num.toString() === v;
    }
    return false;
  });

  if (hasNumbers) {
    // Check if they're all integers
    const hasIntegers = nonEmptyValues.every(v => {
      const num = typeof v === "number" ? v : parseFloat(v);
      return Number.isInteger(num);
    });

    if (hasIntegers) {
      return "integer";
    } else {
      return "number";
    }
  }

  // Check for currency
  const currencyPattern = /^\$?[\d,]+\.?\d*$/;
  const hasCurrency = nonEmptyValues.some(
    v => typeof v === "string" && currencyPattern.test(v)
  );
  if (
    hasCurrency &&
    (key.toLowerCase().includes("price") ||
      key.toLowerCase().includes("cost") ||
      key.toLowerCase().includes("salary") ||
      key.toLowerCase().includes("amount"))
  ) {
    return "currency";
  }

  // Check for percentage
  const percentagePattern = /^\d+\.?\d*%?$/;
  const hasPercentage = nonEmptyValues.some(
    v => typeof v === "string" && percentagePattern.test(v)
  );
  if (hasPercentage && key.toLowerCase().includes("percent")) {
    return "percentage";
  }

  // Check for enum (limited unique values) - but be smarter about it
  if (nonEmptyValues.length <= 10 && nonEmptyValues.length > 1) {
    // Don't classify name fields as enum even with limited values
    const keyLower = key.toLowerCase();
    const isNameField =
      keyLower.includes("name") ||
      keyLower.includes("first") ||
      keyLower.includes("last") ||
      keyLower.includes("full");

    // Don't classify email fields as enum
    const isEmailField =
      keyLower.includes("email") || keyLower.includes("mail");

    // Don't classify phone fields as enum
    const isPhoneField = keyLower.includes("phone") || keyLower.includes("tel");

    // Don't classify address fields as enum
    const isAddressField =
      keyLower.includes("address") ||
      keyLower.includes("street") ||
      keyLower.includes("city") ||
      keyLower.includes("state") ||
      keyLower.includes("country");

    // Only classify as enum if it's not a common text field type
    if (!isNameField && !isEmailField && !isPhoneField && !isAddressField) {
      return "enum";
    }
  }

  // Default to string
  return "string";
}

/**
 * Determine if a field should be required based on data completeness
 */
function determineIfRequired(data: any[], key: string): boolean {
  const totalRows = data.length;
  const nonEmptyRows = data.filter(row => {
    const value = row[key];
    return value !== null && value !== undefined && value !== "";
  }).length;

  // If more than 90% of rows have values, consider it required
  return nonEmptyRows / totalRows > 0.9;
}

/**
 * Generate a clean field name from the key
 */
function generateFieldName(key: string): string {
  // Convert snake_case or kebab-case to camelCase
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, chr => chr.toLowerCase());
}

/**
 * Generate a description for the field based on its content
 */
function generateFieldDescription(
  key: string,
  fieldType: FieldType,
  _sampleData: any[]
): string {
  const keyLower = key.toLowerCase();

  // Check for specific name patterns first (order matters - most specific first)
  if (
    keyLower.includes("first") ||
    keyLower.includes("fname") ||
    keyLower.includes("given")
  ) {
    return "First name";
  }
  if (
    keyLower.includes("last") ||
    keyLower.includes("lname") ||
    keyLower.includes("surname") ||
    keyLower.includes("family")
  ) {
    return "Last name";
  }
  if (keyLower.includes("middle") || keyLower.includes("mname")) {
    return "Middle name";
  }
  if (keyLower.includes("full") && keyLower.includes("name")) {
    return "Full name";
  }

  // Common field descriptions based on key names
  const commonDescriptions: Record<string, string> = {
    id: "Unique identifier",
    name: "Name",
    email: "Email address",
    phone: "Phone number",
    address: "Street address",
    city: "City name",
    state: "State or province",
    country: "Country name",
    zip: "ZIP or postal code",
    age: "Age in years",
    salary: "Annual salary",
    department: "Department or team",
    status: "Current status",
    created: "Creation date",
    updated: "Last update date",
  };

  // Check for common field names
  for (const [pattern, description] of Object.entries(commonDescriptions)) {
    if (keyLower.includes(pattern)) {
      return description;
    }
  }

  // Generate description based on field type
  const typeDescriptions: Record<FieldType, string> = {
    string: "Text field",
    number: "Numeric value",
    integer: "Whole number",
    decimal: "Decimal number",
    boolean: "True/false value",
    date: "Date value",
    datetime: "Date and time",
    email: "Email address",
    phone: "Phone number",
    url: "Website URL",
    currency: "Monetary amount",
    percentage: "Percentage value",
    enum: "Selection from predefined options",
    array: "List of values",
    object: "Complex data structure",
    lookup: "Cross-reference data enrichment",
  };

  return typeDescriptions[fieldType] || "Data field";
}

/**
 * Get field type suggestions for a specific key
 */
export function getFieldTypeSuggestions(
  key: string,
  values: any[]
): FieldType[] {
  const suggestions: FieldType[] = [];
  const keyLower = key.toLowerCase();

  // Add suggestions based on key name
  if (keyLower.includes("email")) suggestions.push("email");
  if (keyLower.includes("phone") || keyLower.includes("tel"))
    suggestions.push("phone");
  if (keyLower.includes("url") || keyLower.includes("link"))
    suggestions.push("url");
  if (
    keyLower.includes("date") ||
    keyLower.includes("created") ||
    keyLower.includes("updated")
  ) {
    suggestions.push("date", "datetime");
  }
  if (
    keyLower.includes("price") ||
    keyLower.includes("cost") ||
    keyLower.includes("salary") ||
    keyLower.includes("amount")
  ) {
    suggestions.push("currency");
  }
  if (keyLower.includes("percent")) suggestions.push("percentage");
  if (keyLower.includes("id")) suggestions.push("string", "integer");
  if (keyLower.includes("name")) suggestions.push("string");
  if (keyLower.includes("status") || keyLower.includes("type"))
    suggestions.push("enum", "string");

  // Add suggestions based on content analysis
  const nonEmptyValues = values.filter(
    v => v !== null && v !== undefined && v !== ""
  );

  if (nonEmptyValues.length > 0) {
    const hasNumbers = nonEmptyValues.every(v => !isNaN(parseFloat(v)));
    if (hasNumbers) {
      const hasIntegers = nonEmptyValues.every(v =>
        Number.isInteger(parseFloat(v))
      );
      if (hasIntegers) {
        suggestions.push("integer");
      } else {
        suggestions.push("number", "decimal");
      }
    }

    const hasEmails = nonEmptyValues.some(v => /^[^@]+@[^@]+\.[^@]+$/.test(v));
    if (hasEmails) suggestions.push("email");

    const hasDates = nonEmptyValues.some(v => /^\d{4}-\d{2}-\d{2}$/.test(v));
    if (hasDates) suggestions.push("date");

    // Only suggest enum for fields with limited unique values that aren't common text fields
    if (nonEmptyValues.length <= 10) {
      const isNameField =
        keyLower.includes("name") ||
        keyLower.includes("first") ||
        keyLower.includes("last") ||
        keyLower.includes("full");

      const isEmailField =
        keyLower.includes("email") || keyLower.includes("mail");
      const isPhoneField =
        keyLower.includes("phone") || keyLower.includes("tel");
      const isAddressField =
        keyLower.includes("address") ||
        keyLower.includes("street") ||
        keyLower.includes("city") ||
        keyLower.includes("state") ||
        keyLower.includes("country");

      if (!isNameField && !isEmailField && !isPhoneField && !isAddressField) {
        suggestions.push("enum");
      }
    }
  }

  // Always include string as a fallback
  if (!suggestions.includes("string")) {
    suggestions.push("string");
  }

  return [...new Set(suggestions)]; // Remove duplicates
}
