import fs from "fs";
import path from "path";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import MarkdownRenderer from '@/components/markdown-renderer';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.join(' / ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    title: `${title} - Citrus Surf Docs`,
    description: `Documentation: ${title}`,
  };
}

function readMarkdownFile(filePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return fs.readFileSync(fullPath, "utf8");
  } catch {
    return "";
  }
}

function getDirectoryItems(dirPath: string) {
  try {
    const fullPath = path.join(process.cwd(), dirPath);
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    return entries
      .filter(entry => {
        if (entry.name.startsWith('.')) return false;
        if (entry.isFile() && !entry.name.endsWith('.md')) return false;
        return true;
      })
      .map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(dirPath, entry.name),
      }))
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
  } catch {
    return null;
  }
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const docPath = `docs/${slug.join('/')}`;
  
  // Try to read as markdown file first
  const markdownPath = `${docPath}.md`;
  const content = readMarkdownFile(markdownPath);
  
  if (content) {
    // It's a markdown file
    const breadcrumbs = ['docs', ...slug];
    
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <div className="flex min-h-screen">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-8">
                {/* Breadcrumb and back button */}
                <div className="mb-8">
                  <Link href="/docs">
                    <Button variant="ghost" className="mb-4">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Docs
                    </Button>
                  </Link>
                  
                  <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {breadcrumbs.map((crumb, index) => (
                      <span key={index}>
                        {index > 0 && ' / '}
                        {index === breadcrumbs.length - 1 ? (
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {crumb.replace(/-/g, ' ')}
                          </span>
                        ) : (
                          <Link 
                            href={`/${breadcrumbs.slice(0, index + 1).join('/')}`}
                            className="hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {crumb.replace(/-/g, ' ')}
                          </Link>
                        )}
                      </span>
                    ))}
                  </nav>
                </div>

                {await MarkdownRenderer({ content })}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Try to read as directory
  const directoryItems = getDirectoryItems(docPath);
  
  if (directoryItems) {
    // It's a directory
    const breadcrumbs = ['docs', ...slug];
    
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <div className="flex min-h-screen">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto p-8">
                {/* Breadcrumb and back button */}
                <div className="mb-8">
                  <Link href="/docs">
                    <Button variant="ghost" className="mb-4">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Docs
                    </Button>
                  </Link>
                  
                  <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {breadcrumbs.map((crumb, index) => (
                      <span key={index}>
                        {index > 0 && ' / '}
                        {index === breadcrumbs.length - 1 ? (
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {crumb.replace(/-/g, ' ')}
                          </span>
                        ) : (
                          <Link 
                            href={`/${breadcrumbs.slice(0, index + 1).join('/')}`}
                            className="hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {crumb.replace(/-/g, ' ')}
                          </Link>
                        )}
                      </span>
                    ))}
                  </nav>
                  
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {slug[slug.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h1>
                </div>

                {/* Directory contents */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {directoryItems.map((item) => {
                    const itemSlug = item.isDirectory 
                      ? [...slug, item.name].join('/')
                      : [...slug, item.name.replace('.md', '')].join('/');
                    
                    return (
                      <Link key={item.name} href={`/docs/${itemSlug}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              {item.isDirectory ? (
                                <Folder className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                              ) : (
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              )}
                              <CardTitle className="text-base">
                                {item.name.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </CardTitle>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Neither file nor directory found
  notFound();
}

export async function generateStaticParams() {
  function getAllDocPaths(dirPath: string, basePath: string[] = []): string[][] {
    const paths: string[][] = [];
    
    try {
      const fullPath = path.join(process.cwd(), dirPath);
      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        
        if (entry.isDirectory()) {
          // Add directory path
          paths.push([...basePath, entry.name]);
          // Recursively get paths from subdirectory
          const subPaths = getAllDocPaths(
            path.join(dirPath, entry.name), 
            [...basePath, entry.name]
          );
          paths.push(...subPaths);
        } else if (entry.name.endsWith('.md')) {
          // Add markdown file path (without .md extension)
          paths.push([...basePath, entry.name.replace('.md', '')]);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
    
    return paths;
  }
  
  const allPaths = getAllDocPaths('docs');
  
  return allPaths.map((slug) => ({
    slug,
  }));
}