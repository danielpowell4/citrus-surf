import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReferenceDataManager } from './reference-data-manager';
import type { UploadReferenceOptions } from '../types/reference-data-types';
import { generateReferenceId, isValidReferenceId, ReferenceDataError } from '../types/reference-data-types';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  },
  length: 0,
  key: () => null,
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('ReferenceDataManager', () => {
  let manager: ReferenceDataManager;

  beforeEach(() => {
    // Clear mock storage
    mockLocalStorage.clear();
    manager = new ReferenceDataManager();
  });

  describe('File Upload and Parsing', () => {
    it('should upload and parse a CSV file with headers', async () => {
      const csvContent = 'name,age,department\nJohn,30,Engineering\nJane,25,Marketing';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const id = 'ref_employees_test';

      const info = await manager.uploadReferenceFile(file, id);

      expect(info.id).toBe(id);
      expect(info.filename).toBe('employees.csv');
      expect(info.rowCount).toBe(2);
      expect(info.columns).toEqual(['name', 'age', 'department']);
      expect(info.format).toBe('csv');

      const data = manager.getReferenceDataRows(id);
      expect(data).toEqual([
        { name: 'John', age: '30', department: 'Engineering' },
        { name: 'Jane', age: '25', department: 'Marketing' },
      ]);
    });

    it('should upload and parse a JSON file', async () => {
      const jsonContent = JSON.stringify([
        { id: 1, name: 'Engineering', code: 'ENG' },
        { id: 2, name: 'Marketing', code: 'MKT' },
      ]);
      const file = new File([jsonContent], 'departments.json', { type: 'application/json' });
      const id = 'ref_departments_test';

      const info = await manager.uploadReferenceFile(file, id);

      expect(info.id).toBe(id);
      expect(info.filename).toBe('departments.json');
      expect(info.rowCount).toBe(2);
      expect(info.columns).toEqual(['id', 'name', 'code']);
      expect(info.format).toBe('json');

      const data = manager.getReferenceDataRows(id);
      expect(data).toEqual([
        { id: 1, name: 'Engineering', code: 'ENG' },
        { id: 2, name: 'Marketing', code: 'MKT' },
      ]);
    });

    it('should handle CSV with tab delimiter', async () => {
      const csvContent = 'name\tage\tdepartment\nJohn\t30\tEngineering\nJane\t25\tMarketing';
      const file = new File([csvContent], 'employees.tsv', { type: 'text/tab-separated-values' });
      const id = 'ref_employees_tsv';

      const info = await manager.uploadReferenceFile(file, id);

      expect(info.format).toBe('csv');
      expect(info.metadata?.delimiter).toBe('\t');

      const data = manager.getReferenceDataRows(id);
      expect(data).toEqual([
        { name: 'John', age: '30', department: 'Engineering' },
        { name: 'Jane', age: '25', department: 'Marketing' },
      ]);
    });

    it('should handle CSV with quoted fields', async () => {
      const csvContent = '"name","age","description"\n"John Doe","30","Senior Engineer, Team Lead"\n"Jane Smith","25","Marketing Manager"';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const id = 'ref_employees_quoted';

      await manager.uploadReferenceFile(file, id);

      const data = manager.getReferenceDataRows(id);
      expect(data).toEqual([
        { name: 'John Doe', age: '30', description: 'Senior Engineer, Team Lead' },
        { name: 'Jane Smith', age: '25', description: 'Marketing Manager' },
      ]);
    });

    it('should handle CSV without headers', async () => {
      const csvContent = 'John,30,Engineering\nJane,25,Marketing';
      const file = new File([csvContent], 'data.csv', { type: 'text/csv' });
      const id = 'ref_no_headers';
      const options: UploadReferenceOptions = { hasHeaders: false };

      await manager.uploadReferenceFile(file, id, options);

      const data = manager.getReferenceDataRows(id);
      expect(data).toEqual([
        { col1: 'John', col2: '30', col3: 'Engineering' },
        { col1: 'Jane', col2: '25', col3: 'Marketing' },
      ]);
    });

    it('should reject duplicate IDs without overwrite option', async () => {
      const csvContent = 'name,age\nJohn,30';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const id = 'ref_duplicate_test';

      // First upload should succeed
      await manager.uploadReferenceFile(file, id);

      // Second upload should fail
      await expect(
        manager.uploadReferenceFile(file, id)
      ).rejects.toThrow('already exists');
    });

    it('should allow overwrite with overwrite option', async () => {
      const csvContent1 = 'name,age\nJohn,30';
      const csvContent2 = 'name,age,department\nJane,25,Marketing';
      const file1 = new File([csvContent1], 'test1.csv', { type: 'text/csv' });
      const file2 = new File([csvContent2], 'test2.csv', { type: 'text/csv' });
      const id = 'ref_overwrite_test';

      // First upload
      await manager.uploadReferenceFile(file1, id);
      expect(manager.getReferenceDataRows(id)).toHaveLength(1);

      // Second upload with overwrite
      await manager.uploadReferenceFile(file2, id, { overwrite: true });
      const data = manager.getReferenceDataRows(id);
      expect(data).toHaveLength(1);
      expect(data![0]).toEqual({ name: 'Jane', age: '25', department: 'Marketing' });
    });
  });

  describe('Data Validation', () => {
    it('should validate JSON files correctly', async () => {
      const validJson = JSON.stringify([{ name: 'John', age: 30 }]);
      const file = new File([validJson], 'valid.json', { type: 'application/json' });

      const result = await manager.validateReferenceData(file);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('json');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid JSON', async () => {
      const invalidJson = '{ name: "John", age: 30 }'; // Missing quotes around key
      const file = new File([invalidJson], 'invalid.json', { type: 'application/json' });

      const result = await manager.validateReferenceData(file);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid JSON'))).toBe(true);
    });

    it('should validate CSV files correctly', async () => {
      const validCsv = 'name,age\nJohn,30\nJane,25';
      const file = new File([validCsv], 'valid.csv', { type: 'text/csv' });

      const result = await manager.validateReferenceData(file);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.delimiter).toBe(',');
      expect(result.hasHeaders).toBe(true);
    });

    it('should detect empty files', async () => {
      const emptyFile = new File([''], 'empty.csv', { type: 'text/csv' });

      const result = await manager.validateReferenceData(emptyFile);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('empty'))).toBe(true);
    });

    it('should warn about large files', async () => {
      // Create content that's actually large enough (>10MB)
      const largeContent = 'name,age,department,description\n' + 'John,30,Engineering,Very long description that makes the file large\n'.repeat(200000);
      const largeFile = new File([largeContent], 'large.csv', { type: 'text/csv' });

      const result = await manager.validateReferenceData(largeFile);

      expect(result.warnings.some(warning => warning.includes('Large file size'))).toBe(true);
    });

    it('should reject files that are too large', async () => {
      // Mock a file that's too large
      const hugeMockFile = {
        name: 'huge.csv',
        size: 60 * 1024 * 1024, // 60MB
        type: 'text/csv',
      } as File;

      // Mock the readFileContent method to avoid actually reading the huge file
      const originalMethod = manager['readFileContent'];
      manager['readFileContent'] = vi.fn().mockResolvedValue('name,age\nJohn,30');

      const result = await manager.validateReferenceData(hugeMockFile);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('exceeds maximum'))).toBe(true);

      // Restore original method
      manager['readFileContent'] = originalMethod;
    });
  });

  describe('Data Retrieval and Management', () => {
    beforeEach(async () => {
      // Set up test data
      const csvContent = 'name,age,department\nJohn,30,Engineering\nJane,25,Marketing';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      await manager.uploadReferenceFile(file, 'ref_test_employees');
    });

    it('should list all reference files', () => {
      const files = manager.listReferenceFiles();

      expect(files).toHaveLength(1);
      expect(files[0].id).toBe('ref_test_employees');
      expect(files[0].filename).toBe('employees.csv');
      expect(files[0].rowCount).toBe(2);
    });

    it('should check if reference data exists', () => {
      expect(manager.hasReferenceData('ref_test_employees')).toBe(true);
      expect(manager.hasReferenceData('nonexistent')).toBe(false);
    });

    it('should get reference data with metadata', () => {
      const data = manager.getReferenceData('ref_test_employees');

      expect(data).toBeTruthy();
      expect(data!.info.id).toBe('ref_test_employees');
      expect(data!.data).toHaveLength(2);
    });

    it('should get only data rows', () => {
      const rows = manager.getReferenceDataRows('ref_test_employees');

      expect(rows).toHaveLength(2);
      expect(rows![0]).toEqual({ name: 'John', age: '30', department: 'Engineering' });
    });

    it('should delete reference files', () => {
      expect(manager.hasReferenceData('ref_test_employees')).toBe(true);

      const deleted = manager.deleteReferenceFile('ref_test_employees');

      expect(deleted).toBe(true);
      expect(manager.hasReferenceData('ref_test_employees')).toBe(false);
      expect(manager.listReferenceFiles()).toHaveLength(0);
    });

    it('should update existing reference data', async () => {
      const newData = [
        { name: 'Updated John', age: '31', department: 'Engineering' },
        { name: 'Updated Jane', age: '26', department: 'Marketing' },
        { name: 'New Bob', age: '35', department: 'Sales' },
      ];

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = manager.updateReferenceData('ref_test_employees', newData);

      expect(updated).toBe(true);

      const data = manager.getReferenceDataRows('ref_test_employees');
      expect(data).toHaveLength(3);
      expect(data![0].name).toBe('Updated John');
      expect(data![2].name).toBe('New Bob');

      // Check that metadata was updated
      const info = manager.getReferenceData('ref_test_employees')!.info;
      expect(info.rowCount).toBe(3);
      expect(info.lastModified).not.toBe(info.uploadedAt);
    });

    it('should get statistics', () => {
      const stats = manager.getStats();

      expect(stats.totalFiles).toBe(1);
      expect(stats.totalRows).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.fileStats).toHaveLength(1);
      expect(stats.fileStats[0].id).toBe('ref_test_employees');
    });

    it('should clear all reference data', () => {
      expect(manager.listReferenceFiles()).toHaveLength(1);

      manager.clearAll();

      expect(manager.listReferenceFiles()).toHaveLength(0);
      expect(manager.hasReferenceData('ref_test_employees')).toBe(false);
    });
  });

  describe('Import and Export', () => {
    beforeEach(async () => {
      // Set up test data
      const csvContent = 'name,age\nJohn,30\nJane,25';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      await manager.uploadReferenceFile(file, 'ref_export_test');
    });

    it('should export reference data', () => {
      const exported = manager.exportReferenceData();

      expect(Object.keys(exported)).toHaveLength(1);
      expect(exported['ref_export_test']).toBeTruthy();
      expect(exported['ref_export_test'].info.id).toBe('ref_export_test');
      expect(exported['ref_export_test'].data).toHaveLength(2);
    });

    it('should import reference data', () => {
      // Clear existing data
      manager.clearAll();
      expect(manager.listReferenceFiles()).toHaveLength(0);

      // Import data
      const importData = {
        'ref_imported': {
          info: {
            id: 'ref_imported',
            filename: 'imported.csv',
            rowCount: 1,
            columns: ['name', 'value'],
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            fileSize: 100,
            format: 'csv' as const,
          },
          data: [{ name: 'test', value: 'imported' }],
        },
      };

      manager.importReferenceData(importData);

      expect(manager.listReferenceFiles()).toHaveLength(1);
      expect(manager.hasReferenceData('ref_imported')).toBe(true);
      
      const data = manager.getReferenceDataRows('ref_imported');
      expect(data).toEqual([{ name: 'test', value: 'imported' }]);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing reference data gracefully', () => {
      expect(manager.getReferenceData('nonexistent')).toBeNull();
      expect(manager.getReferenceDataRows('nonexistent')).toBeNull();
      expect(manager.updateReferenceData('nonexistent', [])).toBe(false);
      expect(manager.deleteReferenceFile('nonexistent')).toBe(false);
    });

    it('should handle malformed CSV gracefully', async () => {
      const malformedCsv = 'name,age\n"unclosed quote,30\nJane,25';
      const file = new File([malformedCsv], 'malformed.csv', { type: 'text/csv' });

      // Should still parse as best as possible
      const info = await manager.uploadReferenceFile(file, 'ref_malformed');
      expect(info).toBeTruthy();
      
      const data = manager.getReferenceDataRows('ref_malformed');
      expect(data).toBeTruthy();
    });
  });
});

describe('Reference Data Utilities', () => {
  describe('generateReferenceId', () => {
    it('should generate valid reference IDs', () => {
      const id1 = generateReferenceId();
      const id2 = generateReferenceId('test');
      const id3 = generateReferenceId('departments');

      expect(isValidReferenceId(id1)).toBe(true);
      expect(isValidReferenceId(id2)).toBe(true);
      expect(isValidReferenceId(id3)).toBe(true);

      expect(id1).toMatch(/^ref_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/);
      expect(id2).toMatch(/^ref_test_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/);
      expect(id3).toMatch(/^ref_departments_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateReferenceId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('isValidReferenceId', () => {
    it('should validate reference ID format', () => {
      // Valid IDs
      expect(isValidReferenceId('ref_abc123_def456')).toBe(true);
      expect(isValidReferenceId('ref_test_abc123_def456')).toBe(true);
      expect(isValidReferenceId('ref_departments_123_456')).toBe(true);

      // Invalid IDs
      expect(isValidReferenceId('ref_abc123')).toBe(false); // Missing second part
      expect(isValidReferenceId('abc123_def456')).toBe(false); // Missing ref prefix
      expect(isValidReferenceId('ref__abc123_def456')).toBe(false); // Empty middle part
      expect(isValidReferenceId('ref_abc-123_def456')).toBe(false); // Invalid characters
      expect(isValidReferenceId('')).toBe(false); // Empty string
    });
  });
});