/**
 * String Similarity Utilities
 * 
 * High-performance string similarity algorithms for fuzzy matching in lookup operations.
 * Includes Levenshtein distance, Jaro-Winkler similarity, and optimized normalization.
 */

/**
 * Calculate Levenshtein distance between two strings
 * Uses dynamic programming with space optimization
 * 
 * @param str1 First string
 * @param str2 Second string 
 * @returns Number of single-character edits (insertions, deletions, substitutions)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  if (str1 === str2) return 0;
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  // Use two rows instead of full matrix for space optimization
  let previousRow = Array(str2.length + 1).fill(0).map((_, i) => i);
  let currentRow = Array(str2.length + 1).fill(0);

  for (let i = 1; i <= str1.length; i++) {
    currentRow[0] = i;
    
    for (let j = 1; j <= str2.length; j++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      currentRow[j] = Math.min(
        previousRow[j] + 1,     // deletion
        currentRow[j - 1] + 1,  // insertion
        previousRow[j - 1] + substitutionCost  // substitution
      );
    }
    
    // Swap rows
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[str2.length];
}

/**
 * Calculate Levenshtein similarity as a percentage (0-1)
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score from 0 (no similarity) to 1 (identical)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 && str2.length === 0) return 1;
  
  const maxLength = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1, str2);
  
  return (maxLength - distance) / maxLength;
}

/**
 * Calculate Jaro similarity between two strings
 * More suitable for comparing names and words with transpositions
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Jaro similarity score from 0 to 1
 */
export function jaroSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  if (matchWindow < 0) return 0;

  const str1Matches = Array(str1.length).fill(false);
  const str2Matches = Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    
    while (!str2Matches[k]) k++;
    
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  return (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
}

/**
 * Calculate Jaro-Winkler similarity (Jaro with prefix bonus)
 * Gives higher scores to strings with common prefixes
 * 
 * @param str1 First string
 * @param str2 Second string
 * @param prefixScale Scaling factor for prefix bonus (default 0.1)
 * @returns Jaro-Winkler similarity score from 0 to 1
 */
export function jaroWinklerSimilarity(str1: string, str2: string, prefixScale: number = 0.1): number {
  const jaroScore = jaroSimilarity(str1, str2);
  
  if (jaroScore < 0.7) return jaroScore;
  
  // Calculate common prefix length (up to 4 characters)
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
  
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }
  
  return jaroScore + (prefixLength * prefixScale * (1 - jaroScore));
}

/**
 * Normalize string for better matching
 * Handles common variations that should be considered equivalent
 * 
 * @param str Input string
 * @param options Normalization options
 * @returns Normalized string
 */
export function normalizeString(
  str: string,
  options: {
    trim?: boolean;
    lowercase?: boolean;
    removeAccents?: boolean;
    removeNonAlphanumeric?: boolean;
    collapseWhitespace?: boolean;
  } = {}
): string {
  const {
    trim = true,
    lowercase = true,
    removeAccents = true,
    removeNonAlphanumeric = false,
    collapseWhitespace = true,
  } = options;

  let normalized = str;

  // Convert to lowercase first (before other operations)
  if (lowercase) {
    normalized = normalized.toLowerCase();
  }

  // Remove accents and diacritics
  if (removeAccents) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Remove non-alphanumeric characters
  if (removeNonAlphanumeric) {
    // Replace non-alphanumeric characters with spaces to create word boundaries
    normalized = normalized.replace(/[^a-zA-Z0-9\s]/g, ' ');
  }

  // Collapse multiple whitespace into single space
  if (collapseWhitespace) {
    if (trim) {
      // Normal case: collapse and trim
      normalized = normalized.replace(/\s+/g, ' ').trim();
    } else {
      // When trim is false, preserve leading/trailing whitespace
      const leadingSpaces = normalized.match(/^\s*/)?.[0] || '';
      const trailingSpaces = normalized.match(/\s*$/)?.[0] || '';
      const content = normalized.trim();
      const collapsedContent = content.replace(/\s+/g, ' ');
      normalized = leadingSpaces + collapsedContent + trailingSpaces;
    }
  } else if (trim) {
    // Only trim if collapseWhitespace is false but trim is true
    normalized = normalized.trim();
  }

  return normalized;
}

/**
 * Calculate combined similarity score using multiple algorithms
 * Provides more robust matching by combining different approaches
 * 
 * @param str1 First string
 * @param str2 Second string
 * @param weights Algorithm weights (default: balanced)
 * @returns Combined similarity score from 0 to 1
 */
export function combinedSimilarity(
  str1: string,
  str2: string,
  weights: {
    levenshtein?: number;
    jaro?: number;
    jaroWinkler?: number;
  } = {}
): number {
  const {
    levenshtein = 0.4,
    jaro = 0.3,
    jaroWinkler = 0.3,
  } = weights;

  // Normalize weights to sum to 1
  const totalWeight = levenshtein + jaro + jaroWinkler;
  const normalizedWeights = {
    levenshtein: levenshtein / totalWeight,
    jaro: jaro / totalWeight,
    jaroWinkler: jaroWinkler / totalWeight,
  };

  const levenshteinScore = levenshteinSimilarity(str1, str2);
  const jaroScore = jaroSimilarity(str1, str2);
  const jaroWinklerScore = jaroWinklerSimilarity(str1, str2);

  return (
    levenshteinScore * normalizedWeights.levenshtein +
    jaroScore * normalizedWeights.jaro +
    jaroWinklerScore * normalizedWeights.jaroWinkler
  );
}

/**
 * Find best matches using fuzzy string matching
 * Optimized for performance with large datasets
 * 
 * @param target Target string to match
 * @param candidates Array of candidate strings
 * @param threshold Minimum similarity threshold (0-1)
 * @param maxResults Maximum number of results to return
 * @returns Array of matches sorted by similarity (highest first)
 */
export function findBestMatches(
  target: string,
  candidates: string[],
  threshold: number = 0.6,
  maxResults: number = 5
): Array<{ value: string; similarity: number; index: number }> {
  const normalizedTarget = normalizeString(target);
  const results: Array<{ value: string; similarity: number; index: number }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (!candidate || typeof candidate !== 'string') continue;

    const normalizedCandidate = normalizeString(candidate);
    
    // Quick exact match check first
    if (normalizedTarget === normalizedCandidate) {
      results.push({ value: candidate, similarity: 1, index: i });
      continue;
    }

    // Skip if too different in length (optimization) - but be more lenient for abbreviations
    const lengthRatio = Math.min(normalizedTarget.length, normalizedCandidate.length) / 
                       Math.max(normalizedTarget.length, normalizedCandidate.length);
    if (lengthRatio < 0.2) continue; // Skip if length difference is too large

    const similarity = combinedSimilarity(normalizedTarget, normalizedCandidate);
    
    if (similarity >= threshold) {
      results.push({ value: candidate, similarity, index: i });
    }
  }

  // Sort by similarity (highest first) and limit results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
}

/**
 * Performance metrics for similarity calculations
 */
export interface SimilarityMetrics {
  executionTime: number;
  comparisons: number;
  memoryUsage?: number;
}

/**
 * Benchmark similarity calculation performance
 * Useful for optimizing large dataset operations
 * 
 * @param str1 First string
 * @param str2 Second string
 * @param algorithm Algorithm to benchmark
 * @returns Performance metrics
 */
export function benchmarkSimilarity(
  str1: string,
  str2: string,
  algorithm: 'levenshtein' | 'jaro' | 'jaroWinkler' | 'combined' = 'combined'
): SimilarityMetrics {
  const startTime = performance.now();
  
  let result: number;
  switch (algorithm) {
    case 'levenshtein':
      result = levenshteinSimilarity(str1, str2);
      break;
    case 'jaro':
      result = jaroSimilarity(str1, str2);
      break;
    case 'jaroWinkler':
      result = jaroWinklerSimilarity(str1, str2);
      break;
    case 'combined':
    default:
      result = combinedSimilarity(str1, str2);
      break;
  }
  
  const endTime = performance.now();
  
  return {
    executionTime: endTime - startTime,
    comparisons: 1,
  };
}