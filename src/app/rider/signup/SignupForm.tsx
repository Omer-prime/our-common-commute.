"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, TextInput } from "@/src/components/ui";
import { signup } from "@/src/lib/authClient";
import type { ApiFail } from "@/src/lib/api";

function friendlyError(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.error === "EMAIL_ALREADY_USED") return "This email is already in use.";
  if (err?.error === "VALIDATION_ERROR") return "Please check your inputs and try again.";
  if (err?.error === "NETWORK_ERROR") return "Network error. Please try again.";
  return "Signup failed. Please try again.";
}

export default function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signup({
        fullName,
        email,
        password,
        role: "RIDER",
      });

      router.push(res.nextPath || "/rider/onboarding/basic-details");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextInput
        label="Full Name"
        placeholder="Enter your name"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <TextInput
        label="Email Address"
        type="email"
        placeholder="Enter your email address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextInput
        label="Password"
        type="password"
        placeholder="Create a password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="mt-2" disabled={loading}>
        {loading ? "Please wait..." : "Continue"}
      </Button>
    </form>
  );
}
