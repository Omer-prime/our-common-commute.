// src/app/admin/dashboard/users/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/src/components/AdminShell";
import {
  Search,
  SlidersHorizontal,
  MoreVertical,
  Users,
  UserCheck,
  BadgeCheck,
  Ban,
  FileText,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { authedJson } from "@/src/lib/authClient";
import { API_URL } from "@/src/lib/api";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type OverviewRes = {
  ok: true;
  stats: {
    totalUsers: number;
    usersUnderReview: number;
    verifiedDrivers: number;
    suspendedDrivers: number;
  };
  topEarningDrivers: Array<{ name: string; valueCents: number }>;
};

type ListRes = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    role: "DRIVER" | "RIDER";
    status: string;
    lastActivity: string;
  }>;
};

type DocListRes = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  documents: Array<{
    id: string;
    type: string;
    url: string | null;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    createdAt: string;
    updatedAt: string;
    driver: {
      // some APIs return userId, some return id — handle both safely
      userId?: string;
      id?: string;
      fullName: string;
      email: string;
    };
  }>;
};

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB");
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((Number.isFinite(cents) ? cents : 0) / 100);
}

/**
 * Robust URL resolver:
 * - supports: full http(s), "/uploads/..", "uploads/..", "filename.jpg", "C:\\...\\uploads\\x.jpg"
 * - if only filename provided -> assumes it lives under /uploads/
 */
function assetUrl(u?: string | null) {
  if (!u) return null;
  const raw = String(u);

  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  // normalize slashes
  const s = raw.replace(/\\/g, "/");

  // if an absolute FS path accidentally stored, extract from "/uploads/.."
  const idx = s.indexOf("/uploads/");
  if (idx >= 0) return `${API_URL}${s.slice(idx)}`;

  // already absolute path in API
  if (s.startsWith("/")) return `${API_URL}${s}`;

  // "uploads/..." (no leading slash)
  if (s.startsWith("uploads/")) return `${API_URL}/${s}`;

  // filename only -> assume it’s in /uploads/
  return `${API_URL}/uploads/${s.replace(/^(\.\/)+/, "")}`;
}

function prettyDocType(t: string) {
  return String(t || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function isImageUrl(u?: string | null) {
  if (!u) return false;
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(u) || u.startsWith("data:image/");
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminUsersPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"all" | "riders" | "drivers" | "documents">("all");

  // IMPORTANT: default to ALL so you don’t get “empty” due to status mismatch
  const [docsStatus, setDocsStatus] = useState<"PENDING" | "VERIFIED" | "REJECTED" | "ALL">("ALL");

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 350);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [overview, setOverview] = useState<OverviewRes | null>(null);
  const [list, setList] = useState<ListRes | null>(null);
  const [docList, setDocList] = useState<DocListRes | null>(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const openMenuRef = useRef<HTMLDivElement | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<null | { id: string; fullName: string; role: "DRIVER" | "RIDER" }>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const [docUpdatingId, setDocUpdatingId] = useState<string | null>(null);

  const listReqSeq = useRef(0);
  const ovReqSeq = useRef(0);

  const isDocs = activeTab === "documents";
  const total = (isDocs ? docList?.total : list?.total) ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const users = list?.users ?? [];

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (openMenuRef.current && openMenuRef.current.contains(el)) return;
      setOpenMenuId(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenuId(null);
    }
    function onScroll() {
      setOpenMenuId(null);
    }

    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true } as any);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, { capture: true } as any);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, docsStatus, debouncedQ]);

  const loadOverview = useCallback(async () => {
    const seq = ++ovReqSeq.current;
    setLoadingOverview(true);
    setError(null);

    try {
      const ov = await authedJson<OverviewRes>("/admin/users/overview", { method: "GET" });
      if (seq !== ovReqSeq.current) return;
      setOverview(ov);
    } catch (e: any) {
      if (seq !== ovReqSeq.current) return;
      const msg = e?.error || e?.message || (typeof e === "string" ? e : "Failed to load overview");
      setError(String(msg));
      setOverview(null);
    } finally {
      if (seq === ovReqSeq.current) setLoadingOverview(false);
    }
  }, []);

  const loadList = useCallback(
    async (args: { tab: typeof activeTab; status: typeof docsStatus; q: string; page: number }) => {
      const seq = ++listReqSeq.current;
      setLoadingList(true);
      setError(null);

      try {
        if (args.tab === "documents") {
          const qs = new URLSearchParams();
          if (args.q) qs.set("q", args.q);
          qs.set("page", String(args.page));
          qs.set("limit", String(limit));

          // Only send status if not ALL
          if (args.status !== "ALL") qs.set("status", args.status);

          const docs = await authedJson<DocListRes>(`/admin/users/documents?${qs.toString()}`, { method: "GET" });
          if (seq !== listReqSeq.current) return;

          setDocList(docs);
          setList(null);
        } else {
          const li = await authedJson<ListRes>(
            `/admin/users/list?tab=${encodeURIComponent(args.tab)}&q=${encodeURIComponent(args.q)}&page=${args.page}&limit=${limit}`,
            { method: "GET" }
          );
          if (seq !== listReqSeq.current) return;

          setList(li);
          setDocList(null);
        }
      } catch (e: any) {
        if (seq !== listReqSeq.current) return;
        const msg = e?.error || e?.message || (typeof e === "string" ? e : "Failed to load users");
        setError(String(msg));
        setList(null);
        setDocList(null);
      } finally {
        if (seq === listReqSeq.current) setLoadingList(false);
      }
    },
    [limit]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([loadOverview(), loadList({ tab: activeTab, status: docsStatus, q: debouncedQ, page })]);
  }, [activeTab, debouncedQ, docsStatus, loadList, loadOverview, page]);

  useEffect(() => {
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadList({ tab: activeTab, status: docsStatus, q: debouncedQ, page });
  }, [activeTab, docsStatus, debouncedQ, page, loadList]);

  const openDetails = useCallback(
    (u: ListRes["users"][number]) => {
      if (u.role === "RIDER") router.push(`/admin/dashboard/users/riders/${u.id}`);
      else router.push(`/admin/dashboard/users/drivers/${u.id}`);
    },
    [router]
  );

  const toggleMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  async function deleteUserNow() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);

    try {
      await authedJson<{ ok: true }>(`/admin/users/${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" });
      setDeleteTarget(null);
      setOpenMenuId(null);
      await refreshAll();
    } catch (e: any) {
      const msg = e?.error || e?.message || "Delete failed";
      setError(String(msg));
    } finally {
      setDeleting(false);
    }
  }

  async function updateDocStatus(docId: string, status: "VERIFIED" | "REJECTED") {
    setDocUpdatingId(docId);
    setError(null);
    try {
      await authedJson<{ ok: true }>(`/admin/users/documents/${encodeURIComponent(docId)}`, {
        method: "PATCH",
        json: { status },
      });
      await refreshAll();
    } catch (e: any) {
      const msg = e?.error || e?.message || "Failed to update document";
      setError(String(msg));
    } finally {
      setDocUpdatingId(null);
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-center gap-6">
          <h1 className="text-[15px] font-semibold text-slate-900">User management</h1>

          <div className="relative mx-auto flex-1 max-w-[560px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder={isDocs ? "Search by driver name/email" : "Search by name or email"}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Review driver documents"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            Documents
          </button>
        </div>

        {/* ERROR BOX */}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[12px] text-red-700">
            <div className="font-semibold">Action failed</div>
            <div className="mt-1 opacity-90">{error}</div>
            <div className="mt-2 text-[11px] text-red-700/80">
              API base: <span className="font-medium">{API_URL}</span>
            </div>
            <button
              onClick={() => void refreshAll()}
              className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* TOP STATS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Users" value={loadingOverview ? "..." : String(overview?.stats.totalUsers ?? 0)} Icon={Users} />
          <StatCard
            title="Users under review"
            value={loadingOverview ? "..." : String(overview?.stats.usersUnderReview ?? 0)}
            Icon={UserCheck}
          />
          <StatCard
            title="Verified drivers"
            value={loadingOverview ? "..." : String(overview?.stats.verifiedDrivers ?? 0)}
            Icon={BadgeCheck}
          />
          <StatCard
            title="Suspended driver"
            value={loadingOverview ? "..." : String(overview?.stats.suspendedDrivers ?? 0)}
            Icon={Ban}
          />
        </div>

        {/* TOP EARNING DRIVER */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-[13px] font-semibold text-slate-900">Top earning driver</h2>
          <p className="mb-2 text-[11px] text-slate-400">Monthly</p>
          <TopEarningDriverChart data={overview?.topEarningDrivers ?? []} />
        </section>

        {/* USERS / DOCS TABLE */}
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
              <TabButton label="All users" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
              <TabButton label="Riders" active={activeTab === "riders"} onClick={() => setActiveTab("riders")} />
              <TabButton label="Drivers" active={activeTab === "drivers"} onClick={() => setActiveTab("drivers")} />
              <TabButton label="Documents" active={activeTab === "documents"} onClick={() => setActiveTab("documents")} />
            </div>

            <div className="flex items-center gap-2">
              {isDocs ? (
                <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
                  <TabButton label="Pending" active={docsStatus === "PENDING"} onClick={() => setDocsStatus("PENDING")} />
                  <TabButton label="Verified" active={docsStatus === "VERIFIED"} onClick={() => setDocsStatus("VERIFIED")} />
                  <TabButton label="Rejected" active={docsStatus === "REJECTED"} onClick={() => setDocsStatus("REJECTED")} />
                  <TabButton label="All" active={docsStatus === "ALL"} onClick={() => setDocsStatus("ALL")} />
                </div>
              ) : null}

              <div className="relative w-48">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-[#2563FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563FF]/15"
                />
              </div>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
                title="Filters (UI only)"
              >
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-100">
            <div className="w-full overflow-x-auto">
              {!isDocs ? (
                <table className="min-w-[920px] w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2">
                        <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                      </th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">User ID</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Name</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Role</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Email address</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Status</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Last activity</th>
                      <th className="px-4 py-2 font-medium text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                    {!loadingList && users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                          No users found.
                        </td>
                      </tr>
                    ) : loadingList ? (
                      <LoadingRows cols={8} rows={6} />
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2">
                            <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                          </td>

                          <td className="px-4 py-2 align-middle whitespace-nowrap">#{u.id.slice(0, 8)}</td>
                          <td className="px-4 py-2 align-middle whitespace-nowrap">{u.fullName}</td>
                          <td className="px-4 py-2 align-middle whitespace-nowrap">{u.role === "DRIVER" ? "Driver" : "Rider"}</td>
                          <td className="px-4 py-2 align-middle whitespace-nowrap">{u.email}</td>
                          <td className="px-4 py-2 align-middle whitespace-nowrap">
                            <StatusPill status={u.status} />
                          </td>
                          <td className="px-4 py-2 align-middle whitespace-nowrap">{fmtDate(u.lastActivity)}</td>

                          <td className="px-4 py-2 align-middle text-right whitespace-nowrap">
                            <div
                              className="relative inline-block"
                              ref={(node) => {
                                if (openMenuId === u.id) openMenuRef.current = node;
                              }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(u.id);
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
                                title="Actions"
                              >
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </button>

                              {openMenuId === u.id ? (
                                <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      openDetails(u);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-slate-700 hover:bg-slate-50"
                                  >
                                    <Eye className="h-4 w-4 text-slate-500" />
                                    View profile
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeleteTarget({ id: u.id, fullName: u.fullName, role: u.role });
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete user
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-[1060px] w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Driver</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Email</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Document</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Status</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Updated</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">Preview</th>
                      <th className="px-4 py-2 font-medium text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {!loadingList && (docList?.documents?.length ?? 0) === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                          <div className="font-medium">No documents found.</div>
                          <div className="mt-1 text-[10px] text-slate-400">
                            If files exist inside <span className="font-mono">/uploads</span> but nothing appears here,
                            your backend is not returning document records in <span className="font-mono">GET /admin/users/documents</span>.
                          </div>
                        </td>
                      </tr>
                    ) : loadingList ? (
                      <LoadingRows cols={7} rows={6} />
                    ) : (
                      (docList?.documents ?? []).map((d) => {
                        const url = assetUrl(d.url);
                        const driverUserId = d.driver.userId || d.driver.id || "";
                        return (
                          <tr key={d.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="font-medium text-slate-800">{d.driver.fullName}</div>
                              <div className="text-[10px] text-slate-400">UserId: {driverUserId ? driverUserId.slice(0, 10) : "—"}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">{d.driver.email}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div>{prettyDocType(d.type)}</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[300px]">
                                {String(d.url ?? "null")}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <DocStatusPill status={d.status} />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">{fmtDateTime(d.updatedAt)}</td>

                            <td className="px-4 py-2 whitespace-nowrap">
                              {url && isImageUrl(url) ? (
                                <img
                                  src={url}
                                  alt="doc preview"
                                  className="h-9 w-14 rounded-md border border-slate-200 object-cover"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400">—</span>
                              )}
                            </td>

                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-100"
                                  onClick={() => {
                                    if (!driverUserId) return;
                                    router.push(`/admin/dashboard/users/drivers/${driverUserId}`);
                                  }}
                                  title="Open driver profile"
                                >
                                  <Eye className="h-4 w-4" />
                                  Profile
                                </button>

                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                  onClick={() => {
                                    if (url) window.open(url, "_blank");
                                  }}
                                  disabled={!url}
                                >
                                  <FileText className="h-4 w-4" />
                                  View
                                </button>

                                <button
                                  type="button"
                                  disabled={docUpdatingId === d.id || d.status === "VERIFIED"}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                  onClick={() => void updateDocStatus(d.id, "VERIFIED")}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Verify
                                </button>

                                <button
                                  type="button"
                                  disabled={docUpdatingId === d.id || d.status === "REJECTED"}
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                                  onClick={() => void updateDocStatus(d.id, "REJECTED")}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              Page{" "}
              <span className="font-medium text-slate-700">{(isDocs ? docList?.page : list?.page) ?? 1}</span> of{" "}
              <span className="font-medium text-slate-700">{totalPages}</span> · Total{" "}
              <span className="font-medium text-slate-700">{total}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loadingList}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages || loadingList}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* DELETE CONFIRM MODAL */}
        {deleteTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="text-sm font-semibold text-slate-900">Delete user?</div>
              <div className="mt-2 text-[12px] text-slate-600">
                You are deleting <span className="font-medium text-slate-900">{deleteTarget.fullName}</span>. This can remove related records too.
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void deleteUserNow()}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  UI HELPERS                                                                */
/* -------------------------------------------------------------------------- */

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-xs font-medium ${
        active ? "bg-[#2563FF] text-white shadow-sm" : "text-slate-500 hover:bg-slate-200/80"
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || "").toLowerCase();
  const cls =
    s.includes("suspend") || s.includes("bann")
      ? "border-red-200 bg-red-50 text-red-700"
      : s.includes("review") || s.includes("pending")
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : s.includes("active") || s.includes("verified")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-[3px] text-[10px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

function DocStatusPill({ status }: { status: "PENDING" | "VERIFIED" | "REJECTED" }) {
  const cls =
    status === "VERIFIED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "REJECTED"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-[3px] text-[10px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

function StatCard({
  title,
  value,
  Icon,
}: {
  title: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div>
        <p className="text-[10px] text-slate-400">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>

      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function LoadingRows({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={`sk-${r}`} className="animate-pulse">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={`sk-${r}-${c}`} className="px-4 py-3">
              <div className="h-3 w-full rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function TopEarningDriverChart({ data }: { data: Array<{ name: string; valueCents: number }> }) {
  const bars = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];
    arr.sort((a, b) => (b.valueCents ?? 0) - (a.valueCents ?? 0));
    return arr.slice(0, 12);
  }, [data]);

  const max = Math.max(1, ...bars.map((b) => Number(b.valueCents) || 0));
  const barAreaHeight = 160;
  const top = Math.max(0, ...bars.map((b) => Number(b.valueCents) || 0));

  if (bars.length === 0) return <p className="text-[11px] text-slate-400">No earnings data yet.</p>;

  return (
    <div className="mt-1">
      <div className="relative h-56">
        <div className="absolute left-0 right-0 top-8 border-t border-dashed border-slate-200" />
        <span className="absolute right-0 top-3 text-[11px] font-medium text-[#2563FF]">{money(top)}</span>

        <div className="absolute inset-x-0 bottom-4 flex h-[160px] items-end justify-between px-1">
          {bars.map((item, idx) => {
            const v = Number(item.valueCents) || 0;
            const barHeight = (v / max) * barAreaHeight;
            const highlight = idx === 0;

            return (
              <div key={`${item.name}-${idx}`} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-6 items-end justify-center">
                  <div className={`w-full rounded-t-full ${highlight ? "bg-[#2563FF]" : "bg-[#E4ECFF]"}`} style={{ height: barHeight }} />
                </div>
                <span className="mt-1 text-[10px] text-slate-500">{String(item.name || "").split(" ")[0] || "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
