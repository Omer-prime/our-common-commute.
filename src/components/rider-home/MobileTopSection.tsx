// src/components/rider-home/MobileTopSection.tsx
"use client";

import React from "react";
import Image from "next/image";
import { TripTypeTabs } from "./TripTypeTabs";
import { BookingFields } from "./BookingFields";
import { PrimaryCTAs } from "./PrimaryCTAs";
import { TopSectionProps } from "./types";

/* ---------- COMPONENT ---------- */
export function MobileTopSection({
  tripType,
  setTripType,
  recurring,
  toggleRecurring,
  openFareModal,
}: TopSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#233358] bg-[#18213a] p-4 lg:hidden">
      {/* Greeting */}
      <div className="space-y-0.5">
        <div className="text-sm font-semibold text-slate-50">Hello Daniel</div>
        <div className="text-[11px] text-slate-300">
          Where would you like to go?
        </div>
      </div>

      {/* Trip type tabs */}
      <TripTypeTabs tripType={tripType} setTripType={setTripType} />

      {/* Commute info */}
      <div className="flex items-center gap-2 rounded-xl border border-[#233358] bg-[#101a33] px-3 py-2 text-[11px] text-slate-200">
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-[9px] font-semibold">
          i
        </span>
        <span>
          {tripType === "round-trip"
            ? "Both morning and evening commute"
            : "Single trip to or from work"}
        </span>
      </div>

      {/* Map card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#101a33]">
        <div className="relative h-52">
          <Image
            src="/mobile-map.png"
            alt="City map"
            fill
            priority
            className="object-cover"
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Image
              src="/mobile-map-circle.png"
              alt="Current area"
              width={190}
              height={190}
              className="opacity-95 drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
            />
            <Image
              src="/mobile-map-pin.png"
              alt="Current location"
              width={58}
              height={58}
              className="absolute drop-shadow-[0_12px_32px_rgba(0,0,0,0.85)]"
            />
          </div>
        </div>
      </div>

      {/* Booking fields + buttons */}
      <BookingFields
        tripType={tripType}
        recurring={recurring}
        toggleRecurring={toggleRecurring}
      />

      <PrimaryCTAs onOpenFareModal={openFareModal} />
    </section>
  );
}
