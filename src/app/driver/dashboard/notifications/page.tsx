"use client";

import { useEffect, useMemo, useState } from "react";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { apiFetch, type ApiFail } from "@/src/lib/api";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Dot,
  MessageCircle,
  Shield,
  User,
  X,
} from "lucide-react";

type NotificationSource = "RIDER" | "ADMIN" | "SYSTEM";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  source: NotificationSource;
  actionUrl?: string | null;
  data?: unknown;
  createdAt: string;
  createdAgo?: string;
  readAt: string | null;
  sourceUser: { id: string; fullName: string; role: "DRIVER" | "RIDER" | "ADMIN" } | null;
};

type ListRes = {
  ok: true;
  unreadCount: number;
  nextCursor: string | null;
  notifications: NotificationItem[];
};

function apiErrorToText(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.status === 401) return "Unauthorized. Please login again.";
  if (err?.error) return `${err.error}${err.status ? ` (HTTP ${err.status})` : ""}`;
  return "Something went wrong.";
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function SourceIcon({ source }: { source: NotificationSource }) {
  if (source === "RIDER") return <MessageCircle className="h-4 w-4 text-blue-300" />;
  if (source === "ADMIN") return <Shield className="h-4 w-4 text-amber-300" />;
  return <Bell className="h-4 w-4 text-slate-300" />;
}

function sourceLabel(n: NotificationItem) {
  if (n.source === "RIDER") return n.sourceUser?.fullName ? `Rider: ${n.sourceUser.fullName}` : "Rider";
  if (n.source === "ADMIN") return n.sourceUser?.fullName ? `Admin: ${n.sourceUser.fullName}` : "Admin";
  return "System";
}

export default function DriverNotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all");

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const visible = useMemo(() => items, [items]);

  async function load(reset = true) {
    setError(null);
    if (reset) {
      setLoading(true);
      setCursor(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const qs = new URLSearchParams();
      qs.set("limit", "20");
      if (!reset && cursor) qs.set("cursor", cursor);
      if (tab === "unread") qs.set("unread", "1");

      const res = await apiFetch<ListRes>(`/driver/notifications?${qs.toString()}`, {
        method: "GET",
        noStore: true,
      });

      setUnreadCount(res.unreadCount);

      if (reset) setItems(res.notifications);
      else setItems((prev) => [...prev, ...res.notifications]);

      setCursor(res.nextCursor);
      setHasMore(!!res.nextCursor);
    } catch (e) {
      setError(apiErrorToText(e));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function markRead(id: string) {
    // optimistic
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await apiFetch<{ ok: true }>(`/driver/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // if failed, refresh
      void load(true);
    }
  }

  async function markAllRead() {
    // optimistic
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    setUnreadCount(0);

    try {
      await apiFetch<{ ok: true }>(`/driver/notifications/read-all`, { method: "PATCH" });
    } catch {
      void load(true);
    }
  }

  function openNotification(n: NotificationItem) {
    setSelected(n);
    if (!n.readAt) void markRead(n.id);
  }

  return (
    <DriverDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#050f25]">
              <Bell className="h-4 w-4 text-slate-200" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100">Notifications</h1>
              <p className="text-[11px] text-slate-400">
                Updates from riders, admins and system events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-xl border border-slate-800 bg-[#07152f] p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setTab("all")}
                className={`rounded-lg px-3 py-2 font-medium ${
                  tab === "all" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-[#050f25]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTab("unread")}
                className={`rounded-lg px-3 py-2 font-medium ${
                  tab === "unread" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-[#050f25]"
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-slate-100">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[#07152f] px-4 py-2 text-[11px] font-medium text-slate-200 hover:bg-[#050f25]"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex rounded-xl border border-slate-800 bg-[#07152f] p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`flex-1 rounded-lg px-3 py-2 font-medium ${
              tab === "all" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-[#050f25]"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTab("unread")}
            className={`flex-1 rounded-lg px-3 py-2 font-medium ${
              tab === "unread" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-[#050f25]"
            }`}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* List */}
        <section className="rounded-2xl border border-slate-800 bg-[#050f25] p-3 sm:p-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl border border-slate-800 bg-[#07152f]"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[#07152f]/50 px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-black/20">
                <Bell className="h-5 w-5 text-slate-300" />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-100">No notifications</div>
              <div className="mt-1 text-[11px] text-slate-400">
                When riders or admins send updates, you’ll see them here.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isUnread
                        ? "border-blue-600/30 bg-blue-600/10 hover:bg-blue-600/15"
                        : "border-slate-800 bg-[#07152f] hover:bg-[#050f25]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-black/20">
                        <SourceIcon source={n.source} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-[12px] font-semibold text-slate-100">
                            {n.title}
                          </div>
                          {isUnread && <Dot className="h-6 w-6 text-blue-400" />}
                        </div>
                        <div className="line-clamp-1 text-[11px] text-slate-400">{n.body}</div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {sourceLabel(n)}
                          </span>
                          <span>•</span>
                          <span>{n.createdAgo ?? timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                );
              })}

              {hasMore && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => void load(false)}
                    className={`w-full rounded-xl border border-slate-700 px-4 py-2 text-[11px] font-medium ${
                      loadingMore
                        ? "cursor-not-allowed bg-slate-700/40 text-slate-300"
                        : "bg-[#07152f] text-slate-200 hover:bg-[#050f25]"
                    }`}
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-[#07152f]">
                    <SourceIcon source={selected.source} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-100">Notification</div>
                    <div className="text-[10px] text-slate-500">
                      {sourceLabel(selected)} • {selected.createdAgo ?? timeAgo(selected.createdAt)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
                >
                  <X className="h-4 w-4 text-slate-200" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-6 text-xs text-slate-200">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-50">{selected.title}</div>
                  <p className="text-[11px] text-slate-300">{selected.body}</p>
                </div>

                {selected.actionUrl && (
                  <a
                    href={selected.actionUrl}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-[12px] font-medium text-white hover:bg-blue-700"
                  >
                    Open
                  </a>
                )}

                {!selected.readAt && (
                  <button
                    type="button"
                    onClick={() => void markRead(selected.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#07152f] py-2.5 text-[12px] font-medium text-slate-200 hover:bg-[#050f25]"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DriverDashboardShell>
  );
}
