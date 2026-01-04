import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import FullNameForm from "./FullNameForm";

export default function RiderFullNamePage() {
  return (
    <RiderOnboardingStep
      step={3}
      totalSteps={6}
      title="What’s your full name"
      subtitle="Let’s help you personalize your details."
    >
      <FullNameForm />
    </RiderOnboardingStep>
  );
}
