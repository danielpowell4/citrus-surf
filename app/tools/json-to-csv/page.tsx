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

export default function JsonToCsvPage() {
  return (
    <>
      <NavBar />
      <JsonToCsvTool />
    </>
  )
}

function JsonToCsvTool() {
  const [jsonInput, setJsonInput] = useState("")
  const [csvOutput, setCsvOutput] = useState("")
  const [copied, setCopied] = useState(false)
  const [delimiter, setDelimiter] = useState("comma")
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [flattenObjects, setFlattenObjects] = useState(true)

  // Convert JSON to CSV
  const convertToCSV = () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some JSON data to convert",
        variant: "destructive",
      })
      return
    }

    try {
      // Parse JSON
      let jsonData
      try {
        jsonData = JSON.parse(jsonInput)
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please check your JSON format and try again",
          variant: "destructive",
        })
        return
      }

      // Ensure JSON is an array
      if (!Array.isArray(jsonData)) {
        if (typeof jsonData === "object" && jsonData !== null) {
          // If it's a single object, wrap it in an array
          jsonData = [jsonData]
        } else {
          toast({
            title: "Invalid JSON structure",
            description: "JSON must be an array of objects or a single object",
            variant: "destructive",
          })
          return
        }
      }

      if (jsonData.length === 0) {
        toast({
          title: "Empty JSON array",
          description: "The JSON array contains no items to convert",
          variant: "destructive",
        })
        return
      }

      // Get all possible headers from all objects
      const headers = new Set()
      jsonData.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          Object.keys(item).forEach((key) => {
            if (flattenObjects && typeof item[key] === "object" && item[key] !== null) {
              // For nested objects, flatten them with dot notation
              const nestedKeys = flattenObject(item[key], key)
              Object.keys(nestedKeys).forEach((nestedKey) => {
                headers.add(nestedKey)
              })
            } else {
              headers.add(key)
            }
          })
        }
      })

      const headerArray = Array.from(headers)

      // Determine the delimiter character
      const delimiterChar = delimiter === "comma" ? "," : delimiter === "tab" ? "\t" : ";"

      // Build CSV string
      let csv = ""

      // Add headers if requested
      if (includeHeaders) {
        csv += headerArray.join(delimiterChar) + "\n"
      }

      // Add data rows
      jsonData.forEach((item) => {
        if (typeof item !== "object" || item === null) {
          // Handle primitive values
          csv += String(item) + "\n"
          return
        }

        const flatItem = flattenObjects ? flattenObjectToDepth(item) : item
        const row = headerArray.map((header) => {
          const value = flatItem[header]
          if (value === undefined || value === null) return ""
          if (typeof value === "object") return JSON.stringify(value)

          // Escape values that contain the delimiter, quotes, or newlines
          let stringValue = String(value)
          if (stringValue.includes(delimiterChar) || stringValue.includes('"') || stringValue.includes("\n")) {
            // Escape double quotes by doubling them
            stringValue = stringValue.replace(/"/g, '""')
            // Wrap in quotes
            stringValue = `"${stringValue}"`
          }
          return stringValue
        })
        csv += row.join(delimiterChar) + "\n"
      })

      setCsvOutput(csv)

      toast({
        title: "Conversion complete",
        description: `Converted ${jsonData.length} JSON ${jsonData.length === 1 ? "item" : "items"} to CSV`,
      })
    } catch (error) {
      toast({
        title: "Error converting to CSV",
        description: "Please check your JSON format and try again",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  // Flatten nested objects with dot notation
  const flattenObject = (obj, prefix = "") => {
    const result = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, flattenObject(obj[key], newKey))
        } else {
          result[newKey] = obj[key]
        }
      }
    }
    return result
  }

  // Flatten object to a specified depth
  const flattenObjectToDepth = (obj, depth = 1, currentDepth = 0, prefix = "") => {
    const result = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key
        if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key]) && currentDepth < depth) {
          Object.assign(result, flattenObjectToDepth(obj[key], depth, currentDepth + 1, newKey))
        } else {
          result[newKey] = obj[key]
        }
      }
    }
    return result
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(csvOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Copied to clipboard",
        description: "The CSV has been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      })
    }
  }

  const downloadCSV = () => {
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "converted_data.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearAll = () => {
    setJsonInput("")
    setCsvOutput("")
    setCopied(false)
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed, null, 2))
      toast({
        title: "JSON formatted",
        description: "Your JSON has been formatted with proper indentation",
      })
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format and try again",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>JSON to CSV Converter</CardTitle>
          <CardDescription>Paste your JSON array of objects below to convert it to CSV format.</CardDescription>
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
                  <Switch id="include-headers" checked={includeHeaders} onCheckedChange={setIncludeHeaders} />
                  <Label htmlFor="include-headers">Include column headers</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch id="flatten-objects" checked={flattenObjects} onCheckedChange={setFlattenObjects} />
                  <Label htmlFor="flatten-objects">Flatten nested objects</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="jsonInput">JSON Input</Label>
                <Button variant="outline" size="sm" onClick={formatJson}>
                  Format JSON
                </Button>
              </div>
              <Textarea
                id="jsonInput"
                placeholder='Paste your JSON here. Example: [{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
                className="min-h-[200px] font-mono text-sm"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={convertToCSV}>Convert to CSV</Button>
              {csvOutput && (
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {csvOutput && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>CSV Output</CardTitle>
              <CardDescription>Ready to use in spreadsheet applications</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
                {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy CSV
              </Button>
              <Button variant="outline" onClick={downloadCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea className="min-h-[300px] font-mono text-sm" readOnly value={csvOutput} />
          </CardContent>
        </Card>
      )}
    </>
  )
}
