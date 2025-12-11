// src/components/AdminShell.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

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

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F6FA] text-slate-800">
      {/* Top label – same as Figma */}
      <header className="px-8 pt-6 pb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-slate-400">
        Dashboards
      </header>

      {/* Layout: sidebar attached to left, content on the right */}
      <div className="flex flex-1">
        {/* LEFT: sidebar – full height, attached to page sides */}
        <aside className="flex w-64 flex-col border-r border-slate-200 bg-[#F5F6FA]">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center">
            <Image
              src="/occlogo.jpg"
              alt="Our Common Commute"
              width={36}
              height={36}
            />
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-2 px-4 py-4 text-[13px]">
            {navItems.map((item) => {
              // Only mark Dashboard active on exact route.
              // All other items can be active on nested routes as well.
              const isRootDashboard = item.href === "/admin/dashboard";

              const active = isRootDashboard
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                      active
                        ? "bg-white text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="relative h-6 w-6">
                      <Image
                        src={item.iconImage}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* RIGHT: main dashboard panel */}
        <main className="flex-1 overflow-y-auto px-8 pb-8">
          {/* Big white card like Figma */}
          <div className="min-h-[calc(100vh-96px)] rounded-3xl bg-white px-6 py-6 shadow-sm ring-1 ring-slate-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
