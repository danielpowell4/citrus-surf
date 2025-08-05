import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReferenceDataViewer } from './reference-data-viewer';
import { referenceDataManager } from '@/lib/utils/reference-data-manager';
import { targetShapesStorage } from '@/lib/utils/target-shapes-storage';
import type { ReferenceDataInfo } from '@/lib/types/reference-data-types';
import type { TargetShape } from '@/lib/types/target-shapes';

// Mock the modules
vi.mock('@/lib/utils/reference-data-manager');
vi.mock('@/lib/utils/target-shapes-storage');

const mockReferenceDataManager = referenceDataManager as any;
const mockTargetShapesStorage = targetShapesStorage as any;

describe('ReferenceDataViewer', () => {
  const mockReferenceInfo: ReferenceDataInfo = {
    id: 'test-ref',
    filename: 'test-data.csv',
    format: 'csv',
    columns: ['id', 'name', 'category'],
    rowCount: 3,
    fileSize: 1024,
    uploadedAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  };

  const mockReferenceData = [
    { id: '1', name: 'Item 1', category: 'A' },
    { id: '2', name: 'Item 2', category: 'B' },
    { id: '3', name: 'Item 3', category: 'A' },
  ];

  const mockTargetShape: TargetShape = {
    id: 'shape-1',
    name: 'Test Shape',
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    fields: [
      {
        id: 'lookup-field',
        name: 'Test Lookup',
        type: 'lookup',
        required: true,
        referenceFile: 'test-ref',
        match: { on: 'id', get: 'name' },
        smartMatching: { enabled: true, confidence: 0.8 },
        onMismatch: 'warning',
      },
    ],
  };

  const defaultProps = {
    referenceId: 'test-ref',
    isOpen: true,
    onClose: vi.fn(),
    allowEdit: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockReferenceDataManager.getReferenceDataRows.mockReturnValue(mockReferenceData);
    mockReferenceDataManager.getReferenceData.mockReturnValue({
      info: mockReferenceInfo,
    });
    mockTargetShapesStorage.getAll.mockReturnValue([mockTargetShape]);
  });

  it('renders reference data viewer modal', async () => {
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Reference Data Viewer')).toBeInTheDocument();
      expect(screen.getByText('test-data.csv')).toBeInTheDocument();
      expect(screen.getByText('3 rows')).toBeInTheDocument();
      expect(screen.getByText('3 columns')).toBeInTheDocument();
    });
  });

  it('displays reference data in table format', async () => {
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('category')).toBeInTheDocument();
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  it('shows sortable column headers', async () => {
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      const idHeader = screen.getByRole('button', { name: /id/i });
      const nameHeader = screen.getByRole('button', { name: /name/i });
      const categoryHeader = screen.getByRole('button', { name: /category/i });
      
      expect(idHeader).toBeInTheDocument();
      expect(nameHeader).toBeInTheDocument();
      expect(categoryHeader).toBeInTheDocument();
    });
  });

  it('provides search functionality', async () => {
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search all columns...');
      expect(searchInput).toBeInTheDocument();
      
      fireEvent.change(searchInput, { target: { value: 'Item 1' } });
      expect(searchInput).toHaveValue('Item 1');
    });
  });

  it('shows impact analysis for affected lookup fields', async () => {
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/This reference data is used by 1 lookup field/)).toBeInTheDocument();
      expect(screen.getByText(/Test Shape.Test Lookup/)).toBeInTheDocument();
    });
  });

  it('shows edit button when allowEdit is true', async () => {
    render(<ReferenceDataViewer {...defaultProps} allowEdit={true} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit data/i })).toBeInTheDocument();
    });
  });

  it('does not show edit button when allowEdit is false', async () => {
    render(<ReferenceDataViewer {...defaultProps} allowEdit={false} />);
    
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /edit data/i })).not.toBeInTheDocument();
    });
  });

  it('shows download button', async () => {
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<ReferenceDataViewer {...defaultProps} onClose={onClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays error message when reference data not found', async () => {
    mockReferenceDataManager.getReferenceDataRows.mockReturnValue(null);
    mockReferenceDataManager.getReferenceData.mockReturnValue(null);
    
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Reference data not found')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    mockReferenceDataManager.getReferenceDataRows.mockImplementation(() => {
      return new Promise(() => {}); // Never resolves to keep loading state
    });
    
    render(<ReferenceDataViewer {...defaultProps} />);
    
    expect(screen.getByText('Loading reference data...')).toBeInTheDocument();
  });

  it('shows pagination controls', async () => {
    // Create more data to trigger pagination
    const largeDataset = Array.from({ length: 30 }, (_, i) => ({
      id: String(i + 1),
      name: `Item ${i + 1}`,
      category: i % 2 === 0 ? 'A' : 'B',
    }));
    
    mockReferenceDataManager.getReferenceDataRows.mockReturnValue(largeDataset);
    mockReferenceDataManager.getReferenceData.mockReturnValue({
      info: { ...mockReferenceInfo, rowCount: 30 },
    });
    
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
    });
  });

  it('handles CSV download', async () => {
    // Mock URL.createObjectURL and related methods
    global.URL.createObjectURL = vi.fn(() => 'blob-url');
    global.URL.revokeObjectURL = vi.fn();
    
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: { visibility: '' },
    };
    
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    
    render(<ReferenceDataViewer {...defaultProps} />);
    
    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test-data.csv');
      expect(mockLink.click).toHaveBeenCalled();
    });
    
    // Cleanup
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    createElementSpy.mockRestore();
  });
});