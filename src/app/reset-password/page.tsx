import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";

export default function ResetPasswordPage() {
  return (
    <AuthShell variant="pattern">
      <div className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Enter your email to receive a secure reset link.
          </p>
        </header>

        <form className="flex flex-col gap-4">
          <TextInput
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            required
          />
          <Button type="submit" className="mt-1">
            Continue
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Remember password?{" "}
          <Link href="/login" className="font-medium text-blue-600">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
