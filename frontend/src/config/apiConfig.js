/**
 * Resolves and normalizes the backend API base URL.
 * Automatically handles cases where the user configures the URL with or without '/api'
 * or includes trailing slashes (e.g. 'https://api.render.com', 'https://api.render.com/', 'https://api.render.com/api').
 */
export function getApiBaseUrl() {
  const rawUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").trim();
  const cleanUrl = rawUrl.replace(/\/+$/, "");

  if (cleanUrl.endsWith("/api")) {
    return cleanUrl;
  }
  return `${cleanUrl}/api`;
}

export const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
