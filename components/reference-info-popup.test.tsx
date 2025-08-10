import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReferenceInfoPopup } from "./reference-info-popup";
import type { ReferenceDataInfo } from "@/lib/types/reference-data-types";
import type { LookupField } from "@/lib/types/target-shapes";

const mockReferenceInfo: ReferenceDataInfo = {
  id: "ref_departments_123",
  filename: "departments.csv",
  rowCount: 100,
  columns: ["department_name", "department_id", "manager_name", "budget"],
  uploadedAt: "2024-01-01T10:30:00.000Z",
  lastModified: "2024-01-02T15:45:00.000Z",
  fileSize: 2048,
  format: "csv",
  metadata: {
    mimeType: "text/csv",
    delimiter: ",",
    hasHeaders: true,
    encoding: "utf-8",
  },
};

const mockReferenceData = [
  {
    department_name: "Engineering",
    department_id: "ENG",
    manager_name: "John Smith",
    budget: 1000000,
  },
  {
    department_name: "Marketing",
    department_id: "MKT",
    manager_name: "Jane Doe",
    budget: 500000,
  },
  {
    department_name: "Sales",
    department_id: "SAL",
    manager_name: "Bob Johnson",
    budget: 750000,
  },
  {
    department_name: "Human Resources",
    department_id: "HR",
    manager_name: "Alice Brown",
    budget: 300000,
  },
  {
    department_name: "Finance",
    department_id: "FIN",
    manager_name: "Charlie Wilson",
    budget: 400000,
  },
];

const mockLookupField: LookupField = {
  id: "department",
  name: "department",
  displayName: "Department",
  type: "lookup",
  required: false,
  referenceFile: "ref_departments_123",
  match: {
    on: "department_name",
    get: "department_id",
  },
  alsoGet: [
    {
      name: "manager",
      source: "manager_name",
    },
    {
      name: "department_budget",
      source: "budget",
    },
  ],
  smartMatching: {
    enabled: true,
    threshold: 0.85,
  },
  onMismatch: "warning",
  showReferenceInfo: true,
  allowReferenceEdit: true,
  order: 0,
};

const defaultProps = {
  referenceInfo: mockReferenceInfo,
  referenceData: mockReferenceData,
  lookupField: mockLookupField,
};

describe("ReferenceInfoPopup", () => {
  const renderComponent = (props = {}) => {
    return render(<ReferenceInfoPopup {...defaultProps} {...props} />);
  };

  describe("Trigger Button", () => {
    it("renders info button with proper accessibility attributes", () => {
      renderComponent();

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute(
        "aria-label",
        "View reference data information"
      );
      expect(trigger).toHaveAttribute(
        "title",
        "View reference data information"
      );
    });

    it("opens popup when clicked", async () => {
      renderComponent();

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Reference Data")).toBeInTheDocument();
        expect(screen.getByText("departments.csv")).toBeInTheDocument();
      });
    });
  });

  describe("Popup Content", () => {
    beforeEach(async () => {
      renderComponent();
      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByText("Reference Data")).toBeInTheDocument();
      });
    });

    it("displays file information correctly", () => {
      expect(screen.getByText("Reference Data")).toBeInTheDocument();
      expect(screen.getByText("departments.csv")).toBeInTheDocument();
    });

    it("shows statistics section with correct values", () => {
      expect(screen.getByText("Statistics")).toBeInTheDocument();
      expect(screen.getByText("Total rows:")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("Unique values:")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument(); // 5 unique departments
      expect(screen.getByText("Columns:")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument(); // 4 columns
      expect(screen.getByText("File size:")).toBeInTheDocument();
      expect(screen.getByText("2 KB")).toBeInTheDocument();
    });

    it("displays lookup configuration correctly", () => {
      expect(screen.getByText("Lookup Configuration")).toBeInTheDocument();
      expect(screen.getByText("Match column:")).toBeInTheDocument();
      expect(screen.getByText("department_name")).toBeInTheDocument();
      expect(screen.getByText("Return column:")).toBeInTheDocument();
      expect(screen.getByText("department_id")).toBeInTheDocument();
      expect(screen.getByText("Derived fields:")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // 2 derived fields
      expect(screen.getByText("Fuzzy matching:")).toBeInTheDocument();
      expect(screen.getByText("Enabled")).toBeInTheDocument();
      expect(screen.getByText("Threshold:")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("shows sample values section", () => {
      expect(screen.getByText("Sample Values")).toBeInTheDocument();
      expect(screen.getByText("Engineering")).toBeInTheDocument();
      expect(screen.getByText("Marketing")).toBeInTheDocument();
      expect(screen.getByText("Sales")).toBeInTheDocument();
      expect(screen.getByText("Human Resources")).toBeInTheDocument();
      expect(screen.getByText("Finance")).toBeInTheDocument();
    });

    it("displays file information section", () => {
      expect(screen.getByText("File Information")).toBeInTheDocument();
      expect(screen.getByText("Format:")).toBeInTheDocument();
      // Look for CSV in a badge (exact match)
      const csvBadges = screen.getAllByText(/csv/i);
      expect(csvBadges.length).toBeGreaterThan(0);
      expect(screen.getByText("Uploaded:")).toBeInTheDocument();
      expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
      expect(screen.getByText("Modified:")).toBeInTheDocument();
      expect(screen.getByText(/Jan 2, 2024/)).toBeInTheDocument();
    });
  });

  describe("Sample Values Display", () => {
    it("truncates long values with ellipsis", async () => {
      const longValueData = [
        {
          department_name:
            "This is a very long department name that should be truncated",
          department_id: "LONG",
        },
      ];

      renderComponent({ referenceData: longValueData });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/This is a very long.../)).toBeInTheDocument();
      });
    });

    it('shows "more" indicator when there are more values than displayed', async () => {
      const manyValuesData = Array.from({ length: 10 }, (_, i) => ({
        department_name: `Department ${i + 1}`,
        department_id: `DEPT${i + 1}`,
      }));

      renderComponent({ referenceData: manyValuesData });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("+5 more")).toBeInTheDocument();
      });
    });
  });

  describe("Action Buttons", () => {
    it("shows View Data button when onReferenceView is provided", async () => {
      const mockOnReferenceView = vi.fn();

      renderComponent({ onReferenceView: mockOnReferenceView });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      const viewButton = await screen.findByRole("button", {
        name: /view data/i,
      });
      expect(viewButton).toBeInTheDocument();

      fireEvent.click(viewButton);
      expect(mockOnReferenceView).toHaveBeenCalledWith("ref_departments_123");
    });

    it("shows Edit Values button when allowReferenceEdit is true and onReferenceEdit is provided", async () => {
      const mockOnReferenceEdit = vi.fn();

      renderComponent({ onReferenceEdit: mockOnReferenceEdit });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      const editButton = await screen.findByRole("button", {
        name: /edit values/i,
      });
      expect(editButton).toBeInTheDocument();

      fireEvent.click(editButton);
      expect(mockOnReferenceEdit).toHaveBeenCalledWith("ref_departments_123");
    });

    it("does not show Edit Values button when allowReferenceEdit is false", async () => {
      const mockOnReferenceEdit = vi.fn();

      const lookupFieldNoEdit = {
        ...mockLookupField,
        allowReferenceEdit: false,
      };
      renderComponent({
        lookupField: lookupFieldNoEdit,
        onReferenceEdit: mockOnReferenceEdit,
      });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /edit values/i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("File Size Formatting", () => {
    it("formats file sizes correctly", async () => {
      const testCases = [
        { size: 0, expected: "0 B" },
        { size: 500, expected: "500 B" },
        { size: 1024, expected: "1 KB" },
        { size: 1536, expected: "1.5 KB" },
        { size: 1048576, expected: "1 MB" },
        { size: 1073741824, expected: "1 GB" },
      ];

      for (const testCase of testCases) {
        const infoWithSize = { ...mockReferenceInfo, fileSize: testCase.size };

        const { unmount } = renderComponent({ referenceInfo: infoWithSize });

        const trigger = screen.getByRole("button", {
          name: /view reference data information/i,
        });
        fireEvent.click(trigger);

        await waitFor(() => {
          expect(screen.getByText(testCase.expected)).toBeInTheDocument();
        });

        unmount(); // Clean up between iterations
      }
    });
  });

  describe("Missing Data Handling", () => {
    it("handles missing reference info gracefully", async () => {
      renderComponent({ referenceInfo: undefined });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      expect(screen.getByText("ref_departments_123")).toBeInTheDocument(); // Falls back to referenceFile
    });

    it("handles empty reference data", async () => {
      renderComponent({ referenceData: [] });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      expect(screen.getByText("0")).toBeInTheDocument(); // Unique values count
      expect(screen.queryByText("Sample Values")).not.toBeInTheDocument();
    });

    it("handles fuzzy matching disabled", async () => {
      const lookupFieldNoFuzzy = {
        ...mockLookupField,
        smartMatching: { enabled: false, threshold: 0.8 },
      };

      renderComponent({ lookupField: lookupFieldNoFuzzy });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      expect(screen.getByText("Disabled")).toBeInTheDocument();
      expect(screen.queryByText("Threshold:")).not.toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("formats dates correctly", async () => {
      renderComponent();

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      // Check that dates are formatted in a readable way
      expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 2, 2024/)).toBeInTheDocument();
    });

    it("handles invalid dates gracefully", async () => {
      const infoWithBadDate = {
        ...mockReferenceInfo,
        uploadedAt: "invalid-date",
        lastModified: "invalid-date-2", // Make them different so both sections render
      };

      renderComponent({ referenceInfo: infoWithBadDate });

      const trigger = screen.getByRole("button", {
        name: /view reference data information/i,
      });
      fireEvent.click(trigger);

      await waitFor(() => {
        // Either the original invalid string should be shown, or "Invalid Date"
        const hasInvalidDate =
          screen.queryByText("invalid-date") ||
          screen.queryByText(/invalid date/i);
        expect(hasInvalidDate).toBeInTheDocument();
      });
    });
  });
});
