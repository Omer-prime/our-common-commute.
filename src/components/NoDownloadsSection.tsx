// src/components/NoDownloadsSection.tsx
import Image from "next/image";

export default function NoDownloadsSection() {
  return (
    <section className="relative pb-20 pt-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundColor: "#FFFFFF",
          backgroundImage:
            "linear-gradient(180deg, #C4DCFD 0%, #2D85FF 58%, #FFFFFF 100%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <header className="mb-10 text-center sm:mb-12">
          <h2 className="text-[26px] font-bold tracking-tight text-slate-900 sm:text-[32px]">
            No Downloads. No Waiting.{" "}
            <span className="text-blue-600 whitespace-nowrap">
              Just Rides.
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Built for speed, safety, and simplicity. From instant matching and
            transparent pricing to seamless payments—everything works together
            so your ride just works.
          </p>
        </header>

        {/* Big visual card */}
        <div className="mx-auto max-w-5xl">
          <div
            className="
              rounded-[36px] bg-white 
              shadow-[0_32px_90px_rgba(15,23,42,0.22)]
              ring-1 ring-[#e2ecff]
              px-4 py-4 sm:px-5 sm:py-5
            "
          >
            <div
              className="
                grid h-[320px] gap-3
                sm:h-[360px]
                lg:h-[410px]
                md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]
              "
            >
              <div className="relative h-full overflow-hidden rounded-[28px]">
                <Image
                  src="/woman.jpg"
                  alt="Passenger working on tablet during a ride"
                  fill
                  priority
                  className="object-cover object-[40%_18%]"
                />
              </div>

              <div className="hidden h-full rounded-[28px] bg-[#2D85FF] md:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
