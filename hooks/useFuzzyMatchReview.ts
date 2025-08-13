"use client";

import { useState, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import type {
  FuzzyMatchForReview,
  FuzzyMatchFilter,
  FuzzyMatchReviewStats,
  FuzzyMatchReviewState,
  FuzzyMatchReviewActions,
  UseFuzzyMatchReviewResult,
} from "@/lib/types/fuzzy-match-review";
import type { FuzzyMatch } from "@/lib/utils/lookup-processor";

/**
 * Convert basic FuzzyMatch to FuzzyMatchForReview with UI metadata
 */
function enhanceFuzzyMatch(
  match: FuzzyMatch,
  index: number
): FuzzyMatchForReview {
  return {
    ...match,
    id: `match_${match.rowId}_${match.fieldName}_${index}`,
    rowIndex: parseInt(match.rowId.replace(/^row_/, "")) || index,
    status: "pending",
    selected: false,
    // Add suggestions from the match if available
    suggestions:
      match.confidence < 0.8
        ? [
            {
              value: match.suggestedValue,
              confidence: match.confidence,
              reason: "Fuzzy match suggestion",
              metadata: { matchType: "fuzzy" },
            },
          ]
        : undefined,
  };
}

/**
 * Calculate statistics from current matches
 */
function calculateStats(matches: FuzzyMatchForReview[]): FuzzyMatchReviewStats {
  const total = matches.length;
  const accepted = matches.filter(m => m.status === "accepted").length;
  const rejected = matches.filter(m => m.status === "rejected").length;
  const manual = matches.filter(m => m.status === "manual").length;
  const pending = matches.filter(m => m.status === "pending").length;

  const progress =
    total > 0 ? Math.round(((accepted + rejected + manual) / total) * 100) : 0;

  // Calculate confidence distribution
  const confidenceDistribution = [
    { range: [0.9, 1.0] as [number, number], count: 0 },
    { range: [0.8, 0.9] as [number, number], count: 0 },
    { range: [0.7, 0.8] as [number, number], count: 0 },
    { range: [0.6, 0.7] as [number, number], count: 0 },
    { range: [0.0, 0.6] as [number, number], count: 0 },
  ];

  matches.forEach(match => {
    const confidence = match.confidence;
    if (confidence >= 0.9) confidenceDistribution[0].count++;
    else if (confidence >= 0.8) confidenceDistribution[1].count++;
    else if (confidence >= 0.7) confidenceDistribution[2].count++;
    else if (confidence >= 0.6) confidenceDistribution[3].count++;
    else confidenceDistribution[4].count++;
  });

  return {
    totalMatches: total,
    accepted,
    rejected,
    manual,
    pending,
    progress,
    confidenceDistribution,
  };
}

/**
 * Filter and sort matches based on criteria
 */
function applyFilter(
  matches: FuzzyMatchForReview[],
  filter: FuzzyMatchFilter
): FuzzyMatchForReview[] {
  let filtered = matches;

  // Filter by confidence range
  if (filter.confidenceRange) {
    const [min, max] = filter.confidenceRange;
    filtered = filtered.filter(m => m.confidence >= min && m.confidence <= max);
  }

  // Filter by field name
  if (filter.fieldName) {
    filtered = filtered.filter(m => m.fieldName === filter.fieldName);
  }

  // Filter by status
  if (filter.status && filter.status.length > 0) {
    filtered = filtered.filter(m => filter.status!.includes(m.status));
  }

  // Filter by search term
  if (filter.searchTerm) {
    const searchLower = filter.searchTerm.toLowerCase();
    filtered = filtered.filter(
      m =>
        String(m.inputValue).toLowerCase().includes(searchLower) ||
        String(m.suggestedValue).toLowerCase().includes(searchLower) ||
        (m.suggestions || []).some(s =>
          String(s.value).toLowerCase().includes(searchLower)
        )
    );
  }

  // Sort by confidence (high to low) and then by field name
  filtered.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return a.fieldName.localeCompare(b.fieldName);
  });

  return filtered;
}

/**
 * Hook for managing fuzzy match review state and operations
 */
export function useFuzzyMatchReview(
  initialMatches: FuzzyMatch[] = [],
  onMatchUpdated?: (
    matchId: string,
    status: FuzzyMatchForReview["status"],
    value?: any
  ) => void
): UseFuzzyMatchReviewResult {
  // Convert basic matches to enhanced matches
  const [matches, setMatches] = useState<FuzzyMatchForReview[]>(() =>
    initialMatches.map((match, index) => enhanceFuzzyMatch(match, index))
  );

  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(
    new Set()
  );
  const [filter, setFilter] = useState<FuzzyMatchFilter>({});

  const dispatch = useDispatch();

  // Memoized calculations
  const stats = useMemo(() => calculateStats(matches), [matches]);
  const filteredMatches = useMemo(
    () => applyFilter(matches, filter),
    [matches, filter]
  );
  const hasChanges = useMemo(
    () => matches.some(m => m.status !== "pending"),
    [matches]
  );
  const isComplete = useMemo(
    () => matches.every(m => m.status !== "pending"),
    [matches]
  );
  const canBatchOperate = selectedMatches.size > 0;

  // Actions
  const acceptMatch = useCallback(
    (matchId: string, acceptedValue?: any) => {
      setMatches(prev =>
        prev.map(match =>
          match.id === matchId
            ? {
                ...match,
                status: "accepted" as const,
                manualValue: acceptedValue || match.suggestedValue,
              }
            : match
        )
      );
      onMatchUpdated?.(matchId, "accepted", acceptedValue);

      // Dispatch Redux action for history tracking
      dispatch({
        type: "lookup/acceptFuzzyMatch",
        payload: {
          matchId,
          acceptedValue:
            acceptedValue ||
            matches.find(m => m.id === matchId)?.suggestedValue,
        },
      });
    },
    [matches, onMatchUpdated, dispatch]
  );

  const rejectMatch = useCallback(
    (matchId: string) => {
      setMatches(prev =>
        prev.map(match =>
          match.id === matchId
            ? { ...match, status: "rejected" as const }
            : match
        )
      );
      onMatchUpdated?.(matchId, "rejected");

      // Dispatch Redux action for history tracking
      dispatch({
        type: "lookup/rejectFuzzyMatch",
        payload: { matchId },
      });
    },
    [onMatchUpdated, dispatch]
  );

  const setManualValue = useCallback(
    (matchId: string, value: any) => {
      setMatches(prev =>
        prev.map(match =>
          match.id === matchId
            ? { ...match, status: "manual" as const, manualValue: value }
            : match
        )
      );
      onMatchUpdated?.(matchId, "manual", value);

      // Dispatch Redux action for history tracking
      dispatch({
        type: "lookup/manualEntryForMatch",
        payload: { matchId, value },
      });
    },
    [onMatchUpdated, dispatch]
  );

  const toggleSelection = useCallback((matchId: string) => {
    setSelectedMatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(
    (criteria?: Partial<FuzzyMatchFilter>) => {
      const targetMatches = criteria
        ? applyFilter(matches, criteria)
        : filteredMatches;
      const matchIds = targetMatches
        .filter(m => m.status === "pending") // Only select pending matches
        .map(m => m.id);
      setSelectedMatches(new Set(matchIds));
    },
    [matches, filteredMatches]
  );

  const clearSelection = useCallback(() => {
    setSelectedMatches(new Set());
  }, []);

  const acceptSelected = useCallback(
    (acceptedValue?: any) => {
      const selectedIds = Array.from(selectedMatches);
      setMatches(prev =>
        prev.map(match =>
          selectedIds.includes(match.id)
            ? {
                ...match,
                status: "accepted" as const,
                manualValue: acceptedValue || match.suggestedValue,
              }
            : match
        )
      );

      selectedIds.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        onMatchUpdated?.(
          matchId,
          "accepted",
          acceptedValue || match?.suggestedValue
        );
      });

      // Dispatch Redux action for history tracking
      dispatch({
        type: "lookup/batchAcceptMatches",
        payload: { matchIds: selectedIds, acceptedValue },
      });

      clearSelection();
    },
    [selectedMatches, matches, onMatchUpdated, dispatch, clearSelection]
  );

  const rejectSelected = useCallback(() => {
    const selectedIds = Array.from(selectedMatches);
    setMatches(prev =>
      prev.map(match =>
        selectedIds.includes(match.id)
          ? { ...match, status: "rejected" as const }
          : match
      )
    );

    selectedIds.forEach(matchId => {
      onMatchUpdated?.(matchId, "rejected");
    });

    // Dispatch Redux action for history tracking
    dispatch({
      type: "lookup/batchRejectMatches",
      payload: { matchIds: selectedIds },
    });

    clearSelection();
  }, [selectedMatches, onMatchUpdated, dispatch, clearSelection]);

  const updateFilter = useCallback(
    (newFilter: Partial<FuzzyMatchFilter>) => {
      setFilter(prev => ({ ...prev, ...newFilter }));
      // Clear selection when filter changes
      clearSelection();
    },
    [clearSelection]
  );

  const resetAll = useCallback(() => {
    setMatches(prev =>
      prev.map(match => ({
        ...match,
        status: "pending" as const,
        manualValue: undefined,
      }))
    );
    clearSelection();
  }, [clearSelection]);

  const state: FuzzyMatchReviewState = {
    matches,
    selectedMatches,
    filter,
    stats,
    canBatchOperate,
    filteredMatches,
  };

  const actions: FuzzyMatchReviewActions = {
    acceptMatch,
    rejectMatch,
    setManualValue,
    toggleSelection,
    selectAll,
    clearSelection,
    acceptSelected,
    rejectSelected,
    updateFilter,
    resetAll,
  };

  return {
    state,
    actions,
    hasChanges,
    isComplete,
  };
}

export default useFuzzyMatchReview;
