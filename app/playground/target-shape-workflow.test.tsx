import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { makeStore } from '@/lib/store';
import { TargetShapeWorkflow } from './target-shape-workflow';
import type { TargetShape, LookupField } from '@/lib/types/target-shapes';

// Mock the reference data manager
vi.mock('@/lib/utils/reference-data-manager', () => ({
  referenceDataManager: {
    uploadReferenceFile: vi.fn(),
    listReferenceFiles: vi.fn(),
    getReferenceDataRows: vi.fn(),
  }
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('TargetShapeWorkflow - Lookup Field Integration', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  const mockReferenceFile = {
    id: 'ref_test_123',
    filename: 'departments.csv',
    rowCount: 5,
    columns: ['id', 'name', 'manager'],
    uploadedAt: '2023-01-01T00:00:00Z',
    lastModified: '2023-01-01T00:00:00Z',
    fileSize: 1024,
    format: 'csv' as const,
  };

  it('should add lookup field type to dropdown', async () => {
    renderWithProvider(<TargetShapeWorkflow />);

    // Navigate to fields step
    fireEvent.click(screen.getByText('Next: Define Fields'));

    // Add a field
    fireEvent.click(screen.getByText('Add Field'));

    // Check if lookup is in the field types
    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);

    expect(screen.getByText('Lookup')).toBeInTheDocument();
  });

  it('should initialize lookup field properties when type changes to lookup', async () => {
    renderWithProvider(<TargetShapeWorkflow />);

    // Navigate to fields step
    fireEvent.click(screen.getByText('Next: Define Fields'));

    // Add a field
    fireEvent.click(screen.getByText('Add Field'));

    // Set field name
    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    // Change type to lookup
    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Check if lookup configuration appears
    await waitFor(() => {
      expect(screen.getByText('Lookup Configuration')).toBeInTheDocument();
    });
  });

  it('should display reference file selection dropdown', async () => {
    // Add mock reference files to store
    store.dispatch({
      type: 'referenceData/uploadFileSuccess',
      payload: { info: mockReferenceFile }
    });

    renderWithProvider(<TargetShapeWorkflow />);

    // Navigate to fields step and add lookup field
    fireEvent.click(screen.getByText('Next: Define Fields'));
    fireEvent.click(screen.getByText('Add Field'));

    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Check reference file dropdown
    await waitFor(() => {
      const referenceButton = screen.getByText('Select reference file');
      fireEvent.click(referenceButton);
      expect(screen.getByText('departments.csv')).toBeInTheDocument();
    });
  });

  it('should handle reference file upload', async () => {
    const mockFile = new File(['id,name\n1,Sales'], 'test.csv', { type: 'text/csv' });
    
    const { referenceDataManager } = await import('@/lib/utils/reference-data-manager');
    vi.mocked(referenceDataManager.uploadReferenceFile).mockResolvedValue(mockReferenceFile);

    renderWithProvider(<TargetShapeWorkflow />);

    // Navigate to fields step and add lookup field
    fireEvent.click(screen.getByText('Next: Define Fields'));
    fireEvent.click(screen.getByText('Add Field'));

    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Find and click upload button
    await waitFor(() => {
      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);
    });

    // Simulate file input change
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(referenceDataManager.uploadReferenceFile).toHaveBeenCalledWith(
        mockFile,
        expect.stringMatching(/^ref_test_/)
      );
    });
  });

  it('should configure lookup match settings', async () => {
    store.dispatch({
      type: 'referenceData/uploadFileSuccess',
      payload: { info: mockReferenceFile }
    });

    renderWithProvider(<TargetShapeWorkflow />);

    // Navigate to fields step and add lookup field
    fireEvent.click(screen.getByText('Next: Define Fields'));
    fireEvent.click(screen.getByText('Add Field'));

    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Select reference file
    await waitFor(() => {
      const referenceButton = screen.getByText('Select reference file');
      fireEvent.click(referenceButton);
      fireEvent.click(screen.getByText('departments.csv'));
    });

    // Check match configuration appears
    await waitFor(() => {
      expect(screen.getByText('Match On Column')).toBeInTheDocument();
      expect(screen.getByText('Return Column')).toBeInTheDocument();
    });

    // Test column selection
    const matchOnButton = screen.getByText('Select column');
    fireEvent.click(matchOnButton);
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('should handle smart matching configuration', async () => {
    store.dispatch({
      type: 'referenceData/uploadFileSuccess',
      payload: { info: mockReferenceFile }
    });

    renderWithProvider(<TargetShapeWorkflow />);

    // Setup lookup field
    fireEvent.click(screen.getByText('Next: Define Fields'));
    fireEvent.click(screen.getByText('Add Field'));

    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Select reference file
    await waitFor(() => {
      const referenceButton = screen.getByText('Select reference file');
      fireEvent.click(referenceButton);
      fireEvent.click(screen.getByText('departments.csv'));
    });

    // Enable fuzzy matching
    await waitFor(() => {
      const fuzzySwitch = screen.getByLabelText('Enable fuzzy matching');
      fireEvent.click(fuzzySwitch);
      expect(screen.getByText(/Confidence Threshold:/)).toBeInTheDocument();
    });
  });

  it('should show lookup field details in review step', async () => {
    const initialShape: TargetShape = {
      id: 'test-shape',
      name: 'Test Shape',
      description: 'Test description',
      version: '1.0.0',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      fields: [
        {
          id: 'field-1',
          name: 'department',
          type: 'lookup',
          required: false,
          referenceFile: mockReferenceFile.id,
          match: { on: 'name', get: 'id' },
          smartMatching: { enabled: true, confidence: 0.8 },
          onMismatch: 'error',
          alsoGet: [{ name: 'manager_name', source: 'manager' }],
        } as LookupField
      ],
    };

    store.dispatch({
      type: 'referenceData/uploadFileSuccess',
      payload: { info: mockReferenceFile }
    });

    renderWithProvider(<TargetShapeWorkflow initialShape={initialShape} />);

    // Navigate to review step
    fireEvent.click(screen.getByText('Next: Define Fields'));
    fireEvent.click(screen.getByText('Next: Review & Save'));

    // Check lookup field details are shown
    await waitFor(() => {
      expect(screen.getByText('department')).toBeInTheDocument();
      expect(screen.getByText('lookup • Required')).toBeInTheDocument();
      expect(screen.getByText('departments.csv')).toBeInTheDocument();
      expect(screen.getByText('name → id')).toBeInTheDocument();
      expect(screen.getByText('80% confidence')).toBeInTheDocument();
      expect(screen.getByText('manager_name')).toBeInTheDocument();
    });
  });

  it('should handle derived fields configuration', async () => {
    store.dispatch({
      type: 'referenceData/uploadFileSuccess',
      payload: { info: mockReferenceFile }
    });

    renderWithProvider(<TargetShapeWorkflow />);

    // Setup lookup field
    fireEvent.click(screen.getByText('Next: Define Fields'));
    fireEvent.click(screen.getByText('Add Field'));

    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Select reference file
    await waitFor(() => {
      const referenceButton = screen.getByText('Select reference file');
      fireEvent.click(referenceButton);
      fireEvent.click(screen.getByText('departments.csv'));
    });

    // Add derived field
    await waitFor(() => {
      const addColumnButton = screen.getByText('Add Column');
      fireEvent.click(addColumnButton);
    });

    // Check derived field inputs appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument();
      expect(screen.getByText('Select source')).toBeInTheDocument();
    });
  });
});