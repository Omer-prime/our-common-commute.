// src/lib/authClient.ts
import { apiJson, type ApiFail } from "./api";
import { getAuth, setAuth, updateAccessToken, clearAuth, type Role, type AuthState } from "./authStorage";



type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  role: Role;
};

type LoginInput = {
  email: string;
  password: string;
  role?: Role; // backend supports optional role
};

type AuthResponse = AuthState & {
  nextPath?: string; // optional for future
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

export async function authedJson<T>(
  path: string,
  opts: RequestInit & { json?: unknown } = {}
) {
  const auth = getAuth();
  if (!auth?.accessToken) throw new Error("NOT_LOGGED_IN");

  const headers = new Headers(opts.headers);
  headers.set("Authorization", `Bearer ${auth.accessToken}`);

  try {
    return await apiJson<T>(path, { ...opts, headers });
  } catch (e) {
    const err = e as ApiFail;

    // Access expired -> refresh once -> retry once
    if (err.status === 401) {
      const newAccess = await refreshAccessToken();
      const retryHeaders = new Headers(opts.headers);
      retryHeaders.set("Authorization", `Bearer ${newAccess}`);
      return await apiJson<T>(path, { ...opts, headers: retryHeaders });
    }

    throw e;
  }
}

export async function me() {
  return authedJson<{
    user: { id: string; email: string; fullName: string; role: Role } | null;
  }>("/me", { method: "GET" });
}

// Reset password flow
export async function forgotPassword(email: string) {
  return apiJson<{ ok: true; otpId?: string; devOtp?: string }>(
    "/auth/forgot-password",
    {
      method: "POST",
      json: { email },
    }
  );
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
