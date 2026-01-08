"use client";

import { useEffect, useMemo, useState } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

type Faq = { id: string; question: string; answer: string; category: string };

export default function FaqsPage() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`${apiBase()}/public/content/faqs`, { credentials: "include" });
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const es = new EventSource(`${apiBase()}/public/content/stream`);
    es.addEventListener("content_updated", () => load());
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const f of items) {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">FAQs</h1>
      <p className="mt-2 text-sm text-slate-600">This page updates automatically when admin publishes content.</p>

      {loading ? (
        <div className="mt-6 text-sm text-slate-500">Loading...</div>
      ) : (
        <div className="mt-6 space-y-6">
          {grouped.map(([cat, faqs]) => (
            <section key={cat} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">{cat}</h2>
              <div className="mt-4 space-y-4">
                {faqs.map((f) => (
                  <div key={f.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">{f.question}</div>
                    <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">{f.answer}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
