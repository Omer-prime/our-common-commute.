"use client";

import { useState } from "react";
import Image from "next/image";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import {
  X,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types & mock data (easy to replace with real backend later)        */
/* ------------------------------------------------------------------ */

type TransactionType =
  | "ride_earning"
  | "cash_tip"
  | "withdrawal"
  | "referral";

type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  description: string;
  date: string;
  time: string;
  amount: number;
  direction: "credit" | "debit"; // credit = money in, debit = money out
};

type PaymentMethod = {
  id: string;
  type: "bank" | "paypal";
  label: string;
  subLabel: string;
  isDefault: boolean;
};

type ChartPoint = {
  month: string;
  value: number;
};

const MOCK_AVAILABLE_BALANCE = 40000;

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    type: "ride_earning",
    title: "Ryde Earning – Angela",
    description: "3 June, 2025   8:04 PM",
    date: "3 June, 2025",
    time: "8:04 PM",
    amount: 40.79,
    direction: "credit",
  },
  {
    id: "tx_2",
    type: "cash_tip",
    title: "Cash Tip Received",
    description: "3 June, 2025   8:04 PM",
    date: "3 June, 2025",
    time: "8:04 PM",
    amount: 40.79,
    direction: "credit",
  },
  {
    id: "tx_3",
    type: "withdrawal",
    title: "Withdrawal to Bank",
    description: "3 June, 2025   8:04 PM",
    date: "3 June, 2025",
    time: "8:04 PM",
    amount: 40000.79,
    direction: "debit",
  },
  {
    id: "tx_4",
    type: "referral",
    title: "Referral Bonus",
    description: "3 June, 2025   8:04 PM",
    date: "3 June, 2025",
    time: "8:04 PM",
    amount: 4.79,
    direction: "credit",
  },
];

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "bank",
    label: "1234********35472",
    subLabel: "John Doe",
    isDefault: true,
  },
  {
    id: "pm_2",
    type: "paypal",
    label: "Paypal",
    subLabel: "adexco@gentir.gmail",
    isDefault: false,
  },
];

const MOCK_CHART_DATA: ChartPoint[] = [
  { month: "J", value: 20 },
  { month: "F", value: 60 },
  { month: "M", value: 45 },
  { month: "A", value: 55 },
  { month: "M", value: 35 },
  { month: "J", value: 48 },
  { month: "J", value: 32 },
  { month: "A", value: 30 },
  { month: "S", value: 90 },
  { month: "O", value: 18 },
  { month: "N", value: 55 },
  { month: "D", value: 38 },
];

const QUICK_AMOUNTS = [10, 20, 100, 500, 1000];

/* Helpers */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getPaymentInitial(pm: PaymentMethod) {
  if (pm.type === "bank") return "🏦";
  if (pm.type === "paypal") return "🅿️";
  return "💳";
}

function getTransactionBadgeColor(type: TransactionType) {
  switch (type) {
    case "ride_earning":
      return "bg-blue-500/20 text-blue-400";
    case "cash_tip":
      return "bg-green-500/20 text-green-400";
    case "withdrawal":
      return "bg-purple-500/20 text-purple-400";
    case "referral":
      return "bg-pink-500/20 text-pink-400";
    default:
      return "bg-slate-500/20 text-slate-300";
  }
}

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

type EarningsOverlay = "withdraw" | "history" | "paymentMethods" | null;

export default function DriverEarningsPage() {
  const [overlay, setOverlay] = useState<EarningsOverlay>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);

  const selectedMethod =
    paymentMethods.find((m) => m.isDefault) ?? paymentMethods[0];

  const handleSelectPaymentMethod = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id })),
    );
  };

  const handlePerformWithdraw = (amount: number) => {
    // TODO: connect to backend withdraw API
    // Example payload:
    // { amount, paymentMethodId: selectedMethod.id }
    console.log("Withdraw requested:", {
      amount,
      paymentMethodId: selectedMethod?.id,
    });
    setOverlay(null);
  };

  return (
    <DriverDashboardShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between px-2 text-xs text-slate-400 sm:px-0">
          <h1 className="text-sm font-semibold text-slate-100">Earnings</h1>
        </div>

        <div className="mx-auto mt-1 flex max-w-6xl flex-col gap-5 pb-10">
          {/* --- Summary card --- */}
          <EarningsSummaryCard
            balance={MOCK_AVAILABLE_BALANCE}
            hidden={hideBalance}
            onToggleHidden={() => setHideBalance((v) => !v)}
            onWithdraw={() => setOverlay("withdraw")}
          />

          {/* --- Bottom grid: chart + recent transactions --- */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <EarningsChartCard data={MOCK_CHART_DATA} />
            <RecentTransactionsCard
              transactions={MOCK_TRANSACTIONS}
              onSeeAll={() => setOverlay("history")}
            />
          </div>
        </div>

        {/* ---------------- Overlays ---------------- */}
        {overlay === "withdraw" && selectedMethod && (
          <WithdrawOverlay
            availableBalance={MOCK_AVAILABLE_BALANCE}
            paymentMethod={selectedMethod}
            onChangeMethod={() => setOverlay("paymentMethods")}
            onClose={() => setOverlay(null)}
            onProceed={handlePerformWithdraw}
          />
        )}

        {overlay === "history" && (
          <HistoryOverlay
            transactions={MOCK_TRANSACTIONS}
            onClose={() => setOverlay(null)}
          />
        )}

        {overlay === "paymentMethods" && (
          <PaymentMethodsOverlay
            methods={paymentMethods}
            onSelect={(id) => {
              handleSelectPaymentMethod(id);
              setOverlay("withdraw");
            }}
            onClose={() => setOverlay("withdraw")}
          />
        )}
      </div>
    </DriverDashboardShell>
  );
}

/* ------------------------------------------------------------------ */
/* Summary card                                                       */
/* ------------------------------------------------------------------ */

function EarningsSummaryCard({
  balance,
  hidden,
  onToggleHidden,
  onWithdraw,
}: {
  balance: number;
  hidden: boolean;
  onToggleHidden: () => void;
  onWithdraw: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#050f25] px-5 py-4 text-xs text-slate-200 sm:px-6 sm:py-5">
      {/* Subtle circular patterns like the design */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-slate-700/40" />
        <div className="absolute right-10 -top-16 h-52 w-52 rounded-full border border-slate-700/30" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full border border-slate-700/20" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800">
              💰
            </span>
            <span>Available earnings</span>
            <button
              type="button"
              onClick={onToggleHidden}
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/70 text-slate-300 hover:bg-slate-700"
            >
              {hidden ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            {hidden ? "••••••" : formatCurrency(balance)}
          </div>
        </div>

        <div className="relative z-10 mt-1 w-full max-w-xs sm:mt-0">
          <button
            type="button"
            onClick={onWithdraw}
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#2563ff] py-2 text-sm font-medium text-white hover:bg-[#2958d3]"
          >
            Withdraw
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chart card                                                         */
/* ------------------------------------------------------------------ */

function EarningsChartCard({ data }: { data: ChartPoint[] }) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <section className="flex flex-col rounded-2xl border border-slate-800 bg-[#050f25] px-5 py-4 text-xs text-slate-200">
      <h2 className="text-[11px] font-semibold text-slate-200">
        Earnings overtime
      </h2>

      <div className="mt-5 flex h-56 gap-3 sm:h-60">
        {/* Simple Y-axis labels */}
        <div className="flex w-10 flex-col justify-between pb-4 pt-1 text-[10px] text-slate-500">
          <span>100k&gt;</span>
          <span>40k</span>
          <span>20k</span>
          <span>1k</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className="flex-1">
          <div className="flex h-full items-end gap-3 pb-4">
            {data.map((point) => {
              const heightPercent = (point.value / maxValue) * 100;
              return (
                <div
                  key={point.month + point.value}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-full w-full items-end justify-center">
                    <div className="relative flex h-full w-2 items-end">
                      <div className="h-full w-full rounded-full bg-slate-800" />
                      <div
                        className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-[#2563ff] via-[#2563ff] to-[#4f8bff]"
                        style={{ height: `${Math.max(heightPercent, 12)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {point.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Recent transactions                                                */
/* ------------------------------------------------------------------ */

function RecentTransactionsCard({
  transactions,
  onSeeAll,
}: {
  transactions: Transaction[];
  onSeeAll: () => void;
}) {
  const recent = transactions.slice(0, 4);

  return (
    <section className="flex flex-col rounded-2xl border border-slate-800 bg-[#050f25] px-5 py-4 text-xs text-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold text-slate-200">
          Recent transactions
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-[11px] font-medium text-[#4f8bff] hover:underline"
        >
          See all
        </button>
      </div>

      <div className="space-y-2">
        {recent.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
    </section>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const badgeColor = getTransactionBadgeColor(tx.type);
  const sign = tx.direction === "debit" ? "-" : "+";

  return (
    <div className="flex items-center justify-between rounded-xl bg-[#07152f] px-3 py-3 text-[11px] text-slate-200">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${badgeColor}`}
        >
          {/* just a simple initial / emoji */}
          <span className="text-xs">
            {tx.type === "ride_earning"
              ? "🚗"
              : tx.type === "cash_tip"
              ? "💵"
              : tx.type === "withdrawal"
              ? "🏦"
              : "🎁"}
          </span>
        </div>
        <div className="space-y-0.5">
          <div className="font-medium text-slate-100">{tx.title}</div>
          <div className="text-[10px] text-slate-400">{tx.description}</div>
        </div>
      </div>

      <div className="ml-4 text-right text-[11px] font-semibold text-slate-50">
        {sign}
        {formatCurrency(tx.amount).replace("$", "$")}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Withdraw overlay                                                   */
/* ------------------------------------------------------------------ */

type WithdrawOverlayProps = {
  availableBalance: number;
  paymentMethod: PaymentMethod;
  onChangeMethod: () => void;
  onClose: () => void;
  onProceed: (amount: number) => void;
};

function WithdrawOverlay({
  availableBalance,
  paymentMethod,
  onChangeMethod,
  onClose,
  onProceed,
}: WithdrawOverlayProps) {
  const [amountStr, setAmountStr] = useState("40.00");

  const updateAmount = (input: string) => {
    setAmountStr((prev) => {
      if (input === "backspace") {
        const next = prev.slice(0, -1);
        return next.length ? next : "0";
      }

      if (input === ".") {
        if (prev.includes(".")) return prev;
        return prev + ".";
      }

      // digit
      if (prev === "0") return input;
      return prev + input;
    });
  };

  const setQuickAmount = (val: number) => {
    setAmountStr(val.toFixed(2));
  };

  const numericAmount = parseFloat(amountStr || "0");

  const handleProceedClick = () => {
    if (!numericAmount || numericAmount <= 0) return;
    if (numericAmount > availableBalance) {
      // In production you might show a toast here
      return;
    }
    onProceed(numericAmount);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] text-xs text-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
          <h2 className="text-[11px] font-medium text-slate-200">Withdraw</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Amount */}
          <div className="text-center">
            <div className="text-xs text-slate-400">
              Available: {formatCurrency(availableBalance)}
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-50">
              {formatCurrency(numericAmount || 0)}
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setQuickAmount(val)}
                className={`min-w-[70px] rounded-md px-3 py-1.5 text-[11px] ${
                  numericAmount === val
                    ? "bg-[#2563ff] text-white"
                    : "bg-[#07152f] text-slate-200 hover:bg-[#0b1b3a]"
                }`}
              >
                {formatCurrency(val)}
              </button>
            ))}
          </div>

          {/* Payment method */}
          <div className="rounded-2xl bg-[#07152f] px-4 py-3 text-[11px] text-slate-200">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Payment method
              </span>
              <button
                type="button"
                onClick={onChangeMethod}
                className="rounded-md bg-slate-800 px-3 py-1 text-[11px] text-slate-100 hover:bg-slate-700"
              >
                Change
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                  <span className="text-sm">{getPaymentInitial(paymentMethod)}</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-medium text-slate-100">
                    {paymentMethod.label}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {paymentMethod.subLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proceed */}
          <button
            type="button"
            onClick={handleProceedClick}
            className="w-full rounded-lg bg-[#2563ff] py-2.5 text-sm font-medium text-white hover:bg-[#2958d3]"
          >
            Proceed
          </button>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 pb-1 pt-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateAmount(key)}
                  className="flex h-12 items-center justify-center rounded-lg bg-[#07152f] text-sm font-medium text-slate-100 hover:bg-[#0b1b3a]"
                >
                  {key}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => updateAmount("backspace")}
              className="flex h-12 items-center justify-center rounded-lg bg-[#07152f] text-sm font-medium text-slate-100 hover:bg-[#0b1b3a]"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* History overlay                                                    */
/* ------------------------------------------------------------------ */

function HistoryOverlay({
  transactions,
  onClose,
}: {
  transactions: Transaction[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] text-xs text-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
          <h2 className="text-[11px] font-medium text-slate-200">History</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-2 px-6 py-5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl bg-[#07152f] px-3 py-3 text-[11px]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getTransactionBadgeColor(
                    tx.type,
                  )}`}
                >
                  <span className="text-xs">
                    {tx.type === "ride_earning"
                      ? "🚗"
                      : tx.type === "cash_tip"
                      ? "💵"
                      : tx.type === "withdrawal"
                      ? "🏦"
                      : "🎁"}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-100">{tx.title}</div>
                  <div className="text-[10px] text-slate-400">
                    {tx.date}   {tx.time}
                  </div>
                </div>
              </div>

              <div className="ml-4 text-right text-[11px] font-semibold text-slate-50">
                {tx.direction === "debit" ? "-" : "+"}
                {formatCurrency(tx.amount).replace("$", "$")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Payment methods overlay                                            */
/* ------------------------------------------------------------------ */

function PaymentMethodsOverlay({
  methods,
  onSelect,
  onClose,
}: {
  methods: PaymentMethod[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] text-xs text-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
          <h2 className="text-[11px] font-medium text-slate-200">
            Payment methods
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-2 px-6 py-5">
          {methods.map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => onSelect(pm.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left ${
                pm.isDefault ? "bg-[#07152f]" : "bg-[#050f25] hover:bg-[#07152f]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                  <span className="text-sm">{getPaymentInitial(pm)}</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] font-medium text-slate-100">
                    {pm.label}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {pm.subLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pm.isDefault && (
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] text-slate-200">
                    Default
                  </span>
                )}
                <MoreVertical className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-slate-800 px-6 py-3 text-right">
          {/* In future you can hook "Add new method" to a separate flow */}
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4f8bff] hover:underline"
          >
            Add new method
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
