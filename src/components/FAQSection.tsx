"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui";

const faqs = [
  {
    q: "Do I need to download an app to book a ride?",
    a: "No. You can book, track, and manage your rides directly from the web in under a minute.",
  },
  {
    q: "How are drivers vetted?",
    a: "Drivers go through identity verification, license checks, vehicle review, and ongoing quality monitoring.",
  },
  {
    q: "Can I use the same account as a rider and a driver?",
    a: "Yes. Once your driver profile is approved, you can switch between rider and driver modes using one account.",
  },
  {
    q: "How do payouts work for drivers?",
    a: "Earnings are tracked in real time and paid out on a regular schedule to your connected payout method.",
  },
  {
    q: "Is support available if there’s an issue with a trip?",
    a: "Yes. Our support team is available to help with trip issues, payments, and safety concerns.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="support"
      className="bg-gradient-to-b from-[#eaf1ff] via-[#e5efff] to-[#f5f8ff] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <header className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-5xl">
            Got Questions? We’ve Got Answers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
            Everything you need to know before riding or driving with OCC.
          </p>
        </header>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((item, i) => {
            const open = openIndex === i;

            return (
              <div
                key={item.q}
                className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {item.q}
                  </span>

                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold transition-transform ${
                      open ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>

                {open && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* See more */}
        <div className="mt-8 flex justify-center">
          <Link href="/faqs">
            <Button className="h-11 min-w-[160px] rounded-full px-8 text-sm">
              See more FAQs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
