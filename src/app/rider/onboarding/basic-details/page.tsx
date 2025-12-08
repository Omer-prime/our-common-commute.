import Link from "next/link";
import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";

export default function RiderBasicDetailsPage() {
  return (
    <RiderOnboardingStep
      step={1}
      totalSteps={6}
      title="Basic details"
      subtitle="To personalize your account and ride details."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Email address"
          type="email"
          placeholder="Email address"
          required
        />
        <TextInput
          label="Phone number"
          type="tel"
          placeholder="Phone number"
          required
        />

        <Link
          href="/rider/onboarding/otp-verification"
          className="mt-3 block w-full"
        >
          <Button type="button" className="w-full">
            Next
          </Button>
        </Link>

        <div className="mt-3 flex justify-center">
          <Link
            href="/rider/login"
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
