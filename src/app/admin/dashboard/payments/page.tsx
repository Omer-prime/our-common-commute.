// src/app/admin/payments/page.tsx
"use client";

import { useState } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
} from "lucide-react";
import Image from "next/image";
import { PaymentOverviewChart } from "@/src/components/admin-charts";

/* -------------------------------------------------------------------------- */
/*  TYPES & MOCK DATA                                                         */
/* -------------------------------------------------------------------------- */

type PaymentTab = "all" | "payouts" | "refunds";

type PayoutRow = {
  id: string;
  riderName: string;
  driverName: string;
  paymentMethod: string;
  pendingAmount: string;
  rides: number;
  lastPayout: string;
};

type RefundRow = {
  id: string;
  riderName: string;
  driverName: string;
  pendingAmount: string;
  reason: string;
  status: "Pending" | "Completed";
};

type PaymentDetailsData = {
  id: string;
  riderName: string;
  driverName: string;
  paymentMethod: string;
  amount: string;
};

const payoutRows: PayoutRow[] = [
  {
    id: "#74568335",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    paymentMethod: "Paypal",
    pendingAmount: "$340.90",
    rides: 5,
    lastPayout: "20-10-2025",
  },
  {
    id: "#74568336",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    paymentMethod: "Bank transfer",
    pendingAmount: "$340.90",
    rides: 5,
    lastPayout: "20-10-2025",
  },
  {
    id: "#74568337",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    paymentMethod: "Apple",
    pendingAmount: "$340.90",
    rides: 5,
    lastPayout: "20-10-2025",
  },
  {
    id: "#74568338",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    paymentMethod: "Paypal",
    pendingAmount: "$340.90",
    rides: 5,
    lastPayout: "20-10-2025",
  },
  {
    id: "#74568339",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    paymentMethod: "Apple",
    pendingAmount: "$340.90",
    rides: 5,
    lastPayout: "20-10-2025",
  },
];

const refundRows: RefundRow[] = [
  {
    id: "#RF-74568335",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    pendingAmount: "$340.90",
    reason: "Rider dispute",
    status: "Pending",
  },
  {
    id: "#RF-74568336",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    pendingAmount: "$340.90",
    reason: "Driver no show",
    status: "Pending",
  },
  {
    id: "#RF-74568337",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    pendingAmount: "$340.90",
    reason: "Rider dispute",
    status: "Pending",
  },
  {
    id: "#RF-74568338",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    pendingAmount: "$340.90",
    reason: "Driver no show",
    status: "Pending",
  },
  {
    id: "#RF-74568339",
    riderName: "Amos Hulley",
    driverName: "Amos Hulley",
    pendingAmount: "$340.90",
    reason: "Rider dispute",
    status: "Pending",
  },
];

// For "All transactions" we just reuse payoutRows for now
const allTransactions: PayoutRow[] = payoutRows;

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>("payouts");
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentDetailsData | null>(null);

  const openPaymentDetails = (row: {
    id: string;
    riderName: string;
    driverName: string;
    paymentMethod: string;
    pendingAmount: string;
  }) => {
    setSelectedPayment({
      id: row.id,
      riderName: row.riderName,
      driverName: row.driverName,
      paymentMethod: row.paymentMethod,
      amount: row.pendingAmount,
    });
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER: title + centered search */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">
            Payment management
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
            title="Total transaction"
            value="$120,094"
            trendImage="/Vector (1).png"
          />
          <StatCard
            title="Total Revenue"
            value="$200,003"
            trendImage="/Vector 41.png"
          />
          <StatCard
            title="Pending payouts"
            value="$2,000"
            trendImage="/Vector (4).png"
          />
          <StatCard
            title="Disputed payments"
            value="231"
            trendImage="/Vector 41 (1).png"
          />
        </div>

        {/* TOTAL TRANSACTION OVERVIEW CHART */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-900">
                Total Transaction Overview
              </h2>
              <p className="text-[11px] text-slate-400">Summary</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600"
            >
              Monthly
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* NEW Recharts-based chart, same vibe as dashboard */}
          <PaymentOverviewChart />
        </section>

        {/* TABLE CARD */}
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
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                }`}
              >
                All transactions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("payouts")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${
                  activeTab === "payouts"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                }`}
              >
                Driver payouts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("refunds")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${
                  activeTab === "refunds"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200/80"
                }`}
              >
                Refunds
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

          {/* TABLES */}
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-100">
            {activeTab === "refunds" ? (
              <RefundsTable
                rows={refundRows}
                onOpenDetails={(row) =>
                  openPaymentDetails({
                    id: row.id,
                    riderName: row.riderName,
                    driverName: row.driverName,
                    paymentMethod: "Paypal",
                    pendingAmount: row.pendingAmount,
                  })
                }
              />
            ) : (
              <PayoutsTable
                rows={activeTab === "all" ? allTransactions : payoutRows}
                onOpenDetails={openPaymentDetails}
                label={activeTab === "all" ? "View details" : "Release payout"}
              />
            )}
          </div>
        </section>
      </div>

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </AdminShell>
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

/* --------------------------- Tables -------------------------------------- */

function PayoutsTable(props: {
  rows: PayoutRow[];
  label: string;
  onOpenDetails: (row: PayoutRow) => void;
}) {
  const { rows, label, onOpenDetails } = props;

  return (
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
          <th className="px-4 py-2 font-medium">Rider name</th>
          <th className="px-4 py-2 font-medium">Driver name</th>
          <th className="px-4 py-2 font-medium">Payment method</th>
          <th className="px-4 py-2 font-medium">Pending amount</th>
          <th className="px-4 py-2 font-medium">Numbers of rides</th>
          <th className="px-4 py-2 font-medium">Last Payout</th>
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
            <td className="px-4 py-2 align-middle">{row.riderName}</td>
            <td className="px-4 py-2 align-middle">{row.driverName}</td>
            <td className="px-4 py-2 align-middle">{row.paymentMethod}</td>
            <td className="px-4 py-2 align-middle">{row.pendingAmount}</td>
            <td className="px-4 py-2 align-middle">{row.rides}</td>
            <td className="px-4 py-2 align-middle">{row.lastPayout}</td>
            <td className="px-4 py-2 align-middle text-right">
              <button
                type="button"
                onClick={() => onOpenDetails(row)}
                className="rounded-full bg-[#2563FF]/5 px-3 py-1 text-[11px] font-medium text-[#2563FF] hover:bg-[#2563FF]/10"
              >
                {label}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RefundsTable(props: {
  rows: RefundRow[];
  onOpenDetails: (row: RefundRow) => void;
}) {
  const { rows, onOpenDetails } = props;

  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
          </th>
          <th className="px-4 py-2 font-medium">Refund ID</th>
          <th className="px-4 py-2 font-medium">Rider name</th>
          <th className="px-4 py-2 font-medium">Driver name</th>
          <th className="px-4 py-2 font-medium">Pending amount</th>
          <th className="px-4 py-2 font-medium">Reason for refund</th>
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
            <td className="px-4 py-2 align-middle">{row.riderName}</td>
            <td className="px-4 py-2 align-middle">{row.driverName}</td>
            <td className="px-4 py-2 align-middle">{row.pendingAmount}</td>
            <td className="px-4 py-2 align-middle">{row.reason}</td>
            <td className="px-4 py-2 align-middle">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-[3px] text-[10px] font-medium text-amber-700">
                {row.status}
              </span>
            </td>
            <td className="px-4 py-2 align-middle text-right">
              <button
                type="button"
                onClick={() => onOpenDetails(row)}
                className="rounded-full bg-[#2563FF]/5 px-3 py-1 text-[11px] font-medium text-[#2563FF] hover:bg-[#2563FF]/10"
              >
                View details
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------ Payment details modal --------------------------- */

function PaymentDetailsModal(props: {
  payment: PaymentDetailsData;
  onClose: () => void;
}) {
  const { payment, onClose } = props;
  const avatarSrc = "/A.jpg"; // put your avatar image in /public/A.jpg

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            Payment Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Rider & Driver cards */}
        <div className="grid gap-3 border-b border-slate-200 px-5 py-4 sm:grid-cols-2">
          <PersonCard
            avatarSrc={avatarSrc}
            name={payment.riderName}
            role="Riders"
            status="Active"
          />
          <PersonCard
            avatarSrc={avatarSrc}
            name={payment.driverName}
            role="Driver"
            status="Active"
          />
        </div>

        {/* Transaction details */}
        <div className="space-y-2 px-5 py-4 text-[11px] text-slate-700">
          <h3 className="text-[12px] font-semibold text-slate-900">
            Transaction Details
          </h3>
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-y-2">
            <span className="text-slate-400">Transaction ID</span>
            <span className="text-right font-medium">{payment.id}</span>

            <span className="text-slate-400">Transaction date</span>
            <span className="text-right">24 May, 2025</span>

            <span className="text-slate-400">Status</span>
            <span className="text-right">Completed</span>

            <span className="text-slate-400">Payment method</span>
            <span className="text-right">{payment.paymentMethod}</span>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex flex-col gap-2 border-t border-slate-200 p-4 sm:flex-row">
          <button
            type="button"
            className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
          >
            Refund
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
          >
            Release driver payout
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonCard(props: {
  avatarSrc: string;
  name: string;
  role: string;
  status: string;
}) {
  const { avatarSrc, name, role, status } = props;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-200">
        <Image src={avatarSrc} alt={name} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <p className="text-[12px] font-semibold text-slate-900">{name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <span>{role}</span>
          <span className="h-3 w-[1px] bg-slate-300" />
          <span>ID-CLT-001</span>
          <span className="h-3 w-[1px] bg-slate-300" />
          <span>Date joined: 23-09-2025</span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-[1px] text-[9px] font-medium text-emerald-700">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
