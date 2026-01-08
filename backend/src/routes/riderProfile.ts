import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Role, VerificationStatus, WorkChangeStatus } from "@prisma/client";
import { verifyPassword, hashPassword } from "../lib/password.js";

const router = Router();

function paymentLabel(t: string) {
  switch (t) {
    case "APPLE_PAY":
      return "Apple pay";
    case "PAYPAL":
      return "Paypal";
    case "GPAY":
      return "G pay";
    case "CASHAPP":
      return "Cashapp";
    case "CREDIT_CARD":
      return "Credit card";
    default:
      return "Payment method";
  }
}

async function ensureRiderProfile(userId: string) {
  const existing = await prisma.riderProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.riderProfile.create({
    data: {
      userId,
      onboardingStep: 1,
    },
  });
}

async function ensureRiderPreferences(userId: string) {
  const existing = await prisma.riderPreferences.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.riderPreferences.create({
    data: {
      userId,
      language: "English",
      rideUpdates: true,
      paymentAlerts: true,
      shiftReminders: true,
      serviceAlerts: true,
    },
  });
}

/**
 * GET /api/rider/profile
 * Single endpoint your UI can use to load everything.
 */
router.get("/", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;

  await ensureRiderProfile(userId);
  await ensureRiderPreferences(userId);

  const [user, riderProfile, prefs, identityDocs, paymentMethods] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true },
    }),
    prisma.riderProfile.findUnique({
      where: { userId },
      select: {
        phone: true,
        locationText: true,
        homeAddress: true,
        workAddress: true,
        avatarUrl: true,
        faceRecognitionEnabled: true,
        twoFactorEnabled: true,
      },
    }),
    prisma.riderPreferences.findUnique({
      where: { userId },
      select: {
        language: true,
        rideUpdates: true,
        paymentAlerts: true,
        shiftReminders: true,
        serviceAlerts: true,
      },
    }),
    prisma.riderIdentityDoc.findMany({
      where: { userId },
      select: { type: true, url: true, status: true, updatedAt: true, createdAt: true },
    }),
    prisma.riderPaymentOption.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      select: { id: true, type: true, label: true, secondary: true, isDefault: true },
    }),
  ]);

  if (!user || !riderProfile || !prefs) {
    return res.status(404).json({ ok: false, error: "PROFILE_NOT_FOUND" });
  }

  const gov = identityDocs.find((d) => d.type === "GOVERNMENT_ID");
  const selfie = identityDocs.find((d) => d.type === "SELFIE");

  const profile = {
    id: user.id,
    role: user.role,
    name: user.fullName,
    email: user.email,
    phone: riderProfile.phone ?? "",
    location: riderProfile.locationText ?? "",
    homeAddress: riderProfile.homeAddress ?? "",
    workAddress: riderProfile.workAddress ?? "",
    avatarUrl: riderProfile.avatarUrl ?? "",
  };

  const identity = {
    governmentId: gov
      ? { status: gov.status, url: gov.url }
      : { status: VerificationStatus.PENDING, url: "" },
    selfie: selfie
      ? { status: selfie.status, url: selfie.url }
      : { status: VerificationStatus.PENDING, url: "" },
  };

  const security = {
    faceRecognitionEnabled: riderProfile.faceRecognitionEnabled,
    twoFactorEnabled: riderProfile.twoFactorEnabled,
  };

  const settings = prefs;

  return res.json({
    ok: true,
    profile,
    identity,
    paymentMethods,
    security,
    settings,
  });
});

/**
 * PATCH /api/rider/profile/personal
 */
const PersonalSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().min(6).max(30).optional(),
  locationText: z.string().min(2).max(120).optional(),
  avatarUrl: z.string().min(1).max(500).optional(),
});

router.patch("/personal", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const parsed = PersonalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });

  const { fullName, email, phone, locationText, avatarUrl } = parsed.data;

  // Email uniqueness check if changing email
  if (email) {
    const exists = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
      select: { id: true },
    });
    if (exists) return res.status(409).json({ ok: false, error: "EMAIL_ALREADY_USED" });
  }

  await prisma.$transaction(async (tx) => {
    if (fullName || email) {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(fullName ? { fullName } : {}),
          ...(email ? { email } : {}),
        },
      });
    }

    await ensureRiderProfile(userId);
    await tx.riderProfile.update({
      where: { userId },
      data: {
        ...(phone !== undefined ? { phone } : {}),
        ...(locationText !== undefined ? { locationText } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
    });
  });

  return res.json({ ok: true });
});

/**
 * PATCH /api/rider/profile/security
 */
const SecuritySchema = z.object({
  faceRecognitionEnabled: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
});

router.patch("/security", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const parsed = SecuritySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });

  await ensureRiderProfile(userId);

  const updated = await prisma.riderProfile.update({
    where: { userId },
    data: {
      ...(parsed.data.faceRecognitionEnabled !== undefined
        ? { faceRecognitionEnabled: parsed.data.faceRecognitionEnabled }
        : {}),
      ...(parsed.data.twoFactorEnabled !== undefined
        ? { twoFactorEnabled: parsed.data.twoFactorEnabled }
        : {}),
    },
    select: { faceRecognitionEnabled: true, twoFactorEnabled: true },
  });

  return res.json({ ok: true, security: updated });
});

/**
 * PATCH /api/rider/profile/settings
 */
const SettingsSchema = z.object({
  language: z.enum(["English", "Spanish"]).optional(),
  rideUpdates: z.boolean().optional(),
  paymentAlerts: z.boolean().optional(),
  shiftReminders: z.boolean().optional(),
  serviceAlerts: z.boolean().optional(),
});

router.patch("/settings", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const parsed = SettingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });

  await ensureRiderPreferences(userId);

  const updated = await prisma.riderPreferences.update({
    where: { userId },
    data: parsed.data,
    select: {
      language: true,
      rideUpdates: true,
      paymentAlerts: true,
      shiftReminders: true,
      serviceAlerts: true,
    },
  });

  return res.json({ ok: true, settings: updated });
});

/**
 * POST /api/rider/profile/locations/request
 */
const LocationRequestSchema = z.object({
  target: z.enum(["HOME", "WORK"]),
  requestedAddress: z.string().min(5).max(200),
});

router.post("/locations/request", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const parsed = LocationRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });

  const record = await prisma.riderLocationChangeRequest.create({
    data: {
      userId,
      target: parsed.data.target as any,
      requestedAddress: parsed.data.requestedAddress,
      status: WorkChangeStatus.PENDING,
    },
    select: { id: true, target: true, status: true, requestedAddress: true, createdAt: true },
  });

  return res.json({ ok: true, request: record });
});

/**
 * GET /api/rider/profile/payment-methods
 */
router.get("/payment-methods", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;

  const methods = await prisma.riderPaymentOption.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    select: { id: true, type: true, label: true, secondary: true, isDefault: true },
  });

  return res.json({ ok: true, methods });
});

/**
 * POST /api/rider/profile/payment-methods
 * Add a payment method (and optionally set default).
 */
const AddPaymentSchema = z.object({
  type: z.enum(["APPLE_PAY", "PAYPAL", "GPAY", "CASHAPP", "CREDIT_CARD"]),
  secondary: z.string().max(120).optional(),
  isDefault: z.boolean().optional(),
});

router.post("/payment-methods", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const parsed = AddPaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });

  const { type, secondary, isDefault } = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.riderPaymentOption.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.riderPaymentOption.create({
      data: {
        userId,
        type: type as any,
        label: paymentLabel(type),
        secondary: secondary ?? null,
        isDefault: !!isDefault,
      },
      select: { id: true, type: true, label: true, secondary: true, isDefault: true },
    });
  });

  return res.json({ ok: true, method: created });
});

/**
 * PATCH /api/rider/profile/payment-methods/:id/default
 */
router.patch("/payment-methods/:id/default", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const exists = await prisma.riderPaymentOption.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!exists) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

  await prisma.$transaction(async (tx) => {
    await tx.riderPaymentOption.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    await tx.riderPaymentOption.update({
      where: { id },
      data: { isDefault: true },
    });
  });

  return res.json({ ok: true });
});

/**
 * POST /api/rider/profile/change-password
 */
const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

router.post("/change-password", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });

  const ok = verifyPassword(parsed.data.oldPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: "INVALID_OLD_PASSWORD" });

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(parsed.data.newPassword) },
  });

  // Optional: revoke refresh tokens if you want forcing login after password change
  // await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

  return res.json({ ok: true });
});

/**
 * PATCH /api/rider/profile/identity/:type
 * For now (simple): accept a URL from the frontend and store it.
 * Later, you can convert this to file upload.
 */
const IdentitySchema = z.object({
  url: z.string().min(5).max(500),
});

router.patch("/identity/:type", requireAuth([Role.RIDER]), async (req, res) => {
  const userId = req.user!.id;
  const type = req.params.type; // "government-id" | "selfie"

  const parsed = IdentitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "VALIDATION_ERROR" });

  const mappedType = type === "government-id" ? "GOVERNMENT_ID" : type === "selfie" ? "SELFIE" : null;
  if (!mappedType) return res.status(404).json({ ok: false, error: "BAD_TYPE" });

  const doc = await prisma.riderIdentityDoc.upsert({
    where: { userId_type: { userId, type: mappedType as any } },
    update: { url: parsed.data.url, status: VerificationStatus.PENDING },
    create: { userId, type: mappedType as any, url: parsed.data.url, status: VerificationStatus.PENDING },
    select: { type: true, status: true, url: true },
  });

  return res.json({ ok: true, doc });
});

export default router;
