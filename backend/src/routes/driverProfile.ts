// backend/src/routes/driverProfile.ts
import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireDriver } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { randomUUID } from "crypto";

export const driverProfileRouter = Router();

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = (file.originalname || "upload")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .slice(0, 120);
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 7 * 1024 * 1024 }, // 7MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) return cb(new Error("INVALID_FILE_TYPE"));
    cb(null, true);
  },
});

function safeUnlink(p: string) {
  try { fs.unlinkSync(p); } catch {}
}

function fmtTime(iso: Date) {
  return iso.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function timeAgo(d: Date) {
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}hr ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

async function ensureDriverProfile(userId: string) {
  let dp = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!dp) dp = await prisma.driverProfile.create({ data: { userId } });
  return dp;
}

async function ensureDriverPreferences(driverProfileId: string) {
  return prisma.driverPreferences.upsert({
    where: { driverId: driverProfileId },
    create: {
      driverId: driverProfileId,
      language: "English",
      rideUpdates: true,
      paymentAlerts: true,
      shiftReminders: true,
      serviceAlerts: true,
    },
    update: {},
  });
}

function docTitle(type: string) {
  switch (type) {
    case "DRIVER_LICENSE": return "Driver license";
    case "VEHICLE_INSURANCE": return "Vehicle insurance";
    case "GOVERNMENT_ID": return "Government ID";
    case "SELFIE": return "Selfie";
    case "VEHICLE_IMAGE": return "Vehicle image";
    default: return type;
  }
}

function mapDocStatus(s: string): "verified" | "pending" {
  return s === "VERIFIED" ? "verified" : "pending";
}

async function ensureSeedSupportConversations(driverId: string) {
  const count = await prisma.supportConversation.count({ where: { driverId } });
  if (count > 0) return;

  await prisma.supportConversation.createMany({
    data: [
      {
        driverId,
        name: "Alexia (AI)",
        channel: "CHAT",
        unread: true,
        lastMessageAt: new Date(),
        tagLine: "Please complete incident reports...",
      },
      {
        driverId,
        name: "Gift (Customer care)",
        channel: "CHAT",
        unread: false,
        lastMessageAt: new Date(),
        tagLine: "Please complete incident reports...",
      },
    ],
  });
}

driverProfileRouter.get("/", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "NOT_FOUND" });

  const dp = await ensureDriverProfile(userId);
  const pref = await ensureDriverPreferences(dp.id);

  const [tripAgg, ratingAgg] = await Promise.all([
    prisma.trip.aggregate({
      where: { driverId: userId, status: "COMPLETED" },
      _count: { id: true },
      _sum: { fareCents: true },
    }),
    prisma.tripReview.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
    }),
  ]);

  const trips = tripAgg._count.id ?? 0;
  const totalEarned = Math.round(((tripAgg._sum.fareCents ?? 0) / 100) * 100) / 100;
  const rating = Math.round(((ratingAgg._avg.rating ?? 0) as number) * 10) / 10;

  const vehicle = await prisma.vehicle.findUnique({ where: { driverId: dp.id } });

  // ✅ include all doc types so admin verification is visible to driver
  const REQUIRED = ["GOVERNMENT_ID", "SELFIE", "DRIVER_LICENSE", "VEHICLE_INSURANCE", "VEHICLE_IMAGE"] as const;

  const docs = await prisma.driverDocument.findMany({
    where: { driverId: dp.id, type: { in: [...REQUIRED] } },
    orderBy: { updatedAt: "desc" },
  });

  const docMap = new Map(docs.map((d) => [d.type, d]));

  const documents = REQUIRED.map((t) => {
    const d = docMap.get(t);
    return {
      id: d?.id ?? t.toLowerCase(),
      title: docTitle(t),
      status: mapDocStatus(d?.status ?? "PENDING"),
      url: d?.url ?? null,
    };
  });

  const [selfie, vehicleImageDoc] = await Promise.all([
    prisma.driverDocument.findFirst({ where: { driverId: dp.id, type: "SELFIE" }, orderBy: { updatedAt: "desc" } }),
    prisma.driverDocument.findFirst({ where: { driverId: dp.id, type: "VEHICLE_IMAGE" }, orderBy: { updatedAt: "desc" } }),
  ]);

  const vehicleImageUrl = vehicle?.imageUrl ?? vehicleImageDoc?.url ?? null;

  await ensureSeedSupportConversations(userId);
  const convos = await prisma.supportConversation.findMany({
    where: { driverId: userId, channel: "CHAT" },
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
  });

  const supportConversations = convos.map((c) => ({
    id: c.id,
    name: c.name,
    tagLine: c.tagLine ?? (c.messages.at(-1)?.text ?? ""),
    lastTime: c.lastMessageAt ? timeAgo(c.lastMessageAt) : "—",
    unread: c.unread,
    messages: c.messages.map((m) => ({
      id: m.id,
      author: m.author === "AGENT" ? "agent" : "driver",
      text: m.text,
      time: fmtTime(m.createdAt),
    })),
  }));

  const vehicleDetails = [
    { id: "make", label: "Vehicle make", value: vehicle?.make ?? "—" },
    { id: "color", label: "Car color", value: vehicle?.color ?? "—" },
    { id: "seats", label: "Number of seats", value: vehicle?.seats != null ? String(vehicle.seats) : "—" },
    { id: "model", label: "Model", value: vehicle?.model ?? "—" },
    { id: "year", label: "Year of production", value: vehicle?.year != null ? String(vehicle.year) : "—" },
    { id: "plate", label: "License plate", value: vehicle?.licensePlate ?? "—" },
  ];

  return res.json({
    ok: true,
    driver: {
      name: user.fullName,
      email: user.email,
      location: dp.locationText ?? "—",
      phone: dp.phone ?? "—",
      rating: rating || 0,
      trips,
      totalEarned,
      avatarUrl: dp.avatarUrl ?? selfie?.url ?? null,
    },
    documents,
    workLocation: {
      siteName: dp.workSiteName ?? "—",
      address: dp.workAddress ?? "—",
    },
    vehicle: {
      imageUrl: vehicleImageUrl,
      details: vehicleDetails,
    },
    security: {
      faceRecognition: dp.faceRecognitionEnabled,
      twoFactorAuth: dp.twoFactorEnabled,
    },
    preference: {
      language: pref.language,
      notifications: {
        rideUpdates: pref.rideUpdates,
        paymentAlerts: pref.paymentAlerts,
        shiftReminders: pref.shiftReminders,
        serviceAlerts: pref.serviceAlerts,
      },
    },
    supportConversations,
  });
});

/* ... keep the rest of your file SAME (security, preferences, uploads, support, logout) ... */

/* -------------------------------------------------------------------------- */
/*  SECURITY TOGGLES                                                          */
/* -------------------------------------------------------------------------- */
driverProfileRouter.patch("/security", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;
  const dp = await ensureDriverProfile(userId);

  const faceRecognition = typeof req.body?.faceRecognition === "boolean" ? req.body.faceRecognition : undefined;
  const twoFactorAuth = typeof req.body?.twoFactorAuth === "boolean" ? req.body.twoFactorAuth : undefined;

  const updated = await prisma.driverProfile.update({
    where: { id: dp.id },
    data: {
      ...(faceRecognition !== undefined ? { faceRecognitionEnabled: faceRecognition } : {}),
      ...(twoFactorAuth !== undefined ? { twoFactorEnabled: twoFactorAuth } : {}),
    },
  });

  res.json({
    ok: true,
    security: {
      faceRecognition: updated.faceRecognitionEnabled,
      twoFactorAuth: updated.twoFactorEnabled,
    },
  });
});

/* -------------------------------------------------------------------------- */
/*  PREFERENCES (language + notification toggles)                             */
/* -------------------------------------------------------------------------- */
driverProfileRouter.patch("/preferences", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;
  const dp = await ensureDriverProfile(userId);

  const language = typeof req.body?.language === "string" ? req.body.language : undefined;

  const up = {
    rideUpdates: req.body?.rideUpdates,
    paymentAlerts: req.body?.paymentAlerts,
    shiftReminders: req.body?.shiftReminders,
    serviceAlerts: req.body?.serviceAlerts,
  };

  const updated = await prisma.driverPreferences.upsert({
    where: { driverId: dp.id },
    create: {
      driverId: dp.id,
      language: language ?? "English",
      rideUpdates: typeof up.rideUpdates === "boolean" ? up.rideUpdates : true,
      paymentAlerts: typeof up.paymentAlerts === "boolean" ? up.paymentAlerts : true,
      shiftReminders: typeof up.shiftReminders === "boolean" ? up.shiftReminders : true,
      serviceAlerts: typeof up.serviceAlerts === "boolean" ? up.serviceAlerts : true,
    },
    update: {
      ...(language !== undefined ? { language } : {}),
      ...(typeof up.rideUpdates === "boolean" ? { rideUpdates: up.rideUpdates } : {}),
      ...(typeof up.paymentAlerts === "boolean" ? { paymentAlerts: up.paymentAlerts } : {}),
      ...(typeof up.shiftReminders === "boolean" ? { shiftReminders: up.shiftReminders } : {}),
      ...(typeof up.serviceAlerts === "boolean" ? { serviceAlerts: up.serviceAlerts } : {}),
    },
  });

  res.json({
    ok: true,
    preference: {
      language: updated.language,
      notifications: {
        rideUpdates: updated.rideUpdates,
        paymentAlerts: updated.paymentAlerts,
        shiftReminders: updated.shiftReminders,
        serviceAlerts: updated.serviceAlerts,
      },
    },
  });
});

/* -------------------------------------------------------------------------- */
/*  WORK LOCATION REQUEST (also updates current fields for now)               */
/* -------------------------------------------------------------------------- */
driverProfileRouter.post("/work-location/request", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;
  const dp = await ensureDriverProfile(userId);

  const siteName = String(req.body?.siteName ?? "").trim();
  const address = String(req.body?.address ?? "").trim();
  if (!siteName || !address) return res.status(400).json({ error: "BAD_INPUT" });

  await prisma.workLocationChangeRequest.create({
    data: {
      driverId: dp.id,
      requestedSiteName: siteName,
      requestedAddress: address,
      status: "PENDING",
    },
  });

  // For your testing UX: reflect immediately in profile
  const updated = await prisma.driverProfile.update({
    where: { id: dp.id },
    data: { workSiteName: siteName, workAddress: address },
  });

  res.json({
    ok: true,
    workLocation: { siteName: updated.workSiteName ?? "—", address: updated.workAddress ?? "—" },
  });
});

/* -------------------------------------------------------------------------- */
/*  VEHICLE (upsert)                                                          */
/* -------------------------------------------------------------------------- */
driverProfileRouter.put("/vehicle", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;
  const dp = await ensureDriverProfile(userId);

  const make = typeof req.body?.make === "string" ? req.body.make : undefined;
  const model = typeof req.body?.model === "string" ? req.body.model : undefined;
  const color = typeof req.body?.color === "string" ? req.body.color : undefined;
  const licensePlate = typeof req.body?.licensePlate === "string" ? req.body.licensePlate : undefined;

  const year = req.body?.year != null ? Number(req.body.year) : undefined;
  const seats = req.body?.seats != null ? Number(req.body.seats) : undefined;

  const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl : undefined;

  const vehicle = await prisma.vehicle.upsert({
    where: { driverId: dp.id },
    create: {
      driverId: dp.id,
      make: make ?? null,
      model: model ?? null,
      color: color ?? null,
      licensePlate: licensePlate ?? null,
      year: Number.isFinite(year as number) ? (year as number) : null,
      seats: Number.isFinite(seats as number) ? (seats as number) : null,
      imageUrl: imageUrl ?? null,
    },
    update: {
      ...(make !== undefined ? { make } : {}),
      ...(model !== undefined ? { model } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(licensePlate !== undefined ? { licensePlate } : {}),
      ...(Number.isFinite(year as number) ? { year: year as number } : {}),
      ...(Number.isFinite(seats as number) ? { seats: seats as number } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
  });

  res.json({ ok: true, vehicle });
});

/* -------------------------------------------------------------------------- */
/*  VEHICLE IMAGE UPLOAD (file -> /uploads)                                   */
/* -------------------------------------------------------------------------- */
driverProfileRouter.post(
  "/vehicle/image",
  requireAuth,
  requireDriver,
  upload.single("file"),
  async (req, res) => {
    const userId = req.auth!.userId;
    const dp = await ensureDriverProfile(userId);

    if (!req.file) return res.status(400).json({ error: "FILE_REQUIRED" });

    const inputPath = path.join(uploadDir, req.file.filename);

    // Normalize + compress to jpg
    const outName = `${Date.now()}_${randomUUID()}.jpg`;
    const outPath = path.join(uploadDir, outName);

    try {
      await sharp(inputPath)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toFile(outPath);
    } catch (e) {
      safeUnlink(inputPath);
      safeUnlink(outPath);
      return res.status(500).json({ error: "IMAGE_PROCESS_FAILED" });
    } finally {
      safeUnlink(inputPath);
    }

    const url = `/uploads/${outName}`;

    const vehicle = await prisma.vehicle.upsert({
      where: { driverId: dp.id },
      create: { driverId: dp.id, imageUrl: url },
      update: { imageUrl: url },
    });

    // Optional: also store it as VEHICLE_IMAGE doc (so onboarding/profile remain consistent)
    await prisma.driverDocument.upsert({
      where: { driverId_type: { driverId: dp.id, type: "VEHICLE_IMAGE" } },
      create: { driverId: dp.id, type: "VEHICLE_IMAGE", url, status: "PENDING" },
      update: { url, status: "PENDING" },
    });

    return res.json({ ok: true, imageUrl: url, vehicle });
  }
);

/* -------------------------------------------------------------------------- */
/*  DOCUMENT UPDATE (simple URL-based for now)                                */
/* -------------------------------------------------------------------------- */
driverProfileRouter.put("/documents/:type", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;
  const dp = await ensureDriverProfile(userId);

  const type = String(req.params.type ?? "").trim().toUpperCase();
  const url = String(req.body?.url ?? "").trim();
  if (!url) return res.status(400).json({ error: "BAD_URL" });

  const doc = await prisma.driverDocument.upsert({
    where: { driverId_type: { driverId: dp.id, type } },
    create: { driverId: dp.id, type, url, status: "PENDING" },
    update: { url, status: "PENDING" },
  });

  res.json({ ok: true, document: doc });
});

/* -------------------------------------------------------------------------- */
/*  CHANGE PASSWORD                                                          */
/* -------------------------------------------------------------------------- */
driverProfileRouter.post("/change-password", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;

  const oldPassword = String(req.body?.oldPassword ?? "");
  const newPassword = String(req.body?.newPassword ?? "");
  if (oldPassword.length < 1 || newPassword.length < 6) {
    return res.status(400).json({ error: "BAD_PASSWORD" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "NOT_FOUND" });

  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "OLD_PASSWORD_WRONG" });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

  res.json({ ok: true });
});

/* -------------------------------------------------------------------------- */
/*  SUPPORT                                                                   */
/* -------------------------------------------------------------------------- */
driverProfileRouter.get("/support/conversations", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;

  await ensureSeedSupportConversations(userId);

  const convos = await prisma.supportConversation.findMany({
    where: { driverId: userId, channel: "CHAT" },
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
  });

  const out = convos.map((c) => ({
    id: c.id,
    name: c.name,
    tagLine: c.tagLine ?? (c.messages.at(-1)?.text ?? ""),
    lastTime: c.lastMessageAt ? timeAgo(c.lastMessageAt) : "—",
    unread: c.unread,
    messages: c.messages.map((m) => ({
      id: m.id,
      author: m.author === "AGENT" ? "agent" : "driver",
      text: m.text,
      time: fmtTime(m.createdAt),
    })),
  }));

  res.json({ ok: true, conversations: out });
});
driverProfileRouter.post(
  "/avatar/image",
  requireAuth,
  requireDriver,
  upload.single("file"),
  async (req, res) => {
    const userId = req.auth!.userId;
    const dp = await ensureDriverProfile(userId);

    if (!req.file) return res.status(400).json({ error: "FILE_REQUIRED" });

    const inputPath = path.join(uploadDir, req.file.filename);

    // Normalize + compress to jpg
    const outName = `${Date.now()}_${randomUUID()}_avatar.jpg`;
    const outPath = path.join(uploadDir, outName);

    try {
      await sharp(inputPath)
        .rotate()
        .resize({ width: 900, withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toFile(outPath);
    } catch {
      safeUnlink(inputPath);
      safeUnlink(outPath);
      return res.status(500).json({ error: "IMAGE_PROCESS_FAILED" });
    } finally {
      safeUnlink(inputPath);
    }

    const url = `/uploads/${outName}`;

    // optional: delete old avatar file if it was local
    if (dp.avatarUrl?.startsWith("/uploads/")) {
      const oldName = path.basename(dp.avatarUrl);
      safeUnlink(path.join(uploadDir, oldName));
    }

    await prisma.driverProfile.update({
      where: { id: dp.id },
      data: { avatarUrl: url },
    });

    // also keep SELFIE doc in sync (your GET uses selfie as fallback)
    await prisma.driverDocument.upsert({
      where: { driverId_type: { driverId: dp.id, type: "SELFIE" } },
      create: { driverId: dp.id, type: "SELFIE", url, status: "PENDING" },
      update: { url, status: "PENDING" },
    });

    return res.json({ ok: true, avatarUrl: url });
  }
);

driverProfileRouter.post("/support/conversations/:id/messages", requireAuth, requireDriver, async (req, res) => {
  const userId = req.auth!.userId;
  const convId = String(req.params.id ?? "");

  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "EMPTY_MESSAGE" });

  const conv = await prisma.supportConversation.findFirst({
    where: { id: convId, driverId: userId, channel: "CHAT" },
  });
  if (!conv) return res.status(404).json({ error: "NOT_FOUND" });

  const msg = await prisma.supportMessage.create({
    data: { conversationId: convId, author: "DRIVER", text },
  });

  await prisma.supportConversation.update({
    where: { id: convId },
    data: {
      lastMessageAt: new Date(),
      tagLine: text.slice(0, 80),
      unread: false,
    },
  });

  res.json({
    ok: true,
    message: { id: msg.id, author: "driver", text: msg.text, time: fmtTime(msg.createdAt) },
  });
});
/* -------------------------------------------------------------------------- */
/*  LOGOUT                                                                    */
/* -------------------------------------------------------------------------- */
driverProfileRouter.post("/logout", requireAuth, async (_req, res) => {
  // Clear common cookie names (adjust to your real cookie name if needed)
  const names = ["accessToken", "token", "authToken", "jwt", "refreshToken"];
  for (const n of names) res.clearCookie(n, { path: "/" });

  return res.json({ ok: true });
});