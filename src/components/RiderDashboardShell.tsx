"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Home, Clock, CreditCard, LifeBuoy } from "lucide-react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
};

const navItems = [
  { href: "/rider/dashboard", label: "Home", icon: Home },
  { href: "/rider/dashboard/my-rides", label: "My rides", icon: Clock },
  { href: "/rider/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/rider/dashboard/support", label: "Support", icon: LifeBuoy },
];

function getBackendBaseUrl() {
  let base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  base = base.replace(/\/+$/, "");
  if (!base) return "http://localhost:4000";
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const keys = ["accessToken", "token", "access_token", "jwt", "authToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", token);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("refreshToken");
  return v && v.trim() ? v.trim() : null;
}

function clearAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  // also clear common variants (just in case)
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("jwt");
  localStorage.removeItem("authToken");
}

type JwtPayload = {
  exp?: number;
  role?: "RIDER" | "DRIVER" | "ADMIN";
  sub?: string;
  userId?: string;
  id?: string;
};

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const p = decodeJwt(token);
  if (!p?.exp) return false; // if exp missing, treat as not-expired
  const nowSec = Math.floor(Date.now() / 1000);
  return p.exp <= nowSec;
}

async function postJsonFirstWorking(
  base: string,
  paths: string[],
  body: any
): Promise<Response> {
  let lastErr: any = null;

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // If route doesn't exist, try next
      if (res.status === 404) continue;

      return res;
    } catch (e) {
      lastErr = e;
    }
  }

  // If all failed, throw last error
  throw lastErr ?? new Error("No auth endpoint matched");
}

async function refreshAccessToken(): Promise<string | null> {
  const base = getBackendBaseUrl();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await postJsonFirstWorking(
    base,
    ["/api/auth/refresh", "/auth/refresh", "/api/refresh"],
    { refreshToken }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { accessToken?: string };
  if (!data?.accessToken) return null;

  setAccessToken(data.accessToken);
  return data.accessToken;
}

async function logoutBackendBestEffort(): Promise<void> {
  const base = getBackendBaseUrl();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;

  try {
    await postJsonFirstWorking(
      base,
      ["/api/auth/logout", "/auth/logout", "/api/logout"],
      { refreshToken }
    );
  } catch {
    // ignore (best-effort)
  }
}

export function RiderDashboardShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [sessionChecked, setSessionChecked] = useState(false);

  const pageTitle = useMemo(() => {
    const item = navItems.find((n) => n.href === pathname);
    return item?.label ?? "Home";
  }, [pathname]);

  const forceLogout = useCallback(
    async (reason?: string) => {
      // Optional: console log reason
      if (reason) console.warn("[logout]", reason);

      await logoutBackendBestEffort();
      clearAuthStorage();
      router.replace("/rider/login"); // adjust if your rider login path is different
    },
    [router]
  );

  // ✅ Real-time session guard (runs on load + route change)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = getAccessToken();
        const refresh = getRefreshToken();

        // No tokens at all
        if (!token && !refresh) {
          if (!cancelled) await forceLogout("missing tokens");
          return;
        }

        // If access token missing or expired -> refresh
        let effectiveToken = token;
        if (!effectiveToken || isTokenExpired(effectiveToken)) {
          const newToken = await refreshAccessToken();
          if (!newToken) {
            if (!cancelled) await forceLogout("refresh failed");
            return;
          }
          effectiveToken = newToken;
        }

        // Role enforcement (fixes your 403 everywhere)
        const payload = decodeJwt(effectiveToken);
        const role = payload?.role;

        if (role && role !== "RIDER") {
          if (!cancelled) await forceLogout(`role mismatch: ${role}`);
          return;
        }

        if (!cancelled) setSessionChecked(true);
      } catch {
        if (!cancelled) await forceLogout("session check error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, forceLogout]);

  // ✅ Multi-tab logout sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken" || e.key === "refreshToken") {
        const token = getAccessToken();
        const refresh = getRefreshToken();
        if (!token && !refresh) {
          router.replace("/rider/login");
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  const handleLogoutClick = async () => {
    await forceLogout("manual logout");
  };

  const handleSwitchToDriver = async () => {
    // safest: clear rider tokens then go to driver login
    await logoutBackendBestEffort();
    clearAuthStorage();
    router.replace("/driver/login"); // adjust if your driver login path differs
  };

  // Optional: prevent flashing UI before auth check finishes
  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020818] text-slate-200">
        <div className="text-sm">Checking session…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#020818] text-slate-100">
      {/* Sidebar – desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-[#020414] md:flex">
        {/* Logo row */}
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-slate-900">
            <Image
              src="/occ-logo.png"
              alt="Our Common Commute logo"
              fill
              className="object-contain p-1"
            />
          </div>
          <span className="text-sm font-semibold text-slate-50">
            Our Common Commute
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                  active
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-300 hover:bg-slate-800/70"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-800 px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-600">
              <Image
                src="/driver-selfie.jpg"
                alt="Rider avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Rider</span>
              <span className="text-xs text-slate-400">Rider</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSwitchToDriver}
            className="mt-3 w-full rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
          >
            Switch to driver
          </button>

          <button
            type="button"
            onClick={handleLogoutClick}
            className="mt-2 w-full rounded-lg bg-transparent px-3 py-2 text-xs text-slate-400 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-[#020414] px-4 py-3 md:px-6">
          {/* Mobile mini logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-slate-900">
              <Image
                src="/occ-logo.png"
                alt="Our Common Commute logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <span className="text-sm font-semibold">Rider</span>
          </div>

          {/* Page title (desktop) */}
          <div className="hidden text-sm font-medium text-slate-200 md:block">
            {pageTitle}
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/rider/dashboard/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700"
            >
              <Image src="/top-bell.png" alt="Notifications" width={16} height={16} />
            </Link>

            <Link
              href="/rider/dashboard/profile"
              className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-600"
            >
              <Image
                src="/driver-selfie.jpg"
                alt="Rider profile"
                fill
                className="object-cover"
              />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#020818] px-3 py-4 md:px-6 md:py-6">
          {children}
        </main>

        {/* Bottom nav – mobile */}
        <nav className="sticky bottom-0 z-20 flex h-14 items-center justify-around border-t border-slate-800 bg-[#020414] px-3 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 text-[11px]"
              >
                <Icon
                  className={clsx(
                    "h-4 w-4",
                    active ? "text-blue-400" : "text-slate-400"
                  )}
                />
                <span className={clsx(active ? "text-blue-400" : "text-slate-400")}>
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
