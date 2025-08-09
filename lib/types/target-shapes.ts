// Core Target Shape Types

/**
 * Represents a complete data transformation schema that defines how to process
 * and validate incoming data. A Target Shape includes field definitions, validation
 * rules, and transformation logic.
 *
 * @example
 * ```typescript
 * const employeeShape: TargetShape = {
 *   id: 'emp_001',
 *   name: 'Employee Import',
 *   version: '1.0.0',
 *   createdAt: '2024-01-01T00:00:00Z',
 *   updatedAt: '2024-01-01T00:00:00Z',
 *   fields: [
 *     { id: 'emp_id', name: 'employee_id', type: 'string', required: true },
 *     { id: 'dept', name: 'department', type: 'lookup', required: false, ... }
 *   ]
 * };
 * ```
 */
export interface TargetShape {
  /** Unique identifier for the target shape */
  id: string;
  /** Human-readable name for the target shape */
  name: string;
  /** Optional description explaining the purpose and usage */
  description?: string;
  /** Version string following semantic versioning (e.g., '1.2.0') */
  version: string;
  /** ISO 8601 timestamp when the shape was created */
  createdAt: string;
  /** ISO 8601 timestamp when the shape was last modified */
  updatedAt: string;
  /** Array of field definitions that make up the shape */
  fields: TargetField[];
  /** Optional metadata for categorization and organization */
  metadata?: {
    /** Category for grouping related shapes */
    category?: string;
    /** Tags for searchability and filtering */
    tags?: string[];
    /** Usage context or notes */
    usage?: string;
  };
}

/**
 * Defines a single field within a target shape, including its type, validation rules,
 * and transformation logic. Fields are the building blocks of data processing schemas.
 *
 * @example
 * ```typescript
 * const emailField: TargetField = {
 *   id: 'user_email',
 *   name: 'email_address',
 *   type: 'email',
 *   required: true,
 *   validation: [
 *     { type: 'format', value: 'email', message: 'Must be a valid email', severity: 'error' }
 *   ],
 *   transformation: [
 *     { type: 'trim', parameters: {}, order: 1 },
 *     { type: 'lowercase', parameters: {}, order: 2 }
 *   ]
 * };
 * ```
 */
export interface TargetField {
  /** Unique identifier for the field within the shape */
  id: string;
  /** Field name that corresponds to data column names */
  name: string;
  /** The data type that determines validation and processing behavior */
  type: FieldType;
  /** Whether this field must have a non-empty value */
  required: boolean;
  /** Human-readable description of the field's purpose */
  description?: string;
  /** Array of validation rules to apply to field values */
  validation?: ValidationRule[];
  /** Array of transformation rules to apply during processing */
  transformation?: TransformationRule[];
  /** Default value to use when no value is provided */
  defaultValue?: any;
  /** Additional metadata for field configuration */
  metadata?: {
    /** Source system or column mapping information */
    source?: string;
    /** Business rule or constraint description */
    dataRule?: string;
    /** Example value to help users understand expected format */
    example?: string;
  };
}

// Field Types
export type FieldType =
  | "string"
  | "number"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "phone"
  | "url"
  | "currency"
  | "percentage"
  | "enum"
  | "array"
  | "object"
  | "lookup";

// Validation Rules
export interface ValidationRule {
  type:
    | "required"
    | "min"
    | "max"
    | "pattern"
    | "format"
    | "enum"
    | "custom"
    | "lookup_enum"
    | "lookup_confidence"
    | "lookup_reference";
  value: any;
  message: string;
  severity: "error" | "warning" | "info";
  // Lookup-specific validation properties
  referenceFile?: string;
  confidenceThreshold?: number;
  suggestions?: string[];
  availableOptions?: string[];
  referenceSource?: string;
}

// Transformation Rules
export interface TransformationRule {
  type:
    | "trim"
    | "uppercase"
    | "lowercase"
    | "replace"
    | "extract"
    | "format"
    | "custom";
  parameters: Record<string, any>;
  order: number;
}

// Shape Template (for pre-built shapes)
export interface ShapeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  shape: Omit<TargetShape, "id" | "createdAt" | "updatedAt">;
}

// Lookup Field Types

/**
 * Defines how to match input values against reference data columns.
 * This configuration determines which columns to compare and what values to return.
 *
 * @example
 * ```typescript
 * const deptMatch: LookupMatch = {
 *   on: 'dept_name',        // Match against department names
 *   get: 'dept_id',         // Return department ID as the value
 *   show: 'dept_full_name'  // Display full department name in UI
 * };
 * ```
 */
export interface LookupMatch {
  /** Column name in reference data to match input values against */
  on: string;
  /** Column name in reference data to return as the lookup result */
  get: string;
  /** Optional column name to display in UI (defaults to 'get' column) */
  show?: string;
}

/**
 * Configuration for fuzzy/smart matching capabilities that can find approximate
 * matches when exact matches fail. Helps handle typos and variations in data.
 *
 * @example
 * ```typescript
 * const smartConfig: SmartMatching = {
 *   enabled: true,
 *   confidence: 0.8  // 80% similarity required for fuzzy matches
 * };
 * ```
 */
export interface SmartMatching {
  /** Whether to enable fuzzy matching for approximate matches */
  enabled: boolean;
  /** Minimum similarity score (0-1) required to accept a fuzzy match */
  confidence: number;
}

/**
 * Defines an additional field to derive from reference data when a lookup succeeds.
 * This allows enriching data with multiple related values from the same lookup.
 *
 * @example
 * ```typescript
 * const managerField: DerivedField = {
 *   name: 'department_manager',  // New field name in output
 *   source: 'manager_name',      // Source column from reference data
 *   type: 'string'              // Optional type specification
 * };
 * ```
 */
export interface DerivedField {
  /** Name of the new field to create in the output data */
  name: string;
  /** Column name in reference data to pull the value from */
  source: string;
  /** Optional type specification for the derived field */
  type?: FieldType;
}

/**
 * Specialized field type that performs lookups against reference data to enrich
 * and validate input values. Supports exact matching, fuzzy matching, and automatic
 * data enrichment with related values.
 *
 * @example
 * ```typescript
 * const departmentLookup: LookupField = {
 *   id: 'dept_lookup',
 *   name: 'department',
 *   type: 'lookup',
 *   required: false,
 *   referenceFile: 'departments.csv',
 *   match: {
 *     on: 'dept_name',
 *     get: 'dept_id'
 *   },
 *   alsoGet: [
 *     { name: 'manager', source: 'manager_name' },
 *     { name: 'budget', source: 'annual_budget', type: 'currency' }
 *   ],
 *   smartMatching: {
 *     enabled: true,
 *     confidence: 0.8
 *   },
 *   onMismatch: 'warning',
 *   showReferenceInfo: true
 * };
 * ```
 */
export interface LookupField extends TargetField {
  /** Always 'lookup' for lookup field types */
  type: "lookup";
  /** Identifier or path to the reference data file */
  referenceFile: string;
  /** Configuration for how to match and return values */
  match: LookupMatch;
  /** Additional fields to derive from the same reference row */
  alsoGet?: DerivedField[];
  /** Fuzzy matching configuration */
  smartMatching: SmartMatching;
  /** How to handle values that don't match any reference data */
  onMismatch: "error" | "warning" | "null";
  /** Whether to show reference data information in the UI */
  showReferenceInfo?: boolean;
  /** Whether to allow inline editing of reference data */
  allowReferenceEdit?: boolean;
}

// Shape Selection/Creation Options
export interface ShapeSelection {
  type: "saved" | "template" | "new";
  savedShapeId?: string;
  templateId?: string;
  newShape?: Omit<TargetShape, "id" | "createdAt" | "updatedAt">;
}
