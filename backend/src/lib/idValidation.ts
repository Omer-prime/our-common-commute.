import fs from "fs";
import sharp from "sharp";

// OPTIONAL OCR (install tesseract.js if you want this)
let Tesseract: any = null;
async function getTesseract() {
  if (Tesseract) return Tesseract;
  try {
    // dynamic import so project still runs if not installed
    const mod = await import("tesseract.js");
    Tesseract = mod.default ?? mod;
    return Tesseract;
  } catch {
    return null;
  }
}

export type IdValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

function hasEnoughText(txt: string) {
  const t = txt.toUpperCase().replace(/\s+/g, " ").trim();
  if (t.length < 30) return false;

  // common ID keywords (not perfect, but catches random photos)
  const keywords = ["ID", "IDENTITY", "PASSPORT", "LICENSE", "DRIVER", "NATIONAL", "CARD"];
  const keywordHit = keywords.some((k) => t.includes(k));

  // MRZ-like pattern (passports often contain <<<)
  const mrzHit = /[A-Z0-9<]{20,}/.test(t) && t.includes("<");

  // has digits (IDs always contain digits)
  const digitHit = /\d{4,}/.test(t);

  return (keywordHit && digitHit) || mrzHit;
}

export async function validateGovernmentId(filePath: string): Promise<IdValidationResult> {
  // File size checks
  const st = fs.statSync(filePath);
  if (st.size < 30_000) return { ok: false, reason: "FILE_TOO_SMALL" }; // too tiny = usually not an ID
  if (st.size > 7 * 1024 * 1024) return { ok: false, reason: "FILE_TOO_LARGE" };

  // Basic image checks
  const meta = await sharp(filePath).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;

  if (w < 700 || h < 450) return { ok: false, reason: "LOW_RESOLUTION" };

  // Optional OCR check (recommended)
  const enableOcr = process.env.ENABLE_ID_OCR === "true";
  if (enableOcr) {
    const tesseract = await getTesseract();
    if (!tesseract) return { ok: false, reason: "OCR_NOT_AVAILABLE" };

    const { data } = await tesseract.recognize(filePath, "eng");
    const text = String(data?.text ?? "");

    if (!hasEnoughText(text)) return { ok: false, reason: "TEXT_NOT_ID_LIKE" };
  }

  return { ok: true };
}

export async function validateSelfie(filePath: string): Promise<IdValidationResult> {
  // Just basic checks (real “liveness” needs a provider)
  const meta = await sharp(filePath).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 500 || h < 500) return { ok: false, reason: "LOW_RESOLUTION" };
  return { ok: true };
}
