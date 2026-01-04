"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { apiFetch } from "@/src/lib/api";

type RideTab = "active" | "upcoming" | "completed";

type RideDTO = {
  id: string;
  bookingId?: string | null;
  tripType: string; // "Round trip" | "On-way"
  status: string;

  pickupAddress: string;
  destinationAddress: string;

  fare: number;
  distanceKm: number;

  rider?: { id: string; fullName: string; email: string } | null;

  scheduledFor?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  paymentStatus?: string | null;
};

function fmtWhen(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], { month: "2-digit", day: "2-digit", year: "2-digit", hour: "numeric", minute: "2-digit" });
}

function makeDateLabel(r: RideDTO) {
  if (r.startedAt) return `Started: ${fmtWhen(r.startedAt)}`;
  if (r.scheduledFor) return `Scheduled: ${fmtWhen(r.scheduledFor)}`;
  if (r.completedAt) return `Completed: ${fmtWhen(r.completedAt)}`;
  if (r.cancelledAt) return `Cancelled: ${fmtWhen(r.cancelledAt)}`;
  return "—";
}

export default function DriverMyRidesPage() {
  const [tab, setTab] = useState<RideTab>("active");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [activeRide, setActiveRide] = useState<RideDTO | null>(null);
  const [upcoming, setUpcoming] = useState<RideDTO[]>([]);
  const [completed, setCompleted] = useState<RideDTO[]>([]);

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiFetch<{
        ok: true;
        activeRide: RideDTO | null;
        upcoming: RideDTO[];
        completed: RideDTO[];
      }>("/driver/trips/my-rides", { method: "GET" });

      setActiveRide(data.activeRide);
      setUpcoming(data.upcoming ?? []);
      setCompleted(data.completed ?? []);
    } catch (e: any) {
      setErr(e?.error || e?.message || "Failed to load rides");
      setActiveRide(null);
      setUpcoming([]);
      setCompleted([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function cancelTrip(tripId: string) {
    try {
      await apiFetch(`/driver/trips/${tripId}/cancel`, {
        method: "POST",
        json: { reasons: [], otherReason: "" },
      });
      await loadAll();
    } catch (e: any) {
      alert(e?.error || "Cancel failed");
    }
  }

  async function startTrip(tripId: string) {
    try {
      await apiFetch(`/driver/trips/${tripId}/start`, { method: "POST" });
      await loadAll();
    } catch (e: any) {
      alert(e?.error || "Start failed");
    }
  }

  async function completeTrip(tripId: string) {
    try {
      await apiFetch(`/driver/trips/${tripId}/complete`, { method: "POST" });
      await loadAll();
    } catch (e: any) {
      alert(e?.error || "Complete failed");
    }
  }

  return (
    <DriverDashboardShell>
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">My rides</h1>
          {loading && <span className="text-[11px] text-slate-400">Loading…</span>}
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300 max-w-xs">
          <TabButton label="Active" isActive={tab === "active"} onClick={() => setTab("active")} />
          <TabButton label="Upcoming" isActive={tab === "upcoming"} onClick={() => setTab("upcoming")} />
          <TabButton label="Completed" isActive={tab === "completed"} onClick={() => setTab("completed")} />
        </div>

        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[11px] text-red-200">
            {String(err)}
          </div>
        )}

        <div className="mt-2 flex flex-col gap-4 pb-10">
          {tab === "active" &&
            (activeRide ? (
              <ActiveRideCard
                ride={activeRide}
                onCancel={() => cancelTrip(activeRide.id)}
                onEnd={() => completeTrip(activeRide.id)}
              />
            ) : (
              <EmptyState title="No active ride" />
            ))}

          {tab === "upcoming" &&
            (upcoming.length ? (
              <div className="space-y-4">
                {upcoming.map((ride) => (
                  <UpcomingRideCard
                    key={ride.id}
                    ride={ride}
                    onStart={() => startTrip(ride.id)}
                    onCancel={() => cancelTrip(ride.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No upcoming rides" />
            ))}

          {tab === "completed" &&
            (completed.length ? (
              <div className="space-y-4">
                {completed.map((ride) => (
                  <CompletedRideCard key={ride.id} ride={ride} />
                ))}
              </div>
            ) : (
              <EmptyState title="No completed rides" />
            ))}
        </div>
      </div>
    </DriverDashboardShell>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-5 text-[11px] text-slate-400">
      {title}
    </div>
  );
}

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

function ActiveRideCard({
  ride,
  onCancel,
  onEnd,
}: {
  ride: RideDTO;
  onCancel: () => void;
  onEnd: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image
              src={"/rider-io.png"}
              alt={ride.rider?.fullName ?? "Rider"}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-100">
              {ride.rider?.fullName ?? "Rider"}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{makeDateLabel(ride)}</span>
              <span className="h-[1px] w-4 bg-slate-600" />
              <span>{ride.tripType}</span>
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] font-semibold text-slate-100">
          ${ride.fare}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#07152f] px-3 py-3">
        <div className="flex items-start gap-3">
          <TimelineDot />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Pickup location</div>
            <div className="text-[11px] text-slate-100">{ride.pickupAddress}</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Payment</div>
            <div className="text-[11px] font-semibold text-slate-100">
              ${ride.fare}
            </div>
          </div>
        </div>

        <div className="my-2 ml-[7px] h-px w-[1px] bg-slate-600" />

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

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
        >
          Cancel ride
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="flex-1 rounded-md bg-[#1d4ed8] py-2 text-[11px] font-medium text-white hover:bg-[#234ad3]"
        >
          End ride
        </button>
      </div>
    </section>
  );
}

function UpcomingRideCard({
  ride,
  onStart,
  onCancel,
}: {
  ride: RideDTO;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[10px] text-slate-300">
        <div className="flex flex-col">
          <span className="text-slate-500">Date &amp; time</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{makeDateLabel(ride)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500">Trip type</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{ride.tripType}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500">Booking ID</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{ride.bookingId ?? "—"}</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#07152f] px-3 py-3">
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

        <div className="my-2 ml-[7px] h-px w-[1px] bg-slate-600" />

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

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onStart}
          className="flex-1 rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
        >
          Start trip
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md bg-[#ef4444] py-2 text-[11px] font-medium text-white hover:bg-[#dc2626]"
        >
          Cancel trip
        </button>
      </div>
    </section>
  );
}

function CompletedRideCard({ ride }: { ride: RideDTO }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[10px] text-slate-300">
        <div className="flex flex-col">
          <span className="text-slate-500">Date &amp; time</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{makeDateLabel(ride)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500">Trip type</span>
          <span className="mt-0.5 text-[11px] text-slate-100">{ride.tripType}</span>
        </div>
        <div className="flex items-center justify-end">
          {ride.paymentStatus && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-medium text-emerald-400">
              {ride.paymentStatus}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#07152f] px-3 py-3">
        <div className="flex items-start gap-3">
          <TimelineDot />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Pickup location</div>
            <div className="text-[11px] text-slate-100">{ride.pickupAddress}</div>
          </div>
        </div>

        <div className="my-2 ml-[7px] h-px w-[1px] bg-slate-600" />

        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">{ride.destinationAddress}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-3 text-[11px]">
          <span className="text-slate-500">Total Fare</span>
          <span className="font-semibold text-slate-100">${ride.fare}</span>
        </div>
      </div>

      <button
        type="button"
        className="mt-3 w-full rounded-md bg-[#0b1430] py-2 text-[11px] font-medium text-slate-200 hover:bg-[#111a3a]"
      >
        View receipt
      </button>
    </section>
  );
}

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
