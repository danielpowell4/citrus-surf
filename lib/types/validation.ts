/**
 * Core validation system types and interfaces
 * 
 * This module defines the foundational TypeScript types for the validation system,
 * including validation rules, results, metadata, and integration types.
 * 
 * @module lib/types/validation
 */

/**
 * Enumeration of supported validation rule types
 */
export enum ValidationRuleType {
  /** Validates that required fields are not empty */
  REQUIRED = 'required',
  /** Validates that values match the expected data type */
  TYPE = 'type',
  /** Validates that values are within allowed enum options */
  ENUM = 'enum',
  /** Validates that values exist in lookup reference data */
  LOOKUP = 'lookup',
  /** Validates that values match expected format patterns */
  FORMAT = 'format',
  /** Validates that values are within specified ranges */
  RANGE = 'range',
}

/**
 * Enumeration of validation severity levels
 */
export enum ValidationSeverity {
  /** Critical issues that prevent data processing */
  ERROR = 'error',
  /** Non-critical issues that should be reviewed */
  WARNING = 'warning',
}

/**
 * Enumeration of validation status for rows and cells
 */
export enum ValidationStatus {
  /** Data passes all validation rules */
  VALID = 'valid',
  /** Data has validation errors */
  ERRORS = 'errors',
  /** Data has validation warnings */
  WARNINGS = 'warnings',
  /** Data has not been validated yet */
  NOT_VALIDATED = 'not_validated',
}

/**
 * Represents a suggested fix for a validation error
 */
export interface SuggestedFix {
  /** Type of fix action to perform */
  action: 'replace' | 'convert' | 'format' | 'add_option' | 'mark_exception';
  /** Human-readable description of the suggested fix */
  description: string;
  /** The new value to apply (for replace/convert/format actions) */
  newValue?: any;
  /** Additional metadata for the fix */
  metadata?: {
    /** Confidence level of the suggestion (0-1) */
    confidence?: number;
    /** Source of the suggestion (e.g., 'fuzzy_match', 'type_conversion') */
    source?: string;
    /** Additional context for the fix */
    context?: Record<string, any>;
  };
}

/**
 * Represents a validation error with details and suggested fixes
 */
export interface ValidationError {
  /** Unique identifier for the validation rule that generated this error */
  ruleId: string;
  /** Type of validation rule */
  ruleType: ValidationRuleType;
  /** Human-readable error message */
  message: string;
  /** Field name where the error occurred */
  fieldName: string;
  /** Current value that caused the error */
  currentValue: any;
  /** Suggested fixes for resolving the error */
  suggestedFixes: SuggestedFix[];
  /** Additional metadata about the error */
  metadata?: {
    /** Confidence level of the error detection (0-1) */
    confidence?: number;
    /** Additional context about the error */
    context?: Record<string, any>;
  };
}

/**
 * Represents a validation warning with details and suggested improvements
 */
export interface ValidationWarning {
  /** Unique identifier for the validation rule that generated this warning */
  ruleId: string;
  /** Type of validation rule */
  ruleType: ValidationRuleType;
  /** Human-readable warning message */
  message: string;
  /** Field name where the warning occurred */
  fieldName: string;
  /** Current value that caused the warning */
  currentValue: any;
  /** Suggested fixes for addressing the warning */
  suggestedFixes: SuggestedFix[];
  /** Additional metadata about the warning */
  metadata?: {
    /** Confidence level of the warning detection (0-1) */
    confidence?: number;
    /** Additional context about the warning */
    context?: Record<string, any>;
  };
}

/**
 * Configuration for a validation rule
 */
export interface ValidationRule {
  /** Unique identifier for the validation rule */
  id: string;
  /** Type of validation rule */
  type: ValidationRuleType;
  /** Severity level of validation failures */
  severity: ValidationSeverity;
  /** Target field name this rule applies to */
  field: string;
  /** Human-readable description of what the rule validates */
  message: string;
  /** Optional suggested fix message template */
  suggestedFix?: string;
  /** Additional configuration specific to the rule type */
  config?: Record<string, any>;
  /** Whether this rule is enabled */
  enabled?: boolean;
}

/**
 * Result of running validation on a single value, cell, row, or table
 */
export interface ValidationResult {
  /** Whether the validation passed without errors */
  isValid: boolean;
  /** List of validation errors found */
  errors: ValidationError[];
  /** List of validation warnings found */
  warnings: ValidationWarning[];
  /** Metadata about the validation process */
  metadata: {
    /** When the validation was performed */
    validatedAt: string;
    /** Version of the validation system used */
    validationVersion: string;
    /** Duration of validation in milliseconds */
    duration?: number;
    /** Number of rules that were applied */
    rulesApplied?: number;
  };
}

/**
 * Validation metadata stored at the cell level
 */
export interface CellValidationMetadata {
  /** ID of the row containing this cell */
  rowId: string;
  /** Name of the field/column */
  fieldName: string;
  /** Whether this cell has validation errors */
  hasErrors: boolean;
  /** Whether this cell has validation warnings */
  hasWarnings: boolean;
  /** List of validation errors for this cell */
  errors: ValidationError[];
  /** List of validation warnings for this cell */
  warnings: ValidationWarning[];
  /** Suggested fixes for this cell */
  suggestedFixes: SuggestedFix[];
  /** When this cell was last validated */
  lastValidated: string;
  /** Additional metadata */
  metadata?: {
    /** Whether validation was skipped for this cell */
    skipped?: boolean;
    /** Reason validation was skipped */
    skipReason?: string;
  };
}

/**
 * Validation metadata stored at the row level
 */
export interface RowValidationMetadata {
  /** Unique identifier for the row */
  rowId: string;
  /** Whether this row has any validation errors */
  hasErrors: boolean;
  /** Whether this row has any validation warnings */
  hasWarnings: boolean;
  /** Total number of validation errors in this row */
  errorCount: number;
  /** Total number of validation warnings in this row */
  warningCount: number;
  /** When this row was last validated */
  lastValidated: string;
  /** Overall validation status for this row */
  status: ValidationStatus;
  /** Cell-level validation metadata */
  cells?: Record<string, CellValidationMetadata>;
  /** Additional metadata */
  metadata?: {
    /** Whether validation was skipped for this row */
    skipped?: boolean;
    /** Reason validation was skipped */
    skipReason?: string;
    /** Validation rule IDs that were applied to this row */
    rulesApplied?: string[];
  };
}

/**
 * Overall validation state for a table/dataset
 */
export interface ValidationState {
  /** Whether validation is currently in progress */
  isValidating: boolean;
  /** When the last validation was completed */
  lastValidated?: string;
  /** Total number of validation errors across all rows */
  totalErrors: number;
  /** Total number of validation warnings across all rows */
  totalWarnings: number;
  /** Number of rows that have been validated */
  validatedRows: number;
  /** Total number of rows in the dataset */
  totalRows: number;
  /** Breakdown of error counts by validation rule type */
  errorsByType: Record<ValidationRuleType, number>;
  /** Breakdown of warning counts by validation rule type */
  warningsByType: Record<ValidationRuleType, number>;
  /** Breakdown of error counts by field name */
  errorsByField: Record<string, number>;
  /** Breakdown of warning counts by field name */
  warningsByField: Record<string, number>;
  /** Current validation progress (0-1) */
  progress: number;
  /** Validation results summary */
  summary?: {
    /** Overall validation score (0-1, higher is better) */
    score: number;
    /** Percentage of rows that are completely valid */
    validRowPercentage: number;
    /** Most common error types */
    topErrorTypes: Array<{
      type: ValidationRuleType;
      count: number;
      percentage: number;
    }>;
    /** Fields with the most errors */
    problematicFields: Array<{
      fieldName: string;
      errorCount: number;
      warningCount: number;
    }>;
  };
}

/**
 * Context information passed to validation rules during execution
 */
export interface ValidationContext {
  /** The complete row data being validated */
  rowData: Record<string, any>;
  /** The target field definition being validated against */
  fieldDefinition: any; // Will be TargetField when available
  /** Additional context data */
  context?: Record<string, any>;
  /** Reference to other validation results for cross-field validation */
  otherResults?: ValidationResult[];
}

/**
 * Type guard to check if a value is a ValidationError
 */
export function isValidationError(value: any): value is ValidationError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ruleId' in value &&
    'ruleType' in value &&
    'message' in value &&
    'fieldName' in value &&
    'currentValue' in value &&
    'suggestedFixes' in value &&
    Object.values(ValidationRuleType).includes(value.ruleType)
  );
}

/**
 * Type guard to check if a value is a ValidationWarning
 */
export function isValidationWarning(value: any): value is ValidationWarning {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ruleId' in value &&
    'ruleType' in value &&
    'message' in value &&
    'fieldName' in value &&
    'currentValue' in value &&
    'suggestedFixes' in value &&
    Object.values(ValidationRuleType).includes(value.ruleType)
  );
}

/**
 * Type guard to check if a value is a ValidationResult
 */
export function isValidationResult(value: any): value is ValidationResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.isValid === 'boolean' &&
    Array.isArray(value.errors) &&
    Array.isArray(value.warnings) &&
    typeof value.metadata === 'object' &&
    value.metadata !== null &&
    typeof value.metadata.validatedAt === 'string'
  );
}

/**
 * Type guard to check if a value is RowValidationMetadata
 */
export function isRowValidationMetadata(value: any): value is RowValidationMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rowId' in value &&
    'hasErrors' in value &&
    'hasWarnings' in value &&
    'errorCount' in value &&
    'warningCount' in value &&
    'lastValidated' in value &&
    'status' in value &&
    Object.values(ValidationStatus).includes(value.status)
  );
}

/**
 * Type guard to check if a value is CellValidationMetadata
 */
export function isCellValidationMetadata(value: any): value is CellValidationMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rowId' in value &&
    'fieldName' in value &&
    'hasErrors' in value &&
    'hasWarnings' in value &&
    'lastValidated' in value &&
    Array.isArray(value.errors) &&
    Array.isArray(value.warnings) &&
    Array.isArray(value.suggestedFixes)
  );
}

/**
 * Utility type for extending TableRow with validation metadata
 */
export interface TableRowWithValidation extends Record<string, any> {
  /** Validation metadata for this row */
  _validationMetadata?: RowValidationMetadata;
}

/**
 * Creates an empty ValidationState
 */
export function createEmptyValidationState(): ValidationState {
  return {
    isValidating: false,
    totalErrors: 0,
    totalWarnings: 0,
    validatedRows: 0,
    totalRows: 0,
    errorsByType: {
      [ValidationRuleType.REQUIRED]: 0,
      [ValidationRuleType.TYPE]: 0,
      [ValidationRuleType.ENUM]: 0,
      [ValidationRuleType.LOOKUP]: 0,
      [ValidationRuleType.FORMAT]: 0,
      [ValidationRuleType.RANGE]: 0,
    },
    warningsByType: {
      [ValidationRuleType.REQUIRED]: 0,
      [ValidationRuleType.TYPE]: 0,
      [ValidationRuleType.ENUM]: 0,
      [ValidationRuleType.LOOKUP]: 0,
      [ValidationRuleType.FORMAT]: 0,
      [ValidationRuleType.RANGE]: 0,
    },
    errorsByField: {},
    warningsByField: {},
    progress: 0,
  };
}

/**
 * Creates an empty ValidationResult
 */
export function createEmptyValidationResult(): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      validatedAt: new Date().toISOString(),
      validationVersion: '1.0.0',
    },
  };
}

/**
 * Creates RowValidationMetadata from ValidationResult
 */
export function createRowMetadata(
  rowId: string,
  result: ValidationResult
): RowValidationMetadata {
  const hasErrors = result.errors.length > 0;
  const hasWarnings = result.warnings.length > 0;
  
  let status: ValidationStatus;
  if (hasErrors) {
    status = ValidationStatus.ERRORS;
  } else if (hasWarnings) {
    status = ValidationStatus.WARNINGS;
  } else {
    status = ValidationStatus.VALID;
  }

  return {
    rowId,
    hasErrors,
    hasWarnings,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    lastValidated: result.metadata.validatedAt,
    status,
  };
}