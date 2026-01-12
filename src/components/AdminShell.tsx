// src/components/AdminShell.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

type AdminShellProps = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  iconImage: string;
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", iconImage: "/cute_home.png" },
  { href: "/admin/dashboard/users", label: "Users management", iconImage: "/persons.png" },
  { href: "/admin/dashboard/payments", label: "Payment managements", iconImage: "/payments.png" },
  { href: "/admin/dashboard/ride-cost", label: "Ride cost", iconImage: "/ridecosts.png" },
  { href: "/admin/dashboard/notifications", label: "Notifications", iconImage: "/notifications.png" },
  { href: "/admin/dashboard/content", label: "Content managements", iconImage: "/content-managements.png" },
  { href: "/admin/dashboard/reports", label: "Reports", iconImage: "/reports.png" },
  { href: "/admin/dashboard/settings", label: "Settings", iconImage: "/settings.png" },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent background scroll when drawer is open (mobile)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const nav = useMemo(() => {
    return navItems.map((item) => {
      const isRootDashboard = item.href === "/admin/dashboard";
      const active = isRootDashboard
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(item.href + "/");
      return { ...item, active };
    });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F6FA] text-slate-800">
      {/* TOP BAR (mobile friendly) */}
      <header className="sticky top-0 z-40 bg-[#F5F6FA]/95 backdrop-blur supports-[backdrop-filter]:bg-[#F5F6FA]/70">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-8 sm:pt-6 sm:pb-3">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm sm:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Top label – same vibe as Figma */}
            <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-400">
              Dashboards
            </div>
          </div>

          {/* Small logo on mobile top bar (optional but nice) */}
          <div className="sm:hidden">
            <Image src="/occlogo.jpg" alt="Our Common Commute" width={28} height={28} />
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="flex flex-1">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-[#F5F6FA] sm:flex">
          <div className="flex h-20 items-center justify-center">
            <Image src="/occlogo.jpg" alt="Our Common Commute" width={36} height={36} />
          </div>

          <nav className="flex-1 space-y-2 px-4 py-4 text-[13px]">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                    item.active
                      ? "bg-white text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
                      : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  <div className="relative h-6 w-6 shrink-0">
                    <Image src={item.iconImage} alt="" fill className="object-contain" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        {/* MOBILE DRAWER */}
        <div className={["fixed inset-0 z-50 sm:hidden", open ? "" : "pointer-events-none"].join(" ")}>
          {/* overlay */}
          <div
            onClick={() => setOpen(false)}
            className={[
              "absolute inset-0 bg-slate-950/30 transition-opacity",
              open ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />

          {/* drawer panel */}
          <aside
            className={[
              "absolute left-0 top-0 h-full w-[84%] max-w-[320px] bg-[#F5F6FA] border-r border-slate-200",
              "transition-transform duration-200 ease-out",
              open ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
          >
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Image src="/occlogo.jpg" alt="Our Common Commute" width={34} height={34} />
                <div className="text-[12px] font-semibold text-slate-900">Admin</div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-2 px-4 pb-6 text-[13px]">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                      item.active
                        ? "bg-white text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <div className="relative h-6 w-6 shrink-0">
                      <Image src={item.iconImage} alt="" fill className="object-contain" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </aside>
        </div>

        {/* RIGHT: main dashboard panel */}
        <main className="flex-1 overflow-y-auto px-4 pb-6 sm:px-8 sm:pb-8">
          {/* Big white card like Figma */}
          <div className="min-h-[calc(100vh-96px)] rounded-3xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-100 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
