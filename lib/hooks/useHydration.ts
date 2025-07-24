import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { reduxPersistence } from "@/lib/utils/redux-persistence";
import { restoreFromStorage } from "@/lib/store";

/**
 * Hook to handle client-side hydration and load persisted state
 *
 * This ensures that any persisted state is loaded after the component
 * mounts on the client side, preventing hydration mismatches.
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    // Load persisted state on client side after initial render
    const persistedState = reduxPersistence.loadState();

    if (persistedState) {
      // Restore entire state with a single action
      dispatch(restoreFromStorage(persistedState));
    }

    // Mark as hydrated
    setIsHydrated(true);
  }, [dispatch]);

  return { isHydrated };
}
