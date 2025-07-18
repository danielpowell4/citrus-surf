"use client";

import { useMemo, useCallback, useState } from "react";
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
  setData,
  importJsonData,
  resetData,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, X } from "lucide-react";
import { DataImport } from "./data-import";
import { TargetShapeSelector } from "./target-shape-selector";
import { TargetShapeWorkflow } from "./target-shape-workflow";
import {
  transformColumns,
  type SimpleColumnDef,
} from "@/lib/utils/column-transformer";
import { CompactHistory } from "@/components/compact-history";
import { ExportDropdown } from "@/components/export-dropdown";

// Import the Person type from the slice
import type { Person } from "@/lib/features/tableSlice";
import type { TargetShape } from "@/lib/types/target-shapes";

export default function PlaygroundPage() {
  const dispatch = useAppDispatch();
  const tableState = useAppSelector(state => state.table);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const currentVersion = currentIndex + 1; // Convert to 1-indexed version number

  // State for target shape workflow
  const [showShapeWorkflow, setShowShapeWorkflow] = useState(false);
  const [importedDataForShape, setImportedDataForShape] = useState<any[]>([]);

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
      size: 80,
      meta: {
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
    getRowId: row => row._rowId!, // Use vendor-prefixed row ID or fall back to user ID
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

  const handleCreateShapeFromData = (data: any[]) => {
    setImportedDataForShape(data);
    setShowShapeWorkflow(true);
  };

  const handleShapeCreated = (shape: TargetShape) => {
    setShowShapeWorkflow(false);
    setImportedDataForShape([]);
    // TODO: Optionally select the newly created shape
  };

  const handleCloseShapeWorkflow = () => {
    setShowShapeWorkflow(false);
    setImportedDataForShape([]);
  };

  const handleCreateNewShape = () => {
    setShowShapeWorkflow(true);
  };

  const handleCreateShapeFromCurrentData = () => {
    setImportedDataForShape(data);
    setShowShapeWorkflow(true);
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <DataImport
        onImport={data => dispatch(setData(data))}
        onReset={handleReset}
        dataCount={data.length}
        isLoading={isLoading}
        error={error}
        onCreateShapeFromData={handleCreateShapeFromData}
      />

      {/* Target Shape Selection */}
      <TargetShapeSelector
        onCreateNew={handleCreateNewShape}
        onCreateFromData={handleCreateShapeFromCurrentData}
        hasData={data.length > 0}
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>
              Data Table ({table.getFilteredRowModel().rows.length} rows)
            </CardTitle>
            <CompactHistory />
          </div>
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
              <ExportDropdown
                data={data}
                currentVersion={currentVersion}
                disabled={data.length === 0}
              />
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

      {/* Target Shape Workflow Modal */}
      {showShapeWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Create Target Shape</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseShapeWorkflow}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <TargetShapeWorkflow
                importedData={importedDataForShape}
                onShapeCreated={handleShapeCreated}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
