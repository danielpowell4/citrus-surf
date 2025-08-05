"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Edit3,
  ArrowUpDown,
  Undo2,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReferenceDataInfo } from "@/lib/types/reference-data-types";

interface ReferenceDataEditorProps {
  referenceId: string;
  data: Record<string, unknown>[];
  referenceInfo: ReferenceDataInfo;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>[]) => void;
  onCancel: () => void;
  keyColumn?: string;
}

interface EditingCell {
  rowIndex: number;
  columnId: string;
  value: string;
}

interface ValidationError {
  rowIndex: number;
  columnId: string;
  message: string;
}

export function ReferenceDataEditor({
  referenceId,
  data: initialData,
  referenceInfo,
  isOpen,
  onClose,
  onSave,
  onCancel,
  keyColumn,
}: ReferenceDataEditorProps) {
  const [data, setData] = useState<Record<string, unknown>[]>(initialData);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Update data when props change
  useEffect(() => {
    setData(initialData);
    setHasUnsavedChanges(false);
    setDeletedRows(new Set());
    setValidationErrors([]);
  }, [initialData]);

  // Validate data for uniqueness and required fields
  const validateData = useCallback((dataToValidate: Record<string, unknown>[]) => {
    const errors: ValidationError[] = [];
    const seenKeys = new Set<string>();

    dataToValidate.forEach((row, rowIndex) => {
      // Skip deleted rows
      if (deletedRows.has(rowIndex)) return;

      // Check key column uniqueness if specified
      if (keyColumn && row[keyColumn] != null) {
        const keyValue = String(row[keyColumn]);
        if (keyValue.trim() === '') {
          errors.push({
            rowIndex,
            columnId: keyColumn,
            message: 'Key column cannot be empty'
          });
        } else if (seenKeys.has(keyValue)) {
          errors.push({
            rowIndex,
            columnId: keyColumn,
            message: 'Duplicate key value'
          });
        } else {
          seenKeys.add(keyValue);
        }
      }

      // Check for required columns (all columns should have some value)
      referenceInfo.columns.forEach(columnId => {
        const value = row[columnId];
        if (value == null || String(value).trim() === '') {
          // Only flag as error if it's the key column or if all other columns in row are also empty
          const hasOtherValues = referenceInfo.columns.some(col => 
            col !== columnId && row[col] != null && String(row[col]).trim() !== ''
          );
          
          if (columnId === keyColumn || hasOtherValues) {
            errors.push({
              rowIndex,
              columnId,
              message: columnId === keyColumn ? 'Key column is required' : 'Value is required when other fields are populated'
            });
          }
        }
      });
    });

    return errors;
  }, [keyColumn, referenceInfo.columns, deletedRows]);

  // Update validation when data changes
  useEffect(() => {
    const errors = validateData(data);
    setValidationErrors(errors);
  }, [data, validateData]);

  const handleCellEdit = (rowIndex: number, columnId: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
    setData(newData);
    setHasUnsavedChanges(true);
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const newRow: Record<string, unknown> = {};
    referenceInfo.columns.forEach(col => {
      newRow[col] = '';
    });
    
    setData([...data, newRow]);
    setHasUnsavedChanges(true);
    
    // Start editing the first column of the new row
    setTimeout(() => {
      setEditingCell({
        rowIndex: data.length,
        columnId: referenceInfo.columns[0],
        value: ''
      });
    }, 100);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setDeletedRows(prev => new Set([...prev, rowIndex]));
    setHasUnsavedChanges(true);
  };

  const handleUndoDelete = (rowIndex: number) => {
    setDeletedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(rowIndex);
      return newSet;
    });
  };

  const handleSave = () => {
    const errors = validateData(data);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Filter out deleted rows
    const finalData = data.filter((_, index) => !deletedRows.has(index));
    onSave(finalData);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const getValidationError = (rowIndex: number, columnId: string): string | null => {
    const error = validationErrors.find(e => e.rowIndex === rowIndex && e.columnId === columnId);
    return error?.message || null;
  };

  // Create editable columns
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const columnHelper = createColumnHelper<Record<string, unknown>>();
    
    const dataColumns = referenceInfo.columns.map((columnId) => 
      columnHelper.accessor(columnId, {
        header: ({ column }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="p-0 h-auto font-medium hover:bg-transparent"
            >
              {columnId}
              {columnId === keyColumn && <span className="text-xs text-blue-600 ml-1">(key)</span>}
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        ),
        cell: ({ row, getValue }) => {
          const rowIndex = row.index;
          const isDeleted = deletedRows.has(rowIndex);
          const currentValue = getValue();
          const validationError = getValidationError(rowIndex, columnId);
          const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnId === columnId;

          if (isDeleted) {
            return (
              <div className="text-muted-foreground line-through">
                {currentValue != null ? String(currentValue) : ''}
              </div>
            );
          }

          if (isEditing) {
            return (
              <Input
                value={editingCell.value}
                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                onBlur={() => handleCellEdit(rowIndex, columnId, editingCell.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCellEdit(rowIndex, columnId, editingCell.value);
                  } else if (e.key === 'Escape') {
                    setEditingCell(null);
                  }
                }}
                className={cn(
                  "h-8 text-sm",
                  validationError && "border-red-500 focus:border-red-500"
                )}
                autoFocus
              />
            );
          }

          return (
            <div
              className={cn(
                "min-h-[32px] flex items-center px-2 py-1 rounded cursor-pointer hover:bg-muted/50",
                validationError && "border border-red-200 bg-red-50"
              )}
              onClick={() => setEditingCell({
                rowIndex,
                columnId,
                value: currentValue != null ? String(currentValue) : ''
              })}
              title={validationError || "Click to edit"}
            >
              {validationError && (
                <AlertTriangle className="h-3 w-3 text-red-500 mr-1 flex-shrink-0" />
              )}
              <span className={cn(
                "flex-1 min-w-0",
                validationError && "text-red-700"
              )}>
                {currentValue != null ? String(currentValue) : (
                  <span className="text-muted-foreground italic">empty</span>
                )}
              </span>
              <Edit3 className="h-3 w-3 text-muted-foreground ml-1 opacity-0 group-hover:opacity-100" />
            </div>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
      })
    );

    // Add actions column
    const actionsColumn = columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const rowIndex = row.index;
        const isDeleted = deletedRows.has(rowIndex);

        return (
          <div className="flex items-center gap-1">
            {isDeleted ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUndoDelete(rowIndex)}
                className="h-8 px-2"
              >
                <Undo2 className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRow(rowIndex)}
                className="h-8 px-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
      size: 80,
    });

    return [...dataColumns, actionsColumn];
  }, [referenceInfo.columns, keyColumn, editingCell, deletedRows, validationErrors]);

  const filteredData = useMemo(() => {
    return data.map((row, index) => ({ ...row, _originalIndex: index }));
  }, [data]);

  const table = useReactTable({
    data: filteredData,
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
  });

  const activeRowCount = data.length - deletedRows.size;
  const hasErrors = validationErrors.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Reference Data
            {hasUnsavedChanges && <Badge variant="outline" className="text-orange-600">Unsaved Changes</Badge>}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-4 text-sm">
              <span>{referenceInfo.filename}</span>
              <Badge variant="outline">{activeRowCount} active rows</Badge>
              {deletedRows.size > 0 && (
                <Badge variant="destructive">{deletedRows.size} deleted rows</Badge>
              )}
              {hasErrors && (
                <Badge variant="destructive">{validationErrors.length} validation errors</Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Validation Errors Summary */}
        {hasErrors && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <div className="font-medium mb-1">Validation Errors:</div>
              <ul className="space-y-1 text-xs">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <li key={index}>
                    Row {error.rowIndex + 1}, Column "{error.columnId}": {error.message}
                  </li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="text-red-600">... and {validationErrors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRow}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            
            <Input
              placeholder="Search all columns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            {activeRowCount} rows • Click any cell to edit
          </div>
        </div>

        <Separator />

        {/* Data Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : typeof header.column.columnDef.header === 'function'
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const originalIndex = (row.original as any)._originalIndex;
                  const isDeleted = deletedRows.has(originalIndex);
                  
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "group",
                        isDeleted && "bg-red-50 opacity-60"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-1">
                          {typeof cell.column.columnDef.cell === 'function'
                            ? cell.column.columnDef.cell(cell.getContext())
                            : String(cell.getValue() ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {hasUnsavedChanges ? "You have unsaved changes" : "No changes made"}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={hasErrors}
              className={cn(hasErrors && "opacity-50 cursor-not-allowed")}
            >
              {hasErrors ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Fix Errors First
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}