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
    
    // Mock File.prototype.text method to return the file content
    global.File.prototype.text = vi.fn().mockImplementation(async function(this: File) {
      // Return content based on file construction for tests
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(this);
      });
    });
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
    // Set up successful validation for this test
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
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
    // Set up successful validation for this test
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    
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
    // Set up successful validation for this test
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test-data.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      const customIdInput = screen.getByLabelText('Reference ID (optional)') as HTMLInputElement;
      expect(customIdInput.value).toBe('test_data');
    });
  });

  it('displays file validation success', async () => {
    // Set up successful validation for this test
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('File validation passed')).toBeInTheDocument();
    });
  });

  it('shows helpful error messages when files are invalid', async () => {
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    // User selects a file with invalid CSV structure (component validates this internally)
    const file = new File(['invalid data'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // User should see clear error feedback about the file structure
    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      // The component's internal validation provides this specific error
      expect(screen.getByTestId('validation-errors')).toHaveTextContent('CSV file must have at least a header row and one data row');
    });
    
    // Upload button should be disabled when validation fails
    expect(screen.getByTestId('upload-button')).toBeDisabled();
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
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
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
    // Set up successful validation for this test
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name,category\n1,Test Item,A\n2,Another Item,B'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
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
    // Set up successful validation for this test
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    // Initially disabled
    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
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
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
    });
  });

  it('shows upload progress to user', async () => {
    // Set up successful validation and slow upload
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    mockReferenceDataManager.uploadReferenceFile.mockImplementation(async () => {
      // Simulate slow upload so we can see progress
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockReferenceInfo;
    });
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    // User selects a file
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Wait for validation
    await waitFor(() => {
      expect(screen.getByTestId('validation-success')).toBeInTheDocument();
    });
    
    // User starts upload
    const uploadButton = screen.getByTestId('upload-button');
    fireEvent.click(uploadButton);
    
    // User should see upload progress
    await waitFor(() => {
      expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
      expect(screen.getByTestId('upload-status')).toHaveTextContent('Uploading...');
    });
  });

  it('completes file upload successfully', async () => {
    // Set up successful validation and upload
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    mockReferenceDataManager.uploadReferenceFile.mockResolvedValue(mockReferenceInfo);
    
    const onSuccess = vi.fn();
    render(<ReferenceUploadDialog {...defaultProps} onSuccess={onSuccess} />);
    
    // User selects a file
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByTestId('validation-success')).toBeInTheDocument();
    });
    
    // User clicks upload
    const uploadButton = screen.getByTestId('upload-button');
    fireEvent.click(uploadButton);
    
    // Verify success callback is called
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockReferenceInfo);
    }, { timeout: 2000 });
  });

  it('provides error feedback when upload fails', async () => {
    // Set up successful validation but failed upload
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    mockReferenceDataManager.uploadReferenceFile.mockRejectedValue(new Error('Network connection failed'));
    
    const onError = vi.fn();
    render(<ReferenceUploadDialog {...defaultProps} onError={onError} />);
    
    // User selects valid file
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Wait for validation success
    await waitFor(() => {
      expect(screen.getByTestId('validation-success')).toBeInTheDocument();
    });
    
    // User attempts upload
    const uploadButton = screen.getByTestId('upload-button');
    fireEvent.click(uploadButton);
    
    // User should receive error feedback
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Network connection failed');
    }, { timeout: 2000 });
  });

  it('allows removing selected file', async () => {
    // Set up successful validation for this test
    mockReferenceDataManager.validateReferenceData.mockResolvedValue(mockValidationResult);
    
    render(<ReferenceUploadDialog {...defaultProps} />);
    
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
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