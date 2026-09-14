import Constants from "expo-constants";

const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "http://localhost:4000/api/v1";

/**
 * localhost only resolves to the backend when running in a web browser or
 * a simulator on the same machine as the API. Testing on a physical device
 * requires setting `extra.apiUrl` in app.json to your machine's LAN IP.
 */

export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
  clearTokens(): void;
}

let tokenStore: TokenStore | null = null;

/** Wired up once by AuthContext so the client can read/refresh tokens without a circular import. */
export function setTokenStore(store: TokenStore) {
  tokenStore = store;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

async function rawRequest(path: string, options: RequestInit, accessToken: string | null): Promise<Response> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(`${API_URL}${path}`, { ...options, headers });
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = tokenStore?.getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    tokenStore?.clearTokens();
    return null;
  }
  const data = await res.json();
  tokenStore?.setTokens(data.accessToken, data.refreshToken);
  return data.accessToken as string;
}

/** Core request helper: attaches the access token, retries once after a silent refresh on 401. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let accessToken = tokenStore?.getAccessToken() ?? null;
  let res = await rawRequest(path, options, accessToken);

  if (res.status === 401 && tokenStore?.getRefreshToken()) {
    accessToken = await tryRefresh();
    if (accessToken) {
      res = await rawRequest(path, options, accessToken);
    }
  }

  if (!res.ok) {
    let body: { error?: string; details?: unknown } | null = null;
    try {
      body = await res.json();
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function apiUpload<T>(path: string, form: FormData): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body: form });
}
