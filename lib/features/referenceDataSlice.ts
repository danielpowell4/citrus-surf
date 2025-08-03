import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";
import type { ReferenceDataInfo, ReferenceData } from "../types/reference-data-types";
import { referenceDataManager } from "../utils/reference-data-manager";

export interface ReferenceDataHistoryAction {
  type: 'upload' | 'update' | 'delete' | 'clear';
  id: string;
  timestamp: number;
  data?: {
    filename?: string;
    rowCount?: number;
    columns?: string[];
    previousData?: Record<string, any>[];
  };
}

interface ReferenceDataState {
  // Current reference data index (cached from storage)
  referenceFiles: Record<string, ReferenceDataInfo>;
  
  // History tracking
  history: ReferenceDataHistoryAction[];
  currentHistoryIndex: number;
  isTimeTraveling: boolean;
  maxHistorySize: number;
  
  // UI state
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  
  // Statistics
  stats: {
    totalFiles: number;
    totalRows: number;
    totalSize: number;
    lastUpdated: string | null;
  };
}

const initialState: ReferenceDataState = {
  referenceFiles: {},
  history: [],
  currentHistoryIndex: -1,
  isTimeTraveling: false,
  maxHistorySize: 50,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  stats: {
    totalFiles: 0,
    totalRows: 0,
    totalSize: 0,
    lastUpdated: null,
  },
};

export const referenceDataSlice = createSlice({
  name: "referenceData",
  initialState,
  reducers: {
    // File Management Actions
    uploadFileStart: (state, action: PayloadAction<{ filename: string }>) => {
      state.isUploading = true;
      state.uploadProgress = 0;
      state.error = null;
    },

    uploadFileProgress: (state, action: PayloadAction<{ progress: number }>) => {
      state.uploadProgress = action.payload.progress;
    },

    uploadFileSuccess: (state, action: PayloadAction<{ info: ReferenceDataInfo }>) => {
      const { info } = action.payload;
      
      // Update files index
      state.referenceFiles[info.id] = info;
      
      // Add to history
      const historyAction: ReferenceDataHistoryAction = {
        type: 'upload',
        id: info.id,
        timestamp: Date.now(),
        data: {
          filename: info.filename,
          rowCount: info.rowCount,
          columns: info.columns,
        },
      };
      
      state.history.push(historyAction);
      state.currentHistoryIndex = state.history.length - 1;
      
      // Trim history if needed
      if (state.history.length > state.maxHistorySize) {
        state.history = state.history.slice(-state.maxHistorySize);
        state.currentHistoryIndex = state.history.length - 1;
      }
      
      state.isUploading = false;
      state.uploadProgress = 100;
      state.error = null;
      
      // Update stats
      state.stats.totalFiles = Object.keys(state.referenceFiles).length;
      state.stats.totalRows = Object.values(state.referenceFiles).reduce((sum, file) => sum + file.rowCount, 0);
      state.stats.totalSize = Object.values(state.referenceFiles).reduce((sum, file) => sum + file.fileSize, 0);
      state.stats.lastUpdated = new Date().toISOString();
    },

    uploadFileError: (state, action: PayloadAction<{ error: string }>) => {
      state.isUploading = false;
      state.uploadProgress = 0;
      state.error = action.payload.error;
    },

    updateFileData: (state, action: PayloadAction<{ 
      id: string; 
      newData: Record<string, any>[]; 
      previousData: Record<string, any>[] 
    }>) => {
      const { id, newData, previousData } = action.payload;
      const existingFile = state.referenceFiles[id];
      
      if (existingFile) {
        // Update file info
        const updatedInfo: ReferenceDataInfo = {
          ...existingFile,
          rowCount: newData.length,
          columns: newData.length > 0 ? Object.keys(newData[0]) : [],
          lastModified: new Date().toISOString(),
        };
        
        state.referenceFiles[id] = updatedInfo;
        
        // Add to history
        const historyAction: ReferenceDataHistoryAction = {
          type: 'update',
          id,
          timestamp: Date.now(),
          data: {
            rowCount: newData.length,
            columns: updatedInfo.columns,
            previousData,
          },
        };
        
        state.history.push(historyAction);
        state.currentHistoryIndex = state.history.length - 1;
        
        // Trim history if needed
        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
          state.currentHistoryIndex = state.history.length - 1;
        }
        
        // Update stats
        state.stats.totalRows = Object.values(state.referenceFiles).reduce((sum, file) => sum + file.rowCount, 0);
        state.stats.lastUpdated = new Date().toISOString();
      }
      
      state.error = null;
    },

    deleteFile: (state, action: PayloadAction<{ id: string; info: ReferenceDataInfo }>) => {
      const { id, info } = action.payload;
      
      // Remove from files index
      delete state.referenceFiles[id];
      
      // Add to history
      const historyAction: ReferenceDataHistoryAction = {
        type: 'delete',
        id,
        timestamp: Date.now(),
        data: {
          filename: info.filename,
          rowCount: info.rowCount,
          columns: info.columns,
        },
      };
      
      state.history.push(historyAction);
      state.currentHistoryIndex = state.history.length - 1;
      
      // Trim history if needed
      if (state.history.length > state.maxHistorySize) {
        state.history = state.history.slice(-state.maxHistorySize);
        state.currentHistoryIndex = state.history.length - 1;
      }
      
      // Update stats
      state.stats.totalFiles = Object.keys(state.referenceFiles).length;
      state.stats.totalRows = Object.values(state.referenceFiles).reduce((sum, file) => sum + file.rowCount, 0);
      state.stats.totalSize = Object.values(state.referenceFiles).reduce((sum, file) => sum + file.fileSize, 0);
      state.stats.lastUpdated = new Date().toISOString();
      
      state.error = null;
    },

    clearAllFiles: (state) => {
      // Store previous state for history
      const previousFiles = { ...state.referenceFiles };
      
      // Clear files
      state.referenceFiles = {};
      
      // Add to history
      const historyAction: ReferenceDataHistoryAction = {
        type: 'clear',
        id: 'all',
        timestamp: Date.now(),
        data: {
          rowCount: Object.values(previousFiles).reduce((sum, file) => sum + file.rowCount, 0),
        },
      };
      
      state.history.push(historyAction);
      state.currentHistoryIndex = state.history.length - 1;
      
      // Trim history if needed
      if (state.history.length > state.maxHistorySize) {
        state.history = state.history.slice(-state.maxHistorySize);
        state.currentHistoryIndex = state.history.length - 1;
      }
      
      // Reset stats
      state.stats = {
        totalFiles: 0,
        totalRows: 0,
        totalSize: 0,
        lastUpdated: new Date().toISOString(),
      };
      
      state.error = null;
    },

    // History Management Actions
    undoAction: (state) => {
      if (state.currentHistoryIndex > 0) {
        state.currentHistoryIndex--;
        state.isTimeTraveling = true;
        // Note: Actual state restoration happens in middleware/effects
      }
    },

    redoAction: (state) => {
      if (state.currentHistoryIndex < state.history.length - 1) {
        state.currentHistoryIndex++;
        state.isTimeTraveling = true;
        // Note: Actual state restoration happens in middleware/effects
      }
    },

    restoreToIndex: (state, action: PayloadAction<{ index: number }>) => {
      const { index } = action.payload;
      if (index >= 0 && index < state.history.length) {
        state.currentHistoryIndex = index;
        state.isTimeTraveling = true;
        // Note: Actual state restoration happens in middleware/effects
      }
    },

    finishTimeTravel: (state) => {
      state.isTimeTraveling = false;
    },

    // State Synchronization Actions
    syncWithStorage: (state) => {
      // Sync the Redux state with the actual storage
      const files = referenceDataManager.listReferenceFiles();
      const filesIndex: Record<string, ReferenceDataInfo> = {};
      
      files.forEach(file => {
        filesIndex[file.id] = file;
      });
      
      state.referenceFiles = filesIndex;
      
      const stats = referenceDataManager.getStats();
      state.stats = {
        totalFiles: stats.totalFiles,
        totalRows: stats.totalRows,
        totalSize: stats.totalSize,
        lastUpdated: new Date().toISOString(),
      };
    },

    // Error Management
    setError: (state, action: PayloadAction<{ error: string | null }>) => {
      state.error = action.payload.error;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  uploadFileStart,
  uploadFileProgress,
  uploadFileSuccess,
  uploadFileError,
  updateFileData,
  deleteFile,
  clearAllFiles,
  undoAction,
  redoAction,
  restoreToIndex,
  finishTimeTravel,
  syncWithStorage,
  setError,
  clearError,
} = referenceDataSlice.actions;

// Selectors
export const selectReferenceFiles = (state: RootState) => state.referenceData.referenceFiles;
export const selectReferenceFilesList = (state: RootState) => 
  Object.values(state.referenceData.referenceFiles);
export const selectReferenceFileById = (state: RootState, id: string) => 
  state.referenceData.referenceFiles[id];

export const selectReferenceDataHistory = (state: RootState) => state.referenceData.history;
export const selectCurrentHistoryIndex = (state: RootState) => state.referenceData.currentHistoryIndex;
export const selectCanUndo = (state: RootState) => state.referenceData.currentHistoryIndex > 0;
export const selectCanRedo = (state: RootState) => 
  state.referenceData.currentHistoryIndex < state.referenceData.history.length - 1;
export const selectIsTimeTraveling = (state: RootState) => state.referenceData.isTimeTraveling;

export const selectUploadState = (state: RootState) => ({
  isUploading: state.referenceData.isUploading,
  progress: state.referenceData.uploadProgress,
  error: state.referenceData.error,
});

export const selectReferenceDataStats = (state: RootState) => state.referenceData.stats;

export default referenceDataSlice.reducer;