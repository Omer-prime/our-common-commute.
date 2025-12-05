"use client";

import { useState } from "react";
import Image from "next/image";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { MapPin } from "lucide-react";

/**
 * Tabs for My rides
 */
type RideTab = "active" | "upcoming" | "completed";

/**
 * Basic ride shape – easy for backend to plug real data into later.
 */
export type Ride = {
  id: string;
  dateLabel: string; // e.g. "12-11-25, 9:50 AM"
  timeRange?: string; // e.g. "7:30 AM - 8:00 AM"
  tripType: string; // e.g. "On-way" | "Round trip"
  bookingId?: string;
  riderName?: string;
  riderAvatar?: string;
  fare: number;
  distanceKm: number;
  pickupAddress: string;
  destinationAddress: string;
  paymentAmount?: number;
  statusLabel?: string; // e.g. "Paid"
};

const ACTIVE_RIDE: Ride = {
  id: "active-1",
  dateLabel: "7:30 AM - 8:00 AM",
  timeRange: "Round trip",
  tripType: "Round trip",
  riderName: "I.O",
  riderAvatar: "/rider-io.png",
  fare: 21,
  distanceKm: 12,
  pickupAddress: "123 Main street, Springfield",
  destinationAddress: "TechCorp office, 456 Business Ave",
  paymentAmount: 300,
};

const UPCOMING_RIDES: Ride[] = [
  {
    id: "upcoming-1",
    dateLabel: "12-11-25, 9:50 AM",
    tripType: "On-way",
    bookingId: "#36451923",
    fare: 300,
    distanceKm: 12,
    pickupAddress: "123 Main street, Springfield",
    destinationAddress: "TechCorp office, 456 Business Ave",
  },
  {
    id: "upcoming-2",
    dateLabel: "12-11-25, 9:50 AM",
    tripType: "On-way",
    bookingId: "#36451923",
    fare: 300,
    distanceKm: 12,
    pickupAddress: "123 Main street, Springfield",
    destinationAddress: "TechCorp office, 456 Business Ave",
  },
];

const COMPLETED_RIDES: Ride[] = [
  {
    id: "completed-1",
    dateLabel: "12-11-25, 9:50 AM",
    tripType: "On-way",
    fare: 300,
    distanceKm: 12,
    pickupAddress: "123 Main street, Springfield",
    destinationAddress: "TechCorp office, 456 Business Ave",
    statusLabel: "Paid",
  },
];

export default function DriverMyRidesPage() {
  const [tab, setTab] = useState<RideTab>("active");

  return (
    <DriverDashboardShell>
      <div className="relative space-y-4">
        {/* Page heading */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">My rides</h1>
        </div>

        {/* Tabs */}
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300 max-w-xs">
          <TabButton label="Active" isActive={tab === "active"} onClick={() => setTab("active")} />
          <TabButton
            label="Upcoming"
            isActive={tab === "upcoming"}
            onClick={() => setTab("upcoming")}
          />
          <TabButton
            label="Completed"
            isActive={tab === "completed"}
            onClick={() => setTab("completed")}
          />
        </div>

        {/* Content */}
        <div className="mt-2 flex flex-col gap-4 pb-10">
          {tab === "active" && <ActiveRideCard ride={ACTIVE_RIDE} />}

          {tab === "upcoming" && (
            <div className="space-y-4">
              {UPCOMING_RIDES.map((ride) => (
                <UpcomingRideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}

          {tab === "completed" && (
            <div className="space-y-4">
              {COMPLETED_RIDES.map((ride) => (
                <CompletedRideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DriverDashboardShell>
  );
}

/* ----------------------------- Tabs ----------------------------- */

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-4 py-1.5 text-[11px] font-medium transition-colors ${
        isActive ? "bg-[#1d4ed8] text-white" : "bg-transparent text-slate-400 hover:bg-[#07152f]"
      }`}
    >
      {label}
    </button>
  );
}

/* ------------------------ Active ride card ---------------------- */

function ActiveRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      {/* Rider row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image
              src={ride.riderAvatar ?? "/rider-io.png"}
              alt={ride.riderName ?? "Rider"}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-100">
              {ride.riderName ?? "I.O"}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{ride.dateLabel}</span>
              <span className="h-[1px] w-4 bg-slate-600" />
              <span>{ride.tripType}</span>
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] font-semibold text-slate-100">
          ${ride.fare}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>Trip progress</span>
          <span>3 min</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800">
          <div className="h-1.5 w-1/3 rounded-full bg-[#1d4ed8]" />
        </div>
      </div>

      {/* Route */}
      <div className="mt-4 rounded-xl bg-[#07152f] px-3 py-3">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <TimelineDot />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Pickup location</div>
            <div className="text-[11px] text-slate-100">{ride.pickupAddress}</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Payment</div>
            <div className="text-[11px] font-semibold text-slate-100">
              ${ride.paymentAmount ?? 300}
            </div>
          </div>
        </div>

        {/* Divider line */}
        <div className="my-2 ml-[7px] h-px w-[1px] bg-slate-600" />

        {/* Destination */}
        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">{ride.destinationAddress}</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Distance</div>
            <div className="text-[11px] font-semibold text-slate-100">
              {ride.distanceKm}km
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
        >
          Cancel ride
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-[#1d4ed8] py-2 text-[11px] font-medium text-white hover:bg-[#234ad3]"
        >
          End ride
        </button>
      </div>
    </section>
  );
}

/* ---------------------- Upcoming ride card ---------------------- */

function UpcomingRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      {/* Top meta row */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[10px] text-slate-300">
        <div className="flex flex-col">
          <span className="text-slate-500">Date &amp; time</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{ride.dateLabel}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500">Trip type</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{ride.tripType}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500">Booking ID</span>
          <span className="mt-0.5 text-[11px] text-slate-100">
            {ride.bookingId ?? "#00000000"}
          </span>
        </div>
      </div>

      {/* Route */}
      <div className="mt-4 rounded-xl bg-[#07152f] px-3 py-3">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <TimelineDot />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Pickup location</div>
            <div className="text-[11px] text-slate-100">{ride.pickupAddress}</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Fare</div>
            <div className="text-[11px] font-semibold text-slate-100">${ride.fare}</div>
          </div>
        </div>

        {/* Divider line */}
        <div className="my-2 ml-[7px] h-px w-[1px] bg-slate-600" />

        {/* Destination */}
        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">{ride.destinationAddress}</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Distance</div>
            <div className="text-[11px] font-semibold text-slate-100">
              {ride.distanceKm}km
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
        >
          Start trip
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-[#ef4444] py-2 text-[11px] font-medium text-white hover:bg-[#dc2626]"
        >
          Cancel trip
        </button>
      </div>
    </section>
  );
}

/* --------------------- Completed ride card ---------------------- */

function CompletedRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      {/* Top meta row */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[10px] text-slate-300">
        <div className="flex flex-col">
          <span className="text-slate-500">Date &amp; time</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{ride.dateLabel}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500">Trip type</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{ride.tripType}</span>
        </div>
        <div className="flex items-center justify-end">
          {ride.statusLabel && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-medium text-emerald-400">
              {ride.statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="mt-4 rounded-xl bg-[#07152f] px-3 py-3">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <TimelineDot />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Pickup location</div>
            <div className="text-[11px] text-slate-100">{ride.pickupAddress}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-2 ml-[7px] h-px w-[1px] bg-slate-600" />

        {/* Destination */}
        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">{ride.destinationAddress}</div>
          </div>
        </div>

        {/* Total fare row */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-3 text-[11px]">
          <span className="text-slate-500">Total Fare</span>
          <span className="font-semibold text-slate-100">${ride.fare}</span>
        </div>
      </div>

      {/* View receipt button */}
      <button
        type="button"
        className="mt-3 w-full rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
      >
        View receipt
      </button>
    </section>
  );
}

/* ---------------------- Small shared pieces --------------------- */

function TimelineDot({ variant = "pickup" }: { variant?: "pickup" | "destination" }) {
  const color =
    variant === "pickup"
      ? "bg-blue-500 border-blue-300"
      : "bg-slate-100 border-slate-400";

  return (
    <div className="flex flex-col items-center">
      <div className={`mt-0.5 h-3 w-3 rounded-full border ${color}`} />
      <div className="mt-1 h-8 w-px bg-slate-600" />
    </div>
  );
}
