import Image from "next/image";
import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { Button } from "@/src/components/ui";

export default function HomePage() {
  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        {/* PHONE HERO */}
        <div className="flex w-full max-w-md flex-col items-center pt-8">
          <div className="relative flex h-40 w-full items-end justify-center">
            {/* soft glow behind phone */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 h-32 w-32 rounded-full bg-slate-100/90 blur-3xl"
            />
            <Image
              // use your new half-phone asset here (keep the file named phone.png)
              src="/phone2.png"
              alt="Our Common Commute app preview"
              width={260}
              height={260}
              className="relative h-[150px] w-auto drop-shadow-[0_18px_40px_rgba(15,23,42,0.45)]"
              priority
            />
          </div>

          {/* HEADING + SUBTITLE */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <h1 className="text-[22px] font-semibold text-slate-900 sm:text-2xl">
              Earn Rewards Every Mile
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-slate-500">
              Collect loyalty points, referral bonuses, and unlock ride
              discounts every time you share your commute.
            </p>
          </div>

          {/* PRIMARY ACTIONS */}
          <div className="mt-5 flex w-full max-w-md flex-col gap-3">
            <Link href="/signup" className="w-full">
              <Button className="w-full py-2.5 text-sm">
                Create an account
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="secondary" className="w-full py-2.5 text-sm">
                Login
              </Button>
            </Link>
          </div>
        </div>

        {/* TERMS TEXT */}
        <p className="mt-3 max-w-md text-[11px] leading-relaxed text-slate-400">
          By continuing, you agree to Our Common Commute{" "}
          <Link
            href="/terms"
            className="text-blue-600 underline hover:text-blue-700"
          >
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-blue-600 underline hover:text-blue-700"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
