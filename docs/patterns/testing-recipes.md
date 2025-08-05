# Testing Recipes and Patterns

This guide provides comprehensive testing patterns, recipes, and tool overviews based on the testing infrastructure developed for the lookup fields system. The patterns here can be applied across the entire codebase.

## Table of Contents

1. [Testing Stack Overview](#testing-stack-overview)
2. [Unit Testing Patterns](#unit-testing-patterns)
3. [Component Testing Recipes](#component-testing-recipes)
4. [Integration Testing Approaches](#integration-testing-approaches)
5. [Mocking Strategies](#mocking-strategies)
6. [Performance Testing](#performance-testing)
7. [Testing Tools Reference](#testing-tools-reference)

## Testing Stack Overview

### Core Testing Framework
- **Vitest** - Fast unit test runner (Jest-compatible API)
- **React Testing Library** - Component testing utilities
- **jsdom** - Browser environment simulation
- **@testing-library/react-hooks** - Hook testing utilities

### Key Testing Principles
1. **Test behavior, not implementation** - Focus on what the user experiences
2. **Arrange, Act, Assert** - Clear test structure
3. **Descriptive test names** - Tests should read like specifications
4. **Mock at the boundary** - Mock external dependencies, not internal logic
5. **Test edge cases** - Especially important for data processing

## Unit Testing Patterns

### 1. Pure Function Testing

**Recipe: Testing Data Processing Functions**

```typescript
// Example: Testing lookup matching engine
describe('LookupMatchingEngine', () => {
  let engine: LookupMatchingEngine;
  let sampleReferenceData: Record<string, any>[];
  let basicConfig: LookupConfig;

  beforeEach(() => {
    engine = new LookupMatchingEngine();
    
    // Setup test data
    sampleReferenceData = [
      { id: 1, name: 'Engineering', department: 'Engineering', manager: 'John Smith' },
      { id: 2, name: 'Marketing', department: 'Marketing', manager: 'Jane Doe' },
    ];

    basicConfig = {
      matchColumn: 'name',
      returnColumn: 'department',
      smartMatching: { enabled: true, confidence: 0.7 },
      onMismatch: 'null' as const,
    };
  });

  describe('Exact Matching', () => {
    it('should return exact match with high confidence', () => {
      const result = engine.performLookup(
        'Engineering',
        sampleReferenceData,
        basicConfig
      );

      expect(result).toEqual({
        matched: true,
        confidence: 1.0,
        matchType: 'exact',
        matchedValue: 'Engineering',
        inputValue: 'Engineering',
      });
    });
  });

  describe('Fuzzy Matching', () => {
    it('should handle misspellings with confidence scoring', () => {
      const result = engine.performLookup(
        'Enginering', // typo
        sampleReferenceData,
        basicConfig
      );

      expect(result.matched).toBe(true);
      expect(result.matchType).toBe('fuzzy');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.matchedValue).toBe('Engineering');
    });
  });
});
```

**Key Patterns:**
- Use `beforeEach` for consistent test setup
- Create realistic test data that covers edge cases
- Test both success and failure scenarios
- Use descriptive assertions that explain the expected behavior

### 2. Redux State Testing

**Recipe: Testing Redux Slices and Actions**

```typescript
// Example: Testing target shapes slice with lookup integration
describe('targetShapesSlice Integration', () => {
  let store: any;
  let mockTargetShape: TargetShape;

  beforeEach(() => {
    // Create isolated store for each test
    store = configureStore({
      reducer: { targetShapes: targetShapesReducer },
    });

    mockTargetShape = {
      id: 'test-shape',
      name: 'Test Shape',
      fields: [],
      // ... other required fields
    };
  });

  describe('addLookupField', () => {
    it('should add lookup field with proper initialization', () => {
      const lookupField: LookupField = {
        id: 'dept-lookup',
        name: 'department',
        type: 'lookup',
        referenceFile: 'ref_departments',
        match: { on: 'name', get: 'id' },
        // ... other required fields
      };

      store.dispatch(addLookupField({ 
        shapeId: 'test-shape', 
        field: lookupField 
      }));

      const state = store.getState().targetShapes;
      const updatedShape = state.shapes.find(s => s.id === 'test-shape');
      
      expect(updatedShape.fields).toHaveLength(1);
      expect(updatedShape.fields[0]).toMatchObject(lookupField);
    });
  });
});
```

**Key Patterns:**
- Create isolated store instances for each test
- Test actions and their effects on state
- Use `toMatchObject` for partial matching
- Test both synchronous and asynchronous actions

## Component Testing Recipes

### 1. React Component Testing with Redux

**Recipe: Testing Components with Redux Integration**

```typescript
// Example: Testing lookup editable cell component
describe('LookupEditableCell', () => {
  let mockStore: any;

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={mockStore}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    mockStore = configureStore({
      reducer: { table: tableReducer },
      preloadedState: {
        table: {
          data: [],
          // ... other initial state
        },
      },
    });
  });

  it('should display current value and handle editing', async () => {
    const mockField: LookupField = {
      id: 'department',
      name: 'department',
      type: 'lookup',
      referenceFile: 'ref_departments_123',
      // ... other required fields
    };

    renderWithProvider(
      <LookupEditableCell
        value="Engineering"
        field={mockField}
        rowIndex={0}
        onSave={vi.fn()}
      />
    );

    // Test initial display
    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();

    // Test editing interaction
    const input = screen.getByDisplayValue('Engineering');
    fireEvent.doubleClick(input);
    
    // Should enter edit mode
    await waitFor(() => {
      expect(input).not.toHaveAttribute('readonly');
    });
  });
});
```

**Key Patterns:**
- Create helper functions for rendering with providers
- Use realistic mock data and store state
- Test user interactions (clicks, keyboard input)
- Use `waitFor` for asynchronous state changes
- Test both display and interaction behavior

### 2. Form Component Testing

**Recipe: Testing Complex Form Components**

```typescript
// Example: Testing reference data upload dialog
describe('ReferenceUploadDialog', () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    onUpload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle file upload with validation', async () => {
    render(<ReferenceUploadDialog {...mockProps} />);

    // Create mock file
    const file = new File(['name,id\nEngineering,1'], 'test.csv', {
      type: 'text/csv',
    });

    // Simulate file selection
    const fileInput = screen.getByLabelText(/select file/i);
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    // Should show file preview
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    // Test upload button
    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockProps.onUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          file,
          customId: expect.any(String),
        })
      );
    });
  });
});
```

**Key Patterns:**
- Mock file objects for upload testing
- Use `Object.defineProperty` for DOM properties
- Test form validation and error states
- Verify callback functions are called with correct parameters

## Integration Testing Approaches

### 1. Cross-Component Integration

**Recipe: Testing Component Interactions**

```typescript
// Example: Testing reference data viewer with editor integration
describe('ReferenceDataViewer Integration', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = configureStore({
      reducer: { 
        referenceData: referenceDataReducer,
        targetShapes: targetShapesReducer,
      },
    });
  });

  it('should allow editing reference data and reflect changes', async () => {
    const mockReferenceInfo = {
      id: 'test-ref',
      filename: 'departments.csv',
      columns: ['id', 'name'],
      rowCount: 2,
    };

    render(
      <Provider store={mockStore}>
        <ReferenceDataViewer 
          referenceInfo={mockReferenceInfo}
          onClose={vi.fn()}
        />
      </Provider>
    );

    // Should display reference data
    expect(screen.getByText('departments.csv')).toBeInTheDocument();

    // Open editor
    const editButton = screen.getByText('Edit Data');
    fireEvent.click(editButton);

    // Should show editor interface
    await waitFor(() => {
      expect(screen.getByText('Edit Reference Data')).toBeInTheDocument();
    });
  });
});
```

### 2. Data Flow Integration

**Recipe: Testing End-to-End Data Processing**

```typescript
// Example: Testing lookup processor with real data pipeline
describe('LookupProcessor Integration', () => {
  let processor: LookupProcessor;
  let mockTargetShape: TargetShape;

  beforeEach(() => {
    processor = new LookupProcessor();
    
    mockTargetShape = {
      id: 'employee-shape',
      name: 'Employee Data',
      fields: [
        {
          id: 'dept-lookup',
          name: 'department',
          type: 'lookup',
          referenceFile: 'departments.csv',
          match: { on: 'dept_name', get: 'dept_id' },
          alsoGet: [{ name: 'manager', source: 'manager' }],
        },
      ],
    };
  });

  it('should process data with lookups and derive additional fields', async () => {
    const inputData = [
      { name: 'John Doe', department: 'Engineering' },
      { name: 'Jane Smith', department: 'Marketing' },
    ];

    const result = await processor.processData(inputData, mockTargetShape);

    expect(result).toEqual({
      processedData: [
        { 
          name: 'John Doe', 
          department: 'ENG001',  // looked up
          manager: 'Sarah Johnson'  // derived
        },
        { 
          name: 'Jane Smith', 
          department: 'MKT001',  // looked up
          manager: 'Mike Chen'  // derived
        },
      ],
      statistics: {
        totalRows: 2,
        successfulLookups: 2,
        failedLookups: 0,
      },
    });
  });
});
```

## Mocking Strategies

### 1. External Service Mocking

**Recipe: Mocking Reference Data Manager**

```typescript
// Mock entire module with specific implementations
vi.mock('@/lib/utils/reference-data-manager', () => ({
  referenceDataManager: {
    getReferenceDataRows: vi.fn((id: string) => {
      const mockData = {
        'ref_departments': [
          { dept_name: 'Engineering', dept_id: 'ENG001' },
          { dept_name: 'Marketing', dept_id: 'MKT001' },
        ],
      };
      return mockData[id as keyof typeof mockData] || null;
    }),
    uploadReferenceFile: vi.fn().mockResolvedValue({
      id: 'new_ref_id',
      filename: 'uploaded.csv',
      rowCount: 10,
    }),
  },
}));
```

### 2. Component Dependency Mocking

**Recipe: Mocking Complex Dependencies**

```typescript
// Mock matching engine with controllable behavior
vi.mock('@/lib/utils/lookup-matching-engine', () => ({
  LookupMatchingEngine: vi.fn().mockImplementation(() => ({
    performLookup: vi.fn().mockImplementation((input: string) => {
      // Return different results based on input for testing
      if (input === 'Engineering') {
        return {
          matched: true,
          confidence: 1.0,
          matchType: 'exact',
          matchedValue: 'ENG001',
        };
      }
      return {
        matched: false,
        confidence: 0,
        suggestions: ['Engineering', 'Marketing'],
      };
    }),
  })),
}));
```

### 3. Hook Mocking

**Recipe: Testing Custom Hooks**

```typescript
// Example: Testing useReferenceDataEditor hook
describe('useReferenceDataEditor', () => {
  it('should manage editing state and save changes', async () => {
    const { result } = renderHook(() => 
      useReferenceDataEditor(mockReferenceInfo)
    );

    // Test initial state
    expect(result.current.isEditing).toBe(false);
    expect(result.current.data).toEqual([]);

    // Start editing
    act(() => {
      result.current.startEditing();
    });

    expect(result.current.isEditing).toBe(true);

    // Save changes
    const newData = [{ id: '1', name: 'Updated Name' }];
    
    await act(async () => {
      await result.current.saveChanges(newData);
    });

    expect(result.current.isEditing).toBe(false);
    expect(mockReferenceDataManager.updateReferenceData)
      .toHaveBeenCalledWith('test-ref', newData);
  });
});
```

## Performance Testing

### Recipe: Testing Large Dataset Performance

```typescript
describe('LookupMatchingEngine Performance', () => {
  it('should handle large datasets efficiently', () => {
    const engine = new LookupMatchingEngine();
    
    // Generate large test dataset
    const largeReferenceData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      category: `Category ${i % 100}`,
    }));

    const startTime = performance.now();
    
    const result = engine.performLookup(
      'Item 5000',
      largeReferenceData,
      { matchColumn: 'name', returnColumn: 'category' }
    );
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(result.matched).toBe(true);
    expect(executionTime).toBeLessThan(100); // Should complete in <100ms
  });

  it('should handle batch operations efficiently', async () => {
    const processor = new LookupProcessor();
    
    const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
      name: `Employee ${i}`,
      department: 'Engineering',
    }));

    const startTime = performance.now();
    
    await processor.processBatch(largeBatch, mockTargetShape);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000); // Should complete in <1s
  });
});
```

## Testing Tools Reference

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
});

// test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### Common Test Utilities

```typescript
// test/utils.tsx
export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      table: tableReducer,
      targetShapes: targetShapesReducer,
      referenceData: referenceDataReducer,
    },
    preloadedState: initialState,
  });
};

export const renderWithProviders = (
  ui: React.ReactElement,
  { initialState = {}, store = createMockStore(initialState) } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper }),
  };
};
```

### Assertion Patterns

```typescript
// Common assertion patterns used in the codebase

// Object shape matching
expect(result).toMatchObject({
  matched: true,
  confidence: expect.any(Number),
  matchType: 'exact',
});

// Array length and content
expect(results).toHaveLength(3);
expect(results).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ name: 'Engineering' }),
  ])
);

// Function calls
expect(mockFunction).toHaveBeenCalledWith(
  expect.stringMatching(/^ref_/),
  expect.objectContaining({ rowCount: expect.any(Number) })
);

// Async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// Error handling
expect(() => {
  engine.performLookup(null, [], config);
}).toThrow('Invalid input value');
```

## Best Practices Summary

1. **Test Structure**: Use clear Arrange-Act-Assert pattern
2. **Mock Strategy**: Mock at module boundaries, not internal implementations
3. **Data Setup**: Create realistic test data that covers edge cases
4. **Async Testing**: Always use `waitFor` for async operations
5. **Cleanup**: Use `beforeEach` and `afterEach` for test isolation
6. **Descriptive Names**: Test names should explain the expected behavior
7. **Performance**: Include performance tests for data-intensive operations
8. **Integration**: Test component interactions and data flow
9. **Error Cases**: Always test error scenarios and edge cases
10. **Documentation**: Use tests as living documentation of expected behavior

This testing infrastructure provides a solid foundation for maintaining code quality and preventing regressions as the lookup fields system and broader codebase continue to evolve.