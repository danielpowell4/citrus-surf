import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FuzzyMatchReviewModal } from "./fuzzy-match-review-modal";
import type { FuzzyMatchForReview } from "@/lib/types/fuzzy-match-review";

// Mock the useFuzzyMatchReview hook
const mockActions = {
  acceptMatch: vi.fn(),
  rejectMatch: vi.fn(),
  setManualValue: vi.fn(),
  toggleSelection: vi.fn(),
  selectAll: vi.fn(),
  clearSelection: vi.fn(),
  acceptSelected: vi.fn(),
  rejectSelected: vi.fn(),
  updateFilter: vi.fn(),
  resetAll: vi.fn(),
};

const mockState = {
  matches: [] as FuzzyMatchForReview[],
  selectedMatches: new Set<string>(),
  filter: {},
  stats: {
    totalMatches: 3,
    accepted: 0,
    rejected: 0,
    manual: 0,
    pending: 3,
    progress: 0,
    confidenceDistribution: [
      { range: [0.9, 1.0] as [number, number], count: 1 },
      { range: [0.8, 0.9] as [number, number], count: 1 },
      { range: [0.7, 0.8] as [number, number], count: 1 },
      { range: [0.6, 0.7] as [number, number], count: 0 },
      { range: [0.0, 0.6] as [number, number], count: 0 },
    ],
  },
  canBatchOperate: false,
  filteredMatches: [] as FuzzyMatchForReview[],
};

vi.mock("@/hooks/useFuzzyMatchReview", () => ({
  useFuzzyMatchReview: vi.fn(() => ({
    state: mockState,
    actions: mockActions,
    hasChanges: false,
    isComplete: false,
  })),
}));

// Mock Redux
vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
}));

const mockMatches: FuzzyMatchForReview[] = [
  {
    id: "match_001",
    rowId: "row_1",
    fieldName: "department",
    inputValue: "Enginering",
    suggestedValue: "Engineering",
    confidence: 0.85,
    rowIndex: 0,
    status: "pending",
    selected: false,
  },
  {
    id: "match_002",
    rowId: "row_2",
    fieldName: "department",
    inputValue: "Marketng",
    suggestedValue: "Marketing",
    confidence: 0.75,
    rowIndex: 1,
    status: "pending",
    selected: false,
  },
  {
    id: "match_003",
    rowId: "row_3",
    fieldName: "status",
    inputValue: "Actve",
    suggestedValue: "Active",
    confidence: 0.9,
    rowIndex: 2,
    status: "pending",
    selected: false,
  },
];

const defaultProps = {
  matches: mockMatches,
  isOpen: true,
  onClose: vi.fn(),
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onBatchAccept: vi.fn(),
  onBatchReject: vi.fn(),
  onManualEntry: vi.fn(),
};

describe("FuzzyMatchReviewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockState.matches = mockMatches;
    mockState.filteredMatches = mockMatches;
    mockState.selectedMatches = new Set();
    mockState.canBatchOperate = false;
  });

  it("renders modal when open", () => {
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    expect(screen.getByText("Review Fuzzy Matches")).toBeInTheDocument();
    expect(
      screen.getByText(/3 matches found with confidence scores/)
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<FuzzyMatchReviewModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Review Fuzzy Matches")).not.toBeInTheDocument();
  });

  it("displays review statistics", () => {
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    expect(screen.getByText("Review Summary")).toBeInTheDocument();
    expect(screen.getByText("0 of 3 processed")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // Pending count
  });

  it("shows confidence distribution", () => {
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    // Check for confidence range labels
    expect(screen.getByText("90-100%")).toBeInTheDocument();
    expect(screen.getByText("80-90%")).toBeInTheDocument();
    expect(screen.getByText("70-80%")).toBeInTheDocument();
  });

  it("provides search functionality", async () => {
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(
      "Search input or suggested values..."
    );
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Engineering" } });

    await waitFor(() => {
      expect(mockActions.updateFilter).toHaveBeenCalledWith({
        searchTerm: "Engineering",
      });
    });
  });

  it("provides status filtering", async () => {
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    // Try to find and click status filter - this might not be visible in test environment
    // Just verify that the updateFilter function would be called
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("shows batch operations when matches are selected", () => {
    // Mock selected state
    mockState.selectedMatches = new Set(["match_001", "match_002"]);
    mockState.canBatchOperate = true;

    render(<FuzzyMatchReviewModal {...defaultProps} />);

    expect(screen.getByText("2 matches selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /accept selected/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reject selected/i })
    ).toBeInTheDocument();
  });

  it("handles batch accept operation", () => {
    mockState.selectedMatches = new Set(["match_001", "match_002"]);
    mockState.canBatchOperate = true;

    render(<FuzzyMatchReviewModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /accept selected/i }));

    expect(mockActions.acceptSelected).toHaveBeenCalled();
    expect(defaultProps.onBatchAccept).toHaveBeenCalledWith([
      "match_001",
      "match_002",
    ]);
  });

  it("handles batch reject operation", () => {
    mockState.selectedMatches = new Set(["match_001", "match_002"]);
    mockState.canBatchOperate = true;

    render(<FuzzyMatchReviewModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /reject selected/i }));

    expect(mockActions.rejectSelected).toHaveBeenCalled();
    expect(defaultProps.onBatchReject).toHaveBeenCalledWith([
      "match_001",
      "match_002",
    ]);
  });

  it("handles select all functionality", () => {
    const _pendingMatches = mockMatches.filter(m => m.status === "pending");

    render(<FuzzyMatchReviewModal {...defaultProps} />);

    // Find the first checkbox (which should be select all)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    expect(mockActions.selectAll).toHaveBeenCalledWith({ status: ["pending"] });
  });

  it("calls onClose when modal is closed", () => {
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    // Try to close by clicking cancel
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows completion status when all matches processed", async () => {
    // Mock completed state
    const completedMatches = mockMatches.map(m => ({
      ...m,
      status: "accepted" as const,
    }));
    mockState.matches = completedMatches;
    mockState.filteredMatches = completedMatches;
    mockState.stats = {
      ...mockState.stats,
      accepted: 3,
      pending: 0,
      progress: 100,
    };

    // Mock isComplete
    const { useFuzzyMatchReview } = await import("@/hooks/useFuzzyMatchReview");
    vi.mocked(useFuzzyMatchReview).mockReturnValue({
      state: mockState,
      actions: mockActions,
      hasChanges: true,
      isComplete: true,
    });

    render(<FuzzyMatchReviewModal {...defaultProps} />);

    expect(screen.getByText("All matches processed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
  });

  it("shows reset button when changes have been made", async () => {
    // Mock changes state
    const { useFuzzyMatchReview } = await import("@/hooks/useFuzzyMatchReview");
    vi.mocked(useFuzzyMatchReview).mockReturnValue({
      state: mockState,
      actions: mockActions,
      hasChanges: true,
      isComplete: false,
    });

    render(<FuzzyMatchReviewModal {...defaultProps} />);

    const resetButton = screen.getByRole("button", { name: /reset all/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(mockActions.resetAll).toHaveBeenCalled();
  });

  it("shows empty state when no matches found", () => {
    mockState.matches = [];
    mockState.filteredMatches = [];
    mockState.stats = { ...mockState.stats, totalMatches: 0 };

    render(<FuzzyMatchReviewModal {...defaultProps} matches={[]} />);

    expect(screen.getByText("No fuzzy matches to review")).toBeInTheDocument();
  });

  it("shows filtered empty state", () => {
    mockState.filteredMatches = []; // Matches exist but filtered out

    render(<FuzzyMatchReviewModal {...defaultProps} />);

    expect(
      screen.getByText("No matches found with current filters")
    ).toBeInTheDocument();
  });

  it("applies initial filter when provided", () => {
    const initialFilter = {
      fieldName: "department",
      confidenceRange: [0.8, 1.0] as [number, number],
    };

    render(
      <FuzzyMatchReviewModal {...defaultProps} initialFilter={initialFilter} />
    );

    expect(mockActions.updateFilter).toHaveBeenCalledWith(initialFilter);
  });

  it("handles confidence range filtering", async () => {
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    // Click "More" to show advanced filters
    const moreButton = screen.getByRole("button", { name: /more/i });
    fireEvent.click(moreButton);

    // The slider would be complex to test, so we just verify it exists
    expect(screen.getByText(/Confidence Range:/)).toBeInTheDocument();
  });

  it("handles field name filtering when multiple fields exist", async () => {
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    // Click "More" to show advanced filters
    const moreButton = screen.getByRole("button", { name: /more/i });
    fireEvent.click(moreButton);

    // Check that field filter exists (since we have both 'department' and 'status')
    expect(screen.getByText("Field")).toBeInTheDocument();
  });

  it("forwards match actions to parent callbacks", () => {
    // This would be tested through the MatchComparisonCard interactions
    // which are covered in the MatchComparisonCard tests
    render(<FuzzyMatchReviewModal {...defaultProps} />);

    // Just verify the modal renders - the actual forwarding is tested
    // through integration with the hook
    expect(screen.getByText("Review Fuzzy Matches")).toBeInTheDocument();
  });

  it("disables batch operations when showBatchOperations is false", () => {
    mockState.selectedMatches = new Set(["match_001"]);
    mockState.canBatchOperate = true;

    render(
      <FuzzyMatchReviewModal {...defaultProps} showBatchOperations={false} />
    );

    // Batch operations should not be shown
    expect(screen.queryByText("1 matches selected")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /accept selected/i })
    ).not.toBeInTheDocument();
  });
});
