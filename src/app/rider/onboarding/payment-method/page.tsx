import { RiderOnboardingStep } from "@/src/components/RiderOnboardingStep";
import PaymentForm from "./PaymentForm";

export default function RiderPaymentMethodPage() {
  return (
    <RiderOnboardingStep
      step={5}
      totalSteps={6}
      title="Payment method"
      subtitle="Customize comfort and pricing based on your preference."
    >
      <PaymentForm />
    </RiderOnboardingStep>
  );
}
