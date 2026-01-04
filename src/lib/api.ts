// src/lib/api.ts

export type ApiFail = {
  status: number;
  error: string;
  details?: unknown;
};

function stripWrappingQuotes(v: string) {
  const s = v.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function normalizeBase(u: string) {
  return stripWrappingQuotes(u).replace(/\/+$/, "");
}

// Prefer API_URL, but allow API_BASE_URL too (so both work)
export const API_URL = (() => {
  const env = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (env && env.trim()) return normalizeBase(env);

  // browser fallback
  if (typeof window !== "undefined") {
    return normalizeBase(`http://${window.location.hostname}:4000`);
  }

  return "http://localhost:4000";
})();

function buildUrl(path: string) {
  if (!path) return API_URL;
  return path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function safeJson(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return { raw: txt };
  }
}

function toApiFail(res: Response, data: any): ApiFail {
  const msg =
    (data && (data.error || data.message)) ||
    `HTTP_${res.status}`;

  return {
    status: res.status,
    error: String(msg),
    details: (data as any)?.details ?? data,
  };
}

/* =========================================================
   apiJson: simple JSON helper (no auth / no refresh)
   ========================================================= */

type ApiJsonOpts = Omit<RequestInit, "body" | "headers"> & {
  headers?: HeadersInit;
  json?: unknown;

  /** default true in browser to prevent 304s */
  noStore?: boolean;
};

export async function apiJson<T>(path: string, opts: ApiJsonOpts = {}): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(opts.headers);

  // Default: prevent 304 caching issues in browser
  const noStore = opts.noStore ?? (typeof window !== "undefined");

  headers.set("Accept", "application/json");
  if (noStore) {
    headers.set("Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
  }

  let body: BodyInit | undefined = undefined;
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  }

  try {
    const res = await fetch(url, {
      ...opts,
      headers,
      body,
      cache: noStore ? "no-store" : opts.cache,
    });

    if (res.status === 204) return null as T;

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) throw toApiFail(res, data);

    return data as T;
  } catch (e: any) {
    if (e && typeof e === "object" && "status" in e && "error" in e) throw e;

    throw {
      status: 0,
      error: "NETWORK_ERROR",
      details: String(e?.message ?? e),
    } satisfies ApiFail;
  }
}

/* =========================================================
   apiFetch: authed fetch + auto refresh on 401
   ========================================================= */

// IMPORTANT: override body typing so you don't accidentally pass objects to `body`
type ApiFetchOpts = Omit<RequestInit, "body" | "headers"> & {
  headers?: HeadersInit;
  body?: BodyInit | null;
  json?: unknown;

  /** default true */
  auth?: boolean;

  /** default true */
  autoRefresh?: boolean;

  /** default true in browser to prevent 304s */
  noStore?: boolean;
};

import { getAuth, updateAccessToken, clearAuth } from "./authStorage";

let refreshing: Promise<string | null> | null = null;

async function refreshOnce(): Promise<string | null> {
  const auth = getAuth();
  if (!auth?.refreshToken) return null;

  const res = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
    },
    cache: "no-store",
    body: JSON.stringify({ refreshToken: auth.refreshToken }),
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const newAccess =
    (data?.accessToken as string | undefined) ||
    (data?.access_token as string | undefined);

  if (!newAccess) return null;

  updateAccessToken(newAccess);
  return newAccess;
}

export async function apiFetch<T>(path: string, opts: ApiFetchOpts = {}): Promise<T> {
  const url = buildUrl(path);

  const headers = new Headers(opts.headers);
  const authOn = opts.auth !== false;
  const autoRefresh = opts.autoRefresh !== false;

  // Default: prevent 304 caching issues in browser
  const noStore = opts.noStore ?? (typeof window !== "undefined");

  headers.set("Accept", "application/json");
  if (noStore) {
    headers.set("Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
  }

  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;

  if (opts.json !== undefined && !isForm) {
    headers.set("Content-Type", "application/json");
  }

  // attach access token if present
  if (authOn) {
    const auth = getAuth();
    if (auth?.accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${auth.accessToken}`);
    }
  }

  const body = opts.json !== undefined && !isForm ? JSON.stringify(opts.json) : opts.body;

  const doRequest = async () => {
    const res = await fetch(url, {
      ...opts,
      headers,
      body,
      cache: noStore ? "no-store" : opts.cache,
    });

    if (res.status === 204) return null as T;

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (!res.ok) throw toApiFail(res, data);

    return data as T;
  };

  try {
    return await doRequest();
  } catch (e: any) {
    const err = e as ApiFail;

    // Access expired -> refresh once -> retry once
    if (authOn && autoRefresh && err?.status === 401) {
      if (!refreshing) {
        refreshing = refreshOnce().finally(() => {
          refreshing = null;
        });
      }

      const newAccess = await refreshing;

      if (!newAccess) {
        clearAuth();
        throw err;
      }

      headers.set("Authorization", `Bearer ${newAccess}`);
      return await doRequest();
    }

    throw e;
  }
}
