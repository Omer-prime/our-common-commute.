import Link from "next/link";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";

export default function DriverBasicDetailsPage() {
  return (
    <DriverOnboardingStep
      step={1}
      totalSteps={9}
      title="Basic Details"
      subtitle="Personalize your account and ride details."
    >
      <div className="flex flex-col gap-4">
        <TextInput
          label="What's your full name?"
          placeholder="Full name"
          required
        />
        <TextInput
          label="What's your email address?"
          type="email"
          placeholder="Email address"
          required
        />
        <TextInput
          label="What's your mobile phone number?"
          type="tel"
          placeholder="Phone number"
          required
        />

        <Link
          href="/driver/onboarding/identity-id"
          className="mt-2 block w-full"
        >
          <Button type="button" className="w-full">Create an account</Button>
        </Link>

        <p className="mt-2 text-[11px] text-slate-400 text-center">
          By continuing, you agree to Our Common Commute{" "}
          <Link href="/terms" className="underline">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </DriverOnboardingStep>
  );
}
