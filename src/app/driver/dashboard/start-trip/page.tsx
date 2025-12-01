"use client";

import { useState } from "react";
import Image from "next/image";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { Phone, MessageCircle, X } from "lucide-react";

export default function StartTripPage() {
  const [showCancelOverlay, setShowCancelOverlay] = useState(false);

  return (
    <DriverDashboardShell>
      <div className="flex items-center justify-center px-3 py-6 md:px-0">
        <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-[#050f25] shadow-2xl">
          {/* MAP PART */}
          <div className="relative h-[360px] w-full overflow-hidden bg-[#020818]">
            <Image
              src="/dashboard-map.png"
              alt="Map"
              fill
              className="object-cover"
            />

            {/* direction bubble */}
            <div className="absolute left-1/2 top-6 w-[220px] -translate-x-1/2 rounded-full bg-[#020818]/90 px-4 py-2 text-center text-[11px] text-slate-100 shadow-lg">
              <div className="text-xs font-semibold">2 meter to right</div>
              <div className="text-[10px] text-slate-400">
                210 Cross road junction
              </div>
            </div>

            {/* destination pin (top-right) */}
            <div className="absolute right-10 top-24">
              <div className="relative h-10 w-10 rounded-full bg-blue-600/90 shadow-lg shadow-blue-500/40">
                <Image
                  src="/location-pin-layered.png" // same icon you used on dashboard
                  alt="Destination"
                  fill
                  className="object-contain p-1.5"
                />
              </div>
            </div>

            {/* vertical light beam */}
            <div className="pointer-events-none absolute left-1/2 top-24 h-40 w-20 -translate-x-1/2 bg-gradient-to-b from-blue-400/0 via-blue-400/40 to-blue-400/80" />

            {/* car / arrow icon at bottom center */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-900/60">
                <div className="h-6 w-6 rounded-full border-2 border-slate-900 border-t-transparent" />
              </div>
            </div>
          </div>

          {/* BOTTOM SHEET */}
          <div className="border-t border-slate-800 bg-[#020818]/95 px-4 py-4 text-xs text-slate-200 md:px-6">
            <div className="text-center text-[11px] text-slate-400">
              Passenger&apos;s pickup
            </div>

            <div className="mt-3 flex items-center gap-3">
              {/* avatar */}
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                <Image
                  src="/rider-avatar.jpg"
                  alt="Rider avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-50">
                    I.O
                  </span>
                  <span className="text-[11px] text-slate-400">2.7 KM</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  2118 Thornridge Cir, Syracuse, Connecticut 3...
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700">
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700">
                  <Phone className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCancelOverlay(true)}
              className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Cancel ride
            </button>
          </div>
        </div>
      </div>

      {/* CANCELLED OVERLAY */}
      {showCancelOverlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#020818] px-6 py-6 text-center text-sm text-slate-100">
            <button
              type="button"
              onClick={() => setShowCancelOverlay(false)}
              className="absolute right-6 top-6 rounded-full bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <X className="h-6 w-6" />
            </div>

            <h2 className="text-base font-semibold">
              You&apos;ve cancelled the ride
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Help us improve your experience by letting us know the reason for
              cancelling this ride.
            </p>

            <button className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              Submit feedback
            </button>
            <button
              type="button"
              onClick={() => setShowCancelOverlay(false)}
              className="mt-2 w-full rounded-xl bg-transparent py-2 text-xs text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </DriverDashboardShell>
  );
}
