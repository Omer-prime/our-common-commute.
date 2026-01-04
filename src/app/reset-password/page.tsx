"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";
import { forgotPassword } from "@/src/lib/authClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await forgotPassword(email);
      sessionStorage.setItem("occ_reset_email", email);
      router.push("/reset-password/otp");
    } catch (err: any) {
      setError(err?.error ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell variant="pattern">
      <div className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Reset Password</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Enter your email to receive a secure reset code.
          </p>
        </header>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <TextInput
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            required
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <Button type="submit" className="mt-1" disabled={loading}>
            {loading ? "Sending..." : "Continue"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Remember password?{" "}
          <Link href="/auth" className="font-medium text-blue-600">
            Go back
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
