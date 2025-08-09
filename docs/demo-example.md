# Smart Column Naming Demo

## Overview

The new smart column naming system makes reference data lookups much more intuitive for demos and everyday use. Here's what's improved:

## 🎯 Smart Column Naming

### Before

```csv
employee,department  →  employee,department,manager,budget,location
John,Engineering    →  John,ENG001,Sarah Johnson,500000,Building A
```

- Derived columns had generic names: `manager`, `budget`, `location`
- No clear relationship to the original lookup

### After

```csv
employee,department  →  employee,department,department_manager,department_budget,department_location
John,Engineering    →  John,ENG001,Sarah Johnson,$500,000,Building A
```

- **Context-aware naming**: `department_manager`, `department_budget`, `department_location`
- **Smart descriptions**: "Manager responsible for this department"
- **Value formatting**: Numbers display as currency where appropriate

## 🚀 Demo Templates

Click "Demo Data" when setting up lookups to choose from pre-built templates:

### 🏢 Company Departments

```csv
dept_name,dept_code,manager,budget,location,headcount
Engineering,ENG001,Sarah Johnson,500000,Building A,25
Marketing,MKT001,Mike Chen,250000,Building B,12
```

### 📦 Product Catalog

```csv
product_name,sku,category,price,supplier,warranty
MacBook Pro 16",MBP16-2024,Electronics,2499,Apple Inc.,1 year
iPhone 15 Pro,IP15P-128,Electronics,999,Apple Inc.,1 year
```

### 🇺🇸 US States & Regions

```csv
state_name,state_code,region,capital,population,timezone
California,CA,West,Sacramento,39538223,Pacific
Texas,TX,South,Austin,29145505,Central
```

## ✨ Interactive Preview

Before applying lookups, see exactly what columns will be created:

```
✨ Lookup Preview
Your data will be enriched with:
🔍 department → dept_code (lookup result)
🔗 department_manager (from reference data)
🔗 department_budget (from reference data)
🔗 department_location (from reference data)

Example transformation:
"Engineering" becomes:
├─ dept_code: "ENG001"
├─ department_manager: "Sarah Johnson"
├─ department_budget: "$500,000"
└─ department_location: "Building A"
```

## 🎪 Demo Script

1. **Start**: Upload employee data with department names
2. **Show Problem**: "We need department codes and manager info"
3. **Click Demo Data**: Choose "🏢 Company Departments"
4. **Auto-Magic**: Template auto-configures the lookup with smart names
5. **Show Preview**: Point out the clear column relationships
6. **Apply**: Watch data get enriched with meaningful column names
7. **Result**: Clean, professional output that makes sense

## Why This Matters

### For Demos

- **Instant credibility**: Professional, realistic data relationships
- **Clear value prop**: Users immediately see what they're getting
- **No cognitive load**: Column names are self-explanatory

### For Users

- **Faster setup**: Demo templates + auto-configuration
- **Better understanding**: Preview shows exactly what will happen
- **Cleaner output**: Context-aware naming makes data more professional

## Technical Implementation

### Smart Naming Algorithm

1. **Respect explicit names**: If user sets a name, use it
2. **Context awareness**: `department` + `manager` = `department_manager`
3. **Avoid redundancy**: `product_price` stays `product_price` (not `product_product_price`)
4. **Clean naming**: Remove prefixes like `ref_`, `tbl_`, suffixes like `_id`, `_name`

### Demo Template Structure

```typescript
interface DemoTemplate {
  id: string;
  name: string; // "🏢 Company Departments"
  description: string; // Clear explanation
  data: Record<string, any>[]; // Realistic sample data
  suggestedLookups: Array<{
    matchOn: string; // "dept_name"
    returnField: string; // "dept_code"
    alsoGet: string[]; // ["manager", "budget", "location"]
    useCase: string; // "Convert names to codes and get info"
  }>;
}
```

This creates a much more "grok'able" experience for demos and everyday use!
