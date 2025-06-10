"use client"

import { useState } from "react"
import { Clipboard, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { ArrowRight, Database, FileText, FileJson, Table } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return <HomePage />
}

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Data Tools Portal</h1>
        <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
          Simple, powerful tools to help you work with your data more efficiently.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:gap-12">
        <Card className="flex flex-col">
          <CardHeader>
            <Database className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>CSV to SQL Converter</CardTitle>
            <CardDescription>
              Convert CSV or tab-delimited data into SQL VALUES format with proper escaping.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Support for tab and comma delimiters</li>
              <li>Proper SQL string escaping</li>
              <li>Copy results with one click</li>
              <li>Clean VALUES output ready for import</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/tools/sql" className="flex items-center justify-center">
                Open CSV to SQL Tool
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <FileText className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Text Slugifier</CardTitle>
            <CardDescription>Convert text into URL-friendly slugs for web content and SEO.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Process multiple lines at once</li>
              <li>Table and text view options</li>
              <li>Copy individual or all slugs</li>
              <li>Clean, SEO-friendly output</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/tools/slugify" className="flex items-center justify-center">
                Open Slugify Tool
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <FileJson className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>JSON to CSV Converter</CardTitle>
            <CardDescription>
              Convert JSON arrays of objects into CSV format for spreadsheet applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Handles nested JSON structures</li>
              <li>Automatically extracts column headers</li>
              <li>Choose delimiter options</li>
              <li>Copy or download results</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/tools/json-to-csv" className="flex items-center justify-center">
                Open JSON to CSV Tool
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <Table className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>CSV to JSON Converter</CardTitle>
            <CardDescription>Transform CSV data into JSON format for APIs and web applications.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Support for different delimiters</li>
              <li>First row as object keys</li>
              <li>Pretty or compact JSON output</li>
              <li>Copy with a single click</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/tools/csv-to-json" className="flex items-center justify-center">
                Open CSV to JSON Tool
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Why Use Our Tools?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-xl font-medium">Fast & Efficient</h3>
            <p className="text-muted-foreground">Process your data quickly without uploading to external servers.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium">Privacy-Focused</h3>
            <p className="text-muted-foreground">
              All processing happens in your browser. Your data never leaves your device.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium">Free to Use</h3>
            <p className="text-muted-foreground">All tools are completely free with no limits or restrictions.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DataToolsPortal() {
  const [activeTab, setActiveTab] = useState("sql")

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Data Tools Portal</h1>

      <Tabs defaultValue="sql" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="sql">CSV to SQL</TabsTrigger>
          <TabsTrigger value="slugify">Slugify Text</TabsTrigger>
        </TabsList>

        <TabsContent value="sql">
          <SqlConverterTool />
        </TabsContent>

        <TabsContent value="slugify">
          <SlugifyTool />
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-zA-Z0-9 -]/g, "")
    .replaceAll(/[_\s-]+/g, "-")
    .replaceAll(/^-/g, "")
    .replaceAll(/-$/g, "")
}

function SlugifyTool() {
  const [input, setInput] = useState("")
  const [slugified, setSlugified] = useState<{ original: string; slug: string }[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [allCopied, setAllCopied] = useState(false)

  const processInput = () => {
    if (!input.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some text to slugify",
        variant: "destructive",
      })
      return
    }

    // Split by newlines to handle both CSV and plain text
    const lines = input.split("\n").filter((line) => line.trim() !== "")

    const results = lines.map((line) => {
      const trimmed = line.trim()
      return {
        original: trimmed,
        slug: slugify(trimmed),
      }
    })

    setSlugified(results)
    toast({
      title: "Processing complete",
      description: `Slugified ${results.length} items`,
    })
  }

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text)

      if (index !== undefined) {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      } else {
        setAllCopied(true)
        setTimeout(() => setAllCopied(false), 2000)
      }

      toast({
        title: "Copied to clipboard",
        description: "The text has been copied to your clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      })
    }
  }

  const copyAllSlugs = () => {
    const allSlugs = slugified.map((item) => item.slug).join("\n")
    copyToClipboard(allSlugs)
  }

  const clearAll = () => {
    setInput("")
    setSlugified([])
    setCopiedIndex(null)
    setAllCopied(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>Paste your text or CSV data below. Each line will be converted to a slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to slugify (one item per line)"
            className="min-h-[150px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex gap-2 mt-4">
            <Button onClick={processInput}>Slugify</Button>
            {slugified.length > 0 && (
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {slugified.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>{slugified.length} items slugified</CardDescription>
            </div>
            <Button variant="outline" onClick={copyAllSlugs} className="flex items-center gap-2">
              {allCopied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              Copy All Slugs
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="table">
              <TabsList className="mb-4">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="text">Text View</TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                <div className="border rounded-md">
                  <div className="grid grid-cols-[1fr_1fr_auto] font-medium border-b">
                    <div className="p-3">Original</div>
                    <div className="p-3">Slug</div>
                    <div className="p-3">Action</div>
                  </div>
                  <div className="divide-y">
                    {slugified.map((item, index) => (
                      <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center">
                        <div className="p-3 truncate" title={item.original}>
                          {item.original}
                        </div>
                        <div className="p-3 font-mono text-sm truncate" title={item.slug}>
                          {item.slug}
                        </div>
                        <div className="p-3">
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.slug, index)}>
                            {copiedIndex === index ? (
                              <ClipboardCheck className="h-4 w-4" />
                            ) : (
                              <Clipboard className="h-4 w-4" />
                            )}
                            <span className="sr-only">Copy</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text">
                <Textarea
                  className="min-h-[200px] font-mono text-sm"
                  readOnly
                  value={slugified.map((item) => item.slug).join("\n")}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
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
