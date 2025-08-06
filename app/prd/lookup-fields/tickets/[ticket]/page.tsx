import fs from "fs";
import path from "path";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import MarkdownRenderer from '@/components/markdown-renderer';

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
  params: Promise<{ ticket: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticket } = await params;
  const title = ticketTitles[ticket] || "Ticket Not Found";
  
  return {
    title: `${title} - Citrus Surf`,
    description: `Implementation ticket: ${title}`,
  };
}

function readMarkdownFile(filePath: string): string {
  try {
    const fullPath = path.join(process.cwd(), "prd", filePath);
    return fs.readFileSync(fullPath, "utf8");
  } catch {
    return "";
  }
}

export default async function TicketPage({ params }: Props) {
  const { ticket } = await params;
  const filename = ticketFiles[ticket];
  
  if (!filename) {
    notFound();
  }
  
  const content = readMarkdownFile(`lookup-fields/tickets/${filename}`);
  
  if (!content) {
    notFound();
  }
  
  return <MarkdownRenderer content={content} />;
}

export async function generateStaticParams() {
  return Object.keys(ticketFiles).map((ticket) => ({
    ticket,
  }));
}