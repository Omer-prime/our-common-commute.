"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { RideRequestCard } from "@/src/components/RideRequestCard";
import { apiFetch } from "@/src/lib/api";
import type { ComponentProps } from "react";

type RideRequest = ComponentProps<typeof RideRequestCard>["request"];

type TripDTO = {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  fareCents?: number | null;
  distanceMeters?: number | null;
  estDurationSeconds?: number | null;
  scheduledFor?: string | null;
  rider?: { id: string; fullName: string; avatarUrl?: string | null } | null;
};

function extractItems<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data?.items && Array.isArray(data.items)) return data.items as T[];
  if (data?.data && Array.isArray(data.data)) return data.data as T[];
  return [];
}

function centsToMoney(c?: number | null) {
  const n = typeof c === "number" ? c : 0;
  return Math.round(n / 100);
}

function metersToKm(m?: number | null) {
  const n = typeof m === "number" ? m : 0;
  return Math.round((n / 1000) * 10) / 10;
}

function fmtWhen(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], { month: "2-digit", day: "2-digit", year: "2-digit", hour: "numeric", minute: "2-digit" });
}

/**
 * Map backend trip -> RideRequestCard props.
 * Adjust keys here if your RideRequestCard expects different fields.
 */
function mapTripToRequest(t: TripDTO): RideRequest {
  // NOTE: We don’t know your exact RideRequestCard prop shape,
  // so we fill common fields and cast to RideRequest.
  return {
    id: t.id,
    riderName: t.rider?.fullName ?? "Rider",
    riderAvatar: t.rider?.avatarUrl ?? "/rider-io.png",
    pickupAddress: t.pickupAddress,
    destinationAddress: t.dropoffAddress,
    fare: centsToMoney(t.fareCents),
    distanceKm: metersToKm(t.distanceMeters),
    dateLabel: t.scheduledFor ? fmtWhen(t.scheduledFor) : "—",
    estDurationSeconds: t.estDurationSeconds ?? undefined,
  } as unknown as RideRequest;
}

export function DriverRequests() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [distanceOn, setDistanceOn] = useState(false);
  const [shortTripsOn, setShortTripsOn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<RideRequest[]>([]);

  const qs = useMemo(() => {
    const d = distanceOn ? 1 : 0;
    const s = shortTripsOn ? 1 : 0;
    return `scope=requests&distanceOn=${d}&shortTripsOn=${s}`;
  }, [distanceOn, shortTripsOn]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiFetch<any>(`/driver/trips?${qs}`, { method: "GET" });
      const trips = extractItems<TripDTO>(data);
      setItems(trips.map(mapTripToRequest));
    } catch (e: any) {
      setErr(e?.error || e?.message || "Failed to load requests");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  return (
    <DriverDashboardShell>
      <div className="space-y-4 pb-16 md:pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-slate-100">Ride requests</h1>
            {loading && <span className="text-[11px] text-slate-400">Loading…</span>}
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#050f25] px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>

        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[11px] text-red-200">
            {String(err)}
          </div>
        )}

        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((r) => (
              <RideRequestCard key={(r as any).id} request={r} />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-5 text-[11px] text-slate-400">
              No ride requests found.
            </div>
          )
        )}

        {filterOpen && (
          <FilterModal
            distanceOn={distanceOn}
            shortTripsOn={shortTripsOn}
            onClose={() => setFilterOpen(false)}
            onToggleDistance={() => setDistanceOn((v) => !v)}
            onToggleShortTrips={() => setShortTripsOn((v) => !v)}
            onReset={() => {
              setDistanceOn(false);
              setShortTripsOn(false);
              setFilterOpen(false);
            }}
            onApply={() => setFilterOpen(false)}
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
  onReset: () => void;
  onApply: () => void;
};

function FilterModal({
  distanceOn,
  shortTripsOn,
  onToggleDistance,
  onToggleShortTrips,
  onClose,
  onReset,
  onApply,
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
            onClick={onReset}
          >
            Reset
          </button>
          <button
            className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700"
            onClick={onApply}
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

function clsx(...args: unknown[]) {
  return (args || []).filter(Boolean).join(" ");
}
