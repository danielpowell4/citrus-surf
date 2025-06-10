"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavBar() {
  const pathname = usePathname()

  return (
    <div className="flex w-full items-center justify-center mb-8 overflow-x-auto">
      <nav className="inline-flex items-center rounded-md border bg-muted p-1 text-muted-foreground">
        <Link
          href="/tools/sql"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pathname === "/tools/sql"
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50 hover:text-foreground",
          )}
        >
          CSV to SQL
        </Link>
        <Link
          href="/tools/slugify"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pathname === "/tools/slugify"
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50 hover:text-foreground",
          )}
        >
          Slugify Text
        </Link>
        <Link
          href="/tools/json-to-csv"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pathname === "/tools/json-to-csv"
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50 hover:text-foreground",
          )}
        >
          JSON to CSV
        </Link>
        <Link
          href="/tools/csv-to-json"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pathname === "/tools/csv-to-json"
              ? "bg-background text-foreground shadow-sm"
              : "hover:bg-background/50 hover:text-foreground",
          )}
        >
          CSV to JSON
        </Link>
      </nav>
    </div>
  )
}
