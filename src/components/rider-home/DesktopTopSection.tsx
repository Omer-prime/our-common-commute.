// src/components/rider-home/DesktopTopSection.tsx
"use client";

import React from "react";
import Image from "next/image";
import { BookingFields } from "./BookingFields";
import { TripTypeTabs } from "./TripTypeTabs";
import { PrimaryCTAs } from "./PrimaryCTAs";
import { TopSectionProps } from "./types";

export function DesktopTopSection({
  tripType,
  setTripType,
  recurring,
  toggleRecurring,
  openFareModal,
}: TopSectionProps) {
  return (
    <section className="hidden gap-6 rounded-2xl border border-[#233358] bg-[#18213a] p-5 lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
      {/* Big map */}
      <div className="relative overflow-hidden rounded-2xl bg-[#101a33]">
        <div className="relative h-[320px] xl:h-[360px]">
          <Image
            src="/rider-dashboard-map.png"
            alt="Map with current route"
            fill
            priority
            className="object-cover"
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
        />
        <PrimaryCTAs onOpenFareModal={openFareModal} />
      </div>
    </section>
  );
}
