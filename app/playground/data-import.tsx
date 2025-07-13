"use client";

import { useState } from "react";
import { Upload, Download, RotateCcw, FileText, Database } from "lucide-react";
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

interface DataImportProps {
  onImport: (data: any[]) => void;
  onReset: () => void;
  onExport: () => void;
  dataCount: number;
  isLoading?: boolean;
  error?: string | null;
}

// Sample data generator with diverse names
const generateSampleData = () => {
  const sampleData = [
    {
      id: "1",
      firstName: "Aisha",
      lastName: "Patel",
      age: 28,
      email: "aisha.patel@example.com",
      department: "Engineering",
      salary: 75000,
      status: "Active",
    },
    {
      id: "2",
      firstName: "Marcus",
      lastName: "Chen",
      age: 32,
      email: "marcus.chen@example.com",
      department: "Marketing",
      salary: 68000,
      status: "Active",
    },
    {
      id: "3",
      firstName: "Sofia",
      lastName: "Rodriguez",
      age: 25,
      email: "sofia.rodriguez@example.com",
      department: "Sales",
      salary: 62000,
      status: "Active",
    },
    {
      id: "4",
      firstName: "Kofi",
      lastName: "Mensah",
      age: 35,
      email: "kofi.mensah@example.com",
      department: "Engineering",
      salary: 85000,
      status: "Active",
    },
    {
      id: "5",
      firstName: "Priya",
      lastName: "Sharma",
      age: 29,
      email: "priya.sharma@example.com",
      department: "HR",
      salary: 58000,
      status: "Inactive",
    },
    {
      id: "6",
      firstName: "Javier",
      lastName: "Garcia",
      age: 31,
      email: "javier.garcia@example.com",
      department: "Sales",
      salary: 72000,
      status: "Active",
    },
    {
      id: "7",
      firstName: "Zara",
      lastName: "Ahmed",
      age: 27,
      email: "zara.ahmed@example.com",
      department: "Marketing",
      salary: 65000,
      status: "Active",
    },
    {
      id: "8",
      firstName: "David",
      lastName: "Kim",
      age: 33,
      email: "david.kim@example.com",
      department: "Engineering",
      salary: 78000,
      status: "Active",
    },
    {
      id: "9",
      firstName: "Fatima",
      lastName: "Al-Zahra",
      age: 26,
      email: "fatima.alzahra@example.com",
      department: "Finance",
      salary: 70000,
      status: "Active",
    },
    {
      id: "10",
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
}: DataImportProps) {
  const [importData, setImportData] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [csvDelimiter, setCsvDelimiter] = useState<"tab" | "comma">("tab");
  const [hasHeaders, setHasHeaders] = useState(true);

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
        // CSV parsing
        const lines = importData.trim().split("\n");
        if (lines.length === 0) {
          throw new Error("No data found");
        }

        const delimiter = csvDelimiter === "tab" ? "\t" : ",";
        const startIndex = hasHeaders ? 1 : 0;
        const headers = hasHeaders ? parseCsvLine(lines[0], delimiter) : [];

        parsedData = lines.slice(startIndex).map((line, index) => {
          const values = parseCsvLine(line, delimiter);
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

      onImport(parsedData);
      setImportData("");
      toast({
        title: "Data imported successfully",
        description: `${parsedData.length} records imported`,
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

  const parseCsvLine = (line: string, delimiter: string): string[] => {
    if (delimiter === "\t") {
      return line.split("\t");
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
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const loadSampleData = () => {
    const sampleData = generateSampleData();

    if (importFormat === "json") {
      setImportData(JSON.stringify(sampleData, null, 2));
    } else {
      const delimiter = csvDelimiter === "tab" ? "\t" : ",";
      const headers = [
        "id",
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
        csvContent += headers.join(delimiter) + "\n";
      }

      csvContent += sampleData
        .map(row =>
          headers.map(header => row[header as keyof typeof row]).join(delimiter)
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
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  CSV
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
          </div>

          {importFormat === "csv" && (
            <div className="space-y-2">
              <Label>CSV Options</Label>
              <div className="space-y-2">
                <RadioGroup
                  value={csvDelimiter}
                  onValueChange={value =>
                    setCsvDelimiter(value as "tab" | "comma")
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tab" id="tab" />
                    <Label htmlFor="tab">Tab</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comma" id="comma" />
                    <Label htmlFor="comma">Comma</Label>
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

        {/* Data Input */}
        <div className="space-y-2">
          <Label htmlFor="importData">
            {importFormat === "json" ? "JSON Data" : "CSV Data"}
          </Label>
          <Textarea
            id="importData"
            placeholder={
              importFormat === "json"
                ? 'Paste JSON array here...\n[{"id": 1, "name": "John"}, ...]'
                : "Paste CSV data here...\nid,name,email\n1,John,john@example.com"
            }
            value={importData}
            onChange={e => setImportData(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            rows={6}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
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
          {dataCount > 0 && (
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
