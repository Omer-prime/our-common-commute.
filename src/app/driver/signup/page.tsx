import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";

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

        <form className="flex flex-col gap-4">
          <TextInput label="Full Name" placeholder="Enter your name" required />
          <TextInput
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            required
          />
          <TextInput
            label="Password"
            type="password"
            placeholder="Create a password"
            required
          />
          <Button type="submit" className="mt-2">
            Continue
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
