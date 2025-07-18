"use client";

import { useState } from "react";
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
import { NavBar } from "@/components/nav-bar";
import { Switch } from "@/components/ui/switch";
import dynamic from "next/dynamic";
import { ToolExplanation } from "@/components/tool-explanation";

// Dynamically import the custom diff viewer component with no SSR
const CustomDiffViewer = dynamic(() => import("./custom-diff-viewer"), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading diff viewer...</div>,
});

export default function JsonDiffPage() {
  return (
    <>
      <NavBar />
      <JsonDiffTool />
      <JsonDiffExplanation />
    </>
  );
}

function JsonDiffExplanation() {
  return (
    <ToolExplanation
      title="About JSON Diff Tool"
      description="Understanding and visualizing differences between JSON objects"
    >
      <h3>What is a JSON Diff Tool?</h3>
      <p>
        A JSON Diff tool compares two JSON objects and identifies the
        differences between them. It helps developers and data analysts
        understand what has changed between two versions of data, API responses,
        or configuration files. The tool highlights additions, deletions, and
        modifications, making it easy to spot changes at a glance.
      </p>

      <h3>Why Compare JSON Objects?</h3>
      <ul>
        <li>
          <strong>API Testing:</strong> Compare expected and actual API
          responses to identify discrepancies.
        </li>
        <li>
          <strong>Configuration Management:</strong> Track changes in
          configuration files across environments or versions.
        </li>
        <li>
          <strong>Data Validation:</strong> Verify that data transformations
          produce the expected results.
        </li>
        <li>
          <strong>Debugging:</strong> Identify unexpected changes in data
          structures that might cause issues.
        </li>
        <li>
          <strong>Version Control:</strong> Understand what changed between
          different versions of a JSON document.
        </li>
      </ul>

      <h3>Key Features of Our JSON Diff Tool</h3>
      <ul>
        <li>
          <strong>Visual Comparison:</strong> Color-coded highlighting makes it
          easy to identify additions (green), deletions (red), and changes
          (amber).
        </li>
        <li>
          <strong>Nested Object Support:</strong> Accurately compares deeply
          nested objects and arrays.
        </li>
        <li>
          <strong>Array Matching:</strong> Intelligently matches array items
          based on key properties to show true differences rather than position
          shifts.
        </li>
        <li>
          <strong>Statistics:</strong> Provides counts of added, removed, and
          changed items for quick assessment.
        </li>
        <li>
          <strong>Raw View:</strong> Toggle between visual and raw JSON diff
          formats for different analysis needs.
        </li>
        <li>
          <strong>Copy and Download:</strong> Export the diff results for
          sharing or documentation.
        </li>
      </ul>

      <h3>Common Use Cases</h3>
      <h4>API Development and Testing</h4>
      <p>
        When developing or testing APIs, you often need to compare expected
        responses with actual ones. The JSON Diff tool makes it easy to spot
        discrepancies, helping you identify bugs or unexpected behavior quickly.
      </p>

      <h4>Configuration Management</h4>
      <p>
        Managing configurations across different environments (development,
        staging, production) can be challenging. By comparing configuration
        files, you can ensure consistency and identify potential issues before
        deployment.
      </p>

      <h4>Data Migration Validation</h4>
      <p>
        When migrating data between systems, comparing samples of the data
        before and after migration helps ensure that the process preserved all
        information correctly.
      </p>

      <h3>Understanding the Diff Output</h3>
      <ul>
        <li>
          <strong>Green Background:</strong> Indicates added properties or
          values that exist in the second JSON but not in the first.
        </li>
        <li>
          <strong>Red Background:</strong> Shows deleted properties or values
          that exist in the first JSON but not in the second.
        </li>
        <li>
          <strong>Amber Background:</strong> Highlights modified values where
          the property exists in both objects but with different values.
        </li>
      </ul>

      <h3>Tips for Effective JSON Comparison</h3>
      <ul>
        <li>
          <strong>Format Your JSON:</strong> Use the "Format" button to ensure
          your JSON is properly formatted before comparison.
        </li>
        <li>
          <strong>Show Unchanged Values:</strong> Toggle the "Show unchanged
          values" option to see the complete context of changes.
        </li>
        <li>
          <strong>Use Sample Data:</strong> If you're new to the tool, try the
          "Load Sample Data" button to see how the comparison works.
        </li>
        <li>
          <strong>Check Array Handling:</strong> Be aware that arrays are
          compared by position by default, but our tool tries to match objects
          within arrays by key properties when possible.
        </li>
      </ul>
    </ToolExplanation>
  );
}

function JsonDiffTool() {
  const [json1, setJson1] = useState("");
  const [json2, setJson2] = useState("");
  const [parsedJson1, setParsedJson1] = useState<any>(null);
  const [parsedJson2, setParsedJson2] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [diffReady, setDiffReady] = useState(false);

  // Compare the two JSON objects
  const compareJson = () => {
    setError(null);
    setDiffReady(false);

    if (!json1.trim() || !json2.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter JSON in both fields to compare",
        variant: "destructive",
      });
      return;
    }

    try {
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);

      setParsedJson1(obj1);
      setParsedJson2(obj2);
      setDiffReady(true);

      toast({
        title: "Comparison ready",
        description: "JSON objects parsed successfully",
      });
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format and try again",
        variant: "destructive",
      });
    }
  };

  // Format JSON
  const formatJson = (input: string, setter: (value: string) => void) => {
    try {
      const parsed = JSON.parse(input);
      setter(JSON.stringify(parsed, null, 2));
      toast({
        title: "JSON formatted",
        description: "Your JSON has been formatted with proper indentation",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format and try again",
        variant: "destructive",
      });
    }
  };

  // Clear all inputs and results
  const clearAll = () => {
    setJson1("");
    setJson2("");
    setParsedJson1(null);
    setParsedJson2(null);
    setDiffReady(false);
    setError(null);
  };

  // Load sample data with the specific example
  const loadSampleData = () => {
    setJson1(
      JSON.stringify(
        {
          name: "Product A",
          price: 19.99,
          features: [
            {
              key: "Durable",
              second: "From",
            },
            "Waterproof",
            "Lightweight",
          ],
          specs: {
            weight: "2.5kg",
            dimensions: {
              width: 10,
              height: 20,
              depth: 5,
            },
          },
          inStock: true,
        },
        null,
        2
      )
    );

    setJson2(
      JSON.stringify(
        {
          name: "Product A",
          price: 24.99,
          features: [
            {
              key: "Durable",
              second: "To",
            },
            "Waterproof",
            "Eco-friendly",
          ],
          specs: {
            weight: "2.2kg",
            dimensions: {
              width: 10,
              height: 20,
              depth: 5,
            },
            color: "Blue",
          },
        },
        null,
        2
      )
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="relative inline-block">
            JSON Diff Tool
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-orange-400 to-teal-400 rounded-full"></div>
          </CardTitle>
          <CardDescription>
            Compare two JSON objects and visualize the differences between them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between">
              <div className="flex gap-2">
                <Button onClick={compareJson}>Compare JSON</Button>
                <Button variant="outline" onClick={loadSampleData}>
                  Load Sample Data
                </Button>
                {(json1 || json2 || diffReady) && (
                  <Button variant="outline" onClick={clearAll}>
                    Clear All
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-unchanged"
                    checked={showUnchanged}
                    onCheckedChange={setShowUnchanged}
                  />
                  <Label htmlFor="show-unchanged">Show unchanged values</Label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="json1">First JSON</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatJson(json1, setJson1)}
                    className="h-7 px-2"
                  >
                    Format
                  </Button>
                </div>
                <Textarea
                  id="json1"
                  placeholder="Paste your first JSON object here"
                  className="min-h-[200px] font-mono text-sm"
                  value={json1}
                  onChange={e => setJson1(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="json2">Second JSON</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => formatJson(json2, setJson2)}
                    className="h-7 px-2"
                  >
                    Format
                  </Button>
                </div>
                <Textarea
                  id="json2"
                  placeholder="Paste your second JSON object here"
                  className="min-h-[200px] font-mono text-sm"
                  value={json2}
                  onChange={e => setJson2(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 border border-red-300 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-950/30">
                <h3 className="text-red-600 dark:text-red-400 font-medium mb-1">
                  Error
                </h3>
                <p>{error}</p>
              </div>
            )}

            {diffReady && !error && (
              <div className="border rounded-md p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Diff Result</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 inline-block bg-green-100 dark:bg-green-900 rounded-full"></span>
                      <span>Added</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 inline-block bg-red-100 dark:bg-red-900 rounded-full"></span>
                      <span>Removed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 inline-block bg-amber-100 dark:bg-amber-900 rounded-full"></span>
                      <span>Changed</span>
                    </div>
                  </div>
                </div>
                <CustomDiffViewer
                  left={parsedJson1}
                  right={parsedJson2}
                  showUnchanged={showUnchanged}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
