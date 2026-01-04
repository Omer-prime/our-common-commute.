"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextInput } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { riderSetLocation } from "@/src/lib/riderClient";
import type { ApiFail } from "@/src/lib/api";

function friendlyError(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.error === "UNAUTHORIZED") return "Please login again.";
  if (err?.error === "VALIDATION_ERROR") return "Please enter a valid location.";
  if (err?.error === "NETWORK_ERROR") return "Network error. Please try again.";
  return "Failed to continue. Please try again.";
}

export default function LocationForm() {
  const router = useRouter();
  const auth = getAuth();

  const [locationText, setLocationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) router.replace("/rider/login");
  }, [auth?.accessToken, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await riderSetLocation({ locationText });
      router.push(res.nextPath || "/rider/onboarding/payment-method");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextInput
        label="Where is your current location?"
        placeholder="City, country"
        required
        value={locationText}
        onChange={(e) => setLocationText(e.target.value)}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="mt-3 w-full" disabled={loading}>
        {loading ? "Saving..." : "Next"}
      </Button>

      <div className="mt-3 flex justify-center">
        <Link
          href="/rider/onboarding/full-name"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <span className="text-sm">↩</span>
          <span>Back</span>
        </Link>
      </div>
    </form>
  );
}
