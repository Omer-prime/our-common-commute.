"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextInput } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { riderBasicDetails } from "@/src/lib/riderClient";
import type { ApiFail } from "@/src/lib/api";

const OTP_ID_KEY = "occ_rider_onboarding_otpId";
const PHONE_KEY = "occ_rider_onboarding_phone";

function friendlyError(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.error === "UNAUTHORIZED") return "Please login again.";
  if (err?.error === "VALIDATION_ERROR") return "Please enter a valid phone number.";
  if (err?.error === "NETWORK_ERROR") return "Network error. Please try again.";
  return "Failed to continue. Please try again.";
}

export default function BasicDetailsForm() {
  const router = useRouter();
  const auth = getAuth();

  const [email, setEmail] = useState(auth?.user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) router.replace("/rider/login");
    setEmail(auth?.user?.email ?? "");
    const prevPhone = typeof window !== "undefined" ? localStorage.getItem(PHONE_KEY) : null;
    if (prevPhone) setPhone(prevPhone);
  }, [auth?.accessToken, auth?.user?.email, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await riderBasicDetails({ phone });
      localStorage.setItem(OTP_ID_KEY, res.otpId);
      localStorage.setItem(PHONE_KEY, phone);
      setDevOtp(res.devOtp);

      router.push(res.nextPath || "/rider/onboarding/otp-verification");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextInput
        label="Email address"
        type="email"
        placeholder="Email address"
        required
        value={email}
        disabled
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextInput
        label="Phone number"
        type="tel"
        placeholder="Phone number"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {devOtp && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          Dev OTP: <span className="font-semibold">{devOtp}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="mt-3 w-full" disabled={loading}>
        {loading ? "Please wait..." : "Next"}
      </Button>

      <div className="mt-3 flex justify-center">
        <Link
          href="/rider/login"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <span className="text-sm">↩</span>
          <span>Back</span>
        </Link>
      </div>
    </form>
  );
}
