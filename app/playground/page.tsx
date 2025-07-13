"use client";

import { useMemo, useCallback } from "react";
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
  type ColumnDef,
} from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  setSorting,
  toggleColumnSort,
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
import { EditableCell } from "./editable-cell";
import { SortableHeader } from "@/components/ui/sortable-header";
import {
  transformColumns,
  type SimpleColumnDef,
} from "@/lib/utils/column-transformer";

// Import the Person type from the slice
import type { Person } from "@/lib/features/tableSlice";

export default function PlaygroundPage() {
  const dispatch = useAppDispatch();
  const tableState = useAppSelector(state => state.table);

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
    editingCell = null, // Add fallback value
  } = tableState;

  // Safe access to editingCell
  const currentEditingCell = tableState?.editingCell || null;

  // Define simplified column definitions
  const simpleColumns: SimpleColumnDef<Person>[] = [
    {
      accessorKey: "id",
      header: "ID",
      size: 60,
      meta: { sortable: true, editable: false },
    },
    {
      accessorKey: "firstName",
      header: "First Name",
      meta: {
        editable: {
          type: "text",
          placeholder: "Enter first name",
          maxLength: 50,
        },
      },
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
      meta: {
        editable: {
          type: "text",
          placeholder: "Enter last name",
          maxLength: 50,
        },
      },
    },
    {
      accessorKey: "age",
      header: "Age",
      size: 80,
      meta: {
        editable: {
          type: "number",
          min: 18,
          max: 100,
          precision: "integer",
        },
      },
    },
    {
      accessorKey: "visits",
      header: "Visits",
      size: 80,
      meta: {
        editable: {
          type: "number",
          min: 0,
          max: 1000,
          precision: "integer",
        },
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      meta: {
        editable: {
          type: "select",
          options: [
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ],
        },
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      size: 120,
      cell: info => (
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${info.getValue()}%` }}
          />
        </div>
      ),
      meta: {
        editable: false,
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      meta: {
        editable: {
          type: "text",
          placeholder: "Enter email address",
          maxLength: 100,
        },
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      meta: {
        editable: {
          type: "select",
          options: [
            { value: "Engineering", label: "Engineering" },
            { value: "Marketing", label: "Marketing" },
            { value: "Sales", label: "Sales" },
            { value: "HR", label: "HR" },
            { value: "Finance", label: "Finance" },
            { value: "Operations", label: "Operations" },
          ],
        },
      },
    },
    {
      accessorKey: "salary",
      header: "Salary",
      size: 120,
      meta: {
        editable: {
          type: "currency",
          currency: "USD",
          min: 0,
          precision: "integer",
        },
      },
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      size: 120,
      meta: {
        editable: {
          type: "date",
          format: "MM/DD/YYYY",
        },
      },
    },
  ];

  // Transform simple columns to TanStack table columns
  const columns = useMemo<ColumnDef<Person>[]>(
    () =>
      transformColumns(
        simpleColumns,
        payload => dispatch(toggleColumnSort(payload)),
        sorting
      ),
    [dispatch, sorting]
  );

  // Memoize change handlers to prevent unnecessary re-renders
  const onRowSelectionChange = useCallback(
    (updater: any) => {
      const newValue =
        typeof updater === "function" ? updater(rowSelection) : updater;
      dispatch(setRowSelection(newValue));
    },
    [dispatch, rowSelection]
  );

  const onSortingChange = useCallback(
    (updater: any) => {
      const newValue =
        typeof updater === "function" ? updater(sorting) : updater;
      dispatch(setSorting(newValue));
    },
    [dispatch, sorting]
  );

  const onColumnFiltersChange = useCallback(
    (updater: any) => {
      const newValue =
        typeof updater === "function" ? updater(columnFilters) : updater;
      dispatch(setColumnFilters(newValue));
    },
    [dispatch, columnFilters]
  );

  const onColumnVisibilityChange = useCallback(
    (updater: any) => {
      const newValue =
        typeof updater === "function" ? updater(columnVisibility) : updater;
      dispatch(setColumnVisibility(newValue));
    },
    [dispatch, columnVisibility]
  );

  const onGlobalFilterChange = useCallback(
    (updater: any) => {
      const newValue =
        typeof updater === "function" ? updater(globalFilter) : updater;
      dispatch(setGlobalFilter(newValue));
    },
    [dispatch, globalFilter]
  );

  const onGroupingChange = useCallback(
    (updater: any) => {
      const newValue =
        typeof updater === "function" ? updater(grouping) : updater;
      dispatch(setGrouping(newValue));
    },
    [dispatch, grouping]
  );

  const onExpandedChange = useCallback(
    (updater: any) => {
      const newValue =
        typeof updater === "function" ? updater(expanded) : updater;
      dispatch(setExpanded(newValue));
    },
    [dispatch, expanded]
  );

  const onPaginationChange = useCallback(
    (updater: any) => {
      const newValue =
        typeof updater === "function" ? updater(pagination) : updater;
      dispatch(setPagination(newValue));
    },
    [dispatch, pagination]
  );

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
    enableSorting: true,
    enableMultiSort: true,
    onRowSelectionChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
    onGlobalFilterChange,
    onGroupingChange,
    onExpandedChange,
    onPaginationChange,
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
          {/* Export button moved to table settings */}
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
          <p className="text-sm text-muted-foreground">
            Double-click any cell to edit. Press Enter to save or Escape to
            cancel. Click column headers to sort. Hold Shift to multi-sort.
          </p>
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
            <div className="flex items-center gap-2 ml-auto">
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
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
                      className={
                        currentEditingCell?.rowId === row.original.id
                          ? "bg-primary/5 ring-1 ring-primary/20"
                          : ""
                      }
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
