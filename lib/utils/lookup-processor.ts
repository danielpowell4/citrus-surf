/**
 * Lookup Data Processing Integration
 *
 * Integrates the lookup matching engine with the data processing pipeline to automatically
 * perform lookups during data import and provide real-time lookup updates.
 */

import {
  LookupMatchingEngine,
  createLookupConfig,
} from "./lookup-matching-engine";
import { referenceDataManager } from "./reference-data-manager";
import type { TargetShape, LookupField } from "../types/target-shapes";
import type { TableRow } from "../features/tableSlice";

/**
 * Result of processing data with lookups
 */
export interface ProcessedLookupResult {
  /** Transformed data with lookup values and derived columns */
  data: TableRow[];
  /** Lookup errors that occurred during processing */
  errors: LookupError[];
  /** Processing statistics */
  stats: LookupStats;
  /** Fuzzy matches that may need user review */
  fuzzyMatches: FuzzyMatch[];
  /** Performance metrics */
  performance: ProcessingPerformance;
}

/**
 * Lookup processing error
 */
export interface LookupError {
  /** Row ID where error occurred */
  rowId: string;
  /** Field name that caused the error */
  fieldName: string;
  /** Original input value */
  inputValue: any;
  /** Error type */
  type: "no_match" | "multiple_matches" | "reference_missing" | "invalid_input";
  /** Human-readable error message */
  message: string;
  /** Suggested corrections if available */
  suggestions?: string[];
}

/**
 * Processing statistics
 */
export interface LookupStats {
  /** Total number of lookup fields processed */
  totalFields: number;
  /** Total number of data rows processed */
  totalRows: number;
  /** Number of exact matches found */
  exactMatches: number;
  /** Number of normalized matches found */
  normalizedMatches: number;
  /** Number of fuzzy matches found */
  fuzzyMatches: number;
  /** Number of values with no matches */
  noMatches: number;
  /** Number of derived columns created */
  derivedColumns: number;
  /** Processing success rate (0-1) */
  successRate: number;
}

/**
 * Fuzzy match that may need user review
 */
export interface FuzzyMatch {
  /** Row ID */
  rowId: string;
  /** Field name */
  fieldName: string;
  /** Original input value */
  inputValue: any;
  /** Suggested match value */
  suggestedValue: any;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Performance metrics for processing
 */
export interface ProcessingPerformance {
  /** Total processing time in milliseconds */
  totalTime: number;
  /** Average time per row in milliseconds */
  avgTimePerRow: number;
  /** Rows processed per second */
  throughput: number;
  /** Number of database/reference lookups performed */
  lookupOperations: number;
}

/**
 * Options for lookup processing
 */
export interface LookupProcessingOptions {
  /** Skip processing if confidence is below this threshold */
  minConfidence?: number;
  /** Maximum number of fuzzy matches to collect for review */
  maxFuzzyMatches?: number;
  /** Whether to process derived fields */
  processDerivedFields?: boolean;
  /** Progress callback for batch processing */
  onProgress?: (processed: number, total: number) => void;
  /** Whether to continue processing if errors occur */
  continueOnError?: boolean;
}

/**
 * Lookup data processor - integrates lookup engine with data processing pipeline
 */
export class LookupProcessor {
  private matchingEngine: LookupMatchingEngine;

  constructor() {
    this.matchingEngine = new LookupMatchingEngine();
  }

  /**
   * Process data with lookup operations for a given target shape
   * This is the main integration point for the data processing pipeline
   */
  async processDataWithLookups(
    data: TableRow[],
    targetShape: TargetShape,
    options: LookupProcessingOptions = {}
  ): Promise<ProcessedLookupResult> {
    const startTime = performance.now();
    const {
      minConfidence = 0.7,
      maxFuzzyMatches = 100,
      processDerivedFields = true,
      onProgress,
      continueOnError = true,
    } = options;

    // Find all lookup fields in the target shape
    const lookupFields = targetShape.fields.filter(
      (field): field is LookupField => field.type === "lookup"
    );

    if (lookupFields.length === 0) {
      // No lookup fields to process, return data as-is
      return {
        data,
        errors: [],
        stats: this.createEmptyStats(data.length),
        fuzzyMatches: [],
        performance: {
          totalTime: performance.now() - startTime,
          avgTimePerRow: 0,
          throughput: 0,
          lookupOperations: 0,
        },
      };
    }

    const errors: LookupError[] = [];
    const fuzzyMatches: FuzzyMatch[] = [];
    const stats = this.initializeStats(lookupFields.length, data.length);
    let lookupOperations = 0;

    // Process each row
    const processedData = await Promise.all(
      data.map(async (row, index) => {
        try {
          // Report progress
          if (onProgress && index % 100 === 0) {
            onProgress(index, data.length);
          }

          const processedRow = { ...row };
          const rowLookupResults: Record<string, any> = {};

          // Process each lookup field for this row
          for (const lookupField of lookupFields) {
            try {
              const result = await this.processSingleLookup(
                processedRow[lookupField.name],
                lookupField,
                row._rowId || `row_${index}`
              );

              lookupOperations++;

              if (result.matched) {
                // Update row with lookup result
                processedRow[lookupField.name] = result.matchedValue;
                rowLookupResults[lookupField.name] = result;

                // Update statistics
                switch (result.matchType) {
                  case "exact":
                    stats.exactMatches++;
                    break;
                  case "normalized":
                    stats.normalizedMatches++;
                    break;
                  case "fuzzy":
                    stats.fuzzyMatches++;
                    // Collect fuzzy match for review if confidence is low
                    if (
                      result.confidence < minConfidence &&
                      fuzzyMatches.length < maxFuzzyMatches
                    ) {
                      fuzzyMatches.push({
                        rowId: row._rowId || `row_${index}`,
                        fieldName: lookupField.name,
                        inputValue: result.inputValue,
                        suggestedValue: result.matchedValue,
                        confidence: result.confidence,
                      });
                    }
                    break;
                }
              } else {
                stats.noMatches++;
                // Create error for unmatched value
                const error = {
                  rowId: row._rowId || `row_${index}`,
                  fieldName: lookupField.name,
                  inputValue: result.inputValue,
                  type: "no_match" as const,
                  message: `No match found for "${result.inputValue}" in ${lookupField.referenceFile}`,
                  suggestions: result.suggestions?.map(s => s.value) || [],
                };
                errors.push(error);

                // Throw error if continueOnError is false
                if (!continueOnError) {
                  throw new Error(error.message);
                }
              }
            } catch (error) {
              // Handle lookup processing error
              errors.push({
                rowId: row._rowId || `row_${index}`,
                fieldName: lookupField.name,
                inputValue: processedRow[lookupField.name],
                type:
                  error instanceof Error && error.message.includes("reference")
                    ? "reference_missing"
                    : "invalid_input",
                message:
                  error instanceof Error
                    ? error.message
                    : "Unknown lookup error",
                suggestions: [],
              });

              if (!continueOnError) {
                throw error;
              }
            }
          }

          // Process derived fields if enabled
          if (processDerivedFields) {
            this.updateDerivedColumns(
              processedRow,
              rowLookupResults,
              lookupFields
            );
            stats.derivedColumns += this.countDerivedFields(lookupFields);
          }

          return processedRow;
        } catch (error) {
          if (!continueOnError) {
            throw error;
          }
          return row; // Return original row if processing fails
        }
      })
    );

    // Final progress report
    if (onProgress) {
      onProgress(data.length, data.length);
    }

    // Calculate final statistics
    const totalTime = performance.now() - startTime;
    stats.successRate =
      (stats.exactMatches + stats.normalizedMatches + stats.fuzzyMatches) /
      (data.length * lookupFields.length);

    return {
      data: processedData,
      errors,
      stats,
      fuzzyMatches,
      performance: {
        totalTime,
        avgTimePerRow: totalTime / data.length,
        throughput: data.length / (totalTime / 1000),
        lookupOperations,
      },
    };
  }

  /**
   * Process a single lookup operation
   */
  async processSingleLookup(
    value: any,
    field: LookupField,
    _rowId: string
  ): Promise<import("./lookup-matching-engine").LookupResult> {
    // Get reference data for this lookup field
    const referenceData = referenceDataManager.getReferenceDataRows(
      field.referenceFile
    );

    if (!referenceData || referenceData.length === 0) {
      throw new Error(`Reference data not found for ${field.referenceFile}`);
    }

    // Create lookup configuration from field definition
    const config = createLookupConfig(field);

    // Perform the lookup using the matching engine
    return this.matchingEngine.performLookup(value, referenceData, config);
  }

  /**
   * Update derived columns based on lookup results
   */
  private updateDerivedColumns(
    rowData: TableRow,
    lookupResults: Record<string, any>,
    lookupFields: LookupField[]
  ): void {
    for (const lookupField of lookupFields) {
      const lookupResult = lookupResults[lookupField.name];

      if (lookupResult?.matched && lookupResult.derivedValues) {
        // Add derived values to the row
        Object.entries(lookupResult.derivedValues).forEach(([key, value]) => {
          rowData[key] = value;
        });
      }
    }
  }

  /**
   * Count derived fields in lookup fields
   */
  private countDerivedFields(lookupFields: LookupField[]): number {
    return lookupFields.reduce((count, field) => {
      return count + (field.alsoGet?.length || 0);
    }, 0);
  }

  /**
   * Initialize processing statistics
   */
  private initializeStats(totalFields: number, totalRows: number): LookupStats {
    return {
      totalFields,
      totalRows,
      exactMatches: 0,
      normalizedMatches: 0,
      fuzzyMatches: 0,
      noMatches: 0,
      derivedColumns: 0,
      successRate: 0,
    };
  }

  /**
   * Create empty stats for cases with no lookup fields
   */
  private createEmptyStats(totalRows: number): LookupStats {
    return {
      totalFields: 0,
      totalRows,
      exactMatches: 0,
      normalizedMatches: 0,
      fuzzyMatches: 0,
      noMatches: 0,
      derivedColumns: 0,
      successRate: 1,
    };
  }

  /**
   * Process a real-time lookup update for a single field
   * Used when user edits a lookup field value in the UI
   */
  async processLookupUpdate(
    value: any,
    field: LookupField,
    rowData: TableRow
  ): Promise<{
    updatedRow: TableRow;
    success: boolean;
    error?: string;
    confidence?: number;
  }> {
    try {
      const result = await this.processSingleLookup(
        value,
        field,
        rowData._rowId || "unknown"
      );

      if (result.matched) {
        const updatedRow = { ...rowData };
        updatedRow[field.name] = result.matchedValue;

        // Update derived columns
        if (result.derivedValues) {
          Object.entries(result.derivedValues).forEach(([key, value]) => {
            updatedRow[key] = value;
          });
        }

        return {
          updatedRow,
          success: true,
          confidence: result.confidence,
        };
      } else {
        return {
          updatedRow: rowData,
          success: false,
          error: `No match found for "${value}"`,
          confidence: 0,
        };
      }
    } catch (error) {
      return {
        updatedRow: rowData,
        success: false,
        error: error instanceof Error ? error.message : "Lookup failed",
        confidence: 0,
      };
    }
  }

  /**
   * Batch process lookup updates for multiple rows
   * Useful for processing large datasets efficiently
   */
  async batchProcessLookups(
    updates: Array<{
      rowId: string;
      fieldName: string;
      value: any;
      field: LookupField;
      rowData: TableRow;
    }>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<
    Array<{
      rowId: string;
      updatedRow: TableRow;
      success: boolean;
      error?: string;
    }>
  > {
    const results = [];

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];

      if (onProgress && i % 10 === 0) {
        onProgress(i, updates.length);
      }

      const result = await this.processLookupUpdate(
        update.value,
        update.field,
        update.rowData
      );

      results.push({
        rowId: update.rowId,
        updatedRow: result.updatedRow,
        success: result.success,
        error: result.error,
      });
    }

    if (onProgress) {
      onProgress(updates.length, updates.length);
    }

    return results;
  }

  /**
   * Get lookup field statistics for a target shape
   */
  getLookupFieldStats(targetShape: TargetShape): {
    totalLookupFields: number;
    totalDerivedFields: number;
    lookupFields: Array<{
      name: string;
      referenceFile: string;
      hasMatchColumn: boolean;
      hasReturnColumn: boolean;
      derivedFieldCount: number;
    }>;
  } {
    const lookupFields = targetShape.fields.filter(
      (field): field is LookupField => field.type === "lookup"
    );

    return {
      totalLookupFields: lookupFields.length,
      totalDerivedFields: this.countDerivedFields(lookupFields),
      lookupFields: lookupFields.map(field => ({
        name: field.name,
        referenceFile: field.referenceFile,
        hasMatchColumn: !!field.match.on,
        hasReturnColumn: !!field.match.get,
        derivedFieldCount: field.alsoGet?.length || 0,
      })),
    };
  }
}

/**
 * Global lookup processor instance
 */
export const lookupProcessor = new LookupProcessor();

/**
 * Utility function to check if a target shape has lookup fields
 */
export function hasLookupFields(targetShape: TargetShape): boolean {
  return targetShape.fields.some(field => field.type === "lookup");
}

/**
 * Utility function to get all lookup fields from a target shape
 */
export function getLookupFields(targetShape: TargetShape): LookupField[] {
  return targetShape.fields.filter(
    (field): field is LookupField => field.type === "lookup"
  );
}
