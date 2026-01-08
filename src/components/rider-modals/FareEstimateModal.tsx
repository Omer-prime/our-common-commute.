"use client";

// src/components/rider-modals/FareEstimateModal.tsx
import React from "react";
import { CheckCircle2, ChevronDown, MapPin, X } from "lucide-react";
import { Button } from "../ui";

type EstimateDTO = {
  fareCents: number;
  distanceMeters?: number | null;
  etaSeconds?: number | null;
  estDurationSeconds?: number | null;
};

type FareEstimateModalProps = {
  onClose: () => void;
  onBook: () => void;

  estimate: EstimateDTO | null;
  loading?: boolean;
  error?: string | null;

  pickupAddress: string;
  dropoffAddress: string;
  tripTypeLabel: string;
  dateTimeLabel: string;
  paymentMethodLabel?: string;
};

function moneyFromCents(cents: number) {
  const n = Number(cents ?? 0) / 100;
  return `$${n.toFixed(2)}`;
}
function minutesFromSeconds(sec?: number | null) {
  if (!sec || sec <= 0) return "—";
  return `${Math.max(1, Math.round(sec / 60))} Minutes`;
}

export function FareEstimateModal({
  onClose,
  onBook,
  estimate,
  loading,
  error,
  pickupAddress,
  dropoffAddress,
  tripTypeLabel,
  dateTimeLabel,
  paymentMethodLabel = "Paypal",
}: FareEstimateModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const fareText = loading ? "Calculating..." : estimate ? moneyFromCents(estimate.fareCents) : "$0.00";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6" onClick={onClose}>
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
        onClick={stop}
      >
        {/* Header + price */}
        <div className="relative border-b border-[#233358] px-6 py-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">
            Fare and Estimated Time
          </div>

          <div className="mt-2 text-3xl font-semibold text-slate-50">{fareText}</div>

          <div className="mt-1 text-[11px] text-slate-400">
            {loading ? "Real-time estimate" : "Fixed estimate (may vary by traffic)"}
          </div>

          {error ? (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-4 text-xs text-slate-200">
          <div className="space-y-3">
            {/* Trip details */}
            <div className="overflow-hidden rounded-xl border border-[#233358] bg-[#18213a]">
              <div className="flex items-center gap-3 border-b border-[#233358] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-[11px] font-semibold text-slate-900">
                  TR
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-50">Trip</span>
                  <span className="text-[11px] text-slate-400">Trip details</span>
                </div>
              </div>

              <div className="grid gap-4 border-b border-[#233358] px-4 py-3 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] text-slate-400">Date &amp; Time</div>
                  <div className="mt-0.5 text-xs text-slate-100">{dateTimeLabel}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Trip type</div>
                  <div className="mt-0.5 text-xs text-slate-100">{tripTypeLabel}</div>
                </div>
              </div>

              {/* Pick-up details */}
              <div className="px-4 py-3">
                <div className="text-[11px] font-medium text-slate-300">Pick-up details</div>

                <div className="mt-2 space-y-2 text-xs">
                  <div className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#111e3c]">
                      <MapPin className="h-3 w-3 text-sky-400" />
                    </span>
                    <div>
                      <div className="text-[11px] text-slate-400">Pickup location</div>
                      <div className="text-slate-100">{pickupAddress || "—"}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#111e3c]">
                      <MapPin className="h-3 w-3 text-emerald-300" />
                    </span>
                    <div>
                      <div className="text-[11px] text-slate-400">Destination</div>
                      <div className="text-slate-100">{dropoffAddress || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fare details */}
            <div className="rounded-xl border border-[#233358] bg-[#18213a] px-4 py-3">
              <div className="mb-2 text-[11px] font-medium text-slate-300">Fare details</div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Estimated fare</span>
                  <span className="text-xs text-slate-100">
                    {estimate ? moneyFromCents(estimate.fareCents) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Estimated time</span>
                  <span className="text-xs text-slate-100">
                    {minutesFromSeconds(estimate?.estDurationSeconds ?? estimate?.etaSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="flex items-center justify-between rounded-xl border border-[#233358] bg-[#18213a] px-4 py-3">
              <span className="text-[11px] text-slate-300">Payment method</span>
              <button type="button" className="inline-flex items-center gap-2 text-xs font-medium text-slate-100">
                {paymentMethodLabel}
                <ChevronDown className="h-3 w-3 -rotate-90 text-slate-400" />
              </button>
            </div>

            {/* Info rows */}
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2 rounded-lg bg-[#18213a] px-4 py-2">
                <CheckCircle2 className="mt-[2px] h-3.5 w-3.5 text-sky-400" />
                <span>Seat guaranteed after payment</span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-[#18213a] px-4 py-2">
                <CheckCircle2 className="mt-[2px] h-3.5 w-3.5 text-sky-400" />
                <span>Transaction fees applied</span>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-[#18213a] px-4 py-2">
                <CheckCircle2 className="mt-[2px] h-3.5 w-3.5 text-sky-400" />
                <span>By confirming, you agree to our No-Cash Policy and Cancellation Policy.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="border-t border-[#233358] bg-[#101a33] px-6 py-4">
          <Button
            type="button"
            onClick={onBook}
            disabled={loading || !estimate}
            className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff] disabled:opacity-60"
          >
            Confirm booking
          </Button>
        </div>
      </div>
    </div>
  );
}
