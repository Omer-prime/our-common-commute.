"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { API_URL } from "@/src/lib/api";

type RideDirection = "TO_WORK_ONLY" | "FROM_WORK_ONLY" | "BOTH";

export default function AvailabilityPage() {
  const router = useRouter();
  const [detourMiles, setDetourMiles] = useState("10");
  const [rideDirection, setRideDirection] = useState<RideDirection>("TO_WORK_ONLY");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onProceed() {
    setErr("");
    const auth = getAuth();
    if (!auth?.accessToken) return setErr("You are not logged in.");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/driver/onboarding/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`
        },
        body: JSON.stringify({
          detourMiles: Number(detourMiles),
          rideDirection
        })
      });

      const data = await res.json();
      if (!res.ok) throw data;

      router.push(data.nextPath);
    } catch (e: any) {
      setErr(e?.message || e?.error || "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverOnboardingStep
      step={7}
      totalSteps={9}
      title="Availability & Status Rules"
      subtitle="Choose whether you want to take riders only on the way to work, only on the way back, or both."
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">How far off your route are you willing to go?</span>
          <select
            value={detourMiles}
            onChange={(e) => setDetourMiles(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="10">10 miles</option>
            <option value="5">5 miles</option>
            <option value="15">15 miles</option>
            <option value="20">20 miles</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">When are you willing to accept rides?</span>
          <select
            value={rideDirection}
            onChange={(e) => setRideDirection(e.target.value as RideDirection)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="TO_WORK_ONLY">Take rider on the way to work only</option>
            <option value="FROM_WORK_ONLY">Take rider on the way back home only</option>
            <option value="BOTH">Both to work and back</option>
          </select>
        </label>

        {err ? <p className="text-xs text-red-600">{err}</p> : null}

        <div className="mt-3 flex flex-col gap-3">
          <Button type="button" className="w-full" disabled={loading} onClick={onProceed}>
            {loading ? "Saving..." : "Proceed"}
          </Button>
        </div>
      </div>
    </DriverOnboardingStep>
  );
}
