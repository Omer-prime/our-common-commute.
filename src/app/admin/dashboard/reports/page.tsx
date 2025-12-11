// src/app/admin/reports/page.tsx
"use client";

import { useState } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
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
/*  TYPES & MOCK DATA                                                         */
/* -------------------------------------------------------------------------- */

type ReportTab = "rides" | "payments" | "payouts" | "users";

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
  id: string;
  type: "Rider" | "Driver";
  lastRide: string;
  joined: string;
  status: string;
};

type BarPoint = {
  label: string;
  value: number;
};

const axisTickStyle = { fontSize: 10, fill: "#94A3B8" };

const rideTopDrivers: BarPoint[] = [
  { label: "John", value: 18 },
  { label: "Ken", value: 32 },
  { label: "Mary", value: 27 },
  { label: "Clian", value: 24 },
  { label: "Kay", value: 20 },
  { label: "Ben", value: 47 }, // highlighted
  { label: "Max", value: 29 },
  { label: "Ann", value: 34 },
  { label: "Liam", value: 12 },
  { label: "Nowl", value: 21 },
  { label: "Owen", value: 19 },
  { label: "Mike", value: 25 },
];

const paymentRevenueByMonth: BarPoint[] = [
  { label: "Jan", value: 12_000 },
  { label: "Feb", value: 18_000 },
  { label: "Mar", value: 16_000 },
  { label: "Apr", value: 14_000 },
  { label: "May", value: 19_000 },
  { label: "Jun", value: 23_000 }, // highlighted
  { label: "Jul", value: 17_000 },
  { label: "Aug", value: 21_000 },
  { label: "Sep", value: 9_000 },
  { label: "Oct", value: 13_000 },
  { label: "Nov", value: 11_000 },
  { label: "Dec", value: 8_000 },
];

const driverPayoutsByDriver: BarPoint[] = [
  { label: "John", value: 9_000 },
  { label: "Mark", value: 13_000 },
  { label: "Sam", value: 11_000 },
  { label: "Ken", value: 10_000 },
  { label: "Huwi", value: 8_000 },
  { label: "Don", value: 20_000 }, // highlighted
  { label: "Sci", value: 12_000 },
  { label: "Matt", value: 15_000 },
  { label: "Grace", value: 9_500 },
  { label: "Moses", value: 7_500 },
  { label: "Mike", value: 10_500 },
  { label: "Len", value: 8_500 },
];

const rideRows: RideReportRow[] = Array.from({ length: 6 }).map((_, idx) => ({
  id: `#7465833${5 + idx}`,
  rider: "Michael O.",
  driver: "Ashmwy",
  date: "Nov 23",
  shift: "Morning",
  status: "Completed",
  fare: "$40",
  payout: "$30",
}));

const paymentRows: PaymentReportRow[] = Array.from({ length: 5 }).map(
  (_, idx) => ({
    id: `#7465833${5 + idx}`,
    rider: "Michael O.",
    amount: "$50",
    date: "Nov 23",
    method: "Paypal",
    status: "Completed",
  })
);

const driverPayoutRows: DriverPayoutRow[] = Array.from({ length: 5 }).map(
  (_, idx) => ({
    id: `#7465833${5 + idx}`,
    driver: "Michael O.",
    amount: "$50",
    date: "Nov 23",
    rides: [5, 3, 8, 2, 1][idx] ?? 3,
    status: "Completed",
  })
);

const userRows: UserReportRow[] = Array.from({ length: 5 }).map((_, idx) => ({
  id: `#7465833${5 + idx}`,
  type: "Rider",
  lastRide: "Nov 28",
  joined: "Nov 23",
  status: "Completed",
}));

/* -------------------------------------------------------------------------- */
/*  MAIN PAGE                                                                 */
/* -------------------------------------------------------------------------- */

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("rides");

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER: title + search + export */}
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[15px] font-semibold text-slate-900">Reports</h1>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px] max-w-[540px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>

          {/* Filter + Export */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2563FF] px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(37,99,255,0.35)] hover:bg-[#1d4ed8]"
            >
              Export
            </button>
          </div>
        </div>

        {/* TOP TABS (Ride / Payment / Driver / User) */}
        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
          <div className="flex flex-wrap gap-1">
            <TopTab
              label="Ride reports"
              active={activeTab === "rides"}
              onClick={() => setActiveTab("rides")}
            />
            <TopTab
              label="Payment reports"
              active={activeTab === "payments"}
              onClick={() => setActiveTab("payments")}
            />
            <TopTab
              label="Driver payouts"
              active={activeTab === "payouts"}
              onClick={() => setActiveTab("payouts")}
            />
            <TopTab
              label="User reports"
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
            />
          </div>
        </div>

        {/* SECTIONS */}
        {activeTab === "rides" && <RideReportsSection />}
        {activeTab === "payments" && <PaymentReportsSection />}
        {activeTab === "payouts" && <DriverPayoutsSection />}
        {activeTab === "users" && <UserReportsSection />}
      </div>
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  RIDE REPORTS                                                              */
/* -------------------------------------------------------------------------- */

function RideReportsSection() {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Total rides"
          value="10,008"
          trendImage="/Vector (1).png"
        />
        <StatCard
          title="Completed rides"
          value="9,999"
          trendImage="/Vector 41.png"
        />
        <StatCard
          title="Cancelled rides"
          value="12"
          trendImage="/Vector (4).png"
        />
        <StatCard
          title="Rides per completion"
          value="96.8%"
          trendImage="/Vector 41 (1).png"
        />
        {/* keep 4 if you like – Figma has 4, this 5th is optional */}
      </div>

      {/* Chart card */}
      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium text-slate-900">Top rides</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">47</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600"
          >
            This week
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <ReportsBarChart data={rideTopDrivers} highlightIndex={5} />
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <RideReportsTable rows={rideRows} />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PAYMENT REPORTS                                                           */
/* -------------------------------------------------------------------------- */

function PaymentReportsSection() {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Total Revenue"
          value="$100,008"
          trendImage="/Vector (1).png"
        />
        <StatCard
          title="Total Transactions"
          value="10,008"
          trendImage="/Vector 41.png"
        />
        <StatCard
          title="Completed payments"
          value="9,999"
          trendImage="/Vector (4).png"
        />
        <StatCard
          title="Failed payments"
          value="10"
          trendImage="/Vector 41 (1).png"
        />
      </div>

      {/* Chart card */}
      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-slate-400">Total Revenue</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              $100,008
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600"
          >
            Monthly
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <ReportsBarChart data={paymentRevenueByMonth} highlightIndex={5} />
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <PaymentReportsTable rows={paymentRows} />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DRIVER PAYOUTS                                                            */
/* -------------------------------------------------------------------------- */

function DriverPayoutsSection() {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Total drivers paid"
          value="100"
          trendImage="/Vector (1).png"
        />
        <StatCard
          title="Total paid amount"
          value="$10,008"
          trendImage="/Vector 41.png"
        />
        <StatCard
          title="Pending payouts"
          value="9,999"
          trendImage="/Vector (4).png"
        />
        <StatCard
          title="Failed payouts"
          value="10"
          trendImage="/Vector 41 (1).png"
        />
      </div>

      {/* Chart card */}
      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-slate-400">Total paid</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              $100,008
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600"
          >
            Monthly
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <ReportsBarChart data={driverPayoutsByDriver} highlightIndex={5} />
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <DriverPayoutsTable rows={driverPayoutRows} />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  USER REPORTS                                                              */
/* -------------------------------------------------------------------------- */

function UserReportsSection() {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total registered riders"
          value="270"
          trendImage="/Vector (1).png"
        />
        <StatCard
          title="Total registered driver"
          value="300"
          trendImage="/Vector 41.png"
        />
        <StatCard
          title="Verified users"
          value="9,999"
          trendImage="/Vector (4).png"
        />
        <StatCard
          title="Users under review"
          value="10"
          trendImage="/Vector 41 (1).png"
        />
      </div>

      {/* Only table for this tab */}
      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <UserReportsTable rows={userRows} />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SMALL COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

function TopTab(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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

/* --------------------------- BAR CHART ------------------------------------ */

function ReportsBarChart({
  data,
  highlightIndex,
}: {
  data: BarPoint[];
  highlightIndex: number;
}) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 16, left: -24, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#E5EDFF"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={axisTickStyle}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={axisTickStyle}
            width={32}
          />
          <Tooltip
            cursor={{ fill: "rgba(191,219,254,0.35)" }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "#E5EDFF",
              fontSize: 11,
            }}
            labelStyle={{ fontWeight: 500 }}
          />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            background={false}
          >
            {data.map((entry, idx) => (
              <Cell
                key={entry.label}
                fill={idx === highlightIndex ? "#2563FF" : "#E0E7FF"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --------------------------- TABLES --------------------------------------- */

function RideReportsTable({ rows }: { rows: RideReportRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-[11px]">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
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
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
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
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
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
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
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
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
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
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
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
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
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
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
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
        </tbody>
      </table>
    </div>
  );
}
