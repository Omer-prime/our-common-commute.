"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextInput } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { riderSetFullName } from "@/src/lib/riderClient";
import type { ApiFail } from "@/src/lib/api";

function friendlyError(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.error === "UNAUTHORIZED") return "Please login again.";
  if (err?.error === "VALIDATION_ERROR") return "Please enter a valid name.";
  if (err?.error === "NETWORK_ERROR") return "Network error. Please try again.";
  return "Failed to continue. Please try again.";
}

export default function FullNameForm() {
  const router = useRouter();
  const auth = getAuth();

  const [fullName, setFullName] = useState(auth?.user?.fullName ?? "");
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
      const res = await riderSetFullName({ fullName });
      router.push(res.nextPath || "/rider/onboarding/location");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextInput
        label="Full name"
        placeholder="Enter your full name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
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
          href="/rider/onboarding/otp-verification"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <span className="text-sm">↩</span>
          <span>Back</span>
        </Link>
      </div>
    </form>
  );
}
