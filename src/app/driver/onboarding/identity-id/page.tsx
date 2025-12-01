import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";

export default function IdentityIdPage() {
  return (
    <DriverOnboardingStep
      step={2}
      totalSteps={9}
      title="Identity & Security"
      subtitle="This is required for identity verification and safety."
    >
      <div className="flex flex-col gap-5">
        <p className="text-xs text-slate-500 text-center">
          Upload your government-issued ID
        </p>

        <div className="flex justify-center">
          <label className="flex h-12 w-full max-w-sm cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100">
            <span>Upload ID</span>
            <input type="file" className="hidden" />
          </label>
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <Link
            href="/driver/onboarding/identity-selfie"
            className="block w-full"
          >
            <Button type="button">Proceed</Button>
          </Link>

          <div className="flex justify-center">
            <Link
              href="/driver/onboarding/basic-details"
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
