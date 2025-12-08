import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";

export default function PayoutPage() {
  return (
    <DriverOnboardingStep
      step={8}
      totalSteps={9}
      title="Payout & Earnings"
      subtitle="Select your preferred payout method."
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Payout method</span>
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option>Bank account</option>
            <option>Mobile wallet</option>
          </select>
        </label>

        <TextInput label="Account number" placeholder="Account number" />
        <TextInput label="Account name" placeholder="Account holder name" />
        <TextInput label="Bank name" placeholder="Bank name" />
        <TextInput label="Swift code" placeholder="SWIFT / BIC" />

        <div className="mt-3 flex flex-col gap-3">
          <Link
            href="/driver/onboarding/safety"
            className="block w-full"
          >
            <Button type="button" className="w-full">Proceed</Button>
          </Link>

          <div className="flex justify-center">
            <Link
              href="/driver/onboarding/availability"
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
