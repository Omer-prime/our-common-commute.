import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";

export default function VehicleInfoPage() {
  return (
    <DriverOnboardingStep
      step={5}
      totalSteps={9}
      title="Vehicle Information"
      subtitle="Tell us your vehicle's make, model, year, and color."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="Vehicle's make"
          placeholder="e.g. Toyota"
          required
        />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Vehicle&apos;s color</span>
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option>Select color</option>
            <option>Black</option>
            <option>White</option>
            <option>Silver</option>
            <option>Blue</option>
            <option>Other</option>
          </select>
        </label>

        <TextInput label="Model" placeholder="e.g. Corolla" required />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Year of production</span>
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option>Select year</option>
            <option>2024</option>
            <option>2023</option>
            <option>2022</option>
            <option>2021</option>
            <option>2020</option>
          </select>
        </label>

        <TextInput
          label="License plate number"
          placeholder="Plate number"
          required
        />

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">
            How many seats are available?
          </span>
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option>Select seats</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
          </select>
        </label>

        <div className="mt-3 flex flex-col gap-3">
          <Link
            href="/driver/onboarding/work-schedule"
            className="block w-full"
          >
            <Button type="button">Proceed</Button>
          </Link>

          <div className="flex justify-center">
            <Link
              href="/driver/onboarding/vehicle-docs"
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
