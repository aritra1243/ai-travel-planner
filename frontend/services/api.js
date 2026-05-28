/**
 * Unified API Client for Vagabond AI Travel Planner
 * Bridges frontend fetches to either the Express reverse proxy or directly to the Django REST backend.
 * Automatically injects simplejwt Bearer tokens and ensures trailing slashes for Django compliance.
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem("vagabond_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    // Session stale/expired
    localStorage.removeItem("vagabond_token");
    window.dispatchEvent(new Event("vagabond-logout"));
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || "Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.detail || `Request failed with status ${response.status}`);
  }
  return data;
};

const API_BASE = import.meta.env.VITE_API_URL || "";

// Ensures URLs have trailing slashes if they are calling endpoints without files
const normalizeUrl = (url) => {
  let normalized = url;
  if (url.includes("?")) {
    const [path, query] = url.split("?");
    normalized = `${path.endsWith("/") ? path : path + "/" }?${query}`;
  } else {
    normalized = url.endsWith("/") ? url : `${url}/`;
  }

  // If the url is already fully qualified, don't prepend API_BASE
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  // Prepend API_BASE and ensure leading slash
  const cleanUrl = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${API_BASE}${cleanUrl}`;
};

export const api = {
  async get(url) {
    const res = await fetch(normalizeUrl(url), {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(res);
  },

  async post(url, body = {}) {
    const res = await fetch(normalizeUrl(url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async put(url, body = {}) {
    const res = await fetch(normalizeUrl(url), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async delete(url) {
    const res = await fetch(normalizeUrl(url), {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(res);
  },
};
