import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/components/ui/sortable-header";
import { EditableCell } from "@/app/playground/editable-cell";

// Natural sort function for proper alphanumeric sorting
function naturalSort(a: any, b: any): number {
  // Handle null/undefined values
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  const tokenize = (str: string) =>
    str
      .match(/(\d+|\D+)/g)
      ?.map(part =>
        isNaN(Number(part)) ? part.toLowerCase() : Number(part)
      ) || [];

  const aTokens = tokenize(String(a));
  const bTokens = tokenize(String(b));

  const len = Math.max(aTokens.length, bTokens.length);
  for (let i = 0; i < len; i++) {
    const aPart = aTokens[i];
    const bPart = bTokens[i];

    if (aPart === undefined) return -1;
    if (bPart === undefined) return 1;

    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }

  return 0;
}

// Extended meta interface for our column definitions
export interface ColumnMeta {
  sortable?: boolean;
  sortType?: "natural" | "string" | "number" | "date";
  editable?:
    | {
        type: string;
        placeholder?: string;
        maxLength?: number;
        min?: number;
        max?: number;
        precision?: string;
        currency?: string;
        format?: string;
        options?: Array<{ value: string; label: string }>;
      }
    | false;
  hidden?: boolean;
  [key: string]: any;
}

// Our simplified column definition type
export interface SimpleColumnDef<TData> {
  accessorKey: keyof TData;
  header: string;
  size?: number;
  meta?: ColumnMeta;
  cell?: (info: any) => React.ReactNode;
}

// Transform function that converts our simple definitions to TanStack column definitions
export function transformColumns<TData>(
  simpleColumns: SimpleColumnDef<TData>[],
  toggleColumnSort: (payload: { columnId: string; shiftKey?: boolean }) => void,
  currentSorting: Array<{ id: string; desc: boolean }> = []
): ColumnDef<TData>[] {
  return simpleColumns.map(simpleCol => {
    const columnDef: ColumnDef<TData> = {
      accessorKey: simpleCol.accessorKey as string,
      size: simpleCol.size,
      meta: simpleCol.meta,
    };

    // Add custom sorting for text and enum fields
    if (simpleCol.meta?.sortType === "natural") {
      columnDef.sortingFn = "custom";
      columnDef.sortUndefined = 1; // Put undefined values at the end
    }

    // Calculate sort order for this column
    const sortOrder =
      currentSorting.findIndex(sort => sort.id === simpleCol.accessorKey) + 1;
    const sortOrderToShow = sortOrder > 0 ? sortOrder : undefined;

    // Handle header transformation
    if (simpleCol.meta?.sortable !== false) {
      // Default to sortable unless explicitly disabled
      columnDef.header = ({ column }) => (
        <SortableHeader
          isSorted={!!column.getIsSorted()}
          isSortedDesc={column.getIsSorted() === "desc"}
          sortOrder={sortOrderToShow}
          onSort={event => {
            const shiftKey =
              (event as React.MouseEvent).shiftKey ||
              (event as React.KeyboardEvent).shiftKey;
            toggleColumnSort({ columnId: column.id, shiftKey });
          }}
        >
          {simpleCol.header}
        </SortableHeader>
      );
    } else {
      // Non-sortable column
      columnDef.header = simpleCol.header;
    }

    // Handle cell transformation
    if (simpleCol.cell) {
      // Use custom cell renderer if provided
      columnDef.cell = simpleCol.cell;
    } else if (simpleCol.meta?.editable !== false) {
      // Default to editable cell unless explicitly disabled
      columnDef.cell = info => (
        <EditableCell
          value={info.getValue()}
          row={info.row}
          column={info.column}
          getValue={info.getValue}
          table={info.table}
        />
      );
    }

    return columnDef;
  });
}
