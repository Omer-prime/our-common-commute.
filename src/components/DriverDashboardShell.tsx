"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Home, Clock, CreditCard, LifeBuoy } from "lucide-react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
};

const navItems = [
  { href: "/driver/dashboard", label: "Home", icon: Home },
  { href: "/driver/dashboard/my-rides", label: "My rides", icon: Clock },
  // { href: "/driver/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/driver/dashboard/earnings", label: "Earnings", icon: CreditCard },
  // { href: "/driver/dashboard/support", label: "Support", icon: LifeBuoy },
  { href: "/driver/dashboard/profile", label: "Profile", icon: LifeBuoy },
];

export function DriverDashboardShell({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#020818] text-slate-100">
      {/* Sidebar – desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-[#020414] md:flex">
        {/* Logo row */}
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
          {/* APP LOGO */}
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
            {/* DRIVER SELFIE */}
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-600">
              <Image
                src="/driver-selfie.jpg"
                alt="Driver avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Dennis Petter</span>
              <span className="text-xs text-slate-400">Driver</span>
            </div>
          </div>
          <button className="mt-3 w-full rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700">
            Switch to rider
          </button>
          <button className="mt-2 w-full rounded-lg bg-transparent px-3 py-2 text-xs text-slate-400 hover:bg-slate-800">
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
            <span className="text-sm font-semibold">Driver</span>
          </div>

          {/* Page title (desktop) */}
          <div className="hidden text-sm font-medium text-slate-200 md:block">
            Home
          </div>

          {/* Right side: arrow, bell, profile avatar */}
          <div className="ml-auto flex items-center gap-3">
            {/* Back / arrow button */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700"
            >
              <Image
                src="/top-arrow.png" // <- replace with your arrow icon file
                alt="Back"
                width={16}
                height={16}
                className="object-contain"
              />
            </button>

            {/* Notifications bell */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700"
            >
              <Image
                src="/top-bell.png" // <- replace with your bell icon file
                alt="Notifications"
                width={16}
                height={16}
                className="object-contain"
              />
            </button>

            {/* Driver avatar – goes to profile page */}
            <Link
              href="/driver/dashboard/profile"
              className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-600"
            >
              <Image
                src="/driver-selfie.jpg"
                alt="Driver profile"
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
                <span
                  className={clsx(
                    active ? "text-blue-400" : "text-slate-400"
                  )}
                >
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
