// src/app/admin/dashboard/users/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  MoreVertical,
  Users,
  UserCheck,
  BadgeCheck,
  Ban,
} from "lucide-react";
import { authedJson } from "@/src/lib/authClient";
import { API_URL } from "@/src/lib/api";

type OverviewRes = {
  ok: true;
  stats: {
    totalUsers: number;
    usersUnderReview: number;
    verifiedDrivers: number;
    suspendedDrivers: number;
  };
  topEarningDrivers: Array<{ name: string; valueCents: number }>;
};

type ListRes = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    role: "DRIVER" | "RIDER";
    status: string;
    lastActivity: string;
  }>;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"all" | "riders" | "drivers">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [overview, setOverview] = useState<OverviewRes | null>(null);
  const [list, setList] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useMemo(() => q.trim(), [q]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [ov, li] = await Promise.all([
        authedJson<OverviewRes>("/admin/users/overview", { method: "GET" }),
        authedJson<ListRes>(
          `/admin/users/list?tab=${encodeURIComponent(activeTab)}&q=${encodeURIComponent(
            debouncedQ
          )}&page=${page}&limit=${limit}`,
          { method: "GET" }
        ),
      ]);

      setOverview(ov);
      setList(li);
    } catch (e: any) {
      // show REAL reason instead of "No users found"
      const msg =
        e?.error ||
        e?.message ||
        (typeof e === "string" ? e : "Failed to load users");

      setError(String(msg));
      setOverview(null);
      setList(null);

      // If unauthorized, push to login (optional)
      if (String(msg).toLowerCase().includes("unauthorized") || e?.status === 401) {
        // router.push("/admin/login"); // uncomment if you want auto redirect
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedQ, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedQ]);

  const users = list?.users ?? [];
  const total = list?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openDetails = (u: ListRes["users"][number]) => {
    if (u.role === "RIDER") router.push(`/admin/dashboard/users/riders/${u.id}`);
    else router.push(`/admin/dashboard/users/drivers/${u.id}`);
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">User management</h1>

          <div className="relative mx-auto flex-1 max-w-[560px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Search by name or email"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>
        </div>

        {/* ERROR BOX */}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[12px] text-red-700">
            <div className="font-semibold">Failed to load users</div>
            <div className="mt-1 opacity-90">{error}</div>
            <div className="mt-2 text-[11px] text-red-700/80">
              API base: <span className="font-medium">{API_URL}</span>
            </div>
            <button
              onClick={load}
              className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* TOP STATS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Users" value={loading ? "..." : String(overview?.stats.totalUsers ?? 0)} Icon={Users} />
          <StatCard
            title="Users under review"
            value={loading ? "..." : String(overview?.stats.usersUnderReview ?? 0)}
            Icon={UserCheck}
          />
          <StatCard
            title="Verified drivers"
            value={loading ? "..." : String(overview?.stats.verifiedDrivers ?? 0)}
            Icon={BadgeCheck}
          />
          <StatCard
            title="Suspended driver"
            value={loading ? "..." : String(overview?.stats.suspendedDrivers ?? 0)}
            Icon={Ban}
          />
        </div>

        {/* TOP EARNING DRIVER */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-[13px] font-semibold text-slate-900">Top earning driver</h2>
          <p className="mb-2 text-[11px] text-slate-400">Monthly</p>
          <TopEarningDriverChart data={overview?.topEarningDrivers ?? []} />
        </section>

        {/* USERS TABLE */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <TabButton label="All users" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
              <TabButton label="Riders" active={activeTab === "riders"} onClick={() => setActiveTab("riders")} />
              <TabButton label="Drivers" active={activeTab === "drivers"} onClick={() => setActiveTab("drivers")} />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
                />
              </div>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
                title="Filters (UI only)"
              >
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                  </th>
                  <th className="px-4 py-2 font-medium">User ID</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Email address</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Last activity</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                {!loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2">
                        <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                      </td>

                      <td className="px-4 py-2 align-middle">#{u.id.slice(0, 8)}</td>
                      <td className="px-4 py-2 align-middle">{u.fullName}</td>
                      <td className="px-4 py-2 align-middle">{u.role === "DRIVER" ? "Driver" : "Rider"}</td>
                      <td className="px-4 py-2 align-middle">{u.email}</td>
                      <td className="px-4 py-2 align-middle">
                        <StatusPill status={u.status} />
                      </td>
                      <td className="px-4 py-2 align-middle">{fmtDate(u.lastActivity)}</td>

                      <td className="px-4 py-2 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => openDetails(u)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
    </AdminShell>
  );
}

/* ---------- helpers ---------- */

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-xs font-medium ${
        active ? "bg-[#2563FF] text-white shadow-sm" : "text-slate-500 hover:bg-slate-200/80"
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s.includes("suspend")
      ? "border-red-200 bg-red-50 text-red-700"
      : s.includes("review")
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : s.includes("occup")
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-[3px] text-[10px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

function StatCard({
  title,
  value,
  Icon,
}: {
  title: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[10px] text-slate-400">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>

      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function TopEarningDriverChart({ data }: { data: Array<{ name: string; valueCents: number }> }) {
  const bars = (data ?? []).slice(0, 12);
  const max = Math.max(1, ...bars.map((b) => b.valueCents));
  const barAreaHeight = 160;
  const top = bars[0]?.valueCents ?? 0;

  if (bars.length === 0) return <p className="text-[11px] text-slate-400">No earnings data yet.</p>;

  return (
    <div className="mt-1">
      <div className="relative h-56">
        <div className="absolute left-0 right-0 top-8 border-t border-dashed border-slate-200" />
        <span className="absolute right-0 top-3 text-[11px] font-medium text-[#2563FF]">
          {money(top)}
        </span>

        <div className="absolute inset-x-0 bottom-4 flex h-[160px] items-end justify-between px-1">
          {bars.map((item, idx) => {
            const barHeight = (item.valueCents / max) * barAreaHeight;
            const highlight = idx === 0;

            return (
              <div key={`${item.name}-${idx}`} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-6 items-end justify-center">
                  <div
                    className={`w-full rounded-t-full ${highlight ? "bg-[#2563FF]" : "bg-[#E4ECFF]"}`}
                    style={{ height: barHeight }}
                  />
                </div>
                <span className="mt-1 text-[10px] text-slate-500">{item.name.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
