import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";

export function useAuthedApi() {
  const { getToken, isLoaded, isSignedIn, orgId } = useAuth();

  const authedFetch = useCallback(
    async (fn) => {
      const token = await getToken();

      if (!token) {
        throw new Error("No auth token");
      }

      return fn(token);
    },
    [getToken],
  );

  return {
    authedFetch,
    isAuthReady: isLoaded && isSignedIn,
    isOrganizationReady: isLoaded && isSignedIn && Boolean(orgId),
    organizationId: orgId ?? null,
  };
}
