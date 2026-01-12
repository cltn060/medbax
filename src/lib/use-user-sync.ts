import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

export function useUserSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  // Use a ref to persist across renders without causing re-runs
  const syncAttempted = useRef(false);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (isLoading) {
      return;
    }

    // Reset sync flag when user logs out
    if (!isAuthenticated) {
      syncAttempted.current = false;
      return;
    }

    // If authenticated and haven't tried to sync yet
    if (isAuthenticated && !syncAttempted.current) {
      syncAttempted.current = true;
      storeUser()
        .then((id) => {
          console.log("User synced to Convex DB:", id);
        })
        .catch((error) => {
          console.error("Failed to sync user to Convex:", error);
          // Reset so it can retry
          syncAttempted.current = false;
        });
    }
  }, [isAuthenticated, isLoading, storeUser]);
}