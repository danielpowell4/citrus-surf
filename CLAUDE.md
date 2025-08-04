# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing Commands

- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Launch Vitest UI for interactive testing

## Project Context

### Product Vision (from CONTEXT.md)

**Citrus Surf Importer** is a workflow-first CSV importer and data prep tool designed for developers and operations teams. The core ethos is _"Life's short. Go surfing."_ - building tools that help users go faster and spend less time on repetitive data cleaning tasks.

**Current Stage**: Step 0 MVP - A client-side app to prepare clean CSV/JSON files with no backend persistence.

**Core Values**:

- **Transparency**: Show users what's happening at every step
- **Debuggability**: Clear errors users can self-serve fixes for
- **Resilience**: No work lost (autosave + history chain)
- **Simplicity**: Minimal clicks to prepare data for import
- **Speed**: Fast, efficient workflows

### Comprehensive Documentation

The project follows a documentation-first approach with extensive guides in the `docs/` directory:

**System Documentation**:

- `docs/target-shapes.md` - Core data transformation system
- `docs/template-creation-workflow.md` - Template builder integration and navigation
- `docs/import-system.md` - Data import workflow
- `docs/export-system.md` - Data export functionality
- `docs/history-system.md` - Time-travel and undo/redo
- `docs/redux-persistence.md` - State persistence patterns

**Developer References**:

- `docs/column-types-reference.md` - All supported data types and validations
- `docs/editable-cells.md` - Inline editing system
- `docs/column-sorting.md` - Sorting implementation details
- `docs/style-guide.md` - Complete theming and UI patterns
- `docs/hydration-handling.md` - SSR-safe state management

**Quick References**:

- `docs/target-shapes-quick-reference.md` - Target shapes cheat sheet
- `docs/id-system.md` - Row identification patterns
- `docs/sort-utils.md` - Sorting utilities guide

## Project Architecture

### Core Technologies

- **Frontend**: Next.js 15 with React 19 and Turbopack
- **State Management**: Redux Toolkit with persistence middleware
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme supporting light/dark modes
- **Data Grid**: TanStack Table for all tabular data display
- **Testing**: Vitest with React Testing Library and jsdom

### State Management Architecture

The application uses Redux Toolkit with a sophisticated state management system:

**Core Slices:**

- `tableSlice` - Main data table state, sorting, filtering, editing
- `historySlice` - Time-travel functionality for undo/redo operations
- `targetShapesSlice` - Data shape definitions and transformations
- `persistenceSlice` - State persistence tracking and status

**Key Features:**

- **Auto-persistence**: State automatically saves to localStorage with debouncing
- **History tracking**: All meaningful user actions are tracked for undo/redo
- **Complete state restoration**: Template applications and all UI state can be reverted in 1 click
- **Hydration system**: Handles SSR/client state synchronization safely
- **Per-request stores**: Each request gets its own store instance

### Target Shapes System

The core data transformation system based on schema definitions:

**Location**: `lib/types/target-shapes.ts`, `lib/features/targetShapesSlice.ts`

**Key Concepts:**

- **TargetShape**: Schema definition with fields, validation, and transformations
- **TargetField**: Individual field with type, validation rules, and transformation rules
- **Field Types**: Comprehensive type system (string, number, date, currency, etc.)
- **Validation Rules**: Built-in validation with custom error messages
- **Transformation Rules**: Data transformation pipeline (trim, format, extract, etc.)

**Critical Rule**: Never modify target shape core logic without understanding full impact on data integrity. Reference `docs/target-shapes.md` for implementation guidance.

### Lookup System Architecture

Complete lookup field system with matching engine and data processing integration:

**Core Components:**
- **Matching Engine**: `lib/utils/lookup-matching-engine.ts`, `lib/utils/string-similarity.ts`
- **Data Processor**: `lib/utils/lookup-processor.ts` - Full Redux integration with async processing
- **Redux Integration**: Enhanced `lib/features/tableSlice.ts` with lookup async thunks

**Key Features:**
- **Multi-tier Matching**: Exact → Normalized → Fuzzy matching with configurable thresholds
- **Advanced Algorithms**: Levenshtein, Jaro, and Jaro-Winkler similarity with weighted scoring
- **Data Processing**: Automatic lookup processing during import with derived column generation
- **Real-time Updates**: Live lookup updates when users edit lookup field values
- **Batch Processing**: Async operations with progress tracking for large datasets (10k+ rows)
- **Error Handling**: Comprehensive error collection, statistics, and fuzzy match review
- **History Integration**: Lookup operations tracked in meaningful actions for undo/redo
- **Derived Fields**: Automatic extraction of additional columns during lookups
- **Performance Optimized**: <1ms exact matches, <10ms fuzzy matches, >100 ops/second throughput

**Critical Pattern**: Always use the matching engine for lookup operations rather than implementing custom string matching. The engine handles edge cases, null values, and performance optimization.

### File Structure Patterns

**App Router Structure:**

- `app/playground/` - Main data table playground with editable cells
- `app/tools/` - Collection of data transformation tools (CSV/JSON converters, etc.)

**Library Organization:**

- `lib/features/` - Redux slices and state management
- `lib/utils/` - Utility functions (exports, data processing, persistence)
- `lib/hooks/` - Custom React hooks (hydration, persistence, storage)
- `lib/types/` - TypeScript type definitions

**Component Structure:**

- `components/ui/` - shadcn/ui base components (never modify directly)
- `components/` - Custom components built on shadcn/ui patterns
- Follow existing patterns when creating new components

### Editable Cell System

**Location**: `app/playground/editable-cell.tsx`

**Supported Types**: Text, Number, Currency, Date, Select with rich configuration options
**Key Features**: Double-click editing, validation, formatting, keyboard navigation

### Data Processing Pipeline

1. **Import** → Target Shape validation → **Transform** → **Display** in TanStack Table
2. All data transformations must go through the target shapes system
3. Validation rules and type checking must be preserved
4. Support for large file processing with efficient memory usage


### Testing Patterns

**Framework**: Vitest with React Testing Library
**Setup**: `test/setup.ts` configures jsdom environment
**Location**: Tests co-located with source files (`.test.ts/.test.tsx`)
**Coverage**: Focus on data transformation logic and UI component behavior

### Persistence & Hydration

**System**: Custom Redux persistence with localStorage/IndexedDB
**Key Files**:

- `lib/utils/redux-persistence.ts` - Core persistence logic
- `lib/hooks/useHydration.ts` - SSR-safe state restoration
- `lib/hooks/usePersistence.ts` - Persistence status tracking
- `lib/utils/time-travel.ts` - Complete state restoration including template applications

**Critical Pattern**: Always handle hydration mismatches between server and client state. When adding new actions that modify table state, ensure they restore all necessary properties in `time-travel.ts`.

## Development Guidelines

### Code Conventions (from claude-rules.md)

- **File Naming**: kebab-case for files, camelCase for variables
- **TypeScript**: Follow existing patterns, use proper typing
- **UI Components**: Always use shadcn/ui components from `components/ui/`
- **State**: Redux Toolkit + Redux Saga for all state management
- **Theming**: Always test both light and dark modes, use semantic color tokens

### Critical Rules

- **Never create new files** unless absolutely necessary - prefer editing existing files
- **Never create documentation files** unless explicitly requested
- **Always run tests** before moving on - ensure all tests pass
- **Write tests as you go** alongside implementation

### Documentation Maintenance

- **IMPORTANT**: When implementing new features or making significant changes, always check if documentation needs updating
- **Update relevant docs**: Check `docs/` directory for files that may need updates (target-shapes.md, import-system.md, etc.)
- **Update CLAUDE.md**: Add new patterns, conventions, or critical information for future development
- **Update tests**: Ensure test coverage matches new functionality
- **Consider user impact**: Document any user-facing changes or new workflows

### Performance Considerations

- Client-side only processing (no backend in Step 0 MVP)
- Optimize for large CSV file handling
- Use debouncing for state persistence
- Minimize re-renders in data grid

### Brand Alignment

- Maintain "Life's short. Go surfing." ethos in UX
- Keep interfaces simple and intuitive
- Focus on developer and ops team workflows
- Prioritize speed and efficiency
