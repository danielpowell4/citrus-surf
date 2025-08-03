# Column Types Quick Reference

## Overview

This is a quick reference guide for all supported column types in the editable cell system.

## Text Input

```typescript
meta: {
  editable: {
    type: 'text',
    placeholder?: string,    // Optional placeholder text
    maxLength?: number       // Optional character limit
  }
}
```

**Use cases**: Names, emails, descriptions, any text data

## Number Input

```typescript
meta: {
  editable: {
    type: 'number',
    min?: number,                    // Optional minimum value
    max?: number,                    // Optional maximum value
    step?: number,                   // Optional step increment
    precision?: 'integer' | 'float', // Number precision
    decimalPlaces?: number           // Optional decimal places for display
  }
}
```

**Use cases**: Ages, quantities, scores, any numeric data

**Examples**:

- Integer only: `{ precision: 'integer', min: 0, max: 100 }`
- Float with 2 decimals: `{ precision: 'float', decimalPlaces: 2 }`

## Currency Input

```typescript
meta: {
  editable: {
    type: 'currency',
    currency?: 'USD' | 'EUR' | 'GBP', // Currency type
    min?: number,                      // Optional minimum value
    max?: number,                      // Optional maximum value
    step?: number,                     // Optional step increment
    precision?: 'integer' | 'float',   // Number precision
    decimalPlaces?: number             // Optional decimal places for display
  }
}
```

**Use cases**: Salaries, prices, costs, any monetary values

**Examples**:

- USD salary: `{ currency: 'USD', precision: 'integer' }`
- EUR price: `{ currency: 'EUR', precision: 'float', decimalPlaces: 2 }`

## Date Input

```typescript
meta: {
  editable: {
    type: 'date',
    format?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY', // Display format
    min?: string,  // Optional minimum date (YYYY-MM-DD)
    max?: string   // Optional maximum date (YYYY-MM-DD)
  }
}
```

**Use cases**: Birth dates, start dates, due dates, any date data

**Examples**:

- US format: `{ format: 'MM/DD/YYYY' }`
- ISO format: `{ format: 'YYYY-MM-DD' }`
- With range: `{ format: 'MM/DD/YYYY', min: '2020-01-01', max: '2030-12-31' }`

## Select Dropdown

```typescript
meta: {
  editable: {
    type: 'select',
    options: Array<{ value: string; label: string }> // Available options
  }
}
```

**Use cases**: Categories, statuses, departments, any predefined choices

**Examples**:

```typescript
{
  type: 'select',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' }
  ]
}
```

## Lookup Input

```typescript
meta: {
  editable: {
    type: 'lookup',
    referenceFile: string,              // Reference data source
    match: {
      on: string,                       // Column to match against
      get: string,                      // Column to return as value
      show?: string                     // Column to display (optional)
    },
    alsoGet?: string[],                 // Additional columns to derive
    smartMatching?: {
      enabled: boolean,                 // Enable fuzzy matching
      confidence: number                // Match confidence threshold (0-1)
    }
  }
}
```

**Use cases**: Department lookups, category references, any cross-sheet data enrichment

**Examples**:

```typescript
{
  type: 'lookup',
  referenceFile: 'departments.csv',
  match: {
    on: 'dept_name',
    get: 'dept_id',
    show: 'dept_name'
  },
  alsoGet: ['budget_code', 'manager'],
  smartMatching: {
    enabled: true,
    confidence: 0.85
  }
}
```

## Non-Editable

```typescript
meta: {
  editable: false;
}
```

**Use cases**: IDs, calculated fields, read-only data

## Complete Example

```typescript
const columns = [
  {
    accessorKey: "id",
    header: "ID",
    meta: { editable: false }, // Read-only
  },
  {
    accessorKey: "name",
    header: "Name",
    meta: {
      editable: {
        type: "text",
        placeholder: "Enter full name",
        maxLength: 100,
      },
    },
  },
  {
    accessorKey: "age",
    header: "Age",
    meta: {
      editable: {
        type: "number",
        min: 0,
        max: 120,
        precision: "integer",
      },
    },
  },
  {
    accessorKey: "salary",
    header: "Salary",
    meta: {
      editable: {
        type: "currency",
        currency: "USD",
        min: 0,
        precision: "integer",
      },
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    meta: {
      editable: {
        type: "date",
        format: "MM/DD/YYYY",
      },
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      editable: {
        type: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      },
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    meta: {
      editable: {
        type: "lookup",
        referenceFile: "departments.csv",
        match: {
          on: "dept_name",
          get: "dept_id",
          show: "dept_name"
        },
        alsoGet: ["budget_code"],
        smartMatching: {
          enabled: true,
          confidence: 0.85
        }
      },
    },
  },
];
```

## TypeScript Interfaces

```typescript
// Base interface
interface BaseColumnConfig {
  type: "text" | "number" | "currency" | "date" | "select" | "lookup";
}

// Specific interfaces
interface TextColumnConfig extends BaseColumnConfig {
  type: "text";
  placeholder?: string;
  maxLength?: number;
}

interface NumberColumnConfig extends BaseColumnConfig {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  precision?: "integer" | "float";
  decimalPlaces?: number;
}

interface CurrencyColumnConfig extends BaseColumnConfig {
  type: "currency";
  currency?: "USD" | "EUR" | "GBP";
  min?: number;
  max?: number;
  step?: number;
  precision?: "integer" | "float";
  decimalPlaces?: number;
}

interface DateColumnConfig extends BaseColumnConfig {
  type: "date";
  format?: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  min?: string;
  max?: string;
}

interface SelectColumnConfig extends BaseColumnConfig {
  type: "select";
  options: Array<{ value: string; label: string }>;
}

interface LookupColumnConfig extends BaseColumnConfig {
  type: "lookup";
  referenceFile: string;
  match: {
    on: string;
    get: string;
    show?: string;
  };
  alsoGet?: string[];
  smartMatching?: {
    enabled: boolean;
    confidence: number;
  };
}

// Union type
type ColumnConfig =
  | TextColumnConfig
  | NumberColumnConfig
  | CurrencyColumnConfig
  | DateColumnConfig
  | SelectColumnConfig
  | LookupColumnConfig;
```

## Best Practices

1. **Choose the right type** for your data
2. **Set appropriate constraints** (min/max values, character limits)
3. **Use meaningful placeholders** for text inputs
4. **Provide clear labels** for select options
5. **Consider user experience** when setting step values and precision
6. **Test edge cases** with your validation rules

## Common Patterns

### Currency Fields

```typescript
{ type: 'currency', currency: 'USD', precision: 'integer' }
```

### Percentage Fields

```typescript
{ type: 'number', min: 0, max: 100, precision: 'float', decimalPlaces: 2 }
```

### Email Fields

```typescript
{ type: 'text', placeholder: 'Enter email address', maxLength: 255 }
```

### Status Fields

```typescript
{
  type: 'select',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Review' }
  ]
}
```

### Department Lookup Fields

```typescript
{
  type: 'lookup',
  referenceFile: 'departments.csv',
  match: {
    on: 'dept_name',
    get: 'dept_id'
  },
  alsoGet: ['budget_code', 'manager'],
  smartMatching: { enabled: true, confidence: 0.85 }
}
```
