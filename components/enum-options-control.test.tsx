import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EnumOptionsControl, type EnumConfiguration } from "./enum-options-control";

describe("EnumOptionsControl", () => {
  const mockOnUpdate = vi.fn();

  const defaultConfig: EnumConfiguration = {
    required: true,
    unique: false,
    options: [],
  };

  const configWithOptions: EnumConfiguration = {
    required: true,
    unique: true,
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "pending", label: "Pending Review" },
    ],
  };

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  describe("Configuration Toggles", () => {
    it("should render required and unique toggles", () => {
      render(
        <EnumOptionsControl
          configuration={defaultConfig}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByLabelText("Required")).toBeInTheDocument();
      expect(screen.getByLabelText("Unique values only")).toBeInTheDocument();
    });

    it("should call onUpdate when required toggle is changed", () => {
      render(
        <EnumOptionsControl
          configuration={defaultConfig}
          onUpdate={mockOnUpdate}
        />
      );

      const requiredToggle = screen.getByLabelText("Required");
      fireEvent.click(requiredToggle);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...defaultConfig,
        required: false,
      });
    });

    it("should call onUpdate when unique toggle is changed", () => {
      render(
        <EnumOptionsControl
          configuration={defaultConfig}
          onUpdate={mockOnUpdate}
        />
      );

      const uniqueToggle = screen.getByLabelText("Unique values only");
      fireEvent.click(uniqueToggle);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...defaultConfig,
        unique: true,
      });
    });
  });

  describe("Options Display", () => {
    it("should show empty state when no options are configured", () => {
      render(
        <EnumOptionsControl
          configuration={defaultConfig}
          onUpdate={mockOnUpdate}
        />
      );

      expect(
        screen.getByText("No options defined. Add your first option below.")
      ).toBeInTheDocument();
    });

    it("should display existing options with values and labels", () => {
      render(
        <EnumOptionsControl
          configuration={configWithOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByDisplayValue("active")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Active")).toBeInTheDocument();
      expect(screen.getByDisplayValue("inactive")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Inactive")).toBeInTheDocument();
      expect(screen.getByDisplayValue("pending")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Pending Review")).toBeInTheDocument();
    });

    it("should show summary badges for options, required, and unique", () => {
      render(
        <EnumOptionsControl
          configuration={configWithOptions}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("3 options")).toBeInTheDocument();
      // Check for Required badge specifically (not the toggle label)
      const badges = screen.getAllByText("Required");
      expect(badges.length).toBeGreaterThan(0);
      expect(screen.getByText("Unique")).toBeInTheDocument();
    });
  });

  describe("Adding Options", () => {
    it("should add a new option when the add button is clicked", () => {
      render(
        <EnumOptionsControl
          configuration={defaultConfig}
          onUpdate={mockOnUpdate}
        />
      );

      const valueInput = screen.getByPlaceholderText("Value*");
      const labelInput = screen.getByPlaceholderText("Label");
      const addButton = screen.getByTitle("Add option");

      fireEvent.change(valueInput, { target: { value: "new_value" } });
      fireEvent.change(labelInput, { target: { value: "New Value" } });
      fireEvent.click(addButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...defaultConfig,
        options: [{ value: "new_value", label: "New Value" }],
      });
    });

    it("should use value as label when label is empty", () => {
      render(
        <EnumOptionsControl
          configuration={defaultConfig}
          onUpdate={mockOnUpdate}
        />
      );

      const valueInput = screen.getByPlaceholderText("Value*");
      const addButton = screen.getByTitle("Add option");

      fireEvent.change(valueInput, { target: { value: "test_value" } });
      fireEvent.click(addButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...defaultConfig,
        options: [{ value: "test_value", label: "test_value" }],
      });
    });

    it("should add option when Enter is pressed in value input", () => {
      render(
        <EnumOptionsControl
          configuration={defaultConfig}
          onUpdate={mockOnUpdate}
        />
      );

      const valueInput = screen.getByPlaceholderText("Value*");
      fireEvent.change(valueInput, { target: { value: "enter_test" } });
      fireEvent.keyDown(valueInput, { key: "Enter", code: "Enter" });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...defaultConfig,
        options: [{ value: "enter_test", label: "enter_test" }],
      });
    });

    it("should not add option with empty value", () => {
      render(
        <EnumOptionsControl
          configuration={defaultConfig}
          onUpdate={mockOnUpdate}
        />
      );

      const addButton = screen.getByTitle("Add option");
      expect(addButton).toBeDisabled();

      fireEvent.click(addButton);
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should not add duplicate values", () => {
      render(
        <EnumOptionsControl
          configuration={configWithOptions}
          onUpdate={mockOnUpdate}
        />
      );

      // Get all Value* inputs and take the last one (which is the "add new" input)
      const valueInputs = screen.getAllByPlaceholderText("Value*");
      const addNewValueInput = valueInputs[valueInputs.length - 1];
      const addButton = screen.getByTitle("Add option");

      fireEvent.change(addNewValueInput, { target: { value: "active" } }); // Duplicate value
      expect(addButton).toBeDisabled();
      expect(screen.getByText("Value already exists")).toBeInTheDocument();

      fireEvent.click(addButton);
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Removing Options", () => {
    it("should remove an option when the remove button is clicked", () => {
      render(
        <EnumOptionsControl
          configuration={configWithOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const removeButtons = screen.getAllByTitle("Remove option");
      fireEvent.click(removeButtons[0]); // Remove first option

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...configWithOptions,
        options: [
          { value: "inactive", label: "Inactive" },
          { value: "pending", label: "Pending Review" },
        ],
      });
    });
  });

  describe("Editing Options", () => {
    it("should update option value when changed", () => {
      render(
        <EnumOptionsControl
          configuration={configWithOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const valueInput = screen.getByDisplayValue("active");
      fireEvent.change(valueInput, { target: { value: "enabled" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...configWithOptions,
        options: [
          { value: "enabled", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "pending", label: "Pending Review" },
        ],
      });
    });

    it("should update option label when changed", () => {
      render(
        <EnumOptionsControl
          configuration={configWithOptions}
          onUpdate={mockOnUpdate}
        />
      );

      const labelInput = screen.getByDisplayValue("Active");
      fireEvent.change(labelInput, { target: { value: "Enabled" } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        ...configWithOptions,
        options: [
          { value: "active", label: "Enabled" },
          { value: "inactive", label: "Inactive" },
          { value: "pending", label: "Pending Review" },
        ],
      });
    });
  });

  describe("Validation", () => {
    it("should show validation errors for duplicate values", () => {
      const configWithDuplicates: EnumConfiguration = {
        required: true,
        unique: false,
        options: [
          { value: "active", label: "Active" },
          { value: "active", label: "Active Again" },
          { value: "inactive", label: "Inactive" },
        ],
      };

      render(
        <EnumOptionsControl
          configuration={configWithDuplicates}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Validation Issues")).toBeInTheDocument();
      expect(screen.getByText("• Duplicate values: active")).toBeInTheDocument();
    });

    it("should show validation errors for empty values", () => {
      const configWithEmptyValues: EnumConfiguration = {
        required: true,
        unique: false,
        options: [
          { value: "", label: "Empty Value" },
          { value: "active", label: "Active" },
          { value: "  ", label: "Whitespace Value" },
        ],
      };

      render(
        <EnumOptionsControl
          configuration={configWithEmptyValues}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Validation Issues")).toBeInTheDocument();
      expect(
        screen.getByText("• 2 option(s) have empty values")
      ).toBeInTheDocument();
    });

    it("should highlight duplicate value inputs with error styling", () => {
      const configWithDuplicates: EnumConfiguration = {
        required: true,
        unique: false,
        options: [
          { value: "active", label: "Active" },
          { value: "active", label: "Active Again" },
        ],
      };

      render(
        <EnumOptionsControl
          configuration={configWithDuplicates}
          onUpdate={mockOnUpdate}
        />
      );

      const duplicateInputs = screen.getAllByDisplayValue("active");
      duplicateInputs.forEach(input => {
        expect(input).toHaveClass("border-destructive");
      });

      expect(screen.getAllByText("Duplicate value")).toHaveLength(2);
    });
  });
});