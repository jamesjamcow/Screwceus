import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../lib/api";

function getProjectParams(folderId) {
  return folderId ? { folder_id: folderId } : { root_only: true };
}

function getFolderParams(folderId) {
  return folderId ? { parent_id: folderId } : {};
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.detail || fallback;
}

export function useDriveContents(folderId) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["driveContents", folderId ?? "root"],
    enabled: isLoaded && isSignedIn,
    staleTime: 30_000,
    queryFn: async () => {
      const token = await getToken();
      const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const [foldersResponse, projectsResponse, treeResponse] = await Promise.all([
        api.get("/v1/folders/", { ...authConfig, params: getFolderParams(folderId) }),
        api.get("/v1/projects/", { ...authConfig, params: getProjectParams(folderId) }),
        api.get("/v1/folders/tree", authConfig),
      ]);

      return {
        folders: foldersResponse.data,
        projects: projectsResponse.data,
        folderTree: treeResponse.data,
      };
    },
  });
}

export function useCreateFolder() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, parentId }) => {
      const token = await getToken();
      const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await api.post("/v1/folders/", { name, parent_id: parentId ?? null }, authConfig);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
    },
  });
}

export function useCreateProject() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, folderId }) => {
      const token = await getToken();
      const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await api.post(
        "/v1/projects/",
        { name, folder_id: folderId ?? null, description: "" },
        authConfig,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
    },
  });
}

export function getDriveErrorMessage(error) {
  return getErrorMessage(error, "Could not load folders and files.");
}

export function getCreateFolderErrorMessage(error) {
  return getErrorMessage(error, "Could not create folder.");
}

export function getCreateProjectErrorMessage(error) {
  return getErrorMessage(error, "Could not create project file.");
}
