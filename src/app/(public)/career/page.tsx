export default function CareerPage() {
  return (
    <main className="min-h-screen bg-[#eef3ff]">
      {/* HERO */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            Careers at OCC
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-slate-600">
            Join us in building a better everyday commute — simple, fair, and human-first.
          </p>
        </div>
      </section>

      {/* WHY OCC */}
      <section className="bg-white/70 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center">
            Why work with us
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            We focus on clarity, ownership, and real impact.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Value title="Meaningful impact" desc="Your work directly improves how people move every day." />
            <Value title="Remote-friendly" desc="Work from where you perform best." />
            <Value title="Fast ownership" desc="Small teams, real responsibility, no red tape." />
            <Value title="Growth mindset" desc="Learn fast and grow with the product." />
            <Value title="Clear direction" desc="Simple goals and focused execution." />
            <Value title="People first" desc="We care about users and teammates equally." />
          </div>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center">
            Open positions
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Role title="Frontend Engineer" type="Full-time · Remote" />
            <Role title="Backend Engineer" type="Full-time · Remote" />
            <Role title="Mobile App Developer" type="Contract · Hybrid" />
            <Role title="Operations Manager" type="Full-time · On-site" />
            <Role title="Customer Support Lead" type="Full-time · Remote" />
          </div>
        </div>
      </section>

      {/* HIRING PROCESS */}
      <section className="bg-white/70 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center">
            Our hiring process
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Step title="Apply" desc="Share your experience and interests." />
            <Step title="Interview" desc="Short, focused conversations." />
            <Step title="Join" desc="Quick decision, no long delays." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h3 className="text-xl font-semibold text-slate-900">
            Don’t see a role that fits?
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            We’re always open to great people.
          </p>
          <p className="mt-3 text-sm font-medium text-blue-600">
            careers@ourcommoncommute.com
          </p>
        </div>
      </section>
    </main>
  );
}

function Role({ title, type }: { title: string; type: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{type}</p>
    </div>
  );
}

function Value({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Step({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/60">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}
