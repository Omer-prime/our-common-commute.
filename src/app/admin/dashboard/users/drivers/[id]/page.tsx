"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/src/components/AdminShell";
import { authedJson } from "@/src/lib/authClient";

type DriverDetailsRes = {
  ok: true;
  driver: {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    phone: string | null;
    driverStatus: string;
    avatarUrl: string | null;
    workSiteName: string | null;
    workAddress: string | null;
    homeAddress: string | null;
  };
  stats: {
    totalEarningsCents: number;
    totalRides: number;
    ridesCompleted: number;
    ridesCancelled: number;
  };
  vehicle: null | {
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    licensePlate: string | null;
    seats: number | null;
    imageUrl: string | null;
  };
  documents: Array<{
    id: string;
    type: string;
    url: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  rides: Array<{
    id: string;
    riderName: string;
    pickup: string | null;
    dropoff: string | null;
    status: string;
    createdAt: string;
  }>;
  revenueSeries: Array<{ day: string; valueCents: number }>;
};

function pickParam(p: unknown): string | null {
  if (!p) return null;
  if (Array.isArray(p)) return p[0] ? String(p[0]) : null;
  return String(p);
}

export default function AdminDriverDetailsPage() {
  const router = useRouter();
  const params = useParams();

  // ✅ supports [id], [driverId], [userId] without breaking
  const id = useMemo(() => {
    const anyParams = params as Record<string, unknown>;
    return (
      pickParam(anyParams?.id) ||
      pickParam(anyParams?.driverId) ||
      pickParam(anyParams?.userId) ||
      null
    );
  }, [params]);

  const [data, setData] = useState<DriverDetailsRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) {
      setError("Missing driver id in the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authedJson<DriverDetailsRes>(`/admin/users/drivers/${encodeURIComponent(id)}`, {
        method: "GET",
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load driver.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <AdminShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>

          <h1 className="text-[15px] font-semibold text-slate-900">
            Driver details {id ? <span className="text-slate-400">#{id.slice(0, 8)}</span> : null}
          </h1>

          <button
            onClick={load}
            className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-xs text-slate-500">
            Loading...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-xs text-red-700">
            {error}
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-xs text-slate-500">
            No data.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-xs text-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">{data.driver.fullName}</div>
                <div className="text-slate-500">{data.driver.email}</div>
                <div className="mt-2 text-slate-500">
                  Status: <span className="font-medium text-slate-700">{data.driver.driverStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] text-slate-500">Total rides</div>
                  <div className="text-sm font-semibold text-slate-900">{data.stats.totalRides}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] text-slate-500">Completed</div>
                  <div className="text-sm font-semibold text-slate-900">{data.stats.ridesCompleted}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] text-slate-500">Cancelled</div>
                  <div className="text-sm font-semibold text-slate-900">{data.stats.ridesCancelled}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] text-slate-500">Earnings</div>
                  <div className="text-sm font-semibold text-slate-900">
                    ${(data.stats.totalEarningsCents / 100).toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[12px] font-semibold text-slate-900">Recent rides</div>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-100">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Rider</th>
                      <th className="px-3 py-2 font-medium">Pickup</th>
                      <th className="px-3 py-2 font-medium">Dropoff</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.rides.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                          No rides found.
                        </td>
                      </tr>
                    ) : (
                      data.rides.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2">{r.riderName}</td>
                          <td className="px-3 py-2">{r.pickup ?? "-"}</td>
                          <td className="px-3 py-2">{r.dropoff ?? "-"}</td>
                          <td className="px-3 py-2">{r.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
