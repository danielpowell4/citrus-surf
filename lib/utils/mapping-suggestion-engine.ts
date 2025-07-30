/**
 * Mapping Suggestion Engine
 * 
 * Provides intelligent column mapping suggestions with priority-based matching:
 * 1. Exact match
 * 2. snake_case conversion
 * 3. camelCase conversion
 * 4. Fuzzy match (Levenshtein distance)
 */

import type { TargetField } from "@/lib/types/target-shapes";
import { generateFieldVariations as generateFieldVariationsFromTokens, generateColumnVariations as generateColumnVariationsFromTokens } from "./token-builders";

interface MappingSuggestion {
  targetFieldId: string;
  sourceColumn: string;
  confidence: number; // 0-1, higher is better
  matchType: 'exact' | 'snake_case' | 'camel_case' | 'fuzzy';
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator  // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}



/**
 * Generate all possible variations of a field name for matching
 * Uses the new abstract token builder system
 */
function generateFieldVariations(fieldName: string, fieldId: string, fieldType?: FieldType): Set<string> {
  return generateFieldVariationsFromTokens(fieldName, fieldId, fieldType);
}

/**
 * Generate all possible variations of a column name for matching
 * Uses the new abstract token builder system
 */
function generateColumnVariations(columnName: string): Set<string> {
  return generateColumnVariationsFromTokens(columnName);
}

/**
 * Find the best match for a target field among import columns using priority-based matching
 */
function findBestMatch(
  targetField: TargetField,
  importColumns: string[],
  usedColumns: Set<string>
): MappingSuggestion | null {
  const fieldVariations = generateFieldVariations(targetField.name, targetField.id, targetField.type);
  
  // Priority 1: Exact match
  for (const column of importColumns) {
    if (usedColumns.has(column)) continue;
    
    const columnVariations = generateColumnVariations(column);
    
    // Check if any field variation exactly matches any column variation
    for (const fieldVar of fieldVariations) {
      for (const colVar of columnVariations) {
        if (fieldVar === colVar) {
          return {
            targetFieldId: targetField.id,
            sourceColumn: column,
            confidence: 1.0,
            matchType: 'exact'
          };
        }
      }
    }
  }
  
  // Priority 2 & 3: Case conversion matches (snake_case and camelCase)
  // These are now handled by the token builder system which generates all variations
  // We check for high-confidence matches that aren't exact
  for (const column of importColumns) {
    if (usedColumns.has(column)) continue;
    
    const columnVariations = generateColumnVariations(column);
    
    // Check for high-confidence case conversion matches
    for (const fieldVar of fieldVariations) {
      for (const colVar of columnVariations) {
        if (fieldVar === colVar && fieldVar !== targetField.name.toLowerCase() && fieldVar !== targetField.id.toLowerCase()) {
          // Determine match type based on the variation characteristics
          let matchType: 'snake_case' | 'camel_case' = 'snake_case';
          let confidence = 0.9;
          
          if (colVar.includes('_')) {
            matchType = 'snake_case';
            confidence = 0.9;
          } else if (/[a-z][A-Z]/.test(column)) {
            matchType = 'camel_case';
            confidence = 0.8;
          }
          
          return {
            targetFieldId: targetField.id,
            sourceColumn: column,
            confidence,
            matchType
          };
        }
      }
    }
  }
  
  // Priority 4: Fuzzy match (Levenshtein distance)
  let bestFuzzyMatch: MappingSuggestion | null = null;
  const fuzzyThreshold = 0.5; // Minimum confidence for fuzzy matches
  
  for (const column of importColumns) {
    if (usedColumns.has(column)) continue;
    
    // Calculate fuzzy match confidence for all variations
    let bestConfidence = 0;
    
    for (const fieldVar of fieldVariations) {
      for (const colVar of generateColumnVariations(column)) {
        const distance = levenshteinDistance(fieldVar, colVar);
        const maxLength = Math.max(fieldVar.length, colVar.length);
        const similarity = maxLength > 0 ? 1 - (distance / maxLength) : 0;
        
        if (similarity > bestConfidence) {
          bestConfidence = similarity;
        }
      }
    }
    
    // Only consider fuzzy matches above the threshold
    if (bestConfidence >= fuzzyThreshold) {
      const suggestion: MappingSuggestion = {
        targetFieldId: targetField.id,
        sourceColumn: column,
        confidence: bestConfidence * 0.7, // Scale fuzzy matches to max 0.7
        matchType: 'fuzzy'
      };
      
      if (!bestFuzzyMatch || suggestion.confidence > bestFuzzyMatch.confidence) {
        bestFuzzyMatch = suggestion;
      }
    }
  }
  
  return bestFuzzyMatch;
}

/**
 * Generate mapping suggestions for all target fields
 */
export function generateMappingSuggestions(
  importColumns: string[],
  targetFields: TargetField[]
): Record<string, string> {
  const suggestions: MappingSuggestion[] = [];
  const usedColumns = new Set<string>();
  
  // Sort target fields by priority (required fields first)
  const sortedFields = [...targetFields].sort((a, b) => {
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return 0;
  });
  
  // Find best match for each target field
  for (const targetField of sortedFields) {
    const match = findBestMatch(targetField, importColumns, usedColumns);
    if (match) {
      suggestions.push(match);
      usedColumns.add(match.sourceColumn);
    }
  }
  
  // Convert to the expected format: targetFieldId -> sourceColumn
  const mapping: Record<string, string> = {};
  for (const suggestion of suggestions) {
    mapping[suggestion.targetFieldId] = suggestion.sourceColumn;
  }
  
  return mapping;
}

/**
 * Get detailed suggestions with confidence scores (useful for debugging/UI)
 */
export function getDetailedMappingSuggestions(
  importColumns: string[],
  targetFields: TargetField[]
): MappingSuggestion[] {
  const suggestions: MappingSuggestion[] = [];
  const usedColumns = new Set<string>();
  
  // Sort target fields by priority (required fields first)
  const sortedFields = [...targetFields].sort((a, b) => {
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return 0;
  });
  
  // Find best match for each target field
  for (const targetField of sortedFields) {
    const match = findBestMatch(targetField, importColumns, usedColumns);
    if (match) {
      suggestions.push(match);
      usedColumns.add(match.sourceColumn);
    }
  }
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Utility functions for testing and debugging
 */
export const testUtils = {
  levenshteinDistance,
  generateFieldVariations,
  generateColumnVariations,
  findBestMatch,
};