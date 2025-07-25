import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { storage } from "./localStorage";

describe("localStorage with superjson", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  it("should handle Date objects correctly", () => {
    const testDate = new Date("2023-01-15T10:30:00Z");
    const testData = {
      id: "test-1",
      createdAt: testDate,
      updatedAt: new Date("2023-01-16T15:45:00Z"),
      name: "Test Item",
    };

    storage.setItem("test-key", testData);
    const retrieved = storage.getItem<typeof testData>("test-key");

    expect(retrieved).toEqual(testData);
    expect(retrieved?.createdAt).toBeInstanceOf(Date);
    expect(retrieved?.updatedAt).toBeInstanceOf(Date);
    expect(retrieved?.createdAt.getTime()).toBe(testDate.getTime());
  });

  it("should handle arrays with Date objects", () => {
    const testData = [
      {
        id: "item-1",
        createdAt: new Date("2023-01-15T10:30:00Z"),
      },
      {
        id: "item-2",
        createdAt: new Date("2023-01-16T15:45:00Z"),
      },
    ];

    storage.setItem("test-array", testData);
    const retrieved = storage.getItem<typeof testData>("test-array");

    expect(retrieved).toEqual(testData);
    expect(retrieved?.[0].createdAt).toBeInstanceOf(Date);
    expect(retrieved?.[1].createdAt).toBeInstanceOf(Date);
  });

  it("should handle undefined values", () => {
    const testData = {
      id: "test-1",
      optionalField: undefined,
      requiredField: "value",
    };

    storage.setItem("test-undefined", testData);
    const retrieved = storage.getItem<typeof testData>("test-undefined");

    expect(retrieved).toEqual(testData);
    expect(retrieved?.optionalField).toBeUndefined();
  });

  it("should handle BigInt values", () => {
    const testData = {
      id: "test-1",
      bigNumber: BigInt("12345678901234567890"),
    };

    storage.setItem("test-bigint", testData);
    const retrieved = storage.getItem<typeof testData>("test-bigint");

    expect(retrieved).toEqual(testData);
    expect(typeof retrieved?.bigNumber).toBe("bigint");
    expect(retrieved?.bigNumber).toBe(BigInt("12345678901234567890"));
  });

  it("should return null for non-existent keys", () => {
    const retrieved = storage.getItem("non-existent-key");
    expect(retrieved).toBeNull();
  });

  it("should return default value when provided", () => {
    const defaultValue = { id: "default", name: "Default Item" };
    const retrieved = storage.getItem("non-existent-key", defaultValue);
    expect(retrieved).toEqual(defaultValue);
  });

  it("should handle complex nested objects", () => {
    const testData = {
      id: "complex-1",
      metadata: {
        createdAt: new Date("2023-01-15T10:30:00Z"),
        tags: ["tag1", "tag2"],
        settings: {
          enabled: true,
          threshold: 0.5,
          lastUpdated: new Date("2023-01-16T15:45:00Z"),
        },
      },
      items: [
        {
          id: "sub-1",
          timestamp: new Date("2023-01-17T09:00:00Z"),
        },
      ],
    };

    storage.setItem("test-complex", testData);
    const retrieved = storage.getItem<typeof testData>("test-complex");

    expect(retrieved).toEqual(testData);
    expect(retrieved?.metadata.createdAt).toBeInstanceOf(Date);
    expect(retrieved?.metadata.settings.lastUpdated).toBeInstanceOf(Date);
    expect(retrieved?.items[0].timestamp).toBeInstanceOf(Date);
  });

  it("should handle SSR environment gracefully", () => {
    // Mock SSR environment (no window or localStorage)
    const originalWindow = global.window;
    const originalLocalStorage = global.localStorage;

    // @ts-ignore
    delete global.window;
    // @ts-ignore
    delete global.localStorage;

    // Should return default value without throwing
    const result = storage.getItem("test-ssr", "default");
    expect(result).toBe("default");

    // Should not throw when setting item
    expect(() => storage.setItem("test-ssr", "value")).not.toThrow();

    // Should not throw when removing item
    expect(() => storage.removeItem("test-ssr")).not.toThrow();

    // Should return 0 for length
    expect(storage.length).toBe(0);

    // Should return null for key
    expect(storage.key(0)).toBeNull();

    // Restore original environment
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  });
});
