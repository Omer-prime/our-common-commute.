"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, TextInput } from "@/src/components/ui";
import { login } from "@/src/lib/authClient";
import type { ApiFail } from "@/src/lib/api";

function friendlyError(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.error === "INVALID_CREDENTIALS") return "Invalid email or password.";
  if (err?.error === "ROLE_MISMATCH") return "This account is not a rider account.";
  if (err?.error === "NETWORK_ERROR") return "Network error. Please try again.";
  return "Login failed. Please try again.";
}

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password, role: "RIDER" });
      router.push(res.nextPath || "/rider/dashboard");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-4">
      <TextInput
        label="Enter your email address"
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextInput
        label="Password"
        type="password"
        placeholder="Password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait..." : "Continue"}
      </Button>
    </form>
  );
}
