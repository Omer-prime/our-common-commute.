import Image from "next/image";
import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";

export default function CheckEmailPage() {
  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center gap-6">
        {/* Illustration + heading */}
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="relative h-24 w-24">
            {/* subtle glow behind icon */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.35),transparent_65%)] blur-md"
            />
            <Image
              src="/illustration-message.png"
              alt="Check your email"
              fill
              className="relative object-contain"
              priority
            />
          </div>

          <div>
            <h1 className="text-[22px] font-semibold text-slate-900 sm:text-2xl">
              Check your email
            </h1>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              An OTP code has been sent to your email address to change your
              password.
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="mt-2 flex w-full max-w-sm flex-col gap-3 text-left">
          <TextInput
            label="Password"
            type="password"
            placeholder="Password"
            required
          />
          <TextInput
            label="Confirm password"
            type="password"
            placeholder="Confirm password"
            required
          />

          <Button type="submit" className="mt-2 w-full">
            Confirm
          </Button>
        </form>

        {/* Resend link */}
        <p className="mt-2 text-xs text-slate-500">
          Didn&apos;t receive any code?{" "}
          <button
            type="button"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Resend
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
