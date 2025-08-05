"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Upload,
  Search,
  FileText,
  Edit,
  Trash2,
  AlertTriangle,
  Database,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { referenceDataManager } from "@/lib/utils/reference-data-manager";
import type { ReferenceDataInfo } from "@/lib/types/reference-data-types";
import type { TargetShape, LookupField } from "@/lib/types/target-shapes";
import { targetShapesStorage } from "@/lib/utils/target-shapes-storage";
import { ReferenceDataEditor } from "./reference-data-editor";

interface ReferenceDataViewerProps {
  referenceId: string;
  isOpen: boolean;
  onClose: () => void;
  allowEdit?: boolean;
  onReferenceEdit?: (referenceId: string) => void;
  onReferenceDownload?: (referenceId: string) => void;
  onReferenceDelete?: (referenceId: string) => void;
  onReferenceReplace?: (referenceId: string) => void;
}

export function ReferenceDataViewer({
  referenceId,
  isOpen,
  onClose,
  allowEdit = false,
  onReferenceEdit,
  onReferenceDownload,
  onReferenceDelete,
  onReferenceReplace,
}: ReferenceDataViewerProps) {
  const [referenceData, setReferenceData] = useState<Record<string, unknown>[]>(
    []
  );
  const [referenceInfo, setReferenceInfo] = useState<ReferenceDataInfo | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [affectedFields, setAffectedFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to find which lookup fields use this reference data
  const findAffectedLookupFields = useCallback(
    (referenceId: string): string[] => {
      try {
        const allShapes = targetShapesStorage.getAll();
        const affectedFields: string[] = [];

        allShapes.forEach((shape: TargetShape) => {
          shape.fields.forEach(field => {
            if (field.type === "lookup") {
              const lookupField = field as LookupField;
              // Check if this lookup field references our reference data
              if (lookupField.referenceFile === referenceId) {
                affectedFields.push(`${shape.name}.${field.name}`);
              }
            }
          });
        });

        return affectedFields;
      } catch (err) {
        console.error("Error finding affected lookup fields:", err);
        return [];
      }
    },
    []
  );

  // Load reference data when modal opens
  useEffect(() => {
    if (isOpen && referenceId) {
      setIsLoading(true);
      setError(null);
      try {
        const data = referenceDataManager.getReferenceDataRows(referenceId);
        const info = referenceDataManager.getReferenceData(referenceId);

        if (data && info) {
          setReferenceData(data);
          setReferenceInfo(info.info);

          // Find which lookup fields use this reference data
          const affected = findAffectedLookupFields(referenceId);
          setAffectedFields(affected);
        } else {
          setError("Reference data not found");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load reference data"
        );
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, referenceId, findAffectedLookupFields]);

  // Create columns dynamically from data
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!referenceInfo || referenceData.length === 0) return [];

    const columnHelper = createColumnHelper<Record<string, unknown>>();

    return referenceInfo.columns.map(columnName =>
      columnHelper.accessor(columnName, {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 h-auto font-medium hover:bg-transparent"
          >
            {columnName}
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <div className="min-w-0">
              {value != null ? (
                String(value)
              ) : (
                <span className="text-muted-foreground italic">null</span>
              )}
            </div>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
      })
    );
  }, [referenceInfo, referenceData]);

  const table = useReactTable({
    data: referenceData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  const handleDownload = () => {
    if (!referenceInfo || !referenceData) return;

    try {
      // Convert data to CSV
      const headers = referenceInfo.columns.join(",");
      const rows = referenceData.map(row =>
        referenceInfo.columns
          .map(col => {
            const value = row[col];
            // Escape CSV values that contain commas or quotes
            if (value != null && String(value).includes(",")) {
              return `"${String(value).replace(/"/g, '""')}"`;
            }
            return value != null ? String(value) : "";
          })
          .join(",")
      );

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", referenceInfo.filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      onReferenceDownload?.(referenceId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download reference data"
      );
    }
  };

  const handleDataChange = (newData: Record<string, unknown>[]) => {
    try {
      // Update the reference data in storage
      referenceDataManager.updateReferenceData(referenceId, newData);
      setReferenceData(newData);

      // Update reference info with new row count
      if (referenceInfo) {
        const updatedInfo = {
          ...referenceInfo,
          rowCount: newData.length,
          lastModified: new Date().toISOString(),
        };
        setReferenceInfo(updatedInfo);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save reference data changes"
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (isEditing && referenceData && referenceInfo) {
    return (
      <ReferenceDataEditor
        referenceId={referenceId}
        data={referenceData}
        referenceInfo={referenceInfo}
        isOpen={isOpen}
        onClose={() => setIsEditing(false)}
        onSave={handleDataChange}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Reference Data Viewer
          </DialogTitle>
          <DialogDescription asChild>
            {referenceInfo ? (
              <div className="flex items-center gap-4 text-sm">
                <span>{referenceInfo.filename}</span>
                <Badge variant="outline">{referenceInfo.rowCount} rows</Badge>
                <Badge variant="outline">
                  {referenceInfo.columns.length} columns
                </Badge>
                {referenceInfo.fileSize && (
                  <Badge variant="outline">
                    {formatFileSize(referenceInfo.fileSize)}
                  </Badge>
                )}
              </div>
            ) : (
              <div>Loading reference data...</div>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : referenceData && referenceInfo ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all columns..."
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                {allowEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Data
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                {onReferenceReplace && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReferenceReplace(referenceId)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Replace
                  </Button>
                )}

                {onReferenceDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReferenceDelete(referenceId)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Impact Analysis */}
            {affectedFields.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  This reference data is used by {affectedFields.length} lookup
                  field(s): {affectedFields.join(", ")}
                </span>
              </div>
            )}

            {/* Data Table */}
            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead
                          key={header.id}
                          className="whitespace-nowrap"
                        >
                          {header.isPlaceholder
                            ? null
                            : header.column.columnDef.header
                              ? typeof header.column.columnDef.header ===
                                "function"
                                ? header.column.columnDef.header(
                                    header.getContext()
                                  )
                                : header.column.columnDef.header
                              : header.id}
                        </TableHead>
                      ))}
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
                          <TableCell key={cell.id} className="py-2">
                            {typeof cell.column.columnDef.cell === "function"
                              ? cell.column.columnDef.cell(cell.getContext())
                              : String(cell.getValue() ?? "")}
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
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-2">
              <div className="text-sm text-muted-foreground">
                Showing {table.getRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s)
                {globalFilter &&
                  ` (filtered from ${referenceData.length} total)`}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-sm">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* File Information */}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">File Information</div>
                <div className="mt-1 space-y-1 text-muted-foreground">
                  <div>Format: {referenceInfo.format.toUpperCase()}</div>
                  <div>Uploaded: {formatDate(referenceInfo.uploadedAt)}</div>
                  {referenceInfo.lastModified !== referenceInfo.uploadedAt && (
                    <div>
                      Modified: {formatDate(referenceInfo.lastModified)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-medium">Data Statistics</div>
                <div className="mt-1 space-y-1 text-muted-foreground">
                  <div>Total Rows: {referenceInfo.rowCount}</div>
                  <div>Columns: {referenceInfo.columns.length}</div>
                  {referenceInfo.fileSize && (
                    <div>
                      File Size: {formatFileSize(referenceInfo.fileSize)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
