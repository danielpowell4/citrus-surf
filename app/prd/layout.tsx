"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";

interface NavItem {
  title: string;
  href?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: "PRD Overview",
    href: "/prd",
  },
  {
    title: "Lookup Fields",
    children: [
      {
        title: "PRD Document",
        href: "/prd/lookup-fields",
      },
      {
        title: "Implementation Roadmap",
        href: "/prd/lookup-fields/roadmap",
      },
      {
        title: "Tickets",
        children: [
          {
            title: "LOOKUP-001: Core Types",
            href: "/prd/lookup-fields/tickets/lookup-001",
          },
          {
            title: "LOOKUP-002: Reference Data Manager",
            href: "/prd/lookup-fields/tickets/lookup-002",
          },
          {
            title: "LOOKUP-003: Target Shapes Integration",
            href: "/prd/lookup-fields/tickets/lookup-003",
          },
          {
            title: "LOOKUP-004: Matching Engine",
            href: "/prd/lookup-fields/tickets/lookup-004",
          },
          {
            title: "LOOKUP-005: Data Processing Integration",
            href: "/prd/lookup-fields/tickets/lookup-005",
          },
          {
            title: "LOOKUP-006: Validation System",
            href: "/prd/lookup-fields/tickets/lookup-006",
          },
          {
            title: "LOOKUP-007: Editable Cell Component",
            href: "/prd/lookup-fields/tickets/lookup-007",
          },
          {
            title: "LOOKUP-008: Reference Data Viewer",
            href: "/prd/lookup-fields/tickets/lookup-008",
          },
          {
            title: "LOOKUP-009: Template Builder Integration",
            href: "/prd/lookup-fields/tickets/lookup-009",
          },
          {
            title: "LOOKUP-010: Fuzzy Match Review UI",
            href: "/prd/lookup-fields/tickets/lookup-010",
          },
          {
            title: "LOOKUP-011: Routing and Navigation",
            href: "/prd/lookup-fields/tickets/lookup-011",
          },
          {
            title: "LOOKUP-012: Integration and Polish",
            href: "/prd/lookup-fields/tickets/lookup-012",
          },
        ],
      },
    ],
  },
];

function NavItemComponent({
  item,
  level = 0,
}: {
  item: NavItem;
  level?: number;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(
    item.children?.some(
      child =>
        child.href === pathname ||
        child.children?.some(grandchild => grandchild.href === pathname)
    ) || false
  );

  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href === pathname;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center w-full px-2 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md",
            level > 0 && "ml-4"
          )}
        >
          <Folder className="h-4 w-4 mr-2 text-gray-500" />
          <span className="flex-1">{item.title}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {isOpen && (
          <div className="ml-2">
            {item.children.map((child, index) => (
              <NavItemComponent key={index} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md",
        level > 0 && "ml-4",
        isActive &&
          "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
      )}
    >
      <FileText className="h-4 w-4 mr-2 text-gray-500" />
      {item.title}
    </Link>
  );
}

export default function PRDLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Product Requirements
          </h2>
          <nav className="space-y-1">
            {navigationItems.map((item, index) => (
              <NavItemComponent key={index} item={item} />
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">{children}</div>
      </div>
    </div>
  );
}
