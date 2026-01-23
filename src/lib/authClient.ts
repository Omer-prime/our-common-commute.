// src/lib/authClient.ts
import { apiJson, type ApiFail } from "./api";
import {
  getAuth,
  setAuth,
  updateAccessToken,
  clearAuth,
  type Role,
  type AuthState,
} from "./authStorage";

type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
};

type LoginInput = {
  email: string;
  password: string;
  role?: Role;
};

type AuthResponse = AuthState & {
  nextPath?: string;
};

export async function signup(input: SignupInput) {
  const res = await apiJson<AuthResponse>("/auth/signup", { method: "POST", json: input });
  setAuth({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken });
  return res;
}

export async function login(input: LoginInput) {
  const res = await apiJson<AuthResponse>("/auth/login", { method: "POST", json: input });
  setAuth({ user: res.user, accessToken: res.accessToken, refreshToken: res.refreshToken });
  return res;
}

export async function refreshAccessToken() {
  const auth = getAuth();
  if (!auth?.refreshToken) throw new Error("NO_REFRESH_TOKEN");

  const res = await apiJson<{ accessToken: string }>("/auth/refresh", {
    method: "POST",
    json: { refreshToken: auth.refreshToken },
  });

  updateAccessToken(res.accessToken);
  return res.accessToken;
}

export async function logout() {
  const auth = getAuth();

  if (auth?.refreshToken) {
    try {
      await apiJson("/auth/logout", {
        method: "POST",
        json: { refreshToken: auth.refreshToken },
      });
    } catch {
      // ignore
    }
  }

  clearAuth();
}

// ✅ helper: always return plain-object headers (safe for any apiJson implementation)
function headersToObject(init?: HeadersInit) {
  const h = new Headers(init || undefined);
  const obj: Record<string, string> = {};
  h.forEach((v, k) => (obj[k] = v));
  return obj;
}

export async function authedJson<T>(path: string, opts: RequestInit & { json?: unknown } = {}) {
  const auth = getAuth();
  if (!auth?.accessToken) throw new Error("NOT_LOGGED_IN");

  // build headers safely (plain object)
  const h = new Headers(opts.headers || undefined);
  h.set("Authorization", `Bearer ${auth.accessToken}`);

  // if using opts.json, ensure content-type exists
  if (opts.json !== undefined && !h.get("Content-Type")) {
    h.set("Content-Type", "application/json");
  }

  const headersObj = headersToObject(h);

  try {
    return await apiJson<T>(path, { ...opts, headers: headersObj });
  } catch (e) {
    const err = e as ApiFail;

    // Access expired -> refresh once -> retry once
    if (err.status === 401) {
      const newAccess = await refreshAccessToken();

      const h2 = new Headers(opts.headers || undefined);
      h2.set("Authorization", `Bearer ${newAccess}`);
      if (opts.json !== undefined && !h2.get("Content-Type")) {
        h2.set("Content-Type", "application/json");
      }

      const retryHeadersObj = headersToObject(h2);
      return await apiJson<T>(path, { ...opts, headers: retryHeadersObj });
    }

    throw e;
  }
}

export async function me() {
  return authedJson<{
    user: { id: string; email: string; fullName: string; role: Role } | null;
  }>("/me", { method: "GET" });
}

export async function forgotPassword(email: string) {
  return apiJson<{ ok: true; otpId?: string; devOtp?: string }>("/auth/forgot-password", {
    method: "POST",
    json: { email },
  });
}

export async function verifyResetOtp(email: string, otp: string) {
  return apiJson<{ resetToken: string }>("/auth/verify-reset-otp", {
    method: "POST",
    json: { email, otp },
  });
}

export async function resetPassword(resetToken: string, newPassword: string) {
  return apiJson<{ ok: true }>("/auth/reset-password", {
    method: "POST",
    json: { resetToken, newPassword },
  });
}
