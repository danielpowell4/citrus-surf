"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import type { TargetShape, TargetField } from "@/lib/types/target-shapes";

interface ColumnMappingProps {
  importColumns: string[];
  targetShape: TargetShape;
  onMappingChange: (mapping: Record<string, string>) => void;
  onApplyMapping: () => void;
  className?: string;
}

// Helper function to suggest column mappings based on name similarity
function suggestColumnMapping(importColumns: string[], targetFields: TargetField[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const field of targetFields) {
    const fieldName = field.name.toLowerCase();
    const fieldId = field.id.toLowerCase();
    
    // First pass: exact matches (highest priority)
    for (const column of importColumns) {
      const columnName = column.toLowerCase();
      
      if (columnName === fieldName || columnName === fieldId) {
        mapping[field.id] = column;
        break;
      }
    }
    
    // Skip if we found an exact match
    if (mapping[field.id]) continue;
    
    // Second pass: partial matches (lower priority)
    for (const column of importColumns) {
      const columnName = column.toLowerCase();
      
      // Email patterns
      if (fieldId.includes('email') && columnName.includes('email')) {
        mapping[field.id] = column;
        break;
      }
      
      // Name patterns - be more specific
      if ((fieldName === 'firstname' || fieldId === 'firstname') && columnName === 'firstname') {
        mapping[field.id] = column;
        break;
      }
      
      if ((fieldName === 'lastname' || fieldId === 'lastname') && columnName === 'lastname') {
        mapping[field.id] = column;
        break;
      }
      
      // Generic name pattern (fallback)
      if (fieldId.includes('name') && columnName.includes('name')) {
        mapping[field.id] = column;
        break;
      }
      
      // ID patterns
      if (fieldId.includes('id') && columnName === 'id') {
        mapping[field.id] = column;
        break;
      }
      
      // Department variations
      if (fieldName.includes('department') && (columnName === 'dept' || columnName.includes('department'))) {
        mapping[field.id] = column;
        break;
      }
    }
  }
  
  return mapping;
}

export function ColumnMapping({
  importColumns,
  targetShape,
  onMappingChange,
  onApplyMapping,
  className = "",
}: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [usedColumns, setUsedColumns] = useState<Set<string>>(new Set());
  const onMappingChangeRef = useRef(onMappingChange);
  
  // Keep ref updated
  useEffect(() => {
    onMappingChangeRef.current = onMappingChange;
  }, [onMappingChange]);

  // Initialize with suggested mappings
  useEffect(() => {
    const suggestedMapping = suggestColumnMapping(importColumns, targetShape.fields);
    setMapping(suggestedMapping);
    setUsedColumns(new Set(Object.values(suggestedMapping)));
    // Only notify parent if there are actual mappings to avoid infinite loops
    if (Object.keys(suggestedMapping).length > 0) {
      onMappingChangeRef.current(suggestedMapping);
    }
  }, [importColumns, targetShape.fields]);

  const handleMappingChange = (fieldId: string, columnName: string) => {
    const newMapping = { ...mapping };
    const newUsedColumns = new Set(usedColumns);

    // Remove old mapping if it exists
    if (newMapping[fieldId]) {
      newUsedColumns.delete(newMapping[fieldId]);
    }

    // Add new mapping
    if (columnName && columnName !== "none") {
      newMapping[fieldId] = columnName;
      newUsedColumns.add(columnName);
    } else {
      delete newMapping[fieldId];
    }

    setMapping(newMapping);
    setUsedColumns(newUsedColumns);
    onMappingChangeRef.current(newMapping);
  };

  const getAvailableColumns = (currentFieldId: string): string[] => {
    const currentlyMapped = mapping[currentFieldId];
    return importColumns.filter(
      col => !usedColumns.has(col) || col === currentlyMapped
    );
  };

  const requiredFields = targetShape.fields.filter(f => f.required);
  const mappedRequiredFields = requiredFields.filter(f => mapping[f.id]);
  const unmappedRequiredFields = requiredFields.filter(f => !mapping[f.id]);

  const canApplyMapping = unmappedRequiredFields.length === 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Column Mapping: {targetShape.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mapping Status */}
        <div className="flex items-center gap-4 p-3 bg-muted dark:bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm">
              {mappedRequiredFields.length}/{requiredFields.length} required fields mapped
            </span>
          </div>
          {unmappedRequiredFields.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-orange-600 dark:text-orange-400">
                {unmappedRequiredFields.length} required fields need mapping
              </span>
            </div>
          )}
        </div>

        {/* Mapping Interface */}
        <div className="space-y-3">
          <h4 className="font-medium">Map Import Columns to Target Fields</h4>
          <div className="space-y-3">
            {targetShape.fields.map(field => (
              <div
                key={field.id}
                className="flex items-center gap-4 p-3 border border-border dark:border-border rounded-lg"
              >
                {/* Target Field Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.name}</span>
                    {field.required && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                      >
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {field.type} • {field.description || "No description"}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                {/* Column Selection */}
                <div className="w-48">
                  <Select
                    value={mapping[field.id] || "none"}
                    onValueChange={(value) => handleMappingChange(field.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No mapping</span>
                      </SelectItem>
                      {getAvailableColumns(field.id).map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mapping Status Indicator */}
                <div className="w-6 flex justify-center">
                  {mapping[field.id] ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : field.required ? (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-muted dark:bg-muted" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unmapped Columns Warning */}
        {(() => {
          const unmappedColumns = importColumns.filter(col => !usedColumns.has(col));
          return unmappedColumns.length > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Unmapped Columns
                  </div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    These columns won't be included in the final output: {unmappedColumns.join(", ")}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Apply Button */}
        <div className="flex justify-end pt-4 border-t border-border dark:border-border">
          <Button
            onClick={onApplyMapping}
            disabled={!canApplyMapping}
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Apply Mapping {!canApplyMapping && "(missing required fields)"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}