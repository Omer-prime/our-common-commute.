"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/src/components/AuthShell";
import { Button } from "@/src/components/ui";
import { forgotPassword, verifyResetOtp } from "@/src/lib/authClient";

const OTP_LENGTH = 6;

export default function OtpVerificationPage() {
  const router = useRouter();
  const [values, setValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email =
    typeof window !== "undefined" ? sessionStorage.getItem("occ_reset_email") : null;

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!/^\d?$/.test(value)) return;

    const next = [...values];
    next[index] = value;
    setValues(next);

    if (value && e.target.nextElementSibling instanceof HTMLInputElement) {
      e.target.nextElementSibling.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index]) {
      if (e.currentTarget.previousElementSibling instanceof HTMLInputElement) {
        e.currentTarget.previousElementSibling.focus();
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email not found. Please restart reset flow.");
      return;
    }

    const otp = values.join("");
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtp(email, otp);
      sessionStorage.setItem("occ_reset_token", res.resetToken);
      router.push("/reset-password/new");
    } catch (err: any) {
      setError(err?.error ?? "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    if (!email) return setError("Email not found. Go back and enter your email again.");
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch (err: any) {
      setError(err?.error ?? "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="pattern">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">OTP Verification</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Enter the OTP code that was sent to your email address.
          </p>
        </header>

        <div className="flex justify-center gap-2">
          {values.map((val, idx) => (
            <input
              key={idx}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={val}
              onChange={(e) => handleChange(idx, e)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="h-12 w-12 rounded-lg border border-slate-200 text-center text-lg font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          ))}
        </div>

        {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}

        <Button type="submit" className="mt-2" disabled={loading}>
          {loading ? "Verifying..." : "Continue"}
        </Button>

        <p className="text-center text-xs text-slate-500">
          Didn&apos;t receive code?{" "}
          <button type="button" onClick={resend} className="font-medium text-blue-600 hover:underline">
            Resend code
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
