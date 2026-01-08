"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";
import { MoreHorizontal, CreditCard } from "lucide-react";

/* ---------- Types ---------- */

type PaymentTab = "methods" | "transactions";

type PaymentMethod = {
  id: string;
  type: "apple-pay" | "paypal" | "card";
  label: string;
  description: string;
  isDefault?: boolean;
};

type Transaction = {
  id: string;
  title: string;
  dateLabel: string;
  fare: number;
  fee: number;
  methodLabel: string;
  status: "Completed" | "Pending";
};

type PaymentsResponse = {
  ok: boolean;
  user?: { id: string; fullName: string; email: string };
  methods: PaymentMethod[];
  transactions: Transaction[];
  error?: string;
};

/* ---------- Helpers ---------- */

function getBackendBaseUrl() {
  let base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  base = base.replace(/\/+$/, "");
  if (!base) return "http://localhost:4000";
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  const keys = ["accessToken", "token", "access_token", "jwt", "authToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

/* ---------- Page ---------- */

export default function RiderPaymentsPage() {
  const [tab, setTab] = useState<PaymentTab>("methods");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const hasMethods = useMemo(() => methods.length > 0, [methods]);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);

      const base = getBackendBaseUrl();
      const token = getStoredToken();

      const res = await fetch(`${base}/api/rider/payments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      const data: PaymentsResponse = isJson
        ? ((await res.json()) as PaymentsResponse)
        : ({
            ok: false,
            methods: [],
            transactions: [],
            error: await res.text(),
          } as any);

      if (!res.ok || !data.ok) {
        // If token missing/expired
        if (res.status === 401) {
          throw new Error("UNAUTHORIZED — Please login again.");
        }
        throw new Error(data.error || `Failed to load payments (${res.status})`);
      }

      setMethods(data.methods ?? []);
      setTransactions(data.transactions ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load payments");
      setMethods([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RiderDashboardShell>
      <div className="space-y-4">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">Payments</h1>
        </div>

        {err ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            {err}
          </div>
        ) : null}

        {/* Tabs */}
        <div className="mt-2 flex max-w-xs items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300">
          <TabButton
            label="Payment methods"
            isActive={tab === "methods"}
            onClick={() => setTab("methods")}
          />
          <TabButton
            label="Transactions"
            isActive={tab === "transactions"}
            onClick={() => setTab("transactions")}
          />
        </div>

        {/* Content */}
        <div className="mt-2 flex flex-col gap-4 pb-10">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-300">
              Loading payments...
            </div>
          ) : null}

          {!loading && tab === "methods" && (
            <div className="space-y-3">
              {!hasMethods ? (
                <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-300">
                  No payment method added yet.
                </div>
              ) : (
                methods.map((pm) => <PaymentMethodCard key={pm.id} method={pm} />)
              )}
            </div>
          )}

          {!loading && tab === "transactions" && (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-300">
                  No transactions yet.
                </div>
              ) : (
                transactions.map((tx) => <TransactionCard key={tx.id} tx={tx} />)
              )}
            </div>
          )}
        </div>
      </div>
    </RiderDashboardShell>
  );
}

/* ----------------------------- Tabs ----------------------------- */

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-4 py-1.5 text-[11px] font-medium transition-colors ${
        isActive ? "bg-[#1d4ed8] text-white" : "bg-transparent text-slate-400 hover:bg-[#07152f]"
      }`}
    >
      {label}
    </button>
  );
}

/* ---------------------- Payment method card --------------------- */

function PaymentMethodCard({ method }: { method: PaymentMethod }) {
  return (
    <section className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#050f25] px-3 py-3 text-xs text-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#07152f]">
          <PaymentMethodIcon type={method.type} />
        </div>
        <div className="space-y-0.5">
          <div className="text-[11px] font-semibold text-slate-100">{method.label}</div>
          <div className="text-[10px] text-slate-400">{method.description}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {method.isDefault ? (
          <span className="rounded-full bg-slate-700/40 px-3 py-1 text-[10px] font-medium text-slate-100">
            Default
          </span>
        ) : (
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] text-slate-300 hover:bg-[#101a33]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}

function PaymentMethodIcon({ type }: { type: PaymentMethod["type"] }) {
  if (type === "apple-pay") {
    return <Image src="/applepay.png" alt="Apple Pay" width={18} height={18} className="object-contain" />;
  }
  if (type === "paypal") {
    return <Image src="/paypal.png" alt="Paypal" width={20} height={20} className="object-contain" />;
  }
  return <CreditCard className="h-4 w-4 text-slate-200" />;
}

/* ------------------------ Transaction card ---------------------- */

function TransactionCard({ tx }: { tx: Transaction }) {
  const statusClass =
    tx.status === "Completed"
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-amber-500/15 text-amber-300";

  return (
    <section className="rounded-xl border border-slate-800 bg-[#050f25] px-3 py-3 text-xs text-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-100">{tx.title}</div>
          <div className="mt-0.5 text-[10px] text-slate-400">{tx.dateLabel}</div>
        </div>

        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-medium ${statusClass}`}>
          {tx.status}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-[10px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>Fare</span>
          <span className="text-[11px] font-semibold text-slate-100">${tx.fare.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Transaction fee</span>
          <span className="text-[11px] font-semibold text-slate-100">${tx.fee.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-700 pt-2 text-[10px] text-slate-400">
        <span className="text-slate-500">{tx.methodLabel}</span>
      </div>
    </section>
  );
}
