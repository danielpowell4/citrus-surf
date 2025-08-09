# Development Tools and Architecture Patterns

This document provides an overview of the development tools, architectural patterns, and coding conventions used in the Citrus Surf project, with particular focus on patterns established during the lookup fields implementation.

## Table of Contents

1. [Development Stack](#development-stack)
2. [Architecture Patterns](#architecture-patterns)
3. [Code Organization](#code-organization)
4. [State Management Patterns](#state-management-patterns)
5. [Component Design Patterns](#component-design-patterns)
6. [Data Processing Patterns](#data-processing-patterns)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Performance Optimization](#performance-optimization)

## Development Stack

### Core Technologies

| Technology                | Purpose           | Version | Notes                                      |
| ------------------------- | ----------------- | ------- | ------------------------------------------ |
| **Next.js**               | React framework   | 15.x    | App Router, Turbopack for fast development |
| **React**                 | UI library        | 19.x    | Latest features with concurrent rendering  |
| **TypeScript**            | Type safety       | 5.x     | Strict mode enabled                        |
| **Tailwind CSS**          | Styling           | 3.x     | Utility-first CSS framework                |
| **Redux Toolkit**         | State management  | 2.x     | Modern Redux with RTK Query                |
| **TanStack Table**        | Data grids        | 8.x     | Headless table library                     |
| **Radix UI**              | UI primitives     | Latest  | Accessible component foundation            |
| **shadcn/ui**             | Component library | Latest  | Built on Radix UI                          |
| **Vitest**                | Testing           | 2.x     | Fast Jest-compatible test runner           |
| **React Testing Library** | Component testing | 16.x    | Testing utilities focused on user behavior |

### Development Tools

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "lint": "next lint",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Key Configuration Files

- **`vitest.config.ts`** - Test configuration with jsdom environment
- **`tailwind.config.ts`** - Custom theme and design tokens
- **`tsconfig.json`** - Strict TypeScript configuration
- **`.eslintrc.json`** - Linting rules for code quality
- **`prettier.config.js`** - Code formatting standards

## Architecture Patterns

### 1. Feature-Based Organization

The codebase follows a feature-based architecture where related functionality is grouped together:

```
lib/
├── features/           # Redux slices and state management
│   ├── tableSlice.ts
│   ├── targetShapesSlice.ts
│   └── referenceDataSlice.ts
├── utils/              # Pure utility functions
│   ├── lookup-matching-engine.ts
│   ├── lookup-processor.ts
│   └── reference-data-manager.ts
├── types/              # Type definitions
│   ├── target-shapes.ts
│   └── reference-data-types.ts
└── hooks/              # Custom React hooks
    └── useReferenceDataEditor.ts
```

### 2. Layered Architecture

The application follows a clear layered architecture:

```
┌─────────────────────────────────────┐
│           UI Components             │  ← React components, user interactions
├─────────────────────────────────────┤
│         Business Logic              │  ← Custom hooks, data processing
├─────────────────────────────────────┤
│         State Management            │  ← Redux slices, actions, selectors
├─────────────────────────────────────┤
│         Data Access                 │  ← Storage managers, API clients
├─────────────────────────────────────┤
│         Core Utilities              │  ← Pure functions, algorithms
└─────────────────────────────────────┘
```

### 3. Dependency Injection Pattern

Services and utilities are designed as injectable dependencies:

```typescript
// Example: Lookup processor with injected dependencies
export class LookupProcessor {
  constructor(
    private matchingEngine: LookupMatchingEngine = new LookupMatchingEngine(),
    private referenceManager: IReferenceDataManager = referenceDataManager
  ) {}

  async processData(data: TableRow[], targetShape: TargetShape) {
    // Implementation uses injected dependencies
  }
}

// Usage allows for easy testing and configuration
const processor = new LookupProcessor(mockEngine, mockManager);
```

## Code Organization

### File Naming Conventions

| Pattern          | Usage             | Example                     |
| ---------------- | ----------------- | --------------------------- |
| `kebab-case.ts`  | Utility files     | `lookup-matching-engine.ts` |
| `PascalCase.tsx` | React components  | `LookupEditableCell.tsx`    |
| `camelCase.ts`   | Hooks and configs | `useReferenceDataEditor.ts` |
| `*.test.ts(x)`   | Test files        | `lookup-processor.test.ts`  |
| `*.types.ts`     | Type definitions  | `reference-data-types.ts`   |

### Import Organization

```typescript
// 1. External libraries
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// 2. Internal utilities and types
import { LookupMatchingEngine } from "@/lib/utils/lookup-matching-engine";
import type { LookupField } from "@/lib/types/target-shapes";

// 3. Components (if applicable)
import { LookupEditableCell } from "./lookup-editable-cell";
```

### Directory Structure Best Practices

- **Co-location**: Keep related files together (component + test + types)
- **Barrel exports**: Use `index.ts` files for clean imports
- **Feature separation**: Group by feature, not by file type
- **Shared utilities**: Common utilities in `lib/utils/`

## State Management Patterns

### 1. Redux Toolkit Slice Pattern

Each feature gets its own slice with consistent structure:

```typescript
// Example: Reference data slice
export const referenceDataSlice = createSlice({
  name: "referenceData",
  initialState,
  reducers: {
    // Synchronous actions
    uploadFileStart: (state, action) => {
      state.isUploading = true;
      state.error = null;
    },

    // Action with payload transformation
    uploadFileSuccess: (
      state,
      action: PayloadAction<{ info: ReferenceDataInfo }>
    ) => {
      state.referenceFiles[action.payload.info.id] = action.payload.info;
      state.isUploading = false;
    },
  },
  extraReducers: builder => {
    // Handle async thunks
    builder.addCase(uploadFileAsync.pending, state => {
      state.isUploading = true;
    });
  },
});

// Export actions and selectors
export const { uploadFileStart, uploadFileSuccess } =
  referenceDataSlice.actions;
export const selectReferenceFiles = (state: RootState) =>
  state.referenceData.referenceFiles;
```

### 2. Async Thunk Pattern

For complex async operations:

```typescript
export const processDataWithLookups = createAsyncThunk(
  "table/processDataWithLookups",
  async (
    { data, targetShape }: { data: TableRow[]; targetShape: TargetShape },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const processor = new LookupProcessor();
      const result = await processor.processData(data, targetShape);

      // Update related state
      dispatch(updateProcessingStats(result.statistics));

      return result;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Processing failed",
        timestamp: Date.now(),
      });
    }
  }
);
```

### 3. Selector Pattern

Memoized selectors for derived state:

```typescript
import { createSelector } from "@reduxjs/toolkit";

// Basic selector
export const selectReferenceFiles = (state: RootState) =>
  state.referenceData.referenceFiles;

// Memoized selector for computed values
export const selectReferenceFilesList = createSelector(
  [selectReferenceFiles],
  referenceFiles => Object.values(referenceFiles)
);

// Parameterized selector
export const selectReferenceFileById = (state: RootState, id: string) =>
  state.referenceData.referenceFiles[id];
```

## Component Design Patterns

### 1. Compound Component Pattern

Used for complex UI components like the reference data viewer:

```typescript
// Main component
export const ReferenceDataViewer = ({ referenceInfo, onClose }) => {
  return (
    <Dialog open onClose={onClose}>
      <ReferenceDataViewer.Header referenceInfo={referenceInfo} />
      <ReferenceDataViewer.Content referenceInfo={referenceInfo} />
      <ReferenceDataViewer.Actions onClose={onClose} />
    </Dialog>
  );
};

// Sub-components
ReferenceDataViewer.Header = ({ referenceInfo }) => (
  <DialogHeader>
    <DialogTitle>{referenceInfo.filename}</DialogTitle>
    <DialogDescription>
      {referenceInfo.rowCount} rows, {referenceInfo.columns.length} columns
    </DialogDescription>
  </DialogHeader>
);

ReferenceDataViewer.Content = ({ referenceInfo }) => {
  // Content implementation
};

ReferenceDataViewer.Actions = ({ onClose }) => {
  // Actions implementation
};
```

### 2. Render Props Pattern

For flexible data sharing:

```typescript
interface DataProviderProps {
  children: (data: {
    data: any[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export const ReferenceDataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    // Refetch logic
  }, []);

  return children({ data, loading, error, refetch });
};

// Usage
<ReferenceDataProvider>
  {({ data, loading, error, refetch }) => (
    loading ? <Spinner /> : <DataTable data={data} />
  )}
</ReferenceDataProvider>
```

### 3. Custom Hook Pattern

Encapsulate complex logic in reusable hooks:

```typescript
export const useReferenceDataEditor = (
  referenceInfo: ReferenceDataInfo,
  options: EditingOptions = {}
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    // Load data for editing
  }, [referenceInfo.id]);

  const saveChanges = useCallback(
    async (newData: Record<string, any>[]) => {
      try {
        await referenceDataManager.updateReferenceData(
          referenceInfo.id,
          newData
        );
        setData(newData);
        setHasChanges(false);
        setIsEditing(false);
      } catch (error) {
        throw new Error(`Failed to save changes: ${error.message}`);
      }
    },
    [referenceInfo.id]
  );

  return {
    isEditing,
    data,
    hasChanges,
    startEditing,
    saveChanges,
    cancelEditing: () => setIsEditing(false),
  };
};
```

## Data Processing Patterns

### 1. Pipeline Pattern

Data processing as a series of transformations:

```typescript
export class LookupProcessor {
  async processData(
    data: TableRow[],
    targetShape: TargetShape
  ): Promise<ProcessingResult> {
    return this.createPipeline()
      .pipe(this.validateInput)
      .pipe(this.extractLookupFields)
      .pipe(this.performLookups)
      .pipe(this.validateResults)
      .pipe(this.generateStatistics)
      .execute({ data, targetShape });
  }

  private createPipeline() {
    return new DataPipeline<ProcessingContext>();
  }
}
```

### 2. Strategy Pattern

Different matching strategies:

```typescript
interface MatchingStrategy {
  match(
    input: string,
    referenceData: any[],
    config: LookupConfig
  ): LookupResult;
}

class ExactMatchStrategy implements MatchingStrategy {
  match(
    input: string,
    referenceData: any[],
    config: LookupConfig
  ): LookupResult {
    // Exact matching implementation
  }
}

class FuzzyMatchStrategy implements MatchingStrategy {
  match(
    input: string,
    referenceData: any[],
    config: LookupConfig
  ): LookupResult {
    // Fuzzy matching implementation
  }
}

export class LookupMatchingEngine {
  private strategies: Map<string, MatchingStrategy> = new Map([
    ["exact", new ExactMatchStrategy()],
    ["fuzzy", new FuzzyMatchStrategy()],
  ]);

  performLookup(
    input: string,
    referenceData: any[],
    config: LookupConfig
  ): LookupResult {
    const strategy = this.strategies.get(config.matchType || "exact");
    return strategy.match(input, referenceData, config);
  }
}
```

### 3. Observer Pattern

For data change notifications:

```typescript
export class ReferenceDataManager implements IReferenceDataManager {
  private observers: Set<ReferenceDataObserver> = new Set();

  subscribe(observer: ReferenceDataObserver) {
    this.observers.add(observer);
  }

  unsubscribe(observer: ReferenceDataObserver) {
    this.observers.delete(observer);
  }

  private notifyObservers(event: ReferenceDataEvent) {
    this.observers.forEach(observer => observer.onReferenceDataChange(event));
  }

  async updateReferenceData(
    id: string,
    data: Record<string, any>[]
  ): Promise<boolean> {
    // Update logic
    this.notifyObservers({
      type: "update",
      referenceId: id,
      timestamp: Date.now(),
    });
  }
}
```

## Error Handling Patterns

### 1. Result Pattern

For operations that can fail:

```typescript
type Result<T, E = Error> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

export class LookupMatchingEngine {
  performLookupSafe(
    input: string,
    referenceData: any[],
    config: LookupConfig
  ): Result<LookupResult, LookupError> {
    try {
      const result = this.performLookup(input, referenceData, config);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new LookupError("Lookup failed", error),
      };
    }
  }
}

// Usage
const result = engine.performLookupSafe(input, data, config);
if (result.success) {
  console.log("Match found:", result.data);
} else {
  console.error("Lookup failed:", result.error.message);
}
```

### 2. Custom Error Classes

Structured error handling:

```typescript
export class ReferenceDataError extends Error {
  constructor(
    message: string,
    public code:
      | "PARSE_ERROR"
      | "VALIDATION_ERROR"
      | "STORAGE_ERROR"
      | "NOT_FOUND",
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ReferenceDataError";
  }
}

export class LookupError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
    public context?: {
      input?: string;
      referenceId?: string;
      operation?: string;
    }
  ) {
    super(message);
    this.name = "LookupError";
  }
}
```

### 3. Error Boundary Pattern

React error boundaries for component error handling:

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LookupErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lookup component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded">
          <h3 className="text-red-600 font-medium">Lookup Error</h3>
          <p className="text-sm text-red-500">
            Something went wrong with the lookup functionality.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Performance Optimization

### 1. Memoization Patterns

```typescript
import { useMemo, useCallback } from 'react';

export const LookupEditableCell = ({ value, field, rowIndex, onSave }) => {
  // Memoize expensive computations
  const lookupConfig = useMemo(() =>
    createLookupConfig(field), [field]
  );

  // Memoize event handlers
  const handleSave = useCallback((newValue: string) => {
    onSave(rowIndex, field.name, newValue);
  }, [rowIndex, field.name, onSave]);

  // Memoize derived data
  const suggestions = useMemo(() => {
    if (!referenceData || !value) return [];
    return generateSuggestions(value, referenceData, lookupConfig);
  }, [value, referenceData, lookupConfig]);

  return (
    // Component JSX
  );
};
```

### 2. Virtualization for Large Datasets

```typescript
import { FixedSizeList as List } from 'react-window';

export const LargeReferenceDataTable = ({ data }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ReferenceDataRow data={data[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={data.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3. Debouncing and Throttling

```typescript
import { debounce } from 'lodash-es';

export const SearchableReferenceData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useMemo(
    () => debounce(async (term: string) => {
      if (!term) {
        setResults([]);
        return;
      }

      const searchResults = await referenceDataManager.search(term);
      setResults(searchResults);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search reference data..."
      />
      <SearchResults results={results} />
    </div>
  );
};
```

## Development Workflow

### Code Quality Tools

1. **ESLint** - Code linting with strict rules
2. **Prettier** - Consistent code formatting
3. **TypeScript** - Static type checking
4. **Vitest** - Fast unit testing
5. **React Testing Library** - Component testing

### Git Workflow

```bash
# Feature development
git checkout -b feature/lookup-integration
git commit -m "feat: add lookup field support"

# Code review and merge
git push origin feature/lookup-integration
# Create PR, review, merge

# Release preparation
git checkout main
git tag v1.0.0
git push origin v1.0.0
```

### Commit Message Format

```
type(scope): description

feat(lookup): add fuzzy matching with confidence scoring
fix(ui): resolve reference data viewer loading state
docs(patterns): add testing recipes documentation
test(lookup): add comprehensive integration tests
refactor(types): improve lookup field type definitions
```

This development architecture provides a solid foundation for building scalable, maintainable, and testable features while maintaining consistency across the codebase.
