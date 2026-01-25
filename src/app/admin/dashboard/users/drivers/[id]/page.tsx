"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/src/components/AdminShell";
import { authedJson } from "@/src/lib/authClient";
import { API_URL } from "@/src/lib/api";
import { CheckCircle2, FileText, XCircle, Trash2 } from "lucide-react";

type DriverDetailsRes = {
  ok: true;
  driver: {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    phone: string | null;
    driverStatus: string;
    avatarUrl: string | null;
    workSiteName: string | null;
    workAddress: string | null;
    homeAddress: string | null;

    // OPTIONAL: if backend returns document URLs directly on driver profile
    govtIdFrontUrl?: string | null;
    govtIdBackUrl?: string | null;
    licenseFrontUrl?: string | null;
    licenseBackUrl?: string | null;
    vehicleRegUrl?: string | null;
    insuranceUrl?: string | null;
    selfieUrl?: string | null;
    proofOfAddressUrl?: string | null;
  };
  stats: {
    totalEarningsCents: number;
    totalRides: number;
    ridesCompleted: number;
    ridesCancelled: number;
  };
  vehicle: null | {
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    licensePlate: string | null;
    seats: number | null;
    imageUrl: string | null;
  };
  documents: Array<{
    id: string;
    type: string;
    url: string | null;
    status: "PENDING" | "VERIFIED" | "REJECTED" | string;
    createdAt: string;
    updatedAt: string;
  }>;
  rides: Array<{
    id: string;
    riderName: string;
    pickup: string | null;
    dropoff: string | null;
    status: string;
    createdAt: string;
  }>;
  revenueSeries: Array<{ day: string; valueCents: number }>;
};

function pickParam(p: unknown): string | null {
  if (!p) return null;
  if (Array.isArray(p)) return p[0] ? String(p[0]) : null;
  return String(p);
}

function assetUrl(u?: string | null) {
  if (!u) return null;
  const raw = String(u);

  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const s = raw.replace(/\\/g, "/");
  const idx = s.indexOf("/uploads/");
  if (idx >= 0) return `${API_URL}${s.slice(idx)}`;

  if (s.startsWith("/")) return `${API_URL}${s}`;
  if (s.startsWith("uploads/")) return `${API_URL}/${s}`;

  // filename only
  return `${API_URL}/uploads/${s.replace(/^(\.\/)+/, "")}`;
}

function prettyDocType(t: string) {
  return String(t || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isImageUrl(u?: string | null) {
  if (!u) return false;
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(u) || u.startsWith("data:image/");
}

function DocStatusPill({ status }: { status: string }) {
  const s = String(status).toUpperCase();
  const cls =
    s === "VERIFIED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : s === "REJECTED"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-[3px] text-[10px] font-medium ${cls}`}>
      {s}
    </span>
  );
}

type DocRow = {
  id?: string; // may be missing for derived docs
  type: string;
  url: string | null;
  status: string;
  updatedAt: string;
  source: "DB" | "PROFILE_FIELD";
};

export default function AdminDriverDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const id = useMemo(() => {
    const anyParams = params as Record<string, unknown>;
    return pickParam(anyParams?.id) || pickParam(anyParams?.driverId) || pickParam(anyParams?.userId) || null;
  }, [params]);

  const [data, setData] = useState<DriverDetailsRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [docUpdatingId, setDocUpdatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    if (!id) {
      setError("Missing driver id in the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authedJson<DriverDetailsRes>(`/admin/users/drivers/${encodeURIComponent(id)}`, {
        method: "GET",
      });
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load driver.");
    } finally {
      setLoading(false);
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
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to update document.");
    } finally {
      setDocUpdatingId(null);
    }
  }

  async function deleteUser() {
    if (!id) return;
    const ok = window.confirm("Delete this driver user? This may remove related records.");
    if (!ok) return;

    setDeleting(true);
    setError(null);
    try {
      await authedJson<{ ok: true }>(`/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.push("/admin/dashboard/users");
    } catch (e: any) {
      setError(e?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  const mergedDocs: DocRow[] = useMemo(() => {
    if (!data) return [];

    const fromDb: DocRow[] = (data.documents ?? []).map((d) => ({
      id: d.id,
      type: d.type,
      url: d.url ?? null,
      status: String(d.status ?? "PENDING"),
      updatedAt: d.updatedAt ?? d.createdAt ?? new Date().toISOString(),
      source: "DB",
    }));

    // If backend returns document URLs directly on driver profile (optional)
    const dr = data.driver as any;
    const profileFields: Array<{ key: string; type: string }> = [
      { key: "govtIdFrontUrl", type: "GOVT_ID_FRONT" },
      { key: "govtIdBackUrl", type: "GOVT_ID_BACK" },
      { key: "licenseFrontUrl", type: "DRIVER_LICENSE_FRONT" },
      { key: "licenseBackUrl", type: "DRIVER_LICENSE_BACK" },
      { key: "vehicleRegUrl", type: "VEHICLE_REGISTRATION" },
      { key: "insuranceUrl", type: "INSURANCE" },
      { key: "selfieUrl", type: "SELFIE" },
      { key: "proofOfAddressUrl", type: "PROOF_OF_ADDRESS" },
    ];

    const fromFields: DocRow[] = profileFields
      .map((f) => {
        const v = dr?.[f.key];
        if (!v) return null;
        return {
          type: f.type,
          url: v as string,
          status: "PENDING",
          updatedAt: data.driver.updatedAt,
          source: "PROFILE_FIELD" as const,
        };
      })
      .filter(Boolean) as DocRow[];

    // Merge without duplicates (same url/type)
    const out: DocRow[] = [];
    const seen = new Set<string>();
    for (const d of [...fromDb, ...fromFields]) {
      const k = `${String(d.type)}::${String(d.url ?? "")}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(d);
    }

    // sort newest first
    out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return out;
  }, [data]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <AdminShell>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>

          <h1 className="text-[15px] font-semibold text-slate-900">
            Driver details {id ? <span className="text-slate-400">#{id.slice(0, 8)}</span> : null}
          </h1>

          <button
            onClick={load}
            className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>

          <button
            onClick={deleteUser}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-xs text-slate-500">Loading...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-xs text-red-700">{error}</div>
        ) : !data ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-xs text-slate-500">No data.</div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-xs text-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {data.driver.avatarUrl ? (
                  <img
                    src={assetUrl(data.driver.avatarUrl) ?? ""}
                    alt="avatar"
                    className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full border border-slate-200 bg-slate-50" />
                )}

                <div>
                  <div className="text-sm font-semibold text-slate-900">{data.driver.fullName}</div>
                  <div className="text-slate-500">{data.driver.email}</div>
                  <div className="mt-2 text-slate-500">
                    Status: <span className="font-medium text-slate-700">{data.driver.driverStatus}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] text-slate-500">Total rides</div>
                  <div className="text-sm font-semibold text-slate-900">{data.stats.totalRides}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] text-slate-500">Completed</div>
                  <div className="text-sm font-semibold text-slate-900">{data.stats.ridesCompleted}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] text-slate-500">Cancelled</div>
                  <div className="text-sm font-semibold text-slate-900">{data.stats.ridesCancelled}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] text-slate-500">Earnings</div>
                  <div className="text-sm font-semibold text-slate-900">
                    ${(data.stats.totalEarningsCents / 100).toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            {/* DOCUMENTS */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold text-slate-900">Uploaded documents</div>
                <div className="text-[10px] text-slate-400">
                  Returned by API: <span className="font-mono">{data.documents?.length ?? 0}</span>
                </div>
              </div>

              <div className="mt-2 overflow-hidden rounded-xl border border-slate-100">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Updated</th>
                      <th className="px-3 py-2 font-medium">Preview</th>
                      <th className="px-3 py-2 font-medium">URL (debug)</th>
                      <th className="px-3 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mergedDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
                          <div className="font-medium">No documents available in this API response.</div>
                          <div className="mt-1 text-[10px] text-slate-400">
                            Your files in <span className="font-mono">/uploads</span> will NOT show here unless the backend stores
                            document URLs in DB and returns them from <span className="font-mono">GET /admin/users/drivers/:id</span>{" "}
                            (and/or <span className="font-mono">GET /admin/users/documents</span>).
                          </div>
                        </td>
                      </tr>
                    ) : (
                      mergedDocs.map((doc, idx) => {
                        const url = assetUrl(doc.url);
                        const busy = doc.id ? docUpdatingId === doc.id : false;

                        return (
                          <tr key={`${doc.id ?? doc.type}-${idx}`}>
                            <td className="px-3 py-2">
                              <div>{prettyDocType(doc.type)}</div>
                              <div className="text-[10px] text-slate-400">Source: {doc.source}</div>
                            </td>

                            <td className="px-3 py-2">
                              <DocStatusPill status={doc.status} />
                            </td>

                            <td className="px-3 py-2">{new Date(doc.updatedAt).toLocaleString("en-GB")}</td>

                            <td className="px-3 py-2">
                              {url && isImageUrl(url) ? (
                                <img
                                  src={url}
                                  alt="doc preview"
                                  className="h-10 w-16 rounded-md border border-slate-200 object-cover"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-400">—</span>
                              )}
                            </td>

                            <td className="px-3 py-2">
                              <div className="max-w-[280px] truncate font-mono text-[10px] text-slate-500">
                                {String(doc.url ?? "null")}
                              </div>
                            </td>

                            <td className="px-3 py-2 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                  onClick={() => url && window.open(url, "_blank")}
                                  disabled={!url}
                                >
                                  <FileText className="h-4 w-4" />
                                  View
                                </button>

                                {/* Verify/Reject only if document has a real DB id */}
                                <button
                                  type="button"
                                  disabled={!doc.id || busy || String(doc.status).toUpperCase() === "VERIFIED"}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                  onClick={() => doc.id && updateDocStatus(doc.id, "VERIFIED")}
                                  title={!doc.id ? "This doc has no DB id (backend must store it as a document record)." : "Verify"}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Verify
                                </button>

                                <button
                                  type="button"
                                  disabled={!doc.id || busy || String(doc.status).toUpperCase() === "REJECTED"}
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                                  onClick={() => doc.id && updateDocStatus(doc.id, "REJECTED")}
                                  title={!doc.id ? "This doc has no DB id (backend must store it as a document record)." : "Reject"}
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
              </div>
            </div>

            {/* RECENT RIDES */}
            <div className="mt-6">
              <div className="text-[12px] font-semibold text-slate-900">Recent rides</div>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-100">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Rider</th>
                      <th className="px-3 py-2 font-medium">Pickup</th>
                      <th className="px-3 py-2 font-medium">Dropoff</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.rides.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                          No rides found.
                        </td>
                      </tr>
                    ) : (
                      data.rides.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2">{r.riderName}</td>
                          <td className="px-3 py-2">{r.pickup ?? "-"}</td>
                          <td className="px-3 py-2">{r.dropoff ?? "-"}</td>
                          <td className="px-3 py-2">{r.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
