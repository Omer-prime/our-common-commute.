"use client";

import { useState } from "react";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";
import {
  CarFront,
  CreditCard,
  FileText,
} from "lucide-react";

/* -------------------- Types & mock data -------------------- */

type NotificationTab = "all" | "rides" | "payments";

type NotificationItem = {
  id: string;
  category: "ride" | "payment";
  title: string;
  body: string;
  timeAgo: string;
  ctaLabel: string;
  isNew?: boolean;
};

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    category: "ride",
    title: "Driver accepted your ride",
    body: "John M. has accepted your ride request.",
    timeAgo: "5 mins ago",
    ctaLabel: "View ride",
    isNew: true,
  },
  {
    id: "2",
    category: "ride",
    title: "Driver arriving soon",
    body: "Your driver is 2 minutes away.",
    timeAgo: "15 mins ago",
    ctaLabel: "View ride",
    isNew: true,
  },
  {
    id: "3",
    category: "payment",
    title: "Payment processed",
    body: "Your payment of $15.75 was successfully processed.",
    timeAgo: "15 mins ago",
    ctaLabel: "View receipt",
    isNew: true,
  },
  {
    id: "4",
    category: "ride",
    title: "Ride completed",
    body: "Your ride to TechCorp office has been completed.",
    timeAgo: "15 mins ago",
    ctaLabel: "View ride",
    isNew: true,
  },
];

/* ------------------------ Page ------------------------ */

export default function RiderNotificationsPage() {
  const [tab, setTab] = useState<NotificationTab>("all");

  const filtered =
    tab === "all"
      ? NOTIFICATIONS
      : NOTIFICATIONS.filter((n) =>
          tab === "rides" ? n.category === "ride" : n.category === "payment"
        );

  return (
    <RiderDashboardShell>
      <div className="space-y-4">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">
            Notifications
          </h1>
        </div>

        {/* Tabs */}
        <div className="mt-2 flex max-w-xs items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300">
          <TabButton
            label="All"
            isActive={tab === "all"}
            onClick={() => setTab("all")}
          />
          <TabButton
            label="Rides"
            isActive={tab === "rides"}
            onClick={() => setTab("rides")}
          />
          <TabButton
            label="Payments"
            isActive={tab === "payments"}
            onClick={() => setTab("payments")}
          />
        </div>

        {/* Notification list */}
        <div className="mt-2 flex flex-col gap-3 pb-10">
          {filtered.map((item) => (
            <NotificationCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </RiderDashboardShell>
  );
}

/* ---------------------- Tabs ---------------------- */

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-4 py-1.5 text-[11px] font-medium transition-colors ${
        isActive
          ? "bg-[#0B63F4] text-white"
          : "bg-transparent text-slate-400 hover:bg-[#07152f]"
      }`}
    >
      {label}
    </button>
  );
}

/* ------------------- Notification card ------------------- */

function NotificationCard({ item }: { item: NotificationItem }) {
  const Icon =
    item.category === "ride"
      ? CarFront
      : item.category === "payment"
      ? CreditCard
      : FileText;

  return (
    <section className="rounded-2xl border border-[#233358] bg-[#050f25] px-4 py-3 text-xs text-slate-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        {/* Icon + text */}
        <div className="flex flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#101a33]">
            <Icon className="h-4 w-4 text-slate-100" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-100">
              {item.title}
            </div>
            <div className="line-clamp-1 text-[11px] text-slate-400">
              {item.body}
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              {item.timeAgo}
            </div>
          </div>
        </div>

        {/* Right side: New pill + CTA */}
        <div className="flex flex-col items-end justify-between gap-2">
          {item.isNew && (
            <span className="inline-flex items-center rounded-full bg-[#0f172a] px-2 py-0.5 text-[10px] font-medium text-slate-100">
              New
            </span>
          )}
          <button
            type="button"
            className="text-[11px] font-medium text-[#4f8dff] hover:underline"
          >
            {item.ctaLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
