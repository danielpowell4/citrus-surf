"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  X, 
  Edit3, 
  ArrowRight, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchComparisonCardProps, FuzzyMatchForReview } from '@/lib/types/fuzzy-match-review';

/**
 * Individual match comparison card for fuzzy match review
 */
export function MatchComparisonCard({
  match,
  selected = false,
  onSelectionChange,
  onAccept,
  onReject,
  onManualEntry,
  showDetails = false,
  inBatch = false
}: MatchComparisonCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [manualValue, setManualValue] = useState(match.manualValue?.toString() || '');
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getStatusColor = (status: FuzzyMatchForReview['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'manual':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleAccept = () => {
    onAccept(match.id, match.suggestedValue);
  };

  const handleReject = () => {
    onReject(match.id);
  };

  const handleManualSubmit = () => {
    if (manualValue.trim()) {
      onManualEntry(match.id, manualValue.trim());
      setIsEditing(false);
    }
  };

  const handleManualCancel = () => {
    setManualValue(match.manualValue?.toString() || '');
    setIsEditing(false);
  };

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange?.(match.id, checked);
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      selected && "ring-2 ring-blue-500 ring-offset-2",
      match.status === 'accepted' && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20",
      match.status === 'rejected' && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
      match.status === 'manual' && "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {inBatch && onSelectionChange && (
              <Checkbox
                checked={selected}
                onCheckedChange={handleSelectionChange}
                className="mt-0.5"
              />
            )}
            <div>
              <CardTitle className="text-base font-medium">
                Row {match.rowIndex + 1} • {match.fieldName}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getConfidenceColor(match.confidence)}>
                  {Math.round(match.confidence * 100)}% match
                </Badge>
                <Badge className={getStatusColor(match.status)}>
                  {match.status}
                </Badge>
              </div>
            </div>
          </div>

          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="h-6 w-6 p-0"
            >
              {showMoreDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Value Comparison */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Input Value</Label>
            <div className="text-sm text-muted-foreground">
              Original data
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-md">
            <code className="text-sm">{match.inputValue}</code>
          </div>

          <div className="flex items-center justify-center py-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Suggested Match</Label>
            <div className="text-sm text-muted-foreground">
              From reference data
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
            <code className="text-sm">{match.suggestedValue}</code>
          </div>
        </div>

        {/* Manual Entry Mode */}
        {isEditing && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Manual Entry</Label>
              <div className="flex space-x-2">
                <Input
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  placeholder="Enter correct value..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit();
                    } else if (e.key === 'Escape') {
                      handleManualCancel();
                    }
                  }}
                />
                <Button size="sm" onClick={handleManualSubmit}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleManualCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {match.status === 'pending' && !isEditing && (
          <>
            <Separator />
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={handleAccept}
                className="flex-1"
                variant="default"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button 
                size="sm" 
                onClick={handleReject}
                className="flex-1"
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button 
                size="sm" 
                onClick={() => setIsEditing(true)}
                variant="secondary"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Manual
              </Button>
            </div>
          </>
        )}

        {/* Additional Details */}
        {showMoreDetails && (
          <>
            <Separator />
            <div className="space-y-3 text-sm">
              {match.suggestions && match.suggestions.length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Alternative Suggestions
                  </Label>
                  <div className="mt-2 space-y-1">
                    {match.suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <code className="text-xs">{suggestion.value}</code>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {match.rowContext && Object.keys(match.rowContext).length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Row Context
                  </Label>
                  <div className="mt-2 space-y-1">
                    {Object.entries(match.rowContext).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{key}:</span>
                        <code className="text-muted-foreground">{String(value)}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Status Indicator for Processed Matches */}
        {match.status !== 'pending' && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>
              {match.status === 'accepted' && `Accepted: ${match.suggestedValue}`}
              {match.status === 'rejected' && 'Rejected - no match applied'}
              {match.status === 'manual' && `Manual entry: ${match.manualValue}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}