/**
 * Enhanced Validation System for Lookup Fields
 *
 * Extends the validation system to handle lookup-specific validations including:
 * - Auto-generated enum rules from reference data
 * - Fuzzy match confidence scoring
 * - Reference data integrity validation
 * - Enhanced error messages with suggestions
 */

import { referenceDataManager } from "./reference-data-manager";
import { lookupProcessor } from "./lookup-processor";
import type { ValidationRule, LookupField } from "../types/target-shapes";

/**
 * Enhanced validation result with lookup-specific information
 */
export interface LookupValidationResult {
  isValid: boolean;
  errors: LookupValidationError[];
  warnings: LookupValidationError[];
  suggestions: string[];
}

/**
 * Enhanced validation error with lookup-specific details
 */
export interface LookupValidationError {
  type: "lookup_enum" | "lookup_confidence" | "lookup_reference" | "standard";
  message: string;
  suggestions?: string[];
  availableOptions?: string[];
  referenceSource?: string;
  confidence?: number;
  severity: "error" | "warning" | "info";
}

/**
 * Lookup validator interface
 */
export interface LookupValidator {
  validateLookupField(
    value: any,
    field: LookupField,
    referenceData: any[]
  ): LookupValidationResult;
  generateEnumRules(referenceData: any[], keyColumn: string): ValidationRule[];
  validateReferenceIntegrity(
    data: any[],
    keyColumn: string
  ): LookupValidationResult;
  validateConfidenceThreshold(
    value: any,
    field: LookupField
  ): Promise<LookupValidationResult>;
}

/**
 * Enhanced lookup validation system
 */
export class LookupValidationSystem implements LookupValidator {
  /**
   * Validate a lookup field value against all applicable rules
   */
  async validateLookupField(
    value: any,
    field: LookupField,
    referenceData?: any[]
  ): Promise<LookupValidationResult> {
    const errors: LookupValidationError[] = [];
    const warnings: LookupValidationError[] = [];
    const suggestions: string[] = [];

    // Get reference data if not provided
    const refData =
      referenceData ||
      referenceDataManager.getReferenceDataRows(field.referenceFile);

    if (!refData || refData.length === 0) {
      errors.push({
        type: "lookup_reference",
        message: `Reference data not found for ${field.referenceFile}`,
        referenceSource: field.referenceFile,
        severity: "error",
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    // Validate against enum rules (available options)
    const enumValidation = await this.validateEnumRule(value, field, refData);
    errors.push(...enumValidation.errors);
    warnings.push(...enumValidation.warnings);
    suggestions.push(...enumValidation.suggestions);

    // Validate confidence threshold if fuzzy matching is enabled
    if (field.smartMatching.enabled && value != null && value !== "") {
      const confidenceValidation = await this.validateConfidenceThreshold(
        value,
        field
      );
      errors.push(...confidenceValidation.errors);
      warnings.push(...confidenceValidation.warnings);
      suggestions.push(...confidenceValidation.suggestions);
    }

    // Validate reference data integrity
    const integrityValidation = this.validateReferenceIntegrity(
      refData,
      field.match.on
    );
    errors.push(...integrityValidation.errors);
    warnings.push(...integrityValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [...new Set(suggestions)], // Remove duplicates
    };
  }

  /**
   * Validate value against enum rules (exact match check)
   */
  private async validateEnumRule(
    value: any,
    field: LookupField,
    referenceData: any[]
  ): Promise<LookupValidationResult> {
    const errors: LookupValidationError[] = [];
    const warnings: LookupValidationError[] = [];
    const suggestions: string[] = [];

    if (value == null || value === "") {
      return { isValid: true, errors, warnings, suggestions };
    }

    // Get available options from reference data
    const availableOptions = [
      ...new Set(
        referenceData
          .map(row => row[field.match.on])
          .filter(val => val != null && val !== "")
          .map(val => String(val))
      ),
    ];

    const stringValue = String(value);
    const exactMatch = availableOptions.some(
      option => String(option).toLowerCase() === stringValue.toLowerCase()
    );

    if (!exactMatch) {
      // If no exact match, try to find similar options for suggestions
      const similarOptions = this.findSimilarOptions(
        stringValue,
        availableOptions,
        0.6
      );

      errors.push({
        type: "lookup_enum",
        message: `"${value}" is not a valid option${similarOptions.length > 0 ? ". Did you mean one of these?" : ""}`,
        suggestions: similarOptions.slice(0, 5),
        availableOptions: availableOptions.slice(0, 10), // Limit for UI display
        referenceSource: field.referenceFile,
        severity: "error",
      });

      suggestions.push(...similarOptions.slice(0, 3));
    }

    return { isValid: exactMatch, errors, warnings, suggestions };
  }

  /**
   * Validate confidence threshold for fuzzy matches
   */
  async validateConfidenceThreshold(
    value: any,
    field: LookupField
  ): Promise<LookupValidationResult> {
    const errors: LookupValidationError[] = [];
    const warnings: LookupValidationError[] = [];
    const suggestions: string[] = [];

    if (value == null || value === "") {
      return { isValid: true, errors, warnings, suggestions };
    }

    try {
      // Perform lookup to get confidence score
      const result = await lookupProcessor.processSingleLookup(
        value,
        field,
        "validation_row"
      );

      if (result.matched && result.matchType === "fuzzy") {
        const confidence = result.confidence;
        const threshold = field.smartMatching.confidence;

        if (confidence < threshold) {
          const severity = confidence < threshold - 0.2 ? "error" : "warning";
          const errorType = severity === "error" ? errors : warnings;

          errorType.push({
            type: "lookup_confidence",
            message: `Low confidence match (${Math.round(confidence * 100)}%). Suggested match: "${result.matchedValue}"`,
            confidence,
            suggestions: [String(result.matchedValue)],
            referenceSource: field.referenceFile,
            severity,
          });

          if (severity === "warning") {
            suggestions.push(String(result.matchedValue));
          }
        }
      }
    } catch (error) {
      // Don't fail validation if lookup processing fails
      console.warn("Confidence validation failed:", error);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Generate enum validation rules from reference data
   */
  generateEnumRules(referenceData: any[], keyColumn: string): ValidationRule[] {
    if (!referenceData || referenceData.length === 0) {
      return [];
    }

    const uniqueValues = [
      ...new Set(
        referenceData
          .map(row => row[keyColumn])
          .filter(val => val != null && val !== "")
          .map(val => String(val))
      ),
    ];

    if (uniqueValues.length === 0) {
      return [];
    }

    return [
      {
        type: "lookup_enum",
        value: uniqueValues,
        message: `Value must be one of: ${uniqueValues.slice(0, 5).join(", ")}${uniqueValues.length > 5 ? "..." : ""}`,
        severity: "error",
        availableOptions: uniqueValues,
      },
    ];
  }

  /**
   * Validate reference data integrity
   */
  validateReferenceIntegrity(
    data: any[],
    keyColumn: string
  ): LookupValidationResult {
    const errors: LookupValidationError[] = [];
    const warnings: LookupValidationError[] = [];
    const suggestions: string[] = [];

    if (!data || data.length === 0) {
      errors.push({
        type: "lookup_reference",
        message: "Reference data is empty",
        severity: "error",
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    // Check if key column exists (find first non-null row for sample)
    const sampleRow = data.find(row => row != null);
    if (!sampleRow || !sampleRow.hasOwnProperty(keyColumn)) {
      const availableColumns = sampleRow ? Object.keys(sampleRow) : [];
      errors.push({
        type: "lookup_reference",
        message: `Key column "${keyColumn}" not found in reference data`,
        suggestions: availableColumns.filter(
          key =>
            key.toLowerCase().includes(keyColumn.toLowerCase()) ||
            keyColumn.toLowerCase().includes(key.toLowerCase())
        ),
        severity: "error",
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    // Check for duplicate keys (handle null rows)
    const keyValues = data
      .filter(row => row != null) // Filter out null rows
      .map(row => row[keyColumn])
      .filter(val => val != null && val !== "");
    const uniqueKeys = new Set(keyValues.map(val => String(val).toLowerCase()));

    if (keyValues.length !== uniqueKeys.size) {
      const duplicates = this.findDuplicates(keyValues.map(val => String(val)));
      warnings.push({
        type: "lookup_reference",
        message: `Duplicate values found in key column "${keyColumn}": ${duplicates.slice(0, 3).join(", ")}${duplicates.length > 3 ? "..." : ""}`,
        severity: "warning",
      });
    }

    // Check for empty/null keys (handle null rows)
    const emptyKeys = data
      .filter(row => row != null)
      .filter(row => row[keyColumn] == null || row[keyColumn] === "").length;
    if (emptyKeys > 0) {
      warnings.push({
        type: "lookup_reference",
        message: `${emptyKeys} row(s) have empty values in key column "${keyColumn}"`,
        severity: "warning",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Find similar options using string similarity
   */
  private findSimilarOptions(
    input: string,
    options: string[],
    threshold: number = 0.6
  ): string[] {
    const inputLower = input.toLowerCase();
    const similar: Array<{ option: string; score: number }> = [];

    for (const option of options) {
      const optionLower = option.toLowerCase();

      // Simple similarity scoring
      let score = 0;

      // Exact match
      if (inputLower === optionLower) {
        score = 1;
      }
      // Starts with
      else if (
        optionLower.startsWith(inputLower) ||
        inputLower.startsWith(optionLower)
      ) {
        score = 0.8;
      }
      // Contains
      else if (
        optionLower.includes(inputLower) ||
        inputLower.includes(optionLower)
      ) {
        score = 0.7;
      }
      // Levenshtein-like scoring
      else {
        score = this.calculateSimilarity(inputLower, optionLower);
      }

      if (score >= threshold) {
        similar.push({ option, score });
      }
    }

    return similar.sort((a, b) => b.score - a.score).map(item => item.option);
  }

  /**
   * Simple similarity calculation
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find duplicate values in an array
   */
  private findDuplicates(arr: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const item of arr) {
      const lowerItem = item.toLowerCase();
      if (seen.has(lowerItem)) {
        duplicates.add(item);
      } else {
        seen.add(lowerItem);
      }
    }

    return Array.from(duplicates);
  }

  /**
   * Batch validate multiple lookup fields
   */
  async batchValidateLookupFields(
    values: Array<{ value: any; field: LookupField; rowId?: string }>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<Array<{ rowId?: string; result: LookupValidationResult }>> {
    const results = [];

    for (let i = 0; i < values.length; i++) {
      const { value, field, rowId } = values[i];

      if (onProgress && i % 10 === 0) {
        onProgress(i, values.length);
      }

      const result = await this.validateLookupField(value, field);
      results.push({ rowId, result });
    }

    if (onProgress) {
      onProgress(values.length, values.length);
    }

    return results;
  }

  /**
   * Get validation statistics for a dataset
   */
  getValidationStats(results: Array<{ result: LookupValidationResult }>): {
    totalValidated: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
    successRate: number;
    commonSuggestions: string[];
  } {
    const totalValidated = results.length;
    const validCount = results.filter(r => r.result.isValid).length;
    const errorCount = results.reduce(
      (sum, r) => sum + r.result.errors.length,
      0
    );
    const warningCount = results.reduce(
      (sum, r) => sum + r.result.warnings.length,
      0
    );

    // Collect all suggestions and find most common ones
    const allSuggestions = results.flatMap(r => r.result.suggestions);
    const suggestionCounts = allSuggestions.reduce(
      (acc, suggestion) => {
        acc[suggestion] = (acc[suggestion] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const commonSuggestions = Object.entries(suggestionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([suggestion]) => suggestion);

    return {
      totalValidated,
      validCount,
      errorCount,
      warningCount,
      successRate: totalValidated > 0 ? validCount / totalValidated : 0,
      commonSuggestions,
    };
  }
}

/**
 * Global lookup validation system instance
 */
export const lookupValidationSystem = new LookupValidationSystem();

/**
 * Enhanced validation function for lookup fields (backward compatibility)
 */
export function generateLookupValidation(field: LookupField): ValidationRule[] {
  try {
    const referenceData = referenceDataManager.getReferenceDataRows(
      field.referenceFile
    );
    if (!referenceData || referenceData.length === 0) {
      return [];
    }

    return lookupValidationSystem.generateEnumRules(
      referenceData,
      field.match.on
    );
  } catch (error) {
    console.warn(
      `Failed to generate validation for lookup field ${field.id}:`,
      error
    );
    return [];
  }
}

/**
 * Utility function to check if a validation rule is lookup-specific
 */
export function isLookupValidationRule(rule: ValidationRule): boolean {
  return ["lookup_enum", "lookup_confidence", "lookup_reference"].includes(
    rule.type
  );
}

/**
 * Utility function to extract suggestions from validation errors
 */
export function extractSuggestionsFromErrors(
  errors: LookupValidationError[]
): string[] {
  return errors
    .flatMap(error => error.suggestions || [])
    .filter((suggestion, index, array) => array.indexOf(suggestion) === index) // Remove duplicates
    .slice(0, 5); // Limit to top 5 suggestions
}
