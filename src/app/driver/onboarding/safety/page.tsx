import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";

export default function SafetyConsentPage() {
  return (
    <DriverOnboardingStep
      step={9}
      totalSteps={9}
      title="Safety, Policies & Consent"
      subtitle="You must accept our rules around safety, conduct, cancellations, and data usage before you can start accepting rides."
    >
      <div className="flex flex-col gap-4">
        <Link href="/driver/dashboard" className="block w-full">
          <Button type="button">Yes, I accept</Button>
        </Link>

        <Button type="button" variant="secondary">
          I don&apos;t accept
        </Button>

        <div className="flex justify-center">
          <Link
            href="/driver/onboarding/payout"
            className="text-xs text-slate-500 hover:underline"
          >
            ⟵ Back
          </Link>
        </div>
      </div>
    </DriverOnboardingStep>
  );
}
