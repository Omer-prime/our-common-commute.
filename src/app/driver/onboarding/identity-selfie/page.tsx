import Image from "next/image";
import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";

export default function IdentitySelfiePage() {
  return (
    <DriverOnboardingStep
      step={3}
      totalSteps={9}
      title="Identity & Security"
      subtitle="This is required for identity verification and safety."
    >
      <div className="flex flex-col items-center gap-5">
        <p className="text-xs text-slate-500">
          Take a selfie for verification
        </p>

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-md">
          <Image
            src="/Group.png"
            alt="Selfie preview"
            width={320}
            height={260}
          />
        </div>

        <div className="mt-2 w-full flex flex-col gap-3">
          <Link
            href="/driver/onboarding/vehicle-docs"
            className="block w-full"
          >
            <Button type="button" className="w-full">Proceed</Button>
          </Link>

          <div className="flex justify-center">
            <Link
              href="/driver/onboarding/identity-id"
              className="text-xs text-slate-500 hover:underline"
            >
              ⟵ Back
            </Link>
          </div>
        </div>
      </div>
    </DriverOnboardingStep>
  );
}
