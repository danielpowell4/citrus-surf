"use client";

import { useEffect, useState } from "react";
import { Clipboard, ClipboardCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiffViewerProps {
  left: any;
  right: any;
  showUnchanged: boolean;
}

// Custom renderer for JSON diff
export default function CustomDiffViewer({
  left,
  right,
  showUnchanged,
}: DiffViewerProps) {
  const [diffResult, setDiffResult] = useState<any>(null);
  const [diffHtml, setDiffHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ added: 0, removed: 0, changed: 0 });
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "raw">("visual");

  useEffect(() => {
    const computeDiff = async () => {
      try {
        setIsLoading(true);

        // Import jsondiffpatch
        const { DiffPatcher } = await import("jsondiffpatch");

        // Create a custom hash function for objects in arrays
        const objectHash = (obj: any) => {
          // If it's not an object or is null, stringify it
          if (typeof obj !== "object" || obj === null) {
            return JSON.stringify(obj);
          }

          // For objects with id or key properties, use those for identity
          if (obj.id !== undefined) return obj.id;
          if (obj.key !== undefined) return obj.key;
          if (obj.name !== undefined) return obj.name;
          if (obj.platform_id !== undefined) return obj.platform_id;

          // For other objects, try to create a stable hash from key properties
          // This helps identify the "same" object across arrays
          const keyProps = Object.keys(obj).sort();
          if (keyProps.length > 0) {
            // Use the first property as an identifier if possible
            // This is a heuristic that works well for many cases
            return obj[keyProps[0]];
          }

          // Fallback to full object stringification
          return JSON.stringify(obj);
        };

        const diffpatcher = new DiffPatcher({
          objectHash,
          arrays: {
            // Use LCS for better array diffing
            detectMove: true,
            includeValueOnMove: true,
          },
          propertyFilter: (name: string) => {
            return showUnchanged || name.slice(0, 2) !== "__";
          },
          textDiff: {
            // For longer text values, use text diffing
            minLength: 60,
          },
        });

        // Compute the diff
        const delta = diffpatcher.diff(left, right);
        setDiffResult(delta);

        // Calculate stats
        const calculateStats = (obj: any) => {
          let added = 0;
          let removed = 0;
          let changed = 0;

          const processValue = (value: any) => {
            if (Array.isArray(value) && value.length > 0) {
              if (value[0] === "+") added++;
              else if (value[0] === "-") removed++;
              else if (
                value.length === 2 &&
                value[0] !== " " &&
                value[1] !== " "
              )
                changed++;
            } else if (value && typeof value === "object") {
              // Special case for array diffs
              if (value._t === "a") {
                const arrayDiff = { ...value };
                delete arrayDiff._t;

                Object.entries(arrayDiff).forEach(([key, val]) => {
                  if (key.startsWith("_")) return; // Skip internal properties

                  if (Array.isArray(val)) {
                    if (val[0] === "+") added++;
                    else if (val[0] === "-") removed++;
                    else if (val.length === 3 && val[2] === 0) removed++;
                    else if (val.length === 3 && val[2] === 2) added++;
                    else if (val.length === 3 && val[2] === 3) changed++; // Moved
                  } else if (val && typeof val === "object") {
                    const nestedStats = calculateStats(val);
                    added += nestedStats.added;
                    removed += nestedStats.removed;
                    changed += nestedStats.changed;
                  }
                });
              } else {
                // Regular object
                Object.entries(value).forEach(([key, val]) => {
                  if (key.startsWith("_")) return; // Skip internal properties
                  processValue(val);
                });
              }
            }
          };

          if (typeof obj === "object" && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
              if (key.startsWith("_")) return; // Skip internal properties
              processValue(value);
            });
          }

          return { added, removed, changed };
        };

        if (delta) {
          setStats(calculateStats(delta));

          // Import the formatter
          const { formatters } = await import("jsondiffpatch");

          // Configure formatter
          formatters.html.showUnchanged(showUnchanged);

          // Generate HTML
          const html = formatters.html.format(delta);
          setDiffHtml(html);
        } else {
          setDiffHtml(
            "<div class='text-center p-4'>No differences found</div>"
          );
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error computing diff:", error);
        setIsLoading(false);
        toast({
          title: "Error computing diff",
          description: "There was an error comparing the JSON objects",
          variant: "destructive",
        });
      }
    };

    if (left && right) {
      computeDiff();
    }
  }, [left, right, showUnchanged]);

  // Copy diff as JSON
  const copyToClipboard = async () => {
    if (!diffResult) return;

    try {
      // Format the diff result as JSON
      const jsonStr = JSON.stringify(diffResult, null, 2);
      await navigator.clipboard.writeText(jsonStr);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Copied to clipboard",
        description: "The diff has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };

  // Download diff as JSON file
  const downloadDiff = () => {
    if (!diffResult) return;

    try {
      const jsonStr = JSON.stringify(diffResult, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "json-diff-result.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "The diff has been downloaded as a JSON file",
      });
    } catch (err) {
      toast({
        title: "Failed to download",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!diffResult) {
    return <div className="p-4 text-center">No differences found</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 inline-block bg-green-100 dark:bg-green-900 rounded-full"></span>
            <span>
              Added: <strong>{stats.added}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 inline-block bg-red-100 dark:bg-red-900 rounded-full"></span>
            <span>
              Removed: <strong>{stats.removed}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 inline-block bg-amber-100 dark:bg-amber-900 rounded-full"></span>
            <span>
              Changed: <strong>{stats.changed}</strong>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Tabs
            value={viewMode}
            onValueChange={value => setViewMode(value as "visual" | "raw")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="visual" className="text-xs px-2 py-1 h-6">
                Visual
              </TabsTrigger>
              <TabsTrigger value="raw" className="text-xs px-2 py-1 h-6">
                Raw
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-1 h-8"
          >
            {copied ? (
              <ClipboardCheck className="h-3 w-3" />
            ) : (
              <Clipboard className="h-3 w-3" />
            )}
            <span className="text-xs">Copy</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadDiff}
            className="flex items-center gap-1 h-8"
          >
            <Download className="h-3 w-3" />
            <span className="text-xs">Download</span>
          </Button>
        </div>
      </div>

      {viewMode === "visual" ? (
        <div
          className="border rounded-md p-4 overflow-auto max-h-[400px] font-mono text-sm jsondiffpatch-delta"
          dangerouslySetInnerHTML={{ __html: diffHtml }}
        />
      ) : (
        <div className="border rounded-md p-4 overflow-auto max-h-[400px] font-mono text-sm">
          <pre>{JSON.stringify(diffResult, null, 2)}</pre>
        </div>
      )}

      <style jsx global>{`
        /* jsondiffpatch styles */
        .jsondiffpatch-delta {
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .jsondiffpatch-delta ul {
          list-style-type: none;
          padding-left: 20px;
          margin: 0;
        }

        .jsondiffpatch-added .jsondiffpatch-property-name,
        .jsondiffpatch-added .jsondiffpatch-value pre,
        .jsondiffpatch-modified .jsondiffpatch-right-value pre,
        .jsondiffpatch-textdiff-added {
          background-color: rgba(0, 255, 0, 0.1);
          color: var(--foreground);
        }

        .jsondiffpatch-deleted .jsondiffpatch-property-name,
        .jsondiffpatch-deleted .jsondiffpatch-value pre,
        .jsondiffpatch-modified .jsondiffpatch-left-value pre,
        .jsondiffpatch-textdiff-deleted {
          background-color: rgba(255, 0, 0, 0.1);
          color: var(--foreground);
          text-decoration: line-through;
        }

        .jsondiffpatch-unchanged,
        .jsondiffpatch-movedestination {
          color: gray;
        }

        .jsondiffpatch-unchanged,
        .jsondiffpatch-movedestination > .jsondiffpatch-value {
          transition: all 0.5s;
          opacity: 0.6;
        }

        .jsondiffpatch-unchanged-showing .jsondiffpatch-unchanged,
        .jsondiffpatch-unchanged-showing
          .jsondiffpatch-movedestination
          > .jsondiffpatch-value {
          opacity: 1;
        }

        .jsondiffpatch-property-name {
          font-weight: bold;
          color: var(--foreground);
        }

        .jsondiffpatch-property-name:after {
          content: ": ";
        }

        .jsondiffpatch-value {
          color: var(--foreground);
        }

        .jsondiffpatch-child-node-type-array
          > .jsondiffpatch-property-name:after {
          content: ": [";
        }

        .jsondiffpatch-child-node-type-array:after {
          content: "],";
        }

        .jsondiffpatch-child-node-type-object
          > .jsondiffpatch-property-name:after {
          content: ": {";
        }

        .jsondiffpatch-child-node-type-object:after {
          content: "},";
        }

        .jsondiffpatch-value pre {
          font-family: monospace;
          margin: 0;
          padding: 0 2px;
          display: inline-block;
        }

        .dark .jsondiffpatch-added .jsondiffpatch-property-name,
        .dark .jsondiffpatch-added .jsondiffpatch-value pre,
        .dark .jsondiffpatch-modified .jsondiffpatch-right-value pre,
        .dark .jsondiffpatch-textdiff-added {
          background-color: rgba(0, 255, 0, 0.15);
          color: rgb(170, 255, 170);
        }

        .dark .jsondiffpatch-deleted .jsondiffpatch-property-name,
        .dark .jsondiffpatch-deleted .jsondiffpatch-value pre,
        .dark .jsondiffpatch-modified .jsondiffpatch-left-value pre,
        .dark .jsondiffpatch-textdiff-deleted {
          background-color: rgba(255, 0, 0, 0.15);
          color: rgb(255, 170, 170);
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
