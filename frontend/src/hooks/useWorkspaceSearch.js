import { useQuery } from "@tanstack/react-query";

import { searchWorkspace } from "../services/driveService";
import { useAuthedApi } from "./useAuthedApi";

export function useWorkspaceSearch(query, isOpen) {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ["workspaceSearch", organizationId, normalizedQuery],
    enabled: isOpen && isOrganizationReady && normalizedQuery.length >= 2,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    queryFn: ({ signal }) => (
      authedFetch((token) => searchWorkspace(token, normalizedQuery, { signal }))
    ),
  });
}
