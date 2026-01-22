// src/components/DashboardSection.tsx
import Image from "next/image";

export default function DashboardSection() {
  return (
    <section className="relative overflow-hidden bg-[#0B63F4] py-14 text-white sm:py-20">
      {/* blue background glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-72 w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_65%)]" />
        <div className="absolute bottom-[-140px] left-1/2 h-80 w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_bottom,_rgba(7,16,45,0.9),_transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* heading + subtext */}
        <header className="mx-auto mb-6 max-w-3xl text-center sm:mb-10">
          <h2 className="text-balance text-[24px] font-bold tracking-tight sm:text-[42px]">
            Your Ride Dashboard — Wherever You Are
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-blue-100 sm:text-[15px]">
            Real feedback from diverse riders who love a seamless experience
          </p>
        </header>

        {/* main mockup */}
        <div className="relative mx-auto mt-8 w-full max-w-[980px] sm:mt-12">
          <div className="relative rounded-[28px] bg-[#020617] p-3 shadow-[0_50px_120px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:rounded-[30px]">
            {/* Desktop layout: side nav + main */}
            <div className="hidden overflow-hidden rounded-[22px] bg-[#020617] sm:flex">
              <Image
                src="/Frame15.png"
                alt="Dashboard navigation"
                width={140}
                height={720}
                className="h-auto w-[120px] shrink-0"
                sizes="(min-width: 640px) 120px, 0px"
                priority
              />
              <Image
                src="/Frame16.png"
                alt="Dashboard main content"
                width={900}
                height={720}
                className="h-auto w-[calc(100%-120px)]"
                sizes="(min-width: 1024px) 860px, (min-width: 640px) 680px, 100vw"
                priority
              />
            </div>

            {/* Mobile layout: only the main dashboard image */}
            <div className="overflow-hidden rounded-[22px] bg-[#020617] sm:hidden">
              <Image
                src="/Frame16.png"
                alt="Dashboard preview"
                width={900}
                height={720}
                className="h-auto w-full"
                sizes="100vw"
                priority
              />
            </div>

            {/* Floating mobile screenshot (positioned safely) */}
            <div className="pointer-events-none absolute -bottom-10 left-1/2 w-[210px] -translate-x-1/2 sm:left-auto sm:right-10 sm:translate-x-0 sm:w-[230px]">
              <div className="rounded-[28px] bg-[#020617] p-2 shadow-[0_40px_90px_rgba(0,0,0,0.55)] ring-1 ring-white/20">
                <Image
                  src="/HOMEPAGE.png"
                  alt="Mobile dashboard"
                  width={230}
                  height={460}
                  className="h-auto w-full rounded-[24px]"
                  sizes="(min-width: 640px) 230px, 210px"
                />
              </div>
            </div>

            {/* Extra bottom space so the overlay never gets cut */}
            <div className="h-16 sm:h-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
