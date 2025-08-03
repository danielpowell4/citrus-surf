import fs from "fs";
import path from "path";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// Map of ticket slugs to actual filenames
const ticketFiles: Record<string, string> = {
  "lookup-001": "LOOKUP-001-core-types.md",
  "lookup-002": "LOOKUP-002-reference-data-manager.md", 
  "lookup-003": "LOOKUP-003-target-shapes-integration.md",
  "lookup-004": "LOOKUP-004-matching-engine.md",
  "lookup-005": "LOOKUP-005-data-processing-integration.md",
  "lookup-006": "LOOKUP-006-validation-system.md",
  "lookup-007": "LOOKUP-007-editable-cell-component.md",
  "lookup-008": "LOOKUP-008-reference-data-viewer.md",
  "lookup-009": "LOOKUP-009-template-builder-integration.md",
  "lookup-010": "LOOKUP-010-fuzzy-match-review-ui.md",
  "lookup-011": "LOOKUP-011-routing-and-navigation.md",
  "lookup-012": "LOOKUP-012-integration-and-polish.md",
};

const ticketTitles: Record<string, string> = {
  "lookup-001": "LOOKUP-001: Core Type Definitions",
  "lookup-002": "LOOKUP-002: Reference Data Manager",
  "lookup-003": "LOOKUP-003: Target Shapes Integration", 
  "lookup-004": "LOOKUP-004: Lookup Matching Engine",
  "lookup-005": "LOOKUP-005: Data Processing Integration",
  "lookup-006": "LOOKUP-006: Enhanced Validation System",
  "lookup-007": "LOOKUP-007: Lookup Editable Cell Component",
  "lookup-008": "LOOKUP-008: Reference Data Viewer & Editor",
  "lookup-009": "LOOKUP-009: Template Builder Integration",
  "lookup-010": "LOOKUP-010: Fuzzy Match Review UI",
  "lookup-011": "LOOKUP-011: Routing and Navigation Patterns",
  "lookup-012": "LOOKUP-012: Integration and Polish",
};

type Props = {
  params: { ticket: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const title = ticketTitles[params.ticket] || "Ticket Not Found";
  
  return {
    title: `${title} - Citrus Surf`,
    description: `Implementation ticket: ${title}`,
  };
}

function readMarkdownFile(filePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), "prd", filePath);
    return fs.readFileSync(fullPath, "utf8");
  } catch (error) {
    return "";
  }
}

function formatMarkdown(content: string): string {
  // Enhanced markdown-to-HTML conversion with checkbox support
  return content
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-3 mt-6 text-gray-900 dark:text-gray-100">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="text-lg font-medium mb-2 mt-4 text-gray-900 dark:text-gray-100">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-700 dark:text-blue-300">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^```(\w*)\n([\s\S]*?)```/gm, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4"><code class="text-sm font-mono">$2</code></pre>')
    // Enhanced checkbox rendering
    .replace(/^- \[ \] (.*$)/gm, '<li class="mb-1 flex items-start"><span class="inline-block w-4 h-4 mr-2 mt-0.5 border-2 border-gray-300 dark:border-gray-600 rounded"></span> <span>$1</span></li>')
    .replace(/^- \[x\] (.*$)/gm, '<li class="mb-1 flex items-start"><span class="inline-flex items-center justify-center w-4 h-4 mr-2 mt-0.5 bg-green-500 border-2 border-green-500 rounded text-white text-xs leading-none">✓</span> <span class="line-through text-gray-500">$1</span></li>')
    .replace(/^- (.*$)/gm, '<li class="mb-1 ml-6">• $1</li>')
    .replace(/(<li.*<\/li>)/s, '<ul class="mb-4 space-y-1 text-gray-700 dark:text-gray-300">$1</ul>')
    // Table processing
    .replace(/^\| (.*) \|$/gm, (match, content) => {
      const cells = content.split(' | ').map((cell: string) => {
        if (cell.includes('---')) {
          return `<th class="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 font-semibold text-left">${cell.replace(/-+/g, '')}</th>`;
        }
        return `<td class="border border-gray-300 dark:border-gray-600 px-3 py-2">${cell}</td>`;
      }).join('');
      
      if (content.includes('---')) {
        return `<thead><tr>${cells}</tr></thead><tbody>`;
      }
      return `<tr>${cells}</tr>`;
    })
    .replace(/(\<thead\>.*\<tbody\>.*\<tr\>.*\<\/tr\>)/gs, '<table class="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-4">$1</tbody></table>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 dark:text-gray-300">')
    .replace(/^(?!<[h1-6]|<ul|<pre|<table)(.+)$/gm, '<p class="mb-4 text-gray-700 dark:text-gray-300">$1</p>');
}

export default function TicketPage({ params }: Props) {
  const filename = ticketFiles[params.ticket];
  
  if (!filename) {
    notFound();
  }
  
  const content = readMarkdownFile(`lookup-fields/tickets/${filename}`);
  
  if (!content) {
    notFound();
  }
  
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

export async function generateStaticParams() {
  return Object.keys(ticketFiles).map((ticket) => ({
    ticket,
  }));
}