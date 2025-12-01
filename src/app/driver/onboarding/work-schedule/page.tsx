import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";

const days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

export default function WorkSchedulePage() {
  return (
    <DriverOnboardingStep
      step={6}
      totalSteps={9}
      title="Work Location & Schedule"
      subtitle="This location will be locked and used to match you with riders going to the same place."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="What is your primary work location?"
          placeholder="Work location"
          required
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            What days do you usually work?
          </span>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => (
              <button
                key={day}
                type="button"
                className={`h-9 min-w-[2.5rem] rounded-md border text-xs ${
                  day === "Mon"
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <TextInput
          label="What time do you usually start your shift?"
          type="time"
          required
        />
        <TextInput
          label="What time do you usually finish your shift?"
          type="time"
          required
        />

        <div className="mt-3 flex flex-col gap-3">
          <Link
            href="/driver/onboarding/availability"
            className="block w-full"
          >
            <Button type="button">Proceed</Button>
          </Link>

          <div className="flex justify-center">
            <Link
              href="/driver/onboarding/vehicle-info"
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
