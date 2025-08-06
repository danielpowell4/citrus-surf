import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MatchComparisonCard } from './match-comparison-card';
import type { FuzzyMatchForReview } from '@/lib/types/fuzzy-match-review';

const mockMatch: FuzzyMatchForReview = {
  id: 'match_001',
  rowId: 'row_1',
  fieldName: 'department',
  inputValue: 'Enginering',
  suggestedValue: 'Engineering',
  confidence: 0.85,
  rowIndex: 0,
  status: 'pending',
  selected: false,
  suggestions: [
    {
      value: 'Engineering',
      confidence: 0.85,
      reason: 'Fuzzy match suggestion',
      metadata: { matchType: 'fuzzy' }
    },
    {
      value: 'Engineering Dept',
      confidence: 0.75,
      reason: 'Alternative match',
      metadata: { matchType: 'fuzzy' }
    }
  ],
  rowContext: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }
};

const mockProps = {
  match: mockMatch,
  onAccept: vi.fn(),
  onReject: vi.fn(),
  onManualEntry: vi.fn(),
};

describe('MatchComparisonCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders match information correctly', () => {
    render(<MatchComparisonCard {...mockProps} />);
    
    // Check basic match information
    expect(screen.getByText('Row 1 • department')).toBeInTheDocument();
    expect(screen.getByText('85% match')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    
    // Check input and suggested values
    expect(screen.getByText('Enginering')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('displays action buttons for pending matches', () => {
    render(<MatchComparisonCard {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manual/i })).toBeInTheDocument();
  });

  it('calls onAccept when accept button is clicked', () => {
    render(<MatchComparisonCard {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    
    expect(mockProps.onAccept).toHaveBeenCalledWith('match_001', 'Engineering');
  });

  it('calls onReject when reject button is clicked', () => {
    render(<MatchComparisonCard {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    
    expect(mockProps.onReject).toHaveBeenCalledWith('match_001');
  });

  it('shows manual entry input when manual button is clicked', () => {
    render(<MatchComparisonCard {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /manual/i }));
    
    expect(screen.getByPlaceholderText('Enter correct value...')).toBeInTheDocument();
    // Check for buttons with check and X icons
    const buttons = screen.getAllByRole('button');
    const hasCheckButton = buttons.some(button => button.querySelector('svg[class*="lucide-check"]'));
    const hasXButton = buttons.some(button => button.querySelector('svg[class*="lucide-x"]'));
    expect(hasCheckButton).toBe(true);
    expect(hasXButton).toBe(true);
  });

  it('handles manual entry submission', async () => {
    render(<MatchComparisonCard {...mockProps} />);
    
    // Click manual button
    fireEvent.click(screen.getByRole('button', { name: /manual/i }));
    
    // Enter manual value
    const input = screen.getByPlaceholderText('Enter correct value...');
    fireEvent.change(input, { target: { value: 'Custom Department' } });
    
    // Submit manual entry (find button with Check icon)
    const buttons = screen.getAllByRole('button');
    const checkButton = buttons.find(button => button.querySelector('svg[class*="lucide-check"]'));
    fireEvent.click(checkButton!);
    
    await waitFor(() => {
      expect(mockProps.onManualEntry).toHaveBeenCalledWith('match_001', 'Custom Department');
    });
  });

  it('handles manual entry with Enter key', async () => {
    render(<MatchComparisonCard {...mockProps} />);
    
    // Click manual button
    fireEvent.click(screen.getByRole('button', { name: /manual/i }));
    
    // Enter manual value and press Enter
    const input = screen.getByPlaceholderText('Enter correct value...');
    fireEvent.change(input, { target: { value: 'Custom Department' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockProps.onManualEntry).toHaveBeenCalledWith('match_001', 'Custom Department');
    });
  });

  it('cancels manual entry with Escape key', async () => {
    render(<MatchComparisonCard {...mockProps} />);
    
    // Click manual button
    fireEvent.click(screen.getByRole('button', { name: /manual/i }));
    
    // Enter manual value and press Escape
    const input = screen.getByPlaceholderText('Enter correct value...');
    fireEvent.change(input, { target: { value: 'Custom Department' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    
    // Manual entry should be hidden
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Enter correct value...')).not.toBeInTheDocument();
    });
  });

  it('shows selection checkbox when in batch mode', () => {
    render(
      <MatchComparisonCard 
        {...mockProps} 
        inBatch={true}
        onSelectionChange={vi.fn()}
      />
    );
    
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('handles selection change in batch mode', () => {
    const onSelectionChange = vi.fn();
    render(
      <MatchComparisonCard 
        {...mockProps} 
        inBatch={true}
        selected={false}
        onSelectionChange={onSelectionChange}
      />
    );
    
    fireEvent.click(screen.getByRole('checkbox'));
    
    expect(onSelectionChange).toHaveBeenCalledWith('match_001', true);
  });

  it('shows accepted match status', () => {
    const acceptedMatch = { ...mockMatch, status: 'accepted' as const };
    render(<MatchComparisonCard {...mockProps} match={acceptedMatch} />);
    
    expect(screen.getByText('accepted')).toHaveBeenCalled;
    expect(screen.getByText('Accepted: Engineering')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
  });

  it('shows rejected match status', () => {
    const rejectedMatch = { ...mockMatch, status: 'rejected' as const };
    render(<MatchComparisonCard {...mockProps} match={rejectedMatch} />);
    
    expect(screen.getByText('rejected')).toBeInTheDocument();
    expect(screen.getByText('Rejected - no match applied')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('shows manual entry status', () => {
    const manualMatch = { 
      ...mockMatch, 
      status: 'manual' as const,
      manualValue: 'Custom Department'
    };
    render(<MatchComparisonCard {...mockProps} match={manualMatch} />);
    
    expect(screen.getByText('manual')).toBeInTheDocument();
    expect(screen.getByText('Manual entry: Custom Department')).toBeInTheDocument();
  });

  it('shows additional details when expanded', () => {
    render(<MatchComparisonCard {...mockProps} showDetails={true} />);
    
    // Click to expand details (find button with chevron icon)
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons.find(button => button.querySelector('svg[class*="lucide-chevron"]'));
    if (expandButton) fireEvent.click(expandButton);
    
    // Check for alternative suggestions
    expect(screen.getByText('Alternative Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Engineering Dept')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    
    // Check for row context
    expect(screen.getByText('Row Context')).toBeInTheDocument();
    expect(screen.getByText('firstName:')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('applies correct confidence color classes', () => {
    // High confidence (>= 0.8)
    const highConfidenceMatch = { ...mockMatch, confidence: 0.9 };
    const { rerender } = render(<MatchComparisonCard {...mockProps} match={highConfidenceMatch} />);
    
    expect(screen.getByText('90% match')).toHaveClass('bg-green-100', 'text-green-800');
    
    // Medium confidence (>= 0.6)
    const mediumConfidenceMatch = { ...mockMatch, confidence: 0.7 };
    rerender(<MatchComparisonCard {...mockProps} match={mediumConfidenceMatch} />);
    
    expect(screen.getByText('70% match')).toHaveClass('bg-yellow-100', 'text-yellow-800');
    
    // Low confidence (< 0.6)
    const lowConfidenceMatch = { ...mockMatch, confidence: 0.5 };
    rerender(<MatchComparisonCard {...mockProps} match={lowConfidenceMatch} />);
    
    expect(screen.getByText('50% match')).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies selection styling when selected', () => {
    render(
      <MatchComparisonCard 
        {...mockProps} 
        selected={true}
        inBatch={true}
        onSelectionChange={vi.fn()}
      />
    );
    
    const card = screen.getByRole('checkbox').closest('.ring-2');
    expect(card).toHaveClass('ring-blue-500');
  });

  it('applies status-specific styling', () => {
    // Accepted status
    const acceptedMatch = { ...mockMatch, status: 'accepted' as const };
    const { rerender } = render(<MatchComparisonCard {...mockProps} match={acceptedMatch} />);
    
    let card = screen.getByText('Accepted: Engineering').closest('.border-green-200');
    expect(card).toHaveClass('bg-green-50/50');
    
    // Rejected status
    const rejectedMatch = { ...mockMatch, status: 'rejected' as const };
    rerender(<MatchComparisonCard {...mockProps} match={rejectedMatch} />);
    
    card = screen.getByText('Rejected - no match applied').closest('.border-red-200');
    expect(card).toHaveClass('bg-red-50/50');
    
    // Manual status
    const manualMatch = { 
      ...mockMatch, 
      status: 'manual' as const,
      manualValue: 'Custom'
    };
    rerender(<MatchComparisonCard {...mockProps} match={manualMatch} />);
    
    card = screen.getByText('Manual entry: Custom').closest('.border-blue-200');
    expect(card).toHaveClass('bg-blue-50/50');
  });
});