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

export default function JsonToSqlPage() {
  return (
    <>
      <NavBar />
      <JsonToSqlTool />
      <JsonToSqlExplanation />
    </>
  );
}

function JsonToSqlExplanation() {
  return (
    <ToolExplanation
      title="About JSON to SQL Converter"
      description="Transform JSON data into SQL statements for database operations"
    >
      <h3>What is a JSON to SQL Converter?</h3>
      <p>
        A JSON to SQL converter transforms JSON data (arrays of objects) into
        SQL statements that can be executed in a database. This tool is perfect
        for converting API responses, exported data, or any structured JSON into
        database-ready SQL queries including INSERT statements, UPDATE loops,
        and VALUES clauses.
      </p>

      <h3>Common Use Cases</h3>
      <ul>
        <li>
          <strong>API Data Import:</strong> Convert JSON responses from APIs
          directly into SQL for database storage.
        </li>
        <li>
          <strong>Data Migration:</strong> Transform JSON exports from NoSQL
          databases or applications into SQL for relational databases.
        </li>
        <li>
          <strong>Bulk Operations:</strong> Generate UPDATE or INSERT statements
          for multiple records from JSON data.
        </li>
        <li>
          <strong>Testing & Development:</strong> Create SQL statements from
          JSON test data or mock API responses.
        </li>
        <li>
          <strong>Data Synchronization:</strong> Convert JSON data from external
          systems into SQL for database updates.
        </li>
      </ul>

      <h3>How to Use This Tool</h3>
      <ol>
        <li>Paste your JSON array of objects into the input field</li>
        <li>
          Choose your desired output format (VALUES, UPDATE Loop, or INSERT
          Loop)
        </li>
        <li>
          For UPDATE/INSERT loops, enter your table name and configure column
          mappings
        </li>
        <li>
          Specify type casting for columns that need it (e.g., ::uuid,
          ::timestamp)
        </li>
        <li>Click "Convert to SQL" to generate the SQL statements</li>
        <li>Copy the generated SQL and execute it in your database</li>
      </ol>

      <h3>Output Formats</h3>
      <ul>
        <li>
          <strong>VALUES:</strong> Generates a simple VALUES clause that can be
          used in INSERT statements or CTEs.
        </li>
        <li>
          <strong>UPDATE Loop:</strong> Creates a PostgreSQL DO block that
          updates existing records based on a WHERE condition.
        </li>
        <li>
          <strong>INSERT Loop:</strong> Generates a PostgreSQL DO block that
          inserts new records into the specified table.
        </li>
      </ul>

      <h3>JSON Structure Requirements</h3>
      <p>
        Your JSON should be an array of objects where each object represents a
        row of data:
      </p>
      <pre className="bg-muted p-3 rounded text-sm">
        {`[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  },
  {
    "id": "987fcdeb-51a2-43d1-9f12-345678901234",
    "name": "Jane Smith", 
    "email": "jane@example.com",
    "age": 25
  }
]`}
      </pre>

      <h3>Type Casting</h3>
      <p>
        The tool supports PostgreSQL type casting to ensure your data is
        properly typed in the database. Common castings include:
      </p>
      <ul>
        <li>
          <strong>::uuid</strong> - For UUID fields
        </li>
        <li>
          <strong>::timestamp</strong> - For datetime fields
        </li>
        <li>
          <strong>::numeric</strong> - For decimal numbers
        </li>
        <li>
          <strong>::jsonb</strong> - For JSON data
        </li>
        <li>
          <strong>Custom types</strong> - Any PostgreSQL type or enum
        </li>
      </ul>

      <h3>Tips for Best Results</h3>
      <ul>
        <li>
          <strong>Consistent Structure:</strong> Ensure all objects in your JSON
          array have the same property structure.
        </li>
        <li>
          <strong>Data Types:</strong> Use appropriate type casting for UUIDs,
          timestamps, and other special data types.
        </li>
        <li>
          <strong>Test First:</strong> Always test generated SQL on a small
          dataset before running on production data.
        </li>
        <li>
          <strong>Backup:</strong> Create database backups before executing
          large update operations.
        </li>
        <li>
          <strong>Validation:</strong> Validate your JSON format before
          conversion to avoid errors.
        </li>
      </ul>

      <h3>Security & Privacy</h3>
      <p>
        All JSON processing happens locally in your browser. Your data never
        leaves your device, ensuring complete privacy and security. However,
        always verify generated SQL before executing it on sensitive databases.
      </p>
    </ToolExplanation>
  );
}

function JsonToSqlTool() {
  const [jsonInput, setJsonInput] = useState("");
  const [sqlOutput, setSqlOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [outputFormat, setOutputFormat] = useState("values");
  const [tableName, setTableName] = useState("");
  const [whereColumn, setWhereColumn] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<string[]>([]);
  const [columnCastings, setColumnCastings] = useState<string[]>([]);

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

  // Parse JSON and convert to SQL format
  const convertToSql = () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some JSON data to convert",
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
      // Parse JSON
      let jsonData;
      try {
        jsonData = JSON.parse(jsonInput);
      } catch {
        toast({
          title: "Invalid JSON",
          description: "Please check your JSON format and try again",
          variant: "destructive",
        });
        return;
      }

      // Ensure JSON is an array
      if (!Array.isArray(jsonData)) {
        toast({
          title: "Invalid JSON structure",
          description: "JSON must be an array of objects",
          variant: "destructive",
        });
        return;
      }

      if (jsonData.length === 0) {
        toast({
          title: "Empty JSON array",
          description: "The JSON array contains no items to convert",
          variant: "destructive",
        });
        return;
      }

      // Extract all possible keys from all objects
      const allKeys = new Set<string>();
      jsonData.forEach(item => {
        if (typeof item === "object" && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });

      const jsonHeaders = Array.from(allKeys);
      setHeaders(jsonHeaders);

      if (outputFormat === "update" || outputFormat === "insert") {
        // Initialize column mappings if not set
        if (columnMappings.length !== jsonHeaders.length) {
          setColumnMappings(jsonHeaders.map(header => toSnakeCase(header)));
        }

        // Initialize column castings if not set
        if (columnCastings.length !== jsonHeaders.length) {
          setColumnCastings(new Array(jsonHeaders.length).fill(""));
        }

        // Generate mapped headers
        const mappedHeaders =
          columnMappings.length === jsonHeaders.length
            ? columnMappings
            : jsonHeaders.map(header => toSnakeCase(header));

        // Convert JSON objects to value rows
        const valueRows = jsonData.map(item => {
          const values = jsonHeaders.map(header => {
            const value = item[header];
            if (value === undefined || value === null) return "NULL";
            if (typeof value === "string") {
              const escaped = value.replace(/'/g, "''");
              return `'${escaped}'`;
            }
            if (typeof value === "object") {
              const escaped = JSON.stringify(value).replace(/'/g, "''");
              return `'${escaped}'`;
            }
            return `'${String(value)}'`;
          });
          return `(${values.join(", ")})`;
        });

        const finalCastings =
          columnCastings.length === jsonHeaders.length
            ? columnCastings
            : new Array(jsonHeaders.length).fill("");

        if (outputFormat === "update") {
          const whereCol = whereColumn || mappedHeaders[0];
          const updateColumns = mappedHeaders.slice(1);

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
    END LOOP;
END $$;`;

          setSqlOutput(sql);
        } else if (outputFormat === "insert") {
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
        }
      } else {
        // VALUES format
        const valueRows = jsonData.map(item => {
          const values = jsonHeaders.map(header => {
            const value = item[header];
            if (value === undefined || value === null) return "NULL";
            if (typeof value === "string") {
              const escaped = value.replace(/'/g, "''");
              return `'${escaped}'`;
            }
            if (typeof value === "object") {
              const escaped = JSON.stringify(value).replace(/'/g, "''");
              return `'${escaped}'`;
            }
            return `'${String(value)}'`;
          });
          return `(${values.join(", ")})`;
        });

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
        description: "Please check your JSON format and try again",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const loadSampleData = () => {
    setJsonInput(
      JSON.stringify(
        [
          {
            id: "ffa773fa-45db-443e-bbd8-1ca7b1a13d49",
            first_name: "Roy",
            last_name: "Roper",
            email: "roy.roper@example.com",
            age: 32,
            active: true,
          },
          {
            id: "fe057db7-01f5-478c-ae2d-9ceb168c21d7",
            first_name: "David",
            last_name: "Weaver",
            email: "david.weaver@example.com",
            age: 28,
            active: true,
          },
          {
            id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            first_name: "Sarah",
            last_name: "Johnson",
            email: "sarah.johnson@example.com",
            age: 35,
            active: false,
          },
        ],
        null,
        2
      )
    );
    setTableName("users");
    setWhereColumn("id");
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      toast({
        title: "JSON formatted",
        description: "Your JSON has been formatted with proper indentation",
      });
    } catch {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format and try again",
        variant: "destructive",
      });
    }
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
    setJsonInput("");
    setSqlOutput("");
    setCopied(false);
    setTableName("");
    setWhereColumn("");
    setHeaders([]);
    setColumnMappings([]);
    setColumnCastings([]);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="relative inline-block">
            JSON to SQL Converter
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-orange-400 to-teal-400 rounded-full"></div>
          </CardTitle>
          <CardDescription>
            Convert JSON arrays of objects into SQL VALUES, UPDATE loops, or
            INSERT statements for database operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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

            {(outputFormat === "update" || outputFormat === "insert") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tableName">Table Name</Label>
                  <input
                    id="tableName"
                    type="text"
                    placeholder="e.g., users"
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
                      placeholder="e.g., id"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={whereColumn}
                      onChange={e => setWhereColumn(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="jsonInput">JSON Input</Label>
                <Button variant="outline" size="sm" onClick={formatJson}>
                  Format JSON
                </Button>
              </div>
              <Textarea
                id="jsonInput"
                placeholder='Paste your JSON array here. Example: [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]'
                className="min-h-[200px] font-mono text-sm"
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
              />
            </div>

            {(outputFormat === "update" || outputFormat === "insert") &&
              headers.length > 0 && (
                <div className="space-y-2">
                  <Label>Column Mapping & Casting</Label>
                  <div className="border rounded-md p-4 space-y-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      Map your JSON properties to database column names and
                      specify optional type casting:
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center mb-2 text-sm font-medium text-muted-foreground">
                      <div>JSON Property</div>
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
