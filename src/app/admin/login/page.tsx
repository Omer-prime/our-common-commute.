"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";
import { login } from "@/src/lib/authClient";
import { me } from "@/src/lib/authClient";
import router from "next/dist/shared/lib/router/router";


export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
  (async () => {
    try {
      const res = await me();
      if (res?.user?.role === "ADMIN") router.replace("/admin/dashboard");
    } catch {}
  })();
}, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password, role: "ADMIN" });
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err?.error ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">Welcome Back</h1>
          <p className="text-xs text-slate-500">Sign in to access your admin dashboard.</p>
        </header>

        <form className="space-y-4" onSubmit={onSubmit}>
          <TextInput
            label="Email Address"
            type="email"
            placeholder="Enter your Email Address"
            required
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
          />
          <TextInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          <Link href="/admin/reset-password" className="hover:underline">
            Forgot password
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
