/**
 * Reference Data Manager
 *
 * Manages upload, storage, and retrieval of reference data files for lookup operations.
 * Supports CSV and JSON formats with validation and efficient browser storage.
 *
 * @example
 * ```typescript
 * import { referenceDataManager } from './reference-data-manager';
 *
 * // Upload a CSV file
 * const file = new File(['name,age\nJohn,30'], 'employees.csv');
 * const info = await referenceDataManager.uploadReferenceFile(file, 'ref_employees');
 *
 * // Retrieve data
 * const data = referenceDataManager.getReferenceDataRows('ref_employees');
 * console.log(data); // [{ name: 'John', age: '30' }]
 *
 * // List all files
 * const files = referenceDataManager.listReferenceFiles();
 *
 * // Get statistics
 * const stats = referenceDataManager.getStats();
 * ```
 */

import { storage } from "./localStorage";
import type {
  IReferenceDataManager,
  ReferenceDataInfo,
  ReferenceData,
  UploadReferenceOptions,
  ValidationResult,
  ReferenceDataStats,
} from "../types/reference-data-types";
import { ReferenceDataError } from "../types/reference-data-types";

/**
 * Storage keys for reference data
 */
const STORAGE_KEYS = {
  REFERENCE_DATA_INDEX: "citrus_surf_reference_data_index",
  REFERENCE_DATA_PREFIX: "citrus_surf_reference_data_",
} as const;

/**
 * Implementation of reference data management
 */
export class ReferenceDataManager implements IReferenceDataManager {
  /**
   * Upload and store a reference data file
   */
  async uploadReferenceFile(
    file: File,
    id: string,
    options: UploadReferenceOptions = {}
  ): Promise<ReferenceDataInfo> {
    try {
      // Check if ID already exists and overwrite is not allowed
      if (this.hasReferenceData(id) && !options.overwrite) {
        throw new ReferenceDataError(
          `Reference data with ID '${id}' already exists`,
          "DUPLICATE_ID",
          { id, filename: file.name }
        );
      }

      // Read file content
      const content = await this.readFileContent(file);

      // Validate the file
      const validation = await this.validateReferenceData(file);
      if (!validation.valid) {
        throw new ReferenceDataError(
          `Validation failed: ${validation.errors.join(", ")}`,
          "VALIDATION_ERROR",
          { errors: validation.errors, warnings: validation.warnings }
        );
      }

      // Parse the data
      const parsedData = await this.parseFileContent(
        content,
        validation.format || "csv",
        {
          delimiter: options.delimiter || validation.delimiter,
          hasHeaders: options.hasHeaders ?? validation.hasHeaders ?? true,
        }
      );

      // Create reference data info
      const now = new Date().toISOString();
      const info: ReferenceDataInfo = {
        id,
        filename: file.name,
        rowCount: parsedData.length,
        columns: parsedData.length > 0 ? Object.keys(parsedData[0]) : [],
        uploadedAt: now,
        lastModified: now,
        fileSize: file.size,
        format: validation.format || "csv",
        metadata: {
          mimeType: file.type,
          delimiter: validation.delimiter,
          hasHeaders: validation.hasHeaders,
          encoding: "utf-8",
          ...options.metadata,
        },
      };

      // Store the data
      const referenceData: ReferenceData = {
        info,
        data: parsedData,
      };

      this.storeReferenceData(id, referenceData);
      this.updateIndex(info);

      return info;
    } catch (error) {
      if (error instanceof ReferenceDataError) {
        throw error;
      }
      throw new ReferenceDataError(
        `Failed to upload reference file: ${error instanceof Error ? error.message : "Unknown error"}`,
        "STORAGE_ERROR",
        { filename: file.name, originalError: error }
      );
    }
  }

  /**
   * Retrieve reference data by ID
   */
  getReferenceData(id: string): ReferenceData | null {
    try {
      const key = this.getStorageKey(id);
      return storage.getItem<ReferenceData>(key);
    } catch (error) {
      console.error(`Error retrieving reference data '${id}':`, error);
      return null;
    }
  }

  /**
   * Get only the data rows (without metadata)
   */
  getReferenceDataRows(id: string): Record<string, any>[] | null {
    const referenceData = this.getReferenceData(id);
    return referenceData?.data || null;
  }

  /**
   * List all available reference files
   */
  listReferenceFiles(): ReferenceDataInfo[] {
    try {
      const index = storage.getItem<Record<string, ReferenceDataInfo>>(
        STORAGE_KEYS.REFERENCE_DATA_INDEX,
        {}
      );
      return Object.values(index || {});
    } catch (error) {
      console.error("Error listing reference files:", error);
      return [];
    }
  }

  /**
   * Delete a reference data file
   */
  deleteReferenceFile(id: string): boolean {
    try {
      // Check if the file exists first
      if (!this.hasReferenceData(id)) {
        return false;
      }

      // Remove from storage
      const key = this.getStorageKey(id);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }

      // Update index
      const index = storage.getItem<Record<string, ReferenceDataInfo>>(
        STORAGE_KEYS.REFERENCE_DATA_INDEX,
        {}
      );
      if (index && index[id]) {
        delete index[id];
        storage.setItem(STORAGE_KEYS.REFERENCE_DATA_INDEX, index);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting reference data '${id}':`, error);
      return false;
    }
  }

  /**
   * Update existing reference data
   */
  updateReferenceData(id: string, data: Record<string, any>[]): boolean {
    try {
      const existingData = this.getReferenceData(id);
      if (!existingData) {
        throw new ReferenceDataError(
          `Reference data with ID '${id}' not found`,
          "NOT_FOUND",
          { id }
        );
      }

      // Update the data and metadata
      const updatedInfo: ReferenceDataInfo = {
        ...existingData.info,
        rowCount: data.length,
        columns: data.length > 0 ? Object.keys(data[0]) : [],
        lastModified: new Date().toISOString(),
      };

      const updatedData: ReferenceData = {
        info: updatedInfo,
        data,
      };

      this.storeReferenceData(id, updatedData);
      this.updateIndex(updatedInfo);

      return true;
    } catch (error) {
      console.error(`Error updating reference data '${id}':`, error);
      return false;
    }
  }

  /**
   * Check if reference data exists
   */
  hasReferenceData(id: string): boolean {
    const index = storage.getItem<Record<string, ReferenceDataInfo>>(
      STORAGE_KEYS.REFERENCE_DATA_INDEX,
      {}
    );
    return !!(index && index[id]);
  }

  /**
   * Get reference data statistics
   */
  getStats(): ReferenceDataStats {
    const files = this.listReferenceFiles();

    return {
      totalFiles: files.length,
      totalRows: files.reduce((sum, file) => sum + file.rowCount, 0),
      totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
      fileStats: files.map(file => ({
        id: file.id,
        filename: file.filename,
        rows: file.rowCount,
        size: file.fileSize,
      })),
    };
  }

  /**
   * Validate reference data before storing
   */
  async validateReferenceData(file: File): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check file size (warn if > 10MB, error if > 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      const warnSize = 10 * 1024 * 1024; // 10MB

      if (file.size > maxSize) {
        result.valid = false;
        result.errors.push(
          `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (50MB)`
        );
      } else if (file.size > warnSize) {
        result.warnings.push(
          `Large file size (${this.formatFileSize(file.size)}) may impact performance`
        );
      }

      // Read and validate content
      const content = await this.readFileContent(file);

      // Detect format
      const format = this.detectFileFormat(content, file.name);
      result.format = format;

      if (format === "json") {
        // Validate JSON
        const validation = this.validateJsonContent(content);
        result.valid = result.valid && validation.valid;
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
      } else {
        // Validate CSV
        const validation = this.validateCsvContent(content);
        result.valid = result.valid && validation.valid;
        result.errors.push(...validation.errors);
        result.warnings.push(...validation.warnings);
        result.delimiter = validation.delimiter;
        result.hasHeaders = validation.hasHeaders;
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(
        `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  /**
   * Clear all reference data
   */
  clearAll(): void {
    try {
      // Get all reference data IDs
      const files = this.listReferenceFiles();

      // Remove each file
      files.forEach(file => {
        this.deleteReferenceFile(file.id);
      });

      // Clear the index
      storage.setItem(STORAGE_KEYS.REFERENCE_DATA_INDEX, {});
    } catch (error) {
      console.error("Error clearing all reference data:", error);
    }
  }

  /**
   * Export reference data for backup
   */
  exportReferenceData(): Record<string, ReferenceData> {
    const files = this.listReferenceFiles();
    const exported: Record<string, ReferenceData> = {};

    files.forEach(file => {
      const data = this.getReferenceData(file.id);
      if (data) {
        exported[file.id] = data;
      }
    });

    return exported;
  }

  /**
   * Import reference data from backup
   */
  importReferenceData(data: Record<string, ReferenceData>): void {
    try {
      Object.entries(data).forEach(([id, referenceData]) => {
        this.storeReferenceData(id, referenceData);
        this.updateIndex(referenceData.info);
      });
    } catch (error) {
      throw new ReferenceDataError(
        "Failed to import reference data",
        "STORAGE_ERROR",
        { originalError: error }
      );
    }
  }

  // Private helper methods

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file, "utf-8");
    });
  }

  private detectFileFormat(content: string, filename?: string): "csv" | "json" {
    // Check file extension first
    if (filename) {
      const ext = filename.split(".").pop()?.toLowerCase();
      if (ext === "json") return "json";
      if (["csv", "tsv", "txt"].includes(ext || "")) return "csv";
    }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content.trim());
      if (Array.isArray(parsed)) return "json";
    } catch {
      // Not valid JSON
    }

    // Default to CSV
    return "csv";
  }

  private validateJsonContent(content: string): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    try {
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        result.valid = false;
        result.errors.push("JSON must be an array of objects");
        return result;
      }

      if (parsed.length === 0) {
        result.warnings.push("JSON array is empty");
        return result;
      }

      // Check if all items are objects
      const nonObjects = parsed.filter(
        item => typeof item !== "object" || item === null || Array.isArray(item)
      );
      if (nonObjects.length > 0) {
        result.valid = false;
        result.errors.push("All array items must be objects");
      }

      // Check for consistent structure
      if (parsed.length > 1) {
        const firstKeys = Object.keys(parsed[0] || {}).sort();
        const inconsistent = parsed.slice(1).some(item => {
          const keys = Object.keys(item || {}).sort();
          return JSON.stringify(keys) !== JSON.stringify(firstKeys);
        });

        if (inconsistent) {
          result.warnings.push("Objects have inconsistent properties");
        }
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(
        `Invalid JSON: ${error instanceof Error ? error.message : "Parse error"}`
      );
    }

    return result;
  }

  private validateCsvContent(
    content: string
  ): ValidationResult & { delimiter?: string; hasHeaders?: boolean } {
    const result: ValidationResult & {
      delimiter?: string;
      hasHeaders?: boolean;
    } = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const lines = content.trim().split("\n");

      if (
        lines.length === 0 ||
        (lines.length === 1 && lines[0].trim() === "")
      ) {
        result.valid = false;
        result.errors.push("CSV file is empty");
        return result;
      }

      // Detect delimiter
      const delimiter = this.detectDelimiter(lines[0]);
      result.delimiter = delimiter;

      // Check if first line looks like headers
      const firstLine = lines[0];
      const hasHeaders = this.detectHeaders(firstLine, delimiter);
      result.hasHeaders = hasHeaders;

      // Parse a few lines to validate structure
      const sampleSize = Math.min(10, lines.length);
      let expectedColumns = 0;

      for (let i = 0; i < sampleSize; i++) {
        const columns = this.parseCsvLine(lines[i], delimiter);

        if (i === 0) {
          expectedColumns = columns.length;
          if (expectedColumns === 0) {
            result.valid = false;
            result.errors.push("CSV has no columns");
            break;
          }
        } else if (columns.length !== expectedColumns) {
          result.warnings.push(
            `Line ${i + 1} has ${columns.length} columns, expected ${expectedColumns}`
          );
        }
      }

      if (lines.length === 1 && hasHeaders) {
        result.warnings.push("CSV contains only headers, no data rows");
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(
        `CSV validation error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  private detectDelimiter(line: string): string {
    const delimiters = [",", "\t", ";", "|"];
    let bestDelimiter = ",";
    let maxCount = 0;

    for (const delimiter of delimiters) {
      const count = (line.match(new RegExp(`\\${delimiter}`, "g")) || [])
        .length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  private detectHeaders(line: string, delimiter: string): boolean {
    const columns = this.parseCsvLine(line, delimiter);

    // Check if all columns are strings without numbers
    return columns.every(col => {
      const trimmed = col.trim();
      return trimmed.length > 0 && isNaN(Number(trimmed));
    });
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    if (!line.trim()) return [];

    if (delimiter === "\t") {
      return line.split("\t").map(field => field.trim());
    }

    // Handle CSV with quoted fields
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && i < line.length - 1 && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private async parseFileContent(
    content: string,
    format: "csv" | "json",
    options: { delimiter?: string; hasHeaders?: boolean }
  ): Promise<Record<string, any>[]> {
    if (format === "json") {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }

    // Parse CSV
    const lines = content.trim().split("\n");
    if (lines.length === 0) return [];

    const delimiter = options.delimiter || ",";
    const hasHeaders = options.hasHeaders !== false;

    if (!hasHeaders) {
      // Generate column names: col1, col2, etc.
      const firstRow = this.parseCsvLine(lines[0], delimiter);
      const headers = firstRow.map((_, i) => `col${i + 1}`);

      return lines.map(line => {
        const values = this.parseCsvLine(line, delimiter);
        const row: Record<string, any> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || "";
        });
        return row;
      });
    }

    // Parse with headers
    const headers = this.parseCsvLine(lines[0], delimiter);
    const dataRows = lines.slice(1);

    return dataRows.map(line => {
      const values = this.parseCsvLine(line, delimiter);
      const row: Record<string, any> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || "";
      });
      return row;
    });
  }

  private storeReferenceData(id: string, data: ReferenceData): void {
    const key = this.getStorageKey(id);
    storage.setItem(key, data);
  }

  private updateIndex(info: ReferenceDataInfo): void {
    const index = storage.getItem<Record<string, ReferenceDataInfo>>(
      STORAGE_KEYS.REFERENCE_DATA_INDEX,
      {}
    );
    if (index) {
      index[info.id] = info;
      storage.setItem(STORAGE_KEYS.REFERENCE_DATA_INDEX, index);
    }
  }

  private getStorageKey(id: string): string {
    return `${STORAGE_KEYS.REFERENCE_DATA_PREFIX}${id}`;
  }

  private formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }
}

/**
 * Singleton instance of the reference data manager
 */
export const referenceDataManager = new ReferenceDataManager();
