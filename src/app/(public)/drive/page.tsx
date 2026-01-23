// src/app/drive/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "../../../components/ui";

export default function DrivePage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef3ff]">
      {/* ✅ Glow starts BELOW navbar so blur won't wash it out */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-16 h-72 bg-gradient-to-b from-white/60 to-transparent"
      />

      {/* ================= HERO ================= */}
      <section className="relative mx-auto w-full max-w-7xl px-4 pt-26 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left */}
          <div className="pt-2">
            <span className="inline-flex rounded-full bg-white/90 px-4 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/70">
              Drive with OCC • Flexible • Fair
            </span>

            <h1 className="mt-5 text-[34px] font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Earn on your schedule with{" "}
              <span className="text-blue-600">OCC</span>
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600">
              Accept trips when you want, track your earnings in real time, and
              get paid reliably. Onboarding is quick and simple.
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/auth" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full min-w-[190px] px-8 text-sm">
                  Apply as Driver
                </Button>
              </Link>

              <a href="#requirements" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full min-w-[190px] px-8 text-sm">
                  View requirements
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat title="Fast approval" desc="Submit docs and start." />
              <Stat title="Live earnings" desc="Clear payouts." />
              <Stat title="Driver support" desc="We’ve got your back." />
            </div>
          </div>

          {/* Right card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl backdrop-blur">
            <div className="relative h-[320px] sm:h-[420px] lg:h-[460px]">
              <Image
                src="/hero-section.jpg"
                alt="Driver using OCC app"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/35 to-transparent" />
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Info title="Flexible hours" desc="Drive anytime." />
              <Info title="Transparent pricing" desc="Know before you go." />
              <Info title="Safety first" desc="Verified riders." />
              <Info title="In-app navigation" desc="Simple routes." />
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="mt-16 bg-white/70 py-14 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <p className="mt-2 text-sm text-slate-600">
            Three simple steps to start earning.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Step step="01" title="Create your profile" desc="Sign up and add basic details." />
            <Step step="02" title="Upload documents" desc="CNIC, license & vehicle info." />
            <Step step="03" title="Go online & earn" desc="Accept trips and get paid." />
          </div>
        </div>
      </section>

      {/* ================= REQUIREMENTS ================= */}
      <section
        id="requirements"
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900">Driver requirements</h2>
            <p className="mt-2 text-sm text-slate-600">
              Keep these ready for faster approval.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Req title="Valid CNIC" desc="Clear & not expired." />
              <Req title="Driving license" desc="Valid & readable." />
              <Req title="Vehicle registration" desc="Ownership or permission." />
              <Req title="Vehicle photos" desc="Front, back & sides." />
              <Req title="Profile photo" desc="Clear face photo." />
              <Req title="Phone & internet" desc="Stable connection." />
            </div>
          </div>

          {/* Right CTA */}
          <div className="h-fit rounded-3xl border border-white/60 bg-white/75 p-6 shadow-lg backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-900">Ready to start?</h3>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Apply now and start driving after quick verification.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link href="/auth">
                <Button variant="primary" className="w-full">
                  Apply as Driver
                </Button>
              </Link>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================= UI PARTS ================= */

function Stat({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white/90 px-4 py-4 shadow-sm ring-1 ring-slate-200/60">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{desc}</p>
    </div>
  );
}

function Info({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-slate-200/60">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-600">{desc}</p>
    </div>
  );
}

function Step({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200/50">
      <span className="inline-flex h-9 items-center rounded-full bg-blue-600 px-4 text-xs font-semibold text-white">
        {step}
      </span>
      <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Req({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/60">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        ✓
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-600">{desc}</p>
      </div>
    </div>
  );
}
