import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthedApi } from "./useAuthedApi";
import {
  createFolder,
  createProjectFile,
  listFolders,
  listFolderTree,
  listProjectFiles,
} from "../services/driveService";

function getErrorMessage(error, fallback) {
  return error?.response?.data?.detail || fallback;
}

export function useDriveContents(folderId) {
  const { authedFetch, isAuthReady } = useAuthedApi();

  return useQuery({
    queryKey: ["driveContents", folderId ?? "root"],
    enabled: isAuthReady,
    staleTime: 30_000,
    queryFn: () =>
      authedFetch(async (token) => {
        const [folders, projects, folderTree] = await Promise.all([
          listFolders(token, { parentId: folderId }),
          listProjectFiles(token, { folderId }),
          listFolderTree(token),
        ]);

        return { folders, projects, folderTree };
      }),
  });
}

export function useCreateFolder() {
  const { authedFetch } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authedFetch((token) => createFolder(token, payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
    },
  });
}

export function useCreateProject() {
  const { authedFetch } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authedFetch((token) => createProjectFile(token, payload)),
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
