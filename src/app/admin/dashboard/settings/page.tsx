// src/app/admin/settings/page.tsx
"use client";

import { useState } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Upload,
} from "lucide-react";
import Image from "next/image";

/* -------------------------------------------------------------------------- */
/*  TYPES + MOCK DATA                                                         */
/* -------------------------------------------------------------------------- */

type SettingsTab =
  | "admin-management"
  | "compliance"
  | "notifications"
  | "customization";

type AdminRow = {
  id: string;
  name: string;
  role: string;
  lastLogin: string;
  status: "Completed" | "Pending";
};

const adminRows: AdminRow[] = [
  {
    id: "#74658335",
    name: "Michael Q.",
    role: "Compliance",
    lastLogin: "Nov 23",
    status: "Completed",
  },
  {
    id: "#74658336",
    name: "Michael Q.",
    role: "Support",
    lastLogin: "Nov 23",
    status: "Completed",
  },
  {
    id: "#74658337",
    name: "Michael Q.",
    role: "Super admin",
    lastLogin: "Nov 23",
    status: "Completed",
  },
  {
    id: "#74658338",
    name: "Michael Q.",
    role: "Super admin",
    lastLogin: "Nov 23",
    status: "Completed",
  },
];

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("admin-management");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER: title + search */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">
            Settings
          </h1>

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

        {/* MAIN LAYOUT: left side tab list + right side panel */}
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* LEFT VERTICAL TABS */}
          <nav className="rounded-2xl border border-slate-100 bg-white py-3 text-[12px] text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
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
          <div className="space-y-4">
            {activeTab === "admin-management" && (
              <AdminManagementTab
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
        <AddAdminModal onClose={() => setShowAddAdminModal(false)} />
      )}
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  VERTICAL TAB BUTTON                                                       */
/* -------------------------------------------------------------------------- */

function VerticalTabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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
/*  ADMIN MANAGEMENT TAB                                                      */
/* -------------------------------------------------------------------------- */

function AdminManagementTab(props: { onOpenAddAdmin: () => void }) {
  const { onOpenAddAdmin } = props;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total admins"
          value="12"
          trendImage="/Vector (1).png"
        />
        <StatCard
          title="Active admins"
          value="78"
          trendImage="/Vector 41.png"
        />
        <StatCard
          title="Inactive admins"
          value="4"
          trendImage="/Vector (4).png"
        />
      </div>

      {/* Table card */}
      <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        {/* search + filter + add button */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
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

          <button
            type="button"
            onClick={onOpenAddAdmin}
            className="inline-flex items-center justify-center rounded-lg bg-[#2563FF] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
          >
            Add admin
          </button>
        </div>

        {/* table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full text-left text-[11px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
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
                <th className="px-4 py-2 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {adminRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-2 align-middle">{row.id}</td>
                  <td className="px-4 py-2 align-middle">{row.name}</td>
                  <td className="px-4 py-2 align-middle">{row.role}</td>
                  <td className="px-4 py-2 align-middle">
                    {row.lastLogin}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[3px] text-[10px] font-medium text-emerald-700">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-middle text-right">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    >
                      <span className="sr-only">More</span>
                      <span className="h-1 w-1 rounded-full bg-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  COMPLIANCE & SECURITY TAB                                                 */
/* -------------------------------------------------------------------------- */

function ComplianceSecurityTab() {
  const [require2FA, setRequire2FA] = useState(true);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <h2 className="text-[13px] font-semibold text-slate-900">
        Compliances &amp; Security
      </h2>

      <div className="mt-4 space-y-4 text-[11px] text-slate-700">
        {/* KYC Settings */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-3 text-[11px] font-semibold text-slate-900">
            KYC Settings
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                Required Documents
              </span>
              <button className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-[11px] text-slate-600">
                <span>Passport, ID card, National Passport</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                Verification level
              </span>
              <button className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-[11px] text-slate-600">
                <span>Advanced</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* AML Thresholds */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-3 text-[11px] font-semibold text-slate-900">
            AML Thresholds
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                Transaction monitoring
              </span>
              <button className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-[11px] text-slate-600">
                <span>Flags amount above $5000</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                Daily transaction limit
              </span>
              <input
                type="text"
                defaultValue="$10"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              />
            </div>
          </div>
        </div>

        {/* 2FA */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">
            Two-Factor Authentication
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-700">
            <span>Require 2FA for withdrawal</span>
            <ToggleSwitch
              checked={require2FA}
              onChange={() => setRequire2FA((v) => !v)}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="w-full rounded-lg bg-[#2563FF] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] sm:w-auto sm:px-6"
          >
            Save settings
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  NOTIFICATION SETTINGS TAB                                                 */
/* -------------------------------------------------------------------------- */

function NotificationSettingsTab() {
  const [alerts, setAlerts] = useState({
    transaction: true,
    price: true,
    security: true,
    system: true,
    referrals: true,
  });

  const [deliveryChannel, setDeliveryChannel] =
    useState<"push" | "email" | "sms">("push");
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <h2 className="text-[13px] font-semibold text-slate-900">
        Notification settings
      </h2>

      <div className="mt-4 space-y-4 text-[11px] text-slate-700">
        {/* General alerts */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">
            General
          </p>
          <div className="space-y-2">
            <SettingToggleRow
              label="Transaction alerts"
              checked={alerts.transaction}
              onToggle={() =>
                setAlerts((s) => ({ ...s, transaction: !s.transaction }))
              }
            />
            <SettingToggleRow
              label="Price alerts"
              checked={alerts.price}
              onToggle={() =>
                setAlerts((s) => ({ ...s, price: !s.price }))
              }
            />
            <SettingToggleRow
              label="Security alerts"
              checked={alerts.security}
              onToggle={() =>
                setAlerts((s) => ({ ...s, security: !s.security }))
              }
            />
            <SettingToggleRow
              label="System updates"
              checked={alerts.system}
              onToggle={() =>
                setAlerts((s) => ({ ...s, system: !s.system }))
              }
            />
            <SettingToggleRow
              label="Referrals and rewards"
              checked={alerts.referrals}
              onToggle={() =>
                setAlerts((s) => ({ ...s, referrals: !s.referrals }))
              }
            />
          </div>
        </div>

        {/* Delivery channels */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-900">
              Delivery channels
            </p>
            <ToggleSwitch
              checked={deliveryEnabled}
              onChange={() => setDeliveryEnabled((v) => !v)}
            />
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
            className="w-full rounded-lg bg-[#2563FF] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] sm:w-auto sm:px-6"
          >
            Save settings
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CUSTOMIZATION TAB                                                         */
/* -------------------------------------------------------------------------- */

function CustomizationTab() {
  const [currency, setCurrency] = useState({
    usd: true,
    cad: true,
    eur: true,
    gbp: true,
  });
  const [language, setLanguage] = useState({
    english: true,
    polish: false,
    french: false,
    spanish: false,
    german: false,
    swedish: false,
  });
  const [widgets, setWidgets] = useState({
    portfolio: true,
    referrals: true,
    crypto: true,
    recent: true,
  });

  return (
    <section className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <h2 className="text-[13px] font-semibold text-slate-900">
        Customization
      </h2>

      <div className="mt-4 space-y-4 text-[11px] text-slate-700">
        {/* Logo uploads */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-3 text-[11px] font-semibold text-slate-900">
            Logo
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <UploadBox label="Light mode logo" />
            <UploadBox label="Dark mode logo" />
          </div>
        </div>

        {/* Currency */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">
            Currency
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleChipRow
              label="USD"
              checked={currency.usd}
              onClick={() =>
                setCurrency((s) => ({ ...s, usd: !s.usd }))
              }
            />
            <ToggleChipRow
              label="EUR"
              checked={currency.eur}
              onClick={() =>
                setCurrency((s) => ({ ...s, eur: !s.eur }))
              }
            />
            <ToggleChipRow
              label="CAD"
              checked={currency.cad}
              onClick={() =>
                setCurrency((s) => ({ ...s, cad: !s.cad }))
              }
            />
            <ToggleChipRow
              label="GBP"
              checked={currency.gbp}
              onClick={() =>
                setCurrency((s) => ({ ...s, gbp: !s.gbp }))
              }
            />
          </div>

          <div className="mt-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">
              Default currency
            </span>
            <button className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-[11px] text-slate-600">
              <span>USD</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">
            Language
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <ToggleChipRow
              label="English"
              checked={language.english}
              onClick={() =>
                setLanguage((s) => ({ ...s, english: !s.english }))
              }
            />
            <ToggleChipRow
              label="French"
              checked={language.french}
              onClick={() =>
                setLanguage((s) => ({ ...s, french: !s.french }))
              }
            />
            <ToggleChipRow
              label="German"
              checked={language.german}
              onClick={() =>
                setLanguage((s) => ({ ...s, german: !s.german }))
              }
            />
            <ToggleChipRow
              label="Polish"
              checked={language.polish}
              onClick={() =>
                setLanguage((s) => ({ ...s, polish: !s.polish }))
              }
            />
            <ToggleChipRow
              label="Spanish"
              checked={language.spanish}
              onClick={() =>
                setLanguage((s) => ({ ...s, spanish: !s.spanish }))
              }
            />
            <ToggleChipRow
              label="Swedish"
              checked={language.swedish}
              onClick={() =>
                setLanguage((s) => ({ ...s, swedish: !s.swedish }))
              }
            />
          </div>

          <div className="mt-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">
              Default language
            </span>
            <button className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-[11px] text-slate-600">
              <span>English</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Homepage widgets */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="mb-2 text-[11px] font-semibold text-slate-900">
            Homepage widgets
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleChipRow
              label="Portfolio"
              checked={widgets.portfolio}
              onClick={() =>
                setWidgets((s) => ({ ...s, portfolio: !s.portfolio }))
              }
            />
            <ToggleChipRow
              label="Crypto prices"
              checked={widgets.crypto}
              onClick={() =>
                setWidgets((s) => ({ ...s, crypto: !s.crypto }))
              }
            />
            <ToggleChipRow
              label="Referrals"
              checked={widgets.referrals}
              onClick={() =>
                setWidgets((s) => ({ ...s, referrals: !s.referrals }))
              }
            />
            <ToggleChipRow
              label="Recent activities"
              checked={widgets.recent}
              onClick={() =>
                setWidgets((s) => ({ ...s, recent: !s.recent }))
              }
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="w-full rounded-lg bg-[#2563FF] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] sm:w-auto sm:px-6"
          >
            Save settings
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

function ToggleSwitch(props: {
  checked: boolean;
  onChange: () => void;
}) {
  const { checked, onChange } = props;
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full border transition ${
        checked
          ? "border-[#2563FF]/60 bg-[#2563FF]"
          : "border-slate-300 bg-slate-200"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function SettingToggleRow(props: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const { label, checked, onToggle } = props;
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <ToggleSwitch checked={checked} onChange={onToggle} />
    </div>
  );
}

function RadioRow(props: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  const { label, checked, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 text-left"
    >
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
          checked ? "border-[#2563FF]" : "border-slate-300"
        }`}
      >
        {checked && (
          <span className="h-2 w-2 rounded-full bg-[#2563FF]" />
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

function UploadBox(props: { label: string }) {
  const { label } = props;
  return (
    <button
      type="button"
      className="flex h-16 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-[10px] text-slate-500 hover:border-[#2563FF]"
    >
      <Upload className="mb-1 h-4 w-4 text-slate-400" />
      <span>{label}</span>
    </button>
  );
}

function ToggleChipRow(props: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  const { label, checked, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[10px] ${
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
/*  ADD ADMIN MODAL                                                           */
/* -------------------------------------------------------------------------- */

function AddAdminModal(props: { onClose: () => void }) {
  const { onClose } = props;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            Add new admins
          </h2>
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
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Name</span>
            <input
              type="text"
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                Email address
              </span>
              <input
                type="email"
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">
                Password
              </span>
              <input
                type="password"
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500">Role</span>
            <button className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-[11px] text-slate-600 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563FF]/30">
              <span>Select role</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            className="w-full rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
