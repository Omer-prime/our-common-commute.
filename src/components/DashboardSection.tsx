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
        {/* soft light behind heading */}
        <div className="absolute -top-32 left-1/2 h-72 w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_65%)]" />
        {/* dark glow under mockups */}
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

        {/* CTA pill button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="mt-1 h-11 min-w-[200px] rounded-full border-0 bg-white text-[14px] font-semibold text-[#0B63F4] shadow-[0_18px_45px_rgba(0,0,0,0.55)] hover:bg-white/95"
          >
            Enjoy free ride
          </Button>
        </div>

        {/* main dashboard mockup */}
        <div className="relative mx-auto mt-12 flex justify-center">
          {/* DESKTOP DASHBOARD (sidebar + main merged) */}
          <div className="relative inline-block rounded-[30px] bg-[#020617] p-3 shadow-[0_50px_120px_rgba(0,0,0,0.85)] ring-1 ring-white/10 pb-16">
            {/* inner rounded screen */}
            <div className="flex overflow-hidden rounded-[26px] bg-[#020617]">
              {/* left sidebar – frame15 */}
              <Image
                src="/frame15.png"
                alt="Dashboard navigation"
                width={103}
                height={576}
                className="h-auto w-auto"
                priority
              />

              {/* right main content – frame16 */}
              <Image
                src="/frame16.png"
                alt="Dashboard main content"
                width={694}
                height={576}
                className="h-auto w-auto"
                priority
              />
            </div>

            {/* MOBILE OVERLAY */}
            <div className="absolute -bottom-6 right-[10%]">
              <div className="rounded-[32px] bg-[#020617] shadow-[0_40px_90px_rgba(0,0,0,0.9)] ring-1 ring-white/20 p-2">
                <Image
                  src="/HOMEPAGE.png"
                  alt="Mobile dashboard"
                  width={220}
                  height={420}
                  className="rounded-[30px] h-auto w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
