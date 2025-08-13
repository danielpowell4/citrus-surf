import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReferenceDataEditor } from "./reference-data-editor";
import type { ReferenceDataInfo } from "@/lib/types/reference-data-types";

describe("ReferenceDataEditor", () => {
  const mockReferenceInfo: ReferenceDataInfo = {
    id: "test-ref",
    filename: "test-data.csv",
    format: "csv",
    columns: ["id", "name", "category"],
    rowCount: 3,
    fileSize: 1024,
    uploadedAt: "2024-01-01T00:00:00Z",
    lastModified: "2024-01-01T00:00:00Z",
  };

  const mockData = [
    { id: "1", name: "Item 1", category: "A" },
    { id: "2", name: "Item 2", category: "B" },
    { id: "3", name: "Item 3", category: "A" },
  ];

  const defaultProps = {
    referenceId: "test-ref",
    data: mockData,
    referenceInfo: mockReferenceInfo,
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders reference data editor modal", () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    expect(screen.getByText("Edit Reference Data")).toBeInTheDocument();
    expect(screen.getByText("test-data.csv")).toBeInTheDocument();
    expect(screen.getByText("3 active rows")).toBeInTheDocument();
  });

  it("displays data in editable table format", () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("category")).toBeInTheDocument();

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("shows key column indicator", () => {
    render(<ReferenceDataEditor {...defaultProps} keyColumn="id" />);

    expect(screen.getByText("(key)")).toBeInTheDocument();
  });

  it("allows adding new rows", async () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add row/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("4 active rows")).toBeInTheDocument();
    });
  });

  it("allows deleting rows", async () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons.find(button =>
      button.innerHTML.includes("Trash2")
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("2 active rows")).toBeInTheDocument();
        expect(screen.getByText("1 deleted rows")).toBeInTheDocument();
      });
    }
  });

  it("allows undoing row deletion", async () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    // First delete a row
    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons.find(button =>
      button.innerHTML.includes("Trash2")
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("1 deleted rows")).toBeInTheDocument();
      });

      // Then undo the deletion
      const undoButton = screen.getByRole("button", { name: /undo/i });
      fireEvent.click(undoButton);

      await waitFor(() => {
        expect(screen.getByText("3 active rows")).toBeInTheDocument();
        expect(screen.queryByText("deleted rows")).not.toBeInTheDocument();
      });
    }
  });

  it("enables cell editing on click", async () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    const cellElement = screen.getByText("Item 1");
    fireEvent.click(cellElement);

    await waitFor(() => {
      const input = screen.getByDisplayValue("Item 1");
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });
  });

  it("saves cell changes on blur", async () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    const cellElement = screen.getByText("Item 1");
    fireEvent.click(cellElement);

    await waitFor(() => {
      const input = screen.getByDisplayValue("Item 1");
      fireEvent.change(input, { target: { value: "Updated Item 1" } });
      fireEvent.blur(input);
    });

    await waitFor(() => {
      expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
    });
  });

  it("saves cell changes on Enter key", async () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    const cellElement = screen.getByText("Item 1");
    fireEvent.click(cellElement);

    await waitFor(() => {
      const input = screen.getByDisplayValue("Item 1");
      fireEvent.change(input, { target: { value: "Updated Item 1" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });

    await waitFor(() => {
      expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
    });
  });

  it("cancels cell editing on Escape key", async () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    const cellElement = screen.getByText("Item 1");
    fireEvent.click(cellElement);

    await waitFor(() => {
      const input = screen.getByDisplayValue("Item 1");
      fireEvent.change(input, { target: { value: "Updated Item 1" } });
      fireEvent.keyDown(input, { key: "Escape" });
    });

    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.queryByText("Unsaved Changes")).not.toBeInTheDocument();
    });
  });

  it("validates duplicate key values", async () => {
    render(<ReferenceDataEditor {...defaultProps} keyColumn="id" />);

    // Click on the second row's ID cell and change it to duplicate the first row's ID
    const cellElements = screen.getAllByText(/^[123]$/);
    const secondIdCell = cellElements[1]; // Should be "2"
    fireEvent.click(secondIdCell);

    await waitFor(() => {
      const input = screen.getByDisplayValue("2");
      fireEvent.change(input, { target: { value: "1" } });
      fireEvent.blur(input);
    });

    await waitFor(() => {
      expect(screen.getByText("Validation Errors:")).toBeInTheDocument();
      expect(screen.getByText(/duplicate key/i)).toBeInTheDocument();
    });
  });

  it("validates required key column values", async () => {
    render(<ReferenceDataEditor {...defaultProps} keyColumn="id" />);

    // Clear the first row's ID
    const cellElements = screen.getAllByText(/^[123]$/);
    const firstIdCell = cellElements[0]; // Should be "1"
    fireEvent.click(firstIdCell);

    await waitFor(() => {
      const input = screen.getByDisplayValue("1");
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.blur(input);
    });

    await waitFor(() => {
      expect(screen.getByText("Validation Errors:")).toBeInTheDocument();
      expect(
        screen.getByText(/key column cannot be empty/i)
      ).toBeInTheDocument();
    });
  });

  it("disables save button when validation errors exist", async () => {
    render(<ReferenceDataEditor {...defaultProps} keyColumn="id" />);

    // Create a validation error by clearing the key column
    const cellElements = screen.getAllByText(/^[123]$/);
    const firstIdCell = cellElements[0];
    fireEvent.click(firstIdCell);

    await waitFor(() => {
      const input = screen.getByDisplayValue("1");
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.blur(input);
    });

    await waitFor(() => {
      const saveButton = screen.getByRole("button", {
        name: /fix errors first/i,
      });
      expect(saveButton).toBeDisabled();
    });
  });

  it("enables save button when no validation errors exist", () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("provides search functionality", () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search all columns...");
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Item 1" } });
    expect(searchInput).toHaveValue("Item 1");
  });

  it("shows row count and editing instructions", () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    expect(
      screen.getByText("3 rows • Click any cell to edit")
    ).toBeInTheDocument();
  });

  it("calls onSave when save button is clicked without validation errors", async () => {
    const onSave = vi.fn();
    render(<ReferenceDataEditor {...defaultProps} onSave={onSave} />);

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mockData);
    });
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<ReferenceDataEditor {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("shows confirmation dialog when canceling with unsaved changes", async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onCancel = vi.fn();

    render(<ReferenceDataEditor {...defaultProps} onCancel={onCancel} />);

    // Make a change to create unsaved changes
    const cellElement = screen.getByText("Item 1");
    fireEvent.click(cellElement);

    await waitFor(() => {
      const input = screen.getByDisplayValue("Item 1");
      fireEvent.change(input, { target: { value: "Updated Item 1" } });
      fireEvent.blur(input);
    });

    await waitFor(() => {
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        "You have unsaved changes. Are you sure you want to cancel?"
      );
      expect(onCancel).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it("displays unsaved changes indicator", async () => {
    render(<ReferenceDataEditor {...defaultProps} />);

    expect(screen.getByText("No changes made")).toBeInTheDocument();

    // Make a change
    const cellElement = screen.getByText("Item 1");
    fireEvent.click(cellElement);

    await waitFor(() => {
      const input = screen.getByDisplayValue("Item 1");
      fireEvent.change(input, { target: { value: "Updated Item 1" } });
      fireEvent.blur(input);
    });

    await waitFor(() => {
      expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();
      expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
    });
  });
});
