import Image from "next/image";

const tools = [
  {
    title: "Safety Guarantee",
    body: "Every ride is secured with our stringent safety protocol.",
  },
  {
    title: "Fast pickup",
    body: "Get to where you need to be in a flash with our smart pickup service.",
  },
  {
    title: "Affordable rate",
    body: "Transparent pricing that keeps every ride pocket-friendly.",
  },
  {
    title: "24/7 Support",
    body: "Real people ready to help, whenever you’re on the road.",
  },
];

export default function ToolsSection() {
  return (
    <section
      id="about"
      className="bg-[#eaf1ff] pb-16 pt-10 scroll-mt-24 sm:pb-20 sm:pt-14"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <header className="mb-16 text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-slate-900 sm:text-[54px]">
            The Tools Behind Every{" "}
            <span className="text-blue-600">Great</span> Ride
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">
            Built for speed, safety, and simplicity. From instant matching and
            transparent pricing to seamless payments—everything works together
            so your ride just works.
          </p>
        </header>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((item) => (
            <article
              key={item.title}
              className="flex min-h-[200px] flex-col items-center justify-center rounded-[26px]
                         bg-[radial-gradient(circle_at_top,_#f8fbff,_#d7e6ff)]
                         px-6 py-7 text-center shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
            >
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0b63f4]">
                <Image src="/plus.png" alt="Feature icon" width={28} height={28} />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-700">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
