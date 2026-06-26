import { api } from "../lib/axios";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function listFolders(token, { parentId, teamId } = {}) {
  const params = {};
  if (parentId) params.parent_id = parentId;
  if (teamId) params.team_id = teamId;
  const response = await api.get("/v1/folders/", {
    headers: authHeaders(token),
    params,
  });

  return response.data;
}

export async function listProjectFiles(token, { folderId, teamId } = {}) {
  const hasFolderFilter = folderId !== undefined && folderId !== null;
  const params = hasFolderFilter ? { folder_id: folderId } : {};
  if (teamId) params.team_id = teamId;
  const response = await api.get("/v1/projects/", {
    headers: authHeaders(token),
    params,
  });

  return response.data;
}

export async function listParts(token) {
  const response = await api.get("/v1/parts/", {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function createPart(token, part) {
  const response = await api.post("/v1/parts/", part, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function listTeams(token) {
  const response = await api.get("/v1/teams/", {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function searchWorkspace(token, query, { signal, limit = 12 } = {}) {
  const response = await api.get("/v1/search/", {
    headers: authHeaders(token),
    params: { q: query, limit },
    signal,
  });

  return response.data;
}

export async function updateTeam(token, teamId, payload) {
  const response = await api.patch(`/v1/teams/${teamId}`, payload, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function deleteTeam(token, teamId) {
  await api.delete(`/v1/teams/${teamId}`, {
    headers: authHeaders(token),
  });
}

export async function listTeamResources(token, teamId) {
  const response = await api.get(`/v1/teams/${teamId}/resources`, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function createTeamResource(token, teamId, payload) {
  const response = await api.post(`/v1/teams/${teamId}/resources`, payload, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function listTeamIssues(token, teamId) {
  const response = await api.get(`/v1/teams/${teamId}/issues`, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function createTeamIssue(token, teamId, issue) {
  const response = await api.post(`/v1/teams/${teamId}/issues`, issue, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function updateTeamIssue(token, teamId, issueId, issue) {
  const response = await api.patch(`/v1/teams/${teamId}/issues/${issueId}`, issue, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function createTeam(token, { name, key, color, memberIds }) {
  const response = await api.post(
    "/v1/teams/",
    {
      name,
      key,
      color,
      member_ids: memberIds,
    },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
}

export async function getProjectFile(token, projectId) {
  const response = await api.get(`/v1/projects/${projectId}`, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function listProjectIssues(token, projectId) {
  const response = await api.get(`/v1/projects/${projectId}/issues`, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function listProjectParts(token, projectId) {
  const response = await api.get(`/v1/projects/${projectId}/parts`, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function addProjectPart(token, projectId, { partId, point = null, notes = "" }) {
  const response = await api.post(
    `/v1/projects/${projectId}/parts`,
    {
      part_id: partId,
      point,
      notes,
    },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
}

export async function updateProjectPart(token, projectId, linkId, { point, notes }) {
  const payload = {};
  if (point !== undefined) payload.point = point;
  if (notes !== undefined) payload.notes = notes;

  const response = await api.patch(`/v1/projects/${projectId}/parts/${linkId}`, payload, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function removeProjectPart(token, projectId, linkId) {
  await api.delete(`/v1/projects/${projectId}/parts/${linkId}`, {
    headers: authHeaders(token),
  });
}

export async function createProjectIssue(token, projectId, issue) {
  const response = await api.post(`/v1/projects/${projectId}/issues`, issue, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function updateProjectIssue(token, projectId, issueId, issue) {
  const response = await api.patch(`/v1/projects/${projectId}/issues/${issueId}`, issue, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function listFolderTree(token, { teamId } = {}) {
  const response = await api.get("/v1/folders/tree", {
    headers: authHeaders(token),
    params: teamId ? { team_id: teamId } : {},
  });

  return response.data;
}

export async function createFolder(token, { name, parentId, teamId }) {
  const response = await api.post(
    "/v1/folders/",
    {
      name,
      parent_id: parentId ?? null,
      team_id: teamId ?? null,
    },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
}

export async function deleteFolder(token, folderId) {
  await api.delete(`/v1/folders/${folderId}`, {
    headers: authHeaders(token),
  });
}

export async function createProjectFile(token, { name, folderId, teamId, description, status, dueDate }) {
  const payload = { name };

  if (teamId) {
    payload.team_id = teamId;
  }

  if (folderId !== undefined && folderId !== null && folderId !== "") {
    payload.folder_id = folderId;
  }
  if (description?.trim()) {
    payload.description = description.trim();
  }
  if (status) {
    payload.status = status;
  }
  if (dueDate) {
    payload.due_date = dueDate;
  }

  const response = await api.post(
    "/v1/projects/",
    payload,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
}

export async function updateProjectFile(token, projectId, payload) {
  const apiPayload = {};

  if (Object.hasOwn(payload, "name")) apiPayload.name = payload.name;
  if (Object.hasOwn(payload, "folderId")) apiPayload.folder_id = payload.folderId;
  if (Object.hasOwn(payload, "description")) apiPayload.description = payload.description;
  if (Object.hasOwn(payload, "status")) apiPayload.status = payload.status;
  if (Object.hasOwn(payload, "dueDate")) apiPayload.due_date = payload.dueDate || null;

  const response = await api.patch(`/v1/projects/${projectId}`, apiPayload, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function deleteProjectFile(token, projectId) {
  await api.delete(`/v1/projects/${projectId}`, {
    headers: authHeaders(token),
  });
}

export async function uploadProjectCover(token, { projectId, file }) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/v1/projects/${projectId}/cover`, formData, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function uploadProjectModel(token, { projectId, file }) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/v1/projects/${projectId}/model`, formData, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function uploadPhoto(token, { file, title, projectId, caption, sortOrder }) {
  const formData = new FormData();
  formData.append("file", file);
  if (title) {
    formData.append("title", title);
  }
  if (projectId !== undefined && projectId !== null) {
    formData.append("project_id", projectId);
  }
  if (caption !== undefined) {
    formData.append("caption", caption);
  }
  if (sortOrder !== undefined) {
    formData.append("sort_order", String(sortOrder));
  }

  const response = await api.post("/v1/photos/upload", formData, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function addProjectScreenshot(token, { projectId, photoId, caption = "", sortOrder = 0 }) {
  const response = await api.post(
    `/v1/projects/${projectId}/screenshots`,
    {
      photo_id: photoId,
      caption,
      sort_order: sortOrder,
    },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
}
