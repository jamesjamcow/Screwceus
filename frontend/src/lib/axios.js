import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export function resolveApiAssetUrl(path) {
  if (!path || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  const baseUrl = api.defaults.baseURL;
  if (!baseUrl) {
    return path;
  }

  const apiUrl = new URL(baseUrl, window.location.origin);
  return new URL(path, apiUrl.origin).toString();
}
