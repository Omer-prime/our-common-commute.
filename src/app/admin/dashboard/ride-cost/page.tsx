// src/app/admin/dashboard/ride-cost/page.tsx
"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import { Search, X, Car, DollarSign, Tag, Wallet } from "lucide-react";
import { authedJson } from "@/src/lib/authClient";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type FareStatus = "ACTIVE" | "INACTIVE";

type FareRuleRow = {
  id: string;
  createdBy: string;
  createdAt: string;   // ISO
  effectiveAt: string; // ISO
  rideFareCents: number;
  driverPayoutCents: number;
  transactionFeeCents: number | null;
  status: FareStatus;
};

type OverviewRes = {
  ok: true;
  stats: {
    totalRides: number;
    totalRevenueCents: number;
    currentRideFareCents: number;
    currentDriverPayoutCents: number;
  };
};

type ListRes = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  rows: FareRuleRow[];
};

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
}

function isoToDateInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminRideCostPage() {
  // filters
  const [amountFilter, setAmountFilter] = useState<"all" | "low" | "high">("all");
  const [dateFilter, setDateFilter] = useState<"scheduled" | "effective">("scheduled");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const limit = 10;

  const q = useMemo(() => searchQuery.trim(), [searchQuery]);

  // data
  const [overview, setOverview] = useState<OverviewRes | null>(null);
  const [list, setList] = useState<ListRes | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // top form state
  const [rideFareInput, setRideFareInput] = useState("");
  const [driverPayoutInput, setDriverPayoutInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // edit modal state
  const [editingRule, setEditingRule] = useState<FareRuleRow | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const [ov, li] = await Promise.all([
        authedJson<OverviewRes>(`/admin/ride-cost/overview`, { method: "GET" }),
        authedJson<ListRes>(
          `/admin/ride-cost/rules?amount=${encodeURIComponent(amountFilter)}&date=${encodeURIComponent(
            dateFilter
          )}&q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
          { method: "GET" }
        ),
      ]);

      setOverview(ov);
      setList(li);
    } catch (e: any) {
      setErr(e?.message || "Failed to load ride cost data.");
      setOverview(null);
      setList(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountFilter, dateFilter, q, page]);

  useEffect(() => {
    setPage(1);
  }, [amountFilter, dateFilter, q]);

  const total = list?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleCreateRule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const rideFareVal = Number.parseFloat(rideFareInput || "0");
    const driverPayoutVal = Number.parseFloat(driverPayoutInput || "0");

    if (!rideFareVal || !driverPayoutVal || !dateInput) {
      setFormError("Please fill all fields.");
      return;
    }

    if (driverPayoutVal > rideFareVal) {
      setFormError("Driver payout must not exceed ride fare.");
      return;
    }

    const rideFareCents = Math.round(rideFareVal * 100);
    const driverPayoutCents = Math.round(driverPayoutVal * 100);

    try {
      await authedJson(`/admin/ride-cost/rules`, {
        method: "POST",
        body: JSON.stringify({
          rideFareCents,
          driverPayoutCents,
          effectiveAt: dateInput, // YYYY-MM-DD ok
          transactionFeeCents: null,
        }),
      });

      setRideFareInput("");
      setDriverPayoutInput("");
      setDateInput("");

      await load();
    } catch (e: any) {
      setFormError(e?.message || "Failed to create fare rule.");
    }
  };

  const handleSaveRule = async (updated: {
    id: string;
    rideFareCents: number;
    driverPayoutCents: number;
    effectiveAt: string; // YYYY-MM-DD
    transactionFeeCents: number | null;
  }) => {
    try {
      await authedJson(`/admin/ride-cost/rules/${encodeURIComponent(updated.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          rideFareCents: updated.rideFareCents,
          driverPayoutCents: updated.driverPayoutCents,
          effectiveAt: updated.effectiveAt,
          transactionFeeCents: updated.transactionFeeCents,
        }),
      });

      setEditingRule(null);
      await load();
    } catch (e: any) {
      // modal handles error display
      throw new Error(e?.message || "Failed to update rule.");
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">Ride cost management</h1>

          <div className="relative mx-auto flex-1 max-w-[560px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>
        </div>

        {/* Error banner */}
        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-xs text-red-700">
            <div className="font-semibold">Failed to load ride cost</div>
            <div className="mt-1">{err}</div>
            <button
              onClick={load}
              className="mt-3 inline-flex rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Top stats row (from backend) */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
  <StatCard
    title="Total rides"
    value={loading ? "..." : String(overview?.stats.totalRides ?? 0)}
    icon={<Car className="h-5 w-5 text-slate-500" />}
  />
  <StatCard
    title="Total Revenues"
    value={loading ? "..." : money(overview?.stats.totalRevenueCents ?? 0)}
    icon={<DollarSign className="h-5 w-5 text-slate-500" />}
  />
  <StatCard
    title="Current Price per ride"
    value={loading ? "..." : money(overview?.stats.currentRideFareCents ?? 0)}
    icon={<Tag className="h-5 w-5 text-slate-500" />}
  />
  <StatCard
    title="Current Driver Payout"
    value={loading ? "..." : money(overview?.stats.currentDriverPayoutCents ?? 0)}
    icon={<Wallet className="h-5 w-5 text-slate-500" />}
  />
</div>


        {/* Fare settings card */}
        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-slate-900">Fare settings</h2>
            <div className="inline-flex items-center rounded-full bg-[#2563FF]/5 px-3 py-[5px] text-[10px] font-medium text-[#2563FF]">
              Driver payout must not exceed ride fare
            </div>
          </div>

          <form onSubmit={handleCreateRule} className="flex flex-col gap-3 md:flex-row">
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">Ride fare per ride</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={rideFareInput}
                    onChange={(e) => setRideFareInput(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-6 pr-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">Driver payout per ride</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={driverPayoutInput}
                    onChange={(e) => setDriverPayoutInput(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-6 pr-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">Date effective</label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="h-9 rounded-lg bg-[#2563FF] px-5 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Update price
            </button>
          </form>

          {formError ? <p className="text-[10px] text-red-500">{formError}</p> : null}
        </section>

        {/* Table card */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          {/* Filters row */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value as "all" | "low" | "high")}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            >
              <option value="all">All fare amounts</option>
              <option value="low">Below $10</option>
              <option value="high">$10 and above</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as "scheduled" | "effective")}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            >
              <option value="scheduled">Date scheduled</option>
              <option value="effective">Date effective</option>
            </select>

            <div className="relative ml-auto w-48">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            {!loading && (list?.rows?.length ?? 0) === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] text-slate-400">No rules found.</div>
            ) : (
              <RideCostTable rules={list?.rows ?? []} onEdit={(rule) => setEditingRule(rule)} />
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

      {editingRule && (
        <EditFareModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={handleSaveRule}
        />
      )}
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  SMALL COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

function StatCard(props: { title: string; value: string; icon: React.ReactNode }) {
  const { title, value, icon } = props;
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[10px] text-slate-400">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>

      <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50">
        {icon}
      </div>
    </div>
  );
}

function RideCostTable({ rules, onEdit }: { rules: FareRuleRow[]; onEdit: (rule: FareRuleRow) => void }) {
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
          </th>
          <th className="px-4 py-2 font-medium">Rule ID</th>
          <th className="px-4 py-2 font-medium">Created by</th>
          <th className="px-4 py-2 font-medium">Date effective</th>
          <th className="px-4 py-2 font-medium">Ride fare</th>
          <th className="px-4 py-2 font-medium">Driver payout</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {rules.map((rule) => (
          <tr key={rule.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </td>
            <td className="px-4 py-2 align-middle">#{rule.id.slice(0, 10)}</td>
            <td className="px-4 py-2 align-middle">{rule.createdBy}</td>
            <td className="px-4 py-2 align-middle">{fmtDate(rule.effectiveAt)}</td>
            <td className="px-4 py-2 align-middle">{money(rule.rideFareCents)}</td>
            <td className="px-4 py-2 align-middle">{money(rule.driverPayoutCents)}</td>
            <td className="px-4 py-2 align-middle">
              <span
                className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-medium ${
                  rule.status === "ACTIVE"
                    ? "border border-[#2563FF]/40 bg-[#2563FF]/5 text-[#2563FF]"
                    : "border border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {rule.status === "ACTIVE" ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-4 py-2 align-middle text-right">
              <button
                type="button"
                onClick={() => onEdit(rule)}
                className="rounded-lg bg-[#2563FF]/5 px-3 py-1 text-[11px] font-medium text-[#2563FF] hover:bg-[#2563FF]/10"
              >
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ----------------------------- Edit Fare Modal ---------------------------- */

function EditFareModal(props: {
  rule: FareRuleRow;
  onClose: () => void;
  onSave: (payload: {
    id: string;
    rideFareCents: number;
    driverPayoutCents: number;
    effectiveAt: string; // YYYY-MM-DD
    transactionFeeCents: number | null;
  }) => Promise<void>;
}) {
  const { rule, onClose, onSave } = props;

  const [rideFare, setRideFare] = useState(String((rule.rideFareCents ?? 0) / 100));
  const [driverPayout, setDriverPayout] = useState(String((rule.driverPayoutCents ?? 0) / 100));
  const [dateEffective, setDateEffective] = useState(() => isoToDateInput(rule.effectiveAt));

  const [applyFee, setApplyFee] = useState(!!rule.transactionFeeCents);
  const [transactionFee, setTransactionFee] = useState(
    rule.transactionFeeCents ? String(rule.transactionFeeCents / 100) : ""
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const rideVal = Number.parseFloat(rideFare || "0");
    const driverVal = Number.parseFloat(driverPayout || "0");

    if (!rideVal || !driverVal || !dateEffective) {
      setError("Please fill all required fields.");
      return;
    }

    if (driverVal > rideVal) {
      setError("Driver payout must not exceed ride fare.");
      return;
    }

    const feeVal = applyFee ? Number.parseFloat(transactionFee || "0") : null;
    if (applyFee && (Number.isNaN(feeVal as number) || (feeVal as number) < 0)) {
      setError("Invalid transaction fee.");
      return;
    }

    const payload = {
      id: rule.id,
      rideFareCents: Math.round(rideVal * 100),
      driverPayoutCents: Math.round(driverVal * 100),
      effectiveAt: dateEffective,
      transactionFeeCents: applyFee ? Math.round((feeVal as number) * 100) : null,
    };

    try {
      setSaving(true);
      await onSave(payload);
    } catch (e: any) {
      setError(e?.message || "Failed to update rule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">Edit fare</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Ride fare per ride</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                $
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={rideFare}
                onChange={(e) => setRideFare(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-6 pr-3 text-[11px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Driver payout per ride</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                $
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={driverPayout}
                onChange={(e) => setDriverPayout(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-6 pr-3 text-[11px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Date effective</label>
            <input
              type="date"
              value={dateEffective}
              onChange={(e) => setDateEffective(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-700">Apply transaction fee</span>
            <button
              type="button"
              onClick={() => setApplyFee((prev) => !prev)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                applyFee ? "bg-[#22c55e]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                  applyFee ? "translate-x-3" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Transaction fee</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                $
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={transactionFee}
                onChange={(e) => setTransactionFee(e.target.value)}
                disabled={!applyFee}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-6 pr-3 text-[11px] text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              />
            </div>
          </div>

          {error ? <p className="text-[10px] text-red-500">{error}</p> : null}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Update price"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
