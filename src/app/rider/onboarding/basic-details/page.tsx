import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import BasicDetailsForm from "./BasicDetailsForm";

export default function RiderBasicDetailsPage() {
  return (
    <RiderOnboardingStep
      step={1}
      totalSteps={6}
      title="Basic details"
      subtitle="To personalize your account and ride details."
    >
      <BasicDetailsForm />
    </RiderOnboardingStep>
  );
}
