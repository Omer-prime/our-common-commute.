// src/app/admin/reports/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ChevronDown,
  Car,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  CreditCard,
  Clock,
  AlertTriangle,
  Wallet,
  Users,
  UserCheck,
  BadgeCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type ReportTab = "rides" | "payments" | "payouts" | "users";
type RangeKey = "day" | "week" | "month" | "year" | "all";

type BarPoint = { label: string; value: number };

type RideReportRow = {
  id: string;
  rider: string;
  driver: string;
  date: string;
  shift: string;
  status: string;
  fare: string;
  payout: string;
};

type PaymentReportRow = {
  id: string;
  rider: string;
  amount: string;
  date: string;
  method: string;
  status: string;
};

type DriverPayoutRow = {
  id: string;
  driver: string;
  amount: string;
  date: string;
  rides: number;
  status: string;
};

type UserReportRow = {
  id: string; // UI shows this as "User" (backend sends fullName here)
  type: "Rider" | "Driver";
  lastRide: string;
  joined: string;
  status: string;
};

const axisTickStyle = { fontSize: 10, fill: "#94A3B8" };

const RANGE_LABEL: Record<RangeKey, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
  all: "All time",
};

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
  { value: "all", label: "All time" },
];

/* -------------------------------------------------------------------------- */
/*  API Helpers (401 -> refresh -> retry)                                     */
/* -------------------------------------------------------------------------- */

function getBackendBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  );
}

async function refreshAccessToken(): Promise<string | null> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as any;
  const token = data?.accessToken;
  if (typeof token === "string" && token.length) {
    localStorage.setItem("accessToken", token);
    return token;
  }
  return null;
}

async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBackendBaseUrl();
  const token = localStorage.getItem("accessToken") || "";

  const doFetch = (tok: string) =>
    fetch(`${base}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
        ...(init?.headers || {}),
        ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      },
    });

  let res = await doFetch(token);
  if (res.status === 401) {
    const newTok = await refreshAccessToken();
    if (newTok) res = await doFetch(newTok);
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json as T;
}

async function apiDownload(path: string): Promise<Blob> {
  const base = getBackendBaseUrl();
  const token = localStorage.getItem("accessToken") || "";

  const doFetch = (tok: string) =>
    fetch(`${base}${path}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
        ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      },
    });

  let res = await doFetch(token);
  if (res.status === 401) {
    const newTok = await refreshAccessToken();
    if (newTok) res = await doFetch(newTok);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Download failed (${res.status})`);
  }

  return await res.blob();
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("rides");
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ per-tab range state (each tab remembers selection)
  const [rangeByTab, setRangeByTab] = useState<Record<ReportTab, RangeKey>>({
    rides: "month",
    payments: "month",
    payouts: "month",
    users: "all",
  });

  const activeRange = rangeByTab[activeTab];

  // Stats
  const [rideStats, setRideStats] = useState<{
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    completionRate: number;
  } | null>(null);

  const [paymentStats, setPaymentStats] = useState<{
    totalRevenue: string;
    totalTransactions: number;
    completedPayments: number;
    failedPayments: number;
  } | null>(null);

  const [payoutStats, setPayoutStats] = useState<{
    totalDriversPaid: number;
    totalPaidAmount: string;
    pendingPayouts: number;
    failedPayouts: number;
  } | null>(null);

  const [userStats, setUserStats] = useState<{
    totalRegisteredRiders: number;
    totalRegisteredDrivers: number;
    verifiedUsers: number;
    usersUnderReview: number;
  } | null>(null);

  // Charts
  const [rideChart, setRideChart] = useState<BarPoint[]>([]);
  const [paymentChart, setPaymentChart] = useState<BarPoint[]>([]);
  const [payoutChart, setPayoutChart] = useState<BarPoint[]>([]);

  // Tables
  const [rideRows, setRideRows] = useState<RideReportRow[]>([]);
  const [paymentRows, setPaymentRows] = useState<PaymentReportRow[]>([]);
  const [payoutRows, setPayoutRows] = useState<DriverPayoutRow[]>([]);
  const [usersRows, setUsersRows] = useState<UserReportRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Debounce search
  const debouncedQ = useDebounced(searchQuery, 350);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const range = activeRange;

        if (activeTab === "rides") {
          const [sum, chart, list] = await Promise.all([
            apiFetchJson<{ ok: true; stats: any }>(`/admin/reports/rides/summary?range=${range}`),
            apiFetchJson<{ ok: true; points: BarPoint[] }>(`/admin/reports/rides/top-drivers?range=${range}`),
            apiFetchJson<{ ok: true; rows: RideReportRow[] }>(
              `/admin/reports/rides?range=${range}&q=${encodeURIComponent(debouncedQ)}&page=1&limit=10`
            ),
          ]);
          if (cancelled) return;
          setRideStats(sum.stats);
          setRideChart(chart.points);
          setRideRows(list.rows);
        }

        if (activeTab === "payments") {
          const [sum, chart, list] = await Promise.all([
            apiFetchJson<{ ok: true; stats: any }>(`/admin/reports/payments/summary?range=${range}`),
            // ✅ range-aware endpoint (backend added below)
            apiFetchJson<{ ok: true; points: BarPoint[] }>(`/admin/reports/payments/revenue?range=${range}`),
            apiFetchJson<{ ok: true; rows: PaymentReportRow[] }>(
              `/admin/reports/payments?range=${range}&q=${encodeURIComponent(debouncedQ)}&page=1&limit=10`
            ),
          ]);
          if (cancelled) return;
          setPaymentStats(sum.stats);
          setPaymentChart(chart.points);
          setPaymentRows(list.rows);
        }

        if (activeTab === "payouts") {
          const [sum, chart, list] = await Promise.all([
            apiFetchJson<{ ok: true; stats: any }>(`/admin/reports/payouts/summary?range=${range}`),
            // ✅ now range-aware (backend updated below)
            apiFetchJson<{ ok: true; points: BarPoint[] }>(`/admin/reports/payouts/by-driver?range=${range}`),
            apiFetchJson<{ ok: true; rows: DriverPayoutRow[] }>(
              `/admin/reports/payouts?range=${range}&q=${encodeURIComponent(debouncedQ)}&page=1&limit=10`
            ),
          ]);
          if (cancelled) return;
          setPayoutStats(sum.stats);
          setPayoutChart(chart.points);
          setPayoutRows(list.rows);
        }

        if (activeTab === "users") {
          const [sum, list] = await Promise.all([
            apiFetchJson<{ ok: true; stats: any }>(`/admin/reports/users/summary?range=${range}`),
            apiFetchJson<{ ok: true; rows: UserReportRow[] }>(
              `/admin/reports/users?q=${encodeURIComponent(debouncedQ)}&page=1&limit=10&range=${range}`
            ),
          ]);
          if (cancelled) return;
          setUserStats(sum.stats);
          setUsersRows(list.rows);
        }
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message || "Failed to load reports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, debouncedQ, activeRange]);

  const handleExport = async () => {
    try {
      const blob = await apiDownload(
        `/admin/reports/export?tab=${activeTab}&range=${activeRange}&q=${encodeURIComponent(searchQuery)}`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `occ-${activeTab}-export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Export failed");
    }
  };

  const setActiveRange = (next: RangeKey) => {
    setRangeByTab((prev) => ({ ...prev, [activeTab]: next }));
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[15px] font-semibold text-slate-900">Reports</h1>

          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-[540px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>

          {/* Range + Filter + Export */}
          <div className="flex items-center gap-2">
            {/* ✅ clickable dropdown (replaces the confusing non-clickable label) */}
            <RangeMenu value={activeRange} onChange={setActiveRange} />

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100"
              title="Filters (UI only)"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2563FF] px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(37,99,255,0.35)] hover:bg-[#1d4ed8]"
            >
              Export
            </button>
          </div>
        </div>

        {err && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
            {err}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
            Loading…
          </div>
        )}

        {/* TOP TABS */}
        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
          <div className="flex flex-wrap gap-1">
            <TopTab label="Ride reports" active={activeTab === "rides"} onClick={() => setActiveTab("rides")} />
            <TopTab label="Payment reports" active={activeTab === "payments"} onClick={() => setActiveTab("payments")} />
            <TopTab label="Driver payouts" active={activeTab === "payouts"} onClick={() => setActiveTab("payouts")} />
            <TopTab label="User reports" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
          </div>
        </div>

        {/* SECTIONS */}
        {activeTab === "rides" && (
          <RideReportsSection
            stats={rideStats}
            chart={rideChart}
            rows={rideRows}
            range={activeRange}
            onRangeChange={setActiveRange}
          />
        )}

        {activeTab === "payments" && (
          <PaymentReportsSection
            stats={paymentStats}
            chart={paymentChart}
            rows={paymentRows}
            range={activeRange}
            onRangeChange={setActiveRange}
          />
        )}

        {activeTab === "payouts" && (
          <DriverPayoutsSection
            stats={payoutStats}
            chart={payoutChart}
            rows={payoutRows}
            range={activeRange}
            onRangeChange={setActiveRange}
          />
        )}

        {activeTab === "users" && <UserReportsSection stats={userStats} rows={usersRows} />}
      </div>
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sections                                                                  */
/* -------------------------------------------------------------------------- */

function RideReportsSection({
  stats,
  chart,
  rows,
  range,
  onRangeChange,
}: {
  stats: { totalRides: number; completedRides: number; cancelledRides: number; completionRate: number } | null;
  chart: BarPoint[];
  rows: RideReportRow[];
  range: RangeKey;
  onRangeChange: (v: RangeKey) => void;
}) {
  const highlightIndex = useMemo(() => maxIndex(chart), [chart]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total rides" value={stats ? String(stats.totalRides) : "—"} Icon={Car} />
        <StatCard title="Completed rides" value={stats ? String(stats.completedRides) : "—"} Icon={CheckCircle2} />
        <StatCard title="Cancelled rides" value={stats ? String(stats.cancelledRides) : "—"} Icon={XCircle} />
        <StatCard title="Completion rate" value={stats ? `${stats.completionRate}%` : "—"} Icon={Percent} />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium text-slate-900">Top rides</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{chart[highlightIndex]?.value ?? 0}</p>
          </div>

          {/* ✅ clickable (this was the non-clickable div before) */}
          <RangeMenu value={range} onChange={onRangeChange} compact />
        </div>

        <ReportsBarChart data={chart} highlightIndex={highlightIndex} />
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <RideReportsTable rows={rows} />
      </section>
    </div>
  );
}

function PaymentReportsSection({
  stats,
  chart,
  rows,
  range,
  onRangeChange,
}: {
  stats: { totalRevenue: string; totalTransactions: number; completedPayments: number; failedPayments: number } | null;
  chart: BarPoint[];
  rows: PaymentReportRow[];
  range: RangeKey;
  onRangeChange: (v: RangeKey) => void;
}) {
  const highlightIndex = useMemo(() => maxIndex(chart), [chart]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total revenue" value={stats ? stats.totalRevenue : "—"} Icon={DollarSign} />
        <StatCard title="Transactions" value={stats ? String(stats.totalTransactions) : "—"} Icon={CreditCard} />
        <StatCard title="Completed" value={stats ? String(stats.completedPayments) : "—"} Icon={CheckCircle2} />
        <StatCard title="Failed" value={stats ? String(stats.failedPayments) : "—"} Icon={XCircle} />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-slate-400">Revenue</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{stats ? stats.totalRevenue : "—"}</p>
          </div>

          <RangeMenu value={range} onChange={onRangeChange} compact />
        </div>

        <ReportsBarChart data={chart} highlightIndex={highlightIndex} />
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <PaymentReportsTable rows={rows} />
      </section>
    </div>
  );
}

function DriverPayoutsSection({
  stats,
  chart,
  rows,
  range,
  onRangeChange,
}: {
  stats: { totalDriversPaid: number; totalPaidAmount: string; pendingPayouts: number; failedPayouts: number } | null;
  chart: BarPoint[];
  rows: DriverPayoutRow[];
  range: RangeKey;
  onRangeChange: (v: RangeKey) => void;
}) {
  const highlightIndex = useMemo(() => maxIndex(chart), [chart]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Drivers paid" value={stats ? String(stats.totalDriversPaid) : "—"} Icon={Users} />
        <StatCard title="Total paid" value={stats ? stats.totalPaidAmount : "—"} Icon={Wallet} />
        <StatCard title="Pending" value={stats ? String(stats.pendingPayouts) : "—"} Icon={Clock} />
        <StatCard title="Failed" value={stats ? String(stats.failedPayouts) : "—"} Icon={XCircle} />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-slate-400">Paid amount</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{stats ? stats.totalPaidAmount : "—"}</p>
          </div>

          <RangeMenu value={range} onChange={onRangeChange} compact />
        </div>

        <ReportsBarChart data={chart} highlightIndex={highlightIndex} />
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <DriverPayoutsTable rows={rows} />
      </section>
    </div>
  );
}

function UserReportsSection({
  stats,
  rows,
}: {
  stats: { totalRegisteredRiders: number; totalRegisteredDrivers: number; verifiedUsers: number; usersUnderReview: number } | null;
  rows: UserReportRow[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Registered riders" value={stats ? String(stats.totalRegisteredRiders) : "—"} Icon={Users} />
        <StatCard title="Registered drivers" value={stats ? String(stats.totalRegisteredDrivers) : "—"} Icon={UserCheck} />
        <StatCard title="Verified users" value={stats ? String(stats.verifiedUsers) : "—"} Icon={BadgeCheck} />
        <StatCard title="Under review" value={stats ? String(stats.usersUnderReview) : "—"} Icon={AlertTriangle} />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <UserReportsTable rows={rows} />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  UI Components                                                             */
/* -------------------------------------------------------------------------- */

function TopTab(props: { label: string; active: boolean; onClick: () => void }) {
  const { label, active, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-1.5 text-xs font-medium ${
        active
          ? "bg-[#2563FF] text-white shadow-[0_6px_16px_rgba(37,99,255,0.35)]"
          : "bg-transparent text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * ✅ Custom dropdown menu (clickable everywhere)
 * - fixes your issue where the "Monthly" label was not a button
 */
function RangeMenu({
  value,
  onChange,
  compact = false,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  const btnClass = compact
    ? "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
    : "inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100";

  return (
    <div ref={ref} className="relative z-50 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={btnClass}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {RANGE_LABEL[value]}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        >
          <div className="p-1">
            {RANGE_OPTIONS.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs ${
                    active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {active ? <span className="text-[10px] text-slate-400">Selected</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
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

/* --------------------------- Chart ---------------------------------------- */

function ReportsBarChart({ data, highlightIndex }: { data: BarPoint[]; highlightIndex: number }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="#E5EDFF" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTickStyle} />
          <YAxis axisLine={false} tickLine={false} tick={axisTickStyle} width={32} />
          <Tooltip
            cursor={{ fill: "rgba(191,219,254,0.35)" }}
            contentStyle={{ borderRadius: 8, borderColor: "#E5EDFF", fontSize: 11 }}
            labelStyle={{ fontWeight: 500 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={32} background={false}>
            {data.map((entry, idx) => (
              <Cell key={`${entry.label}-${idx}`} fill={idx === highlightIndex ? "#2563FF" : "#E0E7FF"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --------------------------- Tables --------------------------------------- */

function RideReportsTable({ rows }: { rows: RideReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[11px]">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </th>
            <th className="px-4 py-2 font-medium">Ride ID</th>
            <th className="px-4 py-2 font-medium">Rider</th>
            <th className="px-4 py-2 font-medium">Driver</th>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Shift</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Fare</th>
            <th className="px-4 py-2 font-medium">Payouts</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-2">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
              </td>
              <td className="px-4 py-2 align-middle">{row.id}</td>
              <td className="px-4 py-2 align-middle">{row.rider}</td>
              <td className="px-4 py-2 align-middle">{row.driver}</td>
              <td className="px-4 py-2 align-middle">{row.date}</td>
              <td className="px-4 py-2 align-middle">{row.shift}</td>
              <td className="px-4 py-2 align-middle">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[3px] text-[10px] font-medium text-emerald-700">
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-2 align-middle">{row.fare}</td>
              <td className="px-4 py-2 align-middle">{row.payout}</td>
              <td className="px-4 py-2 align-middle text-right">
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100">
                  <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-center text-xs text-slate-500">
                No rides found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentReportsTable({ rows }: { rows: PaymentReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[11px]">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </th>
            <th className="px-4 py-2 font-medium">Transaction ID</th>
            <th className="px-4 py-2 font-medium">Rider</th>
            <th className="px-4 py-2 font-medium">Amount</th>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Method</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-2">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
              </td>
              <td className="px-4 py-2 align-middle">{row.id}</td>
              <td className="px-4 py-2 align-middle">{row.rider}</td>
              <td className="px-4 py-2 align-middle">{row.amount}</td>
              <td className="px-4 py-2 align-middle">{row.date}</td>
              <td className="px-4 py-2 align-middle">{row.method}</td>
              <td className="px-4 py-2 align-middle">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[3px] text-[10px] font-medium text-emerald-700">
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-2 align-middle text-right">
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100">
                  <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-xs text-slate-500">
                No payments found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DriverPayoutsTable({ rows }: { rows: DriverPayoutRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[11px]">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </th>
            <th className="px-4 py-2 font-medium">Payout ID</th>
            <th className="px-4 py-2 font-medium">Driver</th>
            <th className="px-4 py-2 font-medium">Amount</th>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Rides</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-2">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
              </td>
              <td className="px-4 py-2 align-middle">{row.id}</td>
              <td className="px-4 py-2 align-middle">{row.driver}</td>
              <td className="px-4 py-2 align-middle">{row.amount}</td>
              <td className="px-4 py-2 align-middle">{row.date}</td>
              <td className="px-4 py-2 align-middle">{row.rides}</td>
              <td className="px-4 py-2 align-middle">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[3px] text-[10px] font-medium text-emerald-700">
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-2 align-middle text-right">
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100">
                  <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-xs text-slate-500">
                No payouts found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UserReportsTable({ rows }: { rows: UserReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[11px]">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </th>
            <th className="px-4 py-2 font-medium">User</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Last rides</th>
            <th className="px-4 py-2 font-medium">Joined date</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row, i) => (
            <tr key={`${row.id}-${i}`} className="hover:bg-slate-50/60">
              <td className="px-4 py-2">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
              </td>
              <td className="px-4 py-2 align-middle">{row.id}</td>
              <td className="px-4 py-2 align-middle">{row.type}</td>
              <td className="px-4 py-2 align-middle">{row.lastRide}</td>
              <td className="px-4 py-2 align-middle">{row.joined}</td>
              <td className="px-4 py-2 align-middle">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[3px] text-[10px] font-medium text-emerald-700">
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-2 align-middle text-right">
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100">
                  <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-xs text-slate-500">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                 */
/* -------------------------------------------------------------------------- */

function maxIndex(points: BarPoint[]) {
  if (!points.length) return 0;
  let idx = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i]!.value > points[idx]!.value) idx = i;
  }
  return idx;
}

function useDebounced<T>(value: T, delayMs: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}
