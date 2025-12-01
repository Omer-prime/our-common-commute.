import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";

export default function AvailabilityPage() {
  return (
    <DriverOnboardingStep
      step={7}
      totalSteps={9}
      title="Availability & Status Rules"
      subtitle="Choose whether you want to take riders only on the way to work, only on the way back, or both."
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            How far off your route are you willing to go?
          </span>
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option>10 miles</option>
            <option>5 miles</option>
            <option>15 miles</option>
            <option>20 miles</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            When are you willing to accept rides?
          </span>
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option>Take rider on the way to work only</option>
            <option>Take rider on the way back home only</option>
            <option>Both to work and back</option>
          </select>
        </label>

        <div className="mt-3 flex flex-col gap-3">
          <Link
            href="/driver/onboarding/payout"
            className="block w-full"
          >
            <Button type="button">Proceed</Button>
          </Link>

          <div className="flex justify-center">
            <Link
              href="/driver/onboarding/work-schedule"
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
