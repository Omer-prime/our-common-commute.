"use client";

import { useEffect, useMemo, useState } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

type Faq = {
  id?: string;
  question: string;
  answer: string;
  category: string;
};

/* ---------------- STATIC FAQs (HOME + STARTERS) ---------------- */

const staticFaqs: Faq[] = [
  {
    question: "Do I need to download an app to book a ride?",
    answer:
      "No. You can book, track, and manage rides directly from the web without downloading anything.",
    category: "General",
  },
  {
    question: "How are drivers vetted?",
    answer:
      "Drivers go through identity verification, license checks, vehicle review, and ongoing quality monitoring.",
    category: "Safety",
  },
  {
    question: "Can I use the same account as a rider and a driver?",
    answer:
      "Yes. One account works for both rider and driver modes once your driver profile is approved.",
    category: "Accounts",
  },
  {
    question: "How do payouts work for drivers?",
    answer:
      "Earnings are tracked in real time and paid out on a regular schedule to your connected payout method.",
    category: "Payments",
  },
  {
    question: "Is support available during trips?",
    answer:
      "Yes. Support is available to help resolve trip issues, payments, and safety concerns.",
    category: "Support",
  },
  {
    question: "How is pricing calculated?",
    answer:
      "Pricing is shown upfront before you confirm a ride so you always know what you’ll pay.",
    category: "Pricing",
  },
  {
    question: "What documents are required to become a driver?",
    answer:
      "You’ll need a valid CNIC, driving license, vehicle registration, and a clear profile photo.",
    category: "Drivers",
  },
];

export default function FaqsPage() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`${apiBase()}/public/content/faqs`, {
      credentials: "include",
    });
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const es = new EventSource(`${apiBase()}/public/content/stream`);
    es.addEventListener("content_updated", load);
    return () => es.close();
  }, []);

  /* -------- MERGE STATIC + ADMIN FAQs (NO DUPLICATES) -------- */

  const mergedFaqs = useMemo(() => {
    const map = new Map<string, Faq>();

    // admin FAQs first (higher priority)
    for (const f of items) {
      map.set(f.question, f);
    }

    // add static only if not already present
    for (const f of staticFaqs) {
      if (!map.has(f.question)) {
        map.set(f.question, f);
      }
    }

    return Array.from(map.values());
  }, [items]);

  const grouped = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const f of mergedFaqs) {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    }
    return Array.from(map.entries());
  }, [mergedFaqs]);

  return (
    <main className="min-h-screen bg-[#eef3ff] py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-slate-600">
          Updated automatically when new content is published.
        </p>

        {loading ? (
          <div className="mt-8 text-sm text-slate-500">Loading FAQs...</div>
        ) : (
          <div className="mt-10 space-y-10">
            {grouped.map(([cat, faqs]) => (
              <section key={cat} className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  {cat}
                </h2>

                <div className="mt-4 space-y-4">
                  {faqs.map((f, i) => (
                    <div
                      key={`${cat}-${i}`}
                      className="rounded-xl bg-slate-50 p-4"
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        {f.question}
                      </div>
                      <div className="mt-2 whitespace-pre-line text-sm text-slate-700">
                        {f.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
