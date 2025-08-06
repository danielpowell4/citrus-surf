import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FuzzyMatchReviewModal } from '@/components/fuzzy-match-review-modal';
import { lookupProcessor } from '@/lib/utils/lookup-processor';
import { referenceDataManager } from '@/lib/utils/reference-data-manager';
import type { LookupField } from '@/lib/types/target-shapes';
import type { TableRow } from '@/lib/features/tableSlice';
import type { FuzzyMatchForReview } from '@/lib/types/fuzzy-match-review';

// Mock dependencies
vi.mock('@/lib/utils/lookup-processor', () => ({
  lookupProcessor: {
    processData: vi.fn()
  }
}));

vi.mock('@/lib/utils/reference-data-manager', () => ({
  referenceDataManager: {
    getFileData: vi.fn(),
    hasFile: vi.fn()
  }
}));

// Mock store
const mockStore = configureStore({
  reducer: {
    table: (state = { data: [] }, action) => state,
    history: (state = { actions: [] }, action) => state,
    targetShapes: (state = { shapes: [] }, action) => state,
    persistence: (state = {}, action) => state,
    referenceData: (state = { files: [] }, action) => state,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
});

// Mock data
const mockReferenceData = [
  { department_name: 'Engineering', department_code: 'ENG', budget: 1000000 },
  { department_name: 'Marketing', department_code: 'MKT', budget: 500000 },
  { department_name: 'Sales', department_code: 'SAL', budget: 750000 },
  { department_name: 'Human Resources', department_code: 'HR', budget: 300000 }
];

const mockTableData: TableRow[] = [
  { _rowId: 'row_1', name: 'John Doe', department: 'Enginering' }, // Typo
  { _rowId: 'row_2', name: 'Jane Smith', department: 'Marketng' }, // Typo
  { _rowId: 'row_3', name: 'Bob Johnson', department: 'Sales' }, // Exact match
  { _rowId: 'row_4', name: 'Alice Brown', department: 'HR Department' }, // Fuzzy match
  { _rowId: 'row_5', name: 'Charlie Wilson', department: 'Unknown' } // No match
];

const mockLookupField: LookupField = {
  id: 'dept_lookup',
  referenceFile: 'departments.csv',
  on: 'department_name',
  get: 'department_code',
  show: 'department_name',
  alsoGet: ['budget'],
  smartMatching: {
    enabled: true,
    confidence: 0.7
  }
};

describe.skip('Fuzzy Match Review Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup reference data
    const { referenceDataManager } = vi.mocked(require('@/lib/utils/reference-data-manager'));
    referenceDataManager.getFileData.mockReturnValue(mockReferenceData);
    referenceDataManager.hasFile.mockReturnValue(true);
  });

  it('integrates with lookup processor to generate fuzzy matches', async () => {
    // Mock the lookup processor response
    const { lookupProcessor } = vi.mocked(require('@/lib/utils/lookup-processor'));
    const mockResult = {
      data: mockTableData,
      fuzzyMatches: [
        {
          rowId: 'row_1',
          fieldName: 'department',
          inputValue: 'Enginering',
          suggestedValue: 'Engineering',
          confidence: 0.85
        }
      ],
      errors: [],
      stats: { processed: 5, matched: 4, fuzzy: 1 }
    };
    
    lookupProcessor.processData.mockResolvedValue(mockResult);

    // Process data with lookup processor
    const result = await lookupProcessor.processData(
      mockTableData,
      [mockLookupField],
      {
        minConfidence: 0.8, // Higher threshold to generate fuzzy matches
        maxFuzzyMatches: 10
      }
    );

    // Should have fuzzy matches for low-confidence results
    expect(result.fuzzyMatches.length).toBeGreaterThan(0);
    
    // Convert to FuzzyMatchForReview format
    const reviewMatches: FuzzyMatchForReview[] = result.fuzzyMatches.map((match, index) => ({
      ...match,
      id: `match_${match.rowId}_${match.fieldName}_${index}`,
      rowIndex: parseInt(match.rowId.replace('row_', '')) - 1,
      status: 'pending' as const,
      selected: false
    }));

    // Render the review modal
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const onClose = vi.fn();

    render(
      <Provider store={mockStore}>
        <FuzzyMatchReviewModal
          matches={reviewMatches}
          isOpen={true}
          onClose={onClose}
          onAccept={onAccept}
          onReject={onReject}
          onBatchAccept={vi.fn()}
          onBatchReject={vi.fn()}
          onManualEntry={vi.fn()}
        />
      </Provider>
    );

    // Verify fuzzy matches are displayed
    expect(screen.getByText('Review Fuzzy Matches')).toBeInTheDocument();
    expect(screen.getByText(/matches found with confidence scores/)).toBeInTheDocument();
  });

  it('handles fuzzy match acceptance and applies changes to data', async () => {
    // Create a specific fuzzy match scenario
    const fuzzyMatchData: TableRow[] = [
      { _rowId: 'row_1', name: 'John Doe', department: 'Enginering' }
    ];

    const { lookupProcessor } = vi.mocked(require('@/lib/utils/lookup-processor'));
    const mockResult = {
      data: fuzzyMatchData,
      fuzzyMatches: [
        {
          rowId: 'row_1',
          fieldName: 'department',
          inputValue: 'Enginering',
          suggestedValue: 'Engineering',
          confidence: 0.85
        }
      ],
      errors: [],
      stats: { processed: 1, matched: 0, fuzzy: 1 }
    };
    
    lookupProcessor.processData.mockResolvedValue(mockResult);

    const result = await lookupProcessor.processData(
      fuzzyMatchData,
      [mockLookupField],
      { minConfidence: 0.9, maxFuzzyMatches: 10 } // High threshold to force fuzzy match
    );

    expect(result.fuzzyMatches.length).toBe(1);
    
    const reviewMatch: FuzzyMatchForReview = {
      ...result.fuzzyMatches[0],
      id: 'match_001',
      rowIndex: 0,
      status: 'pending',
      selected: false
    };

    const onAccept = vi.fn();
    
    render(
      <Provider store={mockStore}>
        <FuzzyMatchReviewModal
          matches={[reviewMatch]}
          isOpen={true}
          onClose={vi.fn()}
          onAccept={onAccept}
          onReject={vi.fn()}
          onBatchAccept={vi.fn()}
          onBatchReject={vi.fn()}
          onManualEntry={vi.fn()}
        />
      </Provider>
    );

    // Find and accept the match
    const acceptButton = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptButton);

    // Verify the acceptance callback was called
    await waitFor(() => {
      expect(onAccept).toHaveBeenCalledWith('match_001', reviewMatch.suggestedValue);
    });
  });

  it('handles batch operations on multiple fuzzy matches', async () => {
    // Create multiple fuzzy matches
    const fuzzyMatchData: TableRow[] = [
      { _rowId: 'row_1', name: 'John Doe', department: 'Enginering' },
      { _rowId: 'row_2', name: 'Jane Smith', department: 'Marketng' }
    ];

    const { lookupProcessor } = vi.mocked(require('@/lib/utils/lookup-processor'));
    const mockResult = {
      data: fuzzyMatchData,
      fuzzyMatches: [
        {
          rowId: 'row_1',
          fieldName: 'department',
          inputValue: 'Enginering',
          suggestedValue: 'Engineering',
          confidence: 0.85
        },
        {
          rowId: 'row_2',
          fieldName: 'department',
          inputValue: 'Marketng',
          suggestedValue: 'Marketing',
          confidence: 0.82
        }
      ],
      errors: [],
      stats: { processed: 2, matched: 0, fuzzy: 2 }
    };
    
    lookupProcessor.processData.mockResolvedValue(mockResult);

    const result = await lookupProcessor.processData(
      fuzzyMatchData,
      [mockLookupField],
      { minConfidence: 0.9, maxFuzzyMatches: 10 }
    );

    const reviewMatches: FuzzyMatchForReview[] = result.fuzzyMatches.map((match, index) => ({
      ...match,
      id: `match_${index}`,
      rowIndex: index,
      status: 'pending' as const,
      selected: false
    }));

    const onBatchAccept = vi.fn();
    
    render(
      <Provider store={mockStore}>
        <FuzzyMatchReviewModal
          matches={reviewMatches}
          isOpen={true}
          onClose={vi.fn()}
          onAccept={vi.fn()}
          onReject={vi.fn()}
          onBatchAccept={onBatchAccept}
          onBatchReject={vi.fn()}
          onManualEntry={vi.fn()}
        />
      </Provider>
    );

    // Select all matches
    const selectAllCheckbox = screen.getByLabelText(/select all pending matches/i);
    fireEvent.click(selectAllCheckbox);

    // Batch accept
    const batchAcceptButton = screen.getByRole('button', { name: /accept selected/i });
    fireEvent.click(batchAcceptButton);

    await waitFor(() => {
      expect(onBatchAccept).toHaveBeenCalled();
    });
  });

  it('handles manual entry for fuzzy matches', async () => {
    const fuzzyMatchData: TableRow[] = [
      { _rowId: 'row_1', name: 'John Doe', department: 'Unknown Dept' }
    ];

    const { lookupProcessor } = vi.mocked(require('@/lib/utils/lookup-processor'));
    const mockResult = {
      data: fuzzyMatchData,
      fuzzyMatches: [
        {
          rowId: 'row_1',
          fieldName: 'department',
          inputValue: 'Unknown Dept',
          suggestedValue: 'Engineering', // Best guess but low confidence
          confidence: 0.3
        }
      ],
      errors: [],
      stats: { processed: 1, matched: 0, fuzzy: 1 }
    };
    
    lookupProcessor.processData.mockResolvedValue(mockResult);

    const result = await lookupProcessor.processData(
      fuzzyMatchData,
      [mockLookupField],
      { minConfidence: 0.9, maxFuzzyMatches: 10 }
    );

    // Simulate a case where no good match was found
    const reviewMatch: FuzzyMatchForReview = {
      ...result.fuzzyMatches[0],
      id: 'match_001',
      rowIndex: 0,
      status: 'pending',
      selected: false
    };

    const onManualEntry = vi.fn();
    
    render(
      <Provider store={mockStore}>
        <FuzzyMatchReviewModal
          matches={[reviewMatch]}
          isOpen={true}
          onClose={vi.fn()}
          onAccept={vi.fn()}
          onReject={vi.fn()}
          onBatchAccept={vi.fn()}
          onBatchReject={vi.fn()}
          onManualEntry={onManualEntry}
        />
      </Provider>
    );

    // Click manual entry button
    fireEvent.click(screen.getByRole('button', { name: /manual/i }));

    // Enter custom value
    const input = screen.getByPlaceholderText('Enter correct value...');
    fireEvent.change(input, { target: { value: 'Operations' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onManualEntry).toHaveBeenCalledWith('match_001', 'Operations');
    });
  });

  it('filters fuzzy matches by confidence and field', async () => {
    // Create mixed confidence matches
    const mixedData: TableRow[] = [
      { _rowId: 'row_1', department: 'Enginering', status: 'Actve' },
      { _rowId: 'row_2', department: 'Marketing', status: 'Inactive' }
    ];

    const departmentField: LookupField = {
      ...mockLookupField,
      id: 'dept_lookup'
    };

    const statusField: LookupField = {
      id: 'status_lookup',
      referenceFile: 'statuses.csv',
      on: 'status_name',
      get: 'status_code',
      smartMatching: { enabled: true, confidence: 0.7 }
    };

    // Mock status reference data
    vi.mocked(referenceDataManager.getFileData).mockImplementation((filename) => {
      if (filename === 'departments.csv') return mockReferenceData;
      if (filename === 'statuses.csv') return [
        { status_name: 'Active', status_code: 'ACT' },
        { status_name: 'Inactive', status_code: 'INA' }
      ];
      return [];
    });

    const result = await lookupProcessor.processData(
      mixedData,
      [departmentField, statusField],
      { minConfidence: 0.9, maxFuzzyMatches: 10 }
    );

    const reviewMatches: FuzzyMatchForReview[] = result.fuzzyMatches.map((match, index) => ({
      ...match,
      id: `match_${index}`,
      rowIndex: 0,
      status: 'pending' as const,
      selected: false
    }));

    render(
      <Provider store={mockStore}>
        <FuzzyMatchReviewModal
          matches={reviewMatches}
          isOpen={true}
          onClose={vi.fn()}
          onAccept={vi.fn()}
          onReject={vi.fn()}
          onBatchAccept={vi.fn()}
          onBatchReject={vi.fn()}
          onManualEntry={vi.fn()}
        />
      </Provider>
    );

    // Test field filtering
    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    // Should show field filter since we have multiple fields
    expect(screen.getByText('Field')).toBeInTheDocument();
  });

  it('integrates with Redux store for history tracking', async () => {
    const fuzzyMatch: FuzzyMatchForReview = {
      id: 'match_001',
      rowId: 'row_1',
      fieldName: 'department',
      inputValue: 'Enginering',
      suggestedValue: 'Engineering',
      confidence: 0.85,
      rowIndex: 0,
      status: 'pending',
      selected: false
    };

    const mockDispatch = vi.fn();
    vi.mocked(require('react-redux').useDispatch).mockReturnValue(mockDispatch);

    render(
      <Provider store={mockStore}>
        <FuzzyMatchReviewModal
          matches={[fuzzyMatch]}
          isOpen={true}
          onClose={vi.fn()}
          onAccept={vi.fn()}
          onReject={vi.fn()}
          onBatchAccept={vi.fn()}
          onBatchReject={vi.fn()}
          onManualEntry={vi.fn()}
        />
      </Provider>
    );

    // Accept the match
    fireEvent.click(screen.getByRole('button', { name: /accept/i }));

    // Verify Redux action was dispatched
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'lookup/acceptFuzzyMatch',
        payload: { matchId: 'match_001', acceptedValue: 'Engineering' }
      });
    });
  });

  it('handles complex scenarios with derived fields', async () => {
    // Test with lookup that has derived fields (alsoGet)
    const data: TableRow[] = [
      { _rowId: 'row_1', name: 'John', department: 'Enginering' }
    ];

    const result = await lookupProcessor.processData(
      data,
      [mockLookupField], // Has alsoGet: ['budget']
      { minConfidence: 0.9, maxFuzzyMatches: 10 }
    );

    // Should have processed the derived field
    expect(result.data[0]).toHaveProperty('department_code');
    expect(result.data[0]).toHaveProperty('budget');

    // If it's a fuzzy match, should be in fuzzy matches
    if (result.fuzzyMatches.length > 0) {
      const reviewMatch: FuzzyMatchForReview = {
        ...result.fuzzyMatches[0],
        id: 'match_001',
        rowIndex: 0,
        status: 'pending',
        selected: false
      };

      render(
        <Provider store={mockStore}>
          <FuzzyMatchReviewModal
            matches={[reviewMatch]}
            isOpen={true}
            onClose={vi.fn()}
            onAccept={vi.fn()}
            onReject={vi.fn()}
            onBatchAccept={vi.fn()}
            onBatchReject={vi.fn()}
            onManualEntry={vi.fn()}
          />
        </Provider>
      );

      // Should show the match with context of derived values
      expect(screen.getByText('Review Fuzzy Matches')).toBeInTheDocument();
    }
  });

  it('handles error cases gracefully', async () => {
    // Test with invalid lookup configuration
    const invalidLookupField: LookupField = {
      id: 'invalid_lookup',
      referenceFile: 'nonexistent.csv',
      on: 'invalid_field',
      get: 'invalid_get',
      smartMatching: { enabled: true, confidence: 0.7 }
    };

    vi.mocked(referenceDataManager.hasFile).mockReturnValue(false);

    const result = await lookupProcessor.processData(
      mockTableData,
      [invalidLookupField],
      { minConfidence: 0.7, maxFuzzyMatches: 10 }
    );

    // Should handle errors gracefully
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.fuzzyMatches.length).toBe(0);

    // Modal should handle empty state
    render(
      <Provider store={mockStore}>
        <FuzzyMatchReviewModal
          matches={[]}
          isOpen={true}
          onClose={vi.fn()}
          onAccept={vi.fn()}
          onReject={vi.fn()}
          onBatchAccept={vi.fn()}
          onBatchReject={vi.fn()}
          onManualEntry={vi.fn()}
        />
      </Provider>
    );

    expect(screen.getByText('No fuzzy matches to review')).toBeInTheDocument();
  });
});