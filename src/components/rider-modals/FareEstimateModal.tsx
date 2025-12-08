import React from "react";
import { CheckCircle2, ChevronDown, MapPin, X } from "lucide-react";
import { Button } from "../ui";

type FareEstimateModalProps = {
  onClose: () => void;
  onBook: () => void;
};

export function FareEstimateModal({ onClose, onBook }: FareEstimateModalProps) {
  // ✅ FIX: use React.MouseEvent
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] shadow-[0_30px_80px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-out animate-fadeIn"
        onClick={stop}
      >
        {/* Header + price */}
        <div className="relative border-b border-[#233358] px-6 py-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944] transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">
            Fare and Estimated Time
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-50">$300</div>
          <div className="mt-1 text-[11px] text-slate-400">Fixed fare</div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-4 text-xs text-slate-200">
          <div className="space-y-3">
            {/* Trip details + profile */}
            <div className="overflow-hidden rounded-xl border border-[#233358] bg-[#18213a]">
              <div className="flex items-center gap-3 border-b border-[#233358] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-[11px] font-semibold text-slate-900">
                  M.L
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-50">M.L</span>
                  <span className="text-[11px] text-slate-400">Trip details</span>
                </div>
              </div>

              <div className="grid gap-4 border-b border-[#233358] px-4 py-3 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] text-slate-400">Date &amp; Time</div>
                  <div className="mt-0.5 text-xs text-slate-100">12-11-25, 9:50 AM</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Trip type</div>
                  <div className="mt-0.5 text-xs text-slate-100">One-way</div>
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
                      <div className="text-slate-100">123 Main Street, Springfield</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#111e3c]">
                      <MapPin className="h-3 w-3 text-emerald-300" />
                    </span>
                    <div>
                      <div className="text-[11px] text-slate-400">Destination</div>
                      <div className="text-slate-100">TechCorp Office, 456 Business Ave</div>
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
                  <span className="text-[11px] text-slate-400">Fixed fare</span>
                  <span className="text-xs text-slate-100">$300</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Estimated time</span>
                  <span className="text-xs text-slate-100">45 Minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">On-time rate</span>
                  <span className="text-xs text-slate-100">
                    94%{" "}
                    <span className="text-[10px] text-slate-400">(Last 30 days)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="flex items-center justify-between rounded-xl border border-[#233358] bg-[#18213a] px-4 py-3">
              <span className="text-[11px] text-slate-300">Payment method</span>
              <button className="inline-flex items-center gap-2 text-xs font-medium text-slate-100 hover:text-blue-400 transition">
                Paypal
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
                <span>
                  By confirming, you agree to our No-Cash Policy and Cancellation Policy.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="border-t border-[#233358] bg-[#101a33] px-6 py-4">
          <Button
            type="button"
            onClick={onBook}
            className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff] transition"
          >
            Book now
          </Button>
        </div>
      </div>
    </div>
  );
}
