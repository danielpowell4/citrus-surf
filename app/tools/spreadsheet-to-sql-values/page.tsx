"use client";

import { useState } from "react";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NavBar } from "@/components/nav-bar";
import { ToolExplanation } from "@/components/tool-explanation";

export default function SqlConverterPage() {
  return (
    <>
      <NavBar />
      <SqlConverterTool />
      <SqlConverterExplanation />
    </>
  );
}

function SqlConverterExplanation() {
  return (
    <ToolExplanation
      title="About Spreadsheet to SQL Converter"
      description="Learn how to efficiently convert CSV, Google Spreadsheets, and Excel data to SQL queries"
    >
      <h3>What is a Spreadsheet to SQL Converter?</h3>
      <p>
        A Spreadsheet to SQL converter is a tool that transforms data from
        various spreadsheet formats including CSV files, Google Spreadsheets
        exports, and Excel spreadsheets into SQL statements that can be executed
        in a database. This tool bridges the gap between spreadsheet data and
        database operations, making it easy to import or update data in your
        database regardless of whether your data comes from CSV files, Google
        Spreadsheets, or Excel workbooks.
      </p>

      <h3>Common Use Cases</h3>
      <ul>
        <li>
          <strong>Data Migration:</strong> Quickly convert exported data from
          Google Spreadsheets, Excel, or CSV files from one system into SQL for
          importing into another database.
        </li>
        <li>
          <strong>Bulk Updates:</strong> Generate UPDATE statements to modify
          multiple records at once using data from CSV exports, Google
          Spreadsheets, or Excel files.
        </li>
        <li>
          <strong>Database Seeding:</strong> Create SQL statements to populate
          test or development databases with sample data from spreadsheet
          applications.
        </li>
        <li>
          <strong>Data Correction:</strong> Generate SQL to fix data issues
          across multiple records using data exported from Google Spreadsheets,
          Excel, or saved as CSV files.
        </li>
      </ul>

      <h3>How to Use This Tool</h3>
      <ol>
        <li>
          Export your data from Google Spreadsheets, Excel, or save as CSV
          format
        </li>
        <li>Choose your desired output format (VALUES or UPDATE Loop)</li>
        <li>Select the appropriate delimiter for your data (tab or comma)</li>
        <li>For UPDATE loops, enter your table name and WHERE column</li>
        <li>Paste your spreadsheet data into the input field</li>
        <li>Click "Convert to SQL" to generate the SQL statements</li>
        <li>
          Copy the generated SQL and execute it in your database management tool
        </li>
      </ol>

      <h3>Working with Different Spreadsheet Formats</h3>
      <ul>
        <li>
          <strong>Google Spreadsheets:</strong> Copy and paste directly from
          Google Sheets, or download as CSV/TSV and paste the contents.
        </li>
        <li>
          <strong>Excel:</strong> Copy data from Excel and paste directly, or
          save as CSV/Tab-delimited text and paste the file contents.
        </li>
        <li>
          <strong>CSV Files:</strong> Open CSV files in any text editor and copy
          the contents, or import into Google Spreadsheets/Excel first.
        </li>
      </ul>

      <h3>Understanding UPDATE Loops</h3>
      <p>
        The UPDATE loop feature generates a PostgreSQL DO block that iterates
        through your spreadsheet data and updates records one by one. This
        approach is particularly useful when:
      </p>
      <ul>
        <li>
          You need to update multiple columns across many rows from your Google
          Spreadsheets or Excel data
        </li>
        <li>You want to ensure each update is processed individually</li>
        <li>
          Your CSV, Google Spreadsheets, or Excel data contains complex types
          like UUIDs that need special handling
        </li>
      </ul>

      <h3>Tips for Effective Data Conversion</h3>
      <ul>
        <li>
          <strong>Include Headers:</strong> For UPDATE loops, include column
          headers in your first row when copying from Google Spreadsheets,
          Excel, or CSV files to enable automatic column mapping.
        </li>
        <li>
          <strong>Check Data Types:</strong> Ensure your spreadsheet data types
          match what's expected in your database, especially for UUIDs and
          dates.
        </li>
        <li>
          <strong>Test First:</strong> Always test your generated SQL on a small
          dataset or test database before running it on production data.
        </li>
        <li>
          <strong>Backup:</strong> Create a database backup before executing
          large update operations from spreadsheet data.
        </li>
        <li>
          <strong>Format Consistency:</strong> When working with Google
          Spreadsheets or Excel, ensure consistent formatting before copying
          data.
        </li>
      </ul>

      <h3>Security Considerations</h3>
      <p>
        This tool processes all spreadsheet data locally in your browser.
        Whether your data comes from CSV files, Google Spreadsheets, or Excel,
        it never leaves your device, ensuring complete privacy and security.
        However, always be cautious when executing generated SQL on sensitive
        databases and verify the SQL before execution.
      </p>
    </ToolExplanation>
  );
}

function SqlConverterTool() {
  const [csvInput, setCsvInput] = useState("");
  const [sqlOutput, setSqlOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [delimiter, setDelimiter] = useState("tab");
  const [outputFormat, setOutputFormat] = useState("values");
  const [tableName, setTableName] = useState("");
  const [whereColumn, setWhereColumn] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<string[]>([]);
  const [columnCastings, setColumnCastings] = useState<string[]>([]);
  const [_customCastings, _setCustomCastings] = useState<
    Record<number, string>
  >({});

  // Convert string to snake_case
  const toSnakeCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  // Update column mapping
  const updateColumnMapping = (index: number, value: string) => {
    const newMappings = [...columnMappings];
    newMappings[index] = value;
    setColumnMappings(newMappings);
  };

  // Update column casting
  const updateColumnCasting = (index: number, value: string) => {
    const newCastings = [...columnCastings];
    newCastings[index] = value;
    setColumnCastings(newCastings);
  };

  // Parse CSV and convert to SQL format
  const convertToSql = () => {
    if (!csvInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some data to convert",
        variant: "destructive",
      });
      return;
    }

    if (
      (outputFormat === "update" || outputFormat === "insert") &&
      !tableName.trim()
    ) {
      toast({
        title: "Missing table name",
        description: "Please enter a table name for UPDATE/INSERT queries",
        variant: "destructive",
      });
      return;
    }

    try {
      // Split into lines and filter out empty lines
      const lines = csvInput.split("\n").filter(line => line.trim());

      if (lines.length === 0) {
        toast({
          title: "No data found",
          description: "Please enter valid data",
          variant: "destructive",
        });
        return;
      }

      // Determine the delimiter to use
      const delimiterChar =
        delimiter === "tab" ? "\t" : delimiter === "comma" ? "," : "\t";

      // Parse each line
      const rows = lines.map(line => parseLine(line, delimiterChar));

      if (outputFormat === "update") {
        // Extract headers from first row
        const csvHeaders = rows[0];
        setHeaders(csvHeaders);

        // Initialize column mappings if not set
        if (columnMappings.length !== csvHeaders.length) {
          setColumnMappings(csvHeaders.map(header => toSnakeCase(header)));
        }

        // Initialize column castings if not set
        if (columnCastings.length !== csvHeaders.length) {
          setColumnCastings(new Array(csvHeaders.length).fill(""));
        }

        // Process data rows (skip header row)
        const dataRows = rows.slice(1);

        if (dataRows.length === 0) {
          toast({
            title: "No data rows found",
            description: "Please ensure you have data rows after the header",
            variant: "destructive",
          });
          return;
        }

        // Generate UPDATE loop SQL
        const mappedHeaders =
          columnMappings.length === csvHeaders.length
            ? columnMappings
            : csvHeaders.map(header => toSnakeCase(header));

        const valueRows = dataRows.map(values => {
          const escapedValues = values.map(value => {
            const escaped = value.replace(/'/g, "''");
            return `'${escaped}'`;
          });
          return `(${escapedValues.join(", ")})`;
        });

        const whereCol = whereColumn || mappedHeaders[0];
        const updateColumns = mappedHeaders.slice(1);
        const finalCastings =
          columnCastings.length === csvHeaders.length
            ? columnCastings
            : new Array(csvHeaders.length).fill("");

        const sql = `DO $$ 
DECLARE
    row_data RECORD;
BEGIN
    FOR row_data IN 
        SELECT * FROM (VALUES
            ${valueRows.join(",\n            ")}
        ) AS row_data(${mappedHeaders.join(", ")})
    LOOP
        UPDATE ${tableName}
        SET ${updateColumns
          .map((col, idx) => {
            const castingIndex = idx + 1; // Skip first column (WHERE column)
            const casting = finalCastings[castingIndex]
              ? `${finalCastings[castingIndex]}`
              : "";
            return `${col} = row_data.${col}${casting}`;
          })
          .join(", ")}
        WHERE ${whereCol} = row_data.${mappedHeaders[0]}${finalCastings[0] ? finalCastings[0] : ""};
        -- HEY HUMAN!! REMEMBER TO ADD ANY ADDITIONAL 'WHERE' conditions beyond this 1:1 match
    END LOOP;
END $$;`;

        setSqlOutput(sql);
      } else if (outputFormat === "insert") {
        // Extract headers from first row
        const csvHeaders = rows[0];
        setHeaders(csvHeaders);

        // Initialize column mappings if not set
        if (columnMappings.length !== csvHeaders.length) {
          setColumnMappings(csvHeaders.map(header => toSnakeCase(header)));
        }

        // Initialize column castings if not set
        if (columnCastings.length !== csvHeaders.length) {
          setColumnCastings(new Array(csvHeaders.length).fill(""));
        }

        // Process data rows (skip header row)
        const dataRows = rows.slice(1);

        if (dataRows.length === 0) {
          toast({
            title: "No data rows found",
            description: "Please ensure you have data rows after the header",
            variant: "destructive",
          });
          return;
        }

        // Generate INSERT loop SQL
        const mappedHeaders =
          columnMappings.length === csvHeaders.length
            ? columnMappings
            : csvHeaders.map(header => toSnakeCase(header));

        const valueRows = dataRows.map(values => {
          const escapedValues = values.map(value => {
            const escaped = value.replace(/'/g, "''");
            return `'${escaped}'`;
          });
          return `(${escapedValues.join(", ")})`;
        });

        const finalCastings =
          columnCastings.length === csvHeaders.length
            ? columnCastings
            : new Array(csvHeaders.length).fill("");

        const sql = `DO $$ 
DECLARE
    row_data RECORD;
BEGIN
    FOR row_data IN 
        SELECT * FROM (VALUES
            ${valueRows.join(",\n            ")}
        ) AS row_data(${mappedHeaders.join(", ")})
    LOOP
        INSERT INTO ${tableName} (${mappedHeaders.join(", ")})
        VALUES (${mappedHeaders
          .map((col, idx) => {
            const casting = finalCastings[idx] ? `${finalCastings[idx]}` : "";
            return `row_data.${col}${casting}`;
          })
          .join(", ")});
    END LOOP;
END $$;`;

        setSqlOutput(sql);
      } else {
        // Original VALUES format
        const valueRows = [];
        for (let i = 0; i < rows.length; i++) {
          const values = rows[i];
          const escapedValues = values.map(value => {
            const escaped = value.replace(/'/g, "''");
            return `'${escaped}'`;
          });
          valueRows.push(`(${escapedValues.join(", ")})`);
        }

        const sql = valueRows.join(",\n") + ";";
        setSqlOutput(sql);
      }

      toast({
        title: "Conversion complete",
        description: `Generated ${outputFormat === "update" ? "UPDATE loop" : outputFormat === "insert" ? "INSERT loop" : "VALUES"} SQL`,
      });
    } catch (error) {
      toast({
        title: "Error converting to SQL",
        description: "Please check your data format and try again",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const loadSampleData = () => {
    setCsvInput(`uuid	first_name	last_name	email
ffa773fa-45db-443e-bbd8-1ca7b1a13d49	Roy	Roper	roy.roper@example.com
fe057db7-01f5-478c-ae2d-9ceb168c21d7	David	Weaver	david.weaver@example.com
a1b2c3d4-e5f6-7890-abcd-ef1234567890	Sarah	Johnson	sarah.johnson@example.com`);
    setTableName("contact");
    setWhereColumn("external_id");
  };

  const parseLine = (line: string, delimiter: string): string[] => {
    // For tab-delimited data, just split by tabs
    if (delimiter === "\t") {
      return line.split("\t");
    }

    // For comma-delimited data, handle quoted fields
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Handle quotes - toggle inQuotes state
        if (inQuotes && i < line.length - 1 && line[i + 1] === '"') {
          // Double quotes inside quoted field - add a single quote
          current += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        result.push(current);
        current = "";
      } else {
        // Add character to current field
        current += char;
      }
    }

    // Add the last field
    result.push(current);

    return result;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Copied to clipboard",
        description: "The SQL has been copied to your clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    setCsvInput("");
    setSqlOutput("");
    setCopied(false);
    setTableName("");
    setWhereColumn("");
    setHeaders([]);
    setColumnMappings([]);
    setColumnCastings([]);
    setCustomCastings({});
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="relative inline-block">
            Spreadsheet to SQL Converter
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-orange-400 to-teal-400 rounded-full"></div>
          </CardTitle>
          <CardDescription>
            Convert data from CSV files, Google Spreadsheets, or Excel exports
            to SQL VALUES format for database import.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Output Format</Label>
                <RadioGroup
                  defaultValue="values"
                  value={outputFormat}
                  onValueChange={setOutputFormat}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="values" id="values" />
                    <Label htmlFor="values">VALUES</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="update" id="update" />
                    <Label htmlFor="update">UPDATE Loop</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="insert" id="insert" />
                    <Label htmlFor="insert">INSERT Loop</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Delimiter</Label>
                <RadioGroup
                  defaultValue="tab"
                  value={delimiter}
                  onValueChange={setDelimiter}
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
              </div>
            </div>

            {(outputFormat === "update" || outputFormat === "insert") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tableName">Table Name</Label>
                  <input
                    id="tableName"
                    type="text"
                    placeholder="e.g., contact"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={tableName}
                    onChange={e => setTableName(e.target.value)}
                  />
                </div>
                {outputFormat === "update" && (
                  <div className="space-y-2">
                    <Label htmlFor="whereColumn">WHERE Column</Label>
                    <input
                      id="whereColumn"
                      type="text"
                      placeholder="e.g., external_id"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={whereColumn}
                      onChange={e => setWhereColumn(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="csvInput">Input Data</Label>
              <Textarea
                id="csvInput"
                placeholder="Paste your data here"
                className="min-h-[150px] font-mono text-sm"
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
              />
            </div>

            {(outputFormat === "update" || outputFormat === "insert") &&
              headers.length > 0 && (
                <div className="space-y-2">
                  <Label>Column Mapping & Casting</Label>
                  <div className="border rounded-md p-4 space-y-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      Map your CSV headers to database column names and specify
                      optional type casting:
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center mb-2 text-sm font-medium text-muted-foreground">
                      <div>CSV Header</div>
                      <div>Database Column</div>
                      <div>Type Casting</div>
                    </div>
                    {headers.map((header, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center"
                      >
                        <div className="text-sm font-medium">{header}</div>
                        <input
                          type="text"
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={columnMappings[index] || toSnakeCase(header)}
                          onChange={e =>
                            updateColumnMapping(index, e.target.value)
                          }
                          placeholder={toSnakeCase(header)}
                        />
                        <div className="relative">
                          <input
                            type="text"
                            list={`casting-options-${index}`}
                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Select or type custom (e.g., ::uuid)"
                            value={columnCastings[index] || ""}
                            onChange={e =>
                              updateColumnCasting(index, e.target.value)
                            }
                          />
                          <datalist id={`casting-options-${index}`}>
                            <option value=""></option>
                            <option value="::uuid"></option>
                            <option value="::text"></option>
                            <option value="::integer"></option>
                            <option value="::numeric"></option>
                            <option value="::boolean"></option>
                            <option value="::timestamp"></option>
                            <option value="::timestamptz"></option>
                            <option value="::date"></option>
                            <option value="::jsonb"></option>
                            <option value="::json"></option>
                          </datalist>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="flex gap-2">
              <Button onClick={convertToSql}>Convert to SQL</Button>
              <Button variant="outline" onClick={loadSampleData}>
                Load Sample Data
              </Button>
              {sqlOutput && (
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {sqlOutput && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>SQL Output</CardTitle>
              <CardDescription>Ready to use in your database</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <ClipboardCheck className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              Copy SQL
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[300px] font-mono text-sm"
              readOnly
              value={sqlOutput}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
