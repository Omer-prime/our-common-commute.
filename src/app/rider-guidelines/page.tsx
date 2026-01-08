"use client";

import { useEffect, useState } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

type Item = { id: string; sectionTitle: string; content: string; notes?: string };

export default function DriverGuidelinesPage() {
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const res = await fetch(`${apiBase()}/public/content/guidelines/driver`, { credentials: "include" });
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
    const es = new EventSource(`${apiBase()}/public/content/stream`);
    es.addEventListener("content_updated", () => load());
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Driver Guidelines</h1>
      <div className="mt-6 space-y-4">
        {items.map((g) => (
          <section key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">{g.sectionTitle}</h2>
            {g.notes ? <div className="mt-1 text-xs text-slate-500">{g.notes}</div> : null}
            <div className="mt-3 text-sm text-slate-700 whitespace-pre-line">{g.content}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
