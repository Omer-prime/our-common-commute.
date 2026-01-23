export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[#eef3ff]">
      {/* HERO */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            Support
          </h1>
          <p className="mt-4 text-slate-600">
            Help for riders, drivers, and partners — when you need it.
          </p>
        </div>
      </section>

      {/* HOW SUPPORT WORKS */}
      <section className="bg-white/70 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center">
            How we help
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Step title="Report" desc="Tell us what went wrong." />
            <Step title="Review" desc="Our team reviews the issue." />
            <Step title="Resolve" desc="We take action quickly." />
          </div>
        </div>
      </section>

      {/* SUPPORT CATEGORIES */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center">
            Common support topics
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Trip issues" desc="Problems during a ride or delivery." />
            <Card title="Payments & refunds" desc="Charges, payouts, and receipts." />
            <Card title="Account help" desc="Login, profile, or verification." />
            <Card title="Safety concerns" desc="Report urgent issues immediately." />
            <Card title="Driver onboarding" desc="Help submitting documents." />
            <Card title="General questions" desc="Everything else." />
          </div>
        </div>
      </section>

      {/* REASSURANCE */}
      <section className="bg-white/70 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h3 className="text-xl font-semibold text-slate-900">
            Need urgent help?
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            For safety-related issues, please reach out immediately through your account.
          </p>
        </div>
      </section>
    </main>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
      <h3 className="font-semibold text-slate-900">{title}</h3>
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
