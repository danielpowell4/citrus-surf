"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  updateCell,
  startEditing,
  stopEditing,
} from "@/lib/features/tableSlice";
import { Edit3 } from "lucide-react";

interface EditableCellProps {
  value: any;
  row: any;
  column: any;
  getValue: () => any;
  table: any;
}

// Type definitions for column configuration
interface BaseColumnConfig {
  type: "text" | "number" | "currency" | "date" | "select";
}

interface TextColumnConfig extends BaseColumnConfig {
  type: "text";
  placeholder?: string;
  maxLength?: number;
}

interface NumberColumnConfig extends BaseColumnConfig {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  precision?: "integer" | "float";
  decimalPlaces?: number;
}

interface CurrencyColumnConfig extends BaseColumnConfig {
  type: "currency";
  currency?: "USD" | "EUR" | "GBP";
  min?: number;
  max?: number;
  step?: number;
  precision?: "integer" | "float";
  decimalPlaces?: number;
}

interface DateColumnConfig extends BaseColumnConfig {
  type: "date";
  format?: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";
  min?: string;
  max?: string;
}

interface SelectColumnConfig extends BaseColumnConfig {
  type: "select";
  options: Array<{ value: string; label: string }>;
}

type ColumnConfig =
  | TextColumnConfig
  | NumberColumnConfig
  | CurrencyColumnConfig
  | DateColumnConfig
  | SelectColumnConfig;

export function EditableCell({
  value: initialValue,
  row,
  column,
  getValue,
  table,
}: EditableCellProps) {
  const dispatch = useAppDispatch();
  const editingCell = useAppSelector(state => state.table.editingCell);
  // Handle undefined/null values by providing sensible defaults
  const safeInitialValue = initialValue ?? "";
  const [value, setValue] = useState(safeInitialValue);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const columnId = String(column.id);
  const rowId = String(row.original.id);

  // Check if this cell is currently being edited
  const isEditing =
    editingCell?.rowId === rowId && editingCell?.columnId === columnId;

  // Update local state when value changes
  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Only call select() on input elements, not select elements
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const onBlur = () => {
    dispatch(stopEditing());
    if (value !== safeInitialValue) {
      dispatch(updateCell({ rowId, columnId, value }));
    }
  };

  const onKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onBlur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setValue(safeInitialValue);
      dispatch(stopEditing());
    } else if (e.key === "Tab") {
      e.preventDefault();

      // Get current row and column indices
      const currentRowIndex = table
        .getRowModel()
        .rows.findIndex((row: any) => row.id === rowId);
      const currentColumnIndex = table
        .getVisibleLeafColumns()
        .findIndex((col: any) => col.id === columnId);

      let nextRowIndex = currentRowIndex;
      let nextColumnIndex = currentColumnIndex;

      // Tab navigation (forward/backward)
      if (e.shiftKey) {
        // Move left/backward
        if (nextColumnIndex > 0) {
          nextColumnIndex--;
        } else if (nextRowIndex > 0) {
          nextRowIndex--;
          nextColumnIndex = table.getVisibleLeafColumns().length - 1;
        }
      } else {
        // Move right/forward
        if (nextColumnIndex < table.getVisibleLeafColumns().length - 1) {
          nextColumnIndex++;
        } else if (nextRowIndex < table.getRowModel().rows.length - 1) {
          nextRowIndex++;
          nextColumnIndex = 0;
        }
      }

      // Save current value if changed
      if (value !== safeInitialValue) {
        dispatch(updateCell({ rowId, columnId, value }));
      }

      // Move to next cell if it's different and editable
      if (
        nextRowIndex !== currentRowIndex ||
        nextColumnIndex !== currentColumnIndex
      ) {
        const nextRow = table.getRowModel().rows[nextRowIndex];
        const nextColumn = table.getVisibleLeafColumns()[nextColumnIndex];

        if (nextRow && nextColumn) {
          const nextColumnId = String(nextColumn.id);
          const isNextEditable = nextColumn.columnDef.meta?.editable !== false;

          if (isNextEditable) {
            dispatch(
              startEditing({
                rowId: String(nextRow.id),
                columnId: nextColumnId,
              })
            );
          }
        }
      }
    }
    // Arrow keys are no longer handled - they work normally for text navigation
  };

  const handleDoubleClick = () => {
    dispatch(startEditing({ rowId, columnId }));
  };

  // Check if column is editable from meta
  const isEditable = column.columnDef.meta?.editable !== false;

  if (!isEditable) {
    return (
      <div>
        {columnId === "progress" ? (
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
        ) : columnId === "visits" ? (
          <span>{value}</span>
        ) : (
          <span>{value}</span>
        )}
      </div>
    );
  }

  // Get column configuration from meta
  const columnConfig = column.columnDef.meta?.editable || {};
  const inputType = columnConfig.type || "text";

  // Helper functions for formatting
  const formatCurrency = (value: number, currency: string = "USD") => {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const formatDate = (value: string, format: string = "YYYY-MM-DD") => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    switch (format) {
      case "MM/DD/YYYY":
        return date.toLocaleDateString("en-US");
      case "DD/MM/YYYY":
        return date.toLocaleDateString("en-GB");
      default:
        return date.toISOString().split("T")[0];
    }
  };

  const parseNumber = (
    value: string,
    config: NumberColumnConfig | CurrencyColumnConfig
  ) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;

    if (config.precision === "integer") {
      return Math.round(num);
    }

    if (config.decimalPlaces !== undefined) {
      return parseFloat(num.toFixed(config.decimalPlaces));
    }

    return num;
  };

  // Render based on input type
  const renderInput = () => {
    switch (inputType) {
      case "select":
        const selectConfig = columnConfig as SelectColumnConfig;
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className="w-full p-1 border rounded text-sm"
          >
            {selectConfig.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label || option.value}
              </option>
            ))}
          </select>
        );

      case "number":
        const numberConfig = columnConfig as NumberColumnConfig;
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={value}
            onChange={e => setValue(parseNumber(e.target.value, numberConfig))}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className="w-full p-1 h-8 text-sm"
            min={numberConfig.min}
            max={numberConfig.max}
            step={
              numberConfig.step ||
              (numberConfig.precision === "integer" ? 1 : 0.01)
            }
            placeholder={
              numberConfig.precision === "integer"
                ? "Enter whole number"
                : "Enter number"
            }
          />
        );

      case "currency":
        const currencyConfig = columnConfig as CurrencyColumnConfig;
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={value}
            onChange={e =>
              setValue(parseNumber(e.target.value, currencyConfig))
            }
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className="w-full p-1 h-8 text-sm"
            min={currencyConfig.min}
            max={currencyConfig.max}
            step={
              currencyConfig.step ||
              (currencyConfig.precision === "integer" ? 1 : 0.01)
            }
            placeholder={`Enter ${currencyConfig.currency || "USD"} amount`}
          />
        );

      case "date":
        const dateConfig = columnConfig as DateColumnConfig;
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className="w-full p-1 h-8 text-sm"
            min={dateConfig.min}
            max={dateConfig.max}
          />
        );

      default: // text
        const textConfig = columnConfig as TextColumnConfig;
        return (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            className="w-full p-1 h-8 text-sm"
            placeholder={textConfig.placeholder}
            maxLength={textConfig.maxLength}
          />
        );
    }
  };

  // Render display value
  const renderDisplay = () => {
    // Handle empty/undefined values
    if (!value && value !== 0) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleDoubleClick}
          aria-label={`Edit ${columnId} value`}
          title={`Edit ${columnId} value`}
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      );
    }

    switch (inputType) {
      case "select":
        return <Badge variant="secondary">{value}</Badge>;

      case "number":
        const numberConfig = columnConfig as NumberColumnConfig;
        if (numberConfig.decimalPlaces !== undefined) {
          return (
            <span>{Number(value).toFixed(numberConfig.decimalPlaces)}</span>
          );
        }
        return <span>{value}</span>;

      case "currency":
        const currencyConfig = columnConfig as CurrencyColumnConfig;
        return <span>{formatCurrency(value, currencyConfig.currency)}</span>;

      case "date":
        const dateConfig = columnConfig as DateColumnConfig;
        return <span>{formatDate(value, dateConfig.format)}</span>;

      default:
        return <span>{value}</span>;
    }
  };

  return (
    <div
      onDoubleClick={!value && value !== 0 ? undefined : handleDoubleClick}
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors ${
        isEditing ? "ring-2 ring-primary bg-primary/10" : ""
      }`}
    >
      {isEditing ? renderInput() : renderDisplay()}
    </div>
  );
}
