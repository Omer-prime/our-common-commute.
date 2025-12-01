"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import {
  RideRequestCard,
  demoRideRequests,
} from "@/src/components/RideRequestCard";

type DriverStatus = "active" | "inactive" | "occupied";

export function DriverHome() {
  const [status, setStatus] = useState<DriverStatus>("active");

  const stats = [
    { label: "Completed rides", value: "3" },
    { label: "Rides scheduled", value: "12" },
    { label: "Upcoming Ride", value: "6" },
    { label: "Pending payouts", value: "$60.6" },
    { label: "Total Earned", value: "$200" },
  ];

  // These 3 are shown on mobile under the map (like Figma)
  const primaryMobileStats = [
    stats[1], // Rides scheduled
    stats[0], // Completed rides
    stats[4], // Total Earned
  ];

  return (
    <DriverDashboardShell>
      <div className="space-y-6">
        {/* ========= MOBILE LAYOUT ========= */}
        <div className="space-y-6 lg:hidden">
          <MobileStatusSection status={status} onChange={setStatus} />

          {/* Mobile stats row (3 small cards) */}
          <section className="grid grid-cols-3 gap-3">
            {primaryMobileStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-800 bg-[#050f25] px-2 py-3 text-center text-[11px]"
              >
                <div className="text-[10px] leading-tight text-slate-400">
                  {s.label}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-50">
                  {s.value}
                </div>
              </div>
            ))}
          </section>

          {/* Next shift – single card like mobile design */}
          <section className="space-y-2 pb-16">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Next shift
              </h2>
              <button className="text-xs font-medium text-blue-400 hover:underline">
                View schedule
              </button>
            </div>
            <NextShiftCard />
          </section>
        </div>

        {/* ========= DESKTOP / LARGE LAYOUT ========= */}
        <div className="hidden space-y-6 lg:block">
          {/* Stats row */}
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col justify-between gap-1 rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-3 text-xs"
              >
                <div className="text-[11px] text-slate-400">{s.label}</div>
                <div className="text-lg font-semibold text-slate-50">
                  {s.value}
                </div>
              </div>
            ))}
          </section>

          {/* Next shift list */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Next shift
              </h2>
              <button className="text-xs font-medium text-blue-400 hover:underline">
                View schedule
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <NextShiftCard key={i} />
              ))}
            </div>
          </section>

          {/* Map + status card side-by-side (desktop) */}
          <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            {/* Map with location marker */}
            <div className="relative h-[320px] xl:h-[360px] 2xl:h-[412px] overflow-hidden rounded-2xl border border-slate-800 bg-[#050f25]">
              <Image
                src="/dashboard-map.png"
                alt="Map"
                width={1200}
                height={600}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Image
                  src="/driver-location-marker.png" // <- put your PNG here
                  alt="Current location"
                  width={90}
                  height={90}
                  className="drop-shadow-[0_0_16px_rgba(0,0,0,0.45)]"
                />
              </div>
            </div>

            {/* Desktop status card */}
            <StatusCard
              status={status}
              onChange={setStatus}
              className="h-[320px] xl:h-[360px] 2xl:h-[412px]"
            />
          </section>

          {/* Ride requests preview – desktop only */}
          {status === "active" && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">
                  Ride requests
                </h2>
                <Link
                  href="/driver/dashboard/requests"
                  className="text-xs font-medium text-blue-400 hover:underline"
                >
                  See more
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {demoRideRequests.slice(0, 3).map((r) => (
                  <RideRequestCard key={r.id} request={r} compact />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </DriverDashboardShell>
  );
}

/* ---------- MOBILE HERO SECTION (matches your Figma) ---------- */

type StatusCardProps = {
  status: DriverStatus;
  onChange: (s: DriverStatus) => void;
  className?: string;
};

function MobileStatusSection({ status, onChange }: StatusCardProps) {
  const colors =
    status === "active"
      ? "from-blue-500 to-blue-600"
      : status === "occupied"
      ? "from-green-500 to-green-600"
      : "from-slate-700 to-slate-800";

  return (
    <section className="space-y-3">
      {/* Blue header with tabs */}
      <div
        className={`rounded-3xl bg-gradient-to-b ${colors} px-4 py-4 text-xs text-white`}
      >
        <div className="mb-1 text-[11px]">Welcome back</div>
        <div className="text-lg font-semibold">Bustin</div>

        {/* Tabs */}
        <div className="mt-3 inline-flex rounded-full bg-black/25 p-1 text-[11px]">
          {(["active", "occupied", "inactive"] as DriverStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onChange(st)}
              className={clsx(
                "min-w-[70px] rounded-full px-3 py-1 capitalize transition",
                st === status ? "bg-white text-slate-900" : "text-white/80"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Service rule banner */}
      <div className="rounded-2xl bg-[#07152f] px-3 py-2 text-[11px] text-slate-200">
        There&apos;s a change in current service rule.{" "}
        <button className="font-medium text-blue-400 underline underline-offset-2">
          Check
        </button>
      </div>

      {/* Map card with location marker */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#050f25]">
        <Image
          src="/dashboard-map.png"
          alt="Map"
          width={400}
          height={200}
          className="h-40 w-full object-cover sm:h-48"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Image
            src="/driver-location-marker.png" // <- same icon here
            alt="Current location"
            width={72}
            height={72}
            className="drop-shadow-[0_0_12px_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>

      {/* Current ride box */}
      {status === "active" && (
        <div className="space-y-2 rounded-2xl bg-[#07152f] px-4 py-3 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-100">
              My current ride
            </span>
            <button className="text-[11px] text-blue-400">Open ride</button>
          </div>
          <div>
            <div className="text-slate-400">Pickup location</div>
            <div>123 Main street, Springfield</div>
          </div>
          <div>
            <div className="text-slate-400">Destination</div>
            <div>TechCorp office, 456 Business Ave</div>
          </div>
        </div>
      )}

      {/* Inactive / occupied text for mobile */}
      {status === "inactive" && (
        <div className="space-y-2 rounded-2xl bg-[#07152f] px-4 py-3 text-[11px] text-slate-200">
          <p>
            You can not see ride requests because you&apos;re currently offline.
            Toggle to <span className="font-semibold">Active</span> to start
            receiving requests.
          </p>
          <button className="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Go online
          </button>
        </div>
      )}

      {status === "occupied" && (
        <div className="space-y-2 rounded-2xl bg-[#07152f] px-4 py-3 text-[11px] text-slate-200">
          <p>
            You&apos;re currently on a trip. Finish or cancel before accepting
            new ride requests.
          </p>
          <button className="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Go to pickup
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- DESKTOP STATUS CARD ---------- */

function StatusCard({ status, onChange, className }: StatusCardProps) {
  const colors =
    status === "active"
      ? "from-blue-500 to-blue-600"
      : status === "occupied"
      ? "from-green-500 to-green-600"
      : "from-slate-700 to-slate-800";

  return (
    <div
      className={clsx(
        "flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-100",
        "h-full",
        className
      )}
    >
      <div
        className={`rounded-2xl bg-gradient-to-r ${colors} px-4 py-4 text-xs text-white`}
      >
        <div className="mb-2 text-[11px]">Welcome back</div>
        <div className="text-lg font-semibold">Bustin</div>

        <div className="mt-4 inline-flex rounded-full bg-black/25 p-1 text-[11px]">
          {(["active", "occupied", "inactive"] as DriverStatus[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onChange(st)}
              className={clsx(
                "min-w-[70px] rounded-full px-3 py-1 capitalize transition",
                st === status ? "bg-white text-slate-900" : "text-white/80"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {status === "active" && (
        <>
          <div className="flex items-center gap-2 rounded-xl bg-[#07152f] px-3 py-2 text-[11px] text-slate-200">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <span>
              There&apos;s a change in current service rule.{" "}
              <button className="underline underline-offset-2">Check</button>
            </span>
          </div>

          <div className="space-y-2 rounded-xl bg-[#07152f] px-4 py-3 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">
                My current ride
              </span>
              <button className="text-[11px] text-blue-400">Open ride</button>
            </div>
            <div>
              <div className="text-slate-400">Pickup location</div>
              <div>123 Main street, Springfield</div>
            </div>
            <div>
              <div className="text-slate-400">Destination</div>
              <div>TechCorp office, 456 Business Ave</div>
            </div>
          </div>
        </>
      )}

      {status === "inactive" && (
        <>
          <div className="rounded-xl bg-[#07152f] px-3 py-3 text-[11px] text-slate-200">
            You can not see ride requests because you&apos;re currently offline.
            Toggle to <span className="font-semibold">Active</span> to start
            receiving requests.
          </div>
          <button className="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Go online
          </button>
        </>
      )}

      {status === "occupied" && (
        <>
          <div className="rounded-xl bg-[#07152f] px-3 py-3 text-[11px] text-slate-200">
            You&apos;re currently on a trip. Finish or cancel before accepting
            new ride requests.
          </div>
          <button className="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Go to pickup
          </button>
        </>
      )}
    </div>
  );
}

/* ---------- SHARED NEXT SHIFT CARD ---------- */

function NextShiftCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-3 text-xs text-slate-300">
      <div className="text-[11px] text-slate-400">Work location</div>
      <div className="text-sm font-medium text-slate-100">
        123 Main street, Springfield
      </div>
      <div className="mt-2 text-[11px] text-slate-400">Date &amp; Time</div>
      <div className="text-sm">23 Nov, 2025, 9:15 AM</div>
    </div>
  );
}

function clsx(...args: any[]) {
  return (args || []).filter(Boolean).join(" ");
}
