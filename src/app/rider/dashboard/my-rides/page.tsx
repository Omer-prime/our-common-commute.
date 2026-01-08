"use client";

import { useEffect, useMemo, useState } from "react";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";

type RideTab = "active" | "upcoming" | "history";

export type Ride = {
  id: string;
  dateLabel: string;
  tripType: string;
  bookingId?: string;
  fare: number;
  distanceKm: number;
  pickupAddress: string;
  destinationAddress: string;
  paymentAmount?: number;
  driverName?: string;
  statusLabel?: string;
};

type ApiTrip = {
  id: string;
  status: string;
  tripType: string;
  bookingId: string | null;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;

  pickupAddress: string;
  dropoffAddress: string;

  fareCents: number;
  distanceMeters: number | null;

  driver?: { id: string; fullName: string } | null;

  createdAt: string;
};

type MyRidesResponse = {
  ok: boolean;
  user?: { id: string; fullName: string };
  activeTrip: ApiTrip | null;
  upcoming: ApiTrip[];
  history: ApiTrip[];
  error?: string;
};

function getBackendBaseUrl() {
  let base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  base = base.replace(/\/+$/, "");
  if (!base) return "http://localhost:4000";
  // if someone sets NEXT_PUBLIC_API_URL=http://localhost:4000/api
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
}

function readOccAuthJson(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("occ_auth");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  // Your screenshot shows: accessToken
  const directKeys = ["accessToken", "token", "access_token", "authToken", "jwt"];
  for (const k of directKeys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }

  // Fallback: occ_auth JSON
  const occ = readOccAuthJson();
  const fromOcc =
    occ?.accessToken || occ?.token || occ?.access_token || occ?.jwt || occ?.authToken;
  if (typeof fromOcc === "string" && fromOcc.trim()) return fromOcc.trim();

  return null;
}

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;

  const directKeys = ["refreshToken", "refresh_token"];
  for (const k of directKeys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }

  const occ = readOccAuthJson();
  const fromOcc = occ?.refreshToken || occ?.refresh_token;
  if (typeof fromOcc === "string" && fromOcc.trim()) return fromOcc.trim();

  return null;
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toTripTypeLabel(t: string) {
  return t === "ROUND_TRIP" ? "Round trip" : "On-way";
}

function toStatusLabel(s: string) {
  if (s === "COMPLETED") return "Completed";
  if (s === "CANCELLED") return "Cancelled";
  return "";
}

function toDollars(cents: number) {
  const v = Number(cents ?? 0) / 100;
  return Number(v.toFixed(2));
}

function toKm(meters: number | null) {
  if (!meters) return 0;
  return Number((meters / 1000).toFixed(1));
}

function tripToRide(trip: ApiTrip): Ride {
  const date =
    trip.scheduledFor ??
    trip.startedAt ??
    trip.createdAt ??
    trip.completedAt ??
    trip.cancelledAt;

  return {
    id: trip.id,
    dateLabel: fmtDateTime(date),
    tripType: toTripTypeLabel(trip.tripType),
    bookingId: trip.bookingId
      ? trip.bookingId.startsWith("#")
        ? trip.bookingId
        : `#${trip.bookingId}`
      : undefined,
    fare: toDollars(trip.fareCents),
    distanceKm: toKm(trip.distanceMeters),
    pickupAddress: trip.pickupAddress ?? "",
    destinationAddress: trip.dropoffAddress ?? "",
    paymentAmount: toDollars(trip.fareCents),
    driverName: trip.driver?.fullName ?? undefined,
    statusLabel: toStatusLabel(trip.status) || undefined,
  };
}

async function safeParseJson<T>(res: Response): Promise<T | null> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function RiderMyRidesPage() {
  const [tab, setTab] = useState<RideTab>("active");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [activeTrip, setActiveTrip] = useState<ApiTrip | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<ApiTrip[]>([]);
  const [historyTrips, setHistoryTrips] = useState<ApiTrip[]>([]);

  const activeRide = useMemo(() => (activeTrip ? tripToRide(activeTrip) : null), [activeTrip]);
  const upcomingRides = useMemo(() => upcomingTrips.map(tripToRide), [upcomingTrips]);
  const historyRides = useMemo(() => historyTrips.map(tripToRide), [historyTrips]);

  const load = async () => {
    const base = getBackendBaseUrl();

    try {
      setLoading(true);
      setErr(null);

      let accessToken = getStoredAccessToken();

      // If no token, show clear message
      if (!accessToken) {
        setActiveTrip(null);
        setUpcomingTrips([]);
        setHistoryTrips([]);
        setErr("UNAUTHORIZED — Please login again. (No accessToken found in localStorage.)");
        return;
      }

      const doFetch = async (token: string) => {
        return fetch(`${base}/api/rider/my-rides`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      };

      // 1st try
      let res = await doFetch(accessToken);

      // If 401, try refresh once
      if (res.status === 401) {
        const refreshToken = getStoredRefreshToken();

        // If we have refreshToken, refresh access then retry
        if (refreshToken) {
          const refreshRes = await fetch(`${base}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshJson = await safeParseJson<{ accessToken?: string; error?: string }>(
            refreshRes
          );

          const newAccess = refreshJson?.accessToken?.trim();
          if (refreshRes.ok && newAccess) {
            localStorage.setItem("accessToken", newAccess);
            accessToken = newAccess;
            res = await doFetch(accessToken);
          }
        }
      }

      const data = (await safeParseJson<MyRidesResponse>(res)) ?? null;

      if (!res.ok || !data?.ok) {
        const backendMsg = data?.error || (await res.text()).trim();
        if (res.status === 401) {
          throw new Error(
            backendMsg || "UNAUTHORIZED — Please login again. (Access token invalid/expired.)"
          );
        }
        throw new Error(backendMsg || `Failed to load rides (${res.status})`);
      }

      setActiveTrip(data.activeTrip);
      setUpcomingTrips(data.upcoming ?? []);
      setHistoryTrips(data.history ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load rides");
      setActiveTrip(null);
      setUpcomingTrips([]);
      setHistoryTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RiderDashboardShell>
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">My rides</h1>
        </div>

        {err ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            {err}
          </div>
        ) : null}

        <div className="mt-2 flex max-w-xs items-center gap-2 rounded-xl bg-[#050f25] p-1 text-xs text-slate-300">
          <TabButton label="Active" isActive={tab === "active"} onClick={() => setTab("active")} />
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

        <div className="mt-2 flex flex-col gap-4 pb-10">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-300">
              Loading rides...
            </div>
          ) : null}

          {!loading && tab === "active" && (
            <>
              {activeRide ? (
                <ActiveRideCard ride={activeRide} />
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-300">
                  No active ride right now.
                </div>
              )}
            </>
          )}

          {!loading && tab === "upcoming" && (
            <div className="space-y-4">
              {upcomingRides.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-300">
                  No upcoming rides scheduled.
                </div>
              ) : (
                upcomingRides.map((ride) => <UpcomingRideCard key={ride.id} ride={ride} />)
              )}
            </div>
          )}

          {!loading && tab === "history" && (
            <div className="space-y-4">
              {historyRides.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-300">
                  No ride history yet.
                </div>
              ) : (
                historyRides.map((ride) => <HistoryRideCard key={ride.id} ride={ride} />)
              )}
            </div>
          )}
        </div>
      </div>
    </RiderDashboardShell>
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
        isActive ? "bg-[#0B63F4] text-white" : "bg-transparent text-slate-400 hover:bg-[#07152f]"
      }`}
    >
      {label}
    </button>
  );
}

/* UI cards (unchanged) */

function ActiveRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
      <div className="mb-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>Trip progress</span>
        <span>—</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div className="h-1.5 w-1/3 rounded-full bg-[#0B63F4]" />
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
              ${ride.paymentAmount ?? ride.fare}
            </div>
          </div>
        </div>

        <div className="my-2 ml-[7px] h-8 w-px bg-slate-600" />

        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">{ride.destinationAddress}</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Distance</div>
            <div className="text-[11px] font-semibold text-slate-100">{ride.distanceKm}km</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UpcomingRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
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
          <span className="mt-0.5 text-[11px] text-slate-100">{ride.bookingId ?? "#00000000"}</span>
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

        <div className="my-2 ml-[7px] h-8 w-px bg-slate-600" />

        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">{ride.destinationAddress}</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div className="text-[10px] text-slate-400">Fare</div>
            <div className="text-[11px] font-semibold text-slate-100">${ride.fare}</div>
          </div>
        </div>
      </div>

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

function HistoryRideCard({ ride }: { ride: Ride }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-4 text-xs text-slate-200">
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

      <div className="mt-4 rounded-xl bg-[#07152f] px-3 py-3">
        <div className="flex items-start gap-3">
          <TimelineDot />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Pickup location</div>
            <div className="text-[11px] text-slate-100">{ride.pickupAddress}</div>
          </div>
        </div>

        <div className="my-2 ml-[7px] h-8 w-px bg-slate-600" />

        <div className="mt-1 flex items-start gap-3">
          <TimelineDot variant="destination" />
          <div className="flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400">Destination</div>
            <div className="text-[11px] text-slate-100">{ride.destinationAddress}</div>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between text-[11px]">
          <div>
            <div className="text-[10px] text-slate-400">Driver</div>
            <div className="mt-0.5 text-[11px] text-slate-100">{ride.driverName ?? "—"}</div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div>Fare</div>
            <div className="mt-0.5 text-[11px] font-semibold text-slate-100">${ride.fare}</div>
            <div className="text-[11px] font-semibold text-slate-100">${ride.fare}</div>
          </div>
        </div>
      </div>

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

function TimelineDot({ variant = "pickup" }: { variant?: "pickup" | "destination" }) {
  const color =
    variant === "pickup" ? "bg-blue-500 border-blue-300" : "bg-slate-100 border-slate-400";

  return (
    <div className="flex flex-col items-center">
      <div className={`mt-0.5 h-3 w-3 rounded-full border ${color}`} />
      <div className="mt-1 h-8 w-px bg-slate-600" />
    </div>
  );
}
