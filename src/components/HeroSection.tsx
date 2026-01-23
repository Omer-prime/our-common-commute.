// src/components/HeroSection.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui";

export default function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#eaf1ff]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-72 bg-gradient-to-b from-white/90 to-transparent"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-12 pt-2 sm:px-6 lg:px-8">
        <div className="mx-auto mt-6 flex max-w-4xl flex-col items-center gap-4 text-center sm:mt-7">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[50px]">
            <span className="mr-1.5">The</span>
            <span className="text-blue-600">Fastest</span>
            <span className="ml-1.5">Way to Your Next</span>{" "}
            <span className="inline-flex items-center align-middle">
              <span className="mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <Image
                  src="/hero-section-icon.png"
                  alt="Car icon"
                  width={54}
                  height={54}
                />
              </span>
              <span>Stop</span>
            </span>
          </h1>

          <p className="max-w-xl text-[15px] leading-relaxed text-slate-600">
            Get a ride in seconds with real-time matching, clear pricing, and trusted drivers,
            anytime, anywhere.
          </p>

          <div className="mt-5 flex items-center justify-center gap-4">
            <Link href="/auth">
              <Button variant="primary" className="min-w-[170px] px-8 text-[14px]">
                Book a ride
              </Button>
            </Link>

            {/* ✅ Now it leads somewhere */}
            <Link href="/drive">
              <Button variant="outline" className="min-w-[170px] px-8 text-[14px]">
                Earn with OCC
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mt-2 h-[480px] w-full sm:h-[430px] lg:h-[620px]">
        <Image
          src="/hero-section.jpg"
          alt="Rider sitting in a car using the app"
          fill
          priority
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent" />
      </div>
    </section>
  );
}
