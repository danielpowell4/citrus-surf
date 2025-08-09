# Lookup Fields User Guide

## Overview

Lookup fields provide Excel VLOOKUP-style functionality with intelligent matching, automatic data enrichment, and transparent reference data management. This eliminates the complexity of Excel formulas while providing superior error handling and user experience.

## Quick Start

### 1. Upload Reference Data

Before creating lookup fields, you need reference data to look up against:

1. Navigate to **Reference Data Management** (from the main menu)
2. Click **Upload Reference Data**
3. Choose your CSV or JSON file containing the lookup data
4. Review the data preview and click **Upload**

**Example Reference Data (departments.csv):**

```csv
dept_id,dept_name,manager,budget
ENG001,Engineering,Sarah Johnson,500000
MKT001,Marketing,Mike Chen,250000
HR001,Human Resources,Lisa Wong,150000
```

### 2. Create a Lookup Field

1. In the **Template Builder**, add a new field
2. Select **Lookup** as the field type
3. Choose your reference file from the dropdown
4. Configure the matching:
   - **Match On**: Column to compare your data against (e.g., `dept_name`)
   - **Return Value**: Column to use as the result (e.g., `dept_id`)

### 3. Process Your Data

1. Import your data file containing values to look up
2. Apply your template with the lookup field
3. The system will automatically:
   - Match exact values instantly
   - Suggest fuzzy matches for similar values
   - Enrich your data with additional columns

## Features

### Exact Matching

The system first attempts exact matches against your reference data:

**Input Data:**

```csv
employee,department
John Smith,Engineering
Jane Doe,Marketing
```

**Result:**

```csv
employee,department
John Smith,ENG001
Jane Doe,MKT001
```

### Fuzzy Matching

When exact matches fail, the system uses intelligent fuzzy matching:

**Input Data:**

```csv
employee,department
Bob Wilson,Engineer
Alice Brown,Mkting
```

**Fuzzy Matches Found:**

- `Engineer` → `Engineering` (95% confidence)
- `Mkting` → `Marketing` (90% confidence)

You'll be prompted to review and approve these matches.

### Data Enrichment

Automatically add related information from your reference data:

**Configuration:**

- Match: `dept_name` → `dept_id`
- Also Get: `manager`, `budget`

**Result:**

```csv
employee,department,manager,budget
John Smith,ENG001,Sarah Johnson,500000
Jane Doe,MKT001,Mike Chen,250000
```

### Reference Data Management

#### Viewing Reference Data

1. Click the **info icon** (ⓘ) next to any lookup field
2. View reference data contents, statistics, and column information
3. See upload date, file size, and row count

#### Editing Reference Data

1. Navigate to **Reference Data Management**
2. Find your reference file and click **Edit**
3. Add, modify, or delete rows directly
4. Changes automatically apply to all lookup fields using this data

#### Supported Formats

- **CSV files**: Most common format, auto-detected delimiter
- **JSON files**: Array of objects with consistent structure
- **Excel files**: First sheet only, headers in first row

## Advanced Features

### Smart Matching Configuration

Control how fuzzy matching works:

```typescript
// High precision (fewer false positives)
smartMatching: {
  enabled: true,
  confidence: 0.9  // 90% similarity required
}

// More lenient (catches more variations)
smartMatching: {
  enabled: true,
  confidence: 0.7  // 70% similarity required
}
```

### Error Handling Options

Choose how to handle unmatched values:

- **Error**: Stop processing, require manual resolution
- **Warning**: Continue processing, flag for review
- **Null**: Set empty value, continue processing

### Multiple Derived Fields

Extract multiple values from the same lookup:

```typescript
alsoGet: [
  { name: "manager", source: "manager_name" },
  { name: "budget", source: "annual_budget" },
  { name: "location", source: "office_location" },
];
```

## Best Practices

### Reference Data Quality

1. **Consistent Naming**: Use consistent spelling and formatting
2. **Unique Keys**: Ensure lookup columns have unique, identifiable values
3. **Complete Data**: Include all possible values your data might contain
4. **Regular Updates**: Keep reference data current and accurate

### Field Configuration

1. **Clear Naming**: Use descriptive names for lookup fields
2. **Appropriate Confidence**: Set fuzzy matching confidence based on data quality
3. **Error Handling**: Choose appropriate mismatch behavior for your use case
4. **Documentation**: Add descriptions to explain complex lookups

### Performance Optimization

1. **File Size**: Keep reference files reasonable (< 10MB recommended)
2. **Row Count**: Optimize for < 10,000 reference rows for best performance
3. **Column Selection**: Only include necessary columns in reference data
4. **Batch Processing**: Process large datasets in smaller chunks

## Common Use Cases

### 1. Department Code Lookup

**Scenario**: Convert department names to standardized codes

```csv
# Reference Data (departments.csv)
dept_name,dept_code,cost_center
Engineering,ENG,4100
Marketing,MKT,3200
Sales,SLS,3100
```

**Configuration**:

- Match On: `dept_name`
- Return: `dept_code`
- Also Get: `cost_center`

### 2. Product Categorization

**Scenario**: Assign categories and pricing to products

```csv
# Reference Data (products.csv)
product_name,category,price_tier,supplier
MacBook Pro,Electronics,Premium,Apple
iPhone 15,Electronics,Premium,Apple
Office Chair,Furniture,Standard,Steelcase
```

**Configuration**:

- Match On: `product_name`
- Return: `category`
- Also Get: `price_tier`, `supplier`

### 3. Geographic Enrichment

**Scenario**: Add region and timezone information to locations

```csv
# Reference Data (locations.csv)
city,state,region,timezone,country_code
New York,NY,Northeast,EST,US
Los Angeles,CA,West,PST,US
Chicago,IL,Midwest,CST,US
```

**Configuration**:

- Match On: `city`
- Return: `region`
- Also Get: `timezone`, `country_code`

## Troubleshooting

### Common Issues

#### "No matches found"

- **Cause**: Input values don't match reference data
- **Solution**: Check spelling, enable fuzzy matching, or update reference data

#### "Multiple matches found"

- **Cause**: Reference data has duplicate entries
- **Solution**: Clean reference data to ensure unique lookup values

#### "Reference data not found"

- **Cause**: Reference file was deleted or moved
- **Solution**: Re-upload reference data or update lookup configuration

#### "Low confidence matches"

- **Cause**: Fuzzy matching threshold too strict or data quality issues
- **Solution**: Lower confidence threshold or clean input data

### Performance Issues

#### Slow lookup processing

- **Cause**: Large reference files or complex matching
- **Solution**: Reduce reference data size, simplify matching logic

#### High memory usage

- **Cause**: Processing very large datasets
- **Solution**: Process data in smaller batches, close other applications

### Data Quality Issues

#### Inconsistent results

- **Cause**: Reference data changes between processing runs
- **Solution**: Version control reference data, document changes

#### Missing derived fields

- **Cause**: Source columns missing from reference data
- **Solution**: Verify reference data structure, update field configuration

## Support

### Getting Help

1. **In-App Help**: Click the help icon (?) in any lookup configuration screen
2. **Documentation**: Reference the developer documentation for technical details
3. **Error Messages**: Read error messages carefully - they provide specific guidance

### Reporting Issues

When reporting issues, include:

1. **Steps to reproduce** the problem
2. **Sample data** (anonymized if sensitive)
3. **Error messages** or screenshots
4. **Expected vs actual behavior**

---

_This guide covers the core functionality of lookup fields. For advanced technical integration details, see the [Developer Documentation](./lookup-fields-developer-guide.md)._
