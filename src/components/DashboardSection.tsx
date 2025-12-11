// src/components/DashboardSection.tsx
import Image from "next/image";
import { Button } from "./ui";

export default function DashboardSection() {
  return (
    <section className="relative overflow-hidden bg-[#0B63F4] py-16 text-white sm:py-20">
      {/* blue background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 left-1/2 h-72 w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_65%)]" />
        <div className="absolute bottom-[-140px] left-1/2 h-80 w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_bottom,_rgba(7,16,45,0.9),_transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* heading + subtext */}
        <header className="mb-6 text-center sm:mb-8">
          <h2 className="text-[28px] font-bold tracking-tight sm:text-[42px]">
            Your Ride Dashboard — Wherever You Are
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-blue-100">
            Real feedback from diverse riders who loves seamless experience
          </p>
        </header>

        {/* (CTA removed – no free-ride promo) */}

        {/* main dashboard mockup */}
        <div className="relative mx-auto mt-8 flex justify-center sm:mt-12">
          <div className="relative inline-block rounded-[30px] bg-[#020617] p-3 pb-16 shadow-[0_50px_120px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
            <div className="flex overflow-hidden rounded-[26px] bg-[#020617]">
              <Image
                src="/frame15.png"
                alt="Dashboard navigation"
                width={103}
                height={576}
                className="h-auto w-auto"
                priority
              />
              <Image
                src="/frame16.png"
                alt="Dashboard main content"
                width={694}
                height={576}
                className="h-auto w-auto"
                priority
              />
            </div>

            <div className="absolute -bottom-6 right-[10%]">
              <div className="rounded-[32px] bg-[#020617] p-2 shadow-[0_40px_90px_rgba(0,0,0,0.9)] ring-1 ring-white/20">
                <Image
                  src="/HOMEPAGE.png"
                  alt="Mobile dashboard"
                  width={220}
                  height={420}
                  className="h-auto w-auto rounded-[30px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
