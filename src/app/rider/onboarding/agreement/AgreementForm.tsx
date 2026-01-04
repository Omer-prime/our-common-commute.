"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { riderAcceptAgreement } from "@/src/lib/riderClient";
import type { ApiFail } from "@/src/lib/api";

function friendlyError(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.error === "UNAUTHORIZED") return "Please login again.";
  if (err?.error === "NETWORK_ERROR") return "Network error. Please try again.";
  return "Failed to complete onboarding. Please try again.";
}

export default function AgreementForm() {
  const router = useRouter();
  const auth = getAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) router.replace("/rider/login");
  }, [auth?.accessToken, router]);

  async function accept() {
    setError(null);
    setLoading(true);
    try {
      const res = await riderAcceptAgreement();
      router.push(res.nextPath || "/rider/dashboard");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 text-[11px] leading-relaxed text-slate-500">
      <p>
        By selecting <span className="font-semibold">“I agree”</span> below, I confirm
        that I have reviewed and agree to the{" "}
        <Link href="/terms" className="font-medium text-blue-600">
          Terms of Service
        </Link>
        ,{" "}
        <Link href="/privacy" className="font-medium text-blue-600">
          Privacy Policy
        </Link>
        , and User Conduct Guidelines governing the use of this platform, including the
        collection and processing of my data as described therein.
      </p>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Button type="button" className="w-full" onClick={accept} disabled={loading}>
        {loading ? "Finishing..." : "I agree"}
      </Button>

      <div className="mt-3 flex justify-center">
        <Link
          href="/rider/onboarding/payment-method"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <span className="text-sm">↩</span>
          <span>Back</span>
        </Link>
      </div>
    </div>
  );
}
