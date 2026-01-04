import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth, requireRider } from "../middleware/auth.js";
import { generateOtpCode, hashOtp } from "../lib/otp.js";
import { config } from "../config.js";
import { sendMail } from "../lib/mailer.js";

const router = Router();

function riderNextPath(step: number, completedAt: Date | null) {
  if (completedAt) return "/rider/dashboard";
  switch (step) {
    case 1:
      return "/rider/onboarding/basic-details";
    case 2:
      return "/rider/onboarding/otp-verification";
    case 3:
      return "/rider/onboarding/full-name";
    case 4:
      return "/rider/onboarding/location";
    case 5:
      return "/rider/onboarding/payment-method";
    case 6:
      return "/rider/onboarding/agreement";
    default:
      return "/rider/onboarding/basic-details";
  }
}

router.use(requireAuth, requireRider);

// status (optional but useful)
router.get("/status", async (req, res) => {
  const userId = req.auth!.userId;

  const profile = await prisma.riderProfile.findUnique({
    where: { userId },
    select: {
      onboardingStep: true,
      onboardingCompletedAt: true,
      phone: true,
      locationText: true,
      paymentMethod: true,
      otpVerifiedAt: true,
    },
  });

  if (!profile) {
    // create if missing (backward compatible)
    const created = await prisma.riderProfile.create({
      data: { userId, onboardingStep: 1 },
      select: {
        onboardingStep: true,
        onboardingCompletedAt: true,
        phone: true,
        locationText: true,
        paymentMethod: true,
        otpVerifiedAt: true,
      },
    });

    return res.json({
      ok: true,
      step: created.onboardingStep,
      completedAt: created.onboardingCompletedAt,
      phone: created.phone,
      locationText: created.locationText,
      paymentMethod: created.paymentMethod,
      otpVerifiedAt: created.otpVerifiedAt,
    });
  }

  return res.json({
    ok: true,
    step: profile.onboardingStep,
    completedAt: profile.onboardingCompletedAt,
    phone: profile.phone,
    locationText: profile.locationText,
    paymentMethod: profile.paymentMethod,
    otpVerifiedAt: profile.otpVerifiedAt,
  });
});

const BasicDetailsSchema = z.object({
  phone: z.string().min(7).max(32),
});

router.post("/basic-details", async (req, res) => {
  const userId = req.auth!.userId;

  const input = BasicDetailsSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });

  if (!user) return res.status(401).json({ error: "UNAUTHORIZED" });

  // ensure profile exists
  const profile = await prisma.riderProfile.upsert({
    where: { userId },
    create: { userId, onboardingStep: 1, phone: input.data.phone },
    update: { phone: input.data.phone },
    select: { onboardingStep: true, onboardingCompletedAt: true },
  });

  // create OTP
  const otp = generateOtpCode(6);
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + config.otp.ttlMin * 60 * 1000);

  const record = await prisma.riderOnboardingOtp.create({
    data: { userId, otpHash, expiresAt },
    select: { id: true },
  });

  await sendMail(
    user.email,
    "Your verification code",
    `Your OTP code is: ${otp}\n\nIt expires in ${config.otp.ttlMin} minutes.`
  );

  // move to step 2 (otp)
  const nextStep = 2;
  await prisma.riderProfile.update({
    where: { userId },
    data: { onboardingStep: nextStep },
  });

  const devOtp = config.nodeEnv === "development" ? otp : undefined;

  return res.json({
    ok: true,
    otpId: record.id,
    devOtp,
    nextPath: riderNextPath(nextStep, profile.onboardingCompletedAt),
  });
});

const VerifyOtpSchema = z.object({
  otpId: z.string().min(10),
  otp: z.string().regex(/^\d{6}$/),
});

router.post("/verify-otp", async (req, res) => {
  const userId = req.auth!.userId;

  const input = VerifyOtpSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const otpHash = hashOtp(input.data.otp);

  const rec = await prisma.riderOnboardingOtp.findFirst({
    where: {
      id: input.data.otpId,
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
      otpHash,
    },
    select: { id: true },
  });

  if (!rec) return res.status(401).json({ error: "INVALID_OTP" });

  await prisma.riderOnboardingOtp.update({
    where: { id: rec.id },
    data: { usedAt: new Date() },
  });

  const updated = await prisma.riderProfile.update({
    where: { userId },
    data: { otpVerifiedAt: new Date(), onboardingStep: 3 },
    select: { onboardingCompletedAt: true },
  });

  return res.json({ ok: true, nextPath: riderNextPath(3, updated.onboardingCompletedAt) });
});

const FullNameSchema = z.object({
  fullName: z.string().min(2),
});

router.post("/full-name", async (req, res) => {
  const userId = req.auth!.userId;

  const input = FullNameSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { fullName: input.data.fullName },
  });

  const updated = await prisma.riderProfile.update({
    where: { userId },
    data: { onboardingStep: 4 },
    select: { onboardingCompletedAt: true },
  });

  return res.json({ ok: true, nextPath: riderNextPath(4, updated.onboardingCompletedAt) });
});

const LocationSchema = z.object({
  locationText: z.string().min(2).max(120),
});

router.post("/location", async (req, res) => {
  const userId = req.auth!.userId;

  const input = LocationSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const updated = await prisma.riderProfile.update({
    where: { userId },
    data: { locationText: input.data.locationText, onboardingStep: 5 },
    select: { onboardingCompletedAt: true },
  });

  return res.json({ ok: true, nextPath: riderNextPath(5, updated.onboardingCompletedAt) });
});

const PaymentSchema = z.object({
  method: z.enum(["APPLE_PAY", "PAYPAL", "GPAY", "CASHAPP", "CREDIT_CARD"]),
});

router.post("/payment-method", async (req, res) => {
  const userId = req.auth!.userId;

  const input = PaymentSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({ error: "VALIDATION_ERROR", details: input.error.flatten() });
  }

  const updated = await prisma.riderProfile.update({
    where: { userId },
    data: { paymentMethod: input.data.method, onboardingStep: 6 },
    select: { onboardingCompletedAt: true },
  });

  return res.json({ ok: true, nextPath: riderNextPath(6, updated.onboardingCompletedAt) });
});

router.post("/agreement", async (req, res) => {
  const userId = req.auth!.userId;

  const body = z.object({ agreed: z.boolean() }).safeParse(req.body);
  if (!body.success || !body.data.agreed) {
    return res.status(400).json({ error: "VALIDATION_ERROR" });
  }

  const updated = await prisma.riderProfile.update({
    where: { userId },
    data: { onboardingCompletedAt: new Date() },
    select: { onboardingStep: true, onboardingCompletedAt: true },
  });

  return res.json({ ok: true, nextPath: riderNextPath(updated.onboardingStep, updated.onboardingCompletedAt) });
});

export default router;
