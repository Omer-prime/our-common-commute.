// src/app/admin/dashboard/notifications/page.tsx
"use client";

import { useEffect, useMemo, useState, FormEvent, type ReactNode } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  X,
  MoreHorizontal,
  Bell,
  CalendarClock,
  AlertTriangle,
  Users,
} from "lucide-react";
import { authedJson } from "@/src/lib/authClient";

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
  scheduledFor: string | null; // ISO
  sentAt: string | null; // ISO
  createdAt: string; // ISO
};

type OverviewRes = {
  ok: true;
  stats: {
    totalNotifications: number;
    scheduledNotifications: number;
    failedDeliveries: number;
    totalUsersReached: number;
  };
};

type ListRes = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  rows: NotificationRow[];
};

type CreateNotificationPayload = {
  title: string;
  body: string;
  recipient: NotificationTarget;
  channel: NotificationChannel;
  scheduleEnabled: boolean;
  dateTime?: string; // datetime-local
};

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const q = useMemo(() => searchQuery.trim(), [searchQuery]);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [overview, setOverview] = useState<OverviewRes | null>(null);
  const [list, setList] = useState<ListRes | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const [ov, li] = await Promise.all([
        authedJson<OverviewRes>(`/admin/notifications/overview`, { method: "GET" }),
        authedJson<ListRes>(
          `/admin/notifications?tab=${encodeURIComponent(activeTab)}&q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
          { method: "GET" }
        ),
      ]);

      setOverview(ov);
      setList(li);
    } catch (e: any) {
      setErr(e?.message || "Failed to load notifications.");
      setOverview(null);
      setList(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, q, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, q]);

  const total = list?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleCreateNotification = async (payload: CreateNotificationPayload) => {
    // convert datetime-local -> ISO for backend (stable timezone handling)
    const isoDate = payload.scheduleEnabled && payload.dateTime ? new Date(payload.dateTime).toISOString() : undefined;

    await authedJson(`/admin/notifications`, {
      method: "POST",
      json: {
        title: payload.title,
        body: payload.body,
        recipient: payload.recipient,
        channel: payload.channel,
        scheduleEnabled: payload.scheduleEnabled,
        dateTime: isoDate,
      },
    });

    setIsCreateOpen(false);
    await load();
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">Notifications</h1>

          <div className="relative mx-auto flex-1 max-w-[560px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>
        </div>

        {/* Error banner */}
        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-xs text-red-700">
            <div className="font-semibold">Failed to load notifications</div>
            <div className="mt-1">{err}</div>
            <button
              onClick={load}
              className="mt-3 inline-flex rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* TOP STATS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total notifications"
            value={loading ? "..." : String(overview?.stats.totalNotifications ?? 0)}
            icon={<Bell className="h-5 w-5 text-slate-500" />}
          />
          <StatCard
            title="Scheduled notifications"
            value={loading ? "..." : String(overview?.stats.scheduledNotifications ?? 0)}
            icon={<CalendarClock className="h-5 w-5 text-slate-500" />}
          />
          <StatCard
            title="Failed deliveries"
            value={loading ? "..." : String(overview?.stats.failedDeliveries ?? 0)}
            icon={<AlertTriangle className="h-5 w-5 text-slate-500" />}
          />
          <StatCard
            title="Total users reached"
            value={loading ? "..." : String(overview?.stats.totalUsersReached ?? 0)}
            icon={<Users className="h-5 w-5 text-slate-500" />}
          />
        </div>

        {/* TABLE CARD */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Tabs */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-200/80"
                  }`}
              >
                All notifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("scheduled")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${activeTab === "scheduled"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                  }`}
              >
                Scheduled
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
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

          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-100">
            {!loading && (list?.rows?.length ?? 0) === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] text-slate-400">No notifications found.</div>
            ) : (
              <NotificationsTable rows={list?.rows ?? []} />
            )}
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              Page <span className="font-medium text-slate-700">{list?.page ?? 1}</span> of{" "}
              <span className="font-medium text-slate-700">{totalPages}</span> · Total{" "}
              <span className="font-medium text-slate-700">{total}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {isCreateOpen && (
        <CreateNotificationModal onClose={() => setIsCreateOpen(false)} onCreate={handleCreateNotification} />
      )}
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  SMALL COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

function StatCard(props: { title: string; value: string; icon: ReactNode }) {
  const { title, value, icon } = props;
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[10px] text-slate-400">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>

      <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50">{icon}</div>
    </div>
  );
}

function NotificationsTable({ rows }: { rows: NotificationRow[] }) {
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
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
        {rows.map((row) => {
          const idShort = `#${row.id.slice(0, 10)}`;
          const scheduledTime = row.status === "Completed" ? "Sent" : row.scheduledFor ? fmtDate(row.scheduledFor) : "-";

          return (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-2">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
              </td>
              <td className="px-4 py-2 align-middle">{idShort}</td>
              <td className="px-4 py-2 align-middle">{row.title}</td>
              <td className="px-4 py-2 align-middle">{row.type}</td>
              <td className="px-4 py-2 align-middle">{row.target}</td>
              <td className="px-4 py-2 align-middle">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-medium ${row.status === "Completed"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-2 align-middle">{scheduledTime}</td>
              <td className="px-4 py-2 align-middle text-right">
                <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100">
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ------------------------ Create Notification Modal ---------------------- */

function CreateNotificationModal(props: {
  onClose: () => void;
  onCreate: (payload: CreateNotificationPayload) => Promise<void>;
}) {
  const { onClose, onCreate } = props;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipient, setRecipient] = useState<NotificationTarget>("Drivers");
  const [channel, setChannel] = useState<NotificationChannel>("Push");
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [dateTime, setDateTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !body.trim()) {
      setError("Title and message body are required.");
      return;
    }
    if (scheduleEnabled && !dateTime) {
      setError("Please select date and time.");
      return;
    }

    try {
      setSaving(true);
      await onCreate({
        title,
        body,
        recipient,
        channel,
        scheduleEnabled,
        dateTime: scheduleEnabled ? dateTime : undefined,
      });

      setTitle("");
      setBody("");
      setDateTime("");
      setScheduleEnabled(true);
      setRecipient("Drivers");
      setChannel("Push");
    } catch (e: any) {
      setError(e?.message || "Failed to create notification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">Add notifications</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">Message body</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">Select Recipient</label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value as NotificationTarget)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              >
                <option value="Drivers">Drivers</option>
                <option value="Riders">Riders</option>
                <option value="All users">All users</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">Select Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as NotificationChannel)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              >
                <option value="Push">Push</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setScheduleEnabled((prev) => !prev)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${scheduleEnabled ? "bg-[#2563FF]" : "bg-slate-300"
                }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${scheduleEnabled ? "translate-x-3" : "translate-x-0.5"
                  }`}
              />
            </button>
            <span className="text-[11px] text-slate-700">Schedule notifications</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">Date and Time</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              disabled={!scheduleEnabled}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          {error ? <p className="text-[10px] text-red-500">{error}</p> : null}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center rounded-lg bg-[#2563FF] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create notifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
