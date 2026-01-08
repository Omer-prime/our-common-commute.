"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  Users,
  User,
  Car,
  DollarSign,
  FileCheck2,
  MapPin,
  CreditCard,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

import {
  RidesOverviewChart,
  RevenueOverviewChart,
  type RidesPoint,
  type RevenuePoint,
} from "@/src/components/admin-charts";
import { authedJson } from "@/src/lib/authClient";

type ActivityCategory = "DOCUMENT" | "WORK_LOCATION" | "PAYMENT" | "SYSTEM";

type DashboardRes = {
  ok: true;
  stats: {
    totalUsers: number;
    usersUnderReview: number;
    ridesToday: number;
    revenueTodayCents: number;
  };
  charts: {
    ridesLast7Days: RidesPoint[];
    revenueLast7Days: RevenuePoint[];
  };
  activities: Array<{
    id: string;
    category: ActivityCategory;
    text: string;
    createdAt: string;
  }>;
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const sec = Math.max(0, Math.floor(diff / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 0) return `${day} day${day === 1 ? "" : "s"} ago`;
  if (hr > 0) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  if (min > 0) return `${min} minute${min === 1 ? "" : "s"} ago`;
  return "just now";
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Activity icons (Lucide) */
const activityUi: Record<
  ActivityCategory,
  { Icon: LucideIcon; bg: string; fg: string }
> = {
  DOCUMENT: { Icon: FileCheck2, bg: "bg-sky-500/10", fg: "text-sky-600" },
  WORK_LOCATION: { Icon: MapPin, bg: "bg-violet-500/10", fg: "text-violet-600" },
  PAYMENT: { Icon: CreditCard, bg: "bg-emerald-500/10", fg: "text-emerald-600" },
  SYSTEM: { Icon: BadgeCheck, bg: "bg-amber-500/10", fg: "text-amber-600" },
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardRes | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await authedJson<DashboardRes>("/admin/dashboard/overview", {
        method: "GET",
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 20_000);
    return () => window.clearInterval(id);
  }, []);

  const stats = data?.stats;
  const ridesSeries = data?.charts.ridesLast7Days ?? [];
  const revenueSeries = data?.charts.revenueLast7Days ?? [];
  const activities = data?.activities ?? [];

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">Dashboard</h1>

          <div className="relative flex-1 max-w-[540px]">
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
            title="Total Users"
            value={loading ? "..." : String(stats?.totalUsers ?? 0)}
            Icon={Users}
            iconBg="bg-rose-500/10"
            iconFg="text-rose-600"
          />

          <StatCard
            title="Users under review"
            value={loading ? "..." : String(stats?.usersUnderReview ?? 0)}
            Icon={User}
            iconBg="bg-amber-500/10"
            iconFg="text-amber-600"
          />

          <StatCard
            title="Rides today"
            value={loading ? "..." : String(stats?.ridesToday ?? 0)}
            Icon={Car}
            iconBg="bg-sky-500/10"
            iconFg="text-sky-600"
          />

          <StatCard
            title="Revenue today"
            value={loading ? "..." : money(stats?.revenueTodayCents ?? 0)}
            Icon={DollarSign}
            iconBg="bg-emerald-500/10"
            iconFg="text-emerald-600"
          />
        </div>

        {/* CHARTS */}
        <div className="grid gap-4 lg:grid-cols-[2.1fr_1.4fr]">
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <h2 className="text-[13px] font-semibold text-slate-900">Rides Overview</h2>
            <p className="mb-4 text-[11px] text-slate-400">Last 7 days</p>
            <RidesOverviewChart data={ridesSeries} />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <h2 className="text-[13px] font-semibold text-slate-900">Revenue Overview</h2>
            <p className="mb-4 text-[11px] text-slate-400">Last 7 days</p>
            <RevenueOverviewChart data={revenueSeries} />
          </div>
        </div>

        {/* RECENT ACTIVITIES */}
        <section className="mt-1 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-slate-900">Recent activities</h2>
            <button
              onClick={() => load()}
              className="text-[11px] font-medium text-[#2563FF] hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3 text-[12px] text-slate-700">
            {!loading && activities.length === 0 ? (
              <p className="text-[12px] text-slate-400">No recent activity yet.</p>
            ) : (
              activities.map((a) => {
                const ui = activityUi[a.category] ?? activityUi.SYSTEM;
                return (
                  <ActivityRow
                    key={a.id}
                    text={a.text}
                    Icon={ui.Icon}
                    bgClass={ui.bg}
                    iconClass={ui.fg}
                    timeLabel={timeAgo(a.createdAt)}
                  />
                );
              })
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function StatCard({
  title,
  value,
  Icon,
  iconBg,
  iconFg,
}: {
  title: string;
  value: string;
  Icon: LucideIcon;
  iconBg: string;
  iconFg: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[10px] text-slate-400">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>

      <span
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-slate-200",
          iconBg,
        ].join(" ")}
      >
        <Icon className={["h-5 w-5", iconFg].join(" ")} />
      </span>
    </div>
  );
}

function ActivityRow({
  text,
  Icon,
  bgClass,
  iconClass,
  timeLabel,
}: {
  text: string;
  Icon: LucideIcon;
  bgClass: string;
  iconClass: string;
  timeLabel: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={["mt-1 inline-flex h-7 w-7 items-center justify-center rounded-xl", bgClass].join(" ")}>
        <Icon className={["h-4 w-4", iconClass].join(" ")} />
      </span>

      <div>
        <p>{text}</p>
        <p className="text-[10px] text-slate-400">{timeLabel}</p>
      </div>
    </div>
  );
}
