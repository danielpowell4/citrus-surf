"use client"

import { useState } from "react"
import { Clipboard, ClipboardCheck, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { NavBar } from "@/components/nav-bar"
import { Switch } from "@/components/ui/switch"
import { ToolExplanation } from "@/components/tool-explanation"

export default function CsvToJsonPage() {
  return (
    <>
      <NavBar />
      <CsvToJsonTool />
      <CsvToJsonExplanation />
    </>
  )
}

function CsvToJsonExplanation() {
  return (
    <ToolExplanation
      title="About CSV to JSON Converter"
      description="Transform tabular data into structured JSON for modern applications"
    >
      <h3>What is CSV to JSON Conversion?</h3>
      <p>
        CSV to JSON conversion transforms tabular data from Comma-Separated Values (CSV) format into JavaScript Object
        Notation (JSON), a lightweight data interchange format. This process converts rows and columns into a
        structured, hierarchical format that's ideal for web applications, APIs, and modern data processing systems.
      </p>

      <h3>Why Convert CSV to JSON?</h3>
      <ul>
        <li>
          <strong>API Integration:</strong> Most modern APIs expect and return JSON data, making it the standard for
          data exchange on the web.
        </li>
        <li>
          <strong>JavaScript Compatibility:</strong> JSON is native to JavaScript, making it perfect for web
          applications and Node.js backends.
        </li>
        <li>
          <strong>Rich Data Structures:</strong> JSON supports complex, nested data structures that can better represent
          relationships than flat CSV files.
        </li>
        <li>
          <strong>Data Types:</strong> JSON preserves data types (numbers, booleans, strings) that would be lost in CSV
          format.
        </li>
        <li>
          <strong>Human Readability:</strong> With proper formatting, JSON is more readable and self-describing than
          CSV.
        </li>
      </ul>

      <h3>How Our CSV to JSON Converter Works</h3>
      <p>Our converter provides a powerful yet simple way to transform CSV data into JSON:</p>
      <ul>
        <li>
          <strong>Header Row Processing:</strong> Uses the first row as object keys when the option is enabled, creating
          meaningful property names.
        </li>
        <li>
          <strong>Data Type Detection:</strong> Automatically detects and converts numbers, booleans, and null values to
          their proper JSON types.
        </li>
        <li>
          <strong>Multiple Delimiter Support:</strong> Handles comma, tab, and semicolon delimiters to accommodate
          various CSV formats.
        </li>
        <li>
          <strong>Quoted Field Handling:</strong> Properly processes quoted fields that may contain delimiters or
          special characters.
        </li>
        <li>
          <strong>Pretty Printing:</strong> Formats the JSON output with proper indentation for readability when the
          option is enabled.
        </li>
      </ul>

      <h3>Common Use Cases</h3>
      <h4>Data Import for Web Applications</h4>
      <p>
        When building web applications, you often need to import data that exists in CSV format (like exported reports
        or spreadsheets). Converting this data to JSON makes it immediately usable in JavaScript applications.
      </p>

      <h4>API Development</h4>
      <p>
        When developing APIs that need to consume data that exists in CSV format, converting to JSON is often a
        necessary preprocessing step to make the data compatible with your API structure.
      </p>

      <h4>Data Transformation Pipelines</h4>
      <p>
        In data processing workflows, CSV to JSON conversion is often an early step in transforming legacy or exported
        data into formats suitable for modern data processing systems.
      </p>

      <h4>Configuration Management</h4>
      <p>
        Converting spreadsheet-based configurations to JSON format allows them to be easily consumed by applications
        that expect configuration in JSON format.
      </p>

      <h3>Tips for Effective CSV to JSON Conversion</h3>
      <ul>
        <li>
          <strong>Use Headers:</strong> Enable the "First row as headers" option to create meaningful property names in
          your JSON objects.
        </li>
        <li>
          <strong>Choose the Right Delimiter:</strong> Make sure to select the delimiter that matches your CSV data
          format (comma, tab, or semicolon).
        </li>
        <li>
          <strong>Check for Special Characters:</strong> If your CSV contains quotes, commas, or other special
          characters within fields, ensure they're properly quoted in the input.
        </li>
        <li>
          <strong>Validate the Output:</strong> Always verify that the generated JSON correctly represents your data and
          has the expected structure.
        </li>
        <li>
          <strong>Consider Data Types:</strong> Our converter attempts to detect numbers and booleans, but you may need
          to manually adjust some values after conversion.
        </li>
      </ul>

      <h3>Working with the Generated JSON</h3>
      <p>After converting your CSV to JSON, you can:</p>
      <ul>
        <li>
          <strong>Use it in Web Applications:</strong> The JSON can be directly loaded into JavaScript applications
          using
          <code>fetch()</code> or imported as a module.
        </li>
        <li>
          <strong>Store in NoSQL Databases:</strong> JSON is the native format for document databases like MongoDB or
          CouchDB.
        </li>
        <li>
          <strong>Process with Node.js:</strong> Use JavaScript/Node.js to further transform or analyze the data.
        </li>
        <li>
          <strong>Send to APIs:</strong> Use the JSON as the body of API requests when integrating with other systems.
        </li>
      </ul>
    </ToolExplanation>
  )
}

function CsvToJsonTool() {
  const [csvInput, setCsvInput] = useState("")
  const [jsonOutput, setJsonOutput] = useState("")
  const [copied, setCopied] = useState(false)
  const [delimiter, setDelimiter] = useState("comma")
  const [prettyPrint, setPrettyPrint] = useState(true)
  const [firstRowAsHeaders, setFirstRowAsHeaders] = useState(true)

  // Convert CSV to JSON
  const convertToJSON = () => {
    if (!csvInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some CSV data to convert",
        variant: "destructive",
      })
      return
    }

    try {
      // Split into lines and filter out empty lines
      const lines = csvInput.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        toast({
          title: "No data found",
          description: "Please enter valid CSV data",
          variant: "destructive",
        })
        return
      }

      // Determine the delimiter to use
      const delimiterChar = delimiter === "comma" ? "," : delimiter === "tab" ? "\t" : ";"

      // Parse each line
      const rows = lines.map((line) => parseCsvLine(line, delimiterChar))

      // Process data
      let headers
      let dataRows

      if (firstRowAsHeaders) {
        // Use first row as headers
        headers = rows[0]
        dataRows = rows.slice(1)
      } else {
        // Generate numeric headers (0, 1, 2, ...)
        if (rows.length > 0) {
          headers = Array.from({ length: rows[0].length }, (_, i) => String(i))
          dataRows = rows
        } else {
          headers = []
          dataRows = []
        }
      }

      // Convert to JSON objects
      const jsonData = dataRows.map((row) => {
        const obj = {}
        headers.forEach((header, i) => {
          if (i < row.length) {
            // Try to parse numbers and booleans
            const value = row[i]
            if (value === "") {
              obj[header] = null
            } else if (value.toLowerCase() === "true") {
              obj[header] = true
            } else if (value.toLowerCase() === "false") {
              obj[header] = false
            } else if (!isNaN(value) && value.trim() !== "") {
              // Check if it's an integer or float
              if (value.includes(".")) {
                obj[header] = Number.parseFloat(value)
              } else {
                obj[header] = Number.parseInt(value, 10)
              }
            } else {
              obj[header] = value
            }
          } else {
            obj[header] = null
          }
        })
        return obj
      })

      // Convert to JSON string
      const jsonString = prettyPrint ? JSON.stringify(jsonData, null, 2) : JSON.stringify(jsonData)

      setJsonOutput(jsonString)

      toast({
        title: "Conversion complete",
        description: `Converted ${dataRows.length} rows to JSON format`,
      })
    } catch (error) {
      toast({
        title: "Error converting to JSON",
        description: "Please check your CSV format and try again",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  // Parse a CSV line, handling quoted fields
  const parseCsvLine = (line, delimiter) => {
    const result = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        // Handle quotes - toggle inQuotes state
        if (inQuotes && i < line.length - 1 && line[i + 1] === '"') {
          // Double quotes inside quoted field - add a single quote
          current += '"'
          i++ // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        result.push(current)
        current = ""
      } else {
        // Add character to current field
        current += char
      }
    }

    // Add the last field
    result.push(current)

    return result
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Copied to clipboard",
        description: "The JSON has been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      })
    }
  }

  const downloadJSON = () => {
    const blob = new Blob([jsonOutput], { type: "application/json;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "converted_data.json")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearAll = () => {
    setCsvInput("")
    setJsonOutput("")
    setCopied(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="relative inline-block">
            CSV to JSON Converter
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-orange-400 to-teal-400 rounded-full"></div>
          </CardTitle>
          <CardDescription>Paste your CSV data below to convert it to JSON format.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Delimiter</Label>
                <RadioGroup
                  defaultValue="comma"
                  value={delimiter}
                  onValueChange={setDelimiter}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comma" id="comma-delimiter" />
                    <Label htmlFor="comma-delimiter">Comma</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tab" id="tab-delimiter" />
                    <Label htmlFor="tab-delimiter">Tab</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="semicolon" id="semicolon-delimiter" />
                    <Label htmlFor="semicolon-delimiter">Semicolon</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-col sm:justify-end">
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <Switch id="first-row-headers" checked={firstRowAsHeaders} onCheckedChange={setFirstRowAsHeaders} />
                  <Label htmlFor="first-row-headers">First row as headers</Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors mt-2">
                  <Switch id="pretty-print" checked={prettyPrint} onCheckedChange={setPrettyPrint} />
                  <Label htmlFor="pretty-print">Pretty print JSON</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csvInput">CSV Input</Label>
              <Textarea
                id="csvInput"
                placeholder="Paste your CSV data here"
                className="min-h-[200px] font-mono text-sm"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={convertToJSON}>Convert to JSON</Button>
              {jsonOutput && (
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {jsonOutput && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>JSON Output</CardTitle>
              <CardDescription>Ready to use in your applications</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy JSON
              </Button>
              <Button variant="outline" onClick={downloadJSON} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea className="min-h-[300px] font-mono text-sm" readOnly value={jsonOutput} />
          </CardContent>
        </Card>
      )}
    </>
  )
}
