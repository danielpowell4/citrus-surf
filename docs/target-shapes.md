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
  createdAt: string; // ISO 8601 string (e.g., "2024-07-24T14:33:54.443Z")
  updatedAt: string; // ISO 8601 string (e.g., "2024-07-24T14:33:54.443Z")
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
  | "object"
  | "lookup";
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

### Lookup Fields (Cross-Sheet Enrichment)

**Lookup fields** provide VLOOKUP-style functionality to enrich data by referencing other files or datasets. They automatically match input values against reference data and return corresponding values, plus optionally derive additional columns.

#### Lookup Field Structure

```typescript
interface LookupField extends TargetField {
  type: "lookup";
  referenceFile: string;              // Reference data source
  match: {
    on: string;                       // Column to match against
    get: string;                      // Column to return as value
    show?: string;                    // Column to display (optional)
  };
  alsoGet?: DerivedField[];           // Additional columns to derive
  smartMatching: {
    enabled: boolean;                 // Enable fuzzy matching
    confidence: number;               // Match confidence threshold (0-1)
  };
  onMismatch: "error" | "warning" | "null"; // Behavior when no match found
  showReferenceInfo?: boolean;        // Show reference data info in UI
  allowReferenceEdit?: boolean;       // Allow editing reference data inline
}

interface DerivedField {
  name: string;                       // Name of the derived column
  source: string;                     // Source column from reference data
  type?: FieldType;                   // Optional type specification
}
```

#### Example: Employee Department Lookup

**Input Data** (`employees.csv`):
```csv
name,department_name,salary
John Doe,Engineering,75000
Jane Smith,Marketing,65000
Bob Wilson,Enginering,80000
```

**Reference Data** (`departments.csv`):
```csv
dept_name,dept_id,budget_code,manager
Engineering,ENG001,TECH-001,Sarah Johnson
Marketing,MKT001,SALES-001,Mike Chen
HR,HR001,ADMIN-001,Lisa Wong
```

**Target Shape Configuration**:
```typescript
{
  id: "department_lookup",
  name: "Department",
  type: "lookup",
  referenceFile: "departments.csv",
  match: {
    on: "dept_name",                  // Match input "Engineering"
    get: "dept_id",                   // Return "ENG001"
    show: "dept_name"                 // Display "Engineering" in UI
  },
  alsoGet: [                            // Also derive these columns
    { name: "budget_code", source: "budget_code", type: "string" },
    { name: "manager", source: "manager", type: "string" }
  ],
  smartMatching: {
    enabled: true,                    // Handle "Enginering" → "Engineering"
    confidence: 0.85                  // 85% similarity threshold
  },
  onMismatch: "error"                 // Fail on unmatched values
}
```

**Result**: Input data is enriched with department IDs, budget codes, and manager names automatically.

#### Smart Matching Features

Lookup fields include intelligent matching to handle real-world data inconsistencies:

1. **Exact Match** → Perfect matches processed first
2. **Normalized Match** → Auto-trim whitespace, case-insensitive matching
3. **Fuzzy Match** → Similarity scoring for near-matches (e.g., "Enginering" → "Engineering")
4. **Confidence Reporting** → Shows match quality for review

#### Validation Integration

Lookup fields automatically generate enum validation rules from reference data:

```typescript
// Auto-generated validation based on reference file
validation: [{
  type: "enum",
  value: ["Engineering", "Marketing", "HR"], // Extracted from reference
  message: "Department not found in lookup table",
  severity: "error"
}]
```

#### Use Cases

- **Employee Data**: Department names → Department IDs + budget codes
- **Product Catalog**: Category names → Category IDs + hierarchies  
- **Customer Import**: Account names → Account IDs + territories
- **Inventory**: Supplier names → Supplier IDs + contact info

#### Benefits Over Excel VLOOKUP

- ✅ **No formulas required** - point and click configuration
- ✅ **Smart matching** - handles typos and variations automatically  
- ✅ **Multiple derived columns** - get many related values at once
- ✅ **Error highlighting** - clear visual feedback for issues
- ✅ **Confidence scoring** - review questionable matches
- ✅ **Auto-validation** - reference data creates validation rules

#### Data Table Behavior

**Lookup Field Editability**:
- **Source column** (the matched input) → **Editable** with dropdown of reference values
- **Derived columns** (from `alsoGet`) → **Read-only**, automatically updated when source changes
- **Smart validation** → Invalid entries show fuzzy match suggestions

**Example Table View**:
```
| Name      | Department ↓     | Dept ID      | Budget Code   |
|-----------|------------------|--------------|---------------|
| John Doe  | [Engineering ▼]  | ENG001       | TECH-001      |
| Jane      | [Marketing ▼]    | MKT001       | SALES-001     |
```

**Interaction Patterns**:
- **Department column**: Dropdown with reference values + fuzzy search
- **Dept ID & Budget Code**: Gray/disabled, auto-update when Department changes
- **Invalid entry**: Shows "Did you mean Engineering?" suggestion
- **New value**: Can type new department, triggers validation warning

**Column Dependencies**:
```typescript
// When user changes department_name:
department_name: "Engineering" → triggers lookup → updates:
- dept_id: "ENG001" 
- budget_code: "TECH-001"
- manager: "Sarah Johnson"
```

**Reference Data Inspector**:
- **Info icon** (ℹ️) next to lookup fields → Shows available options popup
- **"View Reference Data"** link → Opens reference file in new tab/modal
- **"Edit Reference Data"** button → Allows inline editing of lookup values
- **Source indicator** → Shows "From: departments.csv" for transparency

**Example UI**:
```
Department [Engineering ▼] ℹ️
  ↳ Popup shows:
    Available options: Engineering, Marketing, HR, Finance
    Source: departments.csv (23 rows)
    [View Reference Data] [Edit Values]
```

## User Workflow

### 1. Import Raw Data

Users start by importing their messy data:

```csv
emp_id,first_name,last_name,email_addr,dept,sal
E001,John,Doe,john.doe@company.com,Engineering,75000
E002,Jane,Smith,jane.smith@company.com,Marketing,65000
```

### 2. Define Target Shape

Users either select an existing saved shape or create a new one using a visual, no-code interface:

**Choose Your Approach:**

- **Use Saved Shape**: Pick from your previously created target shapes
- **Start from Template**: Begin with a pre-built template (Customer, Product, Employee)
- **Create New**: Build a custom shape from scratch

**Visual Template Builder (for new shapes):**

- **Add Fields**: Click "Add Field" to add new columns
- **Field Types**: Select from dropdown (string, email, number, date, etc.)
- **Validation**: Toggle required fields, add format rules
- **Preview**: See the target structure as you build

**No Code Required:**

- Drag-and-drop field reordering
- Visual validation rule builder
- Save shapes for future use
- Real-time preview of target structure

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

- **Visual Template Builder**: No-code interface for creating target shapes
  - Drag-and-drop field management
  - Visual validation rule builder
  - Real-time preview of target structure
  - Template library with common shapes
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

## Working with Date Fields

### Date Storage Format

Target Shape metadata uses ISO 8601 strings for `createdAt` and `updatedAt` fields:

```typescript
{
  id: "user-profile-v1",
  name: "User Profile",
  createdAt: "2024-07-24T14:33:54.443Z", // ISO 8601 string
  updatedAt: "2024-07-24T15:20:31.256Z", // ISO 8601 string
  // ... rest of shape
}
```

### Benefits of ISO Strings

- **Redux Serialization**: Compatible with Redux state management
- **JSON Safe**: Easily serialized/deserialized for storage and APIs
- **Timezone Aware**: Includes timezone information (UTC)
- **Standard Format**: Follows international standards

### Converting for Display

When displaying dates in the UI, convert ISO strings to Date objects:

```typescript
// For user-friendly display
const displayDate = new Date(targetShape.createdAt).toLocaleDateString();
// Result: "7/24/2024"

// For detailed timestamps
const displayTimestamp = new Date(targetShape.updatedAt).toLocaleString();
// Result: "7/24/2024, 3:20:31 PM"

// For relative time (with a library like date-fns)
import { formatDistanceToNow } from "date-fns";
const relativeTime = formatDistanceToNow(new Date(targetShape.updatedAt));
// Result: "2 hours ago"
```

### Creating New Shapes

When creating new target shapes, the system automatically sets ISO string dates:

```typescript
// In targetShapesStorage.save()
const newShape: TargetShape = {
  ...shape,
  id: generateShapeId(),
  createdAt: new Date().toISOString(), // Automatically set
  updatedAt: new Date().toISOString(), // Automatically set
};
```

### Updating Shapes

When updating existing shapes, `updatedAt` is automatically refreshed:

```typescript
// In targetShapesStorage.update()
shapes[index] = {
  ...shapes[index],
  ...updates,
  updatedAt: new Date().toISOString(), // Auto-updated
};
```

This approach ensures consistent date handling across the application while maintaining Redux compatibility and following web standards.

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
