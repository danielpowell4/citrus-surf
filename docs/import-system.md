# Import System Documentation

## Overview

The import system provides a unified, intelligent data import experience for the table playground. It supports multiple formats (JSON, CSV, TSV) with automatic format and delimiter detection, file upload with preview, and a streamlined user interface.

## Key Features

- **Auto-Detection**: Automatically detects data format (JSON vs CSV/TSV) and delimiter (comma vs tab)
- **Unified Interface**: Single textarea for both paste and file upload
- **File Preview**: File contents are loaded into textarea for editing before import
- **Smart Format Detection**: Uses file extension and content analysis
- **User Override**: Users can manually override auto-detected settings
- **Toast Notifications**: Clear feedback for all import operations

## Architecture

### Core Components

1. **Data Import Component** (`app/playground/data-import.tsx`)
   - Unified interface for paste and file upload
   - Auto-detection of format and delimiter
   - Real-time format switching
   - File content preview and editing

2. **Format Detection Logic**
   - File extension-based detection
   - Content-based JSON validation
   - Delimiter analysis for CSV/TSV

3. **CSV/TSV Parsing**
   - Robust parsing with quote handling
   - Support for both comma and tab delimiters
   - Header detection and processing

## How It Works

### Import Flow

The import process follows a streamlined workflow:

```typescript
// 1. User can paste data directly or click "Choose File"
<Textarea
  value={importData}
  onChange={handlePasteChange}
  placeholder="Paste CSV or TSV data here..."
/>

// 2. Auto-detection happens on input change
const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setImportData(value);

  // Auto-detect format
  const detectedFormat = detectFormat(value);
  setImportFormat(detectedFormat);

  if (detectedFormat === "csv") {
    const delimiter = detectDelimiter(value);
    setCsvDelimiter(delimiter);
  }
};
```

### Format Detection

The system uses a two-tier detection approach:

```typescript
const detectFormat = (content: string, filename?: string): "csv" | "json" => {
  // 1. Prefer file extension if available
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "json") return "json";
    if (["csv", "tsv", "txt"].includes(ext || "")) return "csv";
  }

  // 2. Try to parse as JSON array
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return "json";
  } catch {}

  // 3. Default to CSV/TSV
  return "csv";
};
```

### Delimiter Detection

For CSV/TSV data, the system analyzes the first line:

```typescript
const detectDelimiter = (content: string): "tab" | "comma" => {
  const firstLine = content.split("\n")[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  // Use whichever delimiter appears more frequently
  if (tabCount > commaCount) return "tab";
  return "comma";
};
```

## User Interface

### Unified Data Input

The interface provides a single, consistent way to input data:

```tsx
<div className="space-y-2">
  <div className="flex items-center gap-4">
    <Label htmlFor="importData">
      {importFormat === "json" ? "JSON Data" : "CSV/TSV Data"}
    </Label>
    <Button
      variant="outline"
      size="sm"
      onClick={() => fileInputRef.current?.click()}
    >
      <FileUp className="h-4 w-4" />
      Choose File
    </Button>
  </div>
  <Textarea
    id="importData"
    value={importData}
    onChange={handlePasteChange}
    placeholder="Paste CSV or TSV data here..."
  />
</div>
```

### Format Selection

Users can override auto-detected settings:

```tsx
<RadioGroup value={importFormat} onValueChange={setImportFormat}>
  <RadioGroupItem value="csv" id="csv" />
  <Label htmlFor="csv">CSV/TSV</Label>
  <RadioGroupItem value="json" id="json" />
  <Label htmlFor="json">JSON</Label>
</RadioGroup>
```

### Delimiter Selection

For CSV/TSV format, users can choose delimiter:

```tsx
<RadioGroup value={csvDelimiter} onValueChange={setCsvDelimiter}>
  <RadioGroupItem value="comma" id="comma" />
  <Label htmlFor="comma">Comma</Label>
  <RadioGroupItem value="tab" id="tab" />
  <Label htmlFor="tab">Tab</Label>
</RadioGroup>
```

## File Upload Process

### Step-by-Step Flow

1. **File Selection**: User clicks "Choose File" button
2. **Content Reading**: File contents are read as text
3. **Auto-Detection**: Format and delimiter are detected
4. **Textarea Population**: Contents are loaded into textarea
5. **User Review**: User can edit data before importing
6. **Import**: User clicks "Import Data" to process

```typescript
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    try {
      const content = await file.text();

      // Populate textarea with file contents
      setImportData(content);

      // Auto-detect format and delimiter
      const detectedFormat = detectFormat(content, file.name);
      setImportFormat(detectedFormat);

      if (detectedFormat === "csv") {
        const delimiter = detectDelimiter(content);
        setCsvDelimiter(delimiter);
      }

      // Auto-clear file selection after loading
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "File loaded",
        description: `"${file.name}" loaded into textarea. You can edit the data before importing.`,
      });
    } catch (error) {
      toast({
        title: "File read error",
        description: "Could not read the selected file",
        variant: "destructive",
      });
    }
  }
};
```

## Supported Formats

### JSON Format

- **File Extensions**: `.json`
- **Content**: Array of objects
- **Example**:

```json
[
  { "id": 1, "name": "John", "email": "john@example.com" },
  { "id": 2, "name": "Jane", "email": "jane@example.com" }
]
```

### CSV Format

- **File Extensions**: `.csv`, `.txt`
- **Delimiters**: Comma (`,`)
- **Headers**: Optional first row
- **Example**:

```csv
id,name,email
1,John,john@example.com
2,Jane,jane@example.com
```

### TSV Format

- **File Extensions**: `.tsv`, `.txt`
- **Delimiters**: Tab (`\t`)
- **Headers**: Optional first row
- **Example**:

```tsv
id	name	email
1	John	john@example.com
2	Jane	jane@example.com
```

## CSV/TSV Parsing

### Robust Field Handling

The parser handles various edge cases:

```typescript
const parseCsvLine = (line: string, delimiter: string): string[] => {
  // Handle empty lines
  if (!line.trim()) return [];

  if (delimiter === "\t") {
    return line.split("\t").map(field => field.trim());
  }

  // Handle comma-delimited with quotes
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i < line.length - 1 && line[i + 1] === '"') {
        current += '"'; // Handle escaped quotes
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};
```

### Header Processing

Headers are processed based on user preference:

```typescript
const startIndex = hasHeaders ? 1 : 0;
const headers = hasHeaders ? parseCsvLine(lines[0], delimChar) : [];

parsedData = lines.slice(startIndex).map(line => {
  const values = parseCsvLine(line, delimChar);
  if (hasHeaders) {
    const row: any = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || "";
    });
    return row;
  } else {
    return values;
  }
});
```

## Error Handling

### Comprehensive Error Management

The system provides clear feedback for various error scenarios:

```typescript
try {
  // Import logic
} catch (error) {
  console.error("Import error:", error);
  toast({
    title: "Import failed",
    description: error instanceof Error ? error.message : "Invalid data format",
    variant: "destructive",
  });
}
```

### Common Error Scenarios

1. **No Data**: Empty textarea or file
2. **Invalid JSON**: Malformed JSON structure
3. **Empty CSV**: No data rows found
4. **File Read Error**: Unable to read selected file
5. **Format Mismatch**: Data doesn't match selected format

## Toast Notifications

### Success Feedback

```typescript
toast({
  title: "Data imported successfully",
  description: `${parsedData.length} records imported`,
});
```

### Error Feedback

```typescript
toast({
  title: "Import failed",
  description: "Invalid data format",
  variant: "destructive",
});
```

### File Loading Feedback

```typescript
toast({
  title: "File loaded",
  description: `"${file.name}" loaded into textarea. You can edit the data before importing.`,
});
```

## Best Practices

### For Users

1. **Use Standard Formats**: Stick to common CSV/TSV/JSON formats
2. **Include Headers**: Use headers for better data organization
3. **Check Data**: Review data in textarea before importing
4. **Consistent Delimiters**: Use the same delimiter throughout your data

### For Developers

1. **Extend Format Detection**: Add new format detection logic to `detectFormat()`
2. **Add New Parsers**: Create new parsing functions for additional formats
3. **Enhance Error Messages**: Provide specific error messages for different failure modes
4. **Add Validation**: Implement data validation before import

## Future Enhancements

### Potential Improvements

1. **Excel Support**: Add `.xlsx` and `.xls` file support
2. **Data Validation**: Pre-import data validation and preview
3. **Bulk Import**: Support for multiple file imports
4. **Template Downloads**: Provide sample file templates
5. **Advanced Parsing**: Support for custom delimiters and formats
6. **Data Transformation**: Pre-import data cleaning and transformation

### Adding New Formats

To add support for a new format:

1. **Update `detectFormat()`**: Add detection logic for the new format
2. **Create Parser**: Implement parsing function for the new format
3. **Update UI**: Add format option to the radio group
4. **Add File Types**: Update `getAcceptedFileTypes()` function
5. **Update Documentation**: Add format details to this documentation

## Integration with Export System

The import system is designed to work seamlessly with the export system:

- **Format Compatibility**: Imported data can be exported in the same or different formats
- **Version Tracking**: Imported data integrates with the history system
- **Consistent Naming**: File naming conventions align with export system
- **Error Handling**: Consistent error handling across import and export operations

This creates a complete data lifecycle management system for the table playground.
