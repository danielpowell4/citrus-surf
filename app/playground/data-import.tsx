"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  FileText,
  Database,
  FileUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { injectRowIds } from "@/lib/utils/data-processing";

interface DataImportProps {
  onImport: (data: any[]) => void;
  onReset: () => void;
  onExport?: () => void;
  dataCount: number;
  isLoading?: boolean;
  error?: string | null;
  onCreateShapeFromData?: (data: any[]) => void; // New prop for creating shape from data
}

// Sample data generator with diverse names
const generateSampleData = () => {
  const sampleData = [
    {
      firstName: "Aisha",
      lastName: "Patel",
      age: 28,
      email: "aisha.patel@example.com",
      department: "Engineering",
      salary: 75000,
      status: "Active",
    },
    {
      firstName: "Marcus",
      lastName: "Chen",
      age: 32,
      email: "marcus.chen@example.com",
      department: "Marketing",
      salary: 68000,
      status: "Active",
    },
    {
      firstName: "Sofia",
      lastName: "Rodriguez",
      age: 25,
      email: "sofia.rodriguez@example.com",
      department: "Sales",
      salary: 62000,
      status: "Active",
    },
    {
      firstName: "Kofi",
      lastName: "Mensah",
      age: 35,
      email: "kofi.mensah@example.com",
      department: "Engineering",
      salary: 85000,
      status: "Active",
    },
    {
      firstName: "Priya",
      lastName: "Sharma",
      age: 29,
      email: "priya.sharma@example.com",
      department: "HR",
      salary: 58000,
      status: "Inactive",
    },
    {
      firstName: "Javier",
      lastName: "Garcia",
      age: 31,
      email: "javier.garcia@example.com",
      department: "Sales",
      salary: 72000,
      status: "Active",
    },
    {
      firstName: "Zara",
      lastName: "Ahmed",
      age: 27,
      email: "zara.ahmed@example.com",
      department: "Marketing",
      salary: 65000,
      status: "Active",
    },
    {
      firstName: "David",
      lastName: "Kim",
      age: 33,
      email: "david.kim@example.com",
      department: "Engineering",
      salary: 78000,
      status: "Active",
    },
    {
      firstName: "Fatima",
      lastName: "Al-Zahra",
      age: 26,
      email: "fatima.alzahra@example.com",
      department: "Finance",
      salary: 70000,
      status: "Active",
    },
    {
      firstName: "Lucas",
      lastName: "Thompson",
      age: 30,
      email: "lucas.thompson@example.com",
      department: "Operations",
      salary: 67000,
      status: "Inactive",
    },
  ];

  return sampleData;
};

export function DataImport({
  onImport,
  onReset,
  onExport,
  dataCount,
  isLoading = false,
  error = null,
  onCreateShapeFromData,
}: DataImportProps) {
  const [importData, setImportData] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [csvDelimiter, setCsvDelimiter] = useState<"tab" | "comma">("comma");
  const [hasHeaders, setHasHeaders] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    if (!importData.trim()) {
      toast({
        title: "No data to import",
        description: "Please paste some data first",
        variant: "destructive",
      });
      return;
    }

    try {
      let parsedData: any[];

      if (importFormat === "json") {
        const jsonData = JSON.parse(importData);
        if (!Array.isArray(jsonData)) {
          throw new Error("JSON data must be an array");
        }
        parsedData = jsonData;
      } else {
        // CSV/TSV parsing using selected delimiter
        const lines = importData.trim().split("\n");
        if (lines.length === 0) {
          throw new Error("No data found");
        }
        const delimChar = csvDelimiter === "tab" ? "\t" : ",";
        const startIndex = hasHeaders ? 1 : 0;
        const headers = hasHeaders ? parseCsvLine(lines[0], delimChar) : [];

        parsedData = lines.slice(startIndex).map((line, index) => {
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
      }

      // Inject unique row IDs
      const processedData = injectRowIds(parsedData, true); // Preserve existing IDs

      onImport(processedData);
      setImportData("");
      setSelectedFile(null);
      toast({
        title: "Data imported successfully",
        description: `${processedData.length} records imported with unique IDs`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description:
          error instanceof Error ? error.message : "Invalid data format",
        variant: "destructive",
      });
    }
  };

  // Helper to detect delimiter
  const detectDelimiter = (content: string): "tab" | "comma" => {
    const firstLine = content.split("\n")[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    if (tabCount > commaCount) return "tab";
    return "comma";
  };

  // Helper to detect format
  const detectFormat = (content: string, filename?: string): "csv" | "json" => {
    // Prefer extension if available
    if (filename) {
      const ext = filename.split(".").pop()?.toLowerCase();
      if (ext === "json") return "json";
      if (["csv", "tsv", "txt"].includes(ext || "")) return "csv";
    }
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return "json";
    } catch {}
    // Otherwise, treat as CSV/TSV
    return "csv";
  };

  // --- PASTE IMPORT ---
  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setImportData(value);
    // Auto-detect format
    const detectedFormat = detectFormat(value);
    setImportFormat(detectedFormat);
    if (detectedFormat === "csv") {
      const lines = value.trim().split("\n");
      if (lines.length > 0 && lines[0].length > 0) {
        const delimiter = detectDelimiter(lines[0]);
        setCsvDelimiter(delimiter);
      }
    }
  };

  // --- FILE SELECT ---
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const content = await file.text();
        // Populate textarea with file contents
        setImportData(content);
        // Auto-detect format
        const detectedFormat = detectFormat(content, file.name);
        setImportFormat(detectedFormat);
        if (detectedFormat === "csv") {
          const delimiter = detectDelimiter(content);
          setCsvDelimiter(delimiter);
        }
        toast({
          title: "File loaded",
          description: `"${file.name}" loaded into textarea. You can edit the data before importing.`,
        });
        // Auto-clear the selected file after loading into textarea
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        toast({
          title: "File read error",
          description: "Could not read the selected file",
          variant: "destructive",
        });
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parseCsvLine = (line: string, delimiter: string): string[] => {
    // Handle empty lines
    if (!line.trim()) {
      return [];
    }

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
          current += '"';
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

  const loadSampleData = () => {
    const sampleData = generateSampleData();

    if (importFormat === "json") {
      setImportData(JSON.stringify(sampleData, null, 2));
    } else {
      const delimChar = csvDelimiter === "tab" ? "\t" : ",";
      const headers = [
        "firstName",
        "lastName",
        "age",
        "email",
        "department",
        "salary",
        "status",
      ];

      let csvContent = "";
      if (hasHeaders) {
        csvContent += headers.join(delimChar) + "\n";
      }

      csvContent += sampleData
        .map(row =>
          headers.map(header => row[header as keyof typeof row]).join(delimChar)
        )
        .join("\n");

      setImportData(csvContent);
    }
  };

  const clearData = () => {
    setImportData("");
    toast({
      title: "Input cleared",
      description: "Import data has been cleared",
    });
  };

  const getAcceptedFileTypes = () => {
    return ".csv,.tsv,.txt,.json";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Data Import
          {dataCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {dataCount} records
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Import data from JSON or CSV format to populate your table
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Import Format Selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Import Format</Label>
            <RadioGroup
              value={importFormat}
              onValueChange={value => setImportFormat(value as "json" | "csv")}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  CSV/TSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  JSON
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Auto-detected on paste/upload, but you can override.
            </p>
          </div>

          {importFormat === "csv" && (
            <div className="space-y-2">
              <Label>CSV Options</Label>
              <div className="flex flex-wrap items-center gap-4">
                <RadioGroup
                  value={csvDelimiter}
                  onValueChange={value =>
                    setCsvDelimiter(value as "tab" | "comma")
                  }
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comma" id="comma" />
                    <Label htmlFor="comma">Comma</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tab" id="tab" />
                    <Label htmlFor="tab">Tab</Label>
                  </div>
                </RadioGroup>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasHeaders"
                    checked={hasHeaders}
                    onChange={e => setHasHeaders(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="hasHeaders" className="text-sm">
                    First row contains headers
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Input Section */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Label htmlFor="importData" className="whitespace-nowrap">
              {importFormat === "json" ? "JSON Data" : "CSV/TSV Data"}
            </Label>
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept={getAcceptedFileTypes()}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <FileUp className="h-4 w-4" />
              Choose File
            </Button>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate max-w-32 sm:max-w-48">
                  {selectedFile.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedFile}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <Textarea
            id="importData"
            placeholder={
              importFormat === "json"
                ? 'Paste JSON array here...\n[{"id": 1, "name": "John"}, ...]'
                : "Paste CSV or TSV data here...\nid\tname\temail\n1\tJohn\tjohn@example.com or id,name,email\n1,John,john@example.com"
            }
            value={importData}
            onChange={handlePasteChange}
            className="min-h-[150px] font-mono text-sm w-full"
            rows={6}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive break-words">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleImport}
            disabled={!importData.trim() || isLoading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Data
          </Button>

          {/* Create Shape from Data Button */}
          {importData.trim() && onCreateShapeFromData && (
            <Button
              variant="secondary"
              onClick={() => {
                try {
                  let parsedData: any[];
                  if (importFormat === "json") {
                    const jsonData = JSON.parse(importData);
                    if (!Array.isArray(jsonData)) {
                      throw new Error("JSON data must be an array");
                    }
                    parsedData = jsonData;
                  } else {
                    const lines = importData.trim().split("\n");
                    if (lines.length === 0) {
                      throw new Error("No data found");
                    }
                    const delimChar = csvDelimiter === "tab" ? "\t" : ",";
                    const startIndex = hasHeaders ? 1 : 0;
                    const headers = hasHeaders
                      ? parseCsvLine(lines[0], delimChar)
                      : [];

                    parsedData = lines.slice(startIndex).map((line, index) => {
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
                  }
                  onCreateShapeFromData(parsedData);
                } catch (error) {
                  toast({
                    title: "Invalid data",
                    description:
                      "Please ensure your data is in the correct format",
                    variant: "destructive",
                  });
                }
              }}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Create Shape from Data
            </Button>
          )}

          <Button
            variant="outline"
            onClick={loadSampleData}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Load Sample
          </Button>

          <Button
            variant="outline"
            onClick={onReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Data
          </Button>
          {dataCount > 0 && onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          {importData.trim() && (
            <Button
              variant="outline"
              onClick={clearData}
              className="flex items-center gap-2"
            >
              Clear Input
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
