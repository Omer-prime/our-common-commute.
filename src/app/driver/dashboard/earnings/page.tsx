"use client";

import { useEffect, useMemo, useState } from "react";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { apiFetch, type ApiFail } from "@/src/lib/api";

type SummaryRes = {
  ok: true;
  currency: string;
  availableCents: number;
  lifetimeEarnedCents: number;
  lifetimeWithdrawnCents: number;
};

type ChartPoint = { month: string; netCents: number };
type ChartRes = { ok: true; year: number; points: ChartPoint[] };

type Tx = {
  id: string;
  type: string; // EarningTransactionType
  direction: "CREDIT" | "DEBIT";
  title: string;
  description: string | null;
  amountCents: number;
  createdAt: string;
};

type TxRes = {
  ok: true;
  nextCursor: string | null;
  transactions: Tx[];
};

type PayoutMethod = {
  id: string;
  type: string; // PayoutMethod
  label: string;
  subLabel: string | null;
  isDefault: boolean;
};

type MethodsRes = {
  ok: true;
  methods: PayoutMethod[];
};

function money(cents: number, currency = "USD") {
  const v = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function errText(e: unknown) {
  const x = e as Partial<ApiFail>;
  if (x?.status === 401) return "Unauthorized. Please login again.";
  if (x?.error) return `${x.error}${x.status ? ` (HTTP ${x.status})` : ""}`;
  return "Something went wrong.";
}

export default function DriverEarningsPage() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState<number>(currentYear);

  const [summary, setSummary] = useState<SummaryRes | null>(null);
  const [chart, setChart] = useState<ChartRes | null>(null);

  const [txs, setTxs] = useState<Tx[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [methods, setMethods] = useState<PayoutMethod[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // withdraw modal
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawErr, setWithdrawErr] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [methodId, setMethodId] = useState<string>("");

  const currency = summary?.currency ?? "USD";

  const defaultMethod = useMemo(() => {
    if (!methods.length) return null;
    return methods.find((m) => m.isDefault) ?? methods[0];
  }, [methods]);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [s, c, m, t] = await Promise.all([
        apiFetch<SummaryRes>("/driver/earnings/summary", { method: "GET", noStore: true }),
        apiFetch<ChartRes>(`/driver/earnings/chart?year=${encodeURIComponent(String(year))}`, {
          method: "GET",
          noStore: true,
        }),
        apiFetch<MethodsRes>("/driver/earnings/payment-methods", { method: "GET", noStore: true }),
        apiFetch<TxRes>("/driver/earnings/transactions?limit=20", { method: "GET", noStore: true }),
      ]);

      setSummary(s);
      setChart(c);
      setMethods(m.methods || []);
      setTxs(t.transactions || []);
      setNextCursor(t.nextCursor);

      // set default withdraw method
      const pick = (m.methods || []).find((x) => x.isDefault)?.id ?? (m.methods || [])[0]?.id ?? "";
      setMethodId(pick);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await apiFetch<TxRes>(
        `/driver/earnings/transactions?limit=20&cursor=${encodeURIComponent(nextCursor)}`,
        { method: "GET", noStore: true }
      );
      setTxs((prev) => [...prev, ...(res.transactions || [])]);
      setNextCursor(res.nextCursor);
    } catch (e) {
      // keep existing list; show top-level error
      setErr(errText(e));
    } finally {
      setLoadingMore(false);
    }
  }

  async function doWithdraw() {
    setWithdrawErr(null);

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setWithdrawErr("Enter a valid amount.");
      return;
    }
    if (!methodId) {
      setWithdrawErr("Select a payout method.");
      return;
    }

    const amountCents = Math.round(amt * 100);

    setWithdrawBusy(true);
    try {
      await apiFetch("/driver/earnings/withdraw", {
        method: "POST",
        noStore: true,
        json: { payoutMethodId: methodId, amountCents },
      });

      setWithdrawOpen(false);
      setAmount("");

      // refresh summary + first page txs (safe)
      await loadAll();
    } catch (e) {
      setWithdrawErr(errText(e));
    } finally {
      setWithdrawBusy(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const maxAbs = useMemo(() => {
    const pts = chart?.points || [];
    let mx = 1;
    for (const p of pts) mx = Math.max(mx, Math.abs(p.netCents || 0));
    return mx || 1;
  }, [chart]);

  return (
    <DriverDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-100">Earnings</div>
            <div className="mt-0.5 text-xs text-slate-400">Track balance, payouts, and transactions</div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-200"
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const y = currentYear - i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>

            <button
              onClick={() => setWithdrawOpen(true)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-sm text-slate-200">
            Loading earnings...
          </div>
        )}

        {err && (
          <div className="rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
            {err}{" "}
            <button className="ml-2 underline" onClick={loadAll}>
              Retry
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Available balance"
            value={money(summary?.availableCents ?? 0, currency)}
            hint="Withdrawable"
          />
          <StatCard label="Lifetime earned" value={money(summary?.lifetimeEarnedCents ?? 0, currency)} />
          <StatCard label="Lifetime withdrawn" value={money(summary?.lifetimeWithdrawnCents ?? 0, currency)} />
          <StatCard label="Payout method" value={defaultMethod ? defaultMethod.label : "—"} hint={defaultMethod?.type} />
        </section>

        {/* Chart + Methods */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Chart */}
          <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-100">Monthly net</div>
              <div className="text-xs text-slate-400">{year}</div>
            </div>

            <div className="mt-4 grid grid-cols-12 items-end gap-1.5">
              {(chart?.points || []).map((p) => {
                const h = Math.max(2, Math.round((Math.abs(p.netCents) / maxAbs) * 90));
                const isNeg = p.netCents < 0;
                return (
                  <div key={p.month} className="flex flex-col items-center gap-1">
                    <div
                      title={`${p.month}: ${money(p.netCents, currency)}`}
                      className={`w-full rounded-md ${isNeg ? "bg-red-500/40" : "bg-blue-500/40"}`}
                      style={{ height: `${h}px` }}
                    />
                    <div className="text-[10px] text-slate-500">{p.month}</div>
                  </div>
                );
              })}
              {!chart?.points?.length && (
                <div className="col-span-12 rounded-xl border border-slate-800 bg-slate-900/20 p-3 text-xs text-slate-400">
                  No chart data yet.
                </div>
              )}
            </div>
          </div>

          {/* Payout Methods */}
          <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-100">Payout methods</div>
            </div>

            <div className="mt-3 space-y-2">
              {methods.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-3 text-xs text-slate-400">
                  No payout methods added yet.
                </div>
              ) : (
                methods.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/20 p-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-100">
                        {m.label} {m.isDefault ? <span className="ml-2 text-[10px] text-blue-300">Default</span> : null}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {m.type}
                        {m.subLabel ? ` • ${m.subLabel}` : ""}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setWithdrawOpen(true);
                        setMethodId(m.id);
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-700"
                    >
                      Use
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Transactions */}
        <section className="rounded-2xl border border-slate-800 bg-[#050f25] p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-100">Transactions</div>
            <div className="text-xs text-slate-400">{txs.length} items</div>
          </div>

          <div className="mt-3 space-y-2">
            {txs.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-3 text-xs text-slate-400">
                No transactions yet.
              </div>
            ) : (
              txs.map((t) => {
                const isCredit = t.direction === "CREDIT";
                const amt = isCredit ? t.amountCents : -t.amountCents;

                return (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-xs font-semibold text-slate-100">{t.title}</div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isCredit ? "bg-blue-600/20 text-blue-300" : "bg-red-600/20 text-red-300"
                          }`}
                        >
                          {isCredit ? "CREDIT" : "DEBIT"}
                        </span>
                      </div>
                      {t.description ? (
                        <div className="mt-1 truncate text-[11px] text-slate-400">{t.description}</div>
                      ) : null}
                      <div className="mt-1 text-[10px] text-slate-500">{fmtDate(t.createdAt)}</div>
                    </div>

                    <div className={`text-sm font-semibold ${isCredit ? "text-blue-200" : "text-red-200"}`}>
                      {money(amt, currency)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {nextCursor && (
            <button
              disabled={loadingMore}
              onClick={loadMore}
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </section>

        {/* Withdraw modal */}
        {withdrawOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#050f25] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Withdraw</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Available: {money(summary?.availableCents ?? 0, currency)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setWithdrawOpen(false);
                    setWithdrawErr(null);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 text-[11px] text-slate-400">Amount</div>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <div className="mb-1 text-[11px] text-slate-400">Payout method</div>
                  <select
                    value={methodId}
                    onChange={(e) => setMethodId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="" disabled>
                      Select method
                    </option>
                    {methods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} {m.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {withdrawErr && (
                  <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-200">
                    {withdrawErr}
                  </div>
                )}

                <button
                  disabled={withdrawBusy}
                  onClick={doWithdraw}
                  className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {withdrawBusy ? "Processing..." : "Confirm withdraw"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DriverDashboardShell>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col justify-between gap-1 rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-3">
      <div className="text-[11px] text-slate-400">
        {label}
        {hint ? <span className="ml-2 text-[10px] text-slate-500">• {hint}</span> : null}
      </div>
      <div className="text-lg font-semibold text-slate-50">{value}</div>
    </div>
  );
}
