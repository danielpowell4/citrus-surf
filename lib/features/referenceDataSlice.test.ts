import { describe, it, expect, beforeEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import referenceDataReducer, {
  uploadFileStart,
  uploadFileSuccess,
  uploadFileError,
  updateFileData,
  deleteFile,
  clearAllFiles,
  undoAction,
  redoAction,
  syncWithStorage,
  selectReferenceFiles,
  selectCanUndo,
  selectCanRedo,
  selectReferenceDataStats,
} from "./referenceDataSlice";
import type { ReferenceDataInfo } from "../types/reference-data-types";

// Mock the reference data manager
vi.mock("../utils/reference-data-manager", () => ({
  referenceDataManager: {
    listReferenceFiles: vi.fn(() => []),
    getStats: vi.fn(() => ({
      totalFiles: 0,
      totalRows: 0,
      totalSize: 0,
      fileStats: [],
    })),
  },
}));

// Mock store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      referenceData: referenceDataReducer,
    },
  });
};

describe("Reference Data Redux Slice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  const mockReferenceInfo: ReferenceDataInfo = {
    id: "ref_test_123",
    filename: "test.csv",
    rowCount: 100,
    columns: ["name", "age", "department"],
    uploadedAt: "2023-01-01T00:00:00.000Z",
    lastModified: "2023-01-01T00:00:00.000Z",
    fileSize: 5000,
    format: "csv",
    metadata: {
      delimiter: ",",
      hasHeaders: true,
    },
  };

  describe("File Upload Actions", () => {
    it("should handle upload start", () => {
      store.dispatch(uploadFileStart({ filename: "test.csv" }));

      const state = store.getState().referenceData;
      expect(state.isUploading).toBe(true);
      expect(state.uploadProgress).toBe(0);
      expect(state.error).toBeNull();
    });

    it("should handle upload success", () => {
      store.dispatch(uploadFileSuccess({ info: mockReferenceInfo }));

      const state = store.getState().referenceData;
      expect(state.isUploading).toBe(false);
      expect(state.uploadProgress).toBe(100);
      expect(state.error).toBeNull();
      expect(state.referenceFiles[mockReferenceInfo.id]).toEqual(
        mockReferenceInfo
      );
      expect(state.history).toHaveLength(1);
      expect(state.history[0].type).toBe("upload");
      expect(state.currentHistoryIndex).toBe(0);
    });

    it("should handle upload error", () => {
      const errorMessage = "Upload failed";
      store.dispatch(uploadFileError({ error: errorMessage }));

      const state = store.getState().referenceData;
      expect(state.isUploading).toBe(false);
      expect(state.uploadProgress).toBe(0);
      expect(state.error).toBe(errorMessage);
    });

    it("should update statistics on upload", () => {
      store.dispatch(uploadFileSuccess({ info: mockReferenceInfo }));

      const stats = selectReferenceDataStats(store.getState());
      expect(stats.totalFiles).toBe(1);
      expect(stats.totalRows).toBe(100);
      expect(stats.totalSize).toBe(5000);
      expect(stats.lastUpdated).toBeTruthy();
    });
  });

  describe("File Management Actions", () => {
    beforeEach(() => {
      // Add a test file
      store.dispatch(uploadFileSuccess({ info: mockReferenceInfo }));
    });

    it("should handle file update", () => {
      const newData = [
        { name: "John", age: "30", department: "Engineering" },
        { name: "Jane", age: "25", department: "Marketing" },
      ];
      const previousData = [
        { name: "Old John", age: "29", department: "Engineering" },
      ];

      store.dispatch(
        updateFileData({
          id: mockReferenceInfo.id,
          newData,
          previousData,
        })
      );

      const state = store.getState().referenceData;
      const updatedFile = state.referenceFiles[mockReferenceInfo.id];

      expect(updatedFile.rowCount).toBe(2);
      expect(updatedFile.columns).toEqual(["name", "age", "department"]);
      expect(updatedFile.lastModified).not.toBe(mockReferenceInfo.lastModified);
      expect(state.history).toHaveLength(2);
      expect(state.history[1].type).toBe("update");
    });

    it("should handle file deletion", () => {
      store.dispatch(
        deleteFile({
          id: mockReferenceInfo.id,
          info: mockReferenceInfo,
        })
      );

      const state = store.getState().referenceData;
      expect(state.referenceFiles[mockReferenceInfo.id]).toBeUndefined();
      expect(state.history).toHaveLength(2);
      expect(state.history[1].type).toBe("delete");

      const stats = selectReferenceDataStats(store.getState());
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalRows).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it("should handle clear all files", () => {
      // Add another file
      const secondFile: ReferenceDataInfo = {
        ...mockReferenceInfo,
        id: "ref_second_123",
        filename: "second.csv",
      };
      store.dispatch(uploadFileSuccess({ info: secondFile }));

      store.dispatch(clearAllFiles());

      const state = store.getState().referenceData;
      expect(Object.keys(state.referenceFiles)).toHaveLength(0);
      expect(state.history).toHaveLength(3); // upload, upload, clear
      expect(state.history[2].type).toBe("clear");

      const stats = selectReferenceDataStats(store.getState());
      expect(stats.totalFiles).toBe(0);
    });
  });

  describe("History Management", () => {
    beforeEach(() => {
      // Create some history
      store.dispatch(uploadFileSuccess({ info: mockReferenceInfo }));
      store.dispatch(
        updateFileData({
          id: mockReferenceInfo.id,
          newData: [{ name: "Updated", age: "31", department: "Sales" }],
          previousData: [
            { name: "Original", age: "30", department: "Engineering" },
          ],
        })
      );
    });

    it("should track undo/redo availability", () => {
      let state = store.getState();
      expect(selectCanUndo(state)).toBe(true);
      expect(selectCanRedo(state)).toBe(false);

      store.dispatch(undoAction());

      state = store.getState();
      expect(state.referenceData.currentHistoryIndex).toBe(0);
      expect(selectCanUndo(state)).toBe(false);
      expect(selectCanRedo(state)).toBe(true);

      store.dispatch(redoAction());

      state = store.getState();
      expect(state.referenceData.currentHistoryIndex).toBe(1);
      expect(selectCanUndo(state)).toBe(true);
      expect(selectCanRedo(state)).toBe(false);
    });

    it("should limit history size", () => {
      // Add more actions than the max history size (50)
      for (let i = 0; i < 60; i++) {
        store.dispatch(
          updateFileData({
            id: mockReferenceInfo.id,
            newData: [{ name: `User${i}`, age: "30", department: "Test" }],
            previousData: [{ name: "Previous", age: "29", department: "Old" }],
          })
        );
      }

      const state = store.getState().referenceData;
      expect(state.history.length).toBeLessThanOrEqual(50);
      expect(state.currentHistoryIndex).toBe(state.history.length - 1);
    });
  });

  describe("Selectors", () => {
    beforeEach(() => {
      store.dispatch(uploadFileSuccess({ info: mockReferenceInfo }));
    });

    it("should select reference files", () => {
      const files = selectReferenceFiles(store.getState());
      expect(files[mockReferenceInfo.id]).toEqual(mockReferenceInfo);
    });

    it("should select file statistics", () => {
      const stats = selectReferenceDataStats(store.getState());
      expect(stats.totalFiles).toBe(1);
      expect(stats.totalRows).toBe(mockReferenceInfo.rowCount);
      expect(stats.totalSize).toBe(mockReferenceInfo.fileSize);
    });
  });

  describe("Storage Synchronization", () => {
    it("should sync with storage state", async () => {
      const { referenceDataManager } = await import(
        "../utils/reference-data-manager"
      );

      // Mock the reference data manager
      const mockFiles: ReferenceDataInfo[] = [
        mockReferenceInfo,
        {
          ...mockReferenceInfo,
          id: "ref_another_456",
          filename: "another.csv",
          rowCount: 50,
        },
      ];

      // Set up mocks
      vi.mocked(referenceDataManager.listReferenceFiles).mockReturnValue(
        mockFiles
      );
      vi.mocked(referenceDataManager.getStats).mockReturnValue({
        totalFiles: 2,
        totalRows: 150,
        totalSize: 10000,
        fileStats: [],
      });

      store.dispatch(syncWithStorage());

      const state = store.getState().referenceData;
      expect(Object.keys(state.referenceFiles)).toHaveLength(2);
      expect(state.stats.totalFiles).toBe(2);
      expect(state.stats.totalRows).toBe(150);
    });
  });
});
