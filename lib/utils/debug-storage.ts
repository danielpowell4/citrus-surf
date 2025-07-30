import { targetShapesStorage } from "./target-shapes-storage";
import { storage } from "./localStorage";

/**
 * Debug utilities for storage issues
 */
export const debugStorage = {
  // Check what's actually in localStorage
  inspectLocalStorage() {
    console.log("=== localStorage Debug ===");
    console.log("Total localStorage items:", localStorage.length);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(
          `${key}:`,
          value?.substring(0, 100) + (value && value.length > 100 ? "..." : "")
        );
      }
    }
  },

  // Check target shapes storage specifically
  inspectTargetShapes() {
    console.log("=== Target Shapes Debug ===");
    const shapes = targetShapesStorage.getAll();
    console.log("Number of shapes:", shapes.length);

    shapes.forEach((shape, index) => {
      console.log(`Shape ${index + 1}:`, {
        id: shape.id,
        name: shape.name,
        description: shape.description,
        fields: shape.fields.length,
        createdAt: shape.createdAt,
        updatedAt: shape.updatedAt,
      });
    });
  },

  // Test storage operations
  testStorage() {
    console.log("=== Storage Test ===");

    // Test basic localStorage
    try {
      localStorage.setItem("test-key", "test-value");
      const retrieved = localStorage.getItem("test-key");
      console.log(
        "Basic localStorage test:",
        retrieved === "test-value" ? "PASS" : "FAIL"
      );
      localStorage.removeItem("test-key");
    } catch (error) {
      console.error("Basic localStorage test FAILED:", error);
    }

    // Test storage utility
    try {
      storage.setItem("test-storage", { test: true, date: new Date() });
      const retrieved = storage.getItem("test-storage");
      console.log("Storage utility test:", retrieved ? "PASS" : "FAIL");
      storage.removeItem("test-storage");
    } catch (error) {
      console.error("Storage utility test FAILED:", error);
    }

    // Test target shapes storage
    try {
      const testShape = {
        name: "Debug Test Shape",
        description: "Test shape for debugging",
        version: "1.0.0",
        fields: [
          {
            id: "test-field",
            name: "Test Field",
            type: "string" as const,
            required: true,
          },
        ],
        metadata: {
          category: "test",
          tags: ["debug"],
        },
      };

      const saved = targetShapesStorage.save(testShape);
      console.log("Target shapes save test:", saved ? "PASS" : "FAIL");

      const retrieved = targetShapesStorage.getById(saved.id);
      console.log("Target shapes retrieve test:", retrieved ? "PASS" : "FAIL");

      const deleted = targetShapesStorage.delete(saved.id);
      console.log("Target shapes delete test:", deleted ? "PASS" : "FAIL");
    } catch (error) {
      console.error("Target shapes storage test FAILED:", error);
    }
  },

  // Clear all debug data
  clearAll() {
    console.log("=== Clearing All Storage ===");
    targetShapesStorage.clear();
    console.log("Target shapes cleared");
  },
};

// Make it available globally for browser console debugging
if (typeof window !== "undefined") {
  (window as any).debugStorage = debugStorage;
}
