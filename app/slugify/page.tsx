"use client"

import { useState } from "react"
import { Clipboard, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { NavBar } from "@/components/nav-bar"

export default function SlugifyPage() {
  return (
    <>
      <NavBar />
      <SlugifyTool />
    </>
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
