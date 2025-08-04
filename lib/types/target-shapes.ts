// Core Target Shape Types

export interface TargetShape {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  fields: TargetField[];
  metadata?: {
    category?: string;
    tags?: string[];
    usage?: string;
  };
}

export interface TargetField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  description?: string;
  validation?: ValidationRule[];
  transformation?: TransformationRule[];
  defaultValue?: any;
  metadata?: {
    source?: string;
    dataRule?: string;
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
  type: "required" | "min" | "max" | "pattern" | "format" | "enum" | "custom" | "lookup_enum" | "lookup_confidence" | "lookup_reference";
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
export interface LookupMatch {
  on: string;      // Column to match against
  get: string;     // Column to return as value
  show?: string;   // Column to display (optional)
}

export interface SmartMatching {
  enabled: boolean;
  confidence: number; // 0-1 threshold for fuzzy matching
}

export interface DerivedField {
  name: string;    // Name of the derived column
  source: string;  // Source column from reference data
  type?: FieldType; // Optional type specification
}

export interface LookupField extends TargetField {
  type: "lookup";
  referenceFile: string;           // Path or identifier for reference data
  match: LookupMatch;              // Matching configuration
  alsoGet?: DerivedField[];        // Additional columns to derive
  smartMatching: SmartMatching;    // Fuzzy matching settings
  onMismatch: "error" | "warning" | "null"; // Behavior for unmatched values
  showReferenceInfo?: boolean;     // Show reference data info in UI
  allowReferenceEdit?: boolean;    // Allow editing reference data inline
}

// Shape Selection/Creation Options
export interface ShapeSelection {
  type: "saved" | "template" | "new";
  savedShapeId?: string;
  templateId?: string;
  newShape?: Omit<TargetShape, "id" | "createdAt" | "updatedAt">;
}
