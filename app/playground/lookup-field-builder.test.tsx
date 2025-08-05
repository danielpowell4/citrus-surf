import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { makeStore } from '@/lib/store';
import { TargetShapeWorkflow } from './target-shape-workflow';
import type { LookupField } from '@/lib/types/target-shapes';

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the reference data manager
vi.mock('@/lib/utils/reference-data-manager', () => ({
  referenceDataManager: {
    uploadReferenceFile: vi.fn(),
    listReferenceFiles: vi.fn(),
    getReferenceDataRows: vi.fn(),
  }
}));

describe('Lookup Field Builder', () => {
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

  it('should show lookup in field type dropdown', () => {
    renderWithProvider(<TargetShapeWorkflow />);

    // Start with shape name filled
    const nameInput = screen.getByLabelText('Shape Name');
    fireEvent.change(nameInput, { target: { value: 'Test Shape' } });

    // Move to fields step
    fireEvent.click(screen.getByText('Next: Define Fields'));

    // Add a field
    fireEvent.click(screen.getByText('Add Field'));

    // Check if lookup is available in the field types when we edit the field
    const editButton = screen.getByLabelText(/edit/i) || screen.getByText('Edit') || screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Look for field type dropdown
    const typeDropdown = screen.getByText('Select type');
    fireEvent.click(typeDropdown);

    expect(screen.getByText('Lookup')).toBeInTheDocument();
  });

  it('should initialize lookup field properties correctly', () => {
    const initialShape = {
      id: 'test-shape',
      name: 'Test Shape',
      description: 'Test description',
      version: '1.0.0',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      fields: [],
    };

    renderWithProvider(<TargetShapeWorkflow initialShape={initialShape} />);

    // Move to fields step
    fireEvent.click(screen.getByText('Next: Define Fields'));

    // Add a field
    fireEvent.click(screen.getByText('Add Field'));

    // Set field name and type to lookup
    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    // Change type to lookup
    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Check if lookup configuration appears
    expect(screen.getByText('Lookup Configuration')).toBeInTheDocument();
    expect(screen.getByText('Reference Data File')).toBeInTheDocument();
  });

  it('should display reference file selection when reference files exist', () => {
    // Add mock reference files to store
    store.dispatch({
      type: 'referenceData/uploadFileSuccess',
      payload: { info: mockReferenceFile }
    });

    const initialShape = {
      id: 'test-shape',
      name: 'Test Shape',
      description: 'Test description',
      version: '1.0.0',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      fields: [],
    };

    renderWithProvider(<TargetShapeWorkflow initialShape={initialShape} />);

    // Move to fields step
    fireEvent.click(screen.getByText('Next: Define Fields'));

    // Add a field
    fireEvent.click(screen.getByText('Add Field'));

    // Set field name and type to lookup
    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Check reference file dropdown
    const referenceButton = screen.getByText('Select reference file');
    fireEvent.click(referenceButton);
    
    expect(screen.getByText('departments.csv')).toBeInTheDocument();
    expect(screen.getByText(/5 rows, 3 columns/)).toBeInTheDocument();
  });

  it('should show detailed lookup field info in review step', () => {
    // Add mock reference files to store
    store.dispatch({
      type: 'referenceData/uploadFileSuccess',
      payload: { info: mockReferenceFile }
    });

    const lookupField: LookupField = {
      id: 'field-1',
      name: 'department',
      type: 'lookup',
      required: false,
      referenceFile: mockReferenceFile.id,
      match: { on: 'name', get: 'id' },
      smartMatching: { enabled: true, confidence: 0.8 },
      onMismatch: 'error',
      alsoGet: [{ name: 'manager_name', source: 'manager' }],
    };

    const initialShape = {
      id: 'test-shape',
      name: 'Test Shape With Lookup',
      description: 'Test description',
      version: '1.0.0',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      fields: [lookupField],
    };

    renderWithProvider(<TargetShapeWorkflow initialShape={initialShape} />);

    // Navigate to review step
    fireEvent.click(screen.getByText('Next: Define Fields'));
    fireEvent.click(screen.getByText('Next: Review & Save'));

    // Check lookup field details are shown
    expect(screen.getByText('department')).toBeInTheDocument();
    expect(screen.getByText('lookup')).toBeInTheDocument();
    expect(screen.getByText('departments.csv')).toBeInTheDocument();
    expect(screen.getByText('name → id')).toBeInTheDocument();
    expect(screen.getByText('80% confidence')).toBeInTheDocument();
    expect(screen.getByText('manager_name')).toBeInTheDocument();
  });

  it('should handle upload file button', () => {
    const initialShape = {
      id: 'test-shape',
      name: 'Test Shape',
      description: 'Test description',
      version: '1.0.0',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      fields: [],
    };

    renderWithProvider(<TargetShapeWorkflow initialShape={initialShape} />);

    // Move to fields step
    fireEvent.click(screen.getByText('Next: Define Fields'));

    // Add a field
    fireEvent.click(screen.getByText('Add Field'));

    // Set field name and type to lookup
    const nameInput = screen.getByPlaceholderText('e.g., customer_id, email');
    fireEvent.change(nameInput, { target: { value: 'department' } });

    const fieldTypeButton = screen.getByText('Select type');
    fireEvent.click(fieldTypeButton);
    fireEvent.click(screen.getByText('Lookup'));

    // Check upload button is present
    expect(screen.getByText('Upload File')).toBeInTheDocument();

    // Check hidden file input exists
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput?.getAttribute('accept')).toBe('.csv,.json');
  });
});