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

export default function CsvToJsonPage() {
  return (
    <>
      <NavBar />
      <CsvToJsonTool />
    </>
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
          <CardTitle>CSV to JSON Converter</CardTitle>
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
                <div className="flex items-center space-x-2">
                  <Switch id="first-row-headers" checked={firstRowAsHeaders} onCheckedChange={setFirstRowAsHeaders} />
                  <Label htmlFor="first-row-headers">First row as headers</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
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
