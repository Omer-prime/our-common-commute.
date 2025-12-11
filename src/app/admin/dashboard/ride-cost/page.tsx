// src/app/admin/ride-cost/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import { Search, X } from "lucide-react";
import Image from "next/image";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type FareStatus = "Active" | "Inactive";

type FareRule = {
  id: string;
  createdBy: string;
  dateEffective: string; // e.g. "23/11/2025"
  rideFare: number;
  driverPayout: number;
  status: FareStatus;
  transactionFee?: number;
};

/* -------------------------------------------------------------------------- */
/*  MOCK DATA                                                                 */
/* -------------------------------------------------------------------------- */

const initialFareRules: FareRule[] = [
  {
    id: "#74568335",
    createdBy: "Admin",
    dateEffective: "23/11/2025",
    rideFare: 10,
    driverPayout: 7,
    status: "Active",
  },
  {
    id: "#74568336",
    createdBy: "Admin",
    dateEffective: "23/11/2025",
    rideFare: 10,
    driverPayout: 7,
    status: "Inactive",
  },
  {
    id: "#74568337",
    createdBy: "Admin",
    dateEffective: "23/11/2025",
    rideFare: 10,
    driverPayout: 7,
    status: "Inactive",
  },
  {
    id: "#74568338",
    createdBy: "Admin",
    dateEffective: "23/11/2025",
    rideFare: 10,
    driverPayout: 7,
    status: "Inactive",
  },
  {
    id: "#74568339",
    createdBy: "Admin",
    dateEffective: "23/11/2025",
    rideFare: 10,
    driverPayout: 7,
    status: "Inactive",
  },
  {
    id: "#74568340",
    createdBy: "Admin",
    dateEffective: "23/11/2025",
    rideFare: 10,
    driverPayout: 7,
    status: "Inactive",
  },
  {
    id: "#74568341",
    createdBy: "Admin",
    dateEffective: "23/11/2025",
    rideFare: 10,
    driverPayout: 7,
    status: "Inactive",
  },
];

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminRideCostPage() {
  const [fareRules, setFareRules] = useState<FareRule[]>(initialFareRules);

  const [amountFilter, setAmountFilter] = useState<"all" | "low" | "high">(
    "all",
  );
  const [dateFilter, setDateFilter] = useState<"scheduled" | "effective">(
    "scheduled",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // top form state
  const [rideFareInput, setRideFareInput] = useState("");
  const [driverPayoutInput, setDriverPayoutInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [editingRule, setEditingRule] = useState<FareRule | null>(null);

  const handleCreateRule = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const rideFareVal = parseFloat(rideFareInput || "0");
    const driverPayoutVal = parseFloat(driverPayoutInput || "0");

    if (!rideFareVal || !driverPayoutVal || !dateInput) {
      setFormError("Please fill all fields.");
      return;
    }

    if (driverPayoutVal > rideFareVal) {
      setFormError("Driver payout must not exceed ride fare.");
      return;
    }

    const effectiveDate = new Date(dateInput);
    const formattedDate = effectiveDate.toLocaleDateString("en-GB"); // 23/11/2025

    const newRule: FareRule = {
      id: `#${Math.floor(Date.now() / 1000)}`,
      createdBy: "Admin",
      dateEffective: formattedDate,
      rideFare: rideFareVal,
      driverPayout: driverPayoutVal,
      status: "Active",
    };

    setFareRules((prev) => [newRule, ...prev]);

    setRideFareInput("");
    setDriverPayoutInput("");
    setDateInput("");
  };

  const handleSaveRule = (updated: FareRule) => {
    setFareRules((prev) =>
      prev.map((rule) => (rule.id === updated.id ? updated : rule)),
    );
    setEditingRule(null);
  };

  const filteredRules = fareRules.filter((rule) => {
    // tiny fake filters just for UI; you can plug real logic later
    if (amountFilter === "low" && rule.rideFare >= 10) return false;
    if (amountFilter === "high" && rule.rideFare < 10) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        rule.id.toLowerCase().includes(q) ||
        rule.createdBy.toLowerCase().includes(q) ||
        rule.dateEffective.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">
            Ride cost management
          </h1>

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

        {/* Top stats row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total rides"
            value="1082"
            trendImage="/Vector (1).png"
          />
          <StatCard
            title="Total Revenues"
            value="$40,009"
            trendImage="/Vector 41.png"
          />
          <StatCard
            title="Current Price per ride"
            value="$10"
            trendImage="/Vector (4).png"
          />
          <StatCard
            title="Current Driver Payout"
            value="$7"
            trendImage="/Vector 41 (1).png"
          />
        </div>

        {/* Fare settings card */}
        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-slate-900">
              Fare settings
            </h2>
            <div className="inline-flex items-center rounded-full bg-[#2563FF]/5 px-3 py-[5px] text-[10px] font-medium text-[#2563FF]">
              Driver payout must not exceed ride fare
            </div>
          </div>

          <form
            onSubmit={handleCreateRule}
            className="flex flex-col gap-3 md:flex-row"
          >
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600">
                  Ride fare per ride
                </label>
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
                <label className="text-[11px] text-slate-600">
                  Driver payout per ride
                </label>
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
                <label className="text-[11px] text-slate-600">
                  Date effective
                </label>
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

          {formError && (
            <p className="text-[10px] text-red-500">{formError}</p>
          )}
        </section>

        {/* Table card */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          {/* Filters row */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <select
              value={amountFilter}
              onChange={(e) =>
                setAmountFilter(e.target.value as "all" | "low" | "high")
              }
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            >
              <option value="all">All fare amounts</option>
              <option value="low">Below $10</option>
              <option value="high">$10 and above</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as "scheduled" | "effective")
              }
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
            <RideCostTable
              rules={filteredRules}
              onEdit={(rule) => setEditingRule(rule)}
            />
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

function RideCostTable({
  rules,
  onEdit,
}: {
  rules: FareRule[];
  onEdit: (rule: FareRule) => void;
}) {
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
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
            </td>
            <td className="px-4 py-2 align-middle">{rule.id}</td>
            <td className="px-4 py-2 align-middle">{rule.createdBy}</td>
            <td className="px-4 py-2 align-middle">{rule.dateEffective}</td>
            <td className="px-4 py-2 align-middle">
              ${rule.rideFare.toFixed(0)}
            </td>
            <td className="px-4 py-2 align-middle">
              ${rule.driverPayout.toFixed(0)}
            </td>
            <td className="px-4 py-2 align-middle">
              <span
                className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-medium ${
                  rule.status === "Active"
                    ? "border border-[#2563FF]/40 bg-[#2563FF]/5 text-[#2563FF]"
                    : "border border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {rule.status}
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
  rule: FareRule;
  onClose: () => void;
  onSave: (rule: FareRule) => void;
}) {
  const { rule, onClose, onSave } = props;

  const [rideFare, setRideFare] = useState(rule.rideFare.toString());
  const [driverPayout, setDriverPayout] = useState(
    rule.driverPayout.toString(),
  );
  const [dateEffective, setDateEffective] = useState(() => {
    // convert from "23/11/2025" -> "2025-11-23"
    const [day, month, year] = rule.dateEffective.split("/");
    return `${year}-${month}-${day}`;
  });
  const [applyFee, setApplyFee] = useState(!!rule.transactionFee);
  const [transactionFee, setTransactionFee] = useState(
    rule.transactionFee?.toString() ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const rideVal = parseFloat(rideFare || "0");
    const driverVal = parseFloat(driverPayout || "0");

    if (!rideVal || !driverVal || !dateEffective) {
      setError("Please fill all required fields.");
      return;
    }

    if (driverVal > rideVal) {
      setError("Driver payout must not exceed ride fare.");
      return;
    }

    const date = new Date(dateEffective);
    const formattedDate = date.toLocaleDateString("en-GB");

    const feeVal = applyFee ? parseFloat(transactionFee || "0") : undefined;

    const updated: FareRule = {
      ...rule,
      rideFare: rideVal,
      driverPayout: driverVal,
      dateEffective: formattedDate,
      transactionFee: feeVal,
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            Edit fare
          </h2>
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
            <label className="text-[11px] text-slate-600">
              Ride fare per ride
            </label>
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
            <label className="text-[11px] text-slate-600">
              Driver payout per ride
            </label>
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
            <label className="text-[11px] text-slate-600">
              Date effective
            </label>
            <input
              type="date"
              value={dateEffective}
              onChange={(e) => setDateEffective(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          {/* Apply transaction fee toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-700">
              Apply transaction fee
            </span>
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
            <label className="text-[11px] text-slate-600">
              Transaction fee
            </label>
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

          {error && <p className="text-[10px] text-red-500">{error}</p>}

          {/* Footer buttons */}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Update price
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
