/**
 * CSV Export Utilities
 *
 * Provides functions to convert table data to CSV format for export
 */

export interface CsvExportOptions {
  delimiter?: string;
  includeHeaders?: boolean;
  escapeQuotes?: boolean;
}

/**
 * Converts an array of objects to CSV format
 *
 * @param data - Array of objects to convert
 * @param options - CSV export options
 * @returns CSV string
 */
export function convertToCsv(
  data: Record<string, any>[],
  options: CsvExportOptions = {}
): string {
  const {
    delimiter = ",",
    includeHeaders = true,
    escapeQuotes = true,
  } = options;

  if (!data || data.length === 0) {
    throw new Error("No data provided for CSV conversion");
  }

  if (!Array.isArray(data)) {
    throw new Error("Data must be an array of objects");
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });
  const headers = Array.from(allKeys);

  const rows: string[] = [];

  // Add headers if requested
  if (includeHeaders) {
    rows.push(
      headers
        .map(header => escapeCsvField(header, escapeQuotes))
        .join(delimiter)
    );
  }

  // Add data rows
  data.forEach(obj => {
    const row = headers.map(header => {
      const value = obj[header];
      return escapeCsvField(value, escapeQuotes);
    });
    rows.push(row.join(delimiter));
  });

  return rows.join("\n");
}

/**
 * Escapes a field value for CSV format
 *
 * @param value - The value to escape
 * @param escapeQuotes - Whether to escape quotes
 * @returns Escaped CSV field
 */
function escapeCsvField(value: any, escapeQuotes: boolean = true): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the value contains delimiter, newline, or quotes, wrap in quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    if (escapeQuotes) {
      // Escape quotes by doubling them
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    } else {
      return `"${stringValue}"`;
    }
  }

  return stringValue;
}

/**
 * Generates a filename with timestamp and version information
 *
 * @param baseName - Base filename without extension
 * @param extension - File extension (e.g., 'csv', 'json')
 * @param version - Optional version number
 * @returns Formatted filename
 */
export function generateFilename(
  baseName: string,
  extension: string,
  version?: number
): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19); // Remove milliseconds and timezone

  const versionSuffix = version !== undefined ? `_v${version}` : "";

  return `${baseName}${versionSuffix}_${timestamp}.${extension}`;
}

/**
 * Downloads data as a file
 *
 * @param content - File content
 * @param filename - Filename
 * @param mimeType - MIME type
 * @throws Error if download fails
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  try {
    if (!content) {
      throw new Error("No content to download");
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
    throw new Error(
      `Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
