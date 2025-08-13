import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { useFuzzyMatchReview } from "./useFuzzyMatchReview";
import type { FuzzyMatch } from "@/lib/utils/lookup-processor";

// Mock Redux store
const mockStore = configureStore({
  reducer: {
    // Mock reducer that just returns state
    root: (state = {}, action) => state,
  },
});

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockMatches: FuzzyMatch[] = [
  {
    rowId: "row_1",
    fieldName: "department",
    inputValue: "Enginering",
    suggestedValue: "Engineering",
    confidence: 0.85,
  },
  {
    rowId: "row_2",
    fieldName: "department",
    inputValue: "Marketng",
    suggestedValue: "Marketing",
    confidence: 0.75,
  },
  {
    rowId: "row_3",
    fieldName: "status",
    inputValue: "Actve",
    suggestedValue: "Active",
    confidence: 0.9,
  },
];

describe("useFuzzyMatchReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with correct state", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    expect(result.current.state.matches).toHaveLength(3);
    expect(result.current.state.selectedMatches.size).toBe(0);
    expect(result.current.state.stats.totalMatches).toBe(3);
    expect(result.current.state.stats.pending).toBe(3);
    expect(result.current.state.stats.accepted).toBe(0);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.isComplete).toBe(false);
  });

  it("accepts a match correctly", () => {
    const onMatchUpdated = vi.fn();
    const { result } = renderHook(() =>
      useFuzzyMatchReview(mockMatches, onMatchUpdated)
    );

    const matchId = result.current.state.matches[0].id;

    act(() => {
      result.current.actions.acceptMatch(matchId, "Engineering");
    });

    // Check state updates
    const acceptedMatch = result.current.state.matches.find(
      m => m.id === matchId
    );
    expect(acceptedMatch?.status).toBe("accepted");
    expect(acceptedMatch?.manualValue).toBe("Engineering");

    // Check stats updates
    expect(result.current.state.stats.accepted).toBe(1);
    expect(result.current.state.stats.pending).toBe(2);
    expect(result.current.hasChanges).toBe(true);

    // Check callback was called
    expect(onMatchUpdated).toHaveBeenCalledWith(
      matchId,
      "accepted",
      "Engineering"
    );

    // Check Redux dispatch
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "lookup/acceptFuzzyMatch",
      payload: { matchId, acceptedValue: "Engineering" },
    });
  });

  it("rejects a match correctly", () => {
    const onMatchUpdated = vi.fn();
    const { result } = renderHook(() =>
      useFuzzyMatchReview(mockMatches, onMatchUpdated)
    );

    const matchId = result.current.state.matches[0].id;

    act(() => {
      result.current.actions.rejectMatch(matchId);
    });

    // Check state updates
    const rejectedMatch = result.current.state.matches.find(
      m => m.id === matchId
    );
    expect(rejectedMatch?.status).toBe("rejected");

    // Check stats updates
    expect(result.current.state.stats.rejected).toBe(1);
    expect(result.current.state.stats.pending).toBe(2);
    expect(result.current.hasChanges).toBe(true);

    // Check callback was called
    expect(onMatchUpdated).toHaveBeenCalledWith(matchId, "rejected");

    // Check Redux dispatch
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "lookup/rejectFuzzyMatch",
      payload: { matchId },
    });
  });

  it("sets manual value correctly", () => {
    const onMatchUpdated = vi.fn();
    const { result } = renderHook(() =>
      useFuzzyMatchReview(mockMatches, onMatchUpdated)
    );

    const matchId = result.current.state.matches[0].id;

    act(() => {
      result.current.actions.setManualValue(matchId, "Custom Department");
    });

    // Check state updates
    const manualMatch = result.current.state.matches.find(
      m => m.id === matchId
    );
    expect(manualMatch?.status).toBe("manual");
    expect(manualMatch?.manualValue).toBe("Custom Department");

    // Check stats updates
    expect(result.current.state.stats.manual).toBe(1);
    expect(result.current.state.stats.pending).toBe(2);
    expect(result.current.hasChanges).toBe(true);

    // Check callback was called
    expect(onMatchUpdated).toHaveBeenCalledWith(
      matchId,
      "manual",
      "Custom Department"
    );

    // Check Redux dispatch
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "lookup/manualEntryForMatch",
      payload: { matchId, value: "Custom Department" },
    });
  });

  it("toggles selection correctly", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    const matchId = result.current.state.matches[0].id;

    // Select match
    act(() => {
      result.current.actions.toggleSelection(matchId);
    });

    expect(result.current.state.selectedMatches.has(matchId)).toBe(true);
    expect(result.current.state.canBatchOperate).toBe(true);

    // Deselect match
    act(() => {
      result.current.actions.toggleSelection(matchId);
    });

    expect(result.current.state.selectedMatches.has(matchId)).toBe(false);
    expect(result.current.state.canBatchOperate).toBe(false);
  });

  it("selects all matches correctly", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    act(() => {
      result.current.actions.selectAll();
    });

    expect(result.current.state.selectedMatches.size).toBe(3);
    expect(result.current.state.canBatchOperate).toBe(true);
  });

  it("selects matches by criteria", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    act(() => {
      result.current.actions.selectAll({ fieldName: "department" });
    });

    expect(result.current.state.selectedMatches.size).toBe(2); // Only department matches
  });

  it("clears selection correctly", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    // First select all
    act(() => {
      result.current.actions.selectAll();
    });

    expect(result.current.state.selectedMatches.size).toBe(3);

    // Then clear
    act(() => {
      result.current.actions.clearSelection();
    });

    expect(result.current.state.selectedMatches.size).toBe(0);
    expect(result.current.state.canBatchOperate).toBe(false);
  });

  it("accepts selected matches in batch", () => {
    const onMatchUpdated = vi.fn();
    const { result } = renderHook(() =>
      useFuzzyMatchReview(mockMatches, onMatchUpdated)
    );

    // Select first two matches
    const matchIds = result.current.state.matches.slice(0, 2).map(m => m.id);

    act(() => {
      matchIds.forEach(id => result.current.actions.toggleSelection(id));
    });

    act(() => {
      result.current.actions.acceptSelected("Batch Value");
    });

    // Check that selected matches were accepted
    const acceptedMatches = result.current.state.matches.filter(
      m => m.status === "accepted"
    );
    expect(acceptedMatches).toHaveLength(2);
    expect(acceptedMatches.every(m => m.manualValue === "Batch Value")).toBe(
      true
    );

    // Check stats
    expect(result.current.state.stats.accepted).toBe(2);
    expect(result.current.state.stats.pending).toBe(1);

    // Check selection is cleared
    expect(result.current.state.selectedMatches.size).toBe(0);

    // Check Redux dispatch
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "lookup/batchAcceptMatches",
      payload: { matchIds, acceptedValue: "Batch Value" },
    });
  });

  it("rejects selected matches in batch", () => {
    const onMatchUpdated = vi.fn();
    const { result } = renderHook(() =>
      useFuzzyMatchReview(mockMatches, onMatchUpdated)
    );

    // Select first two matches
    const matchIds = result.current.state.matches.slice(0, 2).map(m => m.id);

    act(() => {
      matchIds.forEach(id => result.current.actions.toggleSelection(id));
    });

    act(() => {
      result.current.actions.rejectSelected();
    });

    // Check that selected matches were rejected
    const rejectedMatches = result.current.state.matches.filter(
      m => m.status === "rejected"
    );
    expect(rejectedMatches).toHaveLength(2);

    // Check stats
    expect(result.current.state.stats.rejected).toBe(2);
    expect(result.current.state.stats.pending).toBe(1);

    // Check selection is cleared
    expect(result.current.state.selectedMatches.size).toBe(0);

    // Check Redux dispatch
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "lookup/batchRejectMatches",
      payload: { matchIds },
    });
  });

  it("updates filter correctly", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    act(() => {
      result.current.actions.updateFilter({
        fieldName: "department",
        confidenceRange: [0.8, 1.0],
      });
    });

    expect(result.current.state.filter.fieldName).toBe("department");
    expect(result.current.state.filter.confidenceRange).toEqual([0.8, 1.0]);

    // Check filtered results
    expect(result.current.state.filteredMatches).toHaveLength(1); // Only high-confidence department match
  });

  it("filters by search term", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    act(() => {
      result.current.actions.updateFilter({ searchTerm: "Engineering" });
    });

    expect(result.current.state.filteredMatches).toHaveLength(1);
    expect(result.current.state.filteredMatches[0].suggestedValue).toBe(
      "Engineering"
    );
  });

  it("filters by status", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    // First accept one match
    const matchId = result.current.state.matches[0].id;
    act(() => {
      result.current.actions.acceptMatch(matchId);
    });

    // Then filter by accepted status
    act(() => {
      result.current.actions.updateFilter({ status: ["accepted"] });
    });

    expect(result.current.state.filteredMatches).toHaveLength(1);
    expect(result.current.state.filteredMatches[0].status).toBe("accepted");
  });

  it("resets all matches correctly", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    // First make some changes
    const matchIds = result.current.state.matches.slice(0, 2).map(m => m.id);
    act(() => {
      result.current.actions.acceptMatch(matchIds[0]);
      result.current.actions.rejectMatch(matchIds[1]);
      result.current.actions.toggleSelection(matchIds[0]);
    });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.state.selectedMatches.size).toBe(1);

    // Reset all
    act(() => {
      result.current.actions.resetAll();
    });

    expect(result.current.hasChanges).toBe(false);
    expect(result.current.state.selectedMatches.size).toBe(0);
    expect(
      result.current.state.matches.every(m => m.status === "pending")
    ).toBe(true);
    expect(result.current.state.stats.pending).toBe(3);
    expect(result.current.state.stats.accepted).toBe(0);
    expect(result.current.state.stats.rejected).toBe(0);
  });

  it("calculates completion status correctly", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    expect(result.current.isComplete).toBe(false);

    // Process all matches
    act(() => {
      const matchIds = result.current.state.matches.map(m => m.id);
      result.current.actions.acceptMatch(matchIds[0]);
      result.current.actions.rejectMatch(matchIds[1]);
      result.current.actions.setManualValue(matchIds[2], "Manual");
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.state.stats.progress).toBe(100);
  });

  it("calculates confidence distribution correctly", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    const distribution = result.current.state.stats.confidenceDistribution;

    // Check buckets exist
    expect(distribution).toHaveLength(5);

    // Check that our test data is distributed correctly
    // mockMatches have confidences: 0.85, 0.75, 0.90
    expect(distribution.find(d => d.range[0] === 0.9)?.count).toBe(1); // 0.90
    expect(distribution.find(d => d.range[0] === 0.8)?.count).toBe(1); // 0.85
    expect(distribution.find(d => d.range[0] === 0.7)?.count).toBe(1); // 0.75
  });

  it("sorts filtered matches by confidence and field name", () => {
    const { result } = renderHook(() => useFuzzyMatchReview(mockMatches));

    const filtered = result.current.state.filteredMatches;

    // Should be sorted by confidence (high to low)
    expect(filtered[0].confidence).toBe(0.9); // Highest confidence first
    expect(filtered[1].confidence).toBe(0.85);
    expect(filtered[2].confidence).toBe(0.75);
  });
});
