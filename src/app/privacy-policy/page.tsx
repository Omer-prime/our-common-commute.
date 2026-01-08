"use client";

import { useEffect, useState } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

export default function PrivacyPolicyPage() {
  const [doc, setDoc] = useState<{ version: string; content: string } | null>(null);

  async function load() {
    const res = await fetch(`${apiBase()}/public/content/docs/policy`, { credentials: "include" });
    const data = await res.json();
    setDoc(data.doc ?? null);
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
      <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
      {doc ? (
        <>
          <div className="mt-2 text-xs text-slate-500">Version: {doc.version}</div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 whitespace-pre-line">
            {doc.content}
          </div>
        </>
      ) : (
        <div className="mt-6 text-sm text-slate-500">No published Policy yet.</div>
      )}
    </main>
  );
}
