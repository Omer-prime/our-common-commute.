"use client";

import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { TextInput, Button } from "@/src/components/ui";

export default function AdminResetPasswordPage() {
  return (
    <AuthShell>
      <div className="space-y-8">
        {/* Heading */}
        <header className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500">
            Choose a new password for your admin account.
          </p>
        </header>

        {/* Form */}
        <form className="space-y-4">
          <TextInput
            label="New password"
            type="password"
            placeholder="Enter your password"
            required
          />
          <TextInput
            label="Confirm password"
            type="password"
            placeholder="Enter your password"
            required
          />

          {/* Buttons row */}
          <div className="mt-2 flex gap-3">
            {/* Back button (grey) */}
            <Link href="/admin/login" className="flex-1">
              <button
                type="button"
                className="w-full rounded-md bg-slate-300 px-3 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-400"
              >
                Back
              </button>
            </Link>

            {/* Sign in (blue) */}
            <div className="flex-1">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
