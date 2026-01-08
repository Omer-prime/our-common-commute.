// src/app/admin/dashboard/content/page.tsx
"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import { Search, X, MoreHorizontal } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type MainTab = "faqs" | "help" | "terms" | "policy" | "driver" | "rider";
type PublishStatus = "Published" | "Draft";

type FAQItem = { id: string; title: string; category: string; status: PublishStatus; lastUpdated: string };
type ArticleItem = { id: string; title: string; category: string; status: PublishStatus; lastUpdated: string };

type VersionedDocItem = {
  id: string; // cuid (we show version in UI)
  version: string;
  updatedBy: string;
  date: string;
  notes: string;
  status: PublishStatus;
  content: string;
};

type GuidelineItem = {
  id: string;
  sectionTitle: string;
  lastUpdated: string;
  notes: string;
  status: PublishStatus;
  content: string;
};

type ApiCmsStatus = "PUBLISHED" | "DRAFT";

/* -------------------------------------------------------------------------- */
/*  API HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function getBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getBackendBaseUrl();

  const doFetch = () =>
    fetch(`${base}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

  let res = await doFetch();

  // If your backend uses refresh-cookie flow, retry once
  if (res.status === 401) {
    await fetch(`${base}/auth/refresh`, { method: "POST", credentials: "include" });
    res = await doFetch();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API_ERROR ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

function toApiStatus(s: PublishStatus): ApiCmsStatus {
  return s === "Published" ? "PUBLISHED" : "DRAFT";
}
function fromApiStatus(s: ApiCmsStatus): PublishStatus {
  return s === "PUBLISHED" ? "Published" : "Draft";
}

function fmtShort(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // "Nov 12"
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminContentManagementPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("faqs");

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [dateFilter, setDateFilter] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [terms, setTerms] = useState<VersionedDocItem[]>([]);
  const [policies, setPolicies] = useState<VersionedDocItem[]>([]);
  const [driverGuidelines, setDriverGuidelines] = useState<GuidelineItem[]>([]);
  const [riderGuidelines, setRiderGuidelines] = useState<GuidelineItem[]>([]);

  // modals
  const [editingFaq, setEditingFaq] = useState<(FAQItem & { answer?: string }) | null>(null);
  const [editingArticle, setEditingArticle] = useState<(ArticleItem & { content?: string }) | null>(null);

  const [editingDoc, setEditingDoc] = useState<{ type: "TERMS" | "POLICY"; item: VersionedDocItem | null } | null>(
    null
  );

  const [editingGuideline, setEditingGuideline] = useState<{ audience: "DRIVER" | "RIDER"; item: GuidelineItem | null } | null>(
    null
  );

  const showCategoryFilter = activeTab === "faqs" || activeTab === "help";

  const queryKey = useMemo(
    () => `${activeTab}|${categoryFilter}|${statusFilter}|${dateFilter}|${searchQuery}`,
    [activeTab, categoryFilter, statusFilter, dateFilter, searchQuery]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const q = encodeURIComponent(searchQuery.trim());
        const status = statusFilter;
        const category = encodeURIComponent(categoryFilter);

        if (activeTab === "faqs") {
          const data = await apiJson<{
            ok: true;
            items: { id: string; question: string; category: string; status: ApiCmsStatus; updatedAt: string }[];
          }>(`/admin/content/faqs?q=${q}&status=${status}&category=${category}&page=1&limit=50`);

          if (cancelled) return;
          setFaqs(
            data.items.map((x) => ({
              id: x.id,
              title: x.question,
              category: x.category,
              status: fromApiStatus(x.status),
              lastUpdated: fmtShort(x.updatedAt),
            }))
          );
        }

        if (activeTab === "help") {
          const data = await apiJson<{
            ok: true;
            items: { id: string; title: string; category: string; status: ApiCmsStatus; updatedAt: string }[];
          }>(`/admin/content/articles?q=${q}&status=${status}&category=${category}&page=1&limit=50`);

          if (cancelled) return;
          setArticles(
            data.items.map((x) => ({
              id: x.id,
              title: x.title,
              category: x.category,
              status: fromApiStatus(x.status),
              lastUpdated: fmtShort(x.updatedAt),
            }))
          );
        }

        if (activeTab === "terms") {
          const data = await apiJson<{
            ok: true;
            items: { id: string; version: string; notes: string | null; content: string; status: ApiCmsStatus; updatedAt: string; updatedBy: { fullName: string } }[];
          }>(`/admin/content/docs?type=TERMS&q=${q}&status=${status}&page=1&limit=50`);

          if (cancelled) return;
          setTerms(
            data.items.map((x) => ({
              id: x.id,
              version: x.version,
              updatedBy: x.updatedBy?.fullName || "Admin",
              date: fmtShort(x.updatedAt),
              notes: x.notes ?? "",
              status: fromApiStatus(x.status),
              content: x.content,
            }))
          );
        }

        if (activeTab === "policy") {
          const data = await apiJson<{
            ok: true;
            items: { id: string; version: string; notes: string | null; content: string; status: ApiCmsStatus; updatedAt: string; updatedBy: { fullName: string } }[];
          }>(`/admin/content/docs?type=POLICY&q=${q}&status=${status}&page=1&limit=50`);

          if (cancelled) return;
          setPolicies(
            data.items.map((x) => ({
              id: x.id,
              version: x.version,
              updatedBy: x.updatedBy?.fullName || "Admin",
              date: fmtShort(x.updatedAt),
              notes: x.notes ?? "",
              status: fromApiStatus(x.status),
              content: x.content,
            }))
          );
        }

        if (activeTab === "driver") {
          const data = await apiJson<{
            ok: true;
            items: { id: string; sectionTitle: string; notes: string | null; status: ApiCmsStatus; updatedAt: string }[];
          }>(`/admin/content/guidelines?audience=DRIVER&q=${q}&status=${status}&page=1&limit=50`);

          if (cancelled) return;
          setDriverGuidelines(
            data.items.map((x) => ({
              id: x.id,
              sectionTitle: x.sectionTitle,
              lastUpdated: fmtShort(x.updatedAt),
              notes: x.notes ?? "",
              status: fromApiStatus(x.status),
              content: "", // loaded on edit if needed
            }))
          );
        }

        if (activeTab === "rider") {
          const data = await apiJson<{
            ok: true;
            items: { id: string; sectionTitle: string; notes: string | null; status: ApiCmsStatus; updatedAt: string }[];
          }>(`/admin/content/guidelines?audience=RIDER&q=${q}&status=${status}&page=1&limit=50`);

          if (cancelled) return;
          setRiderGuidelines(
            data.items.map((x) => ({
              id: x.id,
              sectionTitle: x.sectionTitle,
              lastUpdated: fmtShort(x.updatedAt),
              notes: x.notes ?? "",
              status: fromApiStatus(x.status),
              content: "",
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  async function saveFaq(payload: { id?: string; question: string; answer: string; category: string; status: PublishStatus }) {
    if (payload.id) {
      await apiJson(`/admin/content/faqs/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify({
          question: payload.question,
          answer: payload.answer,
          category: payload.category,
          status: toApiStatus(payload.status),
        }),
      });
    } else {
      await apiJson(`/admin/content/faqs`, {
        method: "POST",
        body: JSON.stringify({
          question: payload.question,
          answer: payload.answer,
          category: payload.category,
          status: toApiStatus(payload.status),
        }),
      });
    }
    // reload current tab
    setSearchQuery((s) => s);
  }

  async function saveArticle(payload: { id?: string; title: string; content: string; category: string; status: PublishStatus }) {
    if (payload.id) {
      await apiJson(`/admin/content/articles/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          category: payload.category,
          status: toApiStatus(payload.status),
        }),
      });
    } else {
      await apiJson(`/admin/content/articles`, {
        method: "POST",
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          category: payload.category,
          status: toApiStatus(payload.status),
        }),
      });
    }
    setSearchQuery((s) => s);
  }

  async function saveDoc(payload: { id?: string; type: "TERMS" | "POLICY"; version: string; notes: string; content: string; status: PublishStatus }) {
    if (payload.id) {
      await apiJson(`/admin/content/docs/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify({
          type: payload.type,
          version: payload.version,
          notes: payload.notes,
          content: payload.content,
          status: toApiStatus(payload.status),
        }),
      });
    } else {
      await apiJson(`/admin/content/docs`, {
        method: "POST",
        body: JSON.stringify({
          type: payload.type,
          version: payload.version,
          notes: payload.notes,
          content: payload.content,
          status: toApiStatus(payload.status),
        }),
      });
    }
    setSearchQuery((s) => s);
  }

  async function saveGuideline(payload: {
    id?: string;
    audience: "DRIVER" | "RIDER";
    sectionTitle: string;
    content: string;
    notes: string;
    status: PublishStatus;
  }) {
    const body = {
      audience: payload.audience,
      sectionTitle: payload.sectionTitle,
      content: payload.content,
      notes: payload.notes,
      status: toApiStatus(payload.status),
    };

    if (payload.id) {
      await apiJson(`/admin/content/guidelines/${payload.id}`, { method: "PUT", body: JSON.stringify(body) });
    } else {
      await apiJson(`/admin/content/guidelines`, { method: "POST", body: JSON.stringify(body) });
    }
    setSearchQuery((s) => s);
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER: title + search */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">Content Management System</h1>

          <div className="relative mx-auto flex-1 max-w-[560px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* MAIN TABS ROW */}
        <section className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap gap-2">
            <MainTabButton label="FAQs" isActive={activeTab === "faqs"} onClick={() => setActiveTab("faqs")} />
            <MainTabButton label="Help Articles" isActive={activeTab === "help"} onClick={() => setActiveTab("help")} />
            <MainTabButton label="Terms & conditions" isActive={activeTab === "terms"} onClick={() => setActiveTab("terms")} />
            <MainTabButton label="Privacy policy" isActive={activeTab === "policy"} onClick={() => setActiveTab("policy")} />
            <MainTabButton label="Driver guidelines" isActive={activeTab === "driver"} onClick={() => setActiveTab("driver")} />
            <MainTabButton label="Rider guidelines" isActive={activeTab === "rider"} onClick={() => setActiveTab("rider")} />
          </div>
        </section>

        {/* FILTERS + TABLE CARD */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          {/* Filters row */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {showCategoryFilter && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
              >
                <option value="all">Category</option>
                <option value="Getting Started">Getting started</option>
                <option value="Payments">Payments</option>
                <option value="Ride Issues">Ride issues</option>
                <option value="Accounts">Accounts</option>
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            >
              <option value="all">Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-700 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            >
              <option value="recent">Most recent</option>
            </select>

            <div className="relative ml-auto w-full max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
              />
            </div>

            {/* Add buttons */}
            {(activeTab === "faqs" || activeTab === "help") && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "faqs") setEditingFaq({ id: "", title: "", category: "", status: "Draft", lastUpdated: "" });
                  if (activeTab === "help") setEditingArticle({ id: "", title: "", category: "", status: "Draft", lastUpdated: "" });
                }}
                className="h-9 rounded-lg bg-[#2563FF] px-4 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                {activeTab === "faqs" ? "Add new FAQ" : "Add article"}
              </button>
            )}

            {(activeTab === "terms" || activeTab === "policy") && (
              <button
                type="button"
                onClick={() => setEditingDoc({ type: activeTab === "terms" ? "TERMS" : "POLICY", item: null })}
                className="h-9 rounded-lg bg-[#2563FF] px-4 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Add new version
              </button>
            )}

            {(activeTab === "driver" || activeTab === "rider") && (
              <button
                type="button"
                onClick={() =>
                  setEditingGuideline({
                    audience: activeTab === "driver" ? "DRIVER" : "RIDER",
                    item: null,
                  })
                }
                className="h-9 rounded-lg bg-[#2563FF] px-4 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Add new guideline
              </button>
            )}
          </div>

          {loading && <div className="py-6 text-center text-xs text-slate-500">Loading...</div>}

          {!loading && (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              {activeTab === "faqs" && (
                <FaqTable
                  items={faqs}
                  onRowAction={(item) => setEditingFaq({ ...item })}
                />
              )}

              {activeTab === "help" && (
                <ArticlesTable
                  items={articles}
                  onRowAction={(item) => setEditingArticle({ ...item })}
                />
              )}

              {activeTab === "terms" && (
                <VersionedTable
                  items={terms}
                  onRowAction={(item) => setEditingDoc({ type: "TERMS", item })}
                />
              )}

              {activeTab === "policy" && (
                <VersionedTable
                  items={policies}
                  onRowAction={(item) => setEditingDoc({ type: "POLICY", item })}
                />
              )}

              {activeTab === "driver" && (
                <GuidelinesTable
                  items={driverGuidelines}
                  onRowAction={(item) => setEditingGuideline({ audience: "DRIVER", item })}
                />
              )}

              {activeTab === "rider" && (
                <GuidelinesTable
                  items={riderGuidelines}
                  onRowAction={(item) => setEditingGuideline({ audience: "RIDER", item })}
                />
              )}
            </div>
          )}
        </section>
      </div>

      {/* MODALS */}
      {editingFaq && (
        <AddFaqModal
          initial={editingFaq.id ? editingFaq : null}
          onClose={() => setEditingFaq(null)}
          onSave={saveFaq}
        />
      )}

      {editingArticle && (
        <AddArticleModal
          initial={editingArticle.id ? editingArticle : null}
          onClose={() => setEditingArticle(null)}
          onSave={saveArticle}
        />
      )}

      {editingDoc && (
        <DocModal
          type={editingDoc.type}
          initial={editingDoc.item}
          onClose={() => setEditingDoc(null)}
          onSave={saveDoc}
        />
      )}

      {editingGuideline && (
        <GuidelineModal
          audience={editingGuideline.audience}
          initial={editingGuideline.item}
          onClose={() => setEditingGuideline(null)}
          onSave={saveGuideline}
        />
      )}
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  SMALL SHARED COMPONENTS                                                   */
/* -------------------------------------------------------------------------- */

function MainTabButton(props: { label: string; isActive: boolean; onClick: () => void }) {
  const { label, isActive, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-[11px] font-medium ${
        isActive ? "bg-[#2563FF] text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: PublishStatus }) {
  const isPublished = status === "Published";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-[3px] text-[10px] font-medium ${
        isPublished ? "border-[#2563FF]/40 bg-[#2563FF]/5 text-[#2563FF]" : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  TABLES                                                                    */
/* -------------------------------------------------------------------------- */

function FaqTable(props: { items: FAQItem[]; onRowAction: (item: FAQItem) => void }) {
  const { items, onRowAction } = props;
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
          </th>
          <th className="px-4 py-2 font-medium">Title</th>
          <th className="px-4 py-2 font-medium">Category</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium">Last updates</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </td>
            <td className="px-4 py-2 align-middle">{item.title}</td>
            <td className="px-4 py-2 align-middle">{item.category}</td>
            <td className="px-4 py-2 align-middle">
              <StatusBadge status={item.status} />
            </td>
            <td className="px-4 py-2 align-middle">{item.lastUpdated}</td>
            <td className="px-4 py-2 align-middle text-right">
              <button
                type="button"
                onClick={() => onRowAction(item)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ArticlesTable(props: { items: ArticleItem[]; onRowAction: (item: ArticleItem) => void }) {
  const { items, onRowAction } = props;
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
          </th>
          <th className="px-4 py-2 font-medium">Title</th>
          <th className="px-4 py-2 font-medium">Category</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium">Last updates</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </td>
            <td className="px-4 py-2 align-middle">{item.title}</td>
            <td className="px-4 py-2 align-middle">{item.category}</td>
            <td className="px-4 py-2 align-middle">
              <StatusBadge status={item.status} />
            </td>
            <td className="px-4 py-2 align-middle">{item.lastUpdated}</td>
            <td className="px-4 py-2 align-middle text-right">
              <button
                type="button"
                onClick={() => onRowAction(item)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VersionedTable(props: { items: VersionedDocItem[]; onRowAction: (item: VersionedDocItem) => void }) {
  const { items, onRowAction } = props;
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
          </th>
          <th className="px-4 py-2 font-medium">Version</th>
          <th className="px-4 py-2 font-medium">Updated by</th>
          <th className="px-4 py-2 font-medium">Date</th>
          <th className="px-4 py-2 font-medium">Notes</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </td>
            <td className="px-4 py-2 align-middle">{item.version}</td>
            <td className="px-4 py-2 align-middle">{item.updatedBy}</td>
            <td className="px-4 py-2 align-middle">{item.date}</td>
            <td className="px-4 py-2 align-middle">{item.notes}</td>
            <td className="px-4 py-2 align-middle">
              <StatusBadge status={item.status} />
            </td>
            <td className="px-4 py-2 align-middle text-right">
              <button
                type="button"
                onClick={() => onRowAction(item)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GuidelinesTable(props: { items: GuidelineItem[]; onRowAction: (item: GuidelineItem) => void }) {
  const { items, onRowAction } = props;
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
          </th>
          <th className="px-4 py-2 font-medium">Section Title</th>
          <th className="px-4 py-2 font-medium">Last updated</th>
          <th className="px-4 py-2 font-medium">Notes</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-2">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
            </td>
            <td className="px-4 py-2 align-middle">{item.sectionTitle}</td>
            <td className="px-4 py-2 align-middle">{item.lastUpdated}</td>
            <td className="px-4 py-2 align-middle">{item.notes}</td>
            <td className="px-4 py-2 align-middle">
              <StatusBadge status={item.status} />
            </td>
            <td className="px-4 py-2 align-middle text-right">
              <button
                type="button"
                onClick={() => onRowAction(item)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* -------------------------------------------------------------------------- */
/*  MODALS                                                                    */
/* -------------------------------------------------------------------------- */

function AddFaqModal(props: {
  initial: (FAQItem & { answer?: string }) | null;
  onClose: () => void;
  onSave: (p: { id?: string; question: string; answer: string; category: string; status: PublishStatus }) => Promise<void>;
}) {
  const { onClose, onSave, initial } = props;
  const [question, setQuestion] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [status, setStatus] = useState<PublishStatus>(initial?.status ?? "Draft");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave({
      id: initial?.id || undefined,
      question,
      answer,
      category,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            {initial ? "Edit FAQ" : "Add new FAQ"}
          </h2>
          <button type="button" onClick={onClose} className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Getting Started / Payments / Ride Issues ..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PublishStatus)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            >
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]">
              {initial ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddArticleModal(props: {
  initial: (ArticleItem & { content?: string }) | null;
  onClose: () => void;
  onSave: (p: { id?: string; title: string; content: string; category: string; status: PublishStatus }) => Promise<void>;
}) {
  const { onClose, onSave, initial } = props;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  async function submit(status: PublishStatus) {
    await onSave({ id: initial?.id || undefined, title, content, category, status });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">{initial ? "Edit article" : "Add new article"}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 px-5 py-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Article title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Article category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Getting Started / Payments / Accounts ..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300">
              Cancel
            </button>
            <button type="button" onClick={() => submit("Draft")} className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300">
              Save Draft
            </button>
            <button type="button" onClick={() => submit("Published")} className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]">
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocModal(props: {
  type: "TERMS" | "POLICY";
  initial: VersionedDocItem | null;
  onClose: () => void;
  onSave: (p: { id?: string; type: "TERMS" | "POLICY"; version: string; notes: string; content: string; status: PublishStatus }) => Promise<void>;
}) {
  const { type, initial, onClose, onSave } = props;

  const [version, setVersion] = useState(initial?.version ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  async function submit(status: PublishStatus) {
    await onSave({ id: initial?.id || undefined, type, version, notes, content, status });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            {type === "TERMS" ? "Terms & conditions" : "Privacy policy"} {initial ? `(Edit ${initial.version})` : "(New version)"}
          </h2>
          <button type="button" onClick={onClose} className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Version</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v3.2"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Updated liability section"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-800 outline-none focus:border-[#2563FF] focus:bg-white focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300">
              Cancel
            </button>
            <button type="button" onClick={() => submit("Draft")} className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300">
              Save Draft
            </button>
            <button type="button" onClick={() => submit("Published")} className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]">
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GuidelineModal(props: {
  audience: "DRIVER" | "RIDER";
  initial: GuidelineItem | null;
  onClose: () => void;
  onSave: (p: { id?: string; audience: "DRIVER" | "RIDER"; sectionTitle: string; content: string; notes: string; status: PublishStatus }) => Promise<void>;
}) {
  const { audience, initial, onClose, onSave } = props;

  const [sectionTitle, setSectionTitle] = useState(initial?.sectionTitle ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  async function submit(status: PublishStatus) {
    await onSave({ id: initial?.id || undefined, audience, sectionTitle, notes, content, status });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            {audience === "DRIVER" ? "Driver guideline" : "Rider guideline"} {initial ? "(Edit)" : "(New)"}
          </h2>
          <button type="button" onClick={onClose} className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Section Title</label>
              <input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="Professional Behavior"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Short notes shown in table"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-800 outline-none focus:border-[#2563FF] focus:bg-white focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300">
              Cancel
            </button>
            <button type="button" onClick={() => submit("Draft")} className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300">
              Save Draft
            </button>
            <button type="button" onClick={() => submit("Published")} className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]">
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
