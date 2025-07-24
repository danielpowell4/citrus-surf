import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { reduxPersistence } from "@/lib/utils/redux-persistence";
import { clearError, reset } from "@/lib/features/persistenceSlice";

/**
 * Hook for managing Redux persistence state and operations
 */
export function usePersistence() {
  const dispatch = useDispatch();
  const persistence = useSelector((state: RootState) => state.persistence);

  /**
   * Clear all persisted state
   */
  const clearPersistedState = () => {
    try {
      reduxPersistence.clearState();
      dispatch(reset());
      console.log("Cleared all persisted Redux state");
    } catch (error) {
      console.error("Error clearing persisted state:", error);
      dispatch(clearError());
    }
  };

  /**
   * Get persistence status
   */
  const getStatus = () => {
    return reduxPersistence.getStatus();
  };

  /**
   * Check if state was loaded from persistence
   */
  const wasStateLoaded = persistence.lastLoadedAt !== null;

  /**
   * Check if state was recently saved
   */
  const wasRecentlySaved = persistence.lastSavedAt !== null;

  /**
   * Get formatted timestamps
   */
  const getFormattedTimestamps = () => {
    return {
      lastSaved: persistence.lastSavedAt
        ? new Date(persistence.lastSavedAt).toLocaleString()
        : "Never",
      lastLoaded: persistence.lastLoadedAt
        ? new Date(persistence.lastLoadedAt).toLocaleString()
        : "Never",
    };
  };

  return {
    // State
    isInitialized: persistence.isInitialized,
    hasPersistedState: persistence.hasPersistedState,
    lastSavedAt: persistence.lastSavedAt,
    lastLoadedAt: persistence.lastLoadedAt,
    error: persistence.error,

    // Computed values
    wasStateLoaded,
    wasRecentlySaved,

    // Actions
    clearPersistedState,
    getStatus,
    getFormattedTimestamps,

    // Raw persistence manager
    persistenceManager: reduxPersistence,
  };
}
