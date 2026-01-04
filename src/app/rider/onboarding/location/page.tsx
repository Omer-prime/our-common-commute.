import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import LocationForm from "./LocationForm";

export default function RiderLocationPage() {
  return (
    <RiderOnboardingStep
      step={4}
      totalSteps={6}
      title="Current location"
      subtitle="Let’s help you personalize your details."
    >
      <LocationForm />
    </RiderOnboardingStep>
  );
}
