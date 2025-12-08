"use client";

import { useState } from "react";
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
  title: string; // e.g. "123 Main street, Springfield"
  dateLabel: string; // "12-11-25, 9:50 AM"
  fare: number;
  fee: number;
  methodLabel: string; // e.g. "Visa 1425******9248"
  status: "Completed" | "Pending";
};

/* ---------- Mock data ---------- */

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm-apple",
    type: "apple-pay",
    label: "Apple pay",
    description: "adexco@gentlr.gmail",
    isDefault: true,
  },
  {
    id: "pm-paypal",
    type: "paypal",
    label: "Paypal",
    description: "adexco@gentlr.gmail",
  },
  {
    id: "pm-card",
    type: "card",
    label: "1234********5693",
    description: "James Rodri",
  },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    title: "123 Main street, Springfield",
    dateLabel: "12-11-25, 9:50 AM",
    fare: 300,
    fee: 0.57,
    methodLabel: "Visa 1425******9248",
    status: "Completed",
  },
  {
    id: "tx-2",
    title: "123 Main street, Springfield",
    dateLabel: "12-11-25, 9:50 AM",
    fare: 300,
    fee: 0.57,
    methodLabel: "Apple pay 1425******9248",
    status: "Completed",
  },
];

/* ---------- Page ---------- */

export default function RiderPaymentsPage() {
  const [tab, setTab] = useState<PaymentTab>("methods");

  return (
    <RiderDashboardShell>
      <div className="space-y-4">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">Payments</h1>
        </div>

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
          {tab === "methods" && (
            <div className="space-y-3">
              {PAYMENT_METHODS.map((pm) => (
                <PaymentMethodCard key={pm.id} method={pm} />
              ))}
            </div>
          )}

          {tab === "transactions" && (
            <div className="space-y-3">
              {TRANSACTIONS.map((tx) => (
                <TransactionCard key={tx.id} tx={tx} />
              ))}
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
        isActive
          ? "bg-[#1d4ed8] text-white"
          : "bg-transparent text-slate-400 hover:bg-[#07152f]"
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
      {/* Left: icon + text */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#07152f]">
          <PaymentMethodIcon type={method.type} />
        </div>
        <div className="space-y-0.5">
          <div className="text-[11px] font-semibold text-slate-100">
            {method.label}
          </div>
          <div className="text-[10px] text-slate-400">
            {method.description}
          </div>
        </div>
      </div>

      {/* Right: default badge or menu */}
      <div className="flex items-center gap-2">
        {method.isDefault && (
          <span className="rounded-full bg-slate-700/40 px-3 py-1 text-[10px] font-medium text-slate-100">
            Default
          </span>
        )}
        {!method.isDefault && (
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
    return (
      <Image
        src="/applepay.png"
        alt="Apple Pay"
        width={18}
        height={18}
        className="object-contain"
      />
    );
  }
  if (type === "paypal") {
    return (
      <Image
        src="/paypal.png"
        alt="Paypal"
        width={20}
        height={20}
        className="object-contain"
      />
    );
  }
  // generic card
  return <CreditCard className="h-4 w-4 text-slate-200" />;
}

/* ------------------------ Transaction card ---------------------- */

function TransactionCard({ tx }: { tx: Transaction }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#050f25] px-3 py-3 text-xs text-slate-200">
      {/* Top row: title + status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-100">
            {tx.title}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {tx.dateLabel}
          </div>
        </div>

        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-medium text-emerald-400">
          {tx.status}
        </span>
      </div>

      {/* Fare / fee row */}
      <div className="mt-3 space-y-1 text-[10px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>Fare</span>
          <span className="text-[11px] font-semibold text-slate-100">
            ${tx.fare.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Transaction fee</span>
          <span className="text-[11px] font-semibold text-slate-100">
            ${tx.fee.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment method row */}
      <div className="mt-3 border-t border-slate-700 pt-2 text-[10px] text-slate-400">
        <span className="text-slate-500">{tx.methodLabel}</span>
      </div>
    </section>
  );
}
