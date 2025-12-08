import type { ReactNode } from "react";
import Image from "next/image";

type RiderOnboardingStepProps = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function RiderOnboardingStep({
  step,
  totalSteps,
  title,
  subtitle,
  children,
}: RiderOnboardingStepProps) {
  const progress = Math.min(100, Math.round((step / totalSteps) * 100));

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0B63F4]">
      {/* blue blobs background */}
      <Image
        src="/Vector.png"
        alt=""
        width={520}
        height={520}
        priority
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 bottom-0 select-none opacity-80"
      />
      <Image
        src="/Vector.png"
        alt=""
        width={520}
        height={520}
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-0 select-none opacity-70 rotate-180"
      />

      {/* white card */}
      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-[28px] bg-white px-8 pb-10 pt-8 shadow-[0_30px_80px_rgba(15,23,42,0.60)] sm:px-10">
        <div className="flex flex-col items-center gap-4">
          {/* logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white">
            <Image
              src="/occlogo.jpg"
              alt="Our Common Commute"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
          </div>

          {/* progress bar */}
          <div className="mt-1 h-1.5 w-44 rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-[#0B63F4] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* title / subtitle */}
          <div className="mt-2 text-center">
            <h1 className="text-lg font-semibold text-slate-900 sm:text-[19px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500 sm:text-[13px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* step content */}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
