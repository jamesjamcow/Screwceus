import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthedApi } from "./useAuthedApi";
import {
  createFolder,
  createProjectFile,
  getProjectFile,
  listFolders,
  listFolderTree,
  listProjectFiles,
  uploadProjectModel,
} from "../services/driveService";

function getErrorMessage(error, fallback) {
  return error?.response?.data?.detail || fallback;
}

export function normalizeProjectId(projectId) {
  const value = String(projectId ?? "").trim();

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const numericProjectId = Number(value);

  if (!Number.isSafeInteger(numericProjectId) || numericProjectId <= 0) {
    return null;
  }

  return String(numericProjectId);
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

export function useProject(projectId) {
  const { authedFetch, isAuthReady } = useAuthedApi();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useQuery({
    queryKey: ["project", normalizedProjectId ?? "invalid"],
    enabled: isAuthReady && Boolean(normalizedProjectId),
    staleTime: 30_000,
    retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 1,
    queryFn: () => authedFetch((token) => getProjectFile(token, normalizedProjectId)),
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
    mutationFn: (payload) =>
      authedFetch(async (token) => {
        const project = await createProjectFile(token, payload);

        if (!payload.modelFile) {
          return project;
        }

        return uploadProjectModel(token, {
          projectId: project.id,
          file: payload.modelFile,
        });
      }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
      queryClient.setQueryData(["project", String(project.id)], project);
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

export function getProjectErrorMessage(error) {
  return getErrorMessage(error, "Could not load project.");
}
