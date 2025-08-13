# Validation System Implementation Tickets

## Ticket VS-001: Core Validation Types and Metadata Schema

### Description
Create the foundational TypeScript types and interfaces for the validation system, including validation rules, results, and metadata structures.

### Acceptance Criteria

**AC1: Validation Rule Types**
- [ ] Create `ValidationRule` interface with id, type, severity, field, message, and suggestedFix properties
- [ ] Define `ValidationRuleType` enum with: 'required', 'type', 'enum', 'lookup', 'format', 'range'
- [ ] Create `ValidationSeverity` enum with: 'error', 'warning'
- [ ] Export all types from `lib/types/validation.ts`

**AC2: Validation Result Types**
- [ ] Create `ValidationError` interface with rule, message, suggestedFix, and confidence properties
- [ ] Create `ValidationWarning` interface matching ValidationError structure
- [ ] Create `ValidationResult` interface with isValid, errors, warnings, and metadata properties
- [ ] Create `SuggestedFix` interface with action, description, and newValue properties

**AC3: Metadata Types**
- [ ] Create `RowValidationMetadata` interface with rowId, hasErrors, hasWarnings, errorCount, warningCount, lastValidated, status
- [ ] Create `CellValidationMetadata` interface with rowId, fieldName, hasErrors, hasWarnings, errors, warnings, suggestedFixes, lastValidated
- [ ] Create `ValidationStatus` enum with: 'valid', 'errors', 'warnings', 'not_validated'

**AC4: Integration Types**
- [ ] Extend `TableRow` type to include optional `_validationMetadata: RowValidationMetadata`
- [ ] Create `ValidationState` interface for Redux store integration
- [ ] Create utility type helpers for working with validation metadata

**Technical Requirements**
- All types must be properly exported and importable
- Use strict TypeScript settings with no `any` types
- Include JSDoc comments for all public interfaces
- Follow existing naming conventions in codebase

**Testing Requirements**
- [ ] Type-only tests to verify interface contracts
- [ ] Runtime type guard functions with 100% test coverage
- [ ] Integration tests with existing TableRow type
- [ ] All tests must pass: `npm run test lib/types/validation.test.ts`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing code style and formatting

---

## Ticket VS-002: Validation Engine Core Implementation

### Description
Build the core validation engine that can run validation rules against table data and generate validation results with metadata.

### Acceptance Criteria

**AC1: Validation Engine Class**
- [ ] Create `ValidationEngine` class in `lib/utils/validation-engine.ts`
- [ ] Implement `validateRow(row: TableRow, targetShape: TargetShape): ValidationResult` method
- [ ] Implement `validateTable(data: TableRow[], targetShape: TargetShape): ValidationState` method
- [ ] Implement `validateCell(value: any, field: TargetField, rowData: TableRow): ValidationResult` method

**AC2: Rule Registry System**
- [ ] Create `ValidationRuleRegistry` class to manage available validation rules
- [ ] Implement `registerRule(rule: ValidationRule): void` method
- [ ] Implement `getRule(ruleId: string): ValidationRule` method
- [ ] Implement `getRulesForField(field: TargetField): ValidationRule[]` method

**AC3: Base Rule Implementation**
- [ ] Create abstract `BaseValidationRule` class
- [ ] Implement `validate(value: any, field: TargetField, context: ValidationContext): ValidationResult` abstract method
- [ ] Include rule metadata: id, type, severity, description
- [ ] Include `createSuggestedFix(value: any, field: TargetField): SuggestedFix` method

**AC4: Performance Optimizations**
- [ ] Implement async validation with `validateTableAsync` method
- [ ] Add progress callback support for large datasets
- [ ] Include early exit optimization for valid data
- [ ] Cache validation results for unchanged data

**Technical Requirements**
- Engine must handle 10,000+ rows without blocking UI thread
- Validation rules must be pluggable and extensible
- Error handling for malformed input data
- Memory-efficient processing for large datasets

**Testing Requirements**
- [ ] Unit tests for ValidationEngine class methods with 100% coverage
- [ ] Integration tests with sample target shapes and data
- [ ] Performance tests with 10k+ row datasets (< 5s validation time)
- [ ] Error handling tests for edge cases (null data, missing fields)
- [ ] All tests must pass: `npm run test lib/utils/validation-engine.test.ts`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] JSDoc comments for all public methods

---

## Ticket VS-003: Required Field Validation Rule

### Description
Implement the required field validation rule that checks for empty/null/undefined values in fields marked as required in the target shape.

### Acceptance Criteria

**AC1: RequiredFieldRule Implementation**
- [ ] Create `RequiredFieldRule` class extending `BaseValidationRule`
- [ ] Rule ID: 'required-field'
- [ ] Rule type: 'required'
- [ ] Severity: 'error'
- [ ] Validate that required fields are not null, undefined, empty string, or whitespace-only

**AC2: Validation Logic**
- [ ] Return error for null values when field.required = true
- [ ] Return error for undefined values when field.required = true
- [ ] Return error for empty strings ("") when field.required = true
- [ ] Return error for whitespace-only strings ("   ") when field.required = true
- [ ] Return valid for non-empty values
- [ ] Skip validation when field.required = false

**AC3: Error Messages**
- [ ] Generate descriptive error message: "Field '{fieldName}' is required but is empty"
- [ ] Include field display name in error messages when available
- [ ] Provide contextual error messages based on field type

**AC4: Suggested Fixes**
- [ ] For text fields: suggest "Enter a value for {fieldName}"
- [ ] For enum fields: suggest first available option
- [ ] For date fields: suggest current date
- [ ] For number fields: suggest 0 or field minimum

**Technical Requirements**
- Handle all JavaScript falsy values appropriately
- Support custom empty value definitions per field type
- Integrate with existing target shape field definitions
- Performance optimized for batch validation

**Testing Requirements**
- [ ] Test required field validation with null values
- [ ] Test required field validation with undefined values
- [ ] Test required field validation with empty strings
- [ ] Test required field validation with whitespace-only strings
- [ ] Test optional field validation (should pass with empty values)
- [ ] Test error message generation for different field types
- [ ] Test suggested fix generation for different field types
- [ ] Performance test with 1000+ rows
- [ ] All tests must pass: `npm run test lib/utils/validation-rules/required-field.test.ts`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing validation rule patterns

---

## Ticket VS-004: Data Type Validation Rule

### Description
Implement data type validation that ensures values match the expected field types (string, number, integer, date, currency, etc.) defined in the target shape.

### Acceptance Criteria

**AC1: DataTypeRule Implementation**
- [ ] Create `DataTypeRule` class extending `BaseValidationRule`
- [ ] Rule ID: 'data-type'
- [ ] Rule type: 'type'
- [ ] Severity: 'error' for type mismatches
- [ ] Support all TargetField types: string, number, integer, date, currency, boolean, email, phone, url

**AC2: Type Validation Logic**
- [ ] String validation: accept any non-null value, convert to string
- [ ] Number validation: check for valid numeric values, allow decimals
- [ ] Integer validation: check for whole numbers only
- [ ] Date validation: validate date strings and Date objects
- [ ] Boolean validation: accept true/false, "true"/"false", "yes"/"no", 1/0
- [ ] Email validation: check email format pattern
- [ ] Phone validation: check phone number patterns
- [ ] URL validation: check valid URL format
- [ ] Currency validation: check numeric values with optional currency symbols

**AC3: Type Conversion Support**
- [ ] Attempt automatic type conversion before flagging errors
- [ ] String to number: "123" → 123
- [ ] String to date: "2023-12-25" → Date object
- [ ] String to boolean: "true" → true, "yes" → true
- [ ] Number to string: 123 → "123"
- [ ] Log conversion attempts in validation metadata

**AC4: Error Messages and Fixes**
- [ ] Generate specific error messages: "Expected {expectedType}, got {actualType}"
- [ ] Include current value and expected format in error message
- [ ] Suggest type conversion when possible: "Convert '123' to number?"
- [ ] Suggest format corrections: "Use format YYYY-MM-DD for dates"

**Technical Requirements**
- Use robust type checking (not just `typeof`)
- Handle edge cases: NaN, Infinity, invalid dates
- Support multiple date formats and locales
- Configurable validation strictness levels

**Testing Requirements**
- [ ] Test string type validation (pass/fail cases)
- [ ] Test number type validation including edge cases (NaN, Infinity)
- [ ] Test integer validation (reject decimals)
- [ ] Test date validation with multiple formats
- [ ] Test boolean validation with various input formats
- [ ] Test email format validation
- [ ] Test phone number format validation
- [ ] Test URL format validation
- [ ] Test currency validation with symbols
- [ ] Test automatic type conversion scenarios
- [ ] Test error message generation
- [ ] Test suggested fix generation
- [ ] All tests must pass: `npm run test lib/utils/validation-rules/data-type.test.ts`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Use existing utility functions where applicable

---

## Ticket VS-005: Enum Value Validation Rule

### Description
Implement enum value validation that checks if values are present in the allowed options list for enum field types.

### Acceptance Criteria

**AC1: EnumValueRule Implementation**
- [ ] Create `EnumValueRule` class extending `BaseValidationRule`
- [ ] Rule ID: 'enum-value'
- [ ] Rule type: 'enum'
- [ ] Severity: 'error' for invalid values, 'warning' for case mismatches
- [ ] Only validate fields where field.type === 'enum'

**AC2: Enum Validation Logic**
- [ ] Validate value exists in field.options array (exact match)
- [ ] Support both value and label matching
- [ ] Case-sensitive matching by default
- [ ] Case-insensitive matching with warning for case mismatches
- [ ] Handle null/empty values based on required field setting

**AC3: Fuzzy Matching**
- [ ] Implement fuzzy string matching for close matches
- [ ] Use Levenshtein distance for similarity scoring
- [ ] Suggest closest match when exact match fails
- [ ] Confidence threshold: suggest matches > 80% similarity
- [ ] Support partial matching for longer values

**AC4: Error Messages and Fixes**
- [ ] Generate error: "'{value}' is not a valid option for {fieldName}"
- [ ] List available options in error message (max 5)
- [ ] Suggest closest match: "Did you mean '{suggestedValue}'?"
- [ ] Provide quick fix to update value to suggested match
- [ ] Option to add new value to enum options list

**Technical Requirements**
- Integrate with existing EnumField and EnumOption types
- Efficient matching algorithm for large option lists
- Configurable similarity thresholds
- Support for dynamic enum updates

**Testing Requirements**
- [ ] Test exact value matching (pass/fail)
- [ ] Test exact label matching
- [ ] Test case-insensitive matching with warnings
- [ ] Test fuzzy matching with various similarity levels
- [ ] Test null/empty value handling
- [ ] Test error message generation with option lists
- [ ] Test suggested fix generation
- [ ] Test performance with large enum option lists (100+ options)
- [ ] Test non-enum field types are skipped
- [ ] All tests must pass: `npm run test lib/utils/validation-rules/enum-value.test.ts`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Reuse existing string similarity utilities

---

## Ticket VS-006: Redux Validation State Integration

### Description
Integrate validation metadata into Redux state management, extending tableSlice to store and manage validation results at row and cell levels.

### Acceptance Criteria

**AC1: Redux State Extension**
- [ ] Add `validationState: ValidationState` to tableSlice initial state
- [ ] Create `ValidationState` interface with: isValidating, lastValidated, errorCounts, warningCounts, validationResults
- [ ] Extend `TableRow` interface to include `_validationMetadata?: RowValidationMetadata`
- [ ] Add validation status to table summary statistics

**AC2: Validation Actions**
- [ ] Create `startValidation` action to set isValidating = true
- [ ] Create `completeValidation` action with ValidationResult payload
- [ ] Create `updateRowValidation` action for individual row updates
- [ ] Create `updateCellValidation` action for cell-level updates
- [ ] Create `clearValidation` action to reset validation state

**AC3: Validation Reducers**
- [ ] Implement reducer for `startValidation`: set loading state
- [ ] Implement reducer for `completeValidation`: update validation metadata
- [ ] Implement reducer for `updateRowValidation`: merge row-level results
- [ ] Implement reducer for `updateCellValidation`: update specific cell metadata
- [ ] Implement reducer for `clearValidation`: reset to initial state

**AC4: Async Validation Thunks**
- [ ] Create `validateTableAsync` thunk using ValidationEngine
- [ ] Create `validateRowAsync` thunk for individual row validation
- [ ] Create `revalidateAfterEdit` thunk triggered by cell updates
- [ ] Handle validation errors and dispatch appropriate actions
- [ ] Include progress callbacks for large dataset validation

**Technical Requirements**
- Maintain backward compatibility with existing table state
- Efficient state updates for large datasets
- Proper TypeScript typing for all actions and reducers
- Integration with existing persistence system

**Testing Requirements**
- [ ] Test validation state initialization
- [ ] Test startValidation action and reducer
- [ ] Test completeValidation action with sample validation results
- [ ] Test updateRowValidation with individual row updates
- [ ] Test updateCellValidation with cell-level updates
- [ ] Test clearValidation state reset
- [ ] Test validateTableAsync thunk with mock validation engine
- [ ] Test validateRowAsync thunk
- [ ] Test revalidateAfterEdit thunk integration
- [ ] Test state persistence with validation metadata
- [ ] All tests must pass: `npm run test lib/features/tableSlice.validation.test.ts`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing Redux Toolkit patterns

---

## Ticket VS-007: Validation Status UI Indicators

### Description
Create visual indicators to display validation status in the data table, including row and cell-level error/warning markers.

### Acceptance Criteria

**AC1: Row Status Indicators**
- [ ] Add validation status icon to row headers (leftmost column)
- [ ] Show red error icon for rows with validation errors
- [ ] Show yellow warning icon for rows with validation warnings
- [ ] Show green check icon for validated rows without issues
- [ ] Show gray question icon for unvalidated rows

**AC2: Cell Status Indicators**
- [ ] Add red border to cells with validation errors
- [ ] Add yellow border to cells with validation warnings
- [ ] Add red background highlight for severe errors
- [ ] Add validation indicator dots/icons within cells
- [ ] Ensure accessibility with proper color contrast

**AC3: Validation Summary Badge**
- [ ] Add validation summary to table header area
- [ ] Show total error count: "3 errors" with red styling
- [ ] Show total warning count: "5 warnings" with yellow styling
- [ ] Show validation progress: "Validated 120 of 150 rows"
- [ ] Click badge to toggle validation filter

**AC4: Tooltip Error Messages**
- [ ] Show validation error details on cell hover
- [ ] Display error message, rule type, and suggested fix
- [ ] Support multiple errors per cell with scrollable content
- [ ] Include "Fix" button in tooltip for quick resolution
- [ ] Accessible tooltip implementation with proper ARIA labels

**Technical Requirements**
- Integrate with existing table rendering system
- Performance optimized for tables with 1000+ rows
- Responsive design for mobile/tablet screens
- Consistent with existing UI design system

**Testing Requirements**
- [ ] Test row status icon rendering for all validation states
- [ ] Test cell border styling for errors and warnings
- [ ] Test validation summary badge with different error counts
- [ ] Test tooltip display with validation error details
- [ ] Test tooltip interaction and accessibility
- [ ] Test performance with large datasets (1000+ rows)
- [ ] Test responsive design on different screen sizes
- [ ] Visual regression tests for validation indicators
- [ ] All tests must pass: `npm run test components/validation-indicators.test.tsx`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing component patterns and styling

---

## Ticket VS-008: Error Filtering and Navigation

### Description
Implement filtering and navigation features to help users find and work through validation errors systematically.

### Acceptance Criteria

**AC1: Error Filter Toggle**
- [ ] Add "Show only errors" toggle button to table toolbar
- [ ] Filter table to show only rows with validation errors
- [ ] Update row count display: "Showing 15 of 150 rows (errors only)"
- [ ] Persist filter state in Redux store
- [ ] Clear filter when validation state changes

**AC2: Validation Status Filter**
- [ ] Add dropdown filter for validation status: "All", "Valid", "Errors", "Warnings", "Not Validated"
- [ ] Filter rows based on selected validation status
- [ ] Show row count for each filter option
- [ ] Support multiple status selection (e.g., "Errors" + "Warnings")
- [ ] Integrate with existing table filtering system

**AC3: Error Type Filter**
- [ ] Add filter dropdown for specific validation rule types
- [ ] Options: "Required Fields", "Data Types", "Enum Values", etc.
- [ ] Show error count for each rule type
- [ ] Support filtering by multiple rule types simultaneously
- [ ] Update filter based on available error types in current dataset

**AC4: Error Navigation Controls**
- [ ] Add "Previous Error" and "Next Error" navigation buttons
- [ ] Jump to next/previous row with validation errors
- [ ] Highlight current error row with distinct styling
- [ ] Show position indicator: "Error 3 of 12"
- [ ] Keyboard shortcuts: Ctrl+E (next error), Ctrl+Shift+E (previous error)

**Technical Requirements**
- Efficient filtering for large datasets (1000+ rows)
- Integration with existing table filtering and sorting
- Keyboard navigation support
- State persistence across page refreshes

**Testing Requirements**
- [ ] Test error filter toggle functionality
- [ ] Test validation status dropdown filtering
- [ ] Test error type filtering with different rule types
- [ ] Test error navigation between rows
- [ ] Test keyboard shortcuts for navigation
- [ ] Test filter state persistence
- [ ] Test performance with large datasets
- [ ] Test filter combinations (multiple filters active)
- [ ] Test accessibility of filter controls
- [ ] All tests must pass: `npm run test components/validation-filters.test.tsx`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Consistent with existing filter component patterns

---

## Ticket VS-009: Inline Error Resolution Interface

### Description
Create UI components for resolving validation errors directly within the table, including suggested fixes and quick actions.

### Acceptance Criteria

**AC1: Error Cell Editing Enhancement**
- [ ] Enhance EditableCell component to show validation status
- [ ] Display error message below input field when in edit mode
- [ ] Show suggested fix options as clickable buttons
- [ ] Apply suggested fix on button click and revalidate
- [ ] Show real-time validation feedback as user types

**AC2: Validation Error Panel**
- [ ] Create expandable side panel for detailed error view
- [ ] Show all validation errors for currently selected row
- [ ] Group errors by field with expand/collapse sections
- [ ] Include error description, rule type, and severity
- [ ] Provide fix actions for each error type

**AC3: Quick Fix Actions**
- [ ] "Apply Suggestion" button for recommended fixes
- [ ] "Mark as Exception" button to ignore specific errors
- [ ] "Fix All Similar" button for batch corrections
- [ ] "Edit Manually" option to open cell for custom editing
- [ ] Undo/redo support for fix actions

**AC4: Bulk Error Resolution**
- [ ] "Fix All Required Fields" action with suggested values
- [ ] "Convert All Types" action for data type corrections
- [ ] "Apply Enum Matches" action for enum value corrections
- [ ] Confirmation dialog for bulk actions
- [ ] Progress indicator for bulk operations

**Technical Requirements**
- Integration with existing editable cell system
- Real-time validation as user edits
- Efficient bulk operations for large datasets
- Undo/redo functionality for error fixes

**Testing Requirements**
- [ ] Test enhanced error cell editing with validation display
- [ ] Test validation error panel with multiple errors
- [ ] Test quick fix actions for different error types
- [ ] Test "Apply Suggestion" functionality
- [ ] Test "Mark as Exception" workflow
- [ ] Test "Fix All Similar" bulk operation
- [ ] Test bulk error resolution actions
- [ ] Test undo/redo functionality
- [ ] Test real-time validation during editing
- [ ] All tests must pass: `npm run test components/error-resolution.test.tsx`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Consistent with existing editing interface patterns

---

## Ticket VS-010: Validation Dashboard and Reporting

### Description
Build a validation dashboard that provides overview statistics, progress tracking, and export capabilities for validation results.

### Acceptance Criteria

**AC1: Validation Statistics Dashboard**
- [ ] Create ValidationDashboard component with key metrics
- [ ] Show total rows validated vs. remaining
- [ ] Display error count by validation rule type (chart/bars)
- [ ] Show warning count by field name
- [ ] Include validation completion percentage
- [ ] Real-time updates as errors are resolved

**AC2: Progress Tracking**
- [ ] Visual progress bar showing validation completion
- [ ] "Validation Score" metric (% of clean rows)
- [ ] Time-based progress tracking (errors resolved per hour)
- [ ] Goal setting: "Target: 95% clean data"
- [ ] Achievement badges for validation milestones

**AC3: Validation Report Export**
- [ ] Export validation summary as CSV file
- [ ] Include: Row ID, Field, Error Type, Message, Status
- [ ] Export detailed error report with suggested fixes
- [ ] PDF report generation with charts and summary
- [ ] Email report functionality (if email integration available)

**AC4: Historical Validation Tracking**
- [ ] Store validation history in localStorage
- [ ] Show validation trends over time
- [ ] Track improvements: "50% fewer errors than yesterday"
- [ ] Compare validation results across different datasets
- [ ] Data quality score trending

**Technical Requirements**
- Chart visualization using existing chart library
- Efficient data aggregation for dashboard metrics  
- Export functionality supporting multiple formats
- Local storage for historical data persistence

**Testing Requirements**
- [ ] Test validation statistics calculation and display
- [ ] Test progress tracking with real-time updates
- [ ] Test CSV export functionality with sample data
- [ ] Test PDF report generation
- [ ] Test historical validation tracking
- [ ] Test dashboard performance with large datasets
- [ ] Test chart rendering and interactivity
- [ ] Test data aggregation accuracy
- [ ] All tests must pass: `npm run test components/validation-dashboard.test.tsx`

**Lint Requirements**
- [ ] All code must pass: `npm run lint`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Follow existing dashboard/report component patterns

---

## Summary

**Total Tickets**: 10
**Estimated Development Time**: 6-8 weeks
**Test Coverage Requirement**: 90%+ for all validation components
**Performance Requirements**: 
- Validate 10k+ rows in <5 seconds
- UI remains responsive during validation
- Memory usage <500MB for large datasets

**Dependencies**:
- VS-001 → VS-002 (Types → Engine)
- VS-002 → VS-003, VS-004, VS-005 (Engine → Rules)
- VS-001, VS-002 → VS-006 (Types, Engine → Redux)
- VS-006 → VS-007, VS-008 (Redux → UI)
- VS-007 → VS-009 (UI Indicators → Resolution)
- VS-006, VS-007 → VS-010 (State, UI → Dashboard)

Each ticket includes specific acceptance criteria, technical requirements, comprehensive testing requirements, and lint/typecheck requirements to ensure high-quality, maintainable code.