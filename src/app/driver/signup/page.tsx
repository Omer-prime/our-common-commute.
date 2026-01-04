"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";
import { signup } from "@/src/lib/authClient";

export default function SignupPage() {
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
      const res = await signup({ fullName, email, password, role: "DRIVER" });
      router.push("/driver/onboarding/basic-details");
    } catch (err: any) {
      setError(err?.error ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Create an account</h1>
          <p className="text-xs text-slate-500">We&apos;ll use this to personalize your commute experience.</p>
        </header>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <TextInput
            label="Full Name"
            placeholder="Enter your name"
            required
            value={fullName}
            onChange={(e: any) => setFullName(e.target.value)}
          />
          <TextInput
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            required
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />
          <TextInput
            label="Password"
            type="password"
            placeholder="Create a password"
            required
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <Button type="submit" className="mt-2" disabled={loading}>
            {loading ? "Creating..." : "Continue"}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/driver/login" className="font-medium text-blue-600">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
