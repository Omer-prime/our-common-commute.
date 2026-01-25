// src/lib/driverDocuments.ts
import { API_URL } from "@/src/lib/api";

export type DriverDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type DriverDocumentType =
  | "GOVERNMENT_ID"
  | "SELFIE"
  | "DRIVER_LICENSE"
  | "VEHICLE_INSURANCE"
  | "VEHICLE_IMAGE"
  | "OTHER";

export type DriverDocument = {
  id?: string;
  type: DriverDocumentType;
  url: string;
  status: DriverDocumentStatus;
  note?: string | null;
  updatedAt?: string | null;
  source?: "V2_ARRAY" | "LEGACY_OBJECT" | "LEGACY_ARRAY";
};

export const DOC_LABEL: Record<DriverDocumentType, string> = {
  GOVERNMENT_ID: "Government ID",
  SELFIE: "Selfie",
  DRIVER_LICENSE: "Driver License",
  VEHICLE_INSURANCE: "Vehicle Insurance",
  VEHICLE_IMAGE: "Vehicle Image",
  OTHER: "Other",
};

export const REQUIRED_DOCS: DriverDocumentType[] = [
  "GOVERNMENT_ID",
  "SELFIE",
  "DRIVER_LICENSE",
  "VEHICLE_INSURANCE",
];

export function toAbsoluteApiUrl(url?: string | null): string | null {
  if (!url) return null;
  const raw = String(url);

  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const base = String(API_URL || "").replace(/\/$/, "");
  const s = raw.replace(/\\/g, "/");

  // if it already contains "/uploads/..", keep from there
  const idx = s.indexOf("/uploads/");
  if (idx >= 0) return `${base}${s.slice(idx)}`;

  if (s.startsWith("/")) return `${base}${s}`;
  if (s.startsWith("uploads/")) return `${base}/${s}`;

  // filename only
  return `${base}/uploads/${s.replace(/^(\.\/)+/, "")}`;
}

export function isLikelyImage(url: string): boolean {
  const u = url.toLowerCase().split("?")[0];
  return /\.(png|jpe?g|webp|gif|bmp)$/i.test(u);
}

function normStatus(s: any): DriverDocumentStatus {
  const v = String(s ?? "PENDING").toUpperCase();
  if (v === "APPROVED") return "VERIFIED";
  if (v === "ACCEPTED") return "VERIFIED";
  if (v === "REJECTED") return "REJECTED";
  if (v === "DECLINED") return "REJECTED";
  if (v === "VERIFIED") return "VERIFIED";
  return "PENDING";
}

function mapKindToType(kind: string): DriverDocumentType | null {
  const k = String(kind || "").toLowerCase();

  if (k.includes("gov") || k.includes("cnic") || k.includes("id")) return "GOVERNMENT_ID";
  if (k.includes("selfie") || k.includes("profile_photo") || k.includes("avatar")) return "SELFIE";
  if (k.includes("license")) return "DRIVER_LICENSE";
  if (k.includes("insurance")) return "VEHICLE_INSURANCE";
  if (k.includes("vehicle_image") || k.includes("car") || k.includes("vehicle")) return "VEHICLE_IMAGE";

  return null;
}

function pushUnique(list: DriverDocument[], doc: DriverDocument) {
  if (!doc?.url) return;
  const key = `${doc.type}::${doc.url}`;
  if (list.some((d) => `${d.type}::${d.url}` === key)) return;
  list.push(doc);
}

/**
 * Supports:
 * - V2: raw.documents / raw.documentsV2 / raw.driverProfile.documentsV2 = [{ id, type, url, status }]
 * - Legacy object: raw.driverProfile.documents = { governmentIdUrl, selfieUrl, licenseUrl, ... }
 * - Legacy array: raw.documents = [{ kind, url, status }]
 */
export function normalizeDriverDocuments(raw: any): DriverDocument[] {
  const out: DriverDocument[] = [];

  // ---- V2 arrays (admin APIs)
  const v2Arr =
    raw?.documentsV2 ||
    raw?.documents ||
    raw?.driverProfile?.documentsV2 ||
    raw?.driver?.documentsV2;

  if (Array.isArray(v2Arr)) {
    for (const d of v2Arr) {
      const type = String(d?.type || d?.docType || "").toUpperCase() as DriverDocumentType;
      const url = toAbsoluteApiUrl(d?.url || d?.path || d?.fileUrl);
      if (!url) continue;

      pushUnique(out, {
        id: d?.id ? String(d.id) : undefined,
        type: (DOC_LABEL as any)[type] ? type : "OTHER",
        url,
        status: normStatus(d?.status),
        note: d?.note ?? null,
        updatedAt: d?.updatedAt ?? d?.createdAt ?? null,
        source: "V2_ARRAY",
      });
    }
  }

  // ---- Legacy array shape (old frontend kinds)
  const legacyArr = raw?.driverDocuments || raw?.kycDocuments;
  if (Array.isArray(legacyArr)) {
    for (const d of legacyArr) {
      const type = mapKindToType(d?.kind || d?.type || d?.docType);
      const url = toAbsoluteApiUrl(d?.url || d?.path || d?.fileUrl);
      if (!type || !url) continue;

      pushUnique(out, {
        type,
        url,
        status: normStatus(d?.status),
        note: d?.note ?? null,
        updatedAt: d?.updatedAt ?? null,
        source: "LEGACY_ARRAY",
      });
    }
  }

  // ---- Legacy object (DriverDocuments table) — note: admin APIs currently do NOT return it
  const legacyObj = raw?.driverProfile?.documents || raw?.documents;
  if (legacyObj && typeof legacyObj === "object" && !Array.isArray(legacyObj)) {
    const pairs: Array<[DriverDocumentType, string[]]> = [
      ["GOVERNMENT_ID", ["governmentIdUrl", "govtIdUrl", "government_id_url"]],
      ["SELFIE", ["selfieUrl", "selfie_url"]],
      ["DRIVER_LICENSE", ["licenseUrl", "driverLicenseUrl", "license_url"]],
      ["VEHICLE_INSURANCE", ["insuranceUrl", "vehicleInsuranceUrl", "insurance_url"]],
      ["VEHICLE_IMAGE", ["vehicleImageUrl", "carImageUrl", "vehicle_image_url"]],
    ];

    for (const [type, keys] of pairs) {
      for (const k of keys) {
        const url = toAbsoluteApiUrl((legacyObj as any)?.[k]);
        if (!url) continue;
        pushUnique(out, { type, url, status: "PENDING", source: "LEGACY_OBJECT" });
        break;
      }
    }
  }

  // newest first (if dates exist)
  out.sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  });

  return out;
}

export function getDoc(docs: DriverDocument[], type: DriverDocumentType) {
  return docs.find((d) => d.type === type) ?? null;
}

export function docsSummary(docs: DriverDocument[], required: DriverDocumentType[] = REQUIRED_DOCS) {
  const present = required.filter((t) => !!getDoc(docs, t)).length;
  const verified = required.filter((t) => getDoc(docs, t)?.status === "VERIFIED").length;
  const rejected = required.filter((t) => getDoc(docs, t)?.status === "REJECTED").length;
  const pending = required.filter((t) => {
    const d = getDoc(docs, t);
    return !!d && d.status === "PENDING";
  }).length;

  return { present, verified, rejected, pending, total: required.length };
}
