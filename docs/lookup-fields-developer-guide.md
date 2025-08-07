# Lookup Fields Developer Guide

## Architecture Overview

The lookup fields system is built with a layered architecture that separates concerns and enables maintainability:

```
┌─────────────────────────────────────────────────────────┐
│                   UI Layer                              │
│  • Template Builder Integration                         │
│  • Lookup Editable Cells                              │
│  • Reference Data Viewer/Editor                        │
│  • Fuzzy Match Review UI                               │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                Business Logic Layer                     │
│  • Lookup Configuration Management                      │
│  • Data Processing Orchestration                       │
│  • Validation Rule Generation                          │
│  • Navigation & Workflow Management                     │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                Processing Engine Layer                  │
│  • Lookup Matching Engine                              │
│  • Data Processing Pipeline                             │
│  • String Similarity Algorithms                        │
│  • Batch Processing Manager                             │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                 Data Access Layer                       │
│  • Reference Data Manager                               │
│  • Target Shapes Storage                                │
│  • Redux State Management                               │
│  • Browser Storage Abstraction                         │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Lookup Matching Engine

**File**: `lib/utils/lookup-matching-engine.ts`

The core engine that performs exact, normalized, and fuzzy matching.

```typescript
import { LookupMatchingEngine } from '@/lib/utils/lookup-matching-engine';

// Initialize the engine
const engine = new LookupMatchingEngine();

// Configure lookup parameters
const config = {
  matchColumn: 'department_name',
  returnColumn: 'department_id',
  fuzzyThreshold: 0.8,
  normalizeValues: true
};

// Perform lookup
const result = engine.performLookup(inputValue, referenceData, config);

if (result.matched) {
  console.log(`Match: ${result.matchedValue} (${result.confidence})`);
  console.log(`Type: ${result.matchType}`); // 'exact' | 'normalized' | 'fuzzy'
}
```

**Key Methods**:
- `performLookup(value, referenceData, config)`: Main lookup operation
- `performBatchLookup(values, referenceData, config)`: Process multiple values efficiently
- `generateSuggestions(value, referenceData, config)`: Get ranked suggestions

### 2. Data Processing Pipeline

**File**: `lib/utils/lookup-processor.ts`

Integrates lookup operations with the Redux store and handles async processing.

```typescript
import { lookupProcessor } from '@/lib/utils/lookup-processor';

// Process single lookup with Redux integration
const result = await lookupProcessor.processSingleLookup(value, lookupField);

// Process entire dataset
const processedData = await lookupProcessor.processDataWithLookups(
  inputData,
  targetShape,
  {
    continueOnError: true,
    updateProgress: (progress) => console.log(`${progress}% complete`)
  }
);
```

**Features**:
- **Async Processing**: Handles large datasets without blocking UI
- **Progress Tracking**: Real-time progress updates for long-running operations
- **Error Collection**: Comprehensive error reporting and statistics
- **Redux Integration**: Automatic state updates and history tracking

### 3. Reference Data Manager

**File**: `lib/utils/reference-data-manager.ts`

Manages reference data storage, validation, and CRUD operations.

```typescript
import { referenceDataManager } from '@/lib/utils/reference-data-manager';

// Upload new reference data
const info = await referenceDataManager.uploadReferenceFile(file, {
  overwrite: false,
  validate: true
});

// Retrieve reference data
const data = referenceDataManager.getReferenceDataRows(referenceId);
const metadata = referenceDataManager.getReferenceData(referenceId);

// Update reference data
const success = await referenceDataManager.updateReferenceData(
  referenceId,
  newData
);
```

**Storage Format**:
```typescript
interface ReferenceData {
  info: ReferenceDataInfo;
  data: Record<string, unknown>[];
  index: Record<string, number>; // For fast lookups
}
```

### 4. Validation System

**File**: `lib/utils/lookup-validation.ts`

Provides enhanced validation specifically for lookup fields.

```typescript
import { 
  LookupValidationSystem,
  generateLookupValidation 
} from '@/lib/utils/lookup-validation';

// Create validation system
const validator = new LookupValidationSystem();

// Validate lookup field configuration
const result = validator.validateLookupField(value, lookupField, referenceData);

// Generate enum validation rules from reference data
const enumRules = generateLookupValidation(lookupField, referenceData);
```

**Validation Types**:
- **Enum Validation**: Ensures values exist in reference data
- **Confidence Validation**: Checks fuzzy match confidence scores
- **Reference Integrity**: Validates reference data structure and quality

## State Management

### Redux Store Structure

```typescript
interface LookupState {
  // Reference data management
  referenceData: {
    files: Record<string, ReferenceData>;
    isLoading: boolean;
    error: string | null;
  };

  // Processing state
  processing: {
    isProcessing: boolean;
    progress: number;
    currentOperation: string | null;
    errors: ProcessingError[];
  };

  // Fuzzy match review
  fuzzyMatches: {
    pendingMatches: FuzzyMatch[];
    reviewBatch: string | null;
    isReviewing: boolean;
  };
}
```

### Key Actions

```typescript
// Reference data actions
dispatch(uploadReferenceFileAsync(file));
dispatch(updateReferenceData({ id, data }));
dispatch(deleteReferenceData(id));

// Processing actions
dispatch(processDataWithLookups({ data, targetShape }));
dispatch(updateLookupValue({ rowId, fieldId, value }));

// Fuzzy match actions
dispatch(startFuzzyMatchReview(batchId));
dispatch(acceptFuzzyMatch({ matchId, approvedValue }));
dispatch(rejectFuzzyMatch(matchId));
```

### Middleware Integration

The system integrates with existing Redux middleware:

```typescript
// History tracking for undo/redo
const meaningfulActions = [
  'targetShapes/addLookupField',
  'targetShapes/updateLookupField',
  'table/processDataWithLookups/fulfilled',
  'lookup/acceptFuzzyMatch'
];

// Auto-persistence
const persistedSlices = [
  'referenceData',
  'targetShapes'  // includes lookup field configurations
];
```

## Extending the System

### Custom Matching Algorithms

Add new string similarity algorithms:

```typescript
// lib/utils/string-similarity.ts
export function customSimilarity(str1: string, str2: string): number {
  // Your custom algorithm here
  return similarityScore; // 0-1
}

// Register with the matching engine
import { LookupMatchingEngine } from '@/lib/utils/lookup-matching-engine';

LookupMatchingEngine.registerSimilarityFunction(
  'custom',
  customSimilarity
);
```

### Custom Field Types

Create specialized lookup field variants:

```typescript
interface GeographicLookupField extends LookupField {
  type: 'geographic_lookup';
  geocodingEnabled: boolean;
  defaultCountry?: string;
}

// Register the field type
import { registerFieldType } from '@/lib/types/field-registry';

registerFieldType('geographic_lookup', {
  component: GeographicLookupCell,
  validator: GeographicLookupValidator,
  processor: GeographicLookupProcessor
});
```

### Custom Validation Rules

Add domain-specific validation:

```typescript
import { ValidationRule } from '@/lib/types/target-shapes';

const customValidation: ValidationRule = {
  type: 'custom',
  value: {
    validator: (value: unknown, context: ValidationContext) => {
      // Your validation logic
      return {
        isValid: boolean,
        message?: string,
        suggestions?: string[]
      };
    }
  },
  message: 'Custom validation failed',
  severity: 'error'
};
```

## Performance Optimization

### Batch Processing

Process large datasets efficiently:

```typescript
// Process in chunks to avoid memory issues
const processInChunks = async (
  data: Record<string, unknown>[],
  chunkSize: number = 1000
) => {
  const results = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const processed = await lookupProcessor.processDataWithLookups(
      chunk,
      targetShape
    );
    results.push(...processed);
    
    // Yield control to prevent blocking UI
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
};
```

### Caching Strategies

Implement intelligent caching:

```typescript
class LookupCache {
  private exactMatches = new Map<string, LookupResult>();
  private fuzzyMatches = new Map<string, LookupResult[]>();
  
  getCachedExactMatch(value: string, configHash: string): LookupResult | null {
    return this.exactMatches.get(`${configHash}:${value}`) || null;
  }
  
  cacheExactMatch(value: string, configHash: string, result: LookupResult) {
    this.exactMatches.set(`${configHash}:${value}`, result);
  }
}

const lookupCache = new LookupCache();
```

### Memory Management

Monitor and optimize memory usage:

```typescript
// Monitor memory usage during processing
const memoryTracker = {
  startMemory: 0,
  checkMemory() {
    const usage = process.memoryUsage();
    console.log(`Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
  },
  
  startTracking() {
    this.startMemory = process.memoryUsage().heapUsed;
  },
  
  getIncrease() {
    const current = process.memoryUsage().heapUsed;
    return Math.round((current - this.startMemory) / 1024 / 1024);
  }
};
```

## Testing

### Unit Testing

Test core functionality in isolation:

```typescript
// lib/utils/lookup-matching-engine.test.ts
import { LookupMatchingEngine } from './lookup-matching-engine';

describe('LookupMatchingEngine', () => {
  let engine: LookupMatchingEngine;
  
  beforeEach(() => {
    engine = new LookupMatchingEngine();
  });
  
  it('should perform exact matches', () => {
    const result = engine.performLookup('Engineering', referenceData, config);
    
    expect(result.matched).toBe(true);
    expect(result.matchType).toBe('exact');
    expect(result.confidence).toBe(1.0);
  });
});
```

### Integration Testing

Test component interactions:

```typescript
// Test complete lookup workflow
describe('Lookup Integration', () => {
  it('should process data end-to-end', async () => {
    // Upload reference data
    await store.dispatch(uploadReferenceFileAsync(referenceFile));
    
    // Create target shape with lookup field
    const targetShape = createTargetShapeWithLookup();
    await store.dispatch(saveTargetShape(targetShape));
    
    // Process input data
    const result = await store.dispatch(
      processDataWithLookups({ data: inputData, targetShape })
    );
    
    expect(result.payload.processedData).toHaveLength(inputData.length);
    expect(result.payload.errors).toHaveLength(0);
  });
});
```

### Performance Testing

Validate performance requirements:

```typescript
// test/performance/lookup-performance.test.ts
describe('Lookup Performance', () => {
  it('should process 1000 rows within 10 seconds', async () => {
    const startTime = Date.now();
    
    await lookupProcessor.processDataWithLookups(
      generateTestData(1000),
      targetShape
    );
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10000); // 10 seconds
  });
});
```

## Error Handling

### Error Types

The system defines specific error types for better handling:

```typescript
// Reference data errors
class ReferenceDataError extends Error {
  code: 'DUPLICATE_ID' | 'VALIDATION_ERROR' | 'STORAGE_ERROR' | 'NOT_FOUND';
  details: any;
}

// Lookup processing errors
class LookupProcessingError extends Error {
  rowIndex: number;
  fieldId: string;
  inputValue: any;
  suggestions?: string[];
}

// Validation errors
class LookupValidationError extends Error {
  validationType: 'enum' | 'confidence' | 'reference';
  context: ValidationContext;
}
```

### Error Recovery

Implement graceful error recovery:

```typescript
const processWithErrorRecovery = async (data: any[], targetShape: TargetShape) => {
  const results = [];
  const errors = [];
  
  for (const [index, row] of data.entries()) {
    try {
      const processed = await processRowWithLookups(row, targetShape);
      results.push(processed);
    } catch (error) {
      // Log error and continue processing
      errors.push({
        rowIndex: index,
        error: error.message,
        originalData: row
      });
      
      // Add row with original values
      results.push(row);
    }
  }
  
  return { results, errors };
};
```

## Best Practices

### Code Organization

1. **Separation of Concerns**: Keep matching logic separate from UI components
2. **Type Safety**: Use TypeScript interfaces for all data structures
3. **Error Boundaries**: Wrap components in error boundaries for graceful degradation
4. **Performance**: Implement lazy loading and code splitting where appropriate

### API Design

1. **Consistent Interfaces**: Follow established patterns for new functions
2. **Async Operations**: Use async/await for all I/O operations
3. **Progress Reporting**: Provide progress updates for long-running operations
4. **Error Messages**: Include actionable guidance in error messages

### Testing Strategy

1. **Unit Tests**: Test individual functions and classes in isolation
2. **Integration Tests**: Test component interactions and data flow
3. **Performance Tests**: Validate performance requirements
4. **End-to-End Tests**: Test complete user workflows

## Migration Guide

### Upgrading from Previous Versions

When updating the lookup system:

```typescript
// Check for breaking changes
const migrationRequired = checkLookupFieldVersion(targetShape);

if (migrationRequired) {
  // Migrate old lookup field configurations
  const migrated = migrateLookupFields(targetShape);
  await store.dispatch(saveTargetShape(migrated));
}
```

### Backward Compatibility

Maintain compatibility with existing data:

```typescript
// Support old field format
const normalizeLookupField = (field: any): LookupField => {
  if (field.lookupConfig) {
    // Old format - convert to new format
    return {
      ...field,
      match: {
        on: field.lookupConfig.matchColumn,
        get: field.lookupConfig.returnColumn
      },
      smartMatching: {
        enabled: field.lookupConfig.fuzzyEnabled || false,
        confidence: field.lookupConfig.fuzzyThreshold || 0.8
      }
    };
  }
  
  // New format - return as-is
  return field;
};
```

---

*For user-facing documentation, see the [User Guide](./lookup-fields-user-guide.md). For architectural patterns, see the [Architecture Patterns](./patterns/lookup-architecture-patterns.md).*