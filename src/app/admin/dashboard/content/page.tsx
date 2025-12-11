// src/app/admin/content-management/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { AdminShell } from "@/src/components/AdminShell";
import { Search, X, MoreHorizontal } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type MainTab =
  | "faqs"
  | "help"
  | "terms"
  | "policy"
  | "driver"
  | "rider";

type PublishStatus = "Published" | "Draft";

type FAQItem = {
  id: string;
  title: string;
  category: string;
  status: PublishStatus;
  lastUpdated: string;
};

type ArticleItem = {
  id: string;
  title: string;
  category: string;
  status: PublishStatus;
  lastUpdated: string;
};

type VersionedDocItem = {
  id: string; // v3.2 etc
  updatedBy: string;
  date: string;
  notes: string;
  status: PublishStatus;
};

type GuidelineItem = {
  id: string;
  sectionTitle: string;
  lastUpdated: string;
  notes: string;
  status: PublishStatus;
};

/* -------------------------------------------------------------------------- */
/*  MOCK DATA                                                                 */
/* -------------------------------------------------------------------------- */

const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    title: "How to request a ride?",
    category: "Getting Started",
    status: "Published",
    lastUpdated: "Nov 12",
  },
  {
    id: "faq-2",
    title: "What if driver cancels?",
    category: "Ride Issues",
    status: "Draft",
    lastUpdated: "Oct 2",
  },
  {
    id: "faq-3",
    title: "How to request a ride?",
    category: "Getting Started",
    status: "Published",
    lastUpdated: "Nov 12",
  },
  {
    id: "faq-4",
    title: "How to request a ride?",
    category: "Getting Started",
    status: "Published",
    lastUpdated: "Nov 12",
  },
  {
    id: "faq-5",
    title: "How to request a ride?",
    category: "Getting Started",
    status: "Published",
    lastUpdated: "Nov 12",
  },
  {
    id: "faq-6",
    title: "How to request a ride?",
    category: "Getting Started",
    status: "Published",
    lastUpdated: "Nov 12",
  },
];

const articleItems: ArticleItem[] = [
  {
    id: "art-1",
    title: "How to request a ride?",
    category: "Getting Started",
    status: "Published",
    lastUpdated: "Nov 12",
  },
  {
    id: "art-2",
    title: "Payment not going through",
    category: "Payments",
    status: "Draft",
    lastUpdated: "Oct 2",
  },
  {
    id: "art-3",
    title: "Driver verification steps",
    category: "Driver Onboarding",
    status: "Published",
    lastUpdated: "Nov 12",
  },
  {
    id: "art-4",
    title: "Canceling a ride",
    category: "Ride Issues",
    status: "Published",
    lastUpdated: "Nov 12",
  },
  {
    id: "art-5",
    title: "Changing your work shift",
    category: "Accounts",
    status: "Published",
    lastUpdated: "Nov 12",
  },
];

const termsItems: VersionedDocItem[] = [
  {
    id: "v3.2",
    updatedBy: "Admin John",
    date: "Nov 12",
    notes: "Updated liability section",
    status: "Published",
  },
  {
    id: "v3.1",
    updatedBy: "Admin Maria",
    date: "Nov 12",
    notes: "Minor formatting fixes",
    status: "Published",
  },
  {
    id: "v3.0",
    updatedBy: "Admin Sara",
    date: "Nov 12",
    notes: "Added driver rules",
    status: "Published",
  },
  {
    id: "v2.5",
    updatedBy: "Admin Sara",
    date: "Nov 12",
    notes: "Revised cancellation terms",
    status: "Published",
  },
];

const policyItems: VersionedDocItem[] = [...termsItems];

const driverGuidelines: GuidelineItem[] = [
  {
    id: "g-1",
    sectionTitle: "Professional Behavior",
    lastUpdated: "Nov 12",
    notes: "Updated liability section",
    status: "Published",
  },
  {
    id: "g-2",
    sectionTitle: "Vehicle Requirements",
    lastUpdated: "Nov 12",
    notes: "Updated liability section",
    status: "Published",
  },
  {
    id: "g-3",
    sectionTitle: "Pickup/Dropoff Rules",
    lastUpdated: "Nov 12",
    notes: "Updated liability section",
    status: "Published",
  },
];

const riderGuidelines: GuidelineItem[] = driverGuidelines;

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminContentManagementPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("faqs");

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState<VersionedDocItem | null>(
    null,
  );
  const [editingPolicy, setEditingPolicy] = useState<VersionedDocItem | null>(
    null,
  );
  const [guidelineModalTab, setGuidelineModalTab] = useState<
    "driver" | "rider" | null
  >(null);

  const showCategoryFilter = activeTab === "faqs" || activeTab === "help";

  // Simple front-end filters just for UI feel – you can replace with real API logic later
  const matchesFilters = (status: PublishStatus, titleLike: string) => {
    if (statusFilter === "published" && status !== "Published") return false;
    if (statusFilter === "draft" && status !== "Draft") return false;

    if (searchQuery.trim().length) {
      const q = searchQuery.toLowerCase();
      if (!titleLike.toLowerCase().includes(q)) return false;
    }

    // dateFilter currently only controls label; no data change
    return true;
  };

  const filteredFaqs = faqItems.filter((item) =>
    matchesFilters(item.status, item.title),
  );
  const filteredArticles = articleItems.filter((item) =>
    matchesFilters(item.status, item.title),
  );
  const filteredTerms = termsItems.filter((item) =>
    matchesFilters(item.status, item.id),
  );
  const filteredPolicies = policyItems.filter((item) =>
    matchesFilters(item.status, item.id),
  );
  const filteredDriverGuidelines = driverGuidelines.filter((item) =>
    matchesFilters(item.status, item.sectionTitle),
  );
  const filteredRiderGuidelines = riderGuidelines.filter((item) =>
    matchesFilters(item.status, item.sectionTitle),
  );

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER: title + search */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">
            Content Management System
          </h1>

          <div className="relative mx-auto flex-1 max-w-[560px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>
        </div>

        {/* MAIN TABS ROW */}
        <section className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap gap-2">
            <MainTabButton
              label="FAQs"
              isActive={activeTab === "faqs"}
              onClick={() => setActiveTab("faqs")}
            />
            <MainTabButton
              label="Help Articles"
              isActive={activeTab === "help"}
              onClick={() => setActiveTab("help")}
            />
            <MainTabButton
              label="Terms & conditions"
              isActive={activeTab === "terms"}
              onClick={() => setActiveTab("terms")}
            />
            <MainTabButton
              label="Privacy policy"
              isActive={activeTab === "policy"}
              onClick={() => setActiveTab("policy")}
            />
            <MainTabButton
              label="Driver guidelines"
              isActive={activeTab === "driver"}
              onClick={() => setActiveTab("driver")}
            />
            <MainTabButton
              label="Rider guidelines"
              isActive={activeTab === "rider"}
              onClick={() => setActiveTab("rider")}
            />
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
                <option value="getting-started">Getting started</option>
                <option value="payments">Payments</option>
                <option value="ride-issues">Ride issues</option>
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <option value="date">Date</option>
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

            {(activeTab === "faqs" ||
              activeTab === "help" ||
              activeTab === "driver" ||
              activeTab === "rider") && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "faqs") setIsFaqModalOpen(true);
                  else if (activeTab === "help") setIsArticleModalOpen(true);
                  else if (activeTab === "driver")
                    setGuidelineModalTab("driver");
                  else if (activeTab === "rider")
                    setGuidelineModalTab("rider");
                }}
                className="h-9 rounded-lg bg-[#2563FF] px-4 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                {activeTab === "faqs" && "Add new FAQ"}
                {activeTab === "help" && "Add article"}
                {(activeTab === "driver" || activeTab === "rider") &&
                  "Add new guideline"}
              </button>
            )}
          </div>

          {/* TABLES */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            {activeTab === "faqs" && (
              <FaqTable
                items={filteredFaqs}
                onRowAction={() => setIsFaqModalOpen(true)}
              />
            )}

            {activeTab === "help" && (
              <ArticlesTable
                items={filteredArticles}
                onRowAction={() => setIsArticleModalOpen(true)}
              />
            )}

            {activeTab === "terms" && (
              <VersionedTable
                items={filteredTerms}
                onRowAction={(item) => setEditingTerms(item)}
              />
            )}

            {activeTab === "policy" && (
              <VersionedTable
                items={filteredPolicies}
                onRowAction={(item) => setEditingPolicy(item)}
              />
            )}

            {activeTab === "driver" && (
              <GuidelinesTable
                items={filteredDriverGuidelines}
                onRowAction={() => setGuidelineModalTab("driver")}
              />
            )}

            {activeTab === "rider" && (
              <GuidelinesTable
                items={filteredRiderGuidelines}
                onRowAction={() => setGuidelineModalTab("rider")}
              />
            )}
          </div>
        </section>
      </div>

      {/* MODALS */}
      {isFaqModalOpen && (
        <AddFaqModal onClose={() => setIsFaqModalOpen(false)} />
      )}

      {isArticleModalOpen && (
        <AddArticleModal onClose={() => setIsArticleModalOpen(false)} />
      )}

      {editingTerms && (
        <RichContentModal
          title="Edit Terms"
          onClose={() => setEditingTerms(null)}
        />
      )}

      {editingPolicy && (
        <RichContentModal
          title="Edit policy"
          onClose={() => setEditingPolicy(null)}
        />
      )}

      {guidelineModalTab && (
        <GuidelineModal
          variant={guidelineModalTab}
          onClose={() => setGuidelineModalTab(null)}
        />
      )}
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  SMALL SHARED COMPONENTS                                                   */
/* -------------------------------------------------------------------------- */

function MainTabButton(props: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const { label, isActive, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-[11px] font-medium ${
        isActive
          ? "bg-[#2563FF] text-white shadow-sm"
          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
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
        isPublished
          ? "border-[#2563FF]/40 bg-[#2563FF]/5 text-[#2563FF]"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  TABLES                                                                    */
/* -------------------------------------------------------------------------- */

function FaqTable(props: {
  items: FAQItem[];
  onRowAction: () => void;
}) {
  const { items, onRowAction } = props;
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
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
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
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
                onClick={onRowAction}
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

function ArticlesTable(props: {
  items: ArticleItem[];
  onRowAction: () => void;
}) {
  const { items, onRowAction } = props;
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
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
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
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
                onClick={onRowAction}
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

function VersionedTable(props: {
  items: VersionedDocItem[];
  onRowAction: (item: VersionedDocItem) => void;
}) {
  const { items, onRowAction } = props;
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
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
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
            </td>
            <td className="px-4 py-2 align-middle">{item.id}</td>
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

function GuidelinesTable(props: {
  items: GuidelineItem[];
  onRowAction: () => void;
}) {
  const { items, onRowAction } = props;
  return (
    <table className="min-w-full text-left text-[11px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
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
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
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
                onClick={onRowAction}
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

function AddFaqModal({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // plug into backend later
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            Add new FAQ
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
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
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            >
              <option value="">Select category</option>
              <option value="getting-started">Getting started</option>
              <option value="payments">Payments</option>
              <option value="ride-issues">Ride issues</option>
            </select>
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

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddArticleModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">
            Add new article
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
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
            <label className="text-[11px] text-slate-600">
              Article category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            >
              <option value="">Select category</option>
              <option value="getting-started">Getting started</option>
              <option value="payments">Payments</option>
              <option value="ride-issues">Ride issues</option>
              <option value="accounts">Accounts</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Used for Terms & conditions and Privacy policy */
function RichContentModal(props: { title: string; onClose: () => void }) {
  const { title, onClose } = props;
  const [content, setContent] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Content</label>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {/* Fake toolbar just for UI */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                <select className="h-7 rounded border border-slate-200 bg-white px-2 text-[11px]">
                  <option>Normal text</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>

                <button type="button" className="font-semibold">
                  B
                </button>
                <button type="button" className="italic">
                  I
                </button>
                <button type="button" className="line-through">
                  S
                </button>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <button type="button">A</button>
                <button type="button">⋮</button>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <button type="button">•</button>
                <button type="button">1.</button>
                <button type="button">↔</button>
                <button type="button">🔗</button>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full resize-none border-0 bg-slate-50 px-3 py-3 text-[12px] text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GuidelineModal(props: {
  variant: "driver" | "rider";
  onClose: () => void;
}) {
  const { variant, onClose } = props;
  const [section, setSection] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onClose();
  };

  const title =
    variant === "driver" ? "Add new guideline" : "Add new guideline";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">Section</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-800 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/10"
              >
                <option value="">Select section</option>
                <option value="professional">Professional Behavior</option>
                <option value="vehicle">Vehicle Requirements</option>
                <option value="pickup">Pickup/Dropoff Rules</option>
              </select>
              <button
                type="button"
                className="h-9 rounded-lg bg-slate-200 px-4 text-[11px] font-semibold text-slate-800 hover:bg-slate-300"
              >
                Add section
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-600">
              Section Content
            </label>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {/* Fake toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                <select className="h-7 rounded border border-slate-200 bg-white px-2 text-[11px]">
                  <option>Normal text</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>

                <button type="button" className="font-semibold">
                  B
                </button>
                <button type="button" className="italic">
                  I
                </button>
                <button type="button" className="line-through">
                  S
                </button>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <button type="button">A</button>
                <button type="button">⋮</button>
                <span className="mx-1 h-4 w-px bg-slate-200" />
                <button type="button">•</button>
                <button type="button">1.</button>
                <button type="button">↔</button>
                <button type="button">🔗</button>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full resize-none border-0 bg-slate-50 px-3 py-3 text-[12px] text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-800 hover:bg-slate-300"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#2563FF] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
