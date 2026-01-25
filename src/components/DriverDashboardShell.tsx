"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Home, Clock, CreditCard, LifeBuoy, Bell } from "lucide-react";
import clsx from "clsx";
import { apiFetch, API_URL, type ApiFail } from "@/src/lib/api";

type Props = {
  children: ReactNode;
};

const navItems = [
  { href: "/driver/dashboard", label: "Home", icon: Home },
  { href: "/driver/dashboard/my-rides", label: "My rides", icon: Clock },
  { href: "/driver/dashboard/earnings", label: "Earnings", icon: CreditCard },
  { href: "/driver/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/driver/dashboard/profile", label: "Profile", icon: LifeBuoy },
];

type ProfileRes = {
  ok: true;
  driver: {
    name: string;
    avatarUrl?: string | null;
    email?: string;
  };
};

type NotificationsListRes = {
  ok: true;
  unreadCount: number;
  nextCursor: string | null;
  notifications: any[];
};

const DRIVER_PROFILE_CHANGED_EVENT = "occ:driver-profile-changed";

function apiErrorToText(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.status === 401) return "Unauthorized. Please login again.";
  if (err?.error) return `${err.error}${err.status ? ` (HTTP ${err.status})` : ""}`;
  return "Something went wrong.";
}

function assetUrl(u?: string | null) {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_URL}${u}`;
  return `${API_URL}/${u}`;
}

function clearAuthTokens() {
  if (typeof window === "undefined") return;
  const keys = ["accessToken", "access_token", "token", "authToken", "jwt", "ACCESS_TOKEN", "refreshToken", "refresh_token"];
  for (const k of keys) {
    window.localStorage.removeItem(k);
    window.sessionStorage.removeItem(k);
  }
}

export function DriverDashboardShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [driverName, setDriverName] = useState("—");
  const [driverAvatar, setDriverAvatar] = useState<string>("/driver-selfie.jpg");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [shellError, setShellError] = useState<string | null>(null);

  const pageTitle = useMemo(() => {
    const sorted = [...navItems].sort((a, b) => b.href.length - a.href.length);
    const found = sorted.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
    return found?.label ?? "Driver";
  }, [pathname]);

  async function loadProfileSummary() {
    try {
      const data = await apiFetch<ProfileRes>("/driver/profile", { method: "GET", noStore: true });
      setDriverName(data.driver?.name ?? "—");
      setDriverAvatar(assetUrl(data.driver?.avatarUrl) ?? "/driver-selfie.jpg");
      setShellError(null);
    } catch (e) {
      setShellError(apiErrorToText(e));
    }
  }

  async function loadUnreadCount() {
    try {
      const data = await apiFetch<NotificationsListRes>("/driver/notifications?limit=1", {
        method: "GET",
        noStore: true,
      });
      setUnreadCount(Number.isFinite(data.unreadCount) ? data.unreadCount : 0);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void loadProfileSummary();
    void loadUnreadCount();

    // notifications polling
    const notifInterval = window.setInterval(() => {
      void loadUnreadCount();
    }, 25000);

    // profile polling (light)
    const profileInterval = window.setInterval(() => {
      void loadProfileSummary();
    }, 60000);

    // allow pages to force-refresh badge
    const notificationsHandler = () => void loadUnreadCount();
    window.addEventListener("occ:notifications-changed", notificationsHandler);

    // profile changed event (avatar/name updates instantly)
    const profileHandler = () => void loadProfileSummary();
    window.addEventListener(DRIVER_PROFILE_CHANGED_EVENT, profileHandler);

    return () => {
      window.clearInterval(notifInterval);
      window.clearInterval(profileInterval);
      window.removeEventListener("occ:notifications-changed", notificationsHandler);
      window.removeEventListener(DRIVER_PROFILE_CHANGED_EVENT, profileHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    try {
      await apiFetch<{ ok: true }>("/driver/profile/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      clearAuthTokens();
      router.push("/driver/login");
    }
  }

  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);
  const isNotificationsActive =
    pathname === "/driver/dashboard/notifications" || pathname.startsWith("/driver/dashboard/notifications/");

  return (
    <div className="flex min-h-screen bg-[#020818] text-slate-100">
      {/* Sidebar – desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-[#020414] md:flex">
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-slate-900">
            <Image src="/occ-logo.png" alt="Our Common Commute logo" fill className="object-contain p-1" />
          </div>
          <span className="text-sm font-semibold text-slate-50">Our Common Commute</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const isNotifications = item.href === "/driver/dashboard/notifications";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                  active ? "bg-blue-600/20 text-blue-400" : "text-slate-300 hover:bg-slate-800/70"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>

                {isNotifications && unreadCount > 0 && (
                  <span className="ml-auto inline-flex min-w-[22px] items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {badgeText}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-3 py-4">
          {shellError && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              {shellError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-600">
              <img src={driverAvatar} alt="Driver avatar" className="h-full w-full object-cover" />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium">{driverName}</span>
              <span className="text-xs text-slate-400">Driver</span>
            </div>
          </div>

          <button className="mt-3 w-full rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">
            Switch to rider
          </button>

          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg bg-transparent px-3 py-2 text-xs text-slate-400 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-[#020414] px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-slate-900">
              <Image src="/occ-logo.png" alt="Our Common Commute logo" fill className="object-contain p-1" />
            </div>
            <span className="text-sm font-semibold">{pageTitle}</span>
          </div>

          <div className="hidden text-sm font-medium text-slate-200 md:block">{pageTitle}</div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/driver/dashboard/notifications"
              className={clsx(
                "relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700",
                isNotificationsActive && "border-blue-500/50 bg-blue-600/15"
              )}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className={clsx("h-4 w-4", isNotificationsActive || unreadCount > 0 ? "text-blue-300" : "text-slate-200")} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {badgeText}
                </span>
              )}
            </Link>

            <Link
              href="/driver/dashboard/profile"
              className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-600"
              aria-label="Profile"
              title="Profile"
            >
              <img src={driverAvatar} alt="Driver profile" className="h-full w-full object-cover" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#020818] px-3 py-4 md:px-6 md:py-6">{children}</main>

        <nav className="sticky bottom-0 z-20 flex h-14 items-center justify-around border-t border-slate-800 bg-[#020414] px-3 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const isNotifications = item.href === "/driver/dashboard/notifications";

            return (
              <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-0.5 text-[11px]">
                <Icon className={clsx("h-4 w-4", active ? "text-blue-400" : "text-slate-400")} />

                {isNotifications && unreadCount > 0 && (
                  <span className="absolute right-1 top-0 inline-flex min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 py-[1px] text-[9px] font-semibold text-white">
                    {badgeText}
                  </span>
                )}

                <span className={clsx(active ? "text-blue-400" : "text-slate-400")}>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
