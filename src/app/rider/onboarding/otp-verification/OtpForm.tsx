"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextInput } from "@/src/components/ui";
import { riderVerifyOtp, riderBasicDetails } from "@/src/lib/riderClient";
import type { ApiFail } from "@/src/lib/api";
import { getAuth } from "@/src/lib/authStorage";

const OTP_ID_KEY = "occ_rider_onboarding_otpId";
const PHONE_KEY = "occ_rider_onboarding_phone";

function friendlyError(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.error === "INVALID_OTP") return "Invalid OTP. Please try again.";
  if (err?.error === "OTP_EXPIRED") return "OTP expired. Please request a new OTP.";
  if (err?.error === "UNAUTHORIZED") return "Please login again.";
  if (err?.error === "NETWORK_ERROR") return "Network error. Please try again.";
  return "Verification failed. Please try again.";
}

export default function OtpForm() {
  const router = useRouter();
  const auth = getAuth();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth?.accessToken) router.replace("/rider/login");
  }, [auth?.accessToken, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const otpId = localStorage.getItem(OTP_ID_KEY);
      if (!otpId) {
        setError("OTP session not found. Please go back and request OTP again.");
        return;
      }

      const res = await riderVerifyOtp({ otpId, otp });
      router.push(res.nextPath || "/rider/onboarding/full-name");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setResending(true);
    try {
      const phone = localStorage.getItem(PHONE_KEY);
      if (!phone) {
        setError("Phone not found. Please go back and enter your phone again.");
        return;
      }
      const res = await riderBasicDetails({ phone });
      localStorage.setItem(OTP_ID_KEY, res.otpId);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextInput
        label="Verification code"
        placeholder="••••••"
        inputMode="numeric"
        required
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="mt-3 w-full" disabled={loading}>
        {loading ? "Verifying..." : "Next"}
      </Button>

      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="text-xs text-blue-600 hover:underline disabled:opacity-60"
      >
        {resending ? "Resending..." : "Resend OTP"}
      </button>

      <div className="mt-3 flex justify-center">
        <Link
          href="/rider/onboarding/basic-details"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <span className="text-sm">↩</span>
          <span>Back</span>
        </Link>
      </div>
    </form>
  );
}
