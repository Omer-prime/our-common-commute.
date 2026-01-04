import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import AgreementForm from "./AgreementForm";

export default function RiderAgreementPage() {
  return (
    <RiderOnboardingStep
      step={6}
      totalSteps={6}
      title="Agreement"
      subtitle="Please review and accept to complete your setup."
    >
      <AgreementForm />
    </RiderOnboardingStep>
  );
}
