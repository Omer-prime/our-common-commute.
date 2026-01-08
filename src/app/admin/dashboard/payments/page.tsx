// src/app/admin/payments/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Receipt,
  DollarSign,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { authedJson } from "@/src/lib/authClient";

/* --------------------------------- Types -------------------------------- */

type PaymentTab = "all" | "payouts" | "refunds";

type OverviewRes = {
  ok: true;
  stats: {
    totalTransactionsCents: number;
    totalRevenueCents: number;
    pendingPayoutsCents: number;
    disputedPaymentsCount: number;
  };
  series: {
    days: number;
    transactionSeries: Array<{ date: string; valueCents: number }>;
  };
};

type AllRow = {
  id: string;
  riderName: string;
  riderEmail: string;
  driverName: string;
  driverEmail: string | null;
  paymentMethod: string;
  amountCents: number;
  paymentStatus: "PAID" | "REFUNDED";
  paidAt: string;
};

type PayoutRow = {
  id: string;
  driverName: string;
  driverEmail: string;
  payoutMethod: string;
  amountCents: number;
  status: string;
  rides: number;
  lastPayoutAt: string;
  createdAt: string;
};

type RefundRow = {
  id: string;
  riderName: string;
  riderEmail: string;
  driverName: string;
  driverEmail: string | null;
  paymentMethod: string;
  amountCents: number;
  reason: string;
  status: "Completed";
  refundedAt: string;
};

type ListRes =
  | { ok: true; tab: "all"; page: number; limit: number; total: number; rows: AllRow[] }
  | { ok: true; tab: "payouts"; page: number; limit: number; total: number; rows: PayoutRow[] }
  | { ok: true; tab: "refunds"; page: number; limit: number; total: number; rows: RefundRow[] };

type PaymentDetailsData = {
  id: string;
  riderName: string;
  driverName: string;
  paymentMethod: string;
  amountCents: number;
  status: string;
  dateISO: string;
  kind: "all" | "payouts" | "refunds";
};

/* -------------------------------- Helpers ------------------------------- */

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
  }).format((cents ?? 0) / 100);
}

/* --------------------------------- Page --------------------------------- */

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>("payouts");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const debouncedQ = useMemo(() => q.trim(), [q]);

  const [overview, setOverview] = useState<OverviewRes | null>(null);
  const [list, setList] = useState<ListRes | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<PaymentDetailsData | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const [ov, li] = await Promise.all([
        authedJson<OverviewRes>(`/admin/payments/overview?days=30`, { method: "GET" }),
        authedJson<ListRes>(
          `/admin/payments/list?tab=${encodeURIComponent(activeTab)}&q=${encodeURIComponent(
            debouncedQ
          )}&page=${page}&limit=${limit}`,
          { method: "GET" }
        ),
      ]);

      setOverview(ov);
      setList(li);
    } catch (e: any) {
      setErr(e?.message || "Failed to load payments.");
      setOverview(null);
      setList(null);
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

  const total = list?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">Payment management</h1>

          <div className="relative mx-auto flex-1 max-w-[560px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>
        </div>

        {/* ERROR BANNER */}
        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-xs text-red-700">
            <div className="font-semibold">Failed to load payments</div>
            <div className="mt-1">{err}</div>
            <button
              onClick={load}
              className="mt-3 inline-flex rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* TOP STATS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total transaction"
            value={loading ? "..." : money(overview?.stats.totalTransactionsCents ?? 0)}
            Icon={Receipt}
          />
          <StatCard
            title="Total Revenue"
            value={loading ? "..." : money(overview?.stats.totalRevenueCents ?? 0)}
            Icon={DollarSign}
          />
          <StatCard
            title="Pending payouts"
            value={loading ? "..." : money(overview?.stats.pendingPayoutsCents ?? 0)}
            Icon={Wallet}
          />
          <StatCard
            title="Disputed payments"
            value={loading ? "..." : String(overview?.stats.disputedPaymentsCount ?? 0)}
            Icon={AlertTriangle}
          />
        </div>

        {/* OVERVIEW CHART */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-900">Total Transaction Overview</h2>
              <p className="text-[11px] text-slate-400">Summary</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600"
              title="UI only"
            >
              Monthly
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <PaymentOverviewChart series={overview?.series.transactionSeries ?? []} />
        </section>

        {/* TABLE CARD */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Tabs */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-md px-4 py-1.5 text-xs font-medium ${
                  activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-slate-200/80"
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

            {/* Search + filter */}
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
                title="UI only"
              >
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-100">
            {!loading && (list?.rows?.length ?? 0) === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] text-slate-400">No records found.</div>
            ) : activeTab === "refunds" ? (
              <RefundsTable
                rows={list && list.tab === "refunds" ? list.rows : []}
                onOpenDetails={(row) =>
                  setSelectedPayment({
                    id: row.id,
                    riderName: row.riderName,
                    driverName: row.driverName,
                    paymentMethod: row.paymentMethod,
                    amountCents: row.amountCents,
                    status: row.status,
                    dateISO: row.refundedAt,
                    kind: "refunds",
                  })
                }
              />
            ) : activeTab === "payouts" ? (
              <PayoutsTable
                rows={list && list.tab === "payouts" ? list.rows : []}
                onOpenDetails={(row) =>
                  setSelectedPayment({
                    id: row.id,
                    riderName: "-",
                    driverName: row.driverName,
                    paymentMethod: row.payoutMethod,
                    amountCents: row.amountCents,
                    status: row.status,
                    dateISO: row.createdAt,
                    kind: "payouts",
                  })
                }
                label="View details"
              />
            ) : (
              <AllTxTable
                rows={list && list.tab === "all" ? list.rows : []}
                onOpenDetails={(row) =>
                  setSelectedPayment({
                    id: row.id,
                    riderName: row.riderName,
                    driverName: row.driverName,
                    paymentMethod: row.paymentMethod,
                    amountCents: row.amountCents,
                    status: row.paymentStatus,
                    dateISO: row.paidAt,
                    kind: "all",
                  })
                }
              />
            )}
          </div>

          {/* Pagination */}
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

      {selectedPayment && (
        <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </AdminShell>
  );
}

/* --------------------------- Small Components ---------------------------- */

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

      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

/* ------------------------------- Chart ---------------------------------- */

function PaymentOverviewChart({ series }: { series: Array<{ date: string; valueCents: number }> }) {
  const bars = (series ?? []).slice(-14);
  const max = Math.max(1, ...bars.map((b) => b.valueCents));
  const barAreaHeight = 160;

  if (!bars.length) {
    return <p className="text-[11px] text-slate-400">No transactions data yet.</p>;
  }

  return (
    <div className="mt-1">
      <div className="relative h-56">
        <div className="absolute left-0 right-0 top-8 border-t border-dashed border-slate-200" />
        <div className="absolute inset-x-0 bottom-4 flex h-[160px] items-end justify-between px-1">
          {bars.map((item) => {
            const barHeight = (item.valueCents / max) * barAreaHeight;
            const label = item.date.slice(5); // MM-DD

            return (
              <div key={item.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-6 items-end justify-center">
                  <div
                    className="w-full rounded-t-full bg-[#E4ECFF]"
                    style={{ height: barHeight }}
                    title={`${label}: ${money(item.valueCents)}`}
                  />
                </div>
                <span className="mt-1 text-[10px] text-slate-500">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Tables --------------------------------- */

function AllTxTable(props: { rows: AllRow[]; onOpenDetails: (row: AllRow) => void }) {
  const { rows, onOpenDetails } = props;

  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2 font-medium">Transaction</th>
          <th className="px-4 py-2 font-medium">Rider</th>
          <th className="px-4 py-2 font-medium">Driver</th>
          <th className="px-4 py-2 font-medium">Method</th>
          <th className="px-4 py-2 font-medium">Amount</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium">Date</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100 text-slate-700">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">#{row.id.slice(0, 10)}</td>
            <td className="px-4 py-2">{row.riderName}</td>
            <td className="px-4 py-2">{row.driverName}</td>
            <td className="px-4 py-2">{row.paymentMethod}</td>
            <td className="px-4 py-2">{money(row.amountCents)}</td>
            <td className="px-4 py-2">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-[3px] text-[10px] font-medium ${
                  row.paymentStatus === "REFUNDED"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {row.paymentStatus}
              </span>
            </td>
            <td className="px-4 py-2">{fmtDate(row.paidAt)}</td>
            <td className="px-4 py-2 text-right">
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
          <th className="px-4 py-2 font-medium">Payout ID</th>
          <th className="px-4 py-2 font-medium">Driver</th>
          <th className="px-4 py-2 font-medium">Method</th>
          <th className="px-4 py-2 font-medium">Amount</th>
          <th className="px-4 py-2 font-medium">Rides</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium">Last update</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">#{row.id.slice(0, 10)}</td>
            <td className="px-4 py-2">{row.driverName}</td>
            <td className="px-4 py-2">{row.payoutMethod}</td>
            <td className="px-4 py-2">{money(row.amountCents)}</td>
            <td className="px-4 py-2">{row.rides}</td>
            <td className="px-4 py-2">{row.status}</td>
            <td className="px-4 py-2">{fmtDate(row.lastPayoutAt)}</td>
            <td className="px-4 py-2 text-right">
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

function RefundsTable(props: { rows: RefundRow[]; onOpenDetails: (row: RefundRow) => void }) {
  const { rows, onOpenDetails } = props;

  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2 font-medium">Refund ID</th>
          <th className="px-4 py-2 font-medium">Rider</th>
          <th className="px-4 py-2 font-medium">Driver</th>
          <th className="px-4 py-2 font-medium">Amount</th>
          <th className="px-4 py-2 font-medium">Reason</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium">Date</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">#{row.id.slice(0, 10)}</td>
            <td className="px-4 py-2">{row.riderName}</td>
            <td className="px-4 py-2">{row.driverName}</td>
            <td className="px-4 py-2">{money(row.amountCents)}</td>
            <td className="px-4 py-2">{row.reason}</td>
            <td className="px-4 py-2">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-[3px] text-[10px] font-medium text-amber-700">
                {row.status}
              </span>
            </td>
            <td className="px-4 py-2">{fmtDate(row.refundedAt)}</td>
            <td className="px-4 py-2 text-right">
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

/* ------------------------ Payment details modal -------------------------- */

function PaymentDetailsModal(props: { payment: PaymentDetailsData; onClose: () => void }) {
  const { payment, onClose } = props;
  const avatarSrc = "/A.jpg"; // optional

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">Payment Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="grid gap-3 border-b border-slate-200 px-5 py-4 sm:grid-cols-2">
          <PersonCard avatarSrc={avatarSrc} name={payment.riderName} role="Rider" status="Active" />
          <PersonCard avatarSrc={avatarSrc} name={payment.driverName} role="Driver" status="Active" />
        </div>

        <div className="space-y-2 px-5 py-4 text-[11px] text-slate-700">
          <h3 className="text-[12px] font-semibold text-slate-900">Transaction Details</h3>
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-y-2">
            <span className="text-slate-400">Transaction ID</span>
            <span className="text-right font-medium">{payment.id}</span>

            <span className="text-slate-400">Transaction date</span>
            <span className="text-right">{fmtDate(payment.dateISO)}</span>

            <span className="text-slate-400">Status</span>
            <span className="text-right">{payment.status}</span>

            <span className="text-slate-400">Payment method</span>
            <span className="text-right">{payment.paymentMethod}</span>

            <span className="text-slate-400">Amount</span>
            <span className="text-right font-medium">{money(payment.amountCents)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-4 sm:flex-row">
          <button
            type="button"
            className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            title="UI only"
          >
            Refund
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
            title="UI only"
          >
            Release driver payout
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonCard(props: { avatarSrc: string; name: string; role: string; status: string }) {
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
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-[1px] text-[9px] font-medium text-emerald-700">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
