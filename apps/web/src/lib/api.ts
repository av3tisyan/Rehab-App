import { useAuthStore } from './auth-store';

/**
 * Resolves the API base URL for the current deployment topology.
 * 1. Explicit VITE_API_URL wins (any custom setup).
 * 2. Production build with no override → relative `/api`. This is the on-prem
 *    setup: a reverse proxy (Caddy) serves the web app and proxies `/api/*` to
 *    the API on the same HTTPS origin.
 * 3. Dev over the LAN → derive from the host the page loaded from, API on :3001
 *    (e.g. a tablet at http://10.0.0.2:5173 → http://10.0.0.2:3001/api).
 */
function resolveApiBase(): string {
  const override = import.meta.env.VITE_API_URL as string | undefined;
  if (override) return `${override.replace(/\/+$/, '')}/api`;
  if (import.meta.env.PROD) return '/api';
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
}

const API_BASE = resolveApiBase();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function rawFetch(path: string, opts: RequestOptions, token: string | null): Promise<Response> {
  return fetch(API_BASE + path, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.auth !== false && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

/** Attempts a one-shot token refresh; returns the new access token or null. */
async function tryRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  const res = await rawFetch('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false }, null);
  if (!res.ok) {
    clear();
    return null;
  }
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  let res = await rawFetch(path, opts, token);

  if (res.status === 401 && opts.auth !== false) {
    const fresh = await tryRefresh();
    if (fresh) res = await rawFetch(path, opts, fresh);
  }

  if (!res.ok) {
    const message = await extractError(res);
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(', ');
    if (data.message) return data.message;
  } catch {
    /* fall through */
  }
  return `Request failed (${res.status})`;
}
