"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { API_URL } from "@/src/lib/api";

const days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

export default function WorkSchedulePage() {
  const router = useRouter();
  const [primaryWorkLocation, setPrimaryWorkLocation] = useState("");
  const [workDays, setWorkDays] = useState<string[]>([]);
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function toggleDay(d: string) {
    setWorkDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function onProceed() {
    setErr("");
    const auth = getAuth();
    if (!auth?.accessToken) return setErr("You are not logged in.");

    if (!primaryWorkLocation || workDays.length === 0 || !shiftStart || !shiftEnd) {
      return setErr("Please fill all fields.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/driver/onboarding/work-schedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`
        },
        body: JSON.stringify({ primaryWorkLocation, workDays, shiftStart, shiftEnd })
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
      step={6}
      totalSteps={9}
      title="Work Location & Schedule"
      subtitle="This location will be locked and used to match you with riders going to the same place."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="What is your primary work location?"
          placeholder="Work location"
          required
          value={primaryWorkLocation}
          onChange={(e: any) => setPrimaryWorkLocation(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">What days do you usually work?</span>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => {
              const active = workDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`h-9 min-w-[2.5rem] rounded-md border text-xs ${
                    active ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <TextInput label="What time do you usually start your shift?" type="time" required value={shiftStart} onChange={(e: any) => setShiftStart(e.target.value)} />
        <TextInput label="What time do you usually finish your shift?" type="time" required value={shiftEnd} onChange={(e: any) => setShiftEnd(e.target.value)} />

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
