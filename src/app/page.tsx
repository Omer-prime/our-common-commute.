import Image from "next/image";
import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { Button } from "@/src/components/ui";

export default function HomePage() {
  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Phone mockup */}
        <Image
          src="/phone.png"
          alt="Our Common Commute app preview"
          width={240}
          height={480}
          className="drop-shadow-xl"
          priority
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            Earn Rewards Every Mile
          </h1>
          <p className="text-sm text-slate-500 max-w-md">
            Collect loyalty points, referral bonuses, and unlock ride discounts
            every time you share your commute.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-2">
          <Link href="/signup" className="w-full">
            <Button>Create an account</Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="secondary">Login</Button>
          </Link>
        </div>

        <p className="mt-3 max-w-md text-[11px] leading-relaxed text-slate-400">
          By continuing, you agree to Our Common Commute{" "}
          <Link href="/terms" className="underline">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
