import { describe, it, expect } from "vitest";
import { naturalSort, naturalSortForTable } from "./sort-utils";

describe("naturalSort", () => {
  describe("basic functionality", () => {
    it("should sort simple strings alphabetically", () => {
      const items = ["Bob", "Alice", "Charlie"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["Alice", "Bob", "Charlie"]);
    });

    it("should sort numbers numerically", () => {
      const items = ["10", "2", "1"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["1", "2", "10"]);
    });

    it("should handle mixed alphanumeric content", () => {
      const items = ["file10.txt", "file1.txt", "file2.txt"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["file1.txt", "file2.txt", "file10.txt"]);
    });
  });

  describe("employee IDs", () => {
    it("should sort employee IDs naturally", () => {
      const items = ["EMP10", "EMP1", "EMP2", "EMP20"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["EMP1", "EMP2", "EMP10", "EMP20"]);
    });

    it("should handle different prefix patterns", () => {
      const items = ["USER_10", "USER_1", "USER_2", "USER_20"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["USER_1", "USER_2", "USER_10", "USER_20"]);
    });
  });

  describe("version numbers", () => {
    it("should sort semantic versions correctly", () => {
      const items = ["v1.10.0", "v1.1.0", "v1.2.0", "v2.1.0"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["v1.1.0", "v1.2.0", "v1.10.0", "v2.1.0"]);
    });

    it("should handle version numbers without prefix", () => {
      const items = ["1.10.0", "1.1.0", "1.2.0", "2.1.0"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["1.1.0", "1.2.0", "1.10.0", "2.1.0"]);
    });
  });

  describe("file names", () => {
    it("should sort file names naturally", () => {
      const items = [
        "file10.txt",
        "file1.txt",
        "file1a.txt",
        "file1b.txt",
        "file2.txt",
      ];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual([
        "file1.txt",
        "file1a.txt",
        "file1b.txt",
        "file2.txt",
        "file10.txt",
      ]);
    });

    it("should handle different file extensions", () => {
      const items = ["image10.jpg", "image1.jpg", "image2.jpg"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["image1.jpg", "image2.jpg", "image10.jpg"]);
    });
  });

  describe("edge cases", () => {
    it("should handle null values", () => {
      const items = ["Bob", null, "Alice"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual([null, "Alice", "Bob"]);
    });

    it("should handle undefined values", () => {
      const items = ["Bob", undefined, "Alice"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["Alice", "Bob", undefined]);
    });

    it("should handle empty strings", () => {
      const items = ["Bob", "", "Alice"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["", "Alice", "Bob"]);
    });

    it("should handle case sensitivity", () => {
      const items = ["Bob", "alice", "Charlie"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["alice", "Bob", "Charlie"]);
    });

    it("should handle mixed data types", () => {
      const items = ["10", 2, "1", 20];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual(["1", 2, "10", 20]);
    });
  });

  describe("complex scenarios", () => {
    it("should handle mixed content with multiple numeric parts", () => {
      const items = [
        "section-10-item-5",
        "section-1-item-10",
        "section-2-item-1",
        "section-1-item-1",
      ];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual([
        "section-1-item-1",
        "section-1-item-10",
        "section-2-item-1",
        "section-10-item-5",
      ]);
    });

    it("should handle dates in various formats", () => {
      const items = ["2023-10-01", "2023-01-15", "2023-02-05", "2023-12-31"];
      const sorted = [...items].sort(naturalSort);
      expect(sorted).toEqual([
        "2023-01-15",
        "2023-02-05",
        "2023-10-01",
        "2023-12-31",
      ]);
    });
  });
});

describe("naturalSortForTable", () => {
  it("should work with TanStack Table row objects", () => {
    const mockRowA = {
      getValue: (columnId: string) => {
        if (columnId === "name") return "Bob";
        return null;
      },
    };

    const mockRowB = {
      getValue: (columnId: string) => {
        if (columnId === "name") return "Alice";
        return null;
      },
    };

    const result = naturalSortForTable(mockRowA, mockRowB, "name");
    expect(result).toBeGreaterThan(0); // Bob should come after Alice
  });

  it("should handle null values from table rows", () => {
    const mockRowA = {
      getValue: (_columnId: string) => null,
    };

    const mockRowB = {
      getValue: (_columnId: string) => "Alice",
    };

    const result = naturalSortForTable(mockRowA, mockRowB, "name");
    expect(result).toBeLessThan(0); // null should come before Alice
  });

  it("should handle alphanumeric values from table rows", () => {
    const mockRowA = {
      getValue: (_columnId: string) => "EMP10",
    };

    const mockRowB = {
      getValue: (_columnId: string) => "EMP2",
    };

    const result = naturalSortForTable(mockRowA, mockRowB, "id");
    expect(result).toBeGreaterThan(0); // EMP10 should come after EMP2
  });
});
