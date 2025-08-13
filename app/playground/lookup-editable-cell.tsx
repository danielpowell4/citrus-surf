"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  updateCell,
  updateLookupValue,
  startEditing,
  stopEditing,
} from "@/lib/features/tableSlice";
import { ChevronDown, Edit3, AlertCircle, CheckCircle } from "lucide-react";
import type { LookupField } from "@/lib/types/target-shapes";
import type { LookupResult } from "@/lib/utils/lookup-matching-engine";
import {
  LookupMatchingEngine,
  createLookupConfig,
} from "@/lib/utils/lookup-matching-engine";
import { referenceDataManager } from "@/lib/utils/reference-data-manager";
import { ReferenceInfoPopup } from "@/components/reference-info-popup";

interface LookupEditableCellProps {
  value: unknown;
  row: {
    original: Record<string, unknown> & { id: string };
    id: string;
  };
  column: {
    id: string;
    columnDef: {
      meta?: { editable?: boolean | Record<string, unknown> };
    };
  };
  getValue: () => unknown;
  table: unknown;
  lookupField: LookupField;
}

export function LookupEditableCell({
  value: initialValue,
  row,
  column,
  lookupField,
}: LookupEditableCellProps) {
  const dispatch = useAppDispatch();
  const editingCell = useAppSelector(state => state.table.editingCell);

  const safeInitialValue = String(initialValue ?? "");
  const [inputValue, setInputValue] = useState(safeInitialValue);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{
      value: unknown;
      displayValue: string;
      confidence: number;
      matchType: string;
      originalRow?: Record<string, unknown>;
    }>
  >([]);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  const columnId = column.id;
  const rowId = row.original.id;
  const internalRowId = (row.original as any)._rowId || rowId;

  // Check if this cell is currently being edited
  const isEditing =
    editingCell?.rowId === rowId && editingCell?.columnId === columnId;

  // Get reference data - memoize to prevent unnecessary re-creation
  const referenceData = useMemo(
    () => {
      const allFiles = referenceDataManager.listReferenceFiles();
      const data = referenceDataManager.getReferenceDataRows(lookupField.referenceFile) || [];
      console.log(`[LookupEditableCell] Reference data for ${lookupField.referenceFile}:`, {
        referenceFile: lookupField.referenceFile,
        dataLength: data.length,
        sampleData: data.slice(0, 2),
        allAvailableFiles: allFiles.map(f => ({ id: f.id, filename: f.filename, rowCount: f.rowCount }))
      });
      return data;
    },
    [lookupField.referenceFile]
  );
  
  const referenceInfo = useMemo(
    () => {
      const info = referenceDataManager.getReferenceData(lookupField.referenceFile)?.info;
      console.log(`[LookupEditableCell] Reference info for ${lookupField.referenceFile}:`, info);
      return info;
    },
    [lookupField.referenceFile]
  );

  // Initialize lookup engine - memoize to prevent re-creation
  const lookupEngine = useMemo(() => new LookupMatchingEngine(), []);

  // Memoize lookup config to prevent unnecessary re-creation
  const lookupConfig = useMemo(
    () => createLookupConfig(lookupField),
    [lookupField.referenceFile, lookupField.match.on, lookupField.match.get, lookupField.smartMatching.enabled, lookupField.smartMatching.confidence]
  );

  // Update local state when value changes
  useEffect(() => {
    setInputValue(String(initialValue ?? ""));
  }, [initialValue]);

  // Perform lookup when input value changes
  useEffect(() => {
    if (inputValue && referenceData.length > 0) {
      const result = lookupEngine.performLookup(
        inputValue,
        referenceData,
        lookupConfig
      );
      setLookupResult(result);

      // Generate suggestions from reference data for fuzzy search
      const fuzzyResults = referenceData
        .map(row => {
          const lookupValue = row[lookupField.match.on];
          if (!lookupValue) return null;

          const fuzzyConfig = { ...lookupConfig };
          fuzzyConfig.smartMatching = {
            ...lookupConfig.smartMatching,
            confidence: 0.3,
          };
          const fuzzyResult = lookupEngine.performLookup(
            inputValue,
            [row],
            fuzzyConfig
          );

          return {
            value: row[lookupField.match.get],
            displayValue: lookupValue,
            confidence: fuzzyResult.confidence,
            matchType: fuzzyResult.matchType,
            originalRow: row,
          };
        })
        .filter(result => result !== null && result.confidence > 0.3)
        .sort((a, b) => b!.confidence - a!.confidence)
        .slice(0, 10) as Array<{
        value: unknown;
        displayValue: string;
        confidence: number;
        matchType: string;
        originalRow?: Record<string, unknown>;
      }>;

      setSuggestions(fuzzyResults);
    } else {
      setSuggestions([]);
      setLookupResult(null);
    }
  }, [inputValue, referenceData, lookupConfig, lookupEngine, lookupField.match.on, lookupField.match.get]);

  const handleValueSelect = async (
    selectedValue: string,
    originalRow?: Record<string, unknown>
  ) => {
    setInputValue(selectedValue);
    setOpen(false);

    // Use the updateLookupValue thunk to handle the lookup update properly
    const targetValue = originalRow
      ? originalRow[lookupField.match.get]
      : selectedValue;

    try {
      await dispatch(
        updateLookupValue({
          rowId: internalRowId,
          fieldName: columnId,
          value: targetValue,
          field: lookupField,
          rowData: row.original,
        })
      );
    } catch (error) {
      console.error("Failed to update lookup value:", error);
      // Fallback to simple cell update
      dispatch(updateCell({ rowId, columnId, value: targetValue }));
    }

    dispatch(stopEditing());
  };

  const handleDoubleClick = () => {
    // Don't allow editing if reference data is missing
    if (referenceData.length === 0) {
      console.warn(`Cannot edit lookup field ${columnId}: reference data missing for ${lookupField.referenceFile}`);
      return;
    }
    
    dispatch(startEditing({ rowId, columnId }));
    setOpen(true);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        await handleValueSelect(
          suggestions[0].displayValue,
          suggestions[0].originalRow
        );
      } else {
        // For manual entry without suggestions, try to use updateLookupValue if it's a lookup field
        try {
          await dispatch(
            updateLookupValue({
              rowId: internalRowId,
              fieldName: columnId,
              value: inputValue,
              field: lookupField,
              rowData: row.original,
            })
          );
        } catch (error) {
          console.error("Failed to update lookup value:", error);
          // Fallback to simple cell update
          dispatch(updateCell({ rowId, columnId, value: inputValue }));
        }
        dispatch(stopEditing());
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setInputValue(safeInitialValue);
      dispatch(stopEditing());
      setOpen(false);
    }
  };

  // Check if column is editable
  const isEditable = column.columnDef.meta?.editable !== false;

  if (!isEditable) {
    return (
      <div className="flex items-center justify-between">
        <span>{String(initialValue ?? "")}</span>
        {lookupField.showReferenceInfo && (
          <ReferenceInfoPopup
            referenceInfo={referenceInfo}
            referenceData={referenceData}
            lookupField={lookupField}
          />
        )}
      </div>
    );
  }

  // Render confidence indicator
  const renderConfidenceIndicator = () => {
    if (!lookupResult || !lookupResult.matched) return null;

    const confidence = lookupResult.confidence;
    const Icon =
      confidence >= 0.9
        ? CheckCircle
        : confidence >= 0.7
          ? AlertCircle
          : AlertCircle;
    const color =
      confidence >= 0.9
        ? "text-green-500"
        : confidence >= 0.7
          ? "text-yellow-500"
          : "text-red-500";

    return (
      <div title={`${Math.round(confidence * 100)}% confidence`}>
        <Icon className={`h-3 w-3 ${color}`} />
      </div>
    );
  };

  // Render display value with lookup information
  const renderDisplay = () => {
    // Check if reference data is missing and show a warning
    if (referenceData.length === 0) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-destructive text-xs" title={`Reference file: ${lookupField.referenceFile}`}>
              Missing reference data
            </span>
            <AlertCircle className="h-3 w-3 text-destructive" />
          </div>
          {lookupField.showReferenceInfo && (
            <ReferenceInfoPopup
              referenceInfo={referenceInfo}
              referenceData={referenceData}
              lookupField={lookupField}
            />
          )}
        </div>
      );
    }

    if (!initialValue && initialValue !== 0) {
      return (
        <div className="flex items-center justify-between">
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
          {lookupField.showReferenceInfo && (
            <ReferenceInfoPopup
              referenceInfo={referenceInfo}
              referenceData={referenceData}
              lookupField={lookupField}
            />
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Badge variant="secondary">{String(initialValue ?? "")}</Badge>
          {renderConfidenceIndicator()}
        </div>
        {lookupField.showReferenceInfo && (
          <ReferenceInfoPopup
            referenceInfo={referenceInfo}
            referenceData={referenceData}
            lookupField={lookupField}
          />
        )}
      </div>
    );
  };

  return (
    <div
      onDoubleClick={
        !initialValue && initialValue !== 0 ? undefined : handleDoubleClick
      }
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors ${
        isEditing ? "ring-2 ring-primary bg-primary/10" : ""
      }`}
      data-testid="lookup-cell"
    >
      {isEditing ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-8 text-sm"
              data-testid="lookup-combobox"
            >
              {inputValue || "Select value..."}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search or type new value..."
                value={inputValue}
                onValueChange={setInputValue}
                onKeyDown={handleKeyDown}
              />
              <CommandList>
                <CommandEmpty>
                  {inputValue ? (
                    <div className="p-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        No exact matches found.
                      </p>
                      {suggestions.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Did you mean one of the suggestions below?
                        </p>
                      )}
                    </div>
                  ) : (
                    "Start typing to search..."
                  )}
                </CommandEmpty>

                {suggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={index}
                        value={suggestion.displayValue}
                        onSelect={() =>
                          handleValueSelect(
                            suggestion.displayValue,
                            suggestion.originalRow
                          )
                        }
                        className="flex items-center justify-between"
                      >
                        <span>{suggestion.displayValue}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                          {suggestion.matchType === "exact" && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                          {suggestion.matchType === "normalized" && (
                            <CheckCircle className="h-3 w-3 text-blue-500" />
                          )}
                          {suggestion.matchType === "fuzzy" && (
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {!inputValue && referenceData.length > 0 && (
                  <CommandGroup heading="All Values">
                    {referenceData.slice(0, 20).map((row, index) => {
                      const displayValue = row[lookupField.match.on];
                      if (!displayValue) return null;

                      return (
                        <CommandItem
                          key={index}
                          value={displayValue}
                          onSelect={() => handleValueSelect(displayValue, row)}
                        >
                          {displayValue}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        renderDisplay()
      )}
    </div>
  );
}
