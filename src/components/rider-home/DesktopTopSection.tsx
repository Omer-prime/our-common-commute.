// src/components/rider-home/DesktopTopSection.tsx
"use client";

import React from "react";
import { BookingFields } from "./BookingFields";
import { TripTypeTabs } from "./TripTypeTabs";
import { PrimaryCTAs } from "./PrimaryCTAs";
import type { TopSectionProps } from "./types";
import { DriverLiveMap } from "@/src/components/DriverLiveMap";

export function DesktopTopSection({
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
    <section className="hidden gap-6 rounded-2xl border border-[#233358] bg-[#18213a] p-5 lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
      {/* Live map */}
      <div className="relative overflow-hidden rounded-2xl bg-[#101a33]">
        <div className="relative h-[320px] xl:h-[360px]">
          <DriverLiveMap
            pickup={pickup?.coords ?? null}
            dropoff={dropoff?.coords ?? null}
            showRoute={Boolean(pickup?.coords && dropoff?.coords)}
          />
        </div>
      </div>

      {/* Booking panel */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-50">
            Hello Daniel, where would you like to go
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Choose your preferred destination
          </p>
        </div>

        <TripTypeTabs tripType={tripType} setTripType={setTripType} />

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
      </div>
    </section>
  );
}
