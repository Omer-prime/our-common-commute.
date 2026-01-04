// src/components/rider-modals/BookingConfirmationModal.tsx
import React, { useMemo } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "../ui";
import type { RiderTripDTO } from "../../lib/riderClient";

type BookingConfirmationModalProps = {
  onClose: () => void;
  onShare: () => void;
  onGoToRides: () => void;

  // ✅ real backend trip (required, but we still guard)
  trip: RiderTripDTO | null;
};

function formatDateTime(iso: string | null) {
  if (!iso) return "Now";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function tripTypeLabel(t: RiderTripDTO["tripType"] | null | undefined) {
  if (t === "ROUND_TRIP") return "Round trip";
  return "One-way";
}

function shortBookingId(trip: RiderTripDTO | null) {
  if (!trip) return "—";
  return trip.bookingId ? `#${trip.bookingId}` : `#${trip.id.slice(0, 8)}`;
}

export function BookingConfirmationModal({
  onClose,
  onShare,
  onGoToRides,
  trip,
}: BookingConfirmationModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const dateTime = useMemo(() => formatDateTime(trip?.scheduledFor ?? null), [trip?.scheduledFor]);
  const tType = useMemo(() => tripTypeLabel(trip?.tripType), [trip?.tripType]);
  const booking = useMemo(() => shortBookingId(trip), [trip]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#233358] bg-[#101a33] shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
        onClick={stop}
      >
        {/* Header */}
        <div className="border-b border-[#233358] px-6 py-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">
            Booking confirmation
          </div>
        </div>

        {/* Icon + text */}
        <div className="px-6 pt-4 pb-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#18213a]">
            <CheckCircle2 className="h-6 w-6 text-[#0B63F4]" />
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-50">
            Your ride is booked!
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
            We&apos;ll notify you once a driver accepts.
          </div>
        </div>

        {/* Trip details + steps */}
        <div className="mx-6 mb-4 overflow-hidden rounded-xl border border-[#233358] bg-[#18213a] text-xs text-slate-200">
          {/* Trip details */}
          <div className="border-b border-[#233358] px-4 py-3">
            <div className="mb-2 text-[11px] font-medium text-slate-300">
              Trip details
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-[11px] text-slate-400">Date &amp; time</div>
                <div className="mt-0.5 text-xs text-slate-100">{dateTime}</div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Trip type</div>
                <div className="mt-0.5 text-xs text-slate-100">{tType}</div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400">Booking ID</div>
                <div className="mt-0.5 text-xs text-slate-100">{booking}</div>
              </div>
            </div>
          </div>

          {/* Steps (static for now) */}
          <div className="px-4 py-3">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0B63F4]">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  <span className="mt-1 h-7 w-px bg-[#233358]" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Step 1</div>
                  <div className="text-xs text-slate-100">Booking created</div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-500 bg-transparent" />
                  <span className="mt-1 h-7 w-px bg-[#233358]" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Step 2</div>
                  <div className="text-xs text-slate-300">Matching with drivers</div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-500 bg-transparent" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Step 3</div>
                  <div className="text-xs text-slate-300">Driver assigned</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="border-t border-[#233358] bg-[#101a33] px-6 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="h-11 w-full rounded-lg border border-[#233358] bg-transparent text-sm font-semibold text-slate-200 hover:bg-[#172444]"
              onClick={onGoToRides}
            >
              Go to my rides
            </Button>
            <Button
              type="button"
              className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.6)] hover:bg-[#1a74ff]"
              onClick={onShare}
              disabled={!trip}
            >
              Share booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
