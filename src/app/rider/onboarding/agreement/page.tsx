import Link from "next/link";
import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import { Button } from "@/src/components/ui";

export default function RiderAgreementPage() {
  return (
    <RiderOnboardingStep
      step={6}
      totalSteps={6}
      title="Agreement"
      subtitle={undefined}
    >
      <div className="space-y-5 text-[11px] leading-relaxed text-slate-500">
        <p>
          By selecting <span className="font-semibold">“I agree”</span> below,
          I confirm that I have reviewed and agree to the{" "}
          <Link href="/terms" className="font-medium text-blue-600">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/privacy" className="font-medium text-blue-600">
            Privacy Policy
          </Link>
          , and User Conduct Guidelines governing the use of this platform,
          including the collection and processing of my data as described
          therein.
        </p>

        <Link href="/rider/dashboard" className="block w-full">
          <Button type="button" className="w-full">
            I agree
          </Button>
        </Link>

        <div className="mt-3 flex justify-center">
          <Link
            href="/rider/onboarding/payment-method"
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
