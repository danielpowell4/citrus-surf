import React, { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  children: React.ReactNode;
  isSorted: boolean;
  isSortedDesc: boolean | string | undefined;
  sortOrder?: number; // 1, 2, 3, etc. for multi-column sorting
  onSort: (event: React.MouseEvent | React.KeyboardEvent) => void;
  className?: string;
}

export function SortableHeader({
  children,
  isSorted,
  isSortedDesc,
  sortOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSort(event);
    } else if (event.key === "Escape") {
      // Clear focus
      (event.target as HTMLElement).blur();
    }
  };

  const getSortIcon = () => {
    if (!isSorted) {
      // Only show arrow on hover when not sorted
      return isHovered ? <ArrowUpDown className="h-4 w-4 opacity-60" /> : null;
    }
    return isSortedDesc === true || isSortedDesc === "desc" ? (
      <ArrowDown className="h-4 w-4" />
    ) : (
      <ArrowUp className="h-4 w-4" />
    );
  };

  const getSortState = () => {
    if (!isSorted) return "Click to sort ascending";
    return isSortedDesc === true || isSortedDesc === "desc"
      ? "Click to clear sort"
      : "Click to sort descending";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 cursor-pointer select-none hover:bg-muted/50 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative",
        isSorted && "bg-muted/30",
        className
      )}
      onClick={onSort}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Sort by ${children}${isSorted ? ` (${isSortedDesc === true || isSortedDesc === "desc" ? "descending" : "ascending"})` : ""}`}
      title={getSortState()}
    >
      <span>{children}</span>
      {getSortIcon()}

      {/* Sort order indicator for multi-column sorting */}
      {isSorted && sortOrder && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium shadow-sm border border-primary/20">
          {sortOrder}
        </div>
      )}
    </div>
  );
}
