import fs from "fs";
import path from "path";
import Link from "next/link";
import { FileText, Folder, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DocItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: Date;
}

function getDocItems(dirPath: string): DocItem[] {
  try {
    const fullPath = path.join(process.cwd(), dirPath);
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });

    return entries
      .filter(entry => {
        // Filter out hidden files and non-markdown files
        if (entry.name.startsWith(".")) return false;
        if (entry.isFile() && !entry.name.endsWith(".md")) return false;
        return true;
      })
      .map(entry => {
        const itemPath = path.join(fullPath, entry.name);
        const stats = fs.statSync(itemPath);

        return {
          name: entry.name,
          path: path.join(dirPath, entry.name),
          isDirectory: entry.isDirectory(),
          size: entry.isFile() ? stats.size : undefined,
          lastModified: stats.mtime,
        };
      })
      .sort((a, b) => {
        // Directories first, then files, both alphabetically
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
  } catch (error) {
    console.error("Error reading docs directory:", error);
    return [];
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocCategory(filename: string): string {
  if (filename.includes("target-shape")) return "Target Shapes";
  if (filename.includes("lookup") || filename.includes("reference-data"))
    return "Lookup System";
  if (filename.includes("history") || filename.includes("persistence"))
    return "State Management";
  if (filename.includes("import") || filename.includes("export"))
    return "Data Processing";
  if (filename.includes("style") || filename.includes("component"))
    return "UI/UX";
  if (filename.includes("test") || filename.includes("error"))
    return "Development";
  return "General";
}

function getDocPriority(filename: string): "high" | "medium" | "low" {
  const highPriority = [
    "README.md",
    "target-shapes.md",
    "import-system.md",
    "style-guide.md",
  ];
  const mediumPriority = [
    "export-system.md",
    "history-system.md",
    "editable-cells.md",
  ];

  if (highPriority.some(p => filename.includes(p))) return "high";
  if (mediumPriority.some(p => filename.includes(p))) return "medium";
  return "low";
}

export default function DocsPage() {
  const docItems = getDocItems("docs");
  const rootDocs = docItems.filter(item => !item.isDirectory);
  const directories = docItems.filter(item => item.isDirectory);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="flex min-h-screen">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-8">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Documentation
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Comprehensive documentation for the Citrus Surf codebase
                </p>
              </div>

              {/* Root Documentation Files */}
              <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                  Core Documentation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rootDocs.map(doc => {
                    const priority = getDocPriority(doc.name);
                    const category = getDocCategory(doc.name);
                    const slug = doc.name.replace(".md", "");

                    return (
                      <Link key={doc.path} href={`/docs/${slug}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              {priority === "high" && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <CardTitle className="text-lg leading-tight">
                              {doc.name
                                .replace(".md", "")
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, l => l.toUpperCase())}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                              {priority === "high" && (
                                <Badge variant="default" className="text-xs">
                                  Essential
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {doc.size && (
                                <span>{formatFileSize(doc.size)}</span>
                              )}
                              {doc.lastModified && (
                                <span className="ml-2">
                                  Updated{" "}
                                  {doc.lastModified.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Documentation Directories */}
              {directories.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                    Documentation Categories
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {directories.map(dir => {
                      const subItems = getDocItems(dir.path);

                      return (
                        <Link key={dir.path} href={`/docs/${dir.name}`}>
                          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-3">
                                <Folder className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                <CardTitle className="text-lg">
                                  {dir.name
                                    .replace(/-/g, " ")
                                    .replace(/\b\w/g, l => l.toUpperCase())}
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {subItems.length} document
                                {subItems.length !== 1 ? "s" : ""}
                              </p>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {subItems
                                  .slice(0, 3)
                                  .map(item => item.name.replace(".md", ""))
                                  .join(", ")}
                                {subItems.length > 3 && "..."}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
