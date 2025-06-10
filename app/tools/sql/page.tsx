"use client"

import { useState } from "react"
import { Clipboard, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { NavBar } from "@/components/nav-bar"

export default function SqlConverterPage() {
  return (
    <>
      <NavBar />
      <SqlConverterTool />
    </>
  )
}

function SqlConverterTool() {
  const [csvInput, setCsvInput] = useState("")
  const [sqlOutput, setSqlOutput] = useState("")
  const [copied, setCopied] = useState(false)
  const [delimiter, setDelimiter] = useState("tab")

  // Parse CSV and convert to SQL VALUES format
  const convertToSql = () => {
    if (!csvInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some data to convert",
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
          description: "Please enter valid data",
          variant: "destructive",
        })
        return
      }

      // Determine the delimiter to use
      const delimiterChar = delimiter === "tab" ? "\t" : delimiter === "comma" ? "," : "\t"

      // Parse each line
      const rows = lines.map((line) => parseLine(line, delimiterChar))

      // Process data rows
      const valueRows = []
      for (let i = 0; i < rows.length; i++) {
        const values = rows[i]

        // Escape and format values for SQL - always wrap in quotes regardless of type
        const escapedValues = values.map((value) => {
          // Escape single quotes by doubling them (SQL standard)
          const escaped = value.replace(/'/g, "''")
          return `'${escaped}'`
        })

        valueRows.push(`(${escapedValues.join(", ")})`)
      }

      // Join all value rows with commas
      const sql = valueRows.join(",\n") + ";"

      setSqlOutput(sql)

      toast({
        title: "Conversion complete",
        description: `Converted ${valueRows.length} rows to SQL format`,
      })
    } catch (error) {
      toast({
        title: "Error converting to SQL",
        description: "Please check your data format and try again",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  // Parse a line with the given delimiter
  const parseLine = (line: string, delimiter: string): string[] => {
    // For tab-delimited data, just split by tabs
    if (delimiter === "\t") {
      return line.split("\t")
    }

    // For comma-delimited data, handle quoted fields
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
      await navigator.clipboard.writeText(sqlOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Copied to clipboard",
        description: "The SQL has been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      })
    }
  }

  const clearAll = () => {
    setCsvInput("")
    setSqlOutput("")
    setCopied(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data to SQL Converter</CardTitle>
          <CardDescription>Paste your data below to convert it to SQL VALUES format for import.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delimiter</Label>
              <RadioGroup defaultValue="tab" value={delimiter} onValueChange={setDelimiter} className="flex space-x-4">
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

            <div className="space-y-2">
              <Label htmlFor="csvInput">Input Data</Label>
              <Textarea
                id="csvInput"
                placeholder="Paste your data here"
                className="min-h-[150px] font-mono text-sm"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={convertToSql}>Convert to SQL</Button>
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
            <Button variant="outline" onClick={copyToClipboard} className="flex items-center gap-2">
              {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              Copy SQL
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea className="min-h-[300px] font-mono text-sm" readOnly value={sqlOutput} />
          </CardContent>
        </Card>
      )}
    </>
  )
}
