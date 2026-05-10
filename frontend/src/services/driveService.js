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
