// src/app/admin/users/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/src/components/AdminShell";
import { Search, SlidersHorizontal, MoreVertical } from "lucide-react";
import Image from "next/image";

type UserRecord = {
  id: string; // e.g. "#74658335"
  name: string;
  role: "Rider" | "Driver";
  email: string;
  status: string;
  lastActivity: string;
};

const users: UserRecord[] = [
  {
    id: "#74658335",
    name: "Amos Hulley",
    role: "Rider",
    email: "hulleyj@gmail.com",
    status: "Active",
    lastActivity: "20-10-2025",
  },
  {
    id: "#74658336",
    name: "Daniel Perez",
    role: "Rider",
    email: "danielp@gmail.com",
    status: "Active",
    lastActivity: "20-10-2025",
  },
  {
    id: "#74658337",
    name: "Sarah Miles",
    role: "Driver",
    email: "sarahm@gmail.com",
    status: "Active",
    lastActivity: "20-10-2025",
  },
  {
    id: "#74658338",
    name: "Michael Lee",
    role: "Driver",
    email: "michaell@gmail.com",
    status: "Active",
    lastActivity: "20-10-2025",
  },
  {
    id: "#74658339",
    name: "Amit Sharma",
    role: "Rider",
    email: "amitsharma@gmail.com",
    status: "Active",
    lastActivity: "20-10-2025",
  },
];

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "riders" | "drivers">(
    "all"
  );
  const router = useRouter();

  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    if (activeTab === "riders") return user.role === "Rider";
    return user.role === "Driver";
  });

  const openDetails = (user: UserRecord) => {
    // remove leading "#" from id for the URL
    const cleanId = user.id.replace(/^#/, "");
    if (user.role === "Rider") {
      router.push(`/admin/dashboard/users/riders/${cleanId}`);
    } else {
      router.push(`/admin/dashboard/users/drivers/${cleanId}`);
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER: title + centered search */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">
            User management
          </h1>

          {/* Long search bar – visually centered like Figma */}
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
            title="Total Users"
            value="12,094"
            trendImage="/Vector (1).png"
          />
          <StatCard
            title="Users under review"
            value="203"
            trendImage="/Vector 41.png"
          />
          <StatCard
            title="Verified drivers"
            value="592"
            trendImage="/Vector (4).png"
          />
          <StatCard
            title="Suspended driver"
            value="231"
            trendImage="/Vector 41 (1).png"
          />
        </div>

        {/* TOP EARNING DRIVER CHART CARD */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-[13px] font-semibold text-slate-900">
            Top earning driver
          </h2>
          <p className="mb-2 text-[11px] text-slate-400">Monthly</p>
          <TopEarningDriverChart />
        </section>

        {/* USERS TABLE CARD */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          {/* Tabs + search + filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Tabs */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${
                  activeTab === "all"
                    ? "bg-[#2563FF] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                }`}
              >
                All users
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("riders")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${
                  activeTab === "riders"
                    ? "bg-[#2563FF] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                }`}
              >
                Riders
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("drivers")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${
                  activeTab === "drivers"
                    ? "bg-[#2563FF] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                }`}
              >
                Drivers
              </button>
            </div>

            {/* Search + filter on table */}
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
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
            </div>
          </div>

          {/* TABLE */}
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300"
                    />
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-2 align-middle">{user.id}</td>
                    <td className="px-4 py-2 align-middle">{user.name}</td>
                    <td className="px-4 py-2 align-middle">{user.role}</td>
                    <td className="px-4 py-2 align-middle">{user.email}</td>
                    <td className="px-4 py-2 align-middle">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[3px] text-[10px] font-medium text-emerald-700">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-middle">
                      {user.lastActivity}
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(user)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

/* ---------- SMALL COMPONENTS & CHART ---------- */

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

type DriverBar = {
  name: string;
  value: number;
  highlight?: boolean;
};

function TopEarningDriverChart() {
  const data: DriverBar[] = [
    { name: "John", value: 350 },
    { name: "Ken", value: 900 },
    { name: "Mary", value: 700 },
    { name: "Cian", value: 650 },
    { name: "Kay", value: 550 },
    { name: "Ben", value: 1000, highlight: true },
    { name: "Max", value: 850 },
    { name: "Ann", value: 930 },
    { name: "Liam", value: 450 },
    { name: "Newl", value: 600 },
    { name: "Owen", value: 520 },
    { name: "Mike", value: 680 },
  ];

  const maxValue = 1200; // Top of scale (like Figma)
  const barAreaHeight = 160; // px

  return (
    <div className="mt-1">
      <div className="relative h-56">
        {/* dashed line + value */}
        <div className="absolute left-0 right-0 top-8 border-t border-dashed border-slate-200" />
        <span className="absolute right-0 top-3 text-[11px] font-medium text-[#2563FF]">
          $1,682
        </span>

        {/* Bar area fixed height */}
        <div className="absolute inset-x-0 bottom-4 flex h-[160px] items-end justify-between px-1">
          {data.map((item) => {
            const barHeight = (item.value / maxValue) * barAreaHeight;

            return (
              <div
                key={item.name}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="flex w-6 items-end justify-center">
                  <div
                    className={`w-full rounded-t-full ${
                      item.highlight ? "bg-[#2563FF]" : "bg-[#E4ECFF]"
                    }`}
                    style={{ height: barHeight }}
                  />
                </div>
                <span className="mt-1 text-[10px] text-slate-500">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
