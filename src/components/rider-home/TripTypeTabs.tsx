// src/components/rider-home/TripTypeTabs.tsx
"use client";

import clsx from "clsx";
import { TripType } from "./types";

type TripTypeTabsProps = {
  tripType: TripType;
  setTripType: (t: TripType) => void;
};

export function TripTypeTabs({ tripType, setTripType }: TripTypeTabsProps) {
  return (
    <div className="w-full rounded-xl border border-[#233358] bg-[#101a33] p-1 text-xs">
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setTripType("one-way")}
          className={clsx(
            "flex h-9 w-full items-center justify-center rounded-lg px-4 text-[11px] font-medium transition",
            tripType === "one-way"
              ? "bg-[#0B63F4] text-white shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
              : "text-slate-300"
          )}
        >
          One-way
        </button>
        <button
          type="button"
          onClick={() => setTripType("round-trip")}
          className={clsx(
            "flex h-9 w-full items-center justify-center rounded-lg px-4 text-[11px] font-medium transition",
            tripType === "round-trip"
              ? "bg-[#0B63F4] text-white shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
              : "text-slate-300"
          )}
        >
          Round trip
        </button>
      </div>
    </div>
  );
}
