/**
 * Lookup Matching Engine
 *
 * Core matching algorithms for lookup operations with exact, normalized, and fuzzy matching.
 * Optimized for performance with large datasets and comprehensive result reporting.
 */

import {
  normalizeString,
  combinedSimilarity,
  findBestMatches,
} from "./string-similarity";
import type { LookupField, DerivedField } from "../types/target-shapes";

/**
 * Result of a single lookup operation
 */
export interface LookupResult {
  /** Original input value */
  inputValue: string;
  /** Whether a match was found */
  matched: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Type of match that was successful */
  matchType: "exact" | "normalized" | "fuzzy" | "none";
  /** The matched reference value */
  matchedValue: any;
  /** Additional derived values from alsoGet configuration */
  derivedValues: Record<string, any>;
  /** Alternative suggestions for fuzzy matches */
  suggestions?: LookupSuggestion[];
  /** Reference row that was matched */
  matchedRow?: Record<string, any>;
  /** Performance metrics */
  metrics?: {
    executionTime: number;
    comparisons: number;
  };
}

/**
 * Suggestion for fuzzy matches
 */
export interface LookupSuggestion {
  /** Suggested value */
  value: any;
  /** Confidence score for this suggestion */
  confidence: number;
  /** Reason for the suggestion */
  reason: string;
  /** Source row for the suggestion */
  sourceRow?: Record<string, any>;
}

/**
 * Configuration for lookup matching
 */
export interface LookupConfig {
  /** Column to match against in reference data */
  matchColumn: string;
  /** Column to return as the result value */
  returnColumn: string;
  /** Column to display (optional, defaults to returnColumn) */
  displayColumn?: string;
  /** Additional columns to derive */
  derivedFields?: DerivedField[];
  /** Smart matching configuration */
  smartMatching: {
    enabled: boolean;
    confidence: number;
  };
  /** Behavior when no match is found */
  onMismatch: "error" | "warning" | "null";
  /** Normalization options */
  normalization?: {
    caseSensitive?: boolean;
    trimWhitespace?: boolean;
    removeAccents?: boolean;
    collapseWhitespace?: boolean;
  };
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
}

/**
 * Batch lookup configuration
 */
export interface BatchLookupConfig extends LookupConfig {
  /** Batch size for processing (default: 1000) */
  batchSize?: number;
  /** Progress callback for large operations */
  onProgress?: (progress: {
    completed: number;
    total: number;
    percentage: number;
  }) => void;
}

/**
 * Performance metrics for batch operations
 */
export interface BatchMetrics {
  totalExecutionTime: number;
  averageExecutionTime: number;
  totalComparisons: number;
  matchRate: number;
  throughput: number; // operations per second
}

/**
 * Main matching engine class
 */
export class LookupMatchingEngine {
  /**
   * Perform a single lookup operation
   *
   * @param inputValue Value to look up
   * @param referenceData Reference dataset
   * @param config Lookup configuration
   * @returns Lookup result with match information
   */
  performLookup(
    inputValue: string,
    referenceData: Record<string, any>[],
    config: LookupConfig
  ): LookupResult {
    const startTime = performance.now();
    let comparisons = 0;

    // Handle null/undefined/empty input
    if (inputValue == null || inputValue === "") {
      return {
        inputValue: inputValue || "",
        matched: false,
        confidence: 0,
        matchType: "none",
        matchedValue: null,
        derivedValues: {},
        metrics: {
          executionTime: performance.now() - startTime,
          comparisons: 0,
        },
      };
    }

    // Validate reference data
    if (!referenceData || referenceData.length === 0) {
      return {
        inputValue,
        matched: false,
        confidence: 0,
        matchType: "none",
        matchedValue: null,
        derivedValues: {},
        metrics: {
          executionTime: performance.now() - startTime,
          comparisons: 0,
        },
      };
    }

    // Validate configuration
    if (!config.matchColumn || !config.returnColumn) {
      throw new Error(
        "matchColumn and returnColumn are required in lookup configuration"
      );
    }

    // Step 1: Try exact matching
    const exactResult = this.performExactMatch(
      inputValue,
      referenceData,
      config
    );
    comparisons += referenceData.length;

    if (exactResult.matched) {
      return {
        ...exactResult,
        metrics: {
          executionTime: performance.now() - startTime,
          comparisons,
        },
      };
    }

    // Step 2: Try normalized matching
    const normalizedResult = this.performNormalizedMatch(
      inputValue,
      referenceData,
      config
    );
    comparisons += referenceData.length;

    if (normalizedResult.matched) {
      return {
        ...normalizedResult,
        metrics: {
          executionTime: performance.now() - startTime,
          comparisons,
        },
      };
    }

    // Step 3: Try fuzzy matching (if enabled)
    if (config.smartMatching.enabled) {
      const fuzzyResult = this.performFuzzyMatch(
        inputValue,
        referenceData,
        config
      );
      comparisons += referenceData.length;

      if (fuzzyResult.matched) {
        return {
          ...fuzzyResult,
          metrics: {
            executionTime: performance.now() - startTime,
            comparisons,
          },
        };
      }

      // Return fuzzy result with suggestions even if no match
      return {
        ...fuzzyResult,
        metrics: {
          executionTime: performance.now() - startTime,
          comparisons,
        },
      };
    }

    // No match found
    return {
      inputValue,
      matched: false,
      confidence: 0,
      matchType: "none",
      matchedValue: null,
      derivedValues: {},
      metrics: {
        executionTime: performance.now() - startTime,
        comparisons,
      },
    };
  }

  /**
   * Perform batch lookup operations with performance optimizations
   *
   * @param inputValues Array of values to look up
   * @param referenceData Reference dataset
   * @param config Batch lookup configuration
   * @returns Array of lookup results
   */
  async batchLookup(
    inputValues: string[],
    referenceData: Record<string, any>[],
    config: BatchLookupConfig
  ): Promise<{ results: LookupResult[]; metrics: BatchMetrics }> {
    const startTime = performance.now();
    const batchSize = config.batchSize || 1000;
    const results: LookupResult[] = [];
    let totalComparisons = 0;
    let matchCount = 0;

    // Process in batches to avoid blocking the main thread
    for (let i = 0; i < inputValues.length; i += batchSize) {
      const batch = inputValues.slice(i, i + batchSize);

      // Process batch
      for (const inputValue of batch) {
        const result = this.performLookup(inputValue, referenceData, config);
        results.push(result);

        if (result.metrics) {
          totalComparisons += result.metrics.comparisons;
        }

        if (result.matched) {
          matchCount++;
        }
      }

      // Report progress
      if (config.onProgress) {
        const completed = Math.min(i + batchSize, inputValues.length);
        config.onProgress({
          completed,
          total: inputValues.length,
          percentage: (completed / inputValues.length) * 100,
        });
      }

      // Yield control to prevent blocking (in browser environment)
      if (typeof window !== "undefined" && i + batchSize < inputValues.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    const totalExecutionTime = performance.now() - startTime;
    const averageExecutionTime =
      inputValues.length > 0 ? totalExecutionTime / inputValues.length : 0;
    const matchRate =
      inputValues.length > 0 ? matchCount / inputValues.length : 0;
    const throughput =
      totalExecutionTime > 0
        ? inputValues.length / (totalExecutionTime / 1000)
        : 0; // ops per second

    return {
      results,
      metrics: {
        totalExecutionTime,
        averageExecutionTime,
        totalComparisons,
        matchRate,
        throughput,
      },
    };
  }

  /**
   * Calculate string similarity using the configured algorithm
   *
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score (0-1)
   */
  calculateSimilarity(str1: string, str2: string): number {
    return combinedSimilarity(str1, str2);
  }

  // Private matching methods

  private performExactMatch(
    inputValue: string,
    referenceData: Record<string, any>[],
    config: LookupConfig
  ): LookupResult {
    for (const row of referenceData) {
      const referenceValue = row[config.matchColumn];

      if (referenceValue != null && String(referenceValue) === inputValue) {
        return this.createSuccessResult(inputValue, row, config, 1.0, "exact");
      }
    }

    return this.createFailureResult(inputValue);
  }

  private performNormalizedMatch(
    inputValue: string,
    referenceData: Record<string, any>[],
    config: LookupConfig
  ): LookupResult {
    const normalizationOptions = {
      trim: config.normalization?.trimWhitespace !== false,
      lowercase: !config.normalization?.caseSensitive,
      removeAccents: config.normalization?.removeAccents !== false,
      collapseWhitespace: config.normalization?.collapseWhitespace !== false,
    };

    const normalizedInput = normalizeString(inputValue, normalizationOptions);

    for (const row of referenceData) {
      const referenceValue = row[config.matchColumn];

      if (referenceValue != null) {
        const normalizedReference = normalizeString(
          String(referenceValue),
          normalizationOptions
        );

        if (normalizedInput === normalizedReference) {
          return this.createSuccessResult(
            inputValue,
            row,
            config,
            0.95,
            "normalized"
          );
        }
      }
    }

    return this.createFailureResult(inputValue);
  }

  private performFuzzyMatch(
    inputValue: string,
    referenceData: Record<string, any>[],
    config: LookupConfig
  ): LookupResult {
    const threshold = config.smartMatching.confidence;
    const maxSuggestions = config.maxSuggestions || 3;

    // Extract candidate values for fuzzy matching
    const candidates = referenceData
      .map((row, index) => ({
        value: String(row[config.matchColumn] || ""),
        row,
        index,
      }))
      .filter(candidate => candidate.value.length > 0);

    const candidateStrings = candidates.map(c => c.value);

    // Find best matches using fuzzy algorithm
    const matches = findBestMatches(
      inputValue,
      candidateStrings,
      0.1,
      maxSuggestions + 5
    );

    const suggestions: LookupSuggestion[] = [];
    let bestMatch: { row: Record<string, any>; confidence: number } | null =
      null;

    for (const match of matches) {
      const candidate = candidates[match.index];
      const confidence = match.similarity;

      if (confidence >= threshold && !bestMatch) {
        bestMatch = { row: candidate.row, confidence };
      }

      if (suggestions.length < maxSuggestions) {
        suggestions.push({
          value: candidate.row[config.returnColumn],
          confidence,
          reason: this.generateSuggestionReason(
            confidence,
            inputValue,
            match.value
          ),
          sourceRow: candidate.row,
        });
      }
    }

    if (bestMatch) {
      return {
        ...this.createSuccessResult(
          inputValue,
          bestMatch.row,
          config,
          bestMatch.confidence,
          "fuzzy"
        ),
        suggestions: suggestions.slice(1), // Don't include the matched result in suggestions
      };
    }

    return {
      ...this.createFailureResult(inputValue),
      suggestions,
    };
  }

  private createSuccessResult(
    inputValue: string,
    matchedRow: Record<string, any>,
    config: LookupConfig,
    confidence: number,
    matchType: "exact" | "normalized" | "fuzzy"
  ): LookupResult {
    const matchedValue = matchedRow[config.returnColumn];
    const derivedValues: Record<string, any> = {};

    // Extract derived values
    if (config.derivedFields) {
      for (const derivedField of config.derivedFields) {
        const value = matchedRow[derivedField.source];
        if (value !== undefined) {
          derivedValues[derivedField.name] = value;
        }
      }
    }

    return {
      inputValue,
      matched: true,
      confidence,
      matchType,
      matchedValue,
      derivedValues,
      matchedRow,
    };
  }

  private createFailureResult(inputValue: string): LookupResult {
    return {
      inputValue,
      matched: false,
      confidence: 0,
      matchType: "none",
      matchedValue: null,
      derivedValues: {},
    };
  }

  private generateSuggestionReason(
    confidence: number,
    input: string,
    suggestion: string
  ): string {
    if (confidence >= 0.9) {
      return "Very similar spelling";
    } else if (confidence >= 0.8) {
      return "Similar spelling";
    } else if (confidence >= 0.7) {
      return "Possible match";
    } else if (
      normalizeString(input, { lowercase: true }) ===
      normalizeString(suggestion, { lowercase: true })
    ) {
      return "Case difference";
    } else if (normalizeString(input) === normalizeString(suggestion)) {
      return "Spacing or punctuation difference";
    } else {
      return "Partial match";
    }
  }
}

/**
 * Create a lookup configuration from a LookupField
 *
 * @param lookupField Lookup field configuration
 * @returns Lookup configuration for the matching engine
 */
export function createLookupConfig(lookupField: LookupField): LookupConfig {
  return {
    matchColumn: lookupField.match.on,
    returnColumn: lookupField.match.get,
    displayColumn: lookupField.match.show,
    derivedFields: lookupField.alsoGet,
    smartMatching: lookupField.smartMatching,
    onMismatch: lookupField.onMismatch,
    normalization: {
      caseSensitive: false,
      trimWhitespace: true,
      removeAccents: true,
      collapseWhitespace: true,
    },
    maxSuggestions: 3,
  };
}

/**
 * Singleton instance of the matching engine
 */
export const lookupMatchingEngine = new LookupMatchingEngine();
