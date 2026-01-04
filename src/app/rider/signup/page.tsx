import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Create an account
          </h1>
          <p className="text-xs text-slate-500">
            We&apos;ll use this to personalize your commute experience.
          </p>
        </header>

        <SignupForm />

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/rider/login" className="font-medium text-blue-600">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
