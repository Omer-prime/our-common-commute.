// src/components/rider-home/BookingFields.tsx
"use client";

import React from "react";
import clsx from "clsx";
import { Crosshair, MapPin, Calendar, Clock4, RefreshCcw } from "lucide-react";
import { BookingRow } from "./BookingRow";
import { TripType } from "./types";

type BookingFieldsProps = {
  tripType: TripType;
  recurring: boolean;
  toggleRecurring: () => void;
};

export function BookingFields({
  tripType,
  recurring,
  toggleRecurring,
}: BookingFieldsProps) {
  return (
    <div className="space-y-3 text-xs">
      {/* Pickup / Destination */}
      <BookingRow
        icon={<Crosshair className="h-4 w-4 text-slate-100" />}
        label="Pickup location"
        value="Home"
      />
      <BookingRow
        icon={<MapPin className="h-4 w-4 text-slate-100" />}
        label="Destination"
        value="Work"
      />

      {/* Trip-specific time/date rows */}
      {tripType === "one-way" ? <OneWayDateTimeRow /> : <RoundTripDateTimeRow />}

      {/* Recurring toggle */}
      <button
        type="button"
        onClick={toggleRecurring}
        className="flex items-center justify-between rounded-xl border border-[#233358] bg-[#1a2d51] px-4 py-2.5"
      >
        <div className="flex items-center gap-3 text-xs text-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111e3c]">
            <RefreshCcw className="h-4 w-4 text-slate-100" />
          </div>
          <span>Make this recurring</span>
        </div>

        <span
          className={clsx(
            "flex h-5 w-9 items-center rounded-full bg-[#27385d] p-0.5 transition-colors",
            recurring && "bg-[#0B63F4]"
          )}
        >
          <span
            className={clsx(
              "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              recurring ? "translate-x-4" : "translate-x-0"
            )}
          />
        </span>
      </button>
    </div>
  );
}

/* ---------- One-way Row ---------- */
function OneWayDateTimeRow() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <BookingRow
        icon={<Calendar className="h-4 w-4 text-slate-100" />}
        label="Leave at"
        value="23 Nov, 2025"
        compact
      />
      <BookingRow
        icon={<Clock4 className="h-4 w-4 text-slate-100" />}
        label="Time"
        value="09:15 AM"
        compact
      />
    </div>
  );
}

/* ---------- Round-trip Row ---------- */
function RoundTripDateTimeRow() {
  return (
    <div className="space-y-2">
      <div className="flex gap-5 border-b border-[#233358] pb-1 text-[11px]">
        <button className="relative pb-1 text-slate-50">
          Leave at
          <span className="absolute left-0 -bottom-[2px] h-[2px] w-full rounded-full bg-[#0B63F4]" />
        </button>
        <button className="pb-1 text-slate-400 hover:text-slate-200">
          Arrive at
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <BookingRow
          icon={<Calendar className="h-4 w-4 text-slate-100" />}
          label="Date"
          value="23 Nov, 2025"
          compact
        />
        <BookingRow
          icon={<Clock4 className="h-4 w-4 text-slate-100" />}
          label="Time"
          value="09:15 AM"
          compact
        />
      </div>
    </div>
  );
}
