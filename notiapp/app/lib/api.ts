import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  message: string;
};

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; skipAuthRefresh?: boolean };

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshRequest: Promise<boolean> | null = null;

apiClient.interceptors.response.use(response => response, async (error: AxiosError) => {
  const config = error.config as RetryConfig | undefined;
  if (error.response?.status !== 401 || !config || config._retry || config.skipAuthRefresh) {
    return Promise.reject(error);
  }

  const requestUrl = config.url || "";
  if (/\/auth\/v1\/(login|signup|refresh)$/.test(requestUrl)) return Promise.reject(error);

  config._retry = true;
  refreshRequest ||= axios.post(`${API_URL}${apiPath("/auth/v1/refresh")}`, undefined, { withCredentials: true })
    .then(() => true)
    .catch(() => false)
    .finally(() => { refreshRequest = null; });

  if (!await refreshRequest) {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("notiapp:auth-expired"));
    return Promise.reject(error);
  }
  return apiClient(config);
});

export async function apiRequest<T>(path: string, options: RequestInit & { skipAuthRefresh?: boolean } = {}): Promise<ApiResult<T>> {
  try {
    const headers = Object.fromEntries(new Headers(options.headers).entries());
    const response = await apiClient.request<T>({
      url: path,
      method: options.method || "GET",
      data: options.body,
      headers,
      signal: options.signal || undefined,
      skipAuthRefresh: options.skipAuthRefresh,
    } as RetryConfig);
    const body = response.data as (T & { message?: string }) | null;
    return {
      ok: true,
      status: response.status,
      data: body,
      message: body && typeof body === "object" && "message" in body ? body.message || "Request completed." : "Request completed.",
    };
  } catch (error) {
    const requestError = error as AxiosError<{ message?: string }>;
    const status = requestError.response?.status || 0;
    const body = requestError.response?.data;
    return {
      ok: false,
      status,
      data: (body ?? null) as T | null,
      message: body?.message || (status ? `Request failed (${status}).` : "Could not reach the backend. Check that it is running and the API URL is correct."),
    };
  }
}

export function apiPath(path: string) {
  return `/appNoti/api${path}`;
}

export function checkSession<T>() {
  return apiRequest<T>(apiPath("/project/v1/getProject"));
}
