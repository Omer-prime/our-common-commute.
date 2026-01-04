const KEY = "occ_auth";

export type Role = "DRIVER" | "RIDER" | "ADMIN";

export type AuthState = {
  user: { id: string; email: string; fullName: string; role: Role };
  accessToken: string;
  refreshToken: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

// ✅ add this import
import { setTokens, clearTokens } from "./authTokens";

export function getAuth(): AuthState | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthState) {
  if (!isBrowser()) return;

  window.localStorage.setItem(KEY, JSON.stringify(auth));

  // ✅ keep old token keys updated too
  setTokens(auth.accessToken, auth.refreshToken);
}

export function updateAccessToken(accessToken: string) {
  const cur = getAuth();
  if (!cur) return;

  const next = { ...cur, accessToken };
  window.localStorage.setItem(KEY, JSON.stringify(next));

  // ✅ keep old token keys updated too
  setTokens(accessToken);
}

export function clearAuth() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(KEY);

  // ✅ clear old token keys too
  clearTokens();
}
