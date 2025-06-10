"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Database, FileText, FileJson, Table, GitCompare, Code } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return <HomePage />
}

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl theme-transition">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl relative">
          Data Tools Portal
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-400 via-yellow-400 to-teal-400 rounded-full"></div>
        </h1>
        <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
          Simple, powerful tools to help you work with your data more efficiently.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
        <Card className="flex flex-col">
          <CardHeader>
            <Database className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Spreadsheet to SQL Converter</CardTitle>
            <CardDescription>
              Convert CSV files, Google Spreadsheets, or Excel exports into SQL VALUES format with proper escaping.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Support for tab and comma delimiters</li>
              <li>Proper SQL string escaping</li>
              <li>Copy results with one click</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/tools/spreadsheet-to-sql-values" className="flex items-center justify-center">
                Open Spreadsheet to SQL Tool
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <Code className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>JSON to SQL Converter</CardTitle>
            <CardDescription>
              Transform JSON arrays into SQL VALUES, UPDATE loops, or INSERT statements for database operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Convert API responses to SQL</li>
              <li>Support for UPDATE and INSERT loops</li>
              <li>Type casting for PostgreSQL</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/tools/json-to-sql" className="flex items-center justify-center">
                Open JSON to SQL Tool
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

        <Card className="flex flex-col">
          <CardHeader>
            <GitCompare className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>JSON Diff Tool</CardTitle>
            <CardDescription>Compare two JSON objects and visualize the differences between them.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Side-by-side comparison</li>
              <li>Highlight added, removed, and changed values</li>
              <li>Collapsible nested objects</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/tools/json-diff" className="flex items-center justify-center">
                Open JSON Diff Tool
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4 relative inline-block">
          Why Use These Tools?
          <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-teal-400 to-orange-400 rounded-full"></div>
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2 p-4 rounded-lg bg-card border-2 border-transparent bg-gradient-to-br from-orange-50 to-teal-50 dark:from-orange-950/20 dark:to-teal-950/20 theme-transition hover:shadow-lg transition-all duration-300">
            <h3 className="text-xl font-medium">Fast & Efficient</h3>
            <p className="text-muted-foreground">Process your data quickly without uploading to external servers.</p>
          </div>
          <div className="space-y-2 p-4 rounded-lg bg-card border-2 border-transparent bg-gradient-to-br from-orange-50 to-teal-50 dark:from-orange-950/20 dark:to-teal-950/20 theme-transition hover:shadow-lg transition-all duration-300">
            <h3 className="text-xl font-medium">Privacy-Focused</h3>
            <p className="text-muted-foreground">
              All processing happens in your browser. Your data never leaves your device.
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-lg bg-card border-2 border-transparent bg-gradient-to-br from-orange-50 to-teal-50 dark:from-orange-950/20 dark:to-teal-950/20 theme-transition hover:shadow-lg transition-all duration-300">
            <h3 className="text-xl font-medium">Free to Use</h3>
            <p className="text-muted-foreground">All tools are completely free with no limits or restrictions.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
