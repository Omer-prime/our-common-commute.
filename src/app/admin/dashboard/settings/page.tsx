// src/app/admin/settings/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Upload,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  API HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function getApiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return base.replace(/\/+$/, "");
}

function getAuthToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const token = getAuthToken();

  const res = await fetch(`${base}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Accept: "application/json",
    },
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

function formatShortDate(dateIso?: string | null) {
  if (!dateIso) return "—";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(d);
}

function displayAdminId(id: string) {
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-8);
  return `#${tail || id.slice(0, 8)}`;
}

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type SettingsTab = "admin-management" | "compliance" | "notifications" | "customization";

type AdminRow = {
  id: string; // display id
  _id: string; // real id
  name: string;
  role: string;
  lastLogin: string;
  status: "Completed" | "Pending";
  email: string;
};

type AdminStats = {
  totalAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
};

type ComplianceSettings = {
  requiredDocuments: string[];
  verificationLevel: string;
  aml: {
    flagAboveUsd: number;
    dailyLimitUsd: number;
  };
  require2FAForWithdrawal: boolean;
};

type NotificationSettings = {
  alerts: {
    transaction: boolean;
    price: boolean;
    security: boolean;
    system: boolean;
    referrals: boolean;
  };
  deliveryEnabled: boolean;
  deliveryChannel: "push" | "email" | "sms";
};

type CustomizationSettings = {
  logos: {
    lightUrl: string | null;
    darkUrl: string | null;
  };
  currency: {
    enabled: string[];
    default: string;
  };
  language: {
    enabled: string[];
    default: string;
  };
  widgets: {
    enabled: string[];
  };
};

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("admin-management");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminRefreshKey, setAdminRefreshKey] = useState(0);

  return (
    <AdminShell>
      <div className="flex min-w-0 flex-col gap-6">
        {/* HEADER: stacks on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">Settings</h1>

          <div className="relative w-full sm:flex-1 sm:max-w-[540px]">
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

        {/* MAIN LAYOUT */}
        <div className="grid min-w-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* MOBILE: grid tabs (no cut/scroll issues) */}
          <div className="lg:hidden">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <MobileTabButton
                label="Admin management"
                active={activeTab === "admin-management"}
                onClick={() => setActiveTab("admin-management")}
              />
              <MobileTabButton
                label="Compliance & security"
                active={activeTab === "compliance"}
                onClick={() => setActiveTab("compliance")}
              />
              <MobileTabButton
                label="Notification settings"
                active={activeTab === "notifications"}
                onClick={() => setActiveTab("notifications")}
              />
              <MobileTabButton
                label="Customization"
                active={activeTab === "customization"}
                onClick={() => setActiveTab("customization")}
              />
            </div>
          </div>

          {/* DESKTOP: left vertical tabs */}
          <nav className="hidden rounded-2xl border border-slate-100 bg-white py-3 text-[12px] text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:block">
            <VerticalTabButton
              label="Admin management"
              active={activeTab === "admin-management"}
              onClick={() => setActiveTab("admin-management")}
            />
            <VerticalTabButton
              label="Compliance & security"
              active={activeTab === "compliance"}
              onClick={() => setActiveTab("compliance")}
            />
            <VerticalTabButton
              label="Notification settings"
              active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
            />
            <VerticalTabButton
              label="Customization"
              active={activeTab === "customization"}
              onClick={() => setActiveTab("customization")}
            />
          </nav>

          {/* RIGHT CONTENT */}
          <div className="min-w-0 space-y-4 lg:col-start-2">
            {activeTab === "admin-management" && (
              <AdminManagementTab
                refreshKey={adminRefreshKey}
                onOpenAddAdmin={() => setShowAddAdminModal(true)}
              />
            )}
            {activeTab === "compliance" && <ComplianceSecurityTab />}
            {activeTab === "notifications" && <NotificationSettingsTab />}
            {activeTab === "customization" && <CustomizationTab />}
          </div>
        </div>
      </div>

      {showAddAdminModal && (
        <AddAdminModal
          onClose={() => setShowAddAdminModal(false)}
          onCreated={() => {
            setShowAddAdminModal(false);
            setAdminRefreshKey((k) => k + 1);
          }}
        />
      )}
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  TABS                                                                      */
/* -------------------------------------------------------------------------- */

function MobileTabButton(props: { label: string; active: boolean; onClick: () => void }) {
  const { label, active, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-2 text-[11px] font-medium transition ${
        active
          ? "bg-[#2563FF] text-white shadow-[0_6px_16px_rgba(37,99,255,0.35)]"
          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function VerticalTabButton(props: { label: string; active: boolean; onClick: () => void }) {
  const { label, active, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px] transition ${
        active
          ? "border-l-2 border-[#2563FF] bg-slate-50 font-semibold text-slate-900"
          : "border-l-2 border-transparent text-slate-500 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  ADMIN MANAGEMENT TAB (CONNECTED)                                          */
/* -------------------------------------------------------------------------- */

function AdminManagementTab(props: { onOpenAddAdmin: () => void; refreshKey: number }) {
  const { onOpenAddAdmin, refreshKey } = props;

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  async function load() {
    try {
      setErr("");
      setLoading(true);

      const [overview, list] = await Promise.all([
        apiFetch<{ ok: boolean; stats: AdminStats }>("/admin/settings/admins/overview"),
        apiFetch<{
          ok: boolean;
          page: number;
          limit: number;
          total: number;
          rows: Array<{
            id: string;
            name: string;
            role: string;
            lastLoginAt: string | null;
            status: "Completed" | "Pending";
            email: string;
          }>;
        }>(`/admin/settings/admins/list?q=${encodeURIComponent(debouncedQ)}&page=${page}&limit=${limit}`),
      ]);

      setStats(overview.stats);

      setRows(
        list.rows.map((r) => ({
          _id: r.id,
          id: displayAdminId(r.id),
          name: r.name,
          role: r.role,
          lastLogin: formatShortDate(r.lastLoginAt),
          status: r.status,
          email: r.email,
        }))
      );
    } catch (e: any) {
      setErr(e?.message || "Failed to load admin settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, refreshKey]);

  return (
    <div className="min-w-0 space-y-4">
      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
          {err}
        </div>
      )}

      {/* Stats row (icons = real meaning) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total admins" value={stats ? String(stats.totalAdmins) : loading ? "…" : "0"} Icon={Users} />
        <StatCard title="Active admins" value={stats ? String(stats.activeAdmins) : loading ? "…" : "0"} Icon={UserCheck} />
        <StatCard title="Inactive admins" value={stats ? String(stats.inactiveAdmins) : loading ? "…" : "0"} Icon={UserX} />
      </div>

      {/* Table/Card container */}
      <section className="min-w-0 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-5">
        {/* search + filter + add button (mobile friendly) */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative w-full sm:w-[320px]">
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
              className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 sm:w-9"
              title="Filter (UI only)"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddAdmin}
            className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#2563FF] px-4 text-[11px] font-semibold text-white hover:bg-[#1d4ed8] sm:w-auto"
          >
            Add admin
          </button>
        </div>

        {/* MOBILE: cards */}
        <div className="space-y-2 sm:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-100 bg-white p-4 text-[11px] text-slate-500">
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-white p-4 text-[11px] text-slate-500">
              No admins found.
            </div>
          ) : (
            rows.map((row) => (
              <div key={row._id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-slate-900">{row.name}</p>
                    <p className="truncate text-[10px] text-slate-400">{row.email}</p>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center rounded-full border px-2 py-[3px] text-[10px] font-medium ${
                      row.status === "Completed"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-400">Admin ID</p>
                    <p className="font-medium text-slate-700">{row.id}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-400">Role</p>
                    <p className="font-medium text-slate-700">{row.role}</p>
                  </div>
                  <div className="col-span-2 rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-400">Last login</p>
                    <p className="font-medium text-slate-700">{row.lastLogin}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP (sm+): table */}
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 sm:block">
          <table className="min-w-full text-left text-[11px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                </th>
                <th className="px-4 py-2 font-medium">Admin ID</th>
                <th className="px-4 py-2 font-medium">Admin name</th>
                <th className="px-4 py-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    Role
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </span>
                </th>
                <th className="px-4 py-2 font-medium">Last login</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={7}>
                    No admins found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2">
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                    </td>
                    <td className="px-4 py-2 align-middle">{row.id}</td>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col">
                        <span>{row.name}</span>
                        <span className="text-[10px] text-slate-400">{row.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 align-middle">{row.role}</td>
                    <td className="px-4 py-2 align-middle">{row.lastLogin}</td>
                    <td className="px-4 py-2 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-[3px] text-[10px] font-medium ${
                          row.status === "Completed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-middle text-right">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        title="Actions (UI only)"
                      >
                        <span className="sr-only">More</span>
                        <span className="h-1 w-1 rounded-full bg-slate-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  COMPLIANCE & SECURITY TAB (CONNECTED)                                     */
/* -------------------------------------------------------------------------- */

function ComplianceSecurityTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [requiredDocs, setRequiredDocs] = useState<string>("Passport, ID card, National Passport");
  const [verificationLevel, setVerificationLevel] = useState<string>("Advanced");
  const [flagAboveUsd, setFlagAboveUsd] = useState<number>(5000);
  const [dailyLimitUsd, setDailyLimitUsd] = useState<number>(10);
  const [require2FA, setRequire2FA] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await apiFetch<{ ok: boolean; compliance: ComplianceSettings }>("/admin/settings/compliance");
        if (!mounted) return;

        setRequiredDocs(res.compliance.requiredDocuments.join(", "));
        setVerificationLevel(res.compliance.verificationLevel || "Advanced");
        setFlagAboveUsd(Number(res.compliance.aml?.flagAboveUsd ?? 5000));
        setDailyLimitUsd(Number(res.compliance.aml?.dailyLimitUsd ?? 10));
        setRequire2FA(Boolean(res.compliance.require2FAForWithdrawal));
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load compliance settings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSave() {
    try {
      setErr("");
      setSaving(true);

      const docs = requiredDocs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await apiFetch<{ ok: boolean; compliance: ComplianceSettings }>("/admin/settings/compliance", {
        method: "PUT",
        body: JSON.stringify({
          requiredDocuments: docs,
          verificationLevel,
          aml: { flagAboveUsd, dailyLimitUsd },
          require2FAForWithdrawal: require2FA,
        }),
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to save compliance settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-slate-100 bg-white px-4 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-5">
      <h2 className="text-[13px] font-semibold text-slate-900">Compliances &amp; Security</h2>

      {err && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
          {err}
        </div>
      )}

      <div className="mt-4 space-y-4 text-[11px] text-slate-700">
        {/* KYC Settings */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-3 text-[11px] font-semibold text-slate-900">KYC Settings</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">Required Documents</span>
              <input
                disabled={loading}
                value={requiredDocs}
                onChange={(e) => setRequiredDocs(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">Verification level</span>
              <div className="relative">
                <select
                  disabled={loading}
                  value={verificationLevel}
                  onChange={(e) => setVerificationLevel(e.target.value)}
                  className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-[11px] text-slate-700 focus:border-[#2563FF] focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
                >
                  <option>Basic</option>
                  <option>Standard</option>
                  <option>Advanced</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* AML Thresholds */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-3 text-[11px] font-semibold text-slate-900">AML Thresholds</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">Transaction monitoring</span>
              <input
                disabled={loading}
                value={flagAboveUsd}
                onChange={(e) => setFlagAboveUsd(Number(e.target.value || 0))}
                type="number"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
                placeholder="5000"
              />
              <span className="text-[10px] text-slate-400">Flags amount above (USD)</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">Daily transaction limit</span>
              <input
                disabled={loading}
                value={dailyLimitUsd}
                onChange={(e) => setDailyLimitUsd(Number(e.target.value || 0))}
                type="number"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* 2FA */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">Two-Factor Authentication</p>
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-700">
            <span className="min-w-0">Require 2FA for withdrawal</span>
            <ToggleSwitch checked={require2FA} onChange={() => setRequire2FA((v) => !v)} />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={loading || saving}
            onClick={onSave}
            className="w-full rounded-lg bg-[#2563FF] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  NOTIFICATION SETTINGS TAB (CONNECTED)                                     */
/* -------------------------------------------------------------------------- */

function NotificationSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [alerts, setAlerts] = useState({
    transaction: true,
    price: true,
    security: true,
    system: true,
    referrals: true,
  });

  const [deliveryChannel, setDeliveryChannel] = useState<"push" | "email" | "sms">("push");
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await apiFetch<{ ok: boolean; notifications: NotificationSettings }>("/admin/settings/notifications");
        if (!mounted) return;

        setAlerts(res.notifications.alerts);
        setDeliveryEnabled(Boolean(res.notifications.deliveryEnabled));
        setDeliveryChannel(res.notifications.deliveryChannel);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load notification settings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSave() {
    try {
      setErr("");
      setSaving(true);
      await apiFetch<{ ok: boolean; notifications: NotificationSettings }>("/admin/settings/notifications", {
        method: "PUT",
        body: JSON.stringify({
          alerts,
          deliveryEnabled,
          deliveryChannel,
        }),
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-slate-100 bg-white px-4 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-5">
      <h2 className="text-[13px] font-semibold text-slate-900">Notification settings</h2>

      {err && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
          {err}
        </div>
      )}

      <div className="mt-4 space-y-4 text-[11px] text-slate-700">
        {/* General alerts */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">General</p>

          <div className="space-y-2">
            <SettingToggleRow
              label="Transaction alerts"
              checked={alerts.transaction}
              onToggle={() => setAlerts((s) => ({ ...s, transaction: !s.transaction }))}
            />
            <SettingToggleRow
              label="Price alerts"
              checked={alerts.price}
              onToggle={() => setAlerts((s) => ({ ...s, price: !s.price }))}
            />
            <SettingToggleRow
              label="Security alerts"
              checked={alerts.security}
              onToggle={() => setAlerts((s) => ({ ...s, security: !s.security }))}
            />
            <SettingToggleRow
              label="System updates"
              checked={alerts.system}
              onToggle={() => setAlerts((s) => ({ ...s, system: !s.system }))}
            />
            <SettingToggleRow
              label="Referrals and rewards"
              checked={alerts.referrals}
              onToggle={() => setAlerts((s) => ({ ...s, referrals: !s.referrals }))}
            />
          </div>
        </div>

        {/* Delivery channels */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold text-slate-900">Delivery channels</p>
            <ToggleSwitch checked={deliveryEnabled} onChange={() => setDeliveryEnabled((v) => !v)} />
          </div>

          <div className="space-y-2 text-[11px]">
            <RadioRow
              label="In-app push notifications"
              checked={deliveryChannel === "push"}
              onClick={() => setDeliveryChannel("push")}
            />
            <RadioRow
              label="Email notifications"
              checked={deliveryChannel === "email"}
              onClick={() => setDeliveryChannel("email")}
            />
            <RadioRow
              label="SMS notification"
              checked={deliveryChannel === "sms"}
              onClick={() => setDeliveryChannel("sms")}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={loading || saving}
            onClick={onSave}
            className="w-full rounded-lg bg-[#2563FF] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CUSTOMIZATION TAB (CONNECTED + LOGO UPLOAD)                               */
/* -------------------------------------------------------------------------- */

function CustomizationTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<null | "light" | "dark">(null);
  const [err, setErr] = useState("");

  const [custom, setCustom] = useState<CustomizationSettings | null>(null);

  // UI state mirrors backend
  const currencyOptions = ["USD", "EUR", "CAD", "GBP"];
  const languageOptions = ["English", "French", "German", "Polish", "Spanish", "Swedish"];
  const widgetOptions = [
    { key: "portfolio", label: "Portfolio" },
    { key: "crypto", label: "Crypto prices" },
    { key: "referrals", label: "Referrals" },
    { key: "recent", label: "Recent activities" },
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await apiFetch<{ ok: boolean; customization: CustomizationSettings }>(
          "/admin/settings/customization"
        );
        if (!mounted) return;
        setCustom(res.customization);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load customization");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const enabledCurrency = new Set(custom?.currency.enabled || []);
  const enabledLanguage = new Set(custom?.language.enabled || []);
  const enabledWidgets = new Set(custom?.widgets.enabled || []);

  function toggleCurrency(code: string) {
    if (!custom) return;
    const next = new Set(custom.currency.enabled);
    next.has(code) ? next.delete(code) : next.add(code);
    setCustom({ ...custom, currency: { ...custom.currency, enabled: Array.from(next) } });
  }

  function toggleLanguage(name: string) {
    if (!custom) return;
    const next = new Set(custom.language.enabled);
    next.has(name) ? next.delete(name) : next.add(name);
    setCustom({ ...custom, language: { ...custom.language, enabled: Array.from(next) } });
  }

  function toggleWidget(key: string) {
    if (!custom) return;
    const next = new Set(custom.widgets.enabled);
    next.has(key) ? next.delete(key) : next.add(key);
    setCustom({ ...custom, widgets: { ...custom.widgets, enabled: Array.from(next) } });
  }

  async function onSave() {
    if (!custom) return;
    try {
      setErr("");
      setSaving(true);
      const res = await apiFetch<{ ok: boolean; customization: CustomizationSettings }>(
        "/admin/settings/customization",
        {
          method: "PUT",
          body: JSON.stringify({
            currency: custom.currency,
            language: custom.language,
            widgets: custom.widgets,
          }),
        }
      );
      setCustom(res.customization);
    } catch (e: any) {
      setErr(e?.message || "Failed to save customization");
    } finally {
      setSaving(false);
    }
  }

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("Failed to read file"));
      r.readAsDataURL(file);
    });
  }

  async function uploadLogo(mode: "light" | "dark", file: File) {
    try {
      setErr("");
      setUploading(mode);
      const dataUrl = await fileToDataUrl(file);
      const res = await apiFetch<{ ok: boolean; url: string; customization: CustomizationSettings }>(
        "/admin/settings/customization/logo",
        {
          method: "POST",
          body: JSON.stringify({ mode, dataUrl }),
        }
      );
      setCustom(res.customization);
    } catch (e: any) {
      setErr(e?.message || "Logo upload failed");
    } finally {
      setUploading(null);
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-slate-100 bg-white px-4 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-5">
      <h2 className="text-[13px] font-semibold text-slate-900">Customization</h2>

      {err && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
          {err}
        </div>
      )}

      <div className="mt-4 space-y-4 text-[11px] text-slate-700">
        {/* Logo uploads */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-3 text-[11px] font-semibold text-slate-900">Logo</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <UploadBox
              label="Light mode logo"
              disabled={loading || uploading === "light"}
              previewUrl={custom?.logos.lightUrl || null}
              onPick={(file) => uploadLogo("light", file)}
            />
            <UploadBox
              label="Dark mode logo"
              disabled={loading || uploading === "dark"}
              previewUrl={custom?.logos.darkUrl || null}
              onPick={(file) => uploadLogo("dark", file)}
            />
          </div>
        </div>

        {/* Currency */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">Currency</p>

          <div className="grid gap-2 sm:grid-cols-2">
            {currencyOptions.map((c) => (
              <ToggleChipRow
                key={c}
                label={c}
                checked={enabledCurrency.has(c)}
                onClick={() => toggleCurrency(c)}
                disabled={loading || !custom}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Default currency</span>

            <div className="relative">
              <select
                disabled={loading || !custom}
                value={custom?.currency.default || "USD"}
                onChange={(e) =>
                  custom && setCustom({ ...custom, currency: { ...custom.currency, default: e.target.value } })
                }
                className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-left text-[11px] text-slate-700 focus:border-[#2563FF] focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">Language</p>

          <div className="grid gap-2 sm:grid-cols-3">
            {languageOptions.map((l) => (
              <ToggleChipRow
                key={l}
                label={l}
                checked={enabledLanguage.has(l)}
                onClick={() => toggleLanguage(l)}
                disabled={loading || !custom}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Default language</span>

            <div className="relative">
              <select
                disabled={loading || !custom}
                value={custom?.language.default || "English"}
                onChange={(e) =>
                  custom && setCustom({ ...custom, language: { ...custom.language, default: e.target.value } })
                }
                className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-left text-[11px] text-slate-700 focus:border-[#2563FF] focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              >
                {languageOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Homepage widgets */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">Homepage widgets</p>

          <div className="grid gap-2 sm:grid-cols-2">
            {widgetOptions.map((w) => (
              <ToggleChipRow
                key={w.key}
                label={w.label}
                checked={enabledWidgets.has(w.key)}
                onClick={() => toggleWidget(w.key)}
                disabled={loading || !custom}
              />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={loading || saving || !custom}
            onClick={onSave}
            className="w-full rounded-lg bg-[#2563FF] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SMALL COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

function StatCard(props: {
  title: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const { title, value, Icon } = props;
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

function ToggleSwitch(props: { checked: boolean; onChange: () => void }) {
  const { checked, onChange } = props;
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full border transition ${
        checked ? "border-[#2563FF]/60 bg-[#2563FF]" : "border-slate-300 bg-slate-200"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function SettingToggleRow(props: { label: string; checked: boolean; onToggle: () => void }) {
  const { label, checked, onToggle } = props;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0">{label}</span>
      <ToggleSwitch checked={checked} onChange={onToggle} />
    </div>
  );
}

function RadioRow(props: { label: string; checked: boolean; onClick: () => void }) {
  const { label, checked, onClick } = props;
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 text-left">
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
          checked ? "border-[#2563FF]" : "border-slate-300"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-[#2563FF]" />}
      </span>
      <span className="min-w-0">{label}</span>
    </button>
  );
}

function UploadBox(props: {
  label: string;
  disabled?: boolean;
  previewUrl?: string | null;
  onPick: (file: File) => void;
}) {
  const { label, disabled, previewUrl, onPick } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex h-16 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-[10px] text-slate-500 hover:border-[#2563FF] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload className="mb-1 h-4 w-4 text-slate-400" />
        <span>{label}</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.currentTarget.value = "";
        }}
      />

      {previewUrl ? (
        <div className="rounded-lg border border-slate-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${getApiBaseUrl()}${previewUrl}`} alt="" className="h-10 w-auto object-contain" />
        </div>
      ) : null}
    </div>
  );
}

function ToggleChipRow(props: { label: string; checked: boolean; onClick: () => void; disabled?: boolean }) {
  const { label, checked, onClick, disabled } = props;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[10px] disabled:cursor-not-allowed disabled:opacity-60 ${
        checked
          ? "border-[#2563FF] bg-[#2563FF]/5 text-[#2563FF]"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  ADD ADMIN MODAL (CONNECTED)                                               */
/* -------------------------------------------------------------------------- */

function AddAdminModal(props: { onClose: () => void; onCreated: () => void }) {
  const { onClose, onCreated } = props;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminRoleName, setAdminRoleName] = useState("Super admin");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function onCreate() {
    try {
      setErr("");
      setSaving(true);

      await apiFetch("/admin/settings/admins", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          password,
          adminRoleName,
        }),
      });

      onCreated();
    } catch (e: any) {
      setErr(e?.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">Add new admins</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 px-5 py-4 text-[11px] text-slate-700">
          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
              {err}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">Email address</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Role</span>
            <div className="relative">
              <select
                value={adminRoleName}
                onChange={(e) => setAdminRoleName(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pr-9 text-left text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              >
                <option>Super admin</option>
                <option>Compliance</option>
                <option>Support</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            disabled={saving || !fullName.trim() || !email.trim() || !password.trim()}
            onClick={onCreate}
            className="w-full rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}
