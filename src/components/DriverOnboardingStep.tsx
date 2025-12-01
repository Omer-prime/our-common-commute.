import { ReactNode } from "react";
import { AuthShell } from "@/src/components/AuthShell";

type Props = {
  title: string;
  subtitle: string;
  step: number;
  totalSteps: number;
  children: ReactNode;
};

export function DriverOnboardingStep({
  title,
  subtitle,
  step,
  totalSteps,
  children,
}: Props) {
  const progress = Math.max(0, Math.min(100, (step / totalSteps) * 100));

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        {/* Progress bar */}
        <div className="mt-1">
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {subtitle}
            </p>
          )}
        </header>

        {children}
      </div>
    </AuthShell>
  );
}
