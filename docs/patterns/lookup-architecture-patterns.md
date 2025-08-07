# Lookup Fields Architecture Patterns

This document outlines the specific architectural patterns, design decisions, and implementation strategies developed during the lookup fields feature implementation (LOOKUP-001 through LOOKUP-009). These patterns can be applied to similar complex features requiring data processing, user interface integration, and state management.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Data Flow Patterns](#data-flow-patterns)
3. [Component Integration Patterns](#component-integration-patterns)
4. [State Management Architecture](#state-management-architecture)
5. [Processing Engine Design](#processing-engine-design)
6. [UI/UX Integration Patterns](#uiux-integration-patterns)
7. [Performance Optimization Strategies](#performance-optimization-strategies)
8. [Testing Architecture](#testing-architecture)

## System Architecture Overview

### Layered Architecture Implementation

The lookup fields system follows a clean layered architecture that separates concerns and enables maintainability:

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

### Core Design Principles

1. **Separation of Concerns** - Each layer has a single, well-defined responsibility
2. **Dependency Inversion** - Higher layers depend on abstractions, not concrete implementations
3. **Single Responsibility** - Each component/class has one reason to change
4. **Open/Closed Principle** - Extensions without modifications
5. **Interface Segregation** - Small, focused interfaces
6. **Composition over Inheritance** - Favor object composition

## Data Flow Patterns

### 1. Unidirectional Data Flow

The system implements strict unidirectional data flow using Redux:

```typescript
// Data flows in one direction: Actions → Reducers → State → Components
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Actions   │───▶│   Reducers  │───▶│    State    │───▶│ Components  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                                                        │
       └────────────────────────────────────────────────────────┘
                            User Interactions

// Example: Lookup field update flow
dispatch(updateLookupField({ shapeId, fieldId, updates }))
  ↓
targetShapesSlice reducer processes action
  ↓
State updated with new lookup field configuration
  ↓
Components re-render with updated state
  ↓
User sees updated lookup field configuration
```

### 2. Event-Driven Architecture

Key system events and their handlers:

```typescript
// System Events
interface SystemEvents {
  'referenceData:uploaded': ReferenceDataInfo;
  'referenceData:updated': { id: string; changes: any[] };
  'lookup:processed': LookupProcessingResult;
  'lookup:matchFound': LookupMatch;
  'lookup:reviewRequired': FuzzyMatchReview;
}

// Event Bus Pattern
class EventBus {
  private listeners = new Map<string, Function[]>();

  emit<T>(event: string, data: T) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  on<T>(event: string, handler: (data: T) => void) {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
  }
}
```

### 3. Command Query Responsibility Segregation (CQRS)

Separate read and write operations:

```typescript
// Command Side - Write Operations
interface LookupCommands {
  uploadReferenceData(file: File, config: UploadConfig): Promise<ReferenceDataInfo>;
  updateLookupField(shapeId: string, fieldId: string, updates: Partial<LookupField>): void;
  processDataWithLookups(data: TableRow[], targetShape: TargetShape): Promise<ProcessingResult>;
}

// Query Side - Read Operations
interface LookupQueries {
  getReferenceData(id: string): ReferenceData | null;
  getLookupFields(shapeId: string): LookupField[];
  searchReferenceData(query: string, referenceId: string): SearchResult[];
  getProcessingStatistics(batchId: string): ProcessingStats;
}
```

## Component Integration Patterns

### 1. Container/Presentational Pattern

Clear separation between logic and presentation:

```typescript
// Container Component - Handles logic and state
export const LookupEditableCellContainer = ({ value, field, rowIndex, onSave }) => {
  const dispatch = useAppDispatch();
  const referenceData = useAppSelector(state => 
    selectReferenceDataById(state, field.referenceFile)
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleLookup = useCallback(async (inputValue: string) => {
    const result = await lookupProcessor.performLookup(inputValue, referenceData, field);
    if (result.matched) {
      onSave(rowIndex, field.name, result.matchedValue);
    }
    setSuggestions(result.suggestions || []);
  }, [referenceData, field, onSave, rowIndex]);

  return (
    <LookupEditableCellPresentation
      value={value}
      isEditing={isEditing}
      suggestions={suggestions}
      onEdit={setIsEditing}
      onLookup={handleLookup}
    />
  );
};

// Presentational Component - Pure UI
interface LookupEditableCellPresentationProps {
  value: string;
  isEditing: boolean;
  suggestions: string[];
  onEdit: (editing: boolean) => void;
  onLookup: (value: string) => void;
}

export const LookupEditableCellPresentation: React.FC<LookupEditableCellPresentationProps> = ({
  value,
  isEditing,
  suggestions,
  onEdit,
  onLookup,
}) => {
  // Pure UI implementation
};
```

### 2. Higher-Order Component (HOC) Pattern

Reusable logic across different components:

```typescript
// HOC for adding lookup functionality to any editable component
export function withLookupSupport<T extends EditableCellProps>(
  WrappedComponent: React.ComponentType<T>
) {
  return function LookupEnhancedComponent(props: T & { lookupField?: LookupField }) {
    const { lookupField, ...otherProps } = props;
    
    const lookupEnhancements = useLookupEnhancements(lookupField);
    
    if (!lookupField) {
      return <WrappedComponent {...otherProps as T} />;
    }

    return (
      <WrappedComponent
        {...otherProps as T}
        {...lookupEnhancements}
        className={`${props.className} lookup-enabled`}
      />
    );
  };
}

// Usage
const EnhancedTextCell = withLookupSupport(TextEditableCell);
const EnhancedSelectCell = withLookupSupport(SelectEditableCell);
```

### 3. Compound Component Pattern

Complex UI components with multiple sub-components:

```typescript
// Main compound component
export const ReferenceDataManager = ({ children }) => {
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const context = {
    selectedReference,
    setSelectedReference,
    mode,
    setMode,
  };

  return (
    <ReferenceDataContext.Provider value={context}>
      <div className="reference-data-manager">
        {children}
      </div>
    </ReferenceDataContext.Provider>
  );
};

// Sub-components
ReferenceDataManager.List = ({ onSelect }) => {
  const { setSelectedReference } = useReferenceDataContext();
  // Implementation
};

ReferenceDataManager.Viewer = () => {
  const { selectedReference, mode } = useReferenceDataContext();
  // Implementation
};

ReferenceDataManager.Editor = () => {
  const { selectedReference, setMode } = useReferenceDataContext();
  // Implementation
};

// Usage
<ReferenceDataManager>
  <ReferenceDataManager.List />
  <ReferenceDataManager.Viewer />
  <ReferenceDataManager.Editor />
</ReferenceDataManager>
```

## State Management Architecture

### 1. Feature-Based State Slices

Each major feature gets its own Redux slice:

```typescript
// Reference Data Slice
interface ReferenceDataState {
  referenceFiles: Record<string, ReferenceDataInfo>;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  stats: ReferenceDataStats;
}

// Target Shapes Slice
interface TargetShapesState {
  shapes: TargetShape[];
  selectedShapeId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Table Data Slice (extended for lookups)
interface TableState {
  data: TableRow[];
  lookupProcessing: {
    batchId: string | null;
    progress: number;
    statistics: ProcessingStats | null;
  };
  // ... other table state
}
```

### 2. Normalized State Structure

Avoid nested data structures for better performance:

```typescript
// Normalized Reference Data State
interface NormalizedReferenceDataState {
  files: {
    byId: Record<string, ReferenceDataInfo>;
    allIds: string[];
  };
  data: {
    byFileId: Record<string, Record<string, any>[]>;
  };
  ui: {
    selectedFileId: string | null;
    editingFileId: string | null;
    uploadProgress: Record<string, number>;
  };
}

// Selectors for accessing normalized data
export const selectReferenceFileById = (state: RootState, id: string) =>
  state.referenceData.files.byId[id];

export const selectReferenceDataByFileId = (state: RootState, fileId: string) =>
  state.referenceData.data.byFileId[fileId];
```

### 3. Middleware Architecture

Custom middleware for cross-cutting concerns:

```typescript
// History tracking middleware
const historyMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  if (meaningfulActions.includes(action.type)) {
    store.dispatch(historySlice.actions.addAction({
      type: action.type,
      payload: action.payload,
      timestamp: Date.now(),
      stateSnapshot: store.getState(),
    }));
  }
  
  return result;
};

// Persistence middleware
const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  if (persistableActions.includes(action.type)) {
    debounce(() => {
      const state = store.getState();
      persistenceManager.saveState(state);
    }, 1000)();
  }
  
  return result;
};
```

## Processing Engine Design

### 1. Pipeline Architecture

Data processing as composable pipeline stages:

```typescript
// Pipeline Stage Interface
interface PipelineStage<TInput, TOutput> {
  process(input: TInput): Promise<TOutput> | TOutput;
  getName(): string;
}

// Concrete pipeline stages
class ValidationStage implements PipelineStage<RawData, ValidatedData> {
  async process(input: RawData): Promise<ValidatedData> {
    // Validation logic
  }
  getName() { return 'validation'; }
}

class LookupProcessingStage implements PipelineStage<ValidatedData, ProcessedData> {
  constructor(private matchingEngine: LookupMatchingEngine) {}
  
  async process(input: ValidatedData): Promise<ProcessedData> {
    // Lookup processing logic
  }
  getName() { return 'lookup-processing'; }
}

// Pipeline orchestrator
export class DataProcessingPipeline {
  private stages: PipelineStage<any, any>[] = [];

  addStage<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>) {
    this.stages.push(stage);
    return this;
  }

  async execute<TInput, TOutput>(input: TInput): Promise<TOutput> {
    let result: any = input;
    
    for (const stage of this.stages) {
      result = await stage.process(result);
    }
    
    return result as TOutput;
  }
}
```

### 2. Strategy Pattern for Matching Algorithms

Pluggable matching strategies:

```typescript
// Matching strategy interface
interface MatchingStrategy {
  match(input: string, candidates: string[], config: MatchConfig): MatchResult;
  getConfidence(input: string, match: string): number;
}

// Concrete strategies
class ExactMatchStrategy implements MatchingStrategy {
  match(input: string, candidates: string[], config: MatchConfig): MatchResult {
    const exactMatch = candidates.find(candidate => 
      candidate.toLowerCase() === input.toLowerCase()
    );
    
    return {
      matched: !!exactMatch,
      value: exactMatch,
      confidence: exactMatch ? 1.0 : 0.0,
      strategy: 'exact',
    };
  }
}

class FuzzyMatchStrategy implements MatchingStrategy {
  match(input: string, candidates: string[], config: MatchConfig): MatchResult {
    // Implement fuzzy matching with configurable algorithms
    const matches = candidates.map(candidate => ({
      value: candidate,
      confidence: this.calculateSimilarity(input, candidate),
    })).filter(match => match.confidence >= config.threshold);
    
    const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
    
    return {
      matched: !!bestMatch,
      value: bestMatch?.value,
      confidence: bestMatch?.confidence || 0.0,
      strategy: 'fuzzy',
      alternatives: matches.slice(1, 4), // Top 3 alternatives
    };
  }
}

// Matching engine with strategy selection
export class LookupMatchingEngine {
  private strategies = new Map<string, MatchingStrategy>([
    ['exact', new ExactMatchStrategy()],
    ['fuzzy', new FuzzyMatchStrategy()],
    ['phonetic', new PhoneticMatchStrategy()],
  ]);

  performLookup(input: string, referenceData: any[], config: LookupConfig): LookupResult {
    const candidates = referenceData.map(row => row[config.matchColumn]);
    
    // Try strategies in order of preference
    for (const strategyName of config.strategies || ['exact', 'fuzzy']) {
      const strategy = this.strategies.get(strategyName);
      if (!strategy) continue;
      
      const result = strategy.match(input, candidates, config);
      if (result.matched && result.confidence >= config.minConfidence) {
        return this.buildLookupResult(result, referenceData, config);
      }
    }
    
    return { matched: false, input, suggestions: this.generateSuggestions(input, candidates) };
  }
}
```

### 3. Observer Pattern for Processing Events

Event-driven processing updates:

```typescript
// Processing event types
interface ProcessingEvents {
  'batch.started': { batchId: string; totalRows: number };
  'row.processed': { batchId: string; rowIndex: number; result: RowProcessingResult };
  'batch.completed': { batchId: string; statistics: ProcessingStatistics };
  'error.occurred': { batchId: string; error: ProcessingError };
}

// Observable processing engine
export class ObservableLookupProcessor {
  private observers = new Map<keyof ProcessingEvents, Set<Function>>();

  on<K extends keyof ProcessingEvents>(
    event: K,
    handler: (data: ProcessingEvents[K]) => void
  ) {
    if (!this.observers.has(event)) {
      this.observers.set(event, new Set());
    }
    this.observers.get(event)!.add(handler);
  }

  private emit<K extends keyof ProcessingEvents>(event: K, data: ProcessingEvents[K]) {
    const handlers = this.observers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  async processBatch(data: TableRow[], targetShape: TargetShape): Promise<ProcessingResult> {
    const batchId = generateBatchId();
    
    this.emit('batch.started', { batchId, totalRows: data.length });
    
    try {
      const results = [];
      for (let i = 0; i < data.length; i++) {
        const result = await this.processRow(data[i], targetShape);
        results.push(result);
        
        this.emit('row.processed', { batchId, rowIndex: i, result });
      }
      
      const statistics = this.calculateStatistics(results);
      this.emit('batch.completed', { batchId, statistics });
      
      return { batchId, results, statistics };
    } catch (error) {
      this.emit('error.occurred', { batchId, error: error as ProcessingError });
      throw error;
    }
  }
}
```

## UI/UX Integration Patterns

### 1. Progressive Disclosure Pattern

Complex functionality revealed progressively:

```typescript
// Template builder with progressive lookup configuration
export const LookupFieldConfiguration = ({ field, onUpdate }) => {
  const [configLevel, setConfigLevel] = useState<'basic' | 'advanced'>('basic');
  
  return (
    <div className="lookup-configuration">
      {/* Basic Configuration - Always Visible */}
      <BasicLookupConfig field={field} onUpdate={onUpdate} />
      
      {/* Advanced Configuration - On Demand */}
      <Collapsible
        trigger={
          <Button variant="ghost" onClick={() => setConfigLevel('advanced')}>
            Advanced Configuration
          </Button>
        }
        open={configLevel === 'advanced'}
      >
        <AdvancedLookupConfig field={field} onUpdate={onUpdate} />
      </Collapsible>
      
      {/* Expert Configuration - Feature Flag */}
      {isExpertModeEnabled && (
        <ExpertLookupConfig field={field} onUpdate={onUpdate} />
      )}
    </div>
  );
};
```

### 2. Feedback-Driven Design Pattern

Immediate user feedback for all actions:

```typescript
// Feedback states for lookup operations
type FeedbackState = 
  | { type: 'idle' }
  | { type: 'processing'; message: string }
  | { type: 'success'; message: string; data?: any }
  | { type: 'warning'; message: string; suggestions?: string[] }
  | { type: 'error'; message: string; details?: string };

export const LookupEditableCell = ({ value, field, onSave }) => {
  const [feedback, setFeedback] = useState<FeedbackState>({ type: 'idle' });
  
  const performLookup = async (input: string) => {
    setFeedback({ type: 'processing', message: 'Looking up value...' });
    
    try {
      const result = await lookupEngine.performLookup(input, referenceData, field);
      
      if (result.matched) {
        if (result.confidence === 1.0) {
          setFeedback({ 
            type: 'success', 
            message: `Exact match found: ${result.matchedValue}` 
          });
        } else {
          setFeedback({
            type: 'warning',
            message: `Fuzzy match found (${(result.confidence * 100).toFixed(0)}% confidence)`,
            suggestions: result.alternatives?.map(alt => alt.value),
          });
        }
      } else {
        setFeedback({
          type: 'error',
          message: 'No match found',
          suggestions: result.suggestions,
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Lookup failed',
        details: error.message,
      });
    }
  };

  return (
    <div className="lookup-cell">
      <input value={value} onChange={e => performLookup(e.target.value)} />
      <FeedbackDisplay feedback={feedback} />
    </div>
  );
};
```

### 3. Context-Aware Navigation Pattern

Navigation that adapts to user context:

```typescript
// Navigation context based on current workflow
interface NavigationContext {
  currentWorkflow: 'template-building' | 'data-editing' | 'lookup-review';
  breadcrumbs: BreadcrumbItem[];
  availableActions: NavigationAction[];
}

export const LookupNavigationProvider = ({ children }) => {
  const location = useLocation();
  const searchParams = useSearchParams();
  
  const navigationContext = useMemo(() => {
    const context = parseLookupConfigParams(searchParams);
    
    return {
      currentWorkflow: determineWorkflow(location, context),
      breadcrumbs: generateLookupBreadcrumbs(location.pathname, searchParams),
      availableActions: getAvailableActions(context),
    };
  }, [location, searchParams]);

  return (
    <NavigationContext.Provider value={navigationContext}>
      <BreadcrumbNavigation />
      {children}
      <ContextualActions />
    </NavigationContext.Provider>
  );
};
```

### 4. Routing Architecture Pattern

The lookup system implements a comprehensive routing strategy with deep linking and user-friendly redirects:

```typescript
// Route Structure
const LOOKUP_ROUTES = {
  // Reference data management
  REFERENCE_DATA: '/playground/reference-data',
  // Template builder with lookup configuration
  TEMPLATE_BUILDER: '/playground/template-builder',
  // Data table with fuzzy match review
  DATA_TABLE: '/playground/data-table',
} as const;

// Query Parameter Patterns
interface RouteParams {
  // Reference data management: ?file={fileId}&mode={view|edit}
  ReferenceDataParams: {
    file?: string;        // ref_01H9X2K3L4M5N6P7Q8R9S0T1U2
    mode?: 'view' | 'edit';
  };
  
  // Lookup configuration: ?field={fieldId}&action={configure-lookup}
  LookupConfigParams: {
    field?: string;       // field_01H9X2K3L4M5N6P7Q8R9S0T1U2
    action?: 'configure-lookup';
  };
  
  // Fuzzy match review: ?review=fuzzy-matches&batch={batchId}
  FuzzyMatchReviewParams: {
    review?: 'fuzzy-matches';
    batch?: string;       // batch_01H9X2K3L4M5N6P7Q8R9S0T1U2
  };
}
```

**Routing Features:**

1. **Deep Linking Support** - All states are URL-addressable and shareable
2. **User-Friendly Redirects** - Automatic navigation after successful operations
3. **Progress Preservation** - Navigation maintains current workflow state
4. **Breadcrumb Generation** - Contextual navigation breadcrumbs
5. **History Integration** - Works seamlessly with Redux time-travel

## Performance Optimization Strategies

### 1. Lazy Loading and Code Splitting

```typescript
// Lazy load lookup components
const LookupEditableCell = lazy(() => import('./lookup-editable-cell'));
const ReferenceDataViewer = lazy(() => import('./reference-data-viewer'));
const FuzzyMatchReview = lazy(() => import('./fuzzy-match-review'));

// Route-based code splitting
export const LookupRoutes = () => (
  <Routes>
    <Route
      path="/reference-data"
      element={
        <Suspense fallback={<LoadingSpinner />}>
          <ReferenceDataViewer />
        </Suspense>
      }
    />
    <Route
      path="/fuzzy-review"
      element={
        <Suspense fallback={<LoadingSpinner />}>
          <FuzzyMatchReview />
        </Suspense>
      }
    />
  </Routes>
);
```

### 2. Memoization and Caching Strategies

```typescript
// Memoized lookup results cache
class LookupResultsCache {
  private cache = new Map<string, { result: LookupResult; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  getCacheKey(input: string, referenceId: string, config: LookupConfig): string {
    return `${input}:${referenceId}:${JSON.stringify(config)}`;
  }

  get(input: string, referenceId: string, config: LookupConfig): LookupResult | null {
    const key = this.getCacheKey(input, referenceId, config);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.result;
    }
    
    this.cache.delete(key);
    return null;
  }

  set(input: string, referenceId: string, config: LookupConfig, result: LookupResult) {
    const key = this.getCacheKey(input, referenceId, config);
    this.cache.set(key, { result, timestamp: Date.now() });
  }
}

// Memoized component with lookup cache
export const MemoizedLookupCell = React.memo(({ value, field, onSave }) => {
  const lookupCache = useMemo(() => new LookupResultsCache(), []);
  
  const performLookup = useCallback(async (input: string) => {
    // Check cache first
    const cached = lookupCache.get(input, field.referenceFile, field.config);
    if (cached) return cached;
    
    // Perform lookup and cache result
    const result = await lookupEngine.performLookup(input, referenceData, field.config);
    lookupCache.set(input, field.referenceFile, field.config, result);
    
    return result;
  }, [lookupCache, field]);

  // Rest of component implementation
});
```

### 3. Batch Processing Optimization

```typescript
// Optimized batch processing with progress tracking
export class OptimizedLookupProcessor {
  async processBatch(
    data: TableRow[],
    targetShape: TargetShape,
    options: BatchProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const {
      batchSize = 100,
      concurrency = 4,
      onProgress = () => {},
    } = options;

    // Split data into chunks for parallel processing
    const chunks = this.chunkArray(data, batchSize);
    const results: ProcessingResult[] = [];
    
    // Process chunks with limited concurrency
    const semaphore = new Semaphore(concurrency);
    
    await Promise.all(
      chunks.map(async (chunk, chunkIndex) => {
        await semaphore.acquire();
        
        try {
          const chunkResult = await this.processChunk(chunk, targetShape);
          results[chunkIndex] = chunkResult;
          
          // Report progress
          const processedRows = (chunkIndex + 1) * batchSize;
          onProgress({
            processedRows: Math.min(processedRows, data.length),
            totalRows: data.length,
            percentage: Math.min((processedRows / data.length) * 100, 100),
          });
        } finally {
          semaphore.release();
        }
      })
    );

    return this.mergeResults(results);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

## Testing Architecture

### 1. Test Pyramid Implementation

```
┌─────────────────────────────────────┐
│         E2E Tests (Few)             │  ← Complete user workflows
├─────────────────────────────────────┤
│     Integration Tests (Some)        │  ← Component interactions
├─────────────────────────────────────┤
│      Unit Tests (Many)              │  ← Individual functions/components
└─────────────────────────────────────┘
```

### 2. Testing Utilities and Helpers

```typescript
// Test utilities for lookup functionality
export const createMockLookupField = (overrides: Partial<LookupField> = {}): LookupField => ({
  id: 'test-lookup',
  name: 'department',
  type: 'lookup',
  required: false,
  referenceFile: 'ref_departments',
  match: { on: 'name', get: 'id' },
  smartMatching: { enabled: true, confidence: 0.8 },
  onMismatch: 'error',
  ...overrides,
});

export const createMockReferenceData = (count: number = 5) => 
  Array.from({ length: count }, (_, i) => ({
    id: `item_${i}`,
    name: `Item ${i}`,
    category: `Category ${i % 3}`,
  }));

export const createMockStore = (initialState: Partial<RootState> = {}) => 
  configureStore({
    reducer: rootReducer,
    preloadedState: {
      referenceData: {
        referenceFiles: {},
        isUploading: false,
        ...initialState.referenceData,
      },
      ...initialState,
    },
  });
```

### 3. Integration Test Patterns

```typescript
// Integration test for complete lookup workflow
describe('Lookup Workflow Integration', () => {
  let store: ReturnType<typeof createMockStore>;
  let mockReferenceData: Record<string, any>[];

  beforeEach(async () => {
    store = createMockStore();
    mockReferenceData = createMockReferenceData(10);
    
    // Setup reference data
    await store.dispatch(uploadReferenceDataAsync({
      file: createMockFile(mockReferenceData),
      id: 'ref_test',
    }));
  });

  it('should complete end-to-end lookup processing', async () => {
    const targetShape = createMockTargetShape({
      fields: [createMockLookupField({ referenceFile: 'ref_test' })],
    });

    const inputData = [
      { name: 'John Doe', department: 'Item 1' },
      { name: 'Jane Smith', department: 'Item 2' },
    ];

    // Process data with lookups
    const result = await store.dispatch(processDataWithLookups({
      data: inputData,
      targetShape,
    }));

    // Verify results
    expect(result.type).toBe('table/processDataWithLookups/fulfilled');
    expect(result.payload.processedData).toHaveLength(2);
    expect(result.payload.statistics.successfulLookups).toBe(2);
    
    // Verify state updates
    const state = store.getState();
    expect(state.table.lookupProcessing.statistics).toBeTruthy();
  });
});
```

This architecture provides a solid foundation for building complex, data-intensive features while maintaining code quality, performance, and user experience. The patterns established during the lookup fields implementation can be applied to future features requiring similar complexity and integration points.