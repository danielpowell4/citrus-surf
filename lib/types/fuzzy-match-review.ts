/**
 * Types for fuzzy match review interface and operations
 */

import { FuzzyMatch } from '../utils/lookup-processor';

/**
 * Extended fuzzy match for review with additional UI metadata
 */
export interface FuzzyMatchForReview extends FuzzyMatch {
  /** Unique identifier for this match in the review context */
  id: string;
  /** Row index in the original dataset */
  rowIndex: number;
  /** Whether this match is currently selected for batch operations */
  selected?: boolean;
  /** Current review status */
  status: 'pending' | 'accepted' | 'rejected' | 'manual';
  /** Alternative suggestions from the matching engine */
  suggestions?: FuzzyMatchSuggestion[];
  /** Manual value entered by user (if status is 'manual') */
  manualValue?: any;
  /** Additional context from the row being processed */
  rowContext?: Record<string, any>;
}

/**
 * Suggestion for a fuzzy match
 */
export interface FuzzyMatchSuggestion {
  /** Suggested value */
  value: any;
  /** Confidence score for this suggestion (0-1) */
  confidence: number;
  /** Reason for the suggestion */
  reason: string;
  /** Additional metadata about this suggestion */
  metadata?: Record<string, any>;
}

/**
 * Batch of related fuzzy matches for group operations
 */
export interface FuzzyMatchBatch {
  /** Unique batch identifier */
  id: string;
  /** Description of the batch (e.g., "High confidence matches") */
  description: string;
  /** Matches in this batch */
  matches: FuzzyMatchForReview[];
  /** Confidence range for this batch */
  confidenceRange: [number, number];
  /** Whether all matches in batch can be accepted as a group */
  canBatchAccept: boolean;
}

/**
 * Filter criteria for fuzzy match review
 */
export interface FuzzyMatchFilter {
  /** Filter by confidence score range */
  confidenceRange?: [number, number];
  /** Filter by field name */
  fieldName?: string;
  /** Filter by review status */
  status?: FuzzyMatchForReview['status'][];
  /** Search term for input values or suggestions */
  searchTerm?: string;
  /** Group matches by similarity */
  groupBySimilarity?: boolean;
}

/**
 * Statistics for fuzzy match review session
 */
export interface FuzzyMatchReviewStats {
  /** Total number of matches requiring review */
  totalMatches: number;
  /** Number of matches accepted */
  accepted: number;
  /** Number of matches rejected */
  rejected: number;
  /** Number of matches with manual values */
  manual: number;
  /** Number of matches still pending */
  pending: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Confidence distribution buckets */
  confidenceDistribution: {
    range: [number, number];
    count: number;
  }[];
}

/**
 * Props for the fuzzy match review modal component
 */
export interface FuzzyMatchReviewModalProps {
  /** Matches to review */
  matches: FuzzyMatchForReview[];
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when a match is accepted */
  onAccept: (matchId: string, acceptedValue: any) => void;
  /** Callback when a match is rejected */
  onReject: (matchId: string) => void;
  /** Callback when multiple matches are accepted */
  onBatchAccept: (matchIds: string[], acceptedValue?: any) => void;
  /** Callback when multiple matches are rejected */
  onBatchReject: (matchIds: string[]) => void;
  /** Callback when a manual value is entered */
  onManualEntry: (matchId: string, value: any) => void;
  /** Initial filter state */
  initialFilter?: FuzzyMatchFilter;
  /** Whether to show batch operations */
  showBatchOperations?: boolean;
}

/**
 * Props for individual match comparison card
 */
export interface MatchComparisonCardProps {
  /** The fuzzy match to display */
  match: FuzzyMatchForReview;
  /** Whether the match is selected */
  selected?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (matchId: string, selected: boolean) => void;
  /** Callback when match is accepted */
  onAccept: (matchId: string, acceptedValue: any) => void;
  /** Callback when match is rejected */
  onReject: (matchId: string) => void;
  /** Callback when manual value is entered */
  onManualEntry: (matchId: string, value: any) => void;
  /** Whether to show detailed match information */
  showDetails?: boolean;
  /** Whether this card is in a batch context */
  inBatch?: boolean;
}

/**
 * State for the fuzzy match review hook
 */
export interface FuzzyMatchReviewState {
  /** All matches being reviewed */
  matches: FuzzyMatchForReview[];
  /** Currently selected matches for batch operations */
  selectedMatches: Set<string>;
  /** Active filter criteria */
  filter: FuzzyMatchFilter;
  /** Current statistics */
  stats: FuzzyMatchReviewStats;
  /** Whether batch operations are available */
  canBatchOperate: boolean;
  /** Filtered and sorted matches based on current criteria */
  filteredMatches: FuzzyMatchForReview[];
}

/**
 * Actions for the fuzzy match review hook
 */
export interface FuzzyMatchReviewActions {
  /** Accept a single match */
  acceptMatch: (matchId: string, acceptedValue?: any) => void;
  /** Reject a single match */
  rejectMatch: (matchId: string) => void;
  /** Set manual value for a match */
  setManualValue: (matchId: string, value: any) => void;
  /** Toggle selection of a match */
  toggleSelection: (matchId: string) => void;
  /** Select all matches matching criteria */
  selectAll: (criteria?: Partial<FuzzyMatchFilter>) => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Accept all selected matches */
  acceptSelected: (acceptedValue?: any) => void;
  /** Reject all selected matches */
  rejectSelected: () => void;
  /** Update filter criteria */
  updateFilter: (filter: Partial<FuzzyMatchFilter>) => void;
  /** Reset all matches to pending */
  resetAll: () => void;
}

/**
 * Return type for the fuzzy match review hook
 */
export interface UseFuzzyMatchReviewResult {
  /** Current state */
  state: FuzzyMatchReviewState;
  /** Available actions */
  actions: FuzzyMatchReviewActions;
  /** Whether any changes have been made */
  hasChanges: boolean;
  /** Whether all matches have been processed */
  isComplete: boolean;
}

/**
 * Configuration for automatic batch grouping
 */
export interface BatchGroupingConfig {
  /** Group by confidence threshold ranges */
  confidenceThresholds: number[];
  /** Group by field name */
  groupByField: boolean;
  /** Group by similar input values */
  groupBySimilarInput: boolean;
  /** Maximum size per batch */
  maxBatchSize: number;
  /** Minimum confidence for auto-accept batch */
  autoAcceptThreshold: number;
}