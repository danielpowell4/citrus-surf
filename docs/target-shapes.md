# Target Shapes System Documentation

## Overview

Target Shapes define the desired clean output format for data imports. They represent the "mold" or schema that raw data should be transformed into, providing a structured approach to data preparation workflows.

> **"What shape do you want your clean data to have?"**

Target Shapes enable users to:

- Define expected output schemas before importing data
- Map incoming data to consistent, validated formats
- Create reusable templates for common data structures
- Ensure data quality and consistency across imports

## Core Concepts

### Target Shape

A **Target Shape** is a complete specification of the desired output data structure, including:

- **Fields**: Individual data columns with types, validation rules, and transformations
- **Constraints**: Data quality rules and validation requirements
- **Metadata**: Name, description, version, and usage context

### Field Definition

Each field in a Target Shape defines:

- **Name**: The output column name
- **Type**: Data type (string, number, date, boolean, etc.)
- **Required**: Whether the field is mandatory
- **Validation**: Rules for data quality (regex, ranges, formats)
- **Transformation**: How to convert/clean the input data
- **Default**: Fallback value if data is missing

### Mapping Process

The mapping process transforms raw input data to match the Target Shape:

1. **Column Mapping**: Match input columns to target fields
2. **Type Conversion**: Convert data to required types
3. **Validation**: Apply data quality rules and constraints
4. **Transformation**: Clean and format data
5. **Output**: Generate data matching the target shape

## Target Shape Structure

### Basic Structure

```typescript
interface TargetShape {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  fields: TargetField[];
  metadata: {
    category: string;
    tags: string[];
    usage: string;
  };
}

interface TargetField {
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
```

### Field Types

```typescript
type FieldType =
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
```

### Validation Rules

```typescript
interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "format" | "custom";
  value: any;
  message: string;
  severity: "error" | "warning" | "info";
}

// Examples:
{
  type: "pattern",
  value: "^[A-Z]{2}\\d{2}[A-Z0-9]{10,30}$",
  message: "Must be a valid IBAN format",
  severity: "error"
}
```

### Transformation Rules

```typescript
interface TransformationRule {
  type: "trim" | "uppercase" | "lowercase" | "replace" | "extract" | "format" | "custom";
  parameters: Record<string, any>;
  order: number;
}

// Examples:
{
  type: "replace",
  parameters: { search: "\\s+", replace: " " },
  order: 1
}
```

## Example Target Shapes

### Customer Database Shape

```typescript
{
  id: "customer-db-v1",
  name: "Customer Database",
  description: "Standard customer record format for CRM import",
  version: "1.0.0",
  fields: [
    {
      id: "customer_id",
      name: "Customer ID",
      type: "string",
      required: true,
      validation: [
        { type: "pattern", value: "^CUST-\\d{6}$", message: "Must be CUST-XXXXXX format" }
      ]
    },
    {
      id: "email",
      name: "Email Address",
      type: "email",
      required: true,
      validation: [
        { type: "pattern", value: "^[^@]+@[^@]+\\.[^@]+$", message: "Invalid email format" }
      ],
      transformation: [
        { type: "lowercase", parameters: {}, order: 1 },
        { type: "trim", parameters: {}, order: 2 }
      ]
    },
    {
      id: "full_name",
      name: "Full Name",
      type: "string",
      required: true,
      transformation: [
        { type: "trim", parameters: {}, order: 1 },
        { type: "replace", parameters: { search: "\\s+", replace: " " }, order: 2 }
      ]
    },
    {
      id: "phone",
      name: "Phone Number",
      type: "phone",
      required: false,
      transformation: [
        { type: "replace", parameters: { search: "[^\\d+]", replace: "" }, order: 1 }
      ]
    },
    {
      id: "status",
      name: "Status",
      type: "enum",
      required: true,
      defaultValue: "active",
      validation: [
        { type: "enum", value: ["active", "inactive", "pending"], message: "Invalid status" }
      ]
    }
  ]
}
```

### Product Catalog Shape

```typescript
{
  id: "product-catalog-v1",
  name: "Product Catalog",
  description: "E-commerce product data format",
  version: "1.0.0",
  fields: [
    {
      id: "sku",
      name: "SKU",
      type: "string",
      required: true,
      validation: [
        { type: "pattern", value: "^[A-Z0-9]{6,12}$", message: "SKU must be 6-12 alphanumeric characters" }
      ]
    },
    {
      id: "name",
      name: "Product Name",
      type: "string",
      required: true,
      transformation: [
        { type: "trim", parameters: {}, order: 1 },
        { type: "replace", parameters: { search: "\\s+", replace: " " }, order: 2 }
      ]
    },
    {
      id: "price",
      name: "Price",
      type: "currency",
      required: true,
      validation: [
        { type: "min", value: 0, message: "Price must be positive" }
      ],
      transformation: [
        { type: "format", parameters: { precision: 2, currency: "USD" }, order: 1 }
      ]
    },
    {
      id: "category",
      name: "Category",
      type: "string",
      required: true,
      transformation: [
        { type: "uppercase", parameters: {}, order: 1 }
      ]
    }
  ]
}
```

## User Workflow

### 1. Define Target Shape

Users start by defining what their clean data should look like:

```typescript
// User creates or selects a target shape
const targetShape = {
  name: "Employee Records",
  fields: [
    { name: "employee_id", type: "string", required: true },
    { name: "full_name", type: "string", required: true },
    { name: "email", type: "email", required: true },
    { name: "department", type: "string", required: true },
    { name: "salary", type: "currency", required: false },
  ],
};
```

### 2. Import Raw Data

Users import their messy data:

```csv
emp_id,first_name,last_name,email_addr,dept,sal
E001,John,Doe,john.doe@company.com,Engineering,75000
E002,Jane,Smith,jane.smith@company.com,Marketing,65000
```

### 3. Map to Target Shape

The system helps map input columns to target fields:

```typescript
const mapping = {
  emp_id: "employee_id",
  "first_name + last_name": "full_name", // Transformation needed
  email_addr: "email",
  dept: "department",
  sal: "salary",
};
```

### 4. Apply Transformations

Transformations are applied to match the target shape:

```typescript
// Transform first_name + last_name to full_name
const fullNameTransform = row => {
  return `${row.first_name} ${row.last_name}`.trim();
};

// Transform salary to currency format
const salaryTransform = row => {
  return parseFloat(row.sal).toFixed(2);
};
```

### 5. Validate Output

Data is validated against the target shape rules:

```typescript
const validation = {
  employee_id: { required: true, pattern: "^E\\d{3}$" },
  email: { required: true, format: "email" },
  salary: { min: 0, type: "number" },
};
```

### 6. Export Clean Data

Final output matches the target shape exactly:

```csv
employee_id,full_name,email,department,salary
E001,John Doe,john.doe@company.com,Engineering,75000.00
E002,Jane Smith,jane.smith@company.com,Marketing,65000.00
```

## Implementation Considerations

### Storage

- **Local Storage**: Target shapes stored in browser localStorage
- **Future**: Database persistence for team sharing
- **Versioning**: Support for multiple versions of shapes

### UI Components

- **Shape Editor**: Visual editor for creating/editing target shapes
- **Shape Selector**: Dropdown to choose from available shapes
- **Mapping Interface**: Drag-and-drop column mapping
- **Validation Preview**: Real-time validation feedback

### Performance

- **Lazy Loading**: Load shapes on demand
- **Caching**: Cache frequently used shapes
- **Incremental Validation**: Validate as user types

### Extensibility

- **Custom Validators**: User-defined validation functions
- **Custom Transformers**: User-defined transformation functions
- **Shape Templates**: Pre-built shapes for common use cases
- **Shape Sharing**: Export/import shapes between users

## Benefits

### For Users

- **Consistency**: Ensures all imports follow the same format
- **Quality**: Built-in validation prevents bad data
- **Efficiency**: Reusable shapes save time
- **Clarity**: Clear expectations for data format

### For Developers

- **Maintainability**: Centralized data format definitions
- **Testing**: Easy to test data transformations
- **Documentation**: Self-documenting data schemas
- **Integration**: Predictable data formats for APIs

## Future Enhancements

### Advanced Features

- **Conditional Fields**: Fields that appear based on other field values
- **Nested Objects**: Support for complex data structures
- **Cross-Field Validation**: Validation rules that reference multiple fields
- **Data Lineage**: Track how data was transformed

### Integration

- **API Integration**: Direct import to external systems
- **Database Schemas**: Generate database schemas from shapes
- **API Documentation**: Generate API docs from shapes
- **Testing**: Generate test data from shapes

### Collaboration

- **Team Sharing**: Share shapes across team members
- **Version Control**: Track changes to shapes over time
- **Approval Workflows**: Require approval for shape changes
- **Usage Analytics**: Track which shapes are used most
