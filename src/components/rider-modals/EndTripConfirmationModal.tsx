"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "../ui";
import Image from "next/image";
import type { RiderTripDTO } from "../../lib/riderClient";

type EndTripConfirmationModalProps = {
  trip: RiderTripDTO;
  onClose: () => void;
  onReportIssue?: () => void;
  onRateDriver: () => void;
};

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EndTripConfirmationModal({
  trip,
  onClose,
  onReportIssue,
  onRateDriver,
}: EndTripConfirmationModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const reachedLabel = trip.destinationAddress || "your destination";
  const timeLabel = formatDateTime(trip.completedAt ?? trip.startedAt ?? trip.scheduledFor);

  const tripTypeLabel = trip.tripType === "ROUND_TRIP" ? "Round trip" : "One-way";

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 px-4 py-6" onClick={onClose}>
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] text-center shadow-[0_30px_80px_rgba(0,0,0,0.95)]"
        onClick={stop}
      >
        <div className="border-b border-[#233358] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">
          End of trip confirmation
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-5 pt-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#18213a]">
            <Image src="/success.png" alt="Success" width={18} height={18} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-50">You&apos;ve arrived at {reachedLabel}</h2>
          <p className="mt-1 text-[12px] text-slate-400">Did you reach your destination safely?</p>

          <div className="mt-5 rounded-2xl border border-[#233358] bg-[#101a33] px-5 py-4 text-left text-xs text-slate-100">
            <div className="mb-3 text-[11px] font-medium text-slate-300">Trip details</div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-[11px] text-slate-400">Date &amp; time</div>
                <div className="mt-0.5">{timeLabel}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Trip type</div>
                <div className="mt-0.5">{tripTypeLabel}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Booking ID</div>
                <div className="mt-0.5">{trip.bookingId ?? `#${trip.id.slice(0, 8)}`}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={onReportIssue}
              className="h-11 w-full rounded-lg border border-[#233358] bg-transparent text-sm font-semibold text-slate-200 hover:bg-[#172444]"
            >
              Report an issue
            </Button>
            <Button
              type="button"
              onClick={onRateDriver}
              className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.7)] hover:bg-[#1a74ff]"
            >
              Rate driver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
