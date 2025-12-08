import Link from "next/link";
import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import { Button } from "@/src/components/ui";

const paymentMethods = [
  "Apple Pay",
  "Paypal",
  "Gpay",
  "Cashapp",
  "Credit card",
];

export default function RiderPaymentMethodPage() {
  return (
    <RiderOnboardingStep
      step={5}
      totalSteps={6}
      title="Payment method"
      subtitle="Customize comfort and pricing based on your preference."
    >
      <div className="flex flex-col gap-3">
        <div className="space-y-2 text-xs">
          {paymentMethods.map((label, idx) => {
            const active = idx === 0;
            return (
              <div
                key={label}
                className={[
                  "flex items-center justify-between rounded-md border px-3 py-2.5 text-[13px]",
                  active
                    ? "border-[#0B63F4] bg-[#e7f0ff]"
                    : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <span>{label}</span>
                {/* fake radio circle */}
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    active
                      ? "border-[#0B63F4] bg-[#0B63F4]"
                      : "border-slate-300",
                  ].join(" ")}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </div>
            );
          })}
        </div>

        <Link href="/rider/onboarding/agreement" className="mt-3 block w-full">
          <Button type="button" className="w-full">
            Next
          </Button>
        </Link>

        <div className="mt-3 flex justify-center">
          <Link
            href="/rider/onboarding/location"
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
