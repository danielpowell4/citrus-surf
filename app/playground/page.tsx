"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  setSorting,
  setColumnFilters,
  setColumnVisibility,
  setRowSelection,
  setGlobalFilter,
  setGrouping,
  setExpanded,
  setPagination,
  setImportData,
  setData,
  importJsonData,
  resetData,
} from "@/lib/features/tableSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  Filter,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { DataImport } from "./data-import";

// Import the Person type from the slice
import type { Person } from "@/lib/features/tableSlice";

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor("firstName", {
    header: "First Name",
    cell: info => info.getValue(),
  }),
  columnHelper.accessor("lastName", {
    header: "Last Name",
    cell: info => info.getValue(),
  }),
  columnHelper.accessor("age", {
    header: "Age",
    cell: info => info.getValue(),
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: info => info.getValue(),
  }),
  columnHelper.accessor("department", {
    header: "Department",
    cell: info => <Badge variant="secondary">{info.getValue()}</Badge>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: info => (
      <Badge variant={info.getValue() === "Active" ? "default" : "destructive"}>
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("progress", {
    header: "Progress",
    cell: info => (
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full"
          style={{ width: `${info.getValue()}%` }}
        />
      </div>
    ),
  }),
  columnHelper.accessor("salary", {
    header: "Salary",
    cell: info => `$${info.getValue().toLocaleString()}`,
  }),
  columnHelper.accessor("visits", {
    header: "Visits",
    cell: info => info.getValue(),
  }),
];

export default function PlaygroundPage() {
  const dispatch = useAppDispatch();
  const {
    data,
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    globalFilter,
    grouping,
    expanded,
    pagination,
    importData,
    isLoading,
    error,
  } = useAppSelector(state => state.table);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      grouping,
      expanded,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: updater => {
      const newValue =
        typeof updater === "function" ? updater(rowSelection) : updater;
      dispatch(setRowSelection(newValue));
    },
    onSortingChange: updater => {
      const newValue =
        typeof updater === "function" ? updater(sorting) : updater;
      dispatch(setSorting(newValue));
    },
    onColumnFiltersChange: updater => {
      const newValue =
        typeof updater === "function" ? updater(columnFilters) : updater;
      dispatch(setColumnFilters(newValue));
    },
    onColumnVisibilityChange: updater => {
      const newValue =
        typeof updater === "function" ? updater(columnVisibility) : updater;
      dispatch(setColumnVisibility(newValue));
    },
    onGlobalFilterChange: updater => {
      const newValue =
        typeof updater === "function" ? updater(globalFilter) : updater;
      dispatch(setGlobalFilter(newValue));
    },
    onGroupingChange: updater => {
      const newValue =
        typeof updater === "function" ? updater(grouping) : updater;
      dispatch(setGrouping(newValue));
    },
    onExpandedChange: updater => {
      const newValue =
        typeof updater === "function" ? updater(expanded) : updater;
      dispatch(setExpanded(newValue));
    },
    onPaginationChange: updater => {
      const newValue =
        typeof updater === "function" ? updater(pagination) : updater;
      dispatch(setPagination(newValue));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const handleReset = () => {
    dispatch(resetData());
  };

  const handleExport = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">TanStack Table Playground</h2>
          <p className="text-muted-foreground">
            Interactive table with import/export capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Import Section */}
      <DataImport
        onImport={data => dispatch(setData(data))}
        onReset={handleReset}
        onExport={handleExport}
        dataCount={data.length}
        isLoading={isLoading}
        error={error}
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Data Table ({table.getFilteredRowModel().rows.length} rows)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  dispatch(setGlobalFilter(event.target.value))
                }
                className="max-w-sm"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(column => column.getCanHide())
                  .map(column => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={value =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
