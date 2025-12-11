// src/app/admin/dashboard/page.tsx
import { AdminShell } from "@/src/components/AdminShell";
import { Search } from "lucide-react";
import Image from "next/image";
import {
  RidesOverviewChart,
  RevenueOverviewChart,
} from "@/src/components/admin-charts";

const activityItems = [
  {
    iconSrc: "/Car-.png",
    text: "Driver John M. uploaded a new insurance document for review.",
  },
  {
    iconSrc: "/Home-.png",
    text: "Rider Sophia L. requested a change of home address.",
  },
  {
    iconSrc: "/Check-.png",
    text: "Admin approved ID verification for Driver Carlos R.",
  },
  {
    iconSrc: "/Payment-.png",
    text: "Payment of $145.50 refunded to Rider Michael D.",
  },
];

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER: title + search */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">
            Dashboard
          </h1>

          {/* Long search bar – now takes remaining width, so it sits
              visually in the center like Figma */}
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
          <StatCard title="Total Users" value="12,094" trendImage="/Vector (1).png" />
          <StatCard title="Users under review" value="203" trendImage="/Vector 41.png" />
          <StatCard title="Rides today" value="592" trendImage="/Vector (4).png" />
          <StatCard title="Revenue today" value="$40,000" trendImage="/Vector 41 (1).png" />
        </div>

        {/* CHARTS ROW */}
        <div className="grid gap-4 lg:grid-cols-[2.1fr_1.4fr]">
          {/* Rides overview */}
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <h2 className="text-[13px] font-semibold text-slate-900">
              Rides Overview
            </h2>
            <p className="mb-4 text-[11px] text-slate-400">Job acquisition</p>
            <RidesOverviewChart />
          </div>

          {/* Revenue overview */}
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <h2 className="text-[13px] font-semibold text-slate-900">
              Revenue Overview
            </h2>
            <p className="mb-4 text-[11px] text-slate-400">Job acquisition</p>
            <RevenueOverviewChart />
          </div>
        </div>

        {/* RECENT ACTIVITIES */}
        <section className="mt-1 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-slate-900">
              Recent activities
            </h2>
            <button className="text-[11px] font-medium text-[#2563FF] hover:underline">
              See more
            </button>
          </div>

          <div className="space-y-3 text-[12px] text-slate-700">
            {activityItems.map((item, idx) => (
              <ActivityRow key={idx} text={item.text} iconSrc={item.iconSrc} />
            ))}
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
  trendImage,
}: {
  title: string;
  value: string;
  trendImage: string;
}) {
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

function ActivityRow({ text, iconSrc }: { text: string; iconSrc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 inline-flex h-7 w-7 items-center justify-center">
        <Image src={iconSrc} alt="" width={28} height={28} />
      </span>
      <div>
        <p>{text}</p>
        <p className="text-[10px] text-slate-400">30 minutes ago</p>
      </div>
    </div>
  );
}
