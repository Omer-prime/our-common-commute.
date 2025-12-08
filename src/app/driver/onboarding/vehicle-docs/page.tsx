import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";

function UploadRow({ label }: { label: string }) {
  return (
    <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100">
      <span>{label}</span>
      <input type="file" className="hidden" />
    </label>
  );
}

export default function VehicleDocsPage() {
  return (
    <DriverOnboardingStep
      step={4}
      totalSteps={9}
      title="Vehicle Documents"
      subtitle="A clear, valid license and docs are required to drive on this platform. Make sure all text and dates are visible."
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-500">
          Upload your driver&apos;s license and vehicle insurance
        </p>

        <UploadRow label="Upload driver's license" />
        <UploadRow label="Upload vehicle insurance" />
        <UploadRow label="Upload vehicle image" />

        <div className="mt-3 flex flex-col gap-3">
          <Link
            href="/driver/onboarding/vehicle-info"
            className="block w-full"
          >
            <Button type="button" className="w-full">Proceed</Button>
          </Link>

          <div className="flex justify-center">
            <Link
              href="/driver/onboarding/identity-selfie"
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
