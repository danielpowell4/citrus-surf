/**
 * Reference Data Types
 * 
 * Types and interfaces for managing reference data files used in lookup operations.
 * These types define the structure for uploading, storing, and retrieving reference data.
 */

/**
 * Information about a reference data file
 */
export interface ReferenceDataInfo {
  /** Unique identifier for the reference data (ref_ prefix) */
  id: string;
  /** Original filename */
  filename: string;
  /** Number of data rows (excluding headers) */
  rowCount: number;
  /** Column names available in the reference data */
  columns: string[];
  /** Timestamp when the file was uploaded (ISO string) */
  uploadedAt: string;
  /** Timestamp when the data was last modified (ISO string) */
  lastModified: string;
  /** File size in bytes */
  fileSize: number;
  /** Detected file format */
  format: 'csv' | 'json';
  /** Optional metadata */
  metadata?: {
    /** Original file MIME type */
    mimeType?: string;
    /** Detected delimiter for CSV files */
    delimiter?: string;
    /** Whether the file had headers */
    hasHeaders?: boolean;
    /** Character encoding detected */
    encoding?: string;
  };
}

/**
 * Parsed reference data with metadata
 */
export interface ReferenceData {
  /** Reference data info/metadata */
  info: ReferenceDataInfo;
  /** Actual data rows */
  data: Record<string, any>[];
}

/**
 * Options for uploading reference data
 */
export interface UploadReferenceOptions {
  /** Whether to override existing reference data with the same ID */
  overwrite?: boolean;
  /** Custom delimiter for CSV parsing (auto-detected if not provided) */
  delimiter?: string;
  /** Whether the file has headers (auto-detected if not provided) */
  hasHeaders?: boolean;
  /** Additional metadata to store */
  metadata?: Record<string, any>;
}

/**
 * Result of reference data validation
 */
export interface ValidationResult {
  /** Whether the data is valid */
  valid: boolean;
  /** Error messages if validation failed */
  errors: string[];
  /** Warning messages for potential issues */
  warnings: string[];
  /** Detected file format */
  format?: 'csv' | 'json';
  /** Detected delimiter for CSV */
  delimiter?: string;
  /** Whether headers were detected */
  hasHeaders?: boolean;
}

/**
 * Error types specific to reference data operations
 */
export class ReferenceDataError extends Error {
  constructor(
    message: string,
    public code: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'STORAGE_ERROR' | 'NOT_FOUND' | 'DUPLICATE_ID',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ReferenceDataError';
  }
}

/**
 * Statistics about reference data usage
 */
export interface ReferenceDataStats {
  /** Total number of reference files */
  totalFiles: number;
  /** Total rows across all files */
  totalRows: number;
  /** Total storage size in bytes */
  totalSize: number;
  /** Storage usage by file */
  fileStats: Array<{
    id: string;
    filename: string;
    rows: number;
    size: number;
  }>;
}

/**
 * Reference data manager interface
 */
export interface IReferenceDataManager {
  /**
   * Upload and store a reference data file
   */
  uploadReferenceFile(
    file: File, 
    id: string, 
    options?: UploadReferenceOptions
  ): Promise<ReferenceDataInfo>;

  /**
   * Retrieve reference data by ID
   */
  getReferenceData(id: string): ReferenceData | null;

  /**
   * Get only the data rows (without metadata)
   */
  getReferenceDataRows(id: string): Record<string, any>[] | null;

  /**
   * List all available reference files
   */
  listReferenceFiles(): ReferenceDataInfo[];

  /**
   * Delete a reference data file
   */
  deleteReferenceFile(id: string): boolean;

  /**
   * Update existing reference data
   */
  updateReferenceData(id: string, data: Record<string, any>[]): boolean;

  /**
   * Check if reference data exists
   */
  hasReferenceData(id: string): boolean;

  /**
   * Get reference data statistics
   */
  getStats(): ReferenceDataStats;

  /**
   * Validate reference data before storing
   */
  validateReferenceData(file: File): Promise<ValidationResult>;

  /**
   * Clear all reference data
   */
  clearAll(): void;

  /**
   * Export reference data for backup
   */
  exportReferenceData(): Record<string, ReferenceData>;

  /**
   * Import reference data from backup
   */
  importReferenceData(data: Record<string, ReferenceData>): void;
}

/**
 * Generate a unique reference data ID with ref_ prefix
 */
export function generateReferenceId(baseName?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const base = baseName ? `_${baseName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  return `ref${base}_${timestamp}_${random}`;
}

/**
 * Check if an ID is a valid reference data ID
 */
export function isValidReferenceId(id: string): boolean {
  return /^ref(_[a-zA-Z0-9_]+)?_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/.test(id);
}