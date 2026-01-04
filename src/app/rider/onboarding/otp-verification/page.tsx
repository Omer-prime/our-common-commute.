import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import OtpForm from "./OtpForm";

export default function RiderOtpVerificationPage() {
  return (
    <RiderOnboardingStep
      step={2}
      totalSteps={6}
      title="OTP Verification"
      subtitle="Enter the one-time code sent to your email address."
    >
      <OtpForm />
    </RiderOnboardingStep>
  );
}
