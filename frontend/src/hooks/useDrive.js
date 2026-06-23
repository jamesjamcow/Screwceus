import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthedApi } from "./useAuthedApi";
import {
  createFolder,
  createProjectFile,
  getProjectFile,
  listFolders,
  listFolderTree,
  listProjectFiles,
  listParts,
  listTeams,
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
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();

  return useQuery({
    queryKey: ["driveContents", organizationId, folderId ?? "root"],
    enabled: isOrganizationReady,
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
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useQuery({
    queryKey: ["project", organizationId, normalizedProjectId ?? "invalid"],
    enabled: isOrganizationReady && Boolean(normalizedProjectId),
    staleTime: 30_000,
    retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 1,
    queryFn: () => authedFetch((token) => getProjectFile(token, normalizedProjectId)),
  });
}

export function useWorkspaceHome() {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();

  return useQuery({
    queryKey: ["workspaceHome", organizationId],
    enabled: isOrganizationReady,
    staleTime: 20_000,
    queryFn: () =>
      authedFetch(async (token) => {
        const [projects, parts, teams, folders] = await Promise.all([
          listProjectFiles(token),
          listParts(token),
          listTeams(token),
          listFolderTree(token),
        ]);

        return { projects, parts, teams, folders };
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
      queryClient.invalidateQueries({ queryKey: ["workspaceHome"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome"] });
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
