import fs from "fs";
import path from "path";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lookup Fields PRD - Citrus Surf",
  description: "Product requirements document for lookup fields feature",
};

function readMarkdownFile(filePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), "prd", filePath);
    return fs.readFileSync(fullPath, "utf8");
  } catch {
    return "# File not found\n\nThe requested file could not be found.";
  }
}

function formatMarkdown(content: string): string {
  // Simple markdown-to-HTML conversion for basic formatting
  return content
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-3 mt-6 text-gray-900 dark:text-gray-100">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="text-lg font-medium mb-2 mt-4 text-gray-900 dark:text-gray-100">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^```(\w*)\n([\s\S]*?)```/gm, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4"><code class="text-sm font-mono">$2</code></pre>')
    .replace(/^- \[ \] (.*$)/gm, '<li class="mb-1 flex items-center"><input type="checkbox" class="mr-2" disabled> $1</li>')
    .replace(/^- \[x\] (.*$)/gm, '<li class="mb-1 flex items-center"><input type="checkbox" class="mr-2" checked disabled> $1</li>')
    .replace(/^- (.*$)/gm, '<li class="mb-1">$1</li>')
    .replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">$1</ul>')
    .replace(/^\| (.*) \|$/gm, (match, content) => {
      const cells = content.split(' | ').map((cell: string) => `<td class="border border-gray-300 dark:border-gray-600 px-3 py-2">${cell}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/(\<tr\>.*\<\/tr\>)/gs, '<table class="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-4">$1</table>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 dark:text-gray-300">')
    .replace(/^(?!<[h1-6]|<ul|<pre|<table)(.+)$/gm, '<p class="mb-4 text-gray-700 dark:text-gray-300">$1</p>');
}

export default function LookupFieldsPRD() {
  const content = readMarkdownFile("lookup-fields/prd.md");
  
  return (
    <div className="prose prose-lg max-w-none">
      <div
        dangerouslySetInnerHTML={{
          __html: formatMarkdown(content),
        }}
      />
    </div>
  );
}