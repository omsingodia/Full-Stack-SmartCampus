const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function getToken() {
  return sessionStorage.getItem("campuscare_token") || "";
}
export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const hostParts = window.location.hostname.split(".");
  const rootDomain = (import.meta.env.VITE_ROOT_DOMAIN || "campuscare.in").toLowerCase();
  const inferredSlug = hostParts.length > 2 && hostParts.slice(-2).join(".") === rootDomain
    ? hostParts[0] : "";
  const campusSlug = sessionStorage.getItem("campuscare_campus_slug") || inferredSlug;
  if (campusSlug) headers.set("X-Campus-Slug", campusSlug);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data;
}
export const json = (value) => JSON.stringify(value);
export { API_URL };
