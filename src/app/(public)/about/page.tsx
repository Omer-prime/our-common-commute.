import Link from "next/link";
import { Button } from "../../../components/ui";

export const metadata = {
    title: "About | Our Common Commute",
    description:
        "Learn about Our Common Commute — our mission, values, and how we’re building safer, clearer everyday rides.",
};

export default function AboutPage() {
    return (
        <main className="relative isolate min-h-screen overflow-x-clip bg-[#eef3ff]">
            {/* subtle glow below navbar */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-16 -z-10 h-72 bg-gradient-to-b from-white/60 to-transparent"
            />

            {/* HERO */}
            <section className="relative mx-auto w-full max-w-7xl px-4 pt-26 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg sm:p-10">
                    <span className="inline-flex rounded-full bg-white/90 px-4 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                        About OCC
                    </span>

                    <h1 className="mt-5 text-[34px] font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                        Drive Together, Thrive Together
                    </h1>

                    <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                        Our Common Commute (OCC) helps riders and drivers connect with clear
                        pricing, safer trips, and a smooth onboarding process — built for
                        everyday rides, not complexity.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link href="/auth" className="w-full sm:w-auto">
                            <Button variant="primary" className="w-full min-w-[190px] px-8 text-sm">
                                Book a ride
                            </Button>
                        </Link>

                        <Link href="/drive" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full min-w-[190px] px-8 text-sm">
                                Earn with OCC
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* VALUES */}
            <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-slate-900">What we focus on</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Practical features that improve trust, clarity, and reliability.
                </p>

                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card
                        title="Clear pricing"
                        desc="Know what you’re paying before you confirm — fewer surprises, more confidence."
                    />
                    <Card
                        title="Safety & verification"
                        desc="We prioritize safer trips with verification checks and clear trip history."
                    />
                    <Card
                        title="Fast onboarding"
                        desc="Drivers can submit documents, get reviewed, and start quickly."
                    />
                    <Card
                        title="Reliable matching"
                        desc="Real-time matching designed to reduce wait time and improve availability."
                    />
                    <Card
                        title="Support when needed"
                        desc="A simple support flow for riders and drivers to get help quickly."
                    />
                    <Card
                        title="Built to scale"
                        desc="Clean architecture and performance-focused UI for a smooth experience on all devices."
                    />
                </div>
            </section>

            {/* HOW WE WORK */}
            <section className="bg-white/70 py-14 backdrop-blur">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        <Block
                            title="Mission"
                            desc="Make everyday rides simpler, safer, and more transparent for riders and drivers."
                        />
                        <Block
                            title="Vision"
                            desc="A trusted commute network where time, pricing, and support are always clear."
                        />
                        <Block
                            title="Promise"
                            desc="Build fast, accessible experiences — and continuously improve based on real usage."
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-white/60 bg-white/75 p-8 shadow-lg backdrop-blur sm:p-10">
                    <h3 className="text-xl font-semibold text-slate-900">
                        Want to partner or learn more?
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                        Visit support for help, or explore careers to join the team.
                    </p>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <Link href="/support" className="w-full sm:w-auto">
                            <Button variant="primary" className="w-full min-w-[190px]">
                                Support
                            </Button>
                        </Link>
                        <Link href="/career" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full min-w-[190px]">
                                Careers
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

function Card({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/60">
            <p className="text-base font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
        </div>
    );
}

function Block({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200/50">
            <p className="text-base font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
        </div>
    );
}
