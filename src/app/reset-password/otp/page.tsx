"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { Button } from "@/src/components/ui";

const OTP_LENGTH = 6;

export default function OtpVerificationPage() {
  const [values, setValues] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    // allow only one digit
    if (!/^\d?$/.test(value)) return;

    const next = [...values];
    next[index] = value;
    setValues(next);

    // move focus to next input if filled
    if (value && e.target.nextElementSibling instanceof HTMLInputElement) {
      e.target.nextElementSibling.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index]) {
      // go back if current empty
      if (e.currentTarget.previousElementSibling instanceof HTMLInputElement) {
        e.currentTarget.previousElementSibling.focus();
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = values.join("");
    // later: send code to backend
    console.log("OTP:", code);
  };

  return (
    <AuthShell variant="pattern">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            OTP Verification
          </h1>
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

        <Button type="submit" className="mt-2">
          Continue
        </Button>

        <p className="text-center text-xs text-slate-500">
          Didn&apos;t receive code?{" "}
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline"
          >
            Resend code
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
