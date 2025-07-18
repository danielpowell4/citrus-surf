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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { NavBar } from "@/components/nav-bar";
import { ToolExplanation } from "@/components/tool-explanation";

export default function SlugifyPage() {
  return (
    <>
      <NavBar />
      <SlugifyTool />
      <SlugifyExplanation />
    </>
  );
}

function SlugifyExplanation() {
  return (
    <ToolExplanation
      title="About Text Slugifier"
      description="Learn how to create SEO-friendly URLs with slugs"
    >
      <h3>What is a Slug?</h3>
      <p>
        A slug is a URL-friendly version of a string, typically used in web
        addresses. Slugs are created by converting a string to lowercase,
        removing special characters, and replacing spaces with hyphens. They
        make URLs more readable for both humans and search engines.
      </p>

      <h3>Why Use Slugs?</h3>
      <ul>
        <li>
          <strong>SEO Benefits:</strong> Search engines prefer descriptive,
          keyword-rich URLs over cryptic ones with parameters and IDs.
        </li>
        <li>
          <strong>User Experience:</strong> Readable URLs are easier to
          remember, share, and understand.
        </li>
        <li>
          <strong>Consistency:</strong> Slugs provide a standardized way to
          represent content titles in URLs.
        </li>
        <li>
          <strong>Accessibility:</strong> Screen readers can better interpret
          descriptive URLs, improving accessibility.
        </li>
      </ul>

      <h3>Common Use Cases</h3>
      <ul>
        <li>
          <strong>Blog Posts:</strong> Converting article titles to slugs for
          URL paths (e.g., "10-tips-for-better-seo").
        </li>
        <li>
          <strong>Product Pages:</strong> Creating clean URLs for e-commerce
          products (e.g., "blue-cotton-t-shirt-large").
        </li>
        <li>
          <strong>Category Pages:</strong> Generating readable URLs for content
          categories (e.g., "web-development/javascript").
        </li>
        <li>
          <strong>User Profiles:</strong> Creating vanity URLs for user profiles
          (e.g., "john-doe").
        </li>
      </ul>

      <h3>Best Practices for Creating Slugs</h3>
      <ol>
        <li>
          <strong>Keep them short:</strong> Aim for concise slugs that capture
          the essence of the content without being too long.
        </li>
        <li>
          <strong>Use keywords:</strong> Include relevant keywords to improve
          SEO, but avoid keyword stuffing.
        </li>
        <li>
          <strong>Avoid stop words:</strong> Consider removing common words like
          "a," "the," "and," etc., unless they're essential for meaning.
        </li>
        <li>
          <strong>Use hyphens, not underscores:</strong> Search engines
          recognize hyphens as word separators, but not underscores.
        </li>
        <li>
          <strong>Ensure uniqueness:</strong> Each slug should be unique within
          its context to avoid conflicts.
        </li>
      </ol>

      <h3>How Our Slugifier Works</h3>
      <p>Our slugifier tool follows these steps to convert text into slugs:</p>
      <ol>
        <li>Convert all characters to lowercase</li>
        <li>Remove all special characters and punctuation</li>
        <li>Replace spaces and underscores with hyphens</li>
        <li>Remove leading and trailing hyphens</li>
        <li>
          Handle multiple consecutive hyphens by reducing them to a single
          hyphen
        </li>
      </ol>

      <h3>Using Slugs in Different Frameworks</h3>
      <h4>Next.js</h4>
      <p>
        In Next.js, you can use slugs for dynamic routes by creating files like{" "}
        <code>[slug].js</code> or <code>[slug]/page.js</code> (in App Router).
        The slug value is then accessible via <code>params.slug</code> in your
        page component.
      </p>

      <h4>Express.js</h4>
      <p>
        In Express.js, you can define routes with slug parameters like{" "}
        <code>app.get('/posts/:slug', ...)</code> and access them via{" "}
        <code>req.params.slug</code>.
      </p>

      <h4>Django</h4>
      <p>
        Django has built-in support for slugs with the <code>SlugField</code>{" "}
        model field, which automatically validates that the value contains only
        letters, numbers, underscores, and hyphens.
      </p>
    </ToolExplanation>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-zA-Z0-9 -]/g, "")
    .replaceAll(/[_\s-]+/g, "-")
    .replaceAll(/^-/g, "")
    .replaceAll(/-$/g, "");
}

function SlugifyTool() {
  const [input, setInput] = useState("");
  const [slugified, setSlugified] = useState<
    { original: string; slug: string }[]
  >([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const processInput = () => {
    if (!input.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some text to slugify",
        variant: "destructive",
      });
      return;
    }

    // Split by newlines to handle both CSV and plain text
    const lines = input.split("\n").filter(line => line.trim() !== "");

    const results = lines.map(line => {
      const trimmed = line.trim();
      return {
        original: trimmed,
        slug: slugify(trimmed),
      };
    });

    setSlugified(results);
    toast({
      title: "Processing complete",
      description: `Slugified ${results.length} items`,
    });
  };

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);

      if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setAllCopied(true);
        setTimeout(() => setAllCopied(false), 2000);
      }

      toast({
        title: "Copied to clipboard",
        description: "The text has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };

  const copyAllSlugs = () => {
    const allSlugs = slugified.map(item => item.slug).join("\n");
    copyToClipboard(allSlugs);
  };

  const clearAll = () => {
    setInput("");
    setSlugified([]);
    setCopiedIndex(null);
    setAllCopied(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="relative inline-block">
            Text Slugifier
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-orange-400 to-teal-400 rounded-full"></div>
          </CardTitle>
          <CardDescription>
            Paste your text or CSV data below. Each line will be converted to a
            slug.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to slugify (one item per line)"
            className="min-h-[150px]"
            value={input}
            onChange={e => setInput(e.target.value)}
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
              <CardDescription>
                {slugified.length} items slugified
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={copyAllSlugs}
              className="flex items-center gap-2"
            >
              {allCopied ? (
                <ClipboardCheck className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
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
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_1fr_auto] items-center"
                      >
                        <div className="p-3 truncate" title={item.original}>
                          {item.original}
                        </div>
                        <div
                          className="p-3 font-mono text-sm truncate"
                          title={item.slug}
                        >
                          {item.slug}
                        </div>
                        <div className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(item.slug, index)}
                          >
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
                  value={slugified.map(item => item.slug).join("\n")}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </>
  );
}
