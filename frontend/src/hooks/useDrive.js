import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthedApi } from "./useAuthedApi";
import {
  addProjectPart,
  createPart,
  createProjectIssue,
  createTeamIssue,
  createTeamResource,
  createTeam,
  createFolder,
  createProjectFile,
  deleteFolder,
  deleteProjectFile,
  deleteTeam,
  getProjectFile,
  listFolders,
  listFolderTree,
  listProjectFiles,
  listProjectIssues,
  listProjectParts,
  listParts,
  listTeamIssues,
  listTeams,
  listTeamResources,
  removeProjectPart,
  updateProjectIssue,
  updateProjectPart,
  updateTeamIssue,
  updateTeam,
  updateProjectFile,
  uploadProjectCover,
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

export function useDriveContents(folderId, teamId = null) {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();

  return useQuery({
    queryKey: ["driveContents", organizationId, teamId ?? "default", folderId ?? "root"],
    enabled: isOrganizationReady,
    staleTime: 30_000,
    queryFn: () =>
      authedFetch(async (token) => {
        const [folders, projects, folderTree] = await Promise.all([
          listFolders(token, { parentId: folderId, teamId }),
          listProjectFiles(token, { folderId, teamId }),
          listFolderTree(token, { teamId }),
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

export function useProjectIssues(projectId) {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useQuery({
    queryKey: ["projectIssues", organizationId, normalizedProjectId ?? "invalid"],
    enabled: isOrganizationReady && Boolean(normalizedProjectId),
    staleTime: 15_000,
    queryFn: () => authedFetch((token) => listProjectIssues(token, normalizedProjectId)),
  });
}

export function useParts() {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();

  return useQuery({
    queryKey: ["parts", organizationId],
    enabled: isOrganizationReady,
    staleTime: 30_000,
    queryFn: () => authedFetch((token) => listParts(token)),
  });
}

export function useProjectParts(projectId) {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useQuery({
    queryKey: ["projectParts", organizationId, normalizedProjectId ?? "invalid"],
    enabled: isOrganizationReady && Boolean(normalizedProjectId),
    staleTime: 15_000,
    queryFn: () => authedFetch((token) => listProjectParts(token, normalizedProjectId)),
  });
}

export function useAddProjectPart(projectId) {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useMutation({
    mutationFn: (payload) => authedFetch((token) => addProjectPart(token, normalizedProjectId, payload)),
    onSuccess: (createdLink) => {
      queryClient.setQueryData(
        ["projectParts", organizationId, normalizedProjectId ?? "invalid"],
        (currentLinks = []) => [...currentLinks, createdLink],
      );
      queryClient.invalidateQueries({ queryKey: ["projectParts", organizationId, normalizedProjectId ?? "invalid"] });
    },
  });
}

export function useUpdateProjectPart(projectId) {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useMutation({
    mutationFn: ({ linkId, ...payload }) => (
      authedFetch((token) => updateProjectPart(token, normalizedProjectId, linkId, payload))
    ),
    onSuccess: (updatedLink) => {
      queryClient.setQueryData(
        ["projectParts", organizationId, normalizedProjectId ?? "invalid"],
        (currentLinks) => currentLinks?.map((link) => (
          link.id === updatedLink.id ? updatedLink : link
        )),
      );
    },
  });
}

export function useRemoveProjectPart(projectId) {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useMutation({
    mutationFn: (linkId) => authedFetch((token) => removeProjectPart(token, normalizedProjectId, linkId)),
    onSuccess: (_, linkId) => {
      queryClient.setQueryData(
        ["projectParts", organizationId, normalizedProjectId ?? "invalid"],
        (currentLinks) => currentLinks?.filter((link) => link.id !== linkId),
      );
      queryClient.invalidateQueries({ queryKey: ["projectParts", organizationId, normalizedProjectId ?? "invalid"] });
    },
  });
}

export function useCreateProjectIssue(projectId) {
  const { authedFetch } = useAuthedApi();
  const queryClient = useQueryClient();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useMutation({
    mutationFn: (issue) => authedFetch((token) => createProjectIssue(token, normalizedProjectId, issue)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectIssues"] });
    },
  });
}

export function useUpdateProjectIssue(projectId) {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();
  const normalizedProjectId = normalizeProjectId(projectId);

  return useMutation({
    mutationFn: ({ issueId, issue }) => (
      authedFetch((token) => updateProjectIssue(token, normalizedProjectId, issueId, issue))
    ),
    onSuccess: (updatedIssue) => {
      queryClient.setQueryData(
        ["projectIssues", organizationId, normalizedProjectId ?? "invalid"],
        (currentIssues) => currentIssues?.map((issue) => (
          issue.id === updatedIssue.id ? updatedIssue : issue
        )),
      );
    },
  });
}

export function useWorkspaceHome(activeTeamId = null) {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();

  return useQuery({
    queryKey: ["workspaceHome", organizationId, activeTeamId ?? "general"],
    enabled: isOrganizationReady,
    staleTime: 20_000,
    queryFn: () =>
      authedFetch(async (token) => {
        const teams = await listTeams(token);
        const requestedTeam = teams.find((team) => String(team.id) === String(activeTeamId));
        const storageTeam = requestedTeam
          || teams.find((team) => team.key === "GENERAL")
          || teams[0];
        const [projects, parts, folders] = await Promise.all([
          listProjectFiles(token, { teamId: storageTeam?.id }),
          listParts(token),
          listFolderTree(token, { teamId: storageTeam?.id }),
        ]);

        return { projects, parts, teams, folders, storageTeamId: storageTeam?.id ?? null };
      }),
  });
}

export function useTeamResources(teamId) {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();

  return useQuery({
    queryKey: ["teamResources", organizationId, teamId],
    enabled: isOrganizationReady && Boolean(teamId),
    staleTime: 20_000,
    queryFn: () => authedFetch((token) => listTeamResources(token, teamId)),
  });
}

export function useTeamIssues(teamId) {
  const { authedFetch, isOrganizationReady, organizationId } = useAuthedApi();

  return useQuery({
    queryKey: ["teamIssues", organizationId, teamId ?? "invalid"],
    enabled: isOrganizationReady && Boolean(teamId),
    staleTime: 15_000,
    queryFn: () => authedFetch((token) => listTeamIssues(token, teamId)),
  });
}

export function useCreateTeamIssue(teamId) {
  const { authedFetch } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issue) => authedFetch((token) => createTeamIssue(token, teamId, issue)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamIssues"] });
    },
  });
}

export function useUpdateTeamIssue(teamId) {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, issue }) => (
      authedFetch((token) => updateTeamIssue(token, teamId, issueId, issue))
    ),
    onSuccess: (updatedIssue) => {
      queryClient.setQueryData(
        ["teamIssues", organizationId, teamId ?? "invalid"],
        (currentIssues) => currentIssues?.map((issue) => (
          issue.id === updatedIssue.id ? updatedIssue : issue
        )),
      );
    },
  });
}

export function useUpdateTeam() {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, description }) =>
      authedFetch((token) => updateTeam(token, teamId, { description })),
    onSuccess: (updatedTeam) => {
      queryClient.setQueriesData({ queryKey: ["workspaceHome", organizationId] }, (current) => {
        if (!current?.teams) return current;
        return {
          ...current,
          teams: current.teams.map((team) => team.id === updatedTeam.id ? updatedTeam : team),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome"] });
    },
  });
}

export function useCreateTeamResource(teamId) {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authedFetch((token) => createTeamResource(token, teamId, payload)),
    onSuccess: (resource) => {
      queryClient.setQueryData(["teamResources", organizationId, teamId], (current = []) => [
        resource,
        ...current,
      ]);
      queryClient.invalidateQueries({ queryKey: ["teamResources"] });
    },
  });
}

export function useCreateFolder(teamId = null) {
  const { authedFetch } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authedFetch((token) => createFolder(token, { ...payload, teamId })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome"] });
    },
  });
}

export function useDeleteFolder() {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId) => authedFetch((token) => deleteFolder(token, folderId)),
    onSuccess: (_, folderId) => {
      const removeFolder = (folders = []) => folders
        .filter((folder) => folder.id !== folderId)
        .map((folder) => ({ ...folder, children: removeFolder(folder.children) }));

      queryClient.setQueriesData({ queryKey: ["workspaceHome", organizationId] }, (current) => current
        ? { ...current, folders: removeFolder(current.folders) }
        : current);
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome", organizationId] });
    },
  });
}

export function useCreatePart() {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authedFetch((token) => createPart(token, payload)),
    onSuccess: (part) => {
      queryClient.setQueriesData({ queryKey: ["workspaceHome", organizationId] }, (current) => current
        ? { ...current, parts: [part, ...(current.parts ?? [])] }
        : current);
      queryClient.invalidateQueries({ queryKey: ["parts", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome", organizationId] });
    },
  });
}

export function useCreateTeam() {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authedFetch((token) => createTeam(token, payload)),
    onSuccess: (team) => {
      queryClient.setQueriesData({ queryKey: ["workspaceHome", organizationId] }, (current) => current
        ? { ...current, teams: [...current.teams, team].sort((a, b) => a.name.localeCompare(b.name)) }
        : current);
      queryClient.invalidateQueries({ queryKey: ["workspaceHome", organizationId] });
    },
  });
}

export function useDeleteTeam() {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId) => authedFetch((token) => deleteTeam(token, teamId)),
    onSuccess: (_, teamId) => {
      queryClient.setQueriesData({ queryKey: ["workspaceHome", organizationId] }, (current) => {
        if (!current?.teams) return current;
        return {
          ...current,
          teams: current.teams.filter((team) => String(team.id) !== String(teamId)),
          storageTeamId: String(current.storageTeamId) === String(teamId) ? null : current.storageTeamId,
        };
      });
      queryClient.removeQueries({ queryKey: ["teamResources", organizationId, teamId] });
      queryClient.removeQueries({ queryKey: ["teamIssues", organizationId, teamId] });
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["teamResources"] });
      queryClient.invalidateQueries({ queryKey: ["teamIssues"] });
    },
  });
}

export function useCreateProject(teamId = null) {
  const { authedFetch } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      authedFetch(async (token) => {
        const project = await createProjectFile(token, { ...payload, teamId });
        let completedProject = project;

        if (payload.coverImage) {
          completedProject = await uploadProjectCover(token, {
            projectId: project.id,
            file: payload.coverImage,
          });
        }
        if (payload.modelFile) {
          completedProject = await uploadProjectModel(token, {
            projectId: project.id,
            file: payload.modelFile,
          });
        }

        return completedProject;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome"] });
    },
  });
}

export function useUpdateProject() {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, ...payload }) =>
      authedFetch((token) => updateProjectFile(token, projectId, payload)),
    onSuccess: (updatedProject) => {
      queryClient.setQueriesData({ queryKey: ["workspaceHome", organizationId] }, (current) => current
        ? {
            ...current,
            projects: current.projects.map((project) =>
              project.id === updatedProject.id ? updatedProject : project),
          }
        : current);
      queryClient.setQueryData(["project", organizationId, String(updatedProject.id)], updatedProject);
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome", organizationId] });
    },
  });
}

export function useDeleteProject() {
  const { authedFetch, organizationId } = useAuthedApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId) => authedFetch((token) => deleteProjectFile(token, projectId)),
    onSuccess: (_, projectId) => {
      queryClient.setQueryData(["workspaceHome", organizationId], (current) => current
        ? {
            ...current,
            projects: current.projects.filter((project) => project.id !== projectId),
          }
        : current);
      queryClient.removeQueries({ queryKey: ["project", organizationId, String(projectId)] });
      queryClient.invalidateQueries({ queryKey: ["driveContents"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceHome", organizationId] });
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

export function getCreatePartErrorMessage(error) {
  return getErrorMessage(error, "Could not create the part.");
}

export function getProjectPartErrorMessage(error) {
  return getErrorMessage(error, "Could not update project parts.");
}

export function getUpdateProjectErrorMessage(error) {
  return getErrorMessage(error, "Could not update the project.");
}

export function getDeleteProjectErrorMessage(error) {
  return getErrorMessage(error, "Could not delete the project.");
}

export function getDeleteFolderErrorMessage(error) {
  return getErrorMessage(error, "Could not delete the folder.");
}

export function getCreateTeamErrorMessage(error) {
  return getErrorMessage(error, "Could not create the team.");
}

export function getDeleteTeamErrorMessage(error) {
  return getErrorMessage(error, "Could not delete the team.");
}

export function getProjectErrorMessage(error) {
  return getErrorMessage(error, "Could not load project.");
}

export function getProjectIssuesErrorMessage(error) {
  return getErrorMessage(error, "Could not load project issues.");
}

export function getTeamIssuesErrorMessage(error) {
  return getErrorMessage(error, "Could not load team issues.");
}

export function getTeamOverviewErrorMessage(error, fallback = "Could not save team changes.") {
  return getErrorMessage(error, fallback);
}
