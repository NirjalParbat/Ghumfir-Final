import axios from "axios";

const API_PORT_CACHE_KEY = "ghumfir_api_base";
const DEFAULT_DEV_PORTS = [8080, 8081, 8082, 8083, 8084, 8085];

const getFixedBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) {
    const normalizedUrl = envUrl.replace(/\/+$/, "");
    return normalizedUrl.endsWith("/api")
      ? normalizedUrl
      : `${normalizedUrl}/api`;
  }

  return null;
};

const getHostCandidates = () => {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return ["localhost", "127.0.0.1"];
  }
  return [host];
};

const probeHealth = async (baseUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

export const discoverApiBase = async () => {
  const fixedBaseUrl = getFixedBaseUrl();
  if (fixedBaseUrl) return fixedBaseUrl;

  // Production must use VITE_API_URL; only probe local ports during development.
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return "/api";
  }

  const cached = localStorage.getItem(API_PORT_CACHE_KEY);
  if (cached && (await probeHealth(cached))) {
    return cached;
  }

  const hosts = getHostCandidates();

  for (const host of hosts) {
    for (const port of DEFAULT_DEV_PORTS) {
      const candidate = `http://${host}:${port}/api`;
      // Probe /api/health to find whichever backend port is currently live.
      if (await probeHealth(candidate)) {
        localStorage.setItem(API_PORT_CACHE_KEY, candidate);
        return candidate;
      }
    }
  }

  return "/api";
};

const API = axios.create({
  baseURL: "/api",
});

// Add auth token to every request
API.interceptors.request.use(async (config) => {
  config.baseURL = await discoverApiBase();
  const token = localStorage.getItem("ghumfir_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthAttempt =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem("ghumfir_token");
      localStorage.removeItem("ghumfir_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;
