import Link from "next/link";
import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";

export default function RiderLocationPage() {
  return (
    <RiderOnboardingStep
      step={4}
      totalSteps={6}
      title="Current location"
      subtitle="Let’s help you personalize your details."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Where is your current location?"
          placeholder="City, country"
          required
        />

        <Link
          href="/rider/onboarding/payment-method"
          className="mt-3 block w-full"
        >
          <Button type="button" className="w-full">
            Next
          </Button>
        </Link>

        <div className="mt-3 flex justify-center">
          <Link
            href="/rider/onboarding/full-name"
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
