export function toPathSafeProjectId(projectId) {
  if (!projectId) {
    return "untitled";
  }

  try {
    return encodeURIComponent(decodeURIComponent(projectId));
  } catch {
    return encodeURIComponent(projectId);
  }
}

export function formatProjectName(projectId) {
  if (!projectId) return "Untitled";

  return decodeURIComponent(projectId)
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
