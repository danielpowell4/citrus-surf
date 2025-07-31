import { configureStore } from "@reduxjs/toolkit";
import { vi, beforeEach, describe, it, expect } from "vitest";
import targetShapesReducer, {
  loadShapes,
  saveTargetShape,
  saveTargetShapeAsync,
  updateTargetShape,
  deleteTargetShape,
  selectTargetShape,
} from "./targetShapesSlice";
import { targetShapesStorage } from "@/lib/utils/target-shapes-storage";
import type { TargetShape } from "@/lib/types/target-shapes";

// Mock the storage
vi.mock("@/lib/utils/target-shapes-storage", () => ({
  targetShapesStorage: {
    getAll: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockTargetShapesStorage = targetShapesStorage as any;

const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      targetShapes: targetShapesReducer,
    },
    preloadedState: preloadedState || {
      targetShapes: {
        shapes: [],
        selectedShapeId: null,
        isLoading: false,
        error: null,
      },
    },
  });
};

const mockShape: TargetShape = {
  id: "test-shape-id",
  name: "Test Shape",
  description: "Test description",
  version: "1.0.0",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  fields: [],
  metadata: {
    category: "custom",
    tags: [],
  },
};

const mockShapeInput = {
  name: "Test Shape",
  description: "Test description",
  version: "1.0.0",
  fields: [],
  metadata: {
    category: "custom" as const,
    tags: [],
  },
};

describe("targetShapesSlice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadShapes", () => {
    it("should load shapes from storage", () => {
      const store = createTestStore();
      const mockShapes = [mockShape];
      mockTargetShapesStorage.getAll.mockReturnValue(mockShapes);

      store.dispatch(loadShapes());

      const state = store.getState().targetShapes;
      expect(state.shapes).toEqual(mockShapes);
      expect(state.error).toBeNull();
      expect(mockTargetShapesStorage.getAll).toHaveBeenCalled();
    });
  });

  describe("saveTargetShape (synchronous)", () => {
    it("should save a shape and add it to the store", () => {
      const store = createTestStore();
      const savedShape = { ...mockShape, id: "generated-id" };
      mockTargetShapesStorage.save.mockReturnValue(savedShape);

      store.dispatch(saveTargetShape(mockShapeInput as TargetShape));

      const state = store.getState().targetShapes;
      expect(state.shapes).toContain(savedShape);
      expect(state.error).toBeNull();
      expect(mockTargetShapesStorage.save).toHaveBeenCalledWith(mockShapeInput);
    });

    it("should handle save errors", () => {
      const store = createTestStore();
      mockTargetShapesStorage.save.mockImplementation(() => {
        throw new Error("Storage error");
      });

      store.dispatch(saveTargetShape(mockShapeInput as TargetShape));

      const state = store.getState().targetShapes;
      expect(state.error).toBe("Failed to save target shape");
      expect(state.shapes).toHaveLength(0);
    });
  });

  describe("saveTargetShapeAsync", () => {
    it("should save a shape asynchronously and return the saved shape", async () => {
      const store = createTestStore();
      const savedShape = { ...mockShape, id: "async-generated-id" };
      mockTargetShapesStorage.save.mockReturnValue(savedShape);

      const result = await store.dispatch(saveTargetShapeAsync(mockShapeInput as TargetShape));

      // Check that the thunk fulfilled successfully
      expect(saveTargetShapeAsync.fulfilled.match(result)).toBe(true);
      expect(result.payload).toEqual(savedShape);

      // Check state was updated
      const state = store.getState().targetShapes;
      expect(state.shapes).toContain(savedShape);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(mockTargetShapesStorage.save).toHaveBeenCalledWith(mockShapeInput);
    });

    it("should handle async save errors", async () => {
      const store = createTestStore();
      mockTargetShapesStorage.save.mockImplementation(() => {
        throw new Error("Async storage error");
      });

      const result = await store.dispatch(saveTargetShapeAsync(mockShapeInput as TargetShape));

      // Check that the thunk was rejected
      expect(saveTargetShapeAsync.rejected.match(result)).toBe(true);

      // Check error state
      const state = store.getState().targetShapes;
      expect(state.error).toBe("Async storage error");
      expect(state.isLoading).toBe(false);
      expect(state.shapes).toHaveLength(0);
    });

    it("should set loading state during async operation", async () => {
      const store = createTestStore();
      let resolvePromise: (value: TargetShape) => void;
      const savePromise = new Promise<TargetShape>((resolve) => {
        resolvePromise = resolve;
      });
      
      mockTargetShapesStorage.save.mockReturnValue(savePromise);

      // Start the async operation
      const thunkPromise = store.dispatch(saveTargetShapeAsync(mockShapeInput as TargetShape));

      // Check loading state
      let state = store.getState().targetShapes;
      expect(state.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!(mockShape);
      await thunkPromise;

      // Check final state
      state = store.getState().targetShapes;
      expect(state.isLoading).toBe(false);
    });
  });

  describe("updateTargetShape", () => {
    it("should update an existing shape", () => {
      const store = createTestStore();
      const updatedShape = { ...mockShape, name: "Updated Name" };
      
      // Setup initial state with a shape
      mockTargetShapesStorage.getAll.mockReturnValue([mockShape]);
      store.dispatch(loadShapes());
      
      // Mock the update
      mockTargetShapesStorage.update.mockReturnValue(updatedShape);

      store.dispatch(updateTargetShape({
        id: mockShape.id,
        updates: { name: "Updated Name" }
      }));

      const state = store.getState().targetShapes;
      expect(state.shapes[0]).toEqual(updatedShape);
      expect(mockTargetShapesStorage.update).toHaveBeenCalledWith(mockShape.id, { name: "Updated Name" });
    });

    it("should handle update errors when shape not found", () => {
      const store = createTestStore();
      mockTargetShapesStorage.update.mockReturnValue(null);

      store.dispatch(updateTargetShape({
        id: "non-existent-id",
        updates: { name: "Updated Name" }
      }));

      const state = store.getState().targetShapes;
      expect(state.error).toBe("Failed to update target shape");
    });
  });

  describe("deleteTargetShape", () => {
    it("should delete a shape", () => {
      const store = createTestStore();
      
      // Setup initial state with shapes
      mockTargetShapesStorage.getAll.mockReturnValue([mockShape]);
      store.dispatch(loadShapes());
      
      // Mock successful deletion
      mockTargetShapesStorage.delete.mockReturnValue(true);
      mockTargetShapesStorage.getAll.mockReturnValue([]); // Empty after deletion

      store.dispatch(deleteTargetShape(mockShape.id));

      const state = store.getState().targetShapes;
      expect(state.shapes).toHaveLength(0);
      expect(mockTargetShapesStorage.delete).toHaveBeenCalledWith(mockShape.id);
    });

    it("should clear selectedShapeId when deleting the selected shape", () => {
      const store = createTestStore();
      
      // Setup with selected shape
      store.dispatch(selectTargetShape(mockShape.id));
      mockTargetShapesStorage.delete.mockReturnValue(true);
      mockTargetShapesStorage.getAll.mockReturnValue([]);

      store.dispatch(deleteTargetShape(mockShape.id));

      const state = store.getState().targetShapes;
      expect(state.selectedShapeId).toBeNull();
    });
  });

  describe("selectTargetShape", () => {
    it("should select a shape by ID", () => {
      const store = createTestStore();

      store.dispatch(selectTargetShape(mockShape.id));

      const state = store.getState().targetShapes;
      expect(state.selectedShapeId).toBe(mockShape.id);
    });

    it("should clear selection when passing null", () => {
      const store = createTestStore();
      
      // First select a shape
      store.dispatch(selectTargetShape(mockShape.id));
      
      // Then clear selection
      store.dispatch(selectTargetShape(null));

      const state = store.getState().targetShapes;
      expect(state.selectedShapeId).toBeNull();
    });
  });
});