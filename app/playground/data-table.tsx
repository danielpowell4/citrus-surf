"use client";

import { useMemo, useCallback } from "react";
import { useHydration } from "@/lib/hooks/useHydration";
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
  setColumnFilters,
  setColumnVisibility,
  setRowSelection,
  setGlobalFilter,
  setGrouping,
  setExpanded,
  setPagination,
  toggleColumnSort,
  updateCell,
} from "@/lib/features/tableSlice";
import { selectCurrentIndex } from "@/lib/features/historySlice";
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
import { Eye, Sparkles, Upload, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CompactHistory } from "@/components/compact-history";
import { ExportDropdown } from "@/components/export-dropdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  transformColumns,
  type SimpleColumnDef,
} from "@/lib/utils/column-transformer";
import { naturalSortForTable } from "@/lib/utils/sort-utils";

// Import the Person type from the slice
import type { Person } from "@/lib/features/tableSlice";

interface DataTableProps {
  data: Person[];
  currentVersion: number;
  onOpenTemplates?: () => void;
}

export function DataTable({
  data,
  currentVersion,
  onOpenTemplates,
}: DataTableProps) {
  const dispatch = useAppDispatch();
  const tableState = useAppSelector(state => state.table);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const { isHydrated } = useHydration();

  const {
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    globalFilter,
    grouping,
    expanded,
    pagination,
    editingCell = null,
  } = tableState;

  // Safe access to editingCell
  const currentEditingCell = tableState?.editingCell || null;

  // Define simplified column definitions
  const simpleColumns: SimpleColumnDef<Person>[] = [
    {
      accessorKey: "id",
      header: "ID",
      size: 80,
      meta: {
        sortType: "natural",
        editable: {
          type: "text",
          placeholder: "Enter ID",
          maxLength: 20,
        },
      },
    },
    {
      accessorKey: "firstName",
      header: "First Name",
      meta: {
        sortType: "natural",
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
        sortType: "natural",
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
        sortType: "natural",
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
        sortType: "natural",
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
        sortType: "natural",
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
  ];

  // Transform simple columns to TanStack Table columns
  const columns = useMemo<ColumnDef<Person>[]>(
    () =>
      transformColumns(
        simpleColumns,
        payload => {
          dispatch(toggleColumnSort(payload));
        },
        sorting
      ),
    [simpleColumns, sorting, dispatch]
  );

  // Table event handlers
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

  // Table instance
  const table = useReactTable({
    data,
    columns,
    getRowId: row => row._rowId || row.id || "",
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
    sortingFns: {
      custom: naturalSortForTable,
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg sm:text-xl">
                Data Table ({data.length} rows)
              </CardTitle>
              {onOpenTemplates && (
                <Button
                  onClick={onOpenTemplates}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Templates & Shapes</span>
                  <span className="sm:hidden">Templates</span>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Double-click any cell to edit. Press Enter to save or Escape to
              cancel. Click column headers to sort. Hold Shift to multi-sort.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <CompactHistory />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                dispatch(setGlobalFilter(event.target.value))
              }
              className="max-w-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <ExportDropdown
              data={data}
              currentVersion={currentVersion}
              disabled={data.length === 0}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-sm">
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Columns</span>
                  <span className="sm:hidden">Cols</span>
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
        <div className="rounded-md border overflow-x-auto">
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
                    className="h-32 text-center"
                  >
                    {!isHydrated ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Loading data...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <Upload className="h-8 w-8 text-muted-foreground/50" />
                        <div className="text-center">
                          <p className="text-muted-foreground mb-2">No data found</p>
                          <Link href="/playground">
                            <Button variant="outline" className="flex items-center gap-2">
                              <ArrowRight className="h-4 w-4" />
                              Go to Data Import
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center gap-2">
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
  );
}
