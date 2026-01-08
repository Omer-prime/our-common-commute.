"use client";

import React, { useMemo } from "react";
import {
  Car,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import type { RiderTripDTO } from "../../lib/riderClient";

type DriverArrivalModalProps = {
  trip: RiderTripDTO;
  onClose: () => void;
  onOpenQr: () => void;
  onCancelRide: () => void;
  onStartTrip?: () => void;
  onOpenChat: () => void;
};

function initials(name?: string | null) {
  const s = (name ?? "").trim();
  if (!s) return "D";
  const parts = s.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "D") + (parts[1]?.[0] ?? "");
}

function minutes(sec?: number | null) {
  if (!sec || sec <= 0) return "—";
  return `${Math.max(1, Math.round(sec / 60))} mins`;
}

export function DriverArrivalModal({
  trip,
  onClose,
  onOpenQr,
  onCancelRide,
  onStartTrip,
  onOpenChat,
}: DriverArrivalModalProps) {
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const etaText = useMemo(() => minutes(trip.etaSeconds ?? trip.estDurationSeconds ?? null), [trip.etaSeconds, trip.estDurationSeconds]);

  const driverName = trip.driver?.fullName ?? "Driver";
  const driverInitials = initials(trip.driver?.fullName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-6 pb-1 pt-10 sm:items-center sm:px-4 sm:py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-[#233358] bg-[#101a33] shadow-[0_30px_80px_rgba(0,0,0,0.9)] sm:max-w-3xl"
        onClick={stop}
      >
        {/* MOBILE MAP */}
        <div className="relative h-[270px] w-full bg-[#050817] sm:hidden">
          <Image src="/newmap.png" alt="Driver route map" fill priority className="object-cover" />
          <div className="pointer-events-none absolute left-1/2 top-8 flex -translate-x-1/2 flex-col items-center rounded-2xl bg-[#101a33]/95 px-4 py-2 text-[11px] text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.9)]">
            <span className="text-[10px] text-slate-300">Approximate driver arrival time</span>
            <span className="mt-1 text-sm font-semibold">{etaText}</span>
          </div>
        </div>

        {/* HEADER */}
        <div className="border-b border-[#233358] px-6 py-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151f3a] text-slate-300 hover:bg-[#1e2944]"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">
            Driver&apos;s arrival
          </div>
        </div>

        {/* DRIVER ROW */}
        <div className="flex items-center justify-between border-b border-[#233358] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#18213a] text-xs font-semibold text-slate-100">
              {driverInitials}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-50">{driverName}</div>

              {/* rating/rides not in backend yet -> keep placeholder */}
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                <Star className="h-3 w-3 text-amber-400" />
                <span>—</span>
                <span className="text-slate-500">•</span>
                <span>— rides</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenChat}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18213a] text-slate-200 hover:bg-[#1f2742]"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18213a] text-slate-200 hover:bg-[#1f2742]">
              <Phone className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18213a] text-slate-200 hover:bg-[#1f2742]">
              <PhoneCall className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18213a] text-slate-200 hover:bg-[#1f2742]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CAR DETAILS (not available in DTO yet) */}
        <div className="border-b border-[#233358] px-6 py-3 text-xs text-slate-200">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <Car className="h-3.5 w-3.5" />
            <span>Car Details</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <div className="text-[11px] text-slate-400">Car Model</div>
              <div className="text-xs text-slate-100">—</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">License number</div>
              <div className="text-xs text-slate-100">—</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Seats</div>
              <div className="text-xs text-slate-100">—</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Color</div>
              <div className="text-xs text-slate-100">—</div>
            </div>
          </div>
        </div>

        {/* PICKUP & DESTINATION */}
        <div className="px-6 py-3 text-xs text-slate-200">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-0.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111e3c]">
                  <MapPin className="h-3 w-3 text-sky-400" />
                </span>
                <span className="mt-1 h-7 w-px bg-[#233358]" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Pickup location</div>
                <div className="text-slate-100">{trip.pickupAddress}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-0.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#111e3c]">
                  <MapPin className="h-3 w-3 text-emerald-300" />
                </span>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Destination</div>
                <div className="text-slate-100">{trip.destinationAddress}</div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BUTTONS */}
        <div className="grid grid-cols-2 gap-0.5 p-2 text-sm font-semibold">
          <button
            type="button"
            onClick={onCancelRide}
            className="h-11 rounded-sm border border-[#233358] bg-[#101a33] text-slate-200 hover:bg-[#172444]"
          >
            Cancel ride
          </button>
          <button
            type="button"
            onClick={onOpenQr}
            className="h-11 rounded-sm border-t border-l border-[#233358] bg-[#0B63F4] text-white hover:bg-[#1a74ff]"
          >
            QR Code
          </button>
        </div>

        {onStartTrip && (
          <div className="px-6 pb-4 pt-1 text-center">
            <button
              type="button"
              onClick={onStartTrip}
              className="text-[11px] font-medium text-slate-300 hover:text-slate-100"
            >
              I&apos;m in the car
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
