import { describe, it, expect, beforeEach, vi } from "vitest";
import { targetShapesStorage } from "./target-shapes-storage";
import type { TargetShape } from "@/lib/types/target-shapes";

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock the storage utility
vi.mock("./localStorage", () => ({
  storage: {
    getItem: vi.fn((key: string) => {
      const stored = mockLocalStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }),
    setItem: vi.fn((key: string, value: any) => {
      mockLocalStorage.setItem(key, JSON.stringify(value));
    }),
    removeItem: vi.fn((key: string) => {
      mockLocalStorage.removeItem(key);
    }),
  },
}));

const mockTargetShape: Omit<TargetShape, "id" | "createdAt" | "updatedAt"> = {
  name: "Test Shape",
  description: "A test target shape",
  version: "1.0.0",
  fields: [
    {
      id: "field1",
      name: "Test Field",
      type: "string",
      required: true,
    },
  ],
  metadata: {
    category: "test",
    tags: ["test"],
  },
};

describe("Target Shapes Storage", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("should save and retrieve target shapes", () => {
    // Save a shape
    const savedShape = targetShapesStorage.save(mockTargetShape);

    // Verify it was assigned an ID and timestamps
    expect(savedShape.id).toBeDefined();
    expect(typeof savedShape.createdAt).toBe("string");
    expect(typeof savedShape.updatedAt).toBe("string");
    expect(new Date(savedShape.createdAt)).toBeInstanceOf(Date);
    expect(new Date(savedShape.updatedAt)).toBeInstanceOf(Date);
    expect(savedShape.name).toBe(mockTargetShape.name);

    // Retrieve all shapes
    const allShapes = targetShapesStorage.getAll();
    expect(allShapes).toHaveLength(1);
    expect(allShapes[0].id).toBe(savedShape.id);
  });

  it("should retrieve shape by ID", () => {
    const savedShape = targetShapesStorage.save(mockTargetShape);

    const retrievedShape = targetShapesStorage.getById(savedShape.id);
    expect(retrievedShape).not.toBeNull();
    expect(retrievedShape?.id).toBe(savedShape.id);
    expect(retrievedShape?.name).toBe(mockTargetShape.name);
  });

  it("should return null for non-existent shape ID", () => {
    const nonExistent = targetShapesStorage.getById("non-existent-id");
    expect(nonExistent).toBeNull();
  });

  it("should update existing shapes", () => {
    const savedShape = targetShapesStorage.save(mockTargetShape);

    // Wait a millisecond to ensure timestamp difference
    const originalTime = new Date(savedShape.updatedAt).getTime();

    const updates = { name: "Updated Shape Name" };
    const updatedShape = targetShapesStorage.update(savedShape.id, updates);

    expect(updatedShape).not.toBeNull();
    expect(updatedShape?.name).toBe("Updated Shape Name");
    expect(
      updatedShape?.updatedAt && new Date(updatedShape.updatedAt).getTime()
    ).toBeGreaterThanOrEqual(originalTime);

    // Verify persistence
    const retrieved = targetShapesStorage.getById(savedShape.id);
    expect(retrieved?.name).toBe("Updated Shape Name");
  });

  it("should return null when updating non-existent shape", () => {
    const result = targetShapesStorage.update("non-existent", { name: "test" });
    expect(result).toBeNull();
  });

  it("should delete shapes", () => {
    const savedShape = targetShapesStorage.save(mockTargetShape);

    const deleted = targetShapesStorage.delete(savedShape.id);
    expect(deleted).toBe(true);

    const allShapes = targetShapesStorage.getAll();
    expect(allShapes).toHaveLength(0);

    const retrieved = targetShapesStorage.getById(savedShape.id);
    expect(retrieved).toBeNull();
  });

  it("should return false when deleting non-existent shape", () => {
    const result = targetShapesStorage.delete("non-existent");
    expect(result).toBe(false);
  });

  it("should handle multiple shapes", () => {
    const _shape1 = targetShapesStorage.save(mockTargetShape);
    const _shape2 = targetShapesStorage.save({
      ...mockTargetShape,
      name: "Second Shape",
    });

    const allShapes = targetShapesStorage.getAll();
    expect(allShapes).toHaveLength(2);

    const names = allShapes.map(s => s.name);
    expect(names).toContain("Test Shape");
    expect(names).toContain("Second Shape");
  });

  it("should clear all shapes", () => {
    targetShapesStorage.save(mockTargetShape);
    targetShapesStorage.save({ ...mockTargetShape, name: "Shape 2" });

    expect(targetShapesStorage.getAll()).toHaveLength(2);

    targetShapesStorage.clear();

    expect(targetShapesStorage.getAll()).toHaveLength(0);
  });

  it("should return empty array when no shapes exist", () => {
    const shapes = targetShapesStorage.getAll();
    expect(shapes).toEqual([]);
  });
});
