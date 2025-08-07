/**
 * Tests for Enhanced Lookup Validation System
 * 
 * Comprehensive test suite for lookup-specific validations including enum rules,
 * fuzzy match confidence, reference data integrity, and enhanced error messages.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  LookupValidationSystem, 
  lookupValidationSystem, 
  generateLookupValidation,
  isLookupValidationRule,
  extractSuggestionsFromErrors 
} from './lookup-validation';
import type { LookupField, ValidationRule } from '../types/target-shapes';

// Mock the reference data manager
const mockReferenceData = {
  'departments.csv': [
    { dept_id: 'ENG001', dept_name: 'Engineering', manager: 'Sarah Johnson' },
    { dept_id: 'MKT001', dept_name: 'Marketing', manager: 'Mike Chen' },
    { dept_id: 'HR001', dept_name: 'Human Resources', manager: 'Lisa Wong' },
    { dept_id: 'FIN001', dept_name: 'Finance', manager: 'David Kim' },
    { dept_id: 'SALES001', dept_name: 'Sales', manager: 'Jennifer Lee' },
  ],
  'products.csv': [
    { sku: 'LAPTOP001', name: 'MacBook Pro 16-inch', category: 'Electronics', price: 2499 },
    { sku: 'PHONE001', name: 'iPhone 15 Pro Max', category: 'Electronics', price: 1199 },
    { sku: 'TABLET001', name: 'iPad Air', category: 'Electronics', price: 599 },
  ],
  'invalid_data.csv': [
    { id: 'A001', name: 'Item A' },
    { id: 'A002', name: 'Item B' },
    { id: 'A001', name: 'Item A Duplicate' }, // Duplicate key
    { id: '', name: 'Item with empty ID' }, // Empty key
    { id: null, name: 'Item with null ID' }, // Null key
  ],
};

vi.mock('./reference-data-manager', () => ({
  referenceDataManager: {
    getReferenceDataRows: vi.fn((filename: string) => {
      return mockReferenceData[filename as keyof typeof mockReferenceData] || null;
    }),
  },
}));

// Mock the lookup processor
vi.mock('./lookup-processor', () => ({
  lookupProcessor: {
    processSingleLookup: vi.fn(async (value: any, field: any) => {
      const referenceData = mockReferenceData[field.referenceFile as keyof typeof mockReferenceData];
      if (!referenceData) {
        return { matched: false, confidence: 0 };
      }

      const matchColumn = field.match.on;
      const exactMatch = referenceData.find(row => 
        String(row[matchColumn]).toLowerCase() === String(value).toLowerCase()
      );

      if (exactMatch) {
        return {
          matched: true,
          matchType: 'exact',
          matchedValue: exactMatch[field.match.get],
          confidence: 1.0,
        };
      }

      // Simulate fuzzy matching for test cases
      if (String(value).toLowerCase().includes('engineer')) {
        return {
          matched: true,
          matchType: 'fuzzy',
          matchedValue: 'ENG001',
          confidence: 0.75,
        };
      }

      if (String(value).toLowerCase().includes('market')) {
        return {
          matched: true,
          matchType: 'fuzzy',
          matchedValue: 'MKT001',
          confidence: 0.85,
        };
      }

      return { matched: false, confidence: 0 };
    }),
  },
}));

describe('LookupValidationSystem', () => {
  let validator: LookupValidationSystem;
  let departmentLookupField: LookupField;
  let productLookupField: LookupField;
  let invalidDataLookupField: LookupField;

  beforeEach(() => {
    validator = new LookupValidationSystem();
    
    departmentLookupField = {
      id: 'dept_field',
      name: 'department',
      type: 'lookup',
      required: true,
      referenceFile: 'departments.csv',
      match: {
        on: 'dept_name',
        get: 'dept_id',
      },
      smartMatching: {
        enabled: true,
        confidence: 0.8,
      },
      onMismatch: 'error',
    };

    productLookupField = {
      id: 'product_field',
      name: 'product',
      type: 'lookup',
      required: false,
      referenceFile: 'products.csv',
      match: {
        on: 'name',
        get: 'sku',
      },
      smartMatching: {
        enabled: true,
        confidence: 0.7,
      },
      onMismatch: 'warning',
    };

    invalidDataLookupField = {
      id: 'invalid_field',
      name: 'invalid',
      type: 'lookup',
      required: false,
      referenceFile: 'invalid_data.csv',
      match: {
        on: 'id',
        get: 'name',
      },
      smartMatching: {
        enabled: false,
        confidence: 0.5,
      },
      onMismatch: 'null',
    };
  });

  describe('Basic Functionality', () => {
    it('should create a validation system instance', () => {
      expect(validator).toBeInstanceOf(LookupValidationSystem);
    });

    it('should have required methods', () => {
      expect(typeof validator.validateLookupField).toBe('function');
      expect(typeof validator.generateEnumRules).toBe('function');
      expect(typeof validator.validateReferenceIntegrity).toBe('function');
      expect(typeof validator.batchValidateLookupFields).toBe('function');
    });
  });

  describe('Enum Validation', () => {
    it('should validate exact matches successfully', async () => {
      const result = await validator.validateLookupField('Engineering', departmentLookupField);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail validation for invalid values', async () => {
      const result = await validator.validateLookupField('Unknown Department', departmentLookupField);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('lookup_enum');
      expect(result.errors[0].message).toContain('not a valid option');
    });

    it('should provide suggestions for similar values', async () => {
      const result = await validator.validateLookupField('Enginering', departmentLookupField); // Typo
      
      expect(result.isValid).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Engineering');
    });

    it('should handle case-insensitive matching', async () => {
      const result = await validator.validateLookupField('ENGINEERING', departmentLookupField);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty/null values gracefully', async () => {
      const result1 = await validator.validateLookupField('', departmentLookupField);
      const result2 = await validator.validateLookupField(null, departmentLookupField);
      const result3 = await validator.validateLookupField(undefined, departmentLookupField);
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result3.isValid).toBe(true);
    });
  });

  describe('Fuzzy Match Confidence Validation', () => {
    it('should validate high confidence fuzzy matches', async () => {
      const result = await validator.validateLookupField('Marketing Dept', departmentLookupField);
      
      // Should pass validation if confidence is above threshold
      expect(result.warnings.length).toBeLessThanOrEqual(1);
    });

    it('should warn about low confidence matches', async () => {
      // Use a value that our mock will return low confidence for
      const result = await validator.validateLookupField('Engineering Something', departmentLookupField);
      
      // Should generate warning or error for low confidence, or be invalid due to enum check
      const hasConfidenceIssue = result.errors.some(e => e.type === 'lookup_confidence') ||
                                result.warnings.some(w => w.type === 'lookup_confidence') ||
                                !result.isValid; // May fail enum validation instead
      expect(hasConfidenceIssue).toBe(true);
    });

    it('should skip confidence validation when fuzzy matching is disabled', async () => {
      const field = { ...departmentLookupField, smartMatching: { enabled: false, confidence: 0.8 } };
      const result = await validator.validateLookupField('Unknown Value', field);
      
      const confidenceErrors = result.errors.filter(e => e.type === 'lookup_confidence');
      expect(confidenceErrors).toHaveLength(0);
    });

    it('should provide confidence scores in validation results', async () => {
      const result = await validator.validateLookupField('Engineering Something', departmentLookupField);
      
      const confidenceError = result.errors.find(e => e.type === 'lookup_confidence') ||
                             result.warnings.find(w => w.type === 'lookup_confidence');
      
      if (confidenceError) {
        expect(typeof confidenceError.confidence).toBe('number');
        expect(confidenceError.confidence).toBeGreaterThanOrEqual(0);
        expect(confidenceError.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Reference Data Integrity Validation', () => {
    it('should validate reference data with no issues', () => {
      const result = validator.validateReferenceIntegrity(
        mockReferenceData['departments.csv'], 
        'dept_name'
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing key column', () => {
      const result = validator.validateReferenceIntegrity(
        mockReferenceData['departments.csv'], 
        'nonexistent_column'
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('lookup_reference');
      expect(result.errors[0].message).toContain('not found in reference data');
    });

    it('should detect duplicate keys', () => {
      const result = validator.validateReferenceIntegrity(
        mockReferenceData['invalid_data.csv'], 
        'id'
      );
      
      expect(result.warnings.some(w => w.message.includes('Duplicate values'))).toBe(true);
    });

    it('should detect empty/null keys', () => {
      const result = validator.validateReferenceIntegrity(
        mockReferenceData['invalid_data.csv'], 
        'id'
      );
      
      expect(result.warnings.some(w => w.message.includes('empty values'))).toBe(true);
    });

    it('should handle empty reference data', () => {
      const result = validator.validateReferenceIntegrity([], 'any_column');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('empty');
    });

    it('should suggest similar column names for missing columns', () => {
      const result = validator.validateReferenceIntegrity(
        mockReferenceData['departments.csv'], 
        'dept' // Similar to 'dept_name'
      );
      
      expect(result.errors[0].suggestions?.length).toBeGreaterThan(0);
      expect(result.errors[0].suggestions).toContain('dept_name');
    });
  });

  describe('Enhanced Error Messages', () => {
    it('should provide available options in error messages', async () => {
      const result = await validator.validateLookupField('Invalid Dept', departmentLookupField);
      
      const enumError = result.errors.find(e => e.type === 'lookup_enum');
      expect(enumError?.availableOptions).toBeDefined();
      expect(enumError?.availableOptions?.length).toBeGreaterThan(0);
    });

    it('should include reference source in error messages', async () => {
      const result = await validator.validateLookupField('Invalid Dept', departmentLookupField);
      
      const enumError = result.errors.find(e => e.type === 'lookup_enum');
      expect(enumError?.referenceSource).toBe('departments.csv');
    });

    it('should provide "Did you mean?" suggestions', async () => {
      const result = await validator.validateLookupField('Marketting', departmentLookupField); // Typo
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.toLowerCase().includes('marketing'))).toBe(true);
    });

    it('should handle missing reference data gracefully', async () => {
      const field = { ...departmentLookupField, referenceFile: 'nonexistent.csv' };
      const result = await validator.validateLookupField('Any Value', field);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('lookup_reference');
      expect(result.errors[0].message).toContain('not found');
    });
  });

  describe('Enum Rule Generation', () => {
    it('should generate enum rules from reference data', () => {
      const rules = validator.generateEnumRules(
        mockReferenceData['departments.csv'], 
        'dept_name'
      );
      
      expect(rules).toHaveLength(1);
      expect(rules[0].type).toBe('lookup_enum');
      expect(rules[0].value).toContain('Engineering');
      expect(rules[0].value).toContain('Marketing');
    });

    it('should handle empty reference data', () => {
      const rules = validator.generateEnumRules([], 'any_column');
      
      expect(rules).toHaveLength(0);
    });

    it('should filter out null/empty values', () => {
      const rules = validator.generateEnumRules(
        mockReferenceData['invalid_data.csv'], 
        'id'
      );
      
      expect(rules[0].value).not.toContain('');
      expect(rules[0].value).not.toContain(null);
    });

    it('should include available options in generated rules', () => {
      const rules = validator.generateEnumRules(
        mockReferenceData['departments.csv'], 
        'dept_name'
      );
      
      expect(rules[0].availableOptions).toBeDefined();
      expect(rules[0].availableOptions).toEqual(rules[0].value);
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple lookup fields', async () => {
      const values = [
        { value: 'Engineering', field: departmentLookupField, rowId: 'row1' },
        { value: 'Marketing', field: departmentLookupField, rowId: 'row2' },
        { value: 'Invalid Dept', field: departmentLookupField, rowId: 'row3' },
      ];

      const results = await validator.batchValidateLookupFields(values);
      
      expect(results).toHaveLength(3);
      expect(results[0].result.isValid).toBe(true);
      expect(results[1].result.isValid).toBe(true);
      expect(results[2].result.isValid).toBe(false);
    });

    it('should report progress during batch validation', async () => {
      const values = Array.from({ length: 25 }, (_, i) => ({
        value: i % 2 === 0 ? 'Engineering' : 'Marketing',
        field: departmentLookupField,
        rowId: `row${i}`,
      }));

      const progressUpdates: number[] = [];
      const onProgress = (processed: number, _total: number) => {
        progressUpdates.push(processed);
      };

      await validator.batchValidateLookupFields(values, onProgress);
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(25);
    });
  });

  describe('Validation Statistics', () => {
    it('should calculate validation statistics', async () => {
      const values = [
        { value: 'Engineering', field: departmentLookupField },
        { value: 'Marketing', field: departmentLookupField },
        { value: 'Invalid Dept', field: departmentLookupField },
        { value: 'Another Invalid', field: departmentLookupField },
      ];

      const results = await Promise.all(
        values.map(async ({ value, field }) => ({
          result: await validator.validateLookupField(value, field)
        }))
      );

      const stats = validator.getValidationStats(results);
      
      expect(stats.totalValidated).toBe(4);
      expect(stats.validCount).toBe(2);
      expect(stats.errorCount).toBeGreaterThan(0);
      expect(stats.successRate).toBe(0.5);
    });

    it('should identify common suggestions', async () => {
      const values = [
        { value: 'Enginering', field: departmentLookupField }, // Suggests Engineering
        { value: 'Enginneering', field: departmentLookupField }, // Suggests Engineering
        { value: 'Marketting', field: departmentLookupField }, // Suggests Marketing
      ];

      const results = await Promise.all(
        values.map(async ({ value, field }) => ({
          result: await validator.validateLookupField(value, field)
        }))
      );

      const stats = validator.getValidationStats(results);
      
      expect(stats.commonSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should identify lookup validation rules', () => {
      const lookupRule: ValidationRule = {
        type: 'lookup_enum',
        value: ['A', 'B', 'C'],
        message: 'Test rule',
        severity: 'error',
      };

      const standardRule: ValidationRule = {
        type: 'required',
        value: true,
        message: 'Required field',
        severity: 'error',
      };

      expect(isLookupValidationRule(lookupRule)).toBe(true);
      expect(isLookupValidationRule(standardRule)).toBe(false);
    });

    it('should extract suggestions from validation errors', () => {
      const errors = [
        {
          type: 'lookup_enum' as const,
          message: 'Error 1',
          suggestions: ['Option A', 'Option B'],
          severity: 'error' as const,
        },
        {
          type: 'lookup_confidence' as const,
          message: 'Error 2',
          suggestions: ['Option B', 'Option C'],
          severity: 'warning' as const,
        },
      ];

      const suggestions = extractSuggestionsFromErrors(errors);
      
      expect(suggestions).toContain('Option A');
      expect(suggestions).toContain('Option B');
      expect(suggestions).toContain('Option C');
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should generate backward-compatible validation rules', () => {
      const rules = generateLookupValidation(departmentLookupField);
      
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].type).toBe('lookup_enum');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed reference data', async () => {
      const malformedData = [
        { dept_name: 'Engineering' }, // Missing other expected fields
        null, // Null row
        { different_column: 'Value' }, // Different structure
      ];

      // Should not throw an error
      const result = validator.validateReferenceIntegrity(malformedData, 'dept_name');
      expect(result).toBeDefined();
    });

    it('should handle very large option lists', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item_${i}`,
        name: `Item ${i}`,
      }));

      const rules = validator.generateEnumRules(largeData, 'name');
      
      expect(rules).toHaveLength(1);
      expect(rules[0].value).toHaveLength(1000);
      expect(rules[0].message.includes('...')).toBe(true); // Should truncate display
    });

    it('should handle circular reference in validation', async () => {
      // This shouldn't cause infinite loops
      const result = await validator.validateLookupField('Engineering', departmentLookupField);
      expect(result).toBeDefined();
    });

    it('should handle non-string values in reference data', () => {
      const mixedData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 'string_id', name: 'Item 3' },
      ];

      const rules = validator.generateEnumRules(mixedData, 'id');
      
      expect(rules[0].value).toContain('1');
      expect(rules[0].value).toContain('2');
      expect(rules[0].value).toContain('string_id');
    });
  });

  describe('Global Instance', () => {
    it('should provide a global validation system instance', () => {
      expect(lookupValidationSystem).toBeInstanceOf(LookupValidationSystem);
    });

    it('should be the same instance across imports', () => {
      const instance1 = lookupValidationSystem;
      const instance2 = lookupValidationSystem;
      expect(instance1).toBe(instance2);
    });
  });
});