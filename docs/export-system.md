# Export System Documentation

## Overview

The export system provides comprehensive data export capabilities for the table playground, supporting multiple formats with enhanced user feedback. It features a 2-step interaction pattern similar to the theme toggle, with toast notifications for success/failure feedback.

## Architecture

### Core Components

1. **Export Dropdown Component** (`components/export-dropdown.tsx`)
   - 2-step interaction: Export button → Format selection
   - Toast notifications for user feedback
   - Integration with history system for version tracking

2. **CSV Export Utilities** (`lib/utils/csv-export.ts`)
   - CSV conversion with proper field escaping
   - Filename generation with version and timestamp
   - File download functionality with error handling

3. **Toast Notification System** (`@/components/ui/use-toast`)
   - Success feedback with filename confirmation
   - Error handling for different failure scenarios
   - Validation feedback for edge cases

## How It Works

### Export Flow

The export process follows a clear 2-step interaction pattern:

```typescript
// 1. User clicks Export button
<Button variant="outline" size="sm">
  <Download className="h-4 w-4" />
  Export
  <ChevronDown className="h-4 w-4" />
</Button>

// 2. User selects format from dropdown
<DropdownMenuItem onClick={handleExportJson}>
  <FileJson className="mr-2 h-4 w-4" />
  JSON
</DropdownMenuItem>
<DropdownMenuItem onClick={handleExportCsv}>
  <FileText className="mr-2 h-4 w-4" />
  CSV
</DropdownMenuItem>
```

### Toast Notification System

The system provides comprehensive feedback through toast notifications:

```typescript
// Success notification
toast({
  title: "Export successful",
  description: `JSON file "${filename}" has been downloaded`,
});

// Error notification
toast({
  title: "Export failed",
  description: "Failed to export JSON file. Please try again.",
  variant: "destructive",
});

// Validation notification
toast({
  title: "No data to export",
  description: "Please add some data to the table before exporting.",
  variant: "destructive",
});
```

### Filename Generation

Files are named with version and timestamp information:

```typescript
// Format: {baseName}_v{version}_{timestamp}.{extension}
// Examples:
// table-data_v5_2025-07-13_20-00-22.csv
// table-data_v3_2025-07-13_20-00-22.json

export function generateFilename(
  baseName: string,
  extension: string,
  version?: number
): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19); // Remove milliseconds and timezone

  const versionSuffix = version !== undefined ? `_v${version}` : "";

  return `${baseName}${versionSuffix}_${timestamp}.${extension}`;
}
```

## Adding New Export Formats

### Step 1: Add Format to Export Dropdown

```typescript
// In components/export-dropdown.tsx
import { FileExcel } from "lucide-react"; // Add new icon

// Add new handler
const handleExportExcel = () => {
  if (!data || data.length === 0) {
    toast({
      title: "No data to export",
      description: "Please add some data to the table before exporting.",
      variant: "destructive",
    });
    return;
  }

  try {
    const excelContent = convertToExcel(data); // Your conversion function
    const filename = generateFilename("table-data", "xlsx", currentVersion);
    downloadFile(excelContent, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    toast({
      title: "Export successful",
      description: `Excel file "${filename}" has been downloaded`,
    });

    setIsOpen(false);
  } catch (error) {
    console.error("Excel export error:", error);
    toast({
      title: "Export failed",
      description: "Failed to export Excel file. Please try again.",
      variant: "destructive",
    });
  }
};

// Add to dropdown menu
<DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
  <FileExcel className="mr-2 h-4 w-4" />
  Excel
</DropdownMenuItem>
```

### Step 2: Create Export Utility Function

```typescript
// In lib/utils/excel-export.ts (new file)
export function convertToExcel(data: Record<string, any>[]): string {
  // Your Excel conversion logic
  // Return Excel-compatible content
}

export function downloadExcelFile(content: string, filename: string): void {
  // Excel-specific download logic
}
```

### Step 3: Update Documentation

Add the new format to this documentation and update any relevant sections.

## CSV Export Features

### Field Escaping

The CSV export handles special characters properly:

```typescript
function escapeCsvField(value: any, escapeQuotes: boolean = true): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the value contains delimiter, newline, or quotes, wrap in quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    if (escapeQuotes) {
      // Escape quotes by doubling them
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    } else {
      return `"${stringValue}"`;
    }
  }

  return stringValue;
}
```

### Configuration Options

```typescript
interface CsvExportOptions {
  delimiter?: string; // Default: ','
  includeHeaders?: boolean; // Default: true
  escapeQuotes?: boolean; // Default: true
}

// Usage
const csvContent = convertToCsv(data, {
  delimiter: "\t", // Tab-delimited
  includeHeaders: true, // Include column headers
  escapeQuotes: true, // Escape quotes in fields
});
```

## Error Handling

### Comprehensive Error Coverage

The export system handles various error scenarios:

1. **No Data Available**

   ```typescript
   if (!data || data.length === 0) {
     toast({
       title: "No data to export",
       description: "Please add some data to the table before exporting.",
       variant: "destructive",
     });
     return;
   }
   ```

2. **Export Process Errors**

   ```typescript
   try {
     // Export logic
   } catch (error) {
     console.error("Export error:", error);
     toast({
       title: "Export failed",
       description: "Failed to export file. Please try again.",
       variant: "destructive",
     });
   }
   ```

3. **Download Errors**
   ```typescript
   export function downloadFile(
     content: string,
     filename: string,
     mimeType: string
   ): void {
     try {
       if (!content) {
         throw new Error("No content to download");
       }
       // Download logic
     } catch (error) {
       throw new Error(`Failed to download file: ${error.message}`);
     }
   }
   ```

## Integration with History System

### Version Tracking

The export system integrates with the history system to provide version-aware filenames:

```typescript
// In app/playground/page.tsx
const currentIndex = useAppSelector(selectCurrentIndex);
const currentVersion = currentIndex + 1; // Convert to 1-indexed

// Pass to export component
<ExportDropdown
  data={data}
  currentVersion={currentVersion}
  disabled={data.length === 0}
/>
```

### Automatic Updates

When the history changes, the version number automatically updates, ensuring all exports include the current version information.

## User Experience

### Before Implementation

- Single export button
- Only JSON format
- Generic filename: `table-data.json`
- No version tracking
- No user feedback

### After Implementation

- 2-step export process
- Multiple formats (JSON, CSV)
- Descriptive filenames with version and timestamp
- Visual feedback with icons
- Disabled state when no data
- Toast notifications for all scenarios

### Interaction Flow

1. **Click Export**: Opens dropdown menu
2. **Choose Format**: Click JSON or CSV option
3. **Validation**: Checks for data availability
4. **Export Process**: Converts data and triggers download
5. **Success Feedback**: Toast notification with filename
6. **Error Handling**: Toast notification for failures
7. **Visual Feedback**: Dropdown closes after selection

## Toast Notification Examples

### Success Scenarios

- `"Export successful - JSON file 'table-data_v5_2025-07-13_20-00-22.json' has been downloaded"`
- `"Export successful - CSV file 'table-data_v3_2025-07-13_20-00-22.csv' has been downloaded"`

### Error Scenarios

- `"No data to export - Please add some data to the table before exporting."`
- `"Export failed - Failed to export JSON file. Please try again."`
- `"Export failed - Failed to export CSV file. Please try again."`

## Technical Benefits

1. **Extensible**: Easy to add more export formats
2. **Consistent**: Follows existing UI patterns (theme toggle)
3. **Accessible**: Proper ARIA labels and keyboard navigation
4. **Type-safe**: Full TypeScript support
5. **Reusable**: Export utilities can be used elsewhere
6. **User-friendly**: Clear feedback for all scenarios

## Files Structure

```
components/
├── export-dropdown.tsx          # Main export component
└── ui/
    └── use-toast.ts            # Toast notification system

lib/
└── utils/
    └── csv-export.ts           # CSV export utilities

app/
└── playground/
    └── page.tsx                # Integration with history system

docs/
└── export-system.md            # This documentation
```

## Future Enhancements

1. **Additional Formats**: Excel (.xlsx), PDF, etc.
2. **Export Options**: Column selection, filtering
3. **Batch Export**: Multiple formats at once
4. **Export History**: Track previous exports
5. **Custom Templates**: User-defined export formats
6. **Progress Indicators**: For large dataset exports
7. **Export Scheduling**: Background export processing
