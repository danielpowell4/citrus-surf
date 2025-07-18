// Core Target Shape Types

export interface TargetShape {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
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
  | "object";

// Validation Rules
export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "format" | "enum" | "custom";
  value: any;
  message: string;
  severity: "error" | "warning" | "info";
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

// Shape Selection/Creation Options
export interface ShapeSelection {
  type: "saved" | "template" | "new";
  savedShapeId?: string;
  templateId?: string;
  newShape?: Omit<TargetShape, "id" | "createdAt" | "updatedAt">;
}
