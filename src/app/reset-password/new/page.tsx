"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";
import { resetPassword } from "@/src/lib/authClient";

export default function CreateNewPasswordPage() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const resetToken = sessionStorage.getItem("occ_reset_token");
    if (!resetToken) return setError("Reset token missing. Please restart reset flow.");

    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);

      sessionStorage.removeItem("occ_reset_token");
      sessionStorage.removeItem("occ_reset_email");

      router.push("/auth");
    } catch (err: any) {
      setError(err?.error ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell variant="pattern">
      <div className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Create new Password</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set a strong, memorable password to keep your account secure.
          </p>
        </header>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <TextInput
            label="New password"
            type="password"
            placeholder="Enter your password"
            required
            value={newPassword}
            onChange={(e: any) => setNewPassword(e.target.value)}
          />

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <Button type="submit" className="mt-1" disabled={loading}>
            {loading ? "Saving..." : "Confirm"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
