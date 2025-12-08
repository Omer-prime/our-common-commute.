// src/components/rider-home/BookingRow.tsx
"use client";

import React, { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type BookingRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
  compact?: boolean;
};

export function BookingRow({ icon, label, value, compact }: BookingRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#233358] bg-[#1a2d51] px-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111e3c]">
        {icon}
      </div>
      <div className="flex-1 text-xs">
        <div className="text-[11px] text-slate-300">{label}</div>
        <div className="mt-0.5 text-slate-100">{value}</div>
      </div>
      {!compact && (
        <button className="inline-flex items-center gap-1 rounded-md border border-[#233358] bg-[#101a33] px-3 py-[6px] text-[11px] text-slate-200">
          Home
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      )}
    </div>
  );
}
