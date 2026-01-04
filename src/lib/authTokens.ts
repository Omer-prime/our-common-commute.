const A = "accessToken";
const R = "refreshToken";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(A);
}
export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(R);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(A, accessToken);
  if (refreshToken) localStorage.setItem(R, refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(A);
  localStorage.removeItem(R);
}
