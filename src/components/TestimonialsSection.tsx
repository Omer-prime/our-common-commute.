import Image from "next/image";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Peter John",
      role: "Project Manager, US",
      body: "“The interface is so clean and fast! I tracked my ride in real time, and everything felt safe and reliable. The cobalt-blue theme even makes it look premium.”",
      avatar: "/paul.jpg",
    },
    {
      name: "Peter John",
      role: "Project Manager, US",
      body: "“I booked my ride straight from the web app while rushing to a meeting. The driver arrived in less than five minutes, and the live tracking gave me total peace of mind. Super smooth experience!”",
      avatar: "/jessica.jpg",
    },
    {
      name: "Peter John",
      role: "Project Manager, US",
      body: "“This platform has changed how I move around the city. No hidden fees, no app stress—just click, ride, and go. Totally recommend it for everyday commutes.”",
      avatar: "/steward.jpg",
    },
    {
      name: "Peter John",
      role: "Project Manager, US",
      body: "“I used it during my stay in Lagos and was blown away by how efficient it was. My driver was friendly, and the directions were spot-on. Feels like the future of city rides.”",
      avatar: "/allison.jpg",
    },
    {
      name: "Peter John",
      role: "Project Manager, US",
      body: "“I booked my ride straight from the web app while rushing to a meeting. The driver arrived in less than five minutes, and the live tracking gave me total peace of mind. Super smooth experience!”",
      avatar: "/juli.jpg",
    },
    {
      name: "Peter John",
      role: "Project Manager, US",
      body: "“I booked my ride straight from the web app while rushing to a meeting. The driver arrived in less than five minutes, and the live tracking gave me total peace of mind. Super smooth experience!”",
      avatar: "/peter.jpg",
    },
  ];

  return (
    <section className="bg-[#eaf1ff] py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <header className="mb-12 text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-slate-900 sm:text-[42px]">
            Why everyone loves{" "}
            <span className="text-blue-600">Our Common commute</span>
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">
            Real feedback from diverse riders who love a seamless, stress-free
            commute experience.
          </p>
        </header>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, idx) => (
            <article
              key={idx}
              className="flex h-full flex-col rounded-[22px] bg-[radial-gradient(circle_at_top,_#f8fbff,_#dde8ff)] 
                         px-6 py-5 text-sm shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
            >
              {/* body text */}
              <p className="flex-1 text-[13.5px] leading-relaxed text-slate-700">
                {t.body}
              </p>

              {/* divider + avatar row */}
              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="flex items-center gap-3 text-[12.5px]">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-200">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {t.name}
                    </div>
                    <div className="text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
