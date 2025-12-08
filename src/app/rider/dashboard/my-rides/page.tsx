"use client";

import { useState } from "react";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";

/**
 * Tabs for My rides (rider)
 */
type RideTab = "active" | "upcoming" | "history";

/**
 * Shared ride type – backend can plug real data later.
 */
export type Ride = {
  id: string;
  dateLabel: string; // "12-11-25, 9:50 AM"
  tripType: string; // "On-way" | "Round trip"
  bookingId?: string;
  fare: number;
  distanceKm: number;
  pickupAddress: string;
  destinationAddress: string;
  paymentAmount?: number; // used in Active tab "Payment"
  driverName?: string; // used in History tab
  statusLabel?: string; // e.g. "Completed"
};

/* --------------------- Dummy data (for now) --------------------- */

const ACTIVE_RIDE: Ride = {
  id: "active-1",
  dateLabel: "12-11-25, 9:50 AM",
  tripType: "On-way",
  fare: 300,
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

const HISTORY_RIDES: Ride[] = [
  {
    id: "history-1",
    dateLabel: "12-11-25, 9:50 AM",
    tripType: "On-way",
    fare: 300,
    distanceKm: 12,
    pickupAddress: "123 Main street, Springfield",
    destinationAddress: "TechCorp office, 456 Business Ave",
    driverName: "Maria G",
    statusLabel: "Completed",
  },
  {
    id: "history-2",
    dateLabel: "12-11-25, 9:50 AM",
    tripType: "On-way",
    fare: 300,
    distanceKm: 12,
    pickupAddress: "123 Main street, Springfield",
    destinationAddress: "TechCorp office, 456 Business Ave",
    driverName: "Maria G",
    statusLabel: "Completed",
  },
];

/* --------------------------- Page -------------------------- */

export default function RiderMyRidesPage() {
  const [tab, setTab] = useState<RideTab>("active");

  return (
    <RiderDashboardShell>
      <div className="relative space-y-4">
        {/* Page heading */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">My rides</h1>
        </div>

        {/* Tabs */}
        <div className="mt-2 flex max-w-xs items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300">
          <TabButton
            label="Active"
            isActive={tab === "active"}
            onClick={() => setTab("active")}
          />
          <TabButton
            label="Upcoming"
            isActive={tab === "upcoming"}
            onClick={() => setTab("upcoming")}
          />
          <TabButton
            label="History"
            isActive={tab === "history"}
            onClick={() => setTab("history")}
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

          {tab === "history" && (
            <div className="space-y-4">
              {HISTORY_RIDES.map((ride) => (
                <HistoryRideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </div>
      </div>
    </RiderDashboardShell>
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
        isActive
          ? "bg-[#0B63F4] text-white"
          : "bg-transparent text-slate-400 hover:bg-[#07152f]"
      }`}
    >
      {label}
    </button>
  );
}

/* ------------------------ Active ride card ---------------------- */
/* matches first Figma (Trip progress + payment/distance)          */

function ActiveRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      {/* Trip progress bar */}
      <div className="mb-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>Trip progress</span>
        <span>3 min</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div className="h-1.5 w-1/3 rounded-full bg-[#0B63F4]" />
      </div>

      {/* Route card */}
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
              ${ride.paymentAmount ?? ride.fare}
            </div>
          </div>
        </div>

        {/* Divider line */}
        <div className="my-2 ml-[7px] h-8 w-px bg-slate-600" />

        {/* Destination */}
        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">
              {ride.destinationAddress}
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Distance</div>
            <div className="text-[11px] font-semibold text-slate-100">
              {ride.distanceKm}km
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------- Upcoming ride card ---------------------- */
/* matches second Figma (Upcoming tab with three buttons)          */

function UpcomingRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      {/* Top meta row */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[10px] text-slate-300">
        <div className="flex flex-col">
          <span className="text-slate-500">Date &amp; time</span>
          <span className="mt-0.5 text-[11px] text-slate-100">
            {ride.dateLabel}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500">Trip type</span>
          <span className="mt-0.5 text-[11px] text-slate-100">
            {ride.tripType}
          </span>
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
        </div>

        {/* Divider line */}
        <div className="my-2 ml-[7px] h-8 w-px bg-slate-600" />

        {/* Destination */}
        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">
              {ride.destinationAddress}
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Fare</div>
            <div className="text-[11px] font-semibold text-slate-100">
              ${ride.fare}
            </div>
          </div>
        </div>
      </div>

      {/* Actions – Change time / View QR / Cancel */}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
        >
          Change time
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
        >
          View QR
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-[#ef4444] py-2 text-[11px] font-medium text-white hover:bg-[#dc2626]"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

/* ----------------------- History ride card ---------------------- */
/* matches third Figma (History tab with Completed + buttons)      */

function HistoryRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      {/* Top meta row */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[10px] text-slate-300">
        <div className="flex flex-col">
          <span className="text-slate-500">Date &amp; time</span>
          <span className="mt-0.5 text-[11px] text-slate-100">
            {ride.dateLabel}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500">Trip type</span>
          <span className="mt-0.5 text-[11px] text-slate-100">
            {ride.tripType}
          </span>
        </div>
        <div className="flex items-center justify-end">
          {ride.statusLabel && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-medium text-emerald-400">
              {ride.statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* Route + Fare + Driver */}
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
        <div className="my-2 ml-[7px] h-8 w-px bg-slate-600" />

        {/* Destination */}
        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">
              {ride.destinationAddress}
            </div>
          </div>
        </div>

        {/* Driver + Fare row */}
        <div className="mt-4 flex items-start justify-between text-[11px]">
          <div>
            <div className="text-[10px] text-slate-400">Driver</div>
            <div className="mt-0.5 text-[11px] text-slate-100">
              {ride.driverName ?? "Maria G"}
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div>Fare</div>
            <div className="mt-0.5 text-[11px] font-semibold text-slate-100">
              ${ride.fare}
            </div>
            <div className="text-[11px] font-semibold text-slate-100">
              ${ride.fare}
            </div>
          </div>
        </div>
      </div>

      {/* View receipt / Rebook buttons */}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
        >
          View receipt
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-[#0B63F4] py-2 text-[11px] font-medium text-white hover:bg-[#1a74ff]"
        >
          Rebook
        </button>
      </div>
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
