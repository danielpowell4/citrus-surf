import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { reduxPersistence } from "@/lib/utils/redux-persistence";
import { loadShapes } from "@/lib/features/targetShapesSlice";

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
    // Load persisted state on client side
    const persistedState = reduxPersistence.loadState();

    if (persistedState) {
      // If we have persisted state, dispatch actions to sync it
      // Note: The Redux store already has this state from preloadedState,
      // but we need to ensure other parts of the app are aware of it

      // Load target shapes if they exist in persisted state
      if (persistedState.targetShapes?.shapes?.length > 0) {
        dispatch(loadShapes());
      }
    }

    // Mark as hydrated
    setIsHydrated(true);
  }, [dispatch]);

  return { isHydrated };
}
