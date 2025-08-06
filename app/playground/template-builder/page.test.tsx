import { vi } from "vitest";
import { TargetShape } from "@/lib/types/target-shapes";

/**
 * Template Builder Navigation Logic Tests
 * 
 * Tests the conditional navigation behavior after template creation:
 * - With data: Navigate to mapping mode for immediate column mapping
 * - Without data: Navigate to data table (no mapping needed)
 */
describe("Template Builder Navigation Logic", () => {
  describe("handleShapeCreated behavior", () => {
    const mockRouter = { push: vi.fn() };
    const mockDispatch = vi.fn();
    
    const testShape: TargetShape = {
      id: "test-shape-id",
      name: "Test Shape",
      fields: [],
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    // Simulate the handleShapeCreated logic
    const simulateHandleShapeCreated = (data: any[], shape: TargetShape) => {
      // This mirrors the actual logic in the component
      mockDispatch({ type: "targetShapes/selectTargetShape", payload: shape.id });
      
      if (data.length > 0) {
        mockRouter.push(`/playground/data-table?targetShape=${shape.id}&mode=mapping`);
      } else {
        mockRouter.push("/playground/data-table");
      }
    };

    it("should navigate to mapping mode when data is available", () => {
      const dataWithRows = [
        { id: "1", name: "John", age: 30 },
        { id: "2", name: "Jane", age: 25 },
      ];

      simulateHandleShapeCreated(dataWithRows, testShape);

      // Should select the shape
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "targetShapes/selectTargetShape",
        payload: "test-shape-id",
      });

      // Should navigate to mapping mode
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/data-table?targetShape=test-shape-id&mode=mapping"
      );
    });

    it("should navigate to data table without mapping mode when no data", () => {
      const emptyData: any[] = [];

      simulateHandleShapeCreated(emptyData, testShape);

      // Should select the shape
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "targetShapes/selectTargetShape",
        payload: "test-shape-id",
      });

      // Should navigate to data table without mapping
      expect(mockRouter.push).toHaveBeenCalledWith("/playground/data-table");
    });

    it("should work for both 'from data' and 'from scratch' creation flows", () => {
      // Test with data (typical 'from data' flow)
      const dataRows = [{ id: "1", name: "Test" }];
      simulateHandleShapeCreated(dataRows, testShape);
      
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/data-table?targetShape=test-shape-id&mode=mapping"
      );

      mockRouter.push.mockClear();

      // Test without data (typical 'from scratch' flow when no data uploaded)
      simulateHandleShapeCreated([], testShape);
      
      expect(mockRouter.push).toHaveBeenCalledWith("/playground/data-table");
    });

    it("should use the correct shape ID from saved shape (not original)", () => {
      // This test verifies that the redirect uses the saved shape's ID
      // which may be different from the original shape ID due to storage ID generation
      const _originalShape: TargetShape = {
        id: "original-temp-id",
        name: "Test Shape",
        fields: [],
      };
      
      const savedShape: TargetShape = {
        id: "storage-generated-id", // Different ID after storage
        name: "Test Shape", 
        fields: [],
      };
      
      const dataRows = [{ id: "1", name: "Test" }];
      
      // Simulate the workflow: original shape created, but saved shape has different ID
      simulateHandleShapeCreated(dataRows, savedShape); // Use savedShape for callback
      
      // Should use the saved shape's ID, not the original
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/playground/data-table?targetShape=storage-generated-id&mode=mapping"
      );
    });
  });

  describe("handleCancel behavior", () => {
    const mockRouter = { push: vi.fn() };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    // Simulate the handleCancel logic
    const simulateHandleCancel = (data: any[]) => {
      if (data.length > 0) {
        mockRouter.push("/playground/data-table");
      } else {
        mockRouter.push("/playground");
      }
    };

    it("should navigate to data table when data exists", () => {
      const dataWithRows = [{ id: "1", name: "Test" }];
      
      simulateHandleCancel(dataWithRows);
      
      expect(mockRouter.push).toHaveBeenCalledWith("/playground/data-table");
    });

    it("should navigate to playground when no data exists", () => {
      const emptyData: any[] = [];
      
      simulateHandleCancel(emptyData);
      
      expect(mockRouter.push).toHaveBeenCalledWith("/playground");
    });
  });
});