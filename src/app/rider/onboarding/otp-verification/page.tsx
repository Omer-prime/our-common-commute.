import Link from "next/link";
import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";

export default function RiderOtpVerificationPage() {
  return (
    <RiderOnboardingStep
      step={2}
      totalSteps={6}
      title="OTP Verification"
      subtitle="Enter the one-time code sent to your email address."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Verification code"
          placeholder="••••••"
          inputMode="numeric"
          required
        />

        <Link
          href="/rider/onboarding/full-name"
          className="mt-3 block w-full"
        >
          <Button type="button" className="w-full">
            Next
          </Button>
        </Link>

        <div className="mt-3 flex justify-center">
          <Link
            href="/rider/onboarding/basic-details"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <span className="text-sm">↩</span>
            <span>Back</span>
          </Link>
        </div>
      </div>
    </RiderOnboardingStep>
  );
}
