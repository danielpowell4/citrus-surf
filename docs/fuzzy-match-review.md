# Fuzzy Match Review System

The Fuzzy Match Review system provides an intuitive interface for users to review and approve lookup matches that fall below the automatic confidence threshold. This guide covers the implementation, usage patterns, and best practices.

## Overview

When the lookup matching engine finds potential matches with confidence scores below the specified threshold, these matches are collected for manual review. The system provides:

- **Side-by-side comparison** of input values vs suggested matches
- **Confidence scoring** with visual indicators
- **Batch operations** for efficient processing
- **Manual entry** for custom corrections
- **Search and filtering** capabilities
- **Progress tracking** and statistics

## Core Components

### FuzzyMatchReviewModal

The main modal component that orchestrates the entire review process.

```typescript
import { FuzzyMatchReviewModal } from '@/components/fuzzy-match-review-modal';

<FuzzyMatchReviewModal
  matches={fuzzyMatches}
  isOpen={isReviewModalOpen}
  onClose={() => setIsReviewModalOpen(false)}
  onAccept={(matchId, value) => handleAcceptMatch(matchId, value)}
  onReject={(matchId) => handleRejectMatch(matchId)}
  onBatchAccept={(matchIds) => handleBatchAccept(matchIds)}
  onBatchReject={(matchIds) => handleBatchReject(matchIds)}
  onManualEntry={(matchId, value) => handleManualEntry(matchId, value)}
  showBatchOperations={true}
  initialFilter={{ confidenceRange: [0.6, 1.0] }}
/>
```

### MatchComparisonCard

Individual match display component with action controls.

```typescript
import { MatchComparisonCard } from '@/components/match-comparison-card';

<MatchComparisonCard
  match={fuzzyMatch}
  selected={isSelected}
  onSelectionChange={handleSelectionChange}
  onAccept={handleAccept}
  onReject={handleReject}
  onManualEntry={handleManualEntry}
  showDetails={true}
  inBatch={true}
/>
```

### useFuzzyMatchReview Hook

State management hook for review operations.

```typescript
import { useFuzzyMatchReview } from '@/hooks/useFuzzyMatchReview';

const { state, actions, hasChanges, isComplete } = useFuzzyMatchReview(
  initialMatches,
  onMatchUpdated
);
```

## Data Flow

### 1. Fuzzy Match Generation

During lookup processing, matches with confidence scores below the threshold are collected:

```typescript
// In lookup processor
if (result.confidence < minConfidence && fuzzyMatches.length < maxFuzzyMatches) {
  fuzzyMatches.push({
    rowId: row._rowId,
    fieldName: lookupField.id,
    inputValue: inputValue,
    suggestedValue: result.matchedValue,
    confidence: result.confidence
  });
}
```

### 2. Review Session Initialization

Fuzzy matches are enhanced with UI metadata:

```typescript
const reviewMatches: FuzzyMatchForReview[] = fuzzyMatches.map((match, index) => ({
  ...match,
  id: `match_${match.rowId}_${match.fieldName}_${index}`,
  rowIndex: parseInt(match.rowId.replace(/^row_/, '')) || index,
  status: 'pending',
  selected: false,
  suggestions: generateSuggestions(match)
}));
```

### 3. User Actions

Users can perform several actions on matches:

- **Accept**: Apply the suggested value
- **Reject**: Leave the original value unchanged
- **Manual Entry**: Provide a custom value
- **Batch Operations**: Apply actions to multiple matches

### 4. State Updates

All actions trigger Redux actions for history tracking:

```typescript
// Individual actions
dispatch({ type: 'lookup/acceptFuzzyMatch', payload: { matchId, acceptedValue } });
dispatch({ type: 'lookup/rejectFuzzyMatch', payload: { matchId } });
dispatch({ type: 'lookup/manualEntryForMatch', payload: { matchId, value } });

// Batch actions
dispatch({ type: 'lookup/batchAcceptMatches', payload: { matchIds, acceptedValue } });
dispatch({ type: 'lookup/batchRejectMatches', payload: { matchIds } });
```

## Usage Patterns

### Basic Review Workflow

```typescript
function LookupDataProcessor() {
  const [fuzzyMatches, setFuzzyMatches] = useState<FuzzyMatch[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const processData = async (data: TableRow[], lookupFields: LookupField[]) => {
    const result = await lookupProcessor.processData(data, lookupFields, {
      minConfidence: 0.8,
      maxFuzzyMatches: 50
    });

    if (result.fuzzyMatches.length > 0) {
      setFuzzyMatches(result.fuzzyMatches);
      setIsReviewOpen(true);
    }

    return result;
  };

  const handleAcceptMatch = (matchId: string, value: any) => {
    // Apply the accepted value to the data
    updateDataWithAcceptedMatch(matchId, value);
  };

  const handleRejectMatch = (matchId: string) => {
    // Keep original value, mark as reviewed
    markMatchAsReviewed(matchId, 'rejected');
  };

  return (
    <>
      {/* Your data processing UI */}
      
      <FuzzyMatchReviewModal
        matches={fuzzyMatches}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onAccept={handleAcceptMatch}
        onReject={handleRejectMatch}
        // ... other handlers
      />
    </>
  );
}
```

### Advanced Filtering

```typescript
const advancedFilter: FuzzyMatchFilter = {
  confidenceRange: [0.6, 0.9],
  fieldName: 'department',
  status: ['pending'],
  searchTerm: 'engineering',
  groupBySimilarity: true
};

<FuzzyMatchReviewModal
  matches={matches}
  initialFilter={advancedFilter}
  // ... other props
/>
```

### Batch Operations

```typescript
function BatchReviewHandler() {
  const { state, actions } = useFuzzyMatchReview(matches);

  const handleAcceptHighConfidence = () => {
    // Select all matches above 85% confidence
    actions.selectAll({ confidenceRange: [0.85, 1.0] });
    
    // Accept all selected matches
    actions.acceptSelected();
  };

  const handleRejectLowConfidence = () => {
    // Select all matches below 60% confidence
    actions.selectAll({ confidenceRange: [0.0, 0.6] });
    
    // Reject all selected matches
    actions.rejectSelected();
  };

  return (
    <div>
      <Button onClick={handleAcceptHighConfidence}>
        Accept High Confidence
      </Button>
      <Button onClick={handleRejectLowConfidence}>
        Reject Low Confidence
      </Button>
    </div>
  );
}
```

## Configuration Options

### Confidence Thresholds

```typescript
const processingOptions: LookupProcessingOptions = {
  minConfidence: 0.7,        // Matches below this go to review
  autoAcceptThreshold: 0.9,  // Matches above this are auto-accepted
  maxFuzzyMatches: 100       // Maximum matches to collect for review
};
```

### UI Customization

```typescript
<FuzzyMatchReviewModal
  showBatchOperations={true}           // Enable batch operations
  initialFilter={{ status: ['pending'] }} // Default filter
  matches={matches}
  // Custom callbacks for different scenarios
  onAccept={handleAccept}
  onReject={handleReject}
  onManualEntry={handleManualEntry}
  onBatchAccept={handleBatchAccept}
  onBatchReject={handleBatchReject}
/>
```

## Performance Considerations

### Large Datasets

For datasets with many fuzzy matches:

1. **Limit collection**: Use `maxFuzzyMatches` to prevent memory issues
2. **Progressive review**: Break review into multiple sessions
3. **Smart defaults**: Pre-filter high-confidence matches for batch acceptance

```typescript
const options: LookupProcessingOptions = {
  maxFuzzyMatches: 50,  // Limit to top 50 matches
  minConfidence: 0.8,   // Higher threshold for fewer matches
};
```

### Memory Usage

The review system efficiently manages memory by:

- Lazy loading match details
- Virtualized scrolling for large lists
- Debounced filter updates
- Optimized re-renders

## Best Practices

### 1. Set Appropriate Thresholds

```typescript
// For high-accuracy requirements
const strictOptions = {
  minConfidence: 0.9,
  autoAcceptThreshold: 0.95
};

// For bulk processing with manual review
const bulkOptions = {
  minConfidence: 0.7,
  autoAcceptThreshold: 0.85,
  maxFuzzyMatches: 100
};
```

### 2. Provide Context

Include row context for better decision making:

```typescript
const enhancedMatch: FuzzyMatchForReview = {
  ...baseMatch,
  rowContext: {
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email
  }
};
```

### 3. Handle Edge Cases

```typescript
const handleReviewCompletion = (reviewResults: ReviewResults) => {
  // Apply accepted matches
  reviewResults.accepted.forEach(match => {
    applyMatchToData(match.rowId, match.fieldName, match.acceptedValue);
  });

  // Handle rejected matches
  reviewResults.rejected.forEach(match => {
    logRejectedMatch(match);
    // Optionally flag for further review
  });

  // Process manual entries
  reviewResults.manual.forEach(match => {
    validateManualEntry(match.manualValue);
    applyMatchToData(match.rowId, match.fieldName, match.manualValue);
  });
};
```

### 4. Batch Operations Strategy

```typescript
const smartBatchStrategy = (matches: FuzzyMatchForReview[]) => {
  // Group by confidence ranges
  const highConfidence = matches.filter(m => m.confidence >= 0.85);
  const mediumConfidence = matches.filter(m => m.confidence >= 0.7 && m.confidence < 0.85);
  const lowConfidence = matches.filter(m => m.confidence < 0.7);

  // Auto-accept high confidence
  highConfidence.forEach(match => actions.acceptMatch(match.id));

  // Review medium confidence individually
  // Auto-reject very low confidence (optional)
  if (autoRejectVeryLow) {
    lowConfidence.filter(m => m.confidence < 0.5)
      .forEach(match => actions.rejectMatch(match.id));
  }
};
```

## Accessibility

The fuzzy match review system supports:

- **Keyboard navigation**: Tab through matches and controls
- **Screen readers**: Proper ARIA labels and descriptions
- **High contrast**: Confidence indicators work in high contrast mode
- **Focus management**: Clear focus indicators and logical tab order

```typescript
// Example accessibility features
<MatchComparisonCard
  match={match}
  aria-label={`Review match for ${match.fieldName} in row ${match.rowIndex + 1}`}
  // ... other props
/>
```

## Troubleshooting

### Common Issues

1. **No fuzzy matches generated**
   - Check confidence thresholds
   - Verify reference data is loaded
   - Ensure smart matching is enabled

2. **Poor match quality**
   - Review string similarity algorithms
   - Adjust confidence thresholds
   - Check reference data quality

3. **Performance issues**
   - Reduce `maxFuzzyMatches`
   - Implement progressive loading
   - Optimize reference data size

### Debug Tools

```typescript
// Enable debug logging
const debugOptions: LookupProcessingOptions = {
  debug: true,
  logLevel: 'verbose'
};

// Access match details
console.log('Fuzzy matches:', result.fuzzyMatches);
console.log('Processing stats:', result.stats);
console.log('Performance metrics:', result.performance);
```

## Integration with History System

All fuzzy match review actions are tracked in the history system for undo/redo functionality:

```typescript
// Actions that trigger history tracking
const meaningfulActions = [
  'lookup/acceptFuzzyMatch',
  'lookup/rejectFuzzyMatch',
  'lookup/batchAcceptMatches',
  'lookup/batchRejectMatches',
  'lookup/manualEntryForMatch'
];
```

Users can undo fuzzy match decisions using the standard undo functionality, which will restore the previous state of all affected matches and data.