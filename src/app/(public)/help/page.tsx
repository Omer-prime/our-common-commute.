"use client";

import { useEffect, useState } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

type Article = { id: string; title: string; content: string; category: string };

export default function HelpPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`${apiBase()}/public/content/articles`, { credentials: "include" });
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Help Articles</h1>

      {loading ? (
        <div className="mt-6 text-sm text-slate-500">Loading...</div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((a) => (
            <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-xs text-slate-500">{a.category}</div>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{a.title}</h2>
              <div className="mt-3 text-sm text-slate-700 whitespace-pre-line">{a.content}</div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
