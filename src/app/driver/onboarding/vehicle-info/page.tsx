"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { API_URL } from "@/src/lib/api";

export default function VehicleInfoPage() {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [seats, setSeats] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onProceed() {
    setErr("");
    const auth = getAuth();
    if (!auth?.accessToken) return setErr("You are not logged in.");

    if (!make || !model || !color || !year || !licensePlate || !seats) {
      return setErr("Please fill all fields.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/driver/onboarding/vehicle-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`
        },
        body: JSON.stringify({
          make,
          model,
          color,
          year: Number(year),
          licensePlate,
          seats: Number(seats)
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
      step={5}
      totalSteps={9}
      title="Vehicle Information"
      subtitle="Tell us your vehicle's make, model, year, and color."
    >
      <div className="flex flex-col gap-4">
        <TextInput label="Vehicle's make" placeholder="e.g. Toyota" required value={make} onChange={(e: any) => setMake(e.target.value)} />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Vehicle&apos;s color</span>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select color</option>
            <option value="Black">Black</option>
            <option value="White">White</option>
            <option value="Silver">Silver</option>
            <option value="Blue">Blue</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <TextInput label="Model" placeholder="e.g. Corolla" required value={model} onChange={(e: any) => setModel(e.target.value)} />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Year of production</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select year</option>
            {Array.from({ length: 30 }, (_, i) => `${new Date().getFullYear() - i}`).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>

        <TextInput label="License plate number" placeholder="Plate number" required value={licensePlate} onChange={(e: any) => setLicensePlate(e.target.value)} />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">How many seats are available?</span>
          <select
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select seats</option>
            <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
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
