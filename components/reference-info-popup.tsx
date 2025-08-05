"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info, ExternalLink, Edit, Database } from "lucide-react";
import type { ReferenceDataInfo } from "@/lib/types/reference-data-types";
import type { LookupField } from "@/lib/types/target-shapes";

interface ReferenceInfoPopupProps {
  referenceInfo?: ReferenceDataInfo;
  referenceData: Record<string, any>[];
  lookupField: LookupField;
  onReferenceView?: (referenceFile: string) => void;
  onReferenceEdit?: (referenceFile: string) => void;
}

export function ReferenceInfoPopup({
  referenceInfo,
  referenceData,
  lookupField,
  onReferenceView,
  onReferenceEdit,
}: ReferenceInfoPopupProps) {
  // Calculate unique values in the reference data
  const uniqueValues = referenceData.length > 0 
    ? new Set(referenceData.map(row => row[lookupField.match.sourceColumn]).filter(Boolean)).size
    : 0;

  // Get sample values for preview
  const sampleValues = referenceData
    .slice(0, 5)
    .map(row => row[lookupField.match.sourceColumn])
    .filter(Boolean);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          aria-label="View reference data information"
          title="View reference data information"
        >
          <Info className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Reference Data</h4>
              <p className="text-xs text-muted-foreground">
                {referenceInfo?.filename || lookupField.referenceFile}
              </p>
            </div>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>

          <Separator />

          {/* Data Statistics */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Statistics
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total rows:</span>
                <Badge variant="outline" className="text-xs">
                  {referenceInfo?.rowCount || referenceData.length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unique values:</span>
                <Badge variant="outline" className="text-xs">
                  {uniqueValues}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Columns:</span>
                <Badge variant="outline" className="text-xs">
                  {referenceInfo?.columns.length || Object.keys(referenceData[0] || {}).length}
                </Badge>
              </div>
              {referenceInfo?.fileSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File size:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(referenceInfo.fileSize)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Lookup Configuration */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lookup Configuration
            </h5>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Match column:</span>
                <Badge variant="secondary" className="text-xs">
                  {lookupField.match.sourceColumn}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return column:</span>
                <Badge variant="secondary" className="text-xs">
                  {lookupField.match.targetColumn}
                </Badge>
              </div>
              {lookupField.alsoGet && lookupField.alsoGet.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Derived fields:</span>
                  <Badge variant="outline" className="text-xs">
                    {lookupField.alsoGet.length}
                  </Badge>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuzzy matching:</span>
                <Badge variant={lookupField.smartMatching.enabled ? "default" : "secondary"} className="text-xs">
                  {lookupField.smartMatching.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              {lookupField.smartMatching.enabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Threshold:</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round((lookupField.smartMatching.threshold || 0.8) * 100)}%
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Sample Values */}
          {sampleValues.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sample Values
                </h5>
                <div className="flex flex-wrap gap-1">
                  {sampleValues.map((value, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {String(value).length > 20 ? `${String(value).substring(0, 20)}...` : String(value)}
                    </Badge>
                  ))}
                  {uniqueValues > sampleValues.length && (
                    <Badge variant="secondary" className="text-xs">
                      +{uniqueValues - sampleValues.length} more
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}

          {/* File Information */}
          {referenceInfo && (
            <>
              <Separator />
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  File Information
                </h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <Badge variant="outline" className="text-xs uppercase">
                      {referenceInfo.format}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span className="text-xs">{formatDate(referenceInfo.uploadedAt)}</span>
                  </div>
                  {referenceInfo.lastModified !== referenceInfo.uploadedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modified:</span>
                      <span className="text-xs">{formatDate(referenceInfo.lastModified)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            {onReferenceView && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onReferenceView(lookupField.referenceFile)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Data
              </Button>
            )}
            {lookupField.allowReferenceEdit && onReferenceEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onReferenceEdit(lookupField.referenceFile)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Values
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}