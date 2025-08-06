/**
 * Tests for Lookup Matching Engine
 * 
 * Comprehensive test suite for the core lookup matching functionality including
 * exact, normalized, and fuzzy matching with performance testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LookupMatchingEngine,
  LookupConfig,
  BatchLookupConfig,
  createLookupConfig,
} from './lookup-matching-engine';
import type { LookupField, DerivedField } from '../types/target-shapes';

describe('LookupMatchingEngine', () => {
  let engine: LookupMatchingEngine;
  let sampleReferenceData: Record<string, any>[];
  let basicConfig: LookupConfig;

  beforeEach(() => {
    engine = new LookupMatchingEngine();
    
    // Sample reference data for testing
    sampleReferenceData = [
      { id: 1, name: 'Engineering', department: 'Engineering', manager: 'John Smith', budget: 1000000 },
      { id: 2, name: 'Marketing', department: 'Marketing', manager: 'Jane Doe', budget: 500000 },
      { id: 3, name: 'Human Resources', department: 'HR', manager: 'Bob Wilson', budget: 300000 },
      { id: 4, name: 'Finance', department: 'Finance', manager: 'Alice Brown', budget: 750000 },
      { id: 5, name: 'Operations', department: 'Ops', manager: 'Charlie Davis', budget: 400000 },
    ];

    basicConfig = {
      matchColumn: 'name',
      returnColumn: 'department',
      smartMatching: {
        enabled: true,
        confidence: 0.7,
      },
      onMismatch: 'null' as const,
      maxSuggestions: 3,
    };
  });

  describe('Constructor and Basic Setup', () => {
    it('should create a new instance', () => {
      expect(engine).toBeInstanceOf(LookupMatchingEngine);
    });

    it('should have public methods', () => {
      expect(typeof engine.performLookup).toBe('function');
      expect(typeof engine.batchLookup).toBe('function');
      expect(typeof engine.calculateSimilarity).toBe('function');
    });
  });

  describe('Exact Matching', () => {
    it('should find exact matches', () => {
      const result = engine.performLookup('Engineering', sampleReferenceData, basicConfig);

      expect(result.matched).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.matchType).toBe('exact');
      expect(result.matchedValue).toBe('Engineering');
      expect(result.inputValue).toBe('Engineering');
      expect(result.matchedRow).toEqual(sampleReferenceData[0]);
    });

    it('should handle case-sensitive exact matches', () => {
      const result = engine.performLookup('engineering', sampleReferenceData, basicConfig);

      // Should not match exactly due to case difference
      expect(result.matchType).not.toBe('exact');
    });

    it('should return performance metrics', () => {
      const result = engine.performLookup('Engineering', sampleReferenceData, basicConfig);

      expect(result.metrics).toBeDefined();
      expect(result.metrics!.executionTime).toBeGreaterThan(0);
      expect(result.metrics!.comparisons).toBeGreaterThan(0);
    });
  });

  describe('Normalized Matching', () => {
    it('should find normalized matches with case differences', () => {
      const result = engine.performLookup('engineering', sampleReferenceData, basicConfig);

      expect(result.matched).toBe(true);
      expect(result.confidence).toBe(0.95);
      expect(result.matchType).toBe('normalized');
      expect(result.matchedValue).toBe('Engineering');
    });

    it('should find normalized matches with whitespace differences', () => {
      const result = engine.performLookup('  Engineering  ', sampleReferenceData, basicConfig);

      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('normalized');
      expect(result.matchedValue).toBe('Engineering');
    });

    it('should handle accent normalization', () => {
      const dataWithAccents = [
        { name: 'Café Management', department: 'Food Service' },
      ];
      
      const result = engine.performLookup('Cafe Management', dataWithAccents, basicConfig);

      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('normalized');
      expect(result.matchedValue).toBe('Food Service');
    });
  });

  describe('Fuzzy Matching', () => {
    it('should find fuzzy matches for typos', () => {
      const result = engine.performLookup('Enginering', sampleReferenceData, basicConfig); // Missing 'e'

      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('fuzzy');
      expect(result.matchedValue).toBe('Engineering');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should respect confidence threshold', () => {
      const highThresholdConfig = {
        ...basicConfig,
        smartMatching: { enabled: true, confidence: 0.95 },
      };

      const result = engine.performLookup('Enginering', sampleReferenceData, highThresholdConfig);

      // Should not meet high confidence threshold
      expect(result.matched).toBe(false);
      expect(result.matchType).toBe('none');
    });

    it('should return suggestions for fuzzy matches', () => {
      const result = engine.performLookup('Marketting', sampleReferenceData, basicConfig);

      expect(result.matched).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      
      const suggestion = result.suggestions![0];
      expect(suggestion).toHaveProperty('value');
      expect(suggestion).toHaveProperty('confidence');
      expect(suggestion).toHaveProperty('reason');
    });

    it('should limit suggestions to maxSuggestions', () => {
      const limitedConfig = {
        ...basicConfig,
        maxSuggestions: 2,
      };

      const result = engine.performLookup('Eng', sampleReferenceData, limitedConfig);

      if (result.suggestions) {
        expect(result.suggestions.length).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('Derived Fields', () => {
    it('should extract derived values when match is found', () => {
      const derivedFields: DerivedField[] = [
        { name: 'manager_name', source: 'manager' },
        { name: 'budget_amount', source: 'budget' },
      ];

      const configWithDerived = {
        ...basicConfig,
        derivedFields,
      };

      const result = engine.performLookup('Engineering', sampleReferenceData, configWithDerived);

      expect(result.matched).toBe(true);
      expect(result.derivedValues).toEqual({
        manager_name: 'John Smith',
        budget_amount: 1000000,
      });
    });

    it('should handle missing derived field sources', () => {
      const derivedFields: DerivedField[] = [
        { name: 'nonexistent', source: 'does_not_exist' },
        { name: 'manager_name', source: 'manager' },
      ];

      const configWithDerived = {
        ...basicConfig,
        derivedFields,
      };

      const result = engine.performLookup('Engineering', sampleReferenceData, configWithDerived);

      expect(result.matched).toBe(true);
      expect(result.derivedValues).toEqual({
        manager_name: 'John Smith',
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined input values', () => {
      const result1 = engine.performLookup(null as any, sampleReferenceData, basicConfig);
      const result2 = engine.performLookup(undefined as any, sampleReferenceData, basicConfig);
      const result3 = engine.performLookup('', sampleReferenceData, basicConfig);

      [result1, result2, result3].forEach(result => {
        expect(result.matched).toBe(false);
        expect(result.matchType).toBe('none');
        expect(result.confidence).toBe(0);
        expect(result.matchedValue).toBeNull();
      });
    });

    it('should handle empty reference data', () => {
      const result = engine.performLookup('Engineering', [], basicConfig);

      expect(result.matched).toBe(false);
      expect(result.matchType).toBe('none');
      expect(result.confidence).toBe(0);
      expect(result.matchedValue).toBeNull();
    });

    it('should handle null reference data', () => {
      const result = engine.performLookup('Engineering', null as any, basicConfig);

      expect(result.matched).toBe(false);
      expect(result.matchType).toBe('none');
    });

    it('should validate required configuration', () => {
      const invalidConfig = {
        ...basicConfig,
        matchColumn: '',
      };

      expect(() => {
        engine.performLookup('Engineering', sampleReferenceData, invalidConfig);
      }).toThrow('matchColumn and returnColumn are required');
    });

    it('should handle reference data with null values', () => {
      const dataWithNulls = [
        { name: null, department: 'Unknown' },
        { name: 'Engineering', department: 'Engineering' },
      ];

      const result = engine.performLookup('Engineering', dataWithNulls, basicConfig);

      expect(result.matched).toBe(true);
      expect(result.matchedValue).toBe('Engineering');
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple inputs at once', async () => {
      const inputs = ['Engineering', 'Marketing', 'Unknown Department'];
      const { results, metrics } = await engine.batchLookup(inputs, sampleReferenceData, basicConfig);

      expect(results).toHaveLength(3);
      expect(results[0].matched).toBe(true);
      expect(results[1].matched).toBe(true);
      expect(results[2].matched).toBe(false);

      expect(metrics.totalExecutionTime).toBeGreaterThan(0);
      expect(metrics.matchRate).toBeCloseTo(2/3, 2);
      expect(metrics.throughput).toBeGreaterThan(0);
    });

    it('should handle batch processing with progress callback', async () => {
      const inputs = Array.from({ length: 100 }, (_, i) => `Test${i}`);
      const progressUpdates: any[] = [];

      const batchConfig: BatchLookupConfig = {
        ...basicConfig,
        batchSize: 25,
        onProgress: (progress) => {
          progressUpdates.push(progress);
        },
      };

      await engine.batchLookup(inputs, sampleReferenceData, batchConfig);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    });

    it('should handle empty input array', async () => {
      const { results, metrics } = await engine.batchLookup([], sampleReferenceData, basicConfig);

      expect(results).toHaveLength(0);
      expect(metrics.matchRate).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large reference datasets efficiently', () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item${i}`,
        category: `Category${i % 100}`,
      }));

      const config = {
        matchColumn: 'name',
        returnColumn: 'category',
        smartMatching: { enabled: false, confidence: 0.7 },
        onMismatch: 'null' as const,
      };

      const startTime = performance.now();
      const result = engine.performLookup('Item5000', largeDataset, config);
      const endTime = performance.now();

      expect(result.matched).toBe(true);
      expect(result.matchedValue).toBe('Category0');
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should batch process large inputs efficiently', async () => {
      const inputs = Array.from({ length: 1000 }, (_, i) => `Engineering${i % 10}`);
      
      const startTime = performance.now();
      const { results, metrics } = await engine.batchLookup(inputs, sampleReferenceData, {
        ...basicConfig,
        batchSize: 100,
      });
      const endTime = performance.now();

      expect(results).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(metrics.throughput).toBeGreaterThan(100); // At least 100 ops/second
    });
  });

  describe('Configuration Options', () => {
    it('should handle different normalization options', () => {
      const customConfig = {
        ...basicConfig,
        normalization: {
          caseSensitive: true,
          trimWhitespace: false,
          removeAccents: false,
          collapseWhitespace: false,
        },
      };

      const result1 = engine.performLookup('engineering', sampleReferenceData, customConfig);
      const result2 = engine.performLookup('  Engineering  ', sampleReferenceData, customConfig);

      // Should not normalize case with caseSensitive: true
      expect(result1.matchType).toBe('fuzzy'); // Will fall back to fuzzy matching
      
      // Should not normalize whitespace with trimWhitespace: false
      expect(result2.matchType).toBe('fuzzy'); // Will fall back to fuzzy matching
    });

    it('should disable fuzzy matching when smartMatching is disabled', () => {
      const noFuzzyConfig = {
        ...basicConfig,
        smartMatching: { enabled: false, confidence: 0.7 },
      };

      const result = engine.performLookup('Enginering', sampleReferenceData, noFuzzyConfig);

      expect(result.matched).toBe(false);
      expect(result.matchType).toBe('none');
      expect(result.suggestions).toBeUndefined();
    });
  });

  describe('String Similarity Calculation', () => {
    it('should calculate similarity between strings', () => {
      const similarity1 = engine.calculateSimilarity('hello', 'hello');
      const similarity2 = engine.calculateSimilarity('hello', 'helo');
      const similarity3 = engine.calculateSimilarity('hello', 'world');

      expect(similarity1).toBe(1);
      expect(similarity2).toBeGreaterThan(0.5);
      expect(similarity3).toBeLessThan(0.5);
    });
  });

  describe('createLookupConfig Helper', () => {
    it('should create config from LookupField', () => {
      const lookupField: LookupField = {
        id: 'test-field',
        name: 'Test Field',
        type: 'lookup',
        required: false,
        referenceFile: 'departments.csv',
        match: {
          on: 'name',
          get: 'department',
          show: 'display_name',
        },
        alsoGet: [
          { name: 'manager', source: 'manager_name' },
        ],
        smartMatching: {
          enabled: true,
          confidence: 0.8,
        },
        onMismatch: 'warning',
        showReferenceInfo: true,
        allowReferenceEdit: false,
      };

      const config = createLookupConfig(lookupField);

      expect(config.matchColumn).toBe('name');
      expect(config.returnColumn).toBe('department');
      expect(config.displayColumn).toBe('display_name');
      expect(config.derivedFields).toEqual([{ name: 'manager', source: 'manager_name' }]);
      expect(config.smartMatching.enabled).toBe(true);
      expect(config.smartMatching.confidence).toBe(0.8);
      expect(config.onMismatch).toBe('warning');
      expect(config.maxSuggestions).toBe(3);
    });

    it('should set default values for optional properties', () => {
      const minimalLookupField: LookupField = {
        id: 'test-field',
        name: 'Test Field',
        type: 'lookup',
        required: false,
        referenceFile: 'test.csv',
        match: {
          on: 'id',
          get: 'value',
        },
        smartMatching: {
          enabled: false,
          confidence: 0.5,
        },
        onMismatch: 'null',
      };

      const config = createLookupConfig(minimalLookupField);

      expect(config.displayColumn).toBeUndefined();
      expect(config.derivedFields).toBeUndefined();
      expect(config.normalization).toBeDefined();
      expect(config.normalization!.caseSensitive).toBe(false);
      expect(config.normalization!.trimWhitespace).toBe(true);
    });
  });

  describe('Real-world Integration Tests', () => {
    it('should handle department lookup with fuzzy matching', () => {
      const departments = [
        { code: 'ENG', name: 'Engineering', head: 'John Smith' },
        { code: 'MKT', name: 'Marketing', head: 'Jane Doe' },
        { code: 'HR', name: 'Human Resources', head: 'Bob Wilson' },
      ];

      const config = {
        matchColumn: 'name',
        returnColumn: 'code',
        derivedFields: [{ name: 'department_head', source: 'head' }],
        smartMatching: { enabled: true, confidence: 0.6 },
        onMismatch: 'null' as const,
      };

      // Test exact match
      const exactResult = engine.performLookup('Engineering', departments, config);
      expect(exactResult.matched).toBe(true);
      expect(exactResult.matchedValue).toBe('ENG');
      expect(exactResult.derivedValues.department_head).toBe('John Smith');

      // Test fuzzy match
      const fuzzyResult = engine.performLookup('Enginering', departments, config);
      expect(fuzzyResult.matched).toBe(true);
      expect(fuzzyResult.matchedValue).toBe('ENG');
      expect(fuzzyResult.matchType).toBe('fuzzy');
    });

    it('should handle product catalog lookup', () => {
      const products = [
        { sku: 'LAPTOP-001', name: 'MacBook Pro 16-inch', price: 2499 },
        { sku: 'PHONE-001', name: 'iPhone 15 Pro Max', price: 1199 },
        { sku: 'TABLET-001', name: 'iPad Air', price: 599 },
      ];

      const config = {
        matchColumn: 'name',
        returnColumn: 'sku',
        derivedFields: [{ name: 'product_price', source: 'price' }],
        smartMatching: { enabled: true, confidence: 0.7 },
        onMismatch: 'null' as const,
      };

      const result = engine.performLookup('macbook pro 16', products, config);
      expect(result.matched).toBe(true);
      expect(result.matchedValue).toBe('LAPTOP-001');
      expect(result.derivedValues.product_price).toBe(2499);
    });
  });
});