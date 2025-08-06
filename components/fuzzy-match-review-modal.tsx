"use client";

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { MatchComparisonCard } from './match-comparison-card';
import { useFuzzyMatchReview } from '@/hooks/useFuzzyMatchReview';
import type { 
  FuzzyMatchReviewModalProps, 
  FuzzyMatchForReview,
  FuzzyMatchFilter 
} from '@/lib/types/fuzzy-match-review';
import type { FuzzyMatch } from '@/lib/utils/lookup-processor';

/**
 * Statistics summary component
 */
function ReviewStats({ 
  stats, 
  showDistribution = false 
}: { 
  stats: any; 
  showDistribution?: boolean; 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Review Progress</div>
        <div className="text-sm text-muted-foreground">
          {stats.totalMatches - stats.pending} of {stats.totalMatches} processed
        </div>
      </div>
      
      <Progress value={stats.progress} className="h-2" />
      
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="space-y-1">
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-xs text-muted-foreground">Accepted</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-xs text-muted-foreground">Rejected</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-blue-600">{stats.manual}</div>
          <div className="text-xs text-muted-foreground">Manual</div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
      </div>

      {showDistribution && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-medium">Confidence Distribution</div>
            {stats.confidenceDistribution.map((bucket: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-16 text-muted-foreground">
                    {Math.round(bucket.range[0] * 100)}-{Math.round(bucket.range[1] * 100)}%
                  </div>
                  <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ 
                        width: `${stats.totalMatches > 0 ? (bucket.count / stats.totalMatches) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="font-medium w-8 text-right">{bucket.count}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Filter controls component
 */
function FilterControls({ 
  filter, 
  onFilterChange, 
  fieldNames 
}: { 
  filter: FuzzyMatchFilter;
  onFilterChange: (filter: Partial<FuzzyMatchFilter>) => void;
  fieldNames: string[];
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Filters</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showAdvanced ? 'Less' : 'More'}
        </Button>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-xs">Search values</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search input or suggested values..."
            value={filter.searchTerm || ''}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-xs">Status</Label>
        <Select
          value={filter.status?.join(',') || 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              onFilterChange({ status: undefined });
            } else {
              onFilterChange({ status: value.split(',') as FuzzyMatchForReview['status'][] });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending only</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="manual">Manual entry</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showAdvanced && (
        <>
          {/* Confidence Range */}
          <div className="space-y-2">
            <Label className="text-xs">
              Confidence Range: {Math.round((filter.confidenceRange?.[0] || 0) * 100)}% - {Math.round((filter.confidenceRange?.[1] || 1) * 100)}%
            </Label>
            <Slider
              value={filter.confidenceRange || [0, 1]}
              onValueChange={(value) => onFilterChange({ confidenceRange: value as [number, number] })}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>

          {/* Field Name Filter */}
          {fieldNames.length > 1 && (
            <div className="space-y-2">
              <Label className="text-xs">Field</Label>
              <Select
                value={filter.fieldName || 'all'}
                onValueChange={(value) => onFilterChange({ fieldName: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All fields" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All fields</SelectItem>
                  {fieldNames.map(fieldName => (
                    <SelectItem key={fieldName} value={fieldName}>
                      {fieldName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Main fuzzy match review modal component
 */
export function FuzzyMatchReviewModal({
  matches: initialMatches,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onBatchAccept,
  onBatchReject,
  onManualEntry,
  initialFilter,
  showBatchOperations = true
}: FuzzyMatchReviewModalProps) {
  // Convert to FuzzyMatch array for the hook
  const fuzzyMatches: FuzzyMatch[] = initialMatches.map(match => ({
    rowId: match.rowId,
    fieldName: match.fieldName,
    inputValue: match.inputValue,
    suggestedValue: match.suggestedValue,
    confidence: match.confidence
  }));

  const { state, actions, hasChanges, isComplete } = useFuzzyMatchReview(fuzzyMatches, (matchId, status, value) => {
    // Bridge to parent callbacks
    if (status === 'accepted') {
      onAccept(matchId, value);
    } else if (status === 'rejected') {
      onReject(matchId);
    } else if (status === 'manual') {
      onManualEntry(matchId, value);
    }
  });

  const [showStats, setShowStats] = useState(true);

  // Apply initial filter if provided
  React.useEffect(() => {
    if (initialFilter) {
      actions.updateFilter(initialFilter);
    }
  }, [initialFilter, actions]);

  // Get unique field names for filtering
  const fieldNames = useMemo(() => {
    return Array.from(new Set(state.matches.map(m => m.fieldName))).sort();
  }, [state.matches]);

  const handleSelectAll = () => {
    if (state.selectedMatches.size === state.filteredMatches.filter(m => m.status === 'pending').length) {
      actions.clearSelection();
    } else {
      actions.selectAll({ status: ['pending'] });
    }
  };

  const handleBatchAccept = () => {
    actions.acceptSelected();
    if (onBatchAccept) {
      onBatchAccept(Array.from(state.selectedMatches));
    }
  };

  const handleBatchReject = () => {
    actions.rejectSelected();
    if (onBatchReject) {
      onBatchReject(Array.from(state.selectedMatches));
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      // Could add a confirmation dialog here
    }
    onClose();
  };

  const pendingMatches = state.filteredMatches.filter(m => m.status === 'pending');
  const allPendingSelected = pendingMatches.length > 0 && 
    pendingMatches.every(m => state.selectedMatches.has(m.id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Fuzzy Matches</DialogTitle>
          <DialogDescription>
            Review and approve matches that require manual verification. 
            {state.stats.totalMatches} matches found with confidence scores below the threshold.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4">
          {/* Statistics */}
          {showStats && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Review Summary</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
              <ReviewStats stats={state.stats} showDistribution />
            </div>
          )}

          {/* Filters */}
          <FilterControls
            filter={state.filter}
            onFilterChange={actions.updateFilter}
            fieldNames={fieldNames}
          />

          {/* Batch Operations */}
          {showBatchOperations && state.filteredMatches.some(m => m.status === 'pending') && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={allPendingSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm font-medium">
                  {state.selectedMatches.size > 0 
                    ? `${state.selectedMatches.size} matches selected`
                    : 'Select all pending matches'
                  }
                </Label>
              </div>
              
              {state.canBatchOperate && (
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleBatchAccept}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Selected
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBatchReject}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Selected
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Matches List */}
          <ScrollArea className="flex-1 h-[400px]">
            <div className="space-y-4 p-1">
              {state.filteredMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {state.matches.length === 0 
                    ? 'No fuzzy matches to review'
                    : 'No matches found with current filters'
                  }
                </div>
              ) : (
                state.filteredMatches.map((match) => (
                  <MatchComparisonCard
                    key={match.id}
                    match={match}
                    selected={state.selectedMatches.has(match.id)}
                    onSelectionChange={actions.toggleSelection}
                    onAccept={actions.acceptMatch}
                    onReject={actions.rejectMatch}
                    onManualEntry={actions.setManualValue}
                    showDetails
                    inBatch={showBatchOperations}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {isComplete ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>All matches processed</span>
              </div>
            ) : (
              <span>
                {state.stats.pending} matches remaining
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            {hasChanges && (
              <Button variant="outline" onClick={actions.resetAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              {isComplete ? 'Done' : 'Cancel'}
            </Button>
            {!isComplete && (
              <Button onClick={handleClose} disabled={!hasChanges}>
                Save & Continue
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}