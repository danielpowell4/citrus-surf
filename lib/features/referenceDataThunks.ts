import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";
import { referenceDataManager } from "../utils/reference-data-manager";
import type { UploadReferenceOptions, ReferenceDataInfo } from "../types/reference-data-types";
import { generateReferenceId } from "../types/reference-data-types";
import {
  uploadFileStart,
  uploadFileProgress,
  uploadFileError,
  updateFileData,
  deleteFile,
  clearAllFiles,
  syncWithStorage,
  finishTimeTravel,
} from "./referenceDataSlice";

/**
 * Upload a reference file with progress tracking
 */
export const uploadReferenceFile = createAsyncThunk<
  ReferenceDataInfo,
  { 
    file: File; 
    id?: string; 
    options?: UploadReferenceOptions;
  },
  { state: RootState }
>(
  'referenceData/uploadFile',
  async ({ file, id, options = {} }, { dispatch, rejectWithValue }) => {
    try {
      // Generate ID if not provided
      const referenceId = id || generateReferenceId(file.name.split('.')[0]);
      
      // Start upload
      dispatch(uploadFileStart({ filename: file.name }));
      
      // Simulate progress for large files
      if (file.size > 1024 * 1024) { // 1MB
        const progressInterval = setInterval(() => {
          dispatch(uploadFileProgress({ progress: Math.random() * 50 + 25 }));
        }, 100);
        
        setTimeout(() => {
          clearInterval(progressInterval);
        }, 500);
      }
      
      // Upload the file
      const info = await referenceDataManager.uploadReferenceFile(file, referenceId, options);
      
      return info;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      dispatch(uploadFileError({ error: errorMessage }));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Update reference data with history tracking
 */
export const updateReferenceData = createAsyncThunk<
  void,
  { id: string; data: Record<string, any>[] },
  { state: RootState }
>(
  'referenceData/updateData',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      // Get previous data for history
      const previousData = referenceDataManager.getReferenceDataRows(id) || [];
      
      // Update the data
      const success = referenceDataManager.updateReferenceData(id, data);
      
      if (!success) {
        throw new Error(`Failed to update reference data '${id}'`);
      }
      
      // Dispatch action to update Redux state
      dispatch(updateFileData({ id, newData: data, previousData }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Delete a reference file with history tracking
 */
export const deleteReferenceFile = createAsyncThunk<
  void,
  { id: string },
  { state: RootState }
>(
  'referenceData/deleteFile',
  async ({ id }, { dispatch, rejectWithValue }) => {
    try {
      // Get file info before deletion for history
      const referenceData = referenceDataManager.getReferenceData(id);
      
      if (!referenceData) {
        throw new Error(`Reference data '${id}' not found`);
      }
      
      // Delete the file
      const success = referenceDataManager.deleteReferenceFile(id);
      
      if (!success) {
        throw new Error(`Failed to delete reference data '${id}'`);
      }
      
      // Dispatch action to update Redux state
      dispatch(deleteFile({ id, info: referenceData.info }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Clear all reference files
 */
export const clearAllReferenceData = createAsyncThunk<
  void,
  void,
  { state: RootState }
>(
  'referenceData/clearAll',
  async (_, { dispatch }) => {
    // Clear all data from storage
    referenceDataManager.clearAll();
    
    // Update Redux state
    dispatch(clearAllFiles());
  }
);

/**
 * Restore reference data state to a specific history index
 */
export const restoreReferenceDataToIndex = createAsyncThunk<
  void,
  { index: number },
  { state: RootState }
>(
  'referenceData/restoreToIndex',
  async ({ index }, { dispatch, getState }) => {
    const state = getState();
    const history = state.referenceData.history;
    
    if (index < 0 || index >= history.length) {
      throw new Error('Invalid history index');
    }
    
    // Clear all current data
    referenceDataManager.clearAll();
    
    // Replay actions up to the target index
    for (let i = 0; i <= index; i++) {
      const action = history[i];
      
      try {
        switch (action.type) {
          case 'upload':
            // For upload actions, we need to restore the data
            // This is a simplified version - in a real app you might want to store the actual data
            console.log(`Would restore upload action for ${action.id}`);
            break;
            
          case 'update':
            // For update actions, restore the data
            if (action.data?.previousData) {
              referenceDataManager.updateReferenceData(action.id, action.data.previousData);
            }
            break;
            
          case 'delete':
            // For delete actions, we can't easily restore without storing the full data
            console.log(`Would restore delete action for ${action.id}`);
            break;
            
          case 'clear':
            // Clear action - remove all data
            referenceDataManager.clearAll();
            break;
        }
      } catch (error) {
        console.error(`Error replaying action ${i}:`, error);
      }
    }
    
    // Sync Redux state with the restored storage state
    dispatch(syncWithStorage());
    dispatch(finishTimeTravel());
  }
);

/**
 * Undo the last reference data action
 */
export const undoReferenceDataAction = createAsyncThunk<
  void,
  void,
  { state: RootState }
>(
  'referenceData/undo',
  async (_, { dispatch, getState }) => {
    const state = getState();
    const { currentHistoryIndex } = state.referenceData;
    
    if (currentHistoryIndex > 0) {
      await dispatch(restoreReferenceDataToIndex({ index: currentHistoryIndex - 1 }));
    }
  }
);

/**
 * Redo the next reference data action
 */
export const redoReferenceDataAction = createAsyncThunk<
  void,
  void,
  { state: RootState }
>(
  'referenceData/redo',
  async (_, { dispatch, getState }) => {
    const state = getState();
    const { currentHistoryIndex, history } = state.referenceData;
    
    if (currentHistoryIndex < history.length - 1) {
      await dispatch(restoreReferenceDataToIndex({ index: currentHistoryIndex + 1 }));
    }
  }
);

/**
 * Initialize reference data state from storage
 */
export const initializeReferenceData = createAsyncThunk<
  void,
  void,
  { state: RootState }
>(
  'referenceData/initialize',
  async (_, { dispatch }) => {
    // Sync with storage on app startup
    dispatch(syncWithStorage());
  }
);