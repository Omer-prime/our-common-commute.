"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { API_URL } from "@/src/lib/api";

export default function SafetyConsentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function accept() {
    setErr("");
    const auth = getAuth();
    if (!auth?.accessToken) return setErr("You are not logged in.");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/driver/onboarding/safety`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`
        },
        body: JSON.stringify({ accepted: true })
      });

      const data = await res.json();
      if (!res.ok) throw data;

      router.push(data.nextPath);
    } catch (e: any) {
      setErr(e?.message || e?.error || "Failed to submit consent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverOnboardingStep
      step={9}
      totalSteps={9}
      title="Safety, Policies & Consent"
      subtitle="You must accept our rules around safety, conduct, cancellations, and data usage before you can start accepting rides."
    >
      <div className="flex flex-col gap-4">
        {err ? <p className="text-xs text-red-600">{err}</p> : null}

        <Button type="button" className="w-full" disabled={loading} onClick={accept}>
          {loading ? "Submitting..." : "Yes, I accept"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setErr("You must accept to continue onboarding.")}
        >
          I don&apos;t accept
        </Button>
      </div>
    </DriverOnboardingStep>
  );
}
