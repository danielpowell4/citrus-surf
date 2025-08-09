"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight, Sparkles, ArrowRight, Database } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { LookupField } from '@/lib/types/target-shapes';
import { generateLookupPreview, type LookupPreview as PreviewData } from '@/lib/utils/smart-column-naming';

interface LookupPreviewProps {
  lookupField: LookupField;
  referenceData: Record<string, any>[];
  className?: string;
  showExamples?: boolean;
}

export function LookupPreview({ 
  lookupField, 
  referenceData, 
  className = "",
  showExamples = true 
}: LookupPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!lookupField.alsoGet || lookupField.alsoGet.length === 0) {
    return null; // No preview needed for simple lookups
  }
  
  const preview = generateLookupPreview(lookupField, referenceData);
  
  return (
    <Card className={`border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/30 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm font-medium">Lookup Preview</CardTitle>
        </div>
        <CardDescription className="text-xs">
          This lookup will enrich your data with additional columns
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Main Lookup Column */}
        <div className="flex items-center gap-2 text-sm">
          <Database className="h-3 w-3 text-blue-600" />
          <span className="font-medium">{preview.lookupColumn.name}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant="outline" className="text-xs border-blue-200">
            Lookup Result
          </Badge>
          {showExamples && (
            <span className="text-xs text-muted-foreground">
              (e.g., "{preview.lookupColumn.example}")
            </span>
          )}
        </div>
        
        <Separator />
        
        {/* Derived Columns */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Additional Columns ({preview.derivedColumns.length})
          </div>
          
          <div className="space-y-1">
            {preview.derivedColumns.slice(0, 3).map((column, index) => (
              <div 
                key={index}
                className="flex items-center justify-between text-sm py-1 px-2 rounded bg-green-50/50 dark:bg-green-950/50 border border-green-100 dark:border-green-800"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-800">{column.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {column.type}
                  </Badge>
                </div>
                {showExamples && (
                  <span className="text-xs text-muted-foreground">
                    "{column.example}"
                  </span>
                )}
              </div>
            ))}
            
            {preview.derivedColumns.length > 3 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs text-muted-foreground p-0"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3 mr-1" />
                        Show {preview.derivedColumns.length - 3} more columns
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 mt-1">
                  {preview.derivedColumns.slice(3).map((column, index) => (
                    <div 
                      key={index + 3}
                      className="flex items-center justify-between text-sm py-1 px-2 rounded bg-green-50/50 dark:bg-green-950/50 border border-green-100 dark:border-green-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-800">{column.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {column.type}
                        </Badge>
                      </div>
                      {showExamples && (
                        <span className="text-xs text-muted-foreground">
                          "{column.example}"
                        </span>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
        
        {/* Summary */}
        <div className="text-xs text-muted-foreground bg-white/50 dark:bg-slate-800/50 p-2 rounded border border-border">
          <span className="font-medium">Result:</span> Your data will be enriched with{' '}
          <span className="font-medium text-blue-600">
            {preview.derivedColumns.length + 1} total columns
          </span>{' '}
          ({preview.derivedColumns.length} additional)
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for inline display
 */
export function LookupPreviewCompact({ 
  lookupField, 
  referenceData, 
  className = "" 
}: LookupPreviewProps) {
  if (!lookupField.alsoGet || lookupField.alsoGet.length === 0) {
    return null;
  }
  
  const preview = generateLookupPreview(lookupField, referenceData);
  
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <Sparkles className="h-3 w-3 text-blue-500" />
      <span className="text-muted-foreground">
        Will add {preview.derivedColumns.length} column{preview.derivedColumns.length !== 1 ? 's' : ''}:
      </span>
      <div className="flex gap-1">
        {preview.derivedColumns.slice(0, 2).map((column, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {column.name}
          </Badge>
        ))}
        {preview.derivedColumns.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{preview.derivedColumns.length - 2} more
          </Badge>
        )}
      </div>
    </div>
  );
}