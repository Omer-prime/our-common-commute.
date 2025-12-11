// src/app/admin/notifications/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  X,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type NotificationTab = "all" | "scheduled";

type NotificationStatus = "Pending" | "Completed";

type NotificationTarget = "Drivers" | "Riders" | "All users";
type NotificationChannel = "Push" | "Email" | "SMS";

type NotificationRow = {
  id: string;
  title: string;
  type: NotificationChannel;
  target: NotificationTarget;
  status: NotificationStatus;
  scheduledTime: string;
};

type CreateNotificationPayload = {
  title: string;
  body: string;
  recipient: NotificationTarget;
  channel: NotificationChannel;
  scheduleEnabled: boolean;
  dateTime?: string;
};

/* -------------------------------------------------------------------------- */
/*  MOCK DATA                                                                 */
/* -------------------------------------------------------------------------- */

const initialNotifications: NotificationRow[] = [
  {
    id: "#74568335",
    title: "System Maintenance",
    type: "Push",
    target: "Drivers",
    status: "Completed",
    scheduledTime: "Sent",
  },
  {
    id: "#74568336",
    title: "System Maintenance",
    type: "Email",
    target: "Riders",
    status: "Pending",
    scheduledTime: "20-10-2025",
  },
  {
    id: "#74568337",
    title: "System Maintenance",
    type: "Push",
    target: "Riders",
    status: "Pending",
    scheduledTime: "20-10-2025",
  },
  {
    id: "#74568338",
    title: "System Maintenance",
    type: "Push",
    target: "Drivers",
    status: "Pending",
    scheduledTime: "20-10-2025",
  },
  {
    id: "#74568339",
    title: "System Maintenance",
    type: "Push",
    target: "Riders",
    status: "Pending",
    scheduledTime: "20-10-2025",
  },
  {
    id: "#74568340",
    title: "System Maintenance",
    type: "Push",
    target: "Drivers",
    status: "Pending",
    scheduledTime: "20-10-2025",
  },
  {
    id: "#74568341",
    title: "System Maintenance",
    type: "Push",
    target: "Drivers",
    status: "Pending",
    scheduledTime: "20-10-2025",
  },
];

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] =
    useState<NotificationRow[]>(initialNotifications);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredNotifications = notifications.filter((row) => {
    if (activeTab === "scheduled" && row.status !== "Pending") {
      return false;
    }

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      row.id.toLowerCase().includes(q) ||
      row.title.toLowerCase().includes(q) ||
      row.type.toLowerCase().includes(q) ||
      row.target.toLowerCase().includes(q)
    );
  });

  const handleCreateNotification = (payload: CreateNotificationPayload) => {
    const id = `#${Math.floor(Date.now() / 1000)}`;

    const scheduledTime =
      payload.scheduleEnabled && payload.dateTime
        ? new Date(payload.dateTime).toLocaleDateString("en-GB") // 20/10/2025
        : "Sent";

    const status: NotificationStatus = payload.scheduleEnabled
      ? "Pending"
      : "Completed";

    const newRow: NotificationRow = {
      id,
      title: payload.title || "Untitled notification",
      type: payload.channel,
      target: payload.recipient,
      status,
      scheduledTime,
    };

    setNotifications((prev) => [newRow, ...prev]);
    setIsCreateOpen(false);
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER: title + centered search */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">
            Notifications
          </h1>

          <div className="relative mx-auto flex-1 max-w-[560px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>
        </div>

        {/* TOP STATS ROW */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total notifications"
            value="1082"
            trendImage="/Vector (1).png"
          />
          <StatCard
            title="Scheduled notifications"
            value="203"
            trendImage="/Vector 41.png"
          />
          <StatCard
            title="Failed deliveries"
            value="592"
            trendImage="/Vector (4).png"
          />
          <StatCard
            title="Total users reached"
            value="123"
            trendImage="/Vector 41 (1).png"
          />
        </div>

        {/* TABLE CARD */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          {/* Tabs + search + filter + button */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Tabs */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                }`}
              >
                All notifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("scheduled")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${
                  activeTab === "scheduled"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                }`}
              >
                Scheduled
              </button>
            </div>

            {/* Search + filter + CTA */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-44">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
                />
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
              >
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center rounded-lg bg-[#2563FF] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Create notification
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-100">
            <NotificationsTable rows={filteredNotifications} />
          </div>
        </section>
      </div>

      {isCreateOpen && (
        <CreateNotificationModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateNotification}
        />
      )}
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  SMALL COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

function StatCard(props: {
  title: string;
  value: string;
  trendImage: string;
}) {
  const { title, value, trendImage } = props;
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[10px] text-slate-400">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>
      <Image
        src={trendImage}
        alt=""
        width={70}
        height={32}
        className="h-8 w-auto"
      />
    </div>
  );
}

function NotificationsTable({ rows }: { rows: NotificationRow[] }) {
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
          </th>
          <th className="px-4 py-2 font-medium">Notification ID</th>
          <th className="px-4 py-2 font-medium">Notification title</th>
          <th className="px-4 py-2 font-medium">Type</th>
          <th className="px-4 py-2 font-medium">Target audience</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium">Scheduled time</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
            </td>
            <td className="px-4 py-2 align-middle">{row.id}</td>
            <td className="px-4 py-2 align-middle">{row.title}</td>
            <td className="px-4 py-2 align-middle">{row.type}</td>
            <td className="px-4 py-2 align-middle">{row.target}</td>
            <td className="px-4 py-2 align-middle">
              <span
                className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-medium ${
                  row.status === "Completed"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {row.status}
              </span>
            </td>
            <td className="px-4 py-2 align-middle">{row.scheduledTime}</td>
            <td className="px-4 py-2 align-middle text-right">
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
              >
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------ Create Notification Modal ---------------------- */

function CreateNotificationModal(props: {
  onClose: () => void;
  onCreate: (payload: CreateNotificationPayload) => void;
}) {
  const { onClose, onCreate } = props;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipient, setRecipient] =
    useState<NotificationTarget>("Drivers");
  const [channel, setChannel] = useState<NotificationChannel>("Push");
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [dateTime, setDateTime] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onCreate({
      title,
      body,
      recipient,
      channel,
      scheduleEnabled,
      dateTime: scheduleEnabled ? dateTime : undefined,
    });

    // reset local form state (optional)
    setTitle("");
    setBody("");
    setDateTime("");
    setScheduleEnabled(true);
    setRecipient("Drivers");
    setChannel("Push");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            Add notifications
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          {/* Message body */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">
              Message body
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          {/* Recipient + Channel */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Select Recipient
              </label>
              <select
                value={recipient}
                onChange={(e) =>
                  setRecipient(e.target.value as NotificationTarget)
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              >
                <option value="Drivers">Drivers</option>
                <option value="Riders">Riders</option>
                <option value="All users">All users</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Select Channel
              </label>
              <select
                value={channel}
                onChange={(e) =>
                  setChannel(e.target.value as NotificationChannel)
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              >
                <option value="Push">Push</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
          </div>

          {/* Schedule toggle */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setScheduleEnabled((prev) => !prev)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                scheduleEnabled ? "bg-[#2563FF]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                  scheduleEnabled ? "translate-x-3" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-[11px] text-slate-700">
              Schedule notifications
            </span>
          </div>

          {/* Date & time */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">
              Date and Time
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              disabled={!scheduleEnabled}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          {/* Footer button */}
          <div className="pt-2">
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-lg bg-[#2563FF] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Create notifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
