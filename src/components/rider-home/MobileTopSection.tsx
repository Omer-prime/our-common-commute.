// src/components/rider-home/MobileTopSection.tsx
"use client";

import React from "react";
import { TripTypeTabs } from "./TripTypeTabs";
import { BookingFields } from "./BookingFields";
import { PrimaryCTAs } from "./PrimaryCTAs";
import type { TopSectionProps } from "./types";
import { DriverLiveMap } from "@/src/components/DriverLiveMap";

export function MobileTopSection({
  tripType,
  setTripType,
  recurring,
  toggleRecurring,
  openFareModal,
  pickup,
  dropoff,
  leaveAt,
  arriveAt,
  onPickupChange,
  onDropoffChange,
  onLeaveAtChange,
  onArriveAtChange,
}: TopSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#233358] bg-[#18213a] p-4 lg:hidden">
      {/* Greeting */}
      <div className="space-y-0.5">
        <div className="text-sm font-semibold text-slate-50">Hello Daniel</div>
        <div className="text-[11px] text-slate-300">Where would you like to go?</div>
      </div>

      <TripTypeTabs tripType={tripType} setTripType={setTripType} />

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

      {/* Live map */}
      <div className="relative overflow-hidden rounded-2xl bg-[#101a33]">
        <div className="relative h-52">
          <DriverLiveMap
            pickup={pickup?.coords ?? null}
            dropoff={dropoff?.coords ?? null}
            showRoute={Boolean(pickup?.coords && dropoff?.coords)}
          />
        </div>
      </div>

      {/* Booking fields + buttons */}
      <BookingFields
        tripType={tripType}
        recurring={recurring}
        toggleRecurring={toggleRecurring}
        pickup={pickup}
        dropoff={dropoff}
        leaveAt={leaveAt}
        arriveAt={arriveAt}
        onPickupChange={onPickupChange}
        onDropoffChange={onDropoffChange}
        onLeaveAtChange={onLeaveAtChange}
        onArriveAtChange={onArriveAtChange}
      />

      <PrimaryCTAs onOpenFareModal={openFareModal} />
    </section>
  );
}
