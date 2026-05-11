export function getFolderSearchParam(searchParams) {
  const rawFolderId = searchParams.get("folder");
  if (!rawFolderId) return null;

  const parsedFolderId = Number(rawFolderId);
  return Number.isInteger(parsedFolderId) && parsedFolderId > 0 ? parsedFolderId : null;
}

export function buildHomeFolderPath(folderId) {
  return folderId ? `/?folder=${encodeURIComponent(String(folderId))}` : "/";
}
