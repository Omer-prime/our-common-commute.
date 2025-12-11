// src/app/admin/users/riders/[id]/page.tsx
import { AdminShell } from "@/src/components/AdminShell";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronDown } from "lucide-react";

type RiderDetailsPageProps = {
  params: { id: string };
};

export default function RiderDetailsPage({ params }: RiderDetailsPageProps) {
  const riderId = params.id;
  const displayId = `#${riderId}`;

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* Header with close button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h1 className="text-[15px] font-semibold text-slate-900">
            Riders Details
          </h1>
          <Link
            href="/admin/dashboard/users"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </Link>
        </div>

        {/* Top profile section */}
        <section className="flex flex-col items-center gap-4">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <Image
              src="/driver-selfie.jpg" // you can swap with your new portrait asset
              alt="Rider avatar"
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-center">
            <h2 className="text-[17px] font-semibold text-slate-900">
              Amit Sharma
            </h2>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-500">
              <span>ID: CLT-001</span>
              <span className="h-3 w-px bg-slate-200" />
              <span>Date joined: 23-09-2025</span>
              <span className="h-3 w-px bg-slate-200" />
              <span className="rounded-full bg-emerald-50 px-2 py-[1px] text-[10px] font-medium text-emerald-700">
                Active
              </span>
            </div>
          </div>
        </section>

        {/* Stat cards */}
        <section className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          <StatMiniCard label="Total Expenses" value="$400k" />
          <StatMiniCard label="Total rides" value="108" />
          <StatMiniCard label="Rides completed" value="100" />
          <StatMiniCard label="Rides cancelled" value="8" />
        </section>

        {/* Personal info + history */}
        <section className="space-y-6 rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          {/* Personal Information */}
          <div>
            <h3 className="mb-3 text-[13px] font-semibold text-slate-900">
              Personal Information
            </h3>
            <div className="grid gap-y-1 text-[11px] text-slate-700 md:grid-cols-[140px_minmax(0,1fr)]">
              <span className="font-medium text-slate-500">Phone Number</span>
              <span>+1 436 857 5444</span>

              <span className="font-medium text-slate-500">Date Joined</span>
              <span>24 May, 2025</span>

              <span className="font-medium text-slate-500">Last Login</span>
              <span>3:00 PM, 11 Nov, 2025</span>

              <span className="font-medium text-slate-500">Home Address</span>
              <span>
                2972 Westheimer Rd, Santa Ana, Illinois 85486
              </span>

              <span className="font-medium text-slate-500">Work Address</span>
              <span>
                2464 Royal Ln, Mesa, New Jersey 45463
              </span>
            </div>
          </div>

          {/* Ride history */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-slate-900">
              Ride history
            </h3>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-2 font-medium">Ride ID</th>
                    <th className="px-4 py-2 font-medium">Driver name</th>
                    <th className="px-4 py-2 font-medium">Pickup</th>
                    <th className="px-4 py-2 font-medium">Dropoff</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Date & time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rideHistory.map((ride) => (
                    <tr key={ride.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-2">{ride.id}</td>
                      <td className="px-4 py-2">{ride.driver}</td>
                      <td className="px-4 py-2">{ride.pickup}</td>
                      <td className="px-4 py-2">{ride.dropoff}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[3px] text-[10px] font-medium text-emerald-700">
                          Completed
                        </span>
                      </td>
                      <td className="px-4 py-2">{ride.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fare overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-slate-900">
                Fare Overview
              </h3>
              <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                September
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <FareOverviewChart />
          </div>
        </section>

        {/* Action buttons */}
        <div className="mt-1 flex flex-wrap gap-3">
          <button className="flex-1 min-w-[140px] rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-[12px] font-medium text-slate-700">
            Reset password
          </button>
          <button className="flex-1 min-w-[160px] rounded-md bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-700">
            Suspend account
          </button>
          <button className="flex-1 min-w-[160px] rounded-md bg-red-500 px-4 py-2 text-[12px] font-medium text-white hover:bg-red-600">
            Delete account
          </button>
        </div>

        {/* Just to show we got the ID from URL */}
        <p className="mt-2 text-[10px] text-slate-400">
          Viewing details for user ID <span className="font-semibold">{displayId}</span>
        </p>
      </div>
    </AdminShell>
  );
}

/* ---------- Small components & mock data ---------- */

function StatMiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        $
      </div>
      <div>
        <div className="text-[13px] font-semibold text-slate-900">{value}</div>
        <div className="text-[10px] text-slate-500">{label}</div>
      </div>
    </div>
  );
}

type RideRow = {
  id: string;
  driver: string;
  pickup: string;
  dropoff: string;
  date: string;
};

const rideHistory: RideRow[] = [
  {
    id: "#74658335",
    driver: "Amos Hulley",
    pickup: "6391 Elgin St, Celina, Delaware",
    dropoff: "2464 Royal Ln, Mesa, New Jersey",
    date: "20-10-2025",
  },
  {
    id: "#74658336",
    driver: "Amos Hulley",
    pickup: "6391 Elgin St, Celina, Delaware",
    dropoff: "2464 Royal Ln, Mesa, New Jersey",
    date: "20-10-2025",
  },
  {
    id: "#74658337",
    driver: "Amos Hulley",
    pickup: "6391 Elgin St, Celina, Delaware",
    dropoff: "2464 Royal Ln, Mesa, New Jersey",
    date: "20-10-2025",
  },
];

type FareBar = { day: string; value: number };

const fareBars: FareBar[] = [
  { day: "10", value: 40 },
  { day: "11", value: 18 },
  { day: "12", value: 32 },
  { day: "13", value: 22 },
  { day: "14", value: 45 },
  { day: "15", value: 12 },
  { day: "16", value: 38 },
  { day: "17", value: 28 },
  { day: "18", value: 42 },
  { day: "19", value: 16 },
  { day: "20", value: 36 },
  { day: "21", value: 20 },
  { day: "22", value: 44 },
];

function FareOverviewChart() {
  const maxValue = 50; // like 50k on figma

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex h-40 items-end gap-3">
        {fareBars.map((bar) => {
          const height = (bar.value / maxValue) * 100;
          return (
            <div key={bar.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-4 items-end justify-center">
                <div
                  className="w-full rounded-t-full bg-emerald-500"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500">{bar.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
