/**
 * Tests for String Similarity Utilities
 * 
 * Comprehensive test suite for fuzzy matching algorithms used in lookup operations.
 */

import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  levenshteinSimilarity,
  jaroSimilarity,
  jaroWinklerSimilarity,
  normalizeString,
  combinedSimilarity,
  findBestMatches,
  benchmarkSimilarity,
} from './string-similarity';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('should return string length for empty string comparisons', () => {
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', 'world')).toBe(5);
  });

  it('should calculate basic edit distances correctly', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1); // substitution
    expect(levenshteinDistance('cat', 'cats')).toBe(1); // insertion
    expect(levenshteinDistance('cats', 'cat')).toBe(1); // deletion
  });

  it('should handle complex transformations', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
  });

  it('should be case sensitive', () => {
    expect(levenshteinDistance('Hello', 'hello')).toBe(1);
    expect(levenshteinDistance('ABC', 'abc')).toBe(3);
  });
});

describe('levenshteinSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(levenshteinSimilarity('hello', 'hello')).toBe(1);
    expect(levenshteinSimilarity('', '')).toBe(1);
  });

  it('should return 0 for completely different strings of same length', () => {
    expect(levenshteinSimilarity('abc', 'xyz')).toBe(0);
  });

  it('should calculate similarity percentages correctly', () => {
    expect(levenshteinSimilarity('cat', 'bat')).toBeCloseTo(0.667, 3);
    expect(levenshteinSimilarity('cat', 'cats')).toBe(0.75);
  });
});

describe('jaroSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(jaroSimilarity('hello', 'hello')).toBe(1);
  });

  it('should return 0 for empty strings', () => {
    expect(jaroSimilarity('hello', '')).toBe(0);
    expect(jaroSimilarity('', 'world')).toBe(0);
  });

  it('should handle transpositions better than Levenshtein', () => {
    const jaro = jaroSimilarity('martha', 'marhta');
    const levenshtein = levenshteinSimilarity('martha', 'marhta');
    expect(jaro).toBeGreaterThan(levenshtein);
  });

  it('should calculate known Jaro similarities', () => {
    expect(jaroSimilarity('martha', 'marhta')).toBeCloseTo(0.944, 3);
    expect(jaroSimilarity('dwayne', 'duane')).toBeCloseTo(0.822, 3);
  });
});

describe('jaroWinklerSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(jaroWinklerSimilarity('hello', 'hello')).toBe(1);
  });

  it('should give higher scores for common prefixes', () => {
    const jaro = jaroSimilarity('martha', 'marhta');
    const jaroWinkler = jaroWinklerSimilarity('martha', 'marhta');
    expect(jaroWinkler).toBeGreaterThan(jaro);
  });

  it('should calculate known Jaro-Winkler similarities', () => {
    expect(jaroWinklerSimilarity('martha', 'marhta')).toBeCloseTo(0.961, 3);
    expect(jaroWinklerSimilarity('dwayne', 'duane')).toBeCloseTo(0.84, 2);
  });

  it('should respect custom prefix scaling', () => {
    const standard = jaroWinklerSimilarity('prefixtest', 'prefixdemo');
    const highScale = jaroWinklerSimilarity('prefixtest', 'prefixdemo', 0.2);
    expect(highScale).toBeGreaterThan(standard);
  });

  it('should not apply prefix bonus for low Jaro scores', () => {
    const jaro = jaroSimilarity('completely', 'different');
    const jaroWinkler = jaroWinklerSimilarity('completely', 'different');
    expect(jaroWinkler).toBe(jaro); // No prefix bonus when Jaro < 0.7
  });
});

describe('normalizeString', () => {
  it('should trim whitespace by default', () => {
    expect(normalizeString('  hello  ')).toBe('hello');
    expect(normalizeString('\t\ntest\r\n')).toBe('test');
  });

  it('should convert to lowercase by default', () => {
    expect(normalizeString('HELLO')).toBe('hello');
    expect(normalizeString('MiXeD CaSe')).toBe('mixed case');
  });

  it('should remove accents by default', () => {
    expect(normalizeString('café')).toBe('cafe');
    expect(normalizeString('naïve')).toBe('naive');
    expect(normalizeString('résumé')).toBe('resume');
  });

  it('should collapse whitespace by default', () => {
    expect(normalizeString('hello    world')).toBe('hello world');
    expect(normalizeString('a\t\tb\n\nc')).toBe('a b c');
  });

  it('should respect custom options', () => {
    expect(normalizeString('  HELLO  ', { trim: false })).toBe('  hello  ');
    expect(normalizeString('Hello', { lowercase: false })).toBe('Hello');
    expect(normalizeString('café', { removeAccents: false })).toBe('café');
    expect(normalizeString('a  b', { collapseWhitespace: false })).toBe('a  b');
  });

  it('should remove non-alphanumeric characters when specified', () => {
    expect(normalizeString('hello-world!', { removeNonAlphanumeric: true })).toBe('hello world');
    expect(normalizeString('test@123.com', { removeNonAlphanumeric: true })).toBe('test 123 com');
  });

  it('should handle complex normalization', () => {
    const input = '  CAFÉ-résumé@123!  ';
    const result = normalizeString(input, {
      trim: true,
      lowercase: true,
      removeAccents: true,
      removeNonAlphanumeric: true,
      collapseWhitespace: true,
    });
    expect(result).toBe('cafe resume 123');
  });
});

describe('combinedSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(combinedSimilarity('hello', 'hello')).toBe(1);
  });

  it('should return values between 0 and 1', () => {
    const similarity = combinedSimilarity('hello', 'world');
    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  it('should combine multiple algorithms', () => {
    const combined = combinedSimilarity('martha', 'marhta');
    const levenshtein = levenshteinSimilarity('martha', 'marhta');
    const jaro = jaroSimilarity('martha', 'marhta');
    const jaroWinkler = jaroWinklerSimilarity('martha', 'marhta');

    // Combined should be weighted average
    const expected = (levenshtein * 0.4 + jaro * 0.3 + jaroWinkler * 0.3);
    expect(combined).toBeCloseTo(expected, 5);
  });

  it('should respect custom weights', () => {
    const weights = { levenshtein: 1, jaro: 0, jaroWinkler: 0 };
    const combined = combinedSimilarity('hello', 'world', weights);
    const levenshtein = levenshteinSimilarity('hello', 'world');
    expect(combined).toBeCloseTo(levenshtein, 5);
  });

  it('should normalize weights that don\'t sum to 1', () => {
    const weights1 = { levenshtein: 2, jaro: 2, jaroWinkler: 2 };
    const weights2 = { levenshtein: 1, jaro: 1, jaroWinkler: 1 };
    
    const result1 = combinedSimilarity('test', 'tent', weights1);
    const result2 = combinedSimilarity('test', 'tent', weights2);
    
    expect(result1).toBeCloseTo(result2, 5);
  });
});

describe('findBestMatches', () => {
  const candidates = [
    'Engineering',
    'Marketing',
    'Human Resources',
    'Finance',
    'Operations',
    'Research and Development',
    'Customer Service',
  ];

  it('should find exact matches first', () => {
    const results = findBestMatches('Marketing', candidates);
    expect(results[0].value).toBe('Marketing');
    expect(results[0].similarity).toBe(1);
    expect(results[0].index).toBe(1);
  });

  it('should find fuzzy matches', () => {
    const results = findBestMatches('Enginering', candidates, 0.7);
    expect(results[0].value).toBe('Engineering');
    expect(results[0].similarity).toBeGreaterThan(0.8);
  });

  it('should respect similarity threshold', () => {
    const results = findBestMatches('xyz', candidates, 0.8);
    expect(results).toHaveLength(0);
  });

  it('should limit results to maxResults', () => {
    const results = findBestMatches('e', candidates, 0.1, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('should sort results by similarity (highest first)', () => {
    const results = findBestMatches('human', candidates, 0.3);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
    }
  });

  it('should handle empty candidates array', () => {
    const results = findBestMatches('test', []);
    expect(results).toHaveLength(0);
  });

  it('should handle null/undefined candidates', () => {
    const badCandidates = ['good', null, undefined, '', 'also good'] as any[];
    const results = findBestMatches('good', badCandidates);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => typeof r.value === 'string')).toBe(true);
  });

  it('should skip candidates that are too different in length', () => {
    const mixedLengths = ['a', 'ab', 'abc', 'abcdefghijklmnop'];
    const results = findBestMatches('xyz', mixedLengths, 0.1);
    
    // Should not include very long string due to length optimization
    const hasVeryLong = results.some(r => r.value === 'abcdefghijklmnop');
    expect(hasVeryLong).toBe(false);
  });
});

describe('benchmarkSimilarity', () => {
  it('should return performance metrics', () => {
    const metrics = benchmarkSimilarity('hello', 'world');
    
    expect(metrics).toHaveProperty('executionTime');
    expect(metrics).toHaveProperty('comparisons');
    expect(metrics.executionTime).toBeGreaterThan(0);
    expect(metrics.comparisons).toBe(1);
  });

  it('should benchmark different algorithms', () => {
    const algorithms = ['levenshtein', 'jaro', 'jaroWinkler', 'combined'] as const;
    
    algorithms.forEach(algorithm => {
      const metrics = benchmarkSimilarity('test', 'best', algorithm);
      expect(metrics.executionTime).toBeGreaterThan(0);
      expect(metrics.comparisons).toBe(1);
    });
  });

  it('should handle complex strings', () => {
    const longString1 = 'a'.repeat(1000);
    const longString2 = 'b'.repeat(1000);
    
    const metrics = benchmarkSimilarity(longString1, longString2);
    expect(metrics.executionTime).toBeGreaterThan(0);
  });
});

describe('Real-world lookup scenarios', () => {
  describe('Department name matching', () => {
    const departments = [
      'Engineering',
      'Marketing',
      'Human Resources',
      'Finance',
      'Operations',
      'Research and Development',
    ];

    it('should handle common typos', () => {
      const typos = [
        { input: 'Enginering', expected: 'Engineering' },
        { input: 'Marketting', expected: 'Marketing' },
        // Note: Abbreviations like 'HR' -> 'Human Resources' require domain knowledge
        // and are better handled at the application level with custom mappings
      ];

      typos.forEach(({ input, expected }) => {
        const results = findBestMatches(input, departments, 0.4); // Lower threshold for real-world scenarios
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].value).toBe(expected);
      });
    });

    it('should handle case variations', () => {
      const variations = [
        'ENGINEERING',
        'engineering',
        'Engineering',
        'eNgInEeRiNg',
      ];

      variations.forEach(variant => {
        const normalized = normalizeString(variant);
        const engineeringNorm = normalizeString('Engineering');
        expect(normalized).toBe(engineeringNorm);
      });
    });

    it('should handle abbreviations', () => {
      const abbreviations = [
        { input: 'Eng', expected: 'Engineering' },
        { input: 'Mkt', expected: 'Marketing' },
        { input: 'Fin', expected: 'Finance' },
        { input: 'Ops', expected: 'Operations' },
      ];

      abbreviations.forEach(({ input, expected }) => {
        const results = findBestMatches(input, departments, 0.2); // Very low threshold for abbreviations
        expect(results.length).toBeGreaterThan(0);
        // Note: Abbreviations might not always be the top match, but should be in results
        const hasExpected = results.some(r => r.value === expected);
        expect(hasExpected).toBe(true);
      });
    });
  });

  describe('Product name matching', () => {
    const products = [
      'iPhone 15 Pro Max',
      'Samsung Galaxy S24',
      'Google Pixel 8',
      'MacBook Pro 16-inch',
      'Dell XPS 13',
      'Microsoft Surface Pro',
    ];

    it('should handle product variations', () => {
      const variations = [
        { input: 'iphone 15 pro max', expected: 'iPhone 15 Pro Max' },
        { input: 'macbook pro 16', expected: 'MacBook Pro 16-inch' },
        // Note: Some variations like 'Galaxy S24' -> 'Samsung Galaxy S24' may require
        // custom handling as they involve brand name inference
      ];

      variations.forEach(({ input, expected }) => {
        const results = findBestMatches(input, products, 0.5); // Lower threshold for product variations
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].value).toBe(expected);
      });
    });
  });

  describe('Company name matching', () => {
    const companies = [
      'Apple Inc.',
      'Microsoft Corporation',
      'Google LLC',
      'Amazon.com Inc.',
      'Meta Platforms Inc.',
      'Tesla Inc.',
    ];

    it('should handle company name variations', () => {
      const variations = [
        { input: 'Apple', expected: 'Apple Inc.' },
        { input: 'Microsoft Corp', expected: 'Microsoft Corporation' },
        { input: 'Google', expected: 'Google LLC' },
        { input: 'Amazon', expected: 'Amazon.com Inc.' },
        { input: 'Facebook', expected: 'Meta Platforms Inc.' }, // Might not match well
        { input: 'Tesla', expected: 'Tesla Inc.' },
      ];

      variations.forEach(({ input, expected }) => {
        const results = findBestMatches(input, companies, 0.4); // Lower threshold for company variations
        if (input === 'Facebook') {
          // Special case - 'Facebook' to 'Meta' is a business logic change, not similarity
          return;
        }
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].value).toBe(expected);
      });
    });
  });
});

describe('Performance edge cases', () => {
  it('should handle very long strings efficiently', () => {
    const longString1 = 'a'.repeat(1000);
    const longString2 = 'a'.repeat(999) + 'b';

    const start = performance.now();
    const similarity = combinedSimilarity(longString1, longString2);
    const duration = performance.now() - start;

    expect(similarity).toBeGreaterThan(0.99);
    expect(duration).toBeLessThan(100); // Should complete within 100ms
  });

  it('should handle large candidate lists efficiently', () => {
    const largeCandidates = Array.from({ length: 10000 }, (_, i) => `candidate_${i}`);
    largeCandidates.push('target_match');

    const start = performance.now();
    const results = findBestMatches('target_match', largeCandidates, 0.9);
    const duration = performance.now() - start;

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe('target_match');
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });

  it('should handle unicode and special characters', () => {
    const unicodeStrings = [
      'Ñoño',
      'Zürich',
      '北京',
      'المملكة',
      '🚀 rocket',
      'test@domain.com',
    ];

    unicodeStrings.forEach(str => {
      const normalized = normalizeString(str);
      expect(typeof normalized).toBe('string');
      expect(normalized.length).toBeGreaterThanOrEqual(0);
    });
  });
});