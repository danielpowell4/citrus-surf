import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReferenceUploadDialog } from './reference-upload-dialog';
import { referenceDataManager } from '@/lib/utils/reference-data-manager';
import type { ReferenceDataInfo, ValidationResult } from '@/lib/types/reference-data-types';

// Mock the reference data manager
vi.mock('@/lib/utils/reference-data-manager');

const mockReferenceDataManager = referenceDataManager as any;

describe('ReferenceUploadDialog', () => {
  const mockValidationResult: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

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

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    mockReferenceDataManager.uploadReferenceFile.mockResolvedValue(mockReferenceInfo);
  });

  it('renders upload dialog', () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    expect(screen.getByText('Upload Reference Data')).toBeInTheDocument();
    expect(screen.getByText('Upload a CSV or JSON file to use as reference data for lookups.')).toBeInTheDocument();
  });

  it('renders replace dialog when in replace mode', () => {
    const existingInfo: ReferenceDataInfo = {
      ...mockReferenceInfo,
      filename: 'existing-data.csv',
    };

    render(
      <ReferenceUploadDialog 
        {...defaultProps} 
        mode="replace" 
        existingReferenceInfo={existingInfo}
      />
    );
    
    expect(screen.getByText('Replace Reference Data')).toBeInTheDocument();
    expect(screen.getByText('Replacing: existing-data.csv')).toBeInTheDocument();
  });

  it('shows file drop zone', () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supports CSV and JSON files up to 10MB')).toBeInTheDocument();
  });

  it('shows custom ID input in upload mode', () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    expect(screen.getByLabelText('Reference ID (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Auto-generated if empty')).toBeInTheDocument();
  });

  it('does not show custom ID input in replace mode', () => {
    render(<ReferenceUploadDialog {...defaultProps} mode="replace" />);
    
    expect(screen.queryByLabelText('Reference ID (optional)')).not.toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(mockReferenceDataManager.validateReferenceData).toHaveBeenCalledWith(file);
    });
  });

  it('handles file selection via drag and drop', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const dropZone = screen.getByText('Drop your file here or click to browse').closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
      },
    });
    
    fireEvent(dropZone!, dropEvent);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
  });

  it('auto-generates custom ID from filename', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test-data.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      const customIdInput = screen.getByLabelText('Reference ID (optional)') as HTMLInputElement;
      expect(customIdInput.value).toBe('test-data');
    });
  });

  it('displays file validation success', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('File validation passed')).toBeInTheDocument();
    });
  });

  it('displays file validation errors', async () => {
    const errorValidation: ValidationResult = {
      valid: false,
      errors: ['Invalid CSV format', 'Missing required columns'],
      warnings: [],
    };
    
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(errorValidation);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['invalid data'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('File validation failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid CSV format')).toBeInTheDocument();
      expect(screen.getByText('Missing required columns')).toBeInTheDocument();
    });
  });

  it('displays file validation warnings', async () => {
    const warningValidation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: ['Some rows have empty values'],
    };
    
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(warningValidation);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test\n2,'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('File validation passed')).toBeInTheDocument();
      expect(screen.getByText('Some rows have empty values')).toBeInTheDocument();
    });
  });

  it('shows data preview for valid files', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name,category\n1,Test Item,A\n2,Another Item,B'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('Data Preview')).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('Another Item')).toBeInTheDocument();
    });
  });

  it('enables upload button only when file is valid', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    // Initially disabled
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload/i })).not.toBeDisabled();
    });
  });

  it('disables upload button when validation fails', async () => {
    const errorValidation: ValidationResult = {
      valid: false,
      errors: ['Invalid file'],
      warnings: [],
    };
    
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(errorValidation);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['invalid'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
    });
  });

  it('shows upload progress during upload', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
  });

  it('calls onSuccess after successful upload', async () => {
    const onSuccess = vi.fn();
    render(<ReferenceUploadDialog {...defaultProps} onSuccess={onSuccess} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);
    });
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockReferenceInfo);
    }, { timeout: 2000 });
  });

  it('calls onError when upload fails', async () => {
    const onError = vi.fn();
    mockReferenceDataManager.uploadReferenceFile.mockRejectedValue(new Error('Upload failed'));
    
    render(<ReferenceUploadDialog {...defaultProps} onError={onError} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);
    });
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Upload failed');
    });
  });

  it('allows removing selected file', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
      expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ReferenceUploadDialog {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });
});