"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { riderSetPaymentMethod, type RiderPaymentMethod } from "@/src/lib/riderClient";
import type { ApiFail } from "@/src/lib/api";

function friendlyError(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.error === "UNAUTHORIZED") return "Please login again.";
  if (err?.error === "VALIDATION_ERROR") return "Please select a payment method.";
  if (err?.error === "NETWORK_ERROR") return "Network error. Please try again.";
  return "Failed to continue. Please try again.";
}

export default function PaymentForm() {
  const router = useRouter();
  const auth = getAuth();

  const methods = useMemo(
    () =>
      [
        { label: "Apple Pay", value: "APPLE_PAY" },
        { label: "Paypal", value: "PAYPAL" },
        { label: "Gpay", value: "GPAY" },
        { label: "Cashapp", value: "CASHAPP" },
        { label: "Credit card", value: "CREDIT_CARD" },
      ] as { label: string; value: RiderPaymentMethod }[],
    []
  );

  const [selected, setSelected] = useState<RiderPaymentMethod>("APPLE_PAY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) router.replace("/rider/login");
  }, [auth?.accessToken, router]);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await riderSetPaymentMethod({ method: selected });
      router.push(res.nextPath || "/rider/onboarding/agreement");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2 text-xs">
        {methods.map((m) => {
          const active = selected === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setSelected(m.value)}
              className={[
                "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-[13px]",
                active ? "border-[#0B63F4] bg-[#e7f0ff]" : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <span>{m.label}</span>
              <span
                className={[
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  active ? "border-[#0B63F4] bg-[#0B63F4]" : "border-slate-300",
                ].join(" ")}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Button type="button" className="mt-3 w-full" onClick={onSubmit} disabled={loading}>
        {loading ? "Saving..." : "Next"}
      </Button>

      <div className="mt-3 flex justify-center">
        <Link
          href="/rider/onboarding/location"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <span className="text-sm">↩</span>
          <span>Back</span>
        </Link>
      </div>
    </div>
  );
}
