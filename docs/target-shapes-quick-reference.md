# Target Shapes Quick Reference

## What Are Target Shapes?

Target Shapes define the **desired output format** for your data imports. Think of them as "molds" that your messy data gets poured into to create clean, consistent results.

## Quick Start

### 1. Create a Target Shape

```typescript
const customerShape = {
  name: "Customer Records",
  fields: [
    { name: "customer_id", type: "string", required: true },
    { name: "email", type: "email", required: true },
    { name: "full_name", type: "string", required: true },
    { name: "status", type: "enum", defaultValue: "active" },
  ],
};
```

### 2. Map Your Data

```typescript
// Input: messy CSV with different column names
// Output: clean data matching your shape
const mapping = {
  cust_id: "customer_id",
  email_addr: "email",
  "first_name + last_name": "full_name",
  customer_status: "status",
};
```

### 3. Get Clean Output

```csv
customer_id,email,full_name,status
C001,john@example.com,John Doe,active
C002,jane@example.com,Jane Smith,active
```

## Common Field Types

| Type       | Description   | Example              |
| ---------- | ------------- | -------------------- |
| `string`   | Plain text    | "John Doe"           |
| `email`    | Email address | "john@example.com"   |
| `phone`    | Phone number  | "+1-555-123-4567"    |
| `number`   | Numeric value | 42.50                |
| `currency` | Money amount  | $1,234.56            |
| `date`     | Date only     | 2024-01-15           |
| `datetime` | Date + time   | 2024-01-15T10:30:00Z |
| `boolean`  | True/false    | true                 |
| `enum`     | From list     | "active", "inactive" |

## Validation Rules

```typescript
// Required field
{ type: "required", value: true, message: "This field is required" }

// Pattern matching (regex)
{ type: "pattern", value: "^[A-Z]{2}\\d{6}$", message: "Must be 2 letters + 6 digits" }

// Numeric range
{ type: "min", value: 0, message: "Must be positive" }
{ type: "max", value: 100, message: "Must be 100 or less" }

// Enum validation
{ type: "enum", value: ["active", "inactive"], message: "Invalid status" }
```

## Transformation Rules

```typescript
// Trim whitespace
{ type: "trim", parameters: {}, order: 1 }

// Convert case
{ type: "uppercase", parameters: {}, order: 1 }
{ type: "lowercase", parameters: {}, order: 1 }

// Replace text
{ type: "replace", parameters: { search: "\\s+", replace: " " }, order: 1 }

// Format currency
{ type: "format", parameters: { precision: 2, currency: "USD" }, order: 1 }
```

## Example Shapes

### Employee Database

```typescript
{
  name: "Employee Records",
  fields: [
    { name: "employee_id", type: "string", required: true },
    { name: "full_name", type: "string", required: true },
    { name: "email", type: "email", required: true },
    { name: "department", type: "string", required: true },
    { name: "salary", type: "currency", required: false },
    { name: "hire_date", type: "date", required: true }
  ]
}
```

### Product Catalog

```typescript
{
  name: "Product Catalog",
  fields: [
    { name: "sku", type: "string", required: true },
    { name: "name", type: "string", required: true },
    { name: "price", type: "currency", required: true },
    { name: "category", type: "string", required: true },
    { name: "in_stock", type: "boolean", defaultValue: true }
  ]
}
```

### Customer Database

```typescript
{
  name: "Customer Database",
  fields: [
    { name: "customer_id", type: "string", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "phone", required: false },
    { name: "status", type: "enum", defaultValue: "active" },
    { name: "created_at", type: "datetime", required: true }
  ]
}
```

## Workflow Steps

1. **Import Data** → Upload your messy CSV/JSON
2. **Define Shape** → Pick saved shape or create new one (Visual, no-code builder)
3. **Map Columns** → Match input columns to target fields
4. **Apply Rules** → Transform and validate data
5. **Export Clean** → Get data in your desired format

## Benefits

- ✅ **Consistency** - All imports follow the same format
- ✅ **Quality** - Built-in validation prevents bad data
- ✅ **Efficiency** - Reusable shapes save time
- ✅ **Clarity** - Clear expectations for data format

## Tips

- Start with simple shapes and add complexity over time
- Use descriptive field names that match your data language
- Include validation rules to catch data quality issues early
- Create templates for common data types (customers, products, etc.)
- Version your shapes to track changes over time
