import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { STORAGE_KEYS, ROUTES } from "@/lib/constants";
import type { PaginatedResponse } from "@/types";

/**
 * A SEPARATE axios instance for the affiliate partner portal. It carries the
 * partner session (its own access + refresh tokens in localStorage) and never
 * shares state with the customer `api-client`. Both hit the same backend, but a
 * partner token only ever authenticates `/partner/*` routes.
 *
 * Unlike the customer client (cookie refresh), the partner refresh token is
 * body-based, so we persist it and POST it to `/partner/auth/refresh`.
 */
const partnerClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
});

export function getPartnerAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.PARTNER_ACCESS_TOKEN);
}

export function setPartnerTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(STORAGE_KEYS.PARTNER_ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.PARTNER_REFRESH_TOKEN, refreshToken);
}

export function clearPartnerTokens() {
  localStorage.removeItem(STORAGE_KEYS.PARTNER_ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.PARTNER_REFRESH_TOKEN);
}

// Attach the partner Bearer token.
partnerClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getPartnerAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token-refresh single-flight queue.
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string | null) => void;
  reject: (error: AxiosError) => void;
}[] = [];

function processQueue(error: AxiosError | null, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

// Unwrap the { success, data } envelope (unless the caller opts out to keep the
// pagination sibling); silently refresh on a 401.
partnerClient.interceptors.response.use(
  (response) => {
    if (
      !response.config._skipUnwrap &&
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    if (!error.response) return Promise.reject(error);

    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const url = original.url ?? "";
    const isAuthEndpoint = url.includes("/partner/auth/");

    if (error.response.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(
      STORAGE_KEYS.PARTNER_REFRESH_TOKEN,
    );
    if (!refreshToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return partnerClient(original);
      });
    }

    isRefreshing = true;
    original._retry = true;
    try {
      const { data } = await partnerClient.post("/partner/auth/refresh", {
        refreshToken,
      });
      setPartnerTokens(data.accessToken, data.refreshToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      processQueue(null, data.accessToken);
      return partnerClient(original);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      clearPartnerTokens();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

function redirectToLogin() {
  if (window.location.pathname !== ROUTES.PARTNER_LOGIN) {
    window.location.href = ROUTES.PARTNER_LOGIN;
  }
}

// Typed helpers (mirror api-client).
export function partnerGet<T>(url: string, config?: AxiosRequestConfig) {
  return partnerClient.get<T>(url, config).then((r) => r.data);
}
export function partnerPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  return partnerClient.post<T>(url, data, config).then((r) => r.data);
}
export function partnerPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  return partnerClient.patch<T>(url, data, config).then((r) => r.data);
}
export function partnerGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<PaginatedResponse<T>> {
  return partnerClient
    .get(url, { ...config, _skipUnwrap: true })
    .then((r) => ({ data: r.data.data, pagination: r.data.pagination }));
}

export default partnerClient;
