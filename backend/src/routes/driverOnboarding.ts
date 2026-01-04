// backend/src/routes/driverOnboarding.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const r = Router();

function requireDriver(req: any, res: any, next: any) {
  if (req.user?.role !== "DRIVER") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

function unlinkSafe(p: string) {
  try {
    fs.unlinkSync(p);
  } catch {}
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 7 * 1024 * 1024 }, // 7MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("INVALID_FILE_TYPE"));
    cb(null, true);
  }
});

function driverNextPath(step: number, completedAt: Date | null) {
  if (completedAt) return "/driver/dashboard";
  switch (step) {
    case 1: return "/driver/onboarding/basic-details";
    case 2: return "/driver/onboarding/identity-id";
    case 3: return "/driver/onboarding/identity-selfie";
    case 4: return "/driver/onboarding/vehicle-docs";
    case 5: return "/driver/onboarding/vehicle-info";
    case 6: return "/driver/onboarding/work-schedule";
    case 7: return "/driver/onboarding/availability";
    case 8: return "/driver/onboarding/payout";
    case 9: return "/driver/onboarding/safety";
    default: return "/driver/onboarding/basic-details";
  }
}

async function analyzeBasicImage(filePath: string) {
  // rotate() applies EXIF orientation if present
  const img = sharp(filePath).rotate();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error("BAD_IMAGE");

  const stats = await img.stats();
  const r = stats.channels[0]?.mean ?? 0;
  const g = stats.channels[1]?.mean ?? 0;
  const b = stats.channels[2]?.mean ?? 0;
  const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return { width: meta.width, height: meta.height, brightness };
}

async function validateGovernmentId(filePath: string) {
  const { width, height, brightness } = await analyzeBasicImage(filePath);

  // ✅ FIX: normalize ratio so portrait photos don't auto-fail
  const ratio = Math.max(width, height) / Math.min(width, height);

  if (Math.min(width, height) < 600) {
    return { ok: false as const, error: "ID_TOO_SMALL", message: "ID image is too small. Upload a clear close photo." };
  }

  // Keep it as a "light heuristic" only
  if (ratio < 1.15 || ratio > 2.8) {
    return { ok: false as const, error: "ID_WRONG_ASPECT", message: "Upload a clear close photo of your government ID (crop so the card fills most of the frame)." };
  }

  if (brightness < 35) {
    return { ok: false as const, error: "ID_TOO_DARK", message: "ID image is too dark. Retake in better light." };
  }
  if (brightness > 240) {
    return { ok: false as const, error: "ID_TOO_BRIGHT", message: "ID image is overexposed/glare. Retake with less flash." };
  }

  return { ok: true as const };
}

async function validateSelfie(filePath: string) {
  const { width, height, brightness } = await analyzeBasicImage(filePath);

  if (Math.min(width, height) < 480) {
    return { ok: false as const, error: "SELFIE_TOO_SMALL", message: "Selfie is too small/low-res. Retake." };
  }

  // (slightly more forgiving than before)
  if (brightness < 25) {
    return { ok: false as const, error: "SELFIE_TOO_DARK", message: "Selfie looks too dark. Retake in good lighting." };
  }
  if (brightness > 245) {
    return { ok: false as const, error: "SELFIE_TOO_BRIGHT", message: "Selfie is overexposed. Retake with softer lighting." };
  }

  return { ok: true as const };
}

// STATUS
r.get("/status", requireAuth, requireDriver, async (req: any, res) => {
  const profile = await prisma.driverProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ error: "PROFILE_NOT_FOUND" });

  return res.json({
    step: profile.onboardingStep,
    completed: !!profile.onboardingCompletedAt,
    nextPath: driverNextPath(profile.onboardingStep, profile.onboardingCompletedAt)
  });
});

// STEP 1
r.put("/basic-details", requireAuth, requireDriver, async (req: any, res) => {
  const { phone, fullName } = req.body as { phone?: string; fullName?: string };

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { ...(fullName ? { fullName } : {}) }
  });

  const profile = await prisma.driverProfile.update({
    where: { userId: req.user.id },
    data: { phone: phone ?? null, onboardingStep: 2 }
  });

  res.json({ ok: true, user, profile, nextPath: driverNextPath(2, profile.onboardingCompletedAt) });
});

// STEP 2: ID upload
r.post("/identity-id", requireAuth, requireDriver, upload.single("file"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "FILE_REQUIRED", message: "Please upload your ID image." });

  const fullPath = path.join(uploadDir, req.file.filename);

  try {
    const check = await validateGovernmentId(fullPath);
    if (!check.ok) {
      unlinkSafe(fullPath);
      return res.status(400).json({ error: check.error, message: check.message });
    }

    const url = `/uploads/${req.file.filename}`;

    const profile = await prisma.driverProfile.update({
      where: { userId: req.user.id },
      data: {
        onboardingStep: 3,
        documents: { upsert: { create: { governmentIdUrl: url }, update: { governmentIdUrl: url } } }
      },
      include: { documents: true }
    });

    res.json({ ok: true, url, nextPath: driverNextPath(3, profile.onboardingCompletedAt) });
  } catch {
    unlinkSafe(fullPath);
    return res.status(400).json({ error: "BAD_IMAGE", message: "Invalid image. Please upload a clear photo of your ID." });
  }
});

// STEP 3: Selfie upload
r.post("/identity-selfie", requireAuth, requireDriver, upload.single("file"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "FILE_REQUIRED", message: "Please take and upload a selfie." });

  const fullPath = path.join(uploadDir, req.file.filename);

  try {
    const check = await validateSelfie(fullPath);
    if (!check.ok) {
      unlinkSafe(fullPath);
      return res.status(400).json({ error: check.error, message: check.message });
    }

    const url = `/uploads/${req.file.filename}`;

    const profile = await prisma.driverProfile.update({
      where: { userId: req.user.id },
      data: {
        onboardingStep: 4,
        documents: { upsert: { create: { selfieUrl: url }, update: { selfieUrl: url } } }
      },
      include: { documents: true }
    });

    res.json({ ok: true, url, nextPath: driverNextPath(4, profile.onboardingCompletedAt) });
  } catch {
    unlinkSafe(fullPath);
    return res.status(400).json({ error: "BAD_IMAGE", message: "Invalid selfie image. Please retake." });
  }
});

// STEP 4: Vehicle docs
r.post(
  "/vehicle-docs",
  requireAuth,
  requireDriver,
  upload.fields([{ name: "license", maxCount: 1 }, { name: "insurance", maxCount: 1 }, { name: "vehicleImage", maxCount: 1 }]),
  async (req: any, res) => {
    const files = req.files as Record<string, Express.Multer.File[]>;
    const license = files?.license?.[0] ? `/uploads/${files.license[0].filename}` : null;
    const insurance = files?.insurance?.[0] ? `/uploads/${files.insurance[0].filename}` : null;
    const vehicleImage = files?.vehicleImage?.[0] ? `/uploads/${files.vehicleImage[0].filename}` : null;

    const profile = await prisma.driverProfile.update({
      where: { userId: req.user.id },
      data: {
        onboardingStep: 5,
        documents: {
          upsert: {
            create: { licenseUrl: license ?? undefined, insuranceUrl: insurance ?? undefined, vehicleImageUrl: vehicleImage ?? undefined },
            update: { licenseUrl: license ?? undefined, insuranceUrl: insurance ?? undefined, vehicleImageUrl: vehicleImage ?? undefined }
          }
        }
      }
    });

    res.json({ ok: true, nextPath: driverNextPath(5, profile.onboardingCompletedAt) });
  }
);

// STEP 5
r.put("/vehicle-info", requireAuth, requireDriver, async (req: any, res) => {
  const { make, model, year, color, licensePlate, seats } = req.body;

  const profile = await prisma.driverProfile.update({
    where: { userId: req.user.id },
    data: {
      onboardingStep: 6,
      vehicle: {
        upsert: {
          create: { make, model, year: year ? Number(year) : null, color, licensePlate, seats: seats ? Number(seats) : null },
          update: { make, model, year: year ? Number(year) : null, color, licensePlate, seats: seats ? Number(seats) : null }
        }
      }
    }
  });

  res.json({ ok: true, nextPath: driverNextPath(6, profile.onboardingCompletedAt) });
});

// STEP 6
r.put("/work-schedule", requireAuth, requireDriver, async (req: any, res) => {
  const { primaryWorkLocation, workDays, shiftStart, shiftEnd } = req.body;

  const profile = await prisma.driverProfile.update({
    where: { userId: req.user.id },
    data: {
      onboardingStep: 7,
      primaryWorkLocation: primaryWorkLocation ?? null,
      workDays: Array.isArray(workDays) ? workDays : [],
      shiftStart: shiftStart ?? null,
      shiftEnd: shiftEnd ?? null
    }
  });

  res.json({ ok: true, nextPath: driverNextPath(7, profile.onboardingCompletedAt) });
});

// STEP 7
r.put("/availability", requireAuth, requireDriver, async (req: any, res) => {
  const { detourMiles, rideDirection } = req.body;

  const profile = await prisma.driverProfile.update({
    where: { userId: req.user.id },
    data: {
      onboardingStep: 8,
      detourMiles: detourMiles ? Number(detourMiles) : null,
      rideDirection: rideDirection ?? null
    }
  });

  res.json({ ok: true, nextPath: driverNextPath(8, profile.onboardingCompletedAt) });
});

// STEP 8
r.put("/payout", requireAuth, requireDriver, async (req: any, res) => {
  const { payoutMethod, accountNumber, accountName, bankName, swiftCode } = req.body;

  const profile = await prisma.driverProfile.update({
    where: { userId: req.user.id },
    data: {
      onboardingStep: 9,
      payoutMethod: payoutMethod ?? null,
      payoutAccountNumber: accountNumber ?? null,
      payoutAccountName: accountName ?? null,
      payoutBankName: bankName ?? null,
      payoutSwiftCode: swiftCode ?? null
    }
  });

  res.json({ ok: true, nextPath: driverNextPath(9, profile.onboardingCompletedAt) });
});

// STEP 9
r.put("/safety", requireAuth, requireDriver, async (req: any, res) => {
  const { accepted } = req.body as { accepted: boolean };
  if (!accepted) return res.status(400).json({ error: "MUST_ACCEPT" });

  const profile = await prisma.driverProfile.update({
    where: { userId: req.user.id },
    data: { onboardingCompletedAt: new Date() }
  });

  res.json({ ok: true, nextPath: driverNextPath(profile.onboardingStep, profile.onboardingCompletedAt) });
});

export default r;
