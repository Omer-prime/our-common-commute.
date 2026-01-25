"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { DriverLiveMap } from "@/src/components/DriverLiveMap";
import { RideRequestCard } from "@/src/components/RideRequestCard";
import { authedJson } from "@/src/lib/authClient";

type DriverStatusUI = "active" | "inactive" | "occupied";
type DriverStatusAPI = "ACTIVE" | "INACTIVE" | "OCCUPIED";

type DashboardHomeResponse = {
  ok: boolean;
  driver: { fullName: string; status: DriverStatusAPI };
  stats: {
    completedRides: number;
    ridesScheduled: number;
    upcomingRide: number;
    pendingPayoutCents: number;
    totalEarnedCents: number;
  };
  nextShifts: Array<{ workLocation: string | null; startAt: string; endAt: string }>;
  currentRide: null | {
    pickupLocation: string;
    destination: string;
  };
  rideRequests: any[];
};

function apiToUiStatus(s: DriverStatusAPI): DriverStatusUI {
  if (s === "ACTIVE") return "active";
  if (s === "OCCUPIED") return "occupied";
  return "inactive";
}
function uiToApiStatus(s: DriverStatusUI): DriverStatusAPI {
  if (s === "active") return "ACTIVE";
  if (s === "occupied") return "OCCUPIED";
  return "INACTIVE";
}

function moneyFromCents(cents: number) {
  const val = Number(cents || 0) / 100;
  return `$${val.toFixed(2)}`;
}

export function DriverHome() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<DashboardHomeResponse | null>(null);

  const status: DriverStatusUI = useMemo(() => {
    if (!data) return "inactive";
    return apiToUiStatus(data.driver.status);
  }, [data]);

  async function fetchHome() {
    setLoading(true);
    setErr(null);

    try {
      // ✅ uses same auth + base + refresh logic as the rest of the app
      const json = await authedJson<DashboardHomeResponse>("/driver/dashboard/home", { method: "GET" });
      setData(json);
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(next: DriverStatusUI) {
    // optimistic UI update
    setData((prev) =>
      prev ? { ...prev, driver: { ...prev.driver, status: uiToApiStatus(next) } } : prev
    );

    try {
      await authedJson<{ ok: true; status: DriverStatusAPI }>(`/driver/dashboard/status`, {
        method: "PUT",
        json: { status: uiToApiStatus(next) },
      });

      // keep UI in sync (optional but safe)
      await fetchHome();
    } catch {
      await fetchHome();
    }
  }

  useEffect(() => {
    void fetchHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const s = data?.stats;
    return [
      { label: "Completed rides", value: String(s?.completedRides ?? 0) },
      { label: "Rides scheduled", value: String(s?.ridesScheduled ?? 0) },
      { label: "Upcoming Ride", value: String(s?.upcomingRide ?? 0) },
      { label: "Pending payouts", value: moneyFromCents(s?.pendingPayoutCents ?? 0) },
      { label: "Total Earned", value: moneyFromCents(s?.totalEarnedCents ?? 0) },
    ];
  }, [data]);

  const primaryMobileStats = [stats[1], stats[0], stats[4]];

  const rideRequestsToShow = useMemo(() => {
    return (data?.rideRequests ?? []).slice(0, 3);
  }, [data]);

  return (
    <DriverDashboardShell>
      <div className="space-y-6">
        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-sm text-slate-200">
            Loading dashboard...
          </div>
        )}

        {err && (
          <div className="rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
            {err}
            <button className="ml-3 underline" onClick={() => void fetchHome()}>
              Retry
            </button>
          </div>
        )}

        {/* ========= MOBILE LAYOUT ========= */}
        <div className="space-y-6 lg:hidden">
          <MobileStatusSection fullName={data?.driver.fullName || "Driver"} status={status} onChange={changeStatus} />

          <section className="grid grid-cols-3 gap-3">
            {primaryMobileStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-800 bg-[#050f25] px-2 py-3 text-center text-[11px]"
              >
                <div className="text-[10px] leading-tight text-slate-400">{s.label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-50">{s.value}</div>
              </div>
            ))}
          </section>

          <section className="space-y-2 pb-16">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Next shift</h2>
              <button className="text-xs font-medium text-blue-400 hover:underline">View schedule</button>
            </div>

            <NextShiftCard shift={data?.nextShifts?.[0] || null} />
          </section>
        </div>

        {/* ========= DESKTOP ========= */}
        <div className="hidden space-y-6 lg:block">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col justify-between gap-1 rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-3 text-xs"
              >
                <div className="text-[11px] text-slate-400">{s.label}</div>
                <div className="text-lg font-semibold text-slate-50">{s.value}</div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">Next shift</h2>
              <button className="text-xs font-medium text-blue-400 hover:underline">View schedule</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {(data?.nextShifts?.length ? data.nextShifts : [null, null, null, null]).slice(0, 4).map((sh, i) => (
                <NextShiftCard key={i} shift={sh as any} />
              ))}
            </div>
          </section>

          <section className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            <div className="relative h-[320px] overflow-hidden rounded-2xl border border-slate-800 bg-[#050f25] xl:h-[360px] 2xl:h-[412px]">
              <DriverLiveMap />
            </div>

            <StatusCard
              fullName={data?.driver.fullName || "Driver"}
              status={status}
              onChange={changeStatus}
              className="h-[320px] xl:h-[360px] 2xl:h-[412px]"
            />
          </section>

          {status === "active" && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">Ride requests</h2>
                <Link href="/driver/dashboard/requests" className="text-xs font-medium text-blue-400 hover:underline">
                  See more
                </Link>
              </div>

              {rideRequestsToShow.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-sm text-slate-300">
                  No ride requests right now.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {rideRequestsToShow.map((r: any, i: number) => (
                    <RideRequestCard key={r?.id ?? i} request={r} compact />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </DriverDashboardShell>
  );
}

/* ---------- MOBILE HERO SECTION ---------- */

type StatusCardProps = {
  fullName: string;
  status: DriverStatusUI;
  onChange: (s: DriverStatusUI) => void;
  className?: string;
};

function MobileStatusSection({ fullName, status, onChange }: StatusCardProps) {
  const colors =
    status === "active"
      ? "from-blue-500 to-blue-600"
      : status === "occupied"
      ? "from-green-500 to-green-600"
      : "from-slate-700 to-slate-800";

  return (
    <section className="space-y-3">
      <div className={`rounded-3xl bg-gradient-to-b ${colors} px-4 py-4 text-xs text-white`}>
        <div className="mb-1 text-[11px]">Welcome back</div>
        <div className="text-lg font-semibold">{fullName}</div>

        <div className="mt-3 inline-flex rounded-full bg-black/25 p-1 text-[11px]">
          {(["active", "occupied", "inactive"] as DriverStatusUI[]).map((st) => (
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

      <div className="rounded-2xl bg-[#07152f] px-3 py-2 text-[11px] text-slate-200">
        There&apos;s a change in current service rule.{" "}
        <button className="font-medium text-blue-400 underline underline-offset-2">Check</button>
      </div>

      <div className="h-40 sm:h-48">
        <DriverLiveMap />
      </div>

      {status === "inactive" && (
        <div className="space-y-2 rounded-2xl bg-[#07152f] px-4 py-3 text-[11px] text-slate-200">
          <p>
            You can not see ride requests because you&apos;re currently offline. Toggle to{" "}
            <span className="font-semibold">Active</span> to start receiving requests.
          </p>
          <button
            onClick={() => onChange("active")}
            className="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go online
          </button>
        </div>
      )}

      {status === "occupied" && (
        <div className="space-y-2 rounded-2xl bg-[#07152f] px-4 py-3 text-[11px] text-slate-200">
          <p>You&apos;re currently on a trip. Finish or cancel before accepting new ride requests.</p>
          <button className="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Go to pickup
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- DESKTOP STATUS CARD ---------- */

function StatusCard({ fullName, status, onChange, className }: StatusCardProps) {
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
      <div className={`rounded-2xl bg-gradient-to-r ${colors} px-4 py-4 text-xs text-white`}>
        <div className="mb-2 text-[11px]">Welcome back</div>
        <div className="text-lg font-semibold">{fullName}</div>

        <div className="mt-4 inline-flex rounded-full bg-black/25 p-1 text-[11px]">
          {(["active", "occupied", "inactive"] as DriverStatusUI[]).map((st) => (
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

      {status === "inactive" && (
        <>
          <div className="rounded-xl bg-[#07152f] px-3 py-3 text-[11px] text-slate-200">
            You can not see ride requests because you&apos;re currently offline. Toggle to{" "}
            <span className="font-semibold">Active</span> to start receiving requests.
          </div>
          <button
            onClick={() => onChange("active")}
            className="mt-1 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go online
          </button>
        </>
      )}
    </div>
  );
}

/* ---------- NEXT SHIFT CARD ---------- */

function NextShiftCard({
  shift,
}: {
  shift: { workLocation: string | null; startAt: string; endAt: string } | null;
}) {
  if (!shift) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-3 text-xs text-slate-300">
        <div className="text-[11px] text-slate-400">Work location</div>
        <div className="text-sm font-medium text-slate-100">—</div>
        <div className="mt-2 text-[11px] text-slate-400">Date &amp; Time</div>
        <div className="text-sm">—</div>
      </div>
    );
  }

  const start = new Date(shift.startAt);
  const pretty = start.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-3 text-xs text-slate-300">
      <div className="text-[11px] text-slate-400">Work location</div>
      <div className="text-sm font-medium text-slate-100">{shift.workLocation || "—"}</div>
      <div className="mt-2 text-[11px] text-slate-400">Date &amp; Time</div>
      <div className="text-sm">{pretty}</div>
    </div>
  );
}

function clsx(...args: any[]) {
  return (args || []).filter(Boolean).join(" ");
}
