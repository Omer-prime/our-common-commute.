import Link from "next/link";
import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";

export default function RiderFullNamePage() {
  return (
    <RiderOnboardingStep
      step={3}
      totalSteps={6}
      title="What’s your full name"
      subtitle="Let’s help you personalize your details."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Full name"
          placeholder="Enter your full name"
          required
        />

        <Link href="/rider/onboarding/location" className="mt-3 block w-full">
          <Button type="button" className="w-full">
            Next
          </Button>
        </Link>

        <div className="mt-3 flex justify-center">
          <Link
            href="/rider/onboarding/otp-verification"
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
