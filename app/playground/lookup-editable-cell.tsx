"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { updateCell, startEditing, stopEditing } from "@/lib/features/tableSlice";
import { ChevronDown, Edit3, AlertCircle, CheckCircle } from "lucide-react";
import type { LookupField } from "@/lib/types/target-shapes";
import type { LookupResult } from "@/lib/utils/lookup-matching-engine";
import { LookupMatchingEngine, createLookupConfig } from "@/lib/utils/lookup-matching-engine";
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
  
  const safeInitialValue = initialValue ?? "";
  const [inputValue, setInputValue] = useState(safeInitialValue);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    value: unknown;
    confidence: number;
    matchType: string;
    originalRow?: Record<string, unknown>;
  }>>([]);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  const columnId = column.id;
  const rowId = row.original.id;

  // Check if this cell is currently being edited
  const isEditing = editingCell?.rowId === rowId && editingCell?.columnId === columnId;

  // Get reference data
  const referenceData = referenceDataManager.getReferenceDataRows(lookupField.referenceFile) || [];
  const referenceInfo = referenceDataManager.getReferenceData(lookupField.referenceFile)?.info;

  // Initialize lookup engine
  const lookupEngine = new LookupMatchingEngine();

  // Update local state when value changes
  useEffect(() => {
    setInputValue(initialValue ?? "");
  }, [initialValue]);

  // Perform lookup when input value changes
  useEffect(() => {
    if (inputValue && referenceData.length > 0) {
      const config = createLookupConfig(lookupField);
      const result = lookupEngine.performLookup(inputValue, referenceData, config);
      setLookupResult(result);

      // Generate suggestions from reference data for fuzzy search
      const fuzzyResults = referenceData
        .map(row => {
          const lookupValue = row[lookupField.match.sourceColumn];
          if (!lookupValue) return null;
          
          const fuzzyResult = lookupEngine.performLookup(
            inputValue,
            [row],
            { ...config, fuzzyThreshold: 0.3 }
          );
          
          return {
            value: row[lookupField.match.targetColumn],
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
  }, [inputValue, referenceData, lookupField]);

  const handleValueSelect = (selectedValue: string, originalRow?: Record<string, unknown>) => {
    setInputValue(selectedValue);
    setOpen(false);
    
    // Update the cell value and perform lookup to get derived values
    if (originalRow && lookupField.alsoGet) {
      const derivedValues: Record<string, unknown> = {};
      lookupField.alsoGet.forEach(derived => {
        derivedValues[derived.targetFieldName] = originalRow[derived.sourceColumn];
      });
      
      // Update main cell
      dispatch(updateCell({ 
        rowId, 
        columnId, 
        value: originalRow[lookupField.match.targetColumn] 
      }));
      
      // Update derived columns
      Object.entries(derivedValues).forEach(([key, val]) => {
        dispatch(updateCell({ 
          rowId, 
          columnId: key, 
          value: val 
        }));
      });
    } else {
      dispatch(updateCell({ rowId, columnId, value: selectedValue }));
    }
    
    dispatch(stopEditing());
  };

  const handleDoubleClick = () => {
    dispatch(startEditing({ rowId, columnId }));
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleValueSelect(suggestions[0].displayValue, suggestions[0].originalRow);
      } else {
        dispatch(updateCell({ rowId, columnId, value: inputValue }));
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
        <span>{initialValue}</span>
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
    const Icon = confidence >= 0.9 ? CheckCircle : confidence >= 0.7 ? AlertCircle : AlertCircle;
    const color = confidence >= 0.9 ? "text-green-500" : confidence >= 0.7 ? "text-yellow-500" : "text-red-500";
    
    return (
      <Icon className={`h-3 w-3 ${color}`} title={`${Math.round(confidence * 100)}% confidence`} />
    );
  };

  // Render display value with lookup information
  const renderDisplay = () => {
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
          <Badge variant="secondary">{initialValue}</Badge>
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
      onDoubleClick={!initialValue && initialValue !== 0 ? undefined : handleDoubleClick}
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
                        onSelect={() => handleValueSelect(suggestion.displayValue, suggestion.originalRow)}
                        className="flex items-center justify-between"
                      >
                        <span>{suggestion.displayValue}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                          {suggestion.matchType === 'exact' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {suggestion.matchType === 'normalized' && <CheckCircle className="h-3 w-3 text-blue-500" />}
                          {suggestion.matchType === 'fuzzy' && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {!inputValue && referenceData.length > 0 && (
                  <CommandGroup heading="All Values">
                    {referenceData.slice(0, 20).map((row, index) => {
                      const displayValue = row[lookupField.match.sourceColumn];
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