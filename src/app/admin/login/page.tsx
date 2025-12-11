"use client";

import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";

export default function AdminLoginPage() {
  return (
    <AuthShell>
      <div className="space-y-8">
        {/* Heading */}
        <header className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to access your admin dashboard.
          </p>
        </header>

        {/* Form */}
        <form className="space-y-4">
          <TextInput
            label="Email Address"
            type="email"
            placeholder="Enter your Email Address"
            required
          />
          <TextInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
          />

          {/* For now just navigate on click instead of real auth */}
          <Link href="/admin/dashboard" className="block w-full">
            <Button type="button" className="w-full">
              Sign in
            </Button>
          </Link>
        </form>

        {/* Footer links */}
        <div className="pt-2 text-center text-xs text-slate-500">
          <Link href="/admin/reset-password" className="hover:underline">
            Forgot password
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
