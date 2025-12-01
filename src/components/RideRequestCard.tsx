"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";

export type RideRequest = {
  id: string;
  riderName: string;
  price: string;
  time: string; // "7:30 AM - 8:00 AM"
  distance: string; // "2 miles away"
  tripType: string; // "Round trip"
  fromLabel: string;
  fromAddress: string;
  toLabel: string;
  toAddress: string;
};

export const demoRideRequests: RideRequest[] = [
  {
    id: "1",
    riderName: "Alisha Mark",
    price: "$21",
    time: "7:30 AM - 8:00 AM",
    distance: "2 miles away",
    tripType: "Round trip",
    fromLabel: "Home",
    fromAddress: "123 Main street, Springfield",
    toLabel: "Work",
    toAddress: "TechCorp office, 456 Business Ave",
  },
  {
    id: "2",
    riderName: "I.O",
    price: "$21",
    time: "7:30 AM - 8:00 AM",
    distance: "2 miles away",
    tripType: "Round trip",
    fromLabel: "Home",
    fromAddress: "123 Main street, Springfield",
    toLabel: "Work",
    toAddress: "TechCorp office, 456 Business Ave",
  },
  {
    id: "3",
    riderName: "Alisha Mark",
    price: "$21",
    time: "7:30 AM - 8:00 AM",
    distance: "2 miles away",
    tripType: "Round trip",
    fromLabel: "Home",
    fromAddress: "123 Main street, Springfield",
    toLabel: "Work",
    toAddress: "TechCorp office, 456 Business Ave",
  },
];

type Props = {
  request: RideRequest;
  compact?: boolean; // for home vs full page
};

export function RideRequestCard({ request, compact }: Props) {
  const router = useRouter();

  const goToDetails = () => {
    // later you can pass id as query if needed
    router.push("/driver/dashboard/rider-details");
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-200">
      {/* clickable header -> rider details */}
      <button
        type="button"
        onClick={goToDetails}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <div className="space-y-0.5">
          <div className="font-medium text-slate-50">{request.riderName}</div>
          <div className="text-[11px] text-slate-400">
            {request.time} · {request.tripType} · {request.distance}
          </div>
        </div>
        <div className="text-right text-sm font-semibold text-slate-50">
          {request.price}
        </div>
      </button>

      <div className="space-y-1.5">
        <LocationRow
          label={request.fromLabel}
          address={request.fromAddress}
          variant="from"
        />
        <LocationRow
          label={request.toLabel}
          address={request.toAddress}
          variant="to"
        />
      </div>

      <div
        className={clsx(
          "mt-1 flex gap-2",
          compact ? "flex-col sm:flex-row" : "flex-row"
        )}
      >
        <button className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-medium text-slate-200 hover:bg-slate-800">
          Ignore
        </button>
        <button
          type="button"
          onClick={goToDetails}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-medium text-white hover:bg-blue-700"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

function LocationRow({
  label,
  address,
  variant = "from",
}: {
  label: string;
  address: string;
  variant?: "from" | "to";
}) {
  const dotClasses =
    variant === "from"
      ? "border-blue-400 bg-blue-500"
      : "border-slate-500 bg-slate-500";

  return (
    <div className="flex items-start gap-2">
      <div
        className={clsx(
          "mt-0.5 h-3 w-3 rounded-full border",
          dotClasses
        )}
      />
      <div>
        <div className="text-[11px] font-medium text-slate-300">{label}</div>
        <div className="text-[11px] text-slate-400">{address}</div>
      </div>
    </div>
  );
}
