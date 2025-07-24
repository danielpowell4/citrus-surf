import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useSuperjsonStorage, useDateStorage } from "./useSuperjsonStorage";

describe("useSuperjsonStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should handle Date objects correctly", () => {
    const testDate = new Date("2023-01-15T10:30:00Z");
    const { result } = renderHook(() =>
      useSuperjsonStorage("test-date", testDate)
    );

    const [storedDate, setStoredDate] = result.current;

    expect(storedDate).toBeInstanceOf(Date);
    expect(storedDate.getTime()).toBe(testDate.getTime());

    // Test updating the date
    const newDate = new Date("2023-01-16T15:45:00Z");
    act(() => {
      setStoredDate(newDate);
    });

    expect(result.current[0]).toBeInstanceOf(Date);
    expect(result.current[0].getTime()).toBe(newDate.getTime());

    // Verify it's stored in localStorage
    const stored = localStorage.getItem("test-date");
    expect(stored).toBeTruthy();
  });

  it("should handle complex objects with Date properties", () => {
    const initialValue = {
      id: "test-1",
      createdAt: new Date("2023-01-15T10:30:00Z"),
      updatedAt: new Date("2023-01-16T15:45:00Z"),
      metadata: {
        lastModified: new Date("2023-01-17T09:00:00Z"),
      },
    };

    const { result } = renderHook(() =>
      useSuperjsonStorage("test-complex", initialValue)
    );

    const [storedValue, setStoredValue] = result.current;

    expect(storedValue.createdAt).toBeInstanceOf(Date);
    expect(storedValue.updatedAt).toBeInstanceOf(Date);
    expect(storedValue.metadata.lastModified).toBeInstanceOf(Date);

    // Test updating with a function
    act(() => {
      setStoredValue(prev => ({
        ...prev,
        updatedAt: new Date("2023-01-18T12:00:00Z"),
      }));
    });

    expect(result.current[0].updatedAt).toBeInstanceOf(Date);
    expect(result.current[0].updatedAt.getTime()).toBe(
      new Date("2023-01-18T12:00:00Z").getTime()
    );
  });

  it("should handle arrays with Date objects", () => {
    const initialValue = [
      {
        id: "item-1",
        createdAt: new Date("2023-01-15T10:30:00Z"),
      },
      {
        id: "item-2",
        createdAt: new Date("2023-01-16T15:45:00Z"),
      },
    ];

    const { result } = renderHook(() =>
      useSuperjsonStorage("test-array", initialValue)
    );

    const [storedArray, setStoredArray] = result.current;

    expect(storedArray[0].createdAt).toBeInstanceOf(Date);
    expect(storedArray[1].createdAt).toBeInstanceOf(Date);

    // Test adding a new item
    act(() => {
      setStoredArray(prev => [
        ...prev,
        {
          id: "item-3",
          createdAt: new Date("2023-01-17T09:00:00Z"),
        },
      ]);
    });

    expect(result.current[0]).toHaveLength(3);
    expect(result.current[0][2].createdAt).toBeInstanceOf(Date);
  });

  it("should use initial value when localStorage is empty", () => {
    const initialValue = { id: "default", createdAt: new Date() };

    const { result } = renderHook(() =>
      useSuperjsonStorage("empty-key", initialValue)
    );

    const [storedValue] = result.current;
    expect(storedValue).toEqual(initialValue);
  });

  it("should handle undefined values", () => {
    const initialValue = {
      id: "test-1",
      optionalField: undefined,
      requiredField: "value",
    };

    const { result } = renderHook(() =>
      useSuperjsonStorage("test-undefined", initialValue)
    );

    const [storedValue] = result.current;
    expect(storedValue.optionalField).toBeUndefined();
    expect(storedValue.requiredField).toBe("value");
  });
});

describe("useDateStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should handle Date objects specifically", () => {
    const testDate = new Date("2023-01-15T10:30:00Z");
    const { result } = renderHook(() =>
      useDateStorage("test-date-specific", testDate)
    );

    const [storedDate, setStoredDate] = result.current;

    expect(storedDate).toBeInstanceOf(Date);
    expect(storedDate.getTime()).toBe(testDate.getTime());

    // Test updating the date
    const newDate = new Date("2023-01-16T15:45:00Z");
    act(() => {
      setStoredDate(newDate);
    });

    expect(result.current[0]).toBeInstanceOf(Date);
    expect(result.current[0].getTime()).toBe(newDate.getTime());
  });
});
