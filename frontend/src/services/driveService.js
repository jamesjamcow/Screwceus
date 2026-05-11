import { api } from "../lib/axios";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function listFolders(token, { parentId } = {}) {
  const response = await api.get("/v1/folders/", {
    headers: authHeaders(token),
    params: parentId ? { parent_id: parentId } : {},
  });

  return response.data;
}

export async function listProjectFiles(token, { folderId } = {}) {
  const response = await api.get("/v1/projects/", {
    headers: authHeaders(token),
    params: folderId ? { folder_id: folderId } : { root_only: true },
  });

  return response.data;
}

export async function getProjectFile(token, projectId) {
  const response = await api.get(`/v1/projects/${projectId}`, {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function listFolderTree(token) {
  const response = await api.get("/v1/folders/tree", {
    headers: authHeaders(token),
  });

  return response.data;
}

export async function createFolder(token, { name, parentId }) {
  const response = await api.post(
    "/v1/folders/",
    {
      name,
      parent_id: parentId ?? null,
    },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
}

export async function createProjectFile(token, { name, folderId, description = "" }) {
  const response = await api.post(
    "/v1/projects/",
    {
      name,
      folder_id: folderId ?? null,
      description,
    },
    {
      headers: authHeaders(token),
    },
  );

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
