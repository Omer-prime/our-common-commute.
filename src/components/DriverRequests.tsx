"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { RideRequestCard, demoRideRequests } from "@/src/components/RideRequestCard";

export function DriverRequests() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [distanceOn, setDistanceOn] = useState(false);
  const [shortTripsOn, setShortTripsOn] = useState(false);

  return (
    <DriverDashboardShell>
      <div className="space-y-4 pb-16 md:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">
            Ride requests
          </h1>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#050f25] px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {demoRideRequests.concat(demoRideRequests).map((r, idx) => (
            <RideRequestCard key={r.id + idx} request={r} />
          ))}
        </div>

        {filterOpen && (
          <FilterModal
            distanceOn={distanceOn}
            shortTripsOn={shortTripsOn}
            onClose={() => setFilterOpen(false)}
            onToggleDistance={() => setDistanceOn((v) => !v)}
            onToggleShortTrips={() => setShortTripsOn((v) => !v)}
          />
        )}
      </div>
    </DriverDashboardShell>
  );
}

type FilterProps = {
  distanceOn: boolean;
  shortTripsOn: boolean;
  onToggleDistance: () => void;
  onToggleShortTrips: () => void;
  onClose: () => void;
};

function FilterModal({
  distanceOn,
  shortTripsOn,
  onToggleDistance,
  onToggleShortTrips,
  onClose,
}: FilterProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#020414] px-5 py-5 text-xs text-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Filter</h2>
          <button onClick={onClose}>
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <ToggleRow
            title="Distance"
            subtitle="Show ride request of 15 miles away"
            on={distanceOn}
            onToggle={onToggleDistance}
          />
          <ToggleRow
            title="Short distance trips"
            subtitle="Show trips less than 15 mins"
            on={shortTripsOn}
            onToggle={onToggleShortTrips}
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            onClick={onClose}
          >
            Reset
          </button>
          <button
            className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700"
            onClick={onClose}
          >
            Apply filter
          </button>
        </div>
      </div>
    </div>
  );
}

type ToggleRowProps = {
  title: string;
  subtitle: string;
  on: boolean;
  onToggle: () => void;
};

function ToggleRow({ title, subtitle, on, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-slate-100">{title}</div>
        <div className="text-[11px] text-slate-400">{subtitle}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          "flex h-5 w-9 items-center rounded-full px-0.5 transition",
          on ? "bg-blue-500" : "bg-slate-600"
        )}
      >
        <div
          className={clsx(
            "h-4 w-4 rounded-full bg-white shadow-md transition",
            on ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function clsx(...args: any[]) {
  return (args || []).filter(Boolean).join(" ");
}
