"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";
import { CarFront, CreditCard, FileText } from "lucide-react";

/* -------------------- Types -------------------- */

type NotificationTab = "all" | "rides" | "payments";

type NotificationItem = {
  id: string;
  category: "ride" | "payment" | "system";
  title: string;
  body: string;
  timeAgo: string;
  ctaLabel: string;
  actionUrl: string | null;
  isNew?: boolean;
  createdAt?: string;
};

type ListRes = {
  ok: boolean;
  items: NotificationItem[];
  nextCursor: string | null;
  error?: string;
};

/* -------------------- API helpers (same style as support) -------------------- */

function getBackendBaseUrl() {
  let base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  base = base.replace(/\/+$/, "");
  if (!base) return "http://localhost:4000";
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
}

function cleanToken(raw: string) {
  let t = raw.trim();
  if (t.startsWith("Bearer ")) t = t.slice(7).trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) t = t.slice(1, -1);
  return t.trim();
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const keys = ["accessToken", "token", "access_token", "jwt", "authToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return cleanToken(v);
  }
  return null;
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("refreshToken");
  return v && v.trim() ? cleanToken(v) : null;
}

async function refreshAccessToken(): Promise<string | null> {
  const base = getBackendBaseUrl();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const tryPaths = ["/api/auth/refresh", "/api/refresh"];

  for (const p of tryPaths) {
    const res = await fetch(`${base}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) continue;

    const data = (await res.json()) as { accessToken?: string };
    if (!data?.accessToken) continue;

    localStorage.setItem("accessToken", data.accessToken);
    return data.accessToken;
  }

  return null;
}

async function apiFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const base = getBackendBaseUrl();
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...(init?.method && init.method !== "GET" ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) } as any,
  });

  if (res.status === 401 && !retried) {
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error("UNAUTHORIZED — Please login again.");

    const retryRes = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...(init?.method && init.method !== "GET" ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${newToken}`,
        ...(init?.headers ?? {}),
      } as any,
    });

    const ct2 = retryRes.headers.get("content-type") || "";
    const data2 = (ct2.includes("application/json") ? await retryRes.json() : { ok: false, error: await retryRes.text() }) as any;

    if (!retryRes.ok) {
      throw new Error(retryRes.status === 401 ? "UNAUTHORIZED — Please login again." : data2?.error || `Request failed (${retryRes.status})`);
    }
    return data2 as T;
  }

  const ct = res.headers.get("content-type") || "";
  const data = (ct.includes("application/json") ? await res.json() : { ok: false, error: await res.text() }) as any;

  if (!res.ok) {
    throw new Error(res.status === 401 ? "UNAUTHORIZED — Please login again." : data?.error || `Request failed (${res.status})`);
  }

  return data as T;
}

/* -------------------- SSE stream (real-time) -------------------- */

async function startNotificationStream(
  onNotification: (n: NotificationItem) => void,
  signal: AbortSignal,
) {
  const base = getBackendBaseUrl();

  let token = getAccessToken();
  if (!token) return;

  const open = async (t: string) => {
    const res = await fetch(`${base}/api/rider/notifications/stream`, {
      headers: { Authorization: `Bearer ${t}` },
      signal,
    });
    return res;
  };

  let res = await open(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return;
    token = newToken;
    res = await open(token);
  }

  if (!res.ok || !res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flush = (chunk: string) => {
    buffer += chunk;

    // SSE frames separated by blank line
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const frame of parts) {
      const lines = frame.split("\n").map((l) => l.trim()).filter(Boolean);
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));

      const event = eventLine?.slice(6).trim();
      const dataRaw = dataLine?.slice(5).trim();

      if (event === "notification" && dataRaw) {
        try {
          const payload = JSON.parse(dataRaw) as NotificationItem;
          onNotification(payload);
        } catch {
          // ignore
        }
      }
    }
  };

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;
    flush(decoder.decode(value, { stream: true }));
  }
}

/* ------------------------ Page ------------------------ */

export default function RiderNotificationsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<NotificationTab>("all");
  const tabRef = useRef<NotificationTab>("all");
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async (t: NotificationTab) => {
    try {
      setErr(null);
      setLoading(true);
      const data = await apiFetch<ListRes>(`/api/rider/notifications?tab=${t}`);
      if (!data.ok) throw new Error(data.error || "Failed to load notifications");
      setItems(data.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load notifications");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // real-time stream (single connection)
  useEffect(() => {
    const ctrl = new AbortController();

    startNotificationStream(
      (n) => {
        const t = tabRef.current;
        const okForTab =
          t === "all" ||
          (t === "rides" && n.category === "ride") ||
          (t === "payments" && n.category === "payment");

        if (!okForTab) return;

        setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
      },
      ctrl.signal,
    ).catch(() => {});

    return () => ctrl.abort();
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((n) => (tab === "rides" ? n.category === "ride" : n.category === "payment"));
  }, [items, tab]);

  const onOpen = async (n: NotificationItem) => {
    try {
      // mark read
      await apiFetch<{ ok: boolean }>(`/api/rider/notifications/${n.id}/read`, { method: "POST" });
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isNew: false } : x)));

      // optional navigation
      if (n.actionUrl) router.push(n.actionUrl);
    } catch {
      // ignore
    }
  };

  return (
    <RiderDashboardShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">Notifications</h1>
        </div>

        <div className="mt-2 flex max-w-xs items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300">
          <TabButton label="All" isActive={tab === "all"} onClick={() => setTab("all")} />
          <TabButton label="Rides" isActive={tab === "rides"} onClick={() => setTab("rides")} />
          <TabButton label="Payments" isActive={tab === "payments"} onClick={() => setTab("payments")} />
        </div>

        {err ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="text-[11px] text-slate-400">Loading…</div>
        ) : (
          <div className="mt-2 flex flex-col gap-3 pb-10">
            {filtered.map((item) => (
              <NotificationCard key={item.id} item={item} onOpen={() => onOpen(item)} />
            ))}
            {!filtered.length ? (
              <div className="text-[11px] text-slate-500">No notifications.</div>
            ) : null}
          </div>
        )}
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
        isActive ? "bg-[#0B63F4] text-white" : "bg-transparent text-slate-400 hover:bg-[#07152f]"
      }`}
    >
      {label}
    </button>
  );
}

/* ------------------- Notification card ------------------- */

function NotificationCard({ item, onOpen }: { item: NotificationItem; onOpen: () => void }) {
  const Icon = item.category === "ride" ? CarFront : item.category === "payment" ? CreditCard : FileText;

  return (
    <section className="rounded-2xl border border-[#233358] bg-[#050f25] px-4 py-3 text-xs text-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#101a33]">
            <Icon className="h-4 w-4 text-slate-100" />
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-100">{item.title}</div>
            <div className="line-clamp-1 text-[11px] text-slate-400">{item.body}</div>
            <div className="mt-2 text-[10px] text-slate-500">{item.timeAgo}</div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-2">
          {item.isNew && (
            <span className="inline-flex items-center rounded-full bg-[#0f172a] px-2 py-0.5 text-[10px] font-medium text-slate-100">
              New
            </span>
          )}
          <button
            type="button"
            onClick={onOpen}
            className="text-[11px] font-medium text-[#4f8dff] hover:underline"
          >
            {item.ctaLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
